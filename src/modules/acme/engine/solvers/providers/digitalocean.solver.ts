import axios, { AxiosInstance } from 'axios';

import { ITxtRecord, IZoneRef, ZoneRecordSolver } from '../zone-solver.base';

const REQUEST_TIMEOUT_MS = 60_000;

interface IDoRecord {
    data: string;
    id: number;
    name: string;
    type: string;
}

export class DigitalOceanSolver extends ZoneRecordSolver {
    protected readonly label = 'digitalocean';

    private readonly http: AxiosInstance;

    constructor(payload: Record<string, string>) {
        super();

        this.http = axios.create({
            baseURL: 'https://api.digitalocean.com/v2',
            timeout: REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Bearer ${payload.apiToken}` },
        });
    }

    protected async listZones(): Promise<IZoneRef[]> {
        const { data } = await this.http.get('/domains', { params: { per_page: 200 } });

        return (data.domains ?? []).map((domain: { name: string }) => ({
            id: domain.name,
            name: domain.name,
        }));
    }

    protected async listTxt(zone: IZoneRef, name: string): Promise<ITxtRecord[]> {
        const { data } = await this.http.get(`/domains/${zone.id}/records`, {
            params: { type: 'TXT', per_page: 200 },
        });

        return (data.domain_records ?? [])
            .filter((record: IDoRecord) => record.type === 'TXT' && record.name === name)
            .map((record: IDoRecord) => ({ id: String(record.id), value: record.data }));
    }

    protected async createTxt(zone: IZoneRef, name: string, value: string): Promise<void> {
        await this.http.post(`/domains/${zone.id}/records`, {
            type: 'TXT',
            name,
            data: value,
            ttl: 60,
        });
    }

    protected async deleteTxt(zone: IZoneRef, record: ITxtRecord): Promise<void> {
        await this.http.delete(`/domains/${zone.id}/records/${record.id}`);
    }
}
