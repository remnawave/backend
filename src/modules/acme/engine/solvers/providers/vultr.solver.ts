import axios, { AxiosInstance } from 'axios';

import { ITxtRecord, IZoneRef, ZoneRecordSolver } from '../zone-solver.base';

const REQUEST_TIMEOUT_MS = 60_000;

interface IVultrRecord {
    data: string;
    id: string;
    name: string;
    type: string;
}

/** Vultr stores TXT data with surrounding quotes; keep them out of our values. */
function quote(value: string): string {
    return `"${value}"`;
}

function unquote(data: string): string {
    return data.replace(/^"|"$/g, '');
}

export class VultrSolver extends ZoneRecordSolver {
    protected readonly label = 'vultr';

    private readonly http: AxiosInstance;

    constructor(payload: Record<string, string>) {
        super();

        this.http = axios.create({
            baseURL: 'https://api.vultr.com/v2',
            timeout: REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Bearer ${payload.apiToken}` },
        });
    }

    protected async listZones(): Promise<IZoneRef[]> {
        const { data } = await this.http.get('/domains', { params: { per_page: 500 } });

        return (data.domains ?? []).map((domain: { domain: string }) => ({
            id: domain.domain,
            name: domain.domain,
        }));
    }

    protected async listTxt(zone: IZoneRef, name: string): Promise<ITxtRecord[]> {
        const { data } = await this.http.get(`/domains/${zone.id}/records`, {
            params: { per_page: 500 },
        });

        return (data.records ?? [])
            .filter((record: IVultrRecord) => record.type === 'TXT' && record.name === name)
            .map((record: IVultrRecord) => ({ id: record.id, value: unquote(record.data) }));
    }

    protected async createTxt(zone: IZoneRef, name: string, value: string): Promise<void> {
        await this.http.post(`/domains/${zone.id}/records`, {
            type: 'TXT',
            name,
            data: quote(value),
            ttl: 120,
        });
    }

    protected async deleteTxt(zone: IZoneRef, record: ITxtRecord): Promise<void> {
        await this.http.delete(`/domains/${zone.id}/records/${record.id}`);
    }
}
