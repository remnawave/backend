import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Fixed-destination bridge: browsers never receive the controller credential. */
@Injectable()
export class MeshService {
    constructor(private readonly config: ConfigService) {}

    async request(path: string, body?: object): Promise<unknown> {
        const origin = this.config.get<string>('MESH_CONTROLLER_URL');
        const token = this.config.get<string>('MESH_CONTROLLER_TOKEN');
        if (!origin) {
            throw new HttpException('Mesh controller is disabled', HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (!token || token.length < 32) {
            throw new HttpException(
                'Mesh controller is not configured',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
        const url = new URL(origin);
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password ||
            url.search ||
            url.hash ||
            url.pathname !== '/'
        ) {
            throw new HttpException(
                'Mesh controller is not configured',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
        // No caller-controlled URLs, paths or redirects may forward the shared token.
        if (
            !/^\/(status|api\/(flags|pin|probe|teardown|nodes|nodes\/remove|relay|etcd|jobs\/[a-f0-9]{6,32}))$/.test(
                path,
            )
        ) {
            throw new HttpException('Invalid mesh operation', HttpStatus.BAD_REQUEST);
        }
        if (path === '/api/flags' && body && Object.hasOwn(body, 'auto_balancer')) {
            const status = (await this.request('/status')) as {
                capabilities?: { balancer?: boolean };
            };
            if (!status.capabilities?.balancer) {
                throw new HttpException(
                    'Balancer integration is not configured',
                    HttpStatus.BAD_REQUEST,
                );
            }
        }
        let response: Response;
        let data: unknown;
        try {
            response = await fetch(new URL(path, url), {
                method: body === undefined ? 'GET' : 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Mesh-Token': token },
                body: body === undefined ? undefined : JSON.stringify(body),
                redirect: 'error',
                signal: AbortSignal.timeout(20_000),
            });
            // Read at most 1 MiB, including non-success responses.
            const reader = response.body?.getReader();
            const chunks: Uint8Array[] = [];
            let size = 0;
            if (reader) {
                try {
                    for (;;) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        size += value.byteLength;
                        if (size > 1_048_576) throw new Error('Oversized response');
                        chunks.push(value);
                    }
                } finally {
                    await reader.cancel();
                }
            }
            data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch {
            // Controller errors may include SSH commands or credentials. Never reflect or log them.
            throw new HttpException('Mesh controller is unavailable', HttpStatus.BAD_GATEWAY);
        }
        if (!response.ok) {
            throw new HttpException(
                'Mesh operation failed',
                [400, 404, 409].includes(response.status)
                    ? response.status
                    : HttpStatus.BAD_GATEWAY,
            );
        }
        return data;
    }
}
