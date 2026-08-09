import axios, { AxiosInstance, isAxiosError } from 'axios';

import { IDnsSolver, IDnsSolverDescription } from './solver.interface';

// DNS providers have been observed taking 30+ seconds on a single record
// write; 15s produced spurious ERRORs during a production migration.
const REQUEST_TIMEOUT_MS = 60_000;

interface IPolicyResponse {
    allow: string[];
    provider: { name: string; type: string; zones: string[] };
}

/**
 * A DNS broker speaking the custom-provider HTTP protocol (see docs/acme.md).
 * The broker owns the real DNS credential and decides which names may be
 * touched; this side only knows a base URL and a client token.
 */
export class CustomSolver implements IDnsSolver {
    public readonly canPublish = true;

    private readonly client: AxiosInstance;

    constructor(payload: Record<string, string>) {
        this.client = axios.create({
            baseURL: payload.baseUrl.replace(/\/+$/, ''),
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                Authorization: `Bearer ${payload.token}`,
                'Content-Type': 'application/json',
            },
        });
    }

    public async present(fqdn: string, value: string): Promise<void> {
        await this.request('post', '/v1/dns-01/present', { fqdn, value });
    }

    public async cleanup(fqdn: string, value: string): Promise<void> {
        await this.request('post', '/v1/dns-01/cleanup', { fqdn, value });
    }

    public async publishPersist(fqdn: string, value: string): Promise<void> {
        await this.request('put', '/v1/persist', { fqdn, value });
    }

    public async describe(): Promise<IDnsSolverDescription> {
        try {
            const { data } = await this.client.get<IPolicyResponse>('/v1/policy');

            return {
                isOk: true,
                message: `Endpoint reachable, provider "${data.provider.name}" (${data.provider.type})`,
                allow: data.allow ?? [],
                zones: data.provider?.zones ?? [],
            };
        } catch (error) {
            return {
                isOk: false,
                message: this.describeError(error),
                allow: [],
                zones: [],
            };
        }
    }

    private async request(
        method: 'post' | 'put',
        path: string,
        body: Record<string, string>,
    ): Promise<void> {
        try {
            await this.client.request({ method, url: path, data: body });
        } catch (error) {
            throw new Error(this.describeError(error));
        }
    }

    /**
     * The protocol answers with a machine code and a message; surfacing both
     * makes "the domain is not in the allow list" readable in the certificate
     * log instead of a bare 403.
     */
    private describeError(error: unknown): string {
        if (isAxiosError(error)) {
            const data = error.response?.data as undefined | { error?: string; message?: string };

            if (data?.error) {
                return `dns-api: ${data.error}: ${data.message ?? ''}`.trim();
            }

            return `dns-api: ${error.message}`;
        }

        return `dns-api: ${String(error)}`;
    }
}
