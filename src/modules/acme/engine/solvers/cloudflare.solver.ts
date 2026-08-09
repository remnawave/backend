import axios, { AxiosInstance, isAxiosError } from 'axios';

import { TAcmeCredentialPayload } from '../../interfaces/credential-payload.interface';
import { IDnsSolver, IDnsSolverDescription } from './solver.interface';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';
// Cloudflare has been observed taking 30+ seconds on a single record write;
// 15s produced spurious ERRORs during the production migration.
const REQUEST_TIMEOUT_MS = 60_000;
const RECORD_TTL_SECONDS = 60;

interface ICloudflareResponse<T> {
    errors: { code: number; message: string }[];
    result: T;
    success: boolean;
}

interface ICloudflareZone {
    id: string;
    name: string;
}

interface ICloudflareRecord {
    content: string;
    id: string;
    name: string;
    type: string;
}

/**
 * Writes challenge records with a Cloudflare token stored in the panel.
 *
 * This is the convenient option, not the safe one: the token can edit every
 * record in its zones, and it lives in a service published to the internet. It
 * exists so a small installation can work without running a DNS broker.
 */
export class CloudflareSolver implements IDnsSolver {
    public readonly canPublish = true;

    private readonly client: AxiosInstance;
    private readonly zoneCache = new Map<string, string>();

    constructor(payload: TAcmeCredentialPayload) {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                Authorization: `Bearer ${payload.apiToken}`,
                'Content-Type': 'application/json',
            },
        });
    }

    public async present(fqdn: string, value: string): Promise<void> {
        const zoneId = await this.resolveZoneId(fqdn);
        const existing = await this.findRecords(zoneId, fqdn, value);

        if (existing.length > 0) {
            return;
        }

        await this.call<ICloudflareRecord>('post', `/zones/${zoneId}/dns_records`, {
            type: 'TXT',
            name: fqdn,
            content: value,
            ttl: RECORD_TTL_SECONDS,
        });
    }

    public async cleanup(fqdn: string, value: string): Promise<void> {
        const zoneId = await this.resolveZoneId(fqdn);
        const records = await this.findRecords(zoneId, fqdn, value);

        for (const record of records) {
            await this.call('delete', `/zones/${zoneId}/dns_records/${record.id}`);
        }
    }

    public async publishPersist(fqdn: string, value: string): Promise<void> {
        const zoneId = await this.resolveZoneId(fqdn);

        // There must be exactly one persistent authorization record per name, so
        // every other TXT at that name goes away.
        const records = await this.findRecords(zoneId, fqdn);

        for (const record of records) {
            if (record.content === value) {
                return;
            }

            await this.call('delete', `/zones/${zoneId}/dns_records/${record.id}`);
        }

        await this.call<ICloudflareRecord>('post', `/zones/${zoneId}/dns_records`, {
            type: 'TXT',
            name: fqdn,
            content: value,
            ttl: RECORD_TTL_SECONDS,
        });
    }

    public async describe(): Promise<IDnsSolverDescription> {
        try {
            const zones = await this.call<ICloudflareZone[]>('get', '/zones?per_page=50');

            return {
                isOk: true,
                message: `Token accepted, ${zones.length} zone(s) visible`,
                allow: [],
                zones: zones.map((zone) => zone.name),
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

    /**
     * Finds the zone owning the name by trying its suffixes from the most
     * specific one, so a delegated sub-zone wins over its parent.
     */
    private async resolveZoneId(fqdn: string): Promise<string> {
        const labels = fqdn.replace(/\.$/, '').split('.');

        for (let i = 0; i <= labels.length - 2; i++) {
            const candidate = labels.slice(i).join('.');

            const cached = this.zoneCache.get(candidate);

            if (cached) {
                return cached;
            }

            const zones = await this.call<ICloudflareZone[]>(
                'get',
                `/zones?name=${encodeURIComponent(candidate)}`,
            );

            if (zones.length > 0) {
                this.zoneCache.set(candidate, zones[0].id);

                return zones[0].id;
            }
        }

        throw new Error(`Cloudflare: no zone found for ${fqdn}`);
    }

    private async findRecords(
        zoneId: string,
        fqdn: string,
        content?: string,
    ): Promise<ICloudflareRecord[]> {
        const query = new URLSearchParams({ type: 'TXT', name: fqdn.replace(/\.$/, '') });

        if (content) {
            query.set('content', content);
        }

        return this.call<ICloudflareRecord[]>('get', `/zones/${zoneId}/dns_records?${query}`);
    }

    private async call<T>(
        method: 'delete' | 'get' | 'post',
        path: string,
        body?: Record<string, number | string>,
    ): Promise<T> {
        try {
            const { data } = await this.client.request<ICloudflareResponse<T>>({
                method,
                url: path,
                data: body,
            });

            if (!data.success) {
                throw new Error(data.errors.map((e) => `${e.code} ${e.message}`).join('; '));
            }

            return data.result;
        } catch (error) {
            throw new Error(this.describeError(error));
        }
    }

    private describeError(error: unknown): string {
        if (isAxiosError(error)) {
            const data = error.response?.data as
                | undefined
                | { errors?: { code: number; message: string }[] };

            if (data?.errors?.length) {
                return `Cloudflare: ${data.errors.map((e) => `${e.code} ${e.message}`).join('; ')}`;
            }

            return `Cloudflare: ${error.message}`;
        }

        if (error instanceof Error) {
            return error.message;
        }

        return `Cloudflare: ${String(error)}`;
    }
}
