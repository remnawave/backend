import axios, { AxiosInstance } from 'axios';

import { ITxtRecord, IZoneRef, ZoneRecordSolver } from '../zone-solver.base';

const REQUEST_TIMEOUT_MS = 60_000;

interface IHetznerRecord {
    id: string;
    name: string;
    type: string;
    value: string;
}

export class HetznerSolver extends ZoneRecordSolver {
    protected readonly label = 'hetzner';

    private readonly http: AxiosInstance;

    constructor(payload: Record<string, string>) {
        super();

        this.http = axios.create({
            baseURL: 'https://dns.hetzner.com/api/v1',
            timeout: REQUEST_TIMEOUT_MS,
            headers: { 'Auth-API-Token': payload.apiToken },
        });
    }

    protected async listZones(): Promise<IZoneRef[]> {
        const { data } = await this.http.get('/zones', { params: { per_page: 100 } });

        return (data.zones ?? []).map((zone: { id: string; name: string }) => ({
            id: zone.id,
            name: zone.name,
        }));
    }

    protected async listTxt(zone: IZoneRef, name: string): Promise<ITxtRecord[]> {
        const { data } = await this.http.get('/records', { params: { zone_id: zone.id } });

        return (data.records ?? [])
            .filter((record: IHetznerRecord) => record.type === 'TXT' && record.name === name)
            .map((record: IHetznerRecord) => ({ id: record.id, value: record.value }));
    }

    protected async createTxt(zone: IZoneRef, name: string, value: string): Promise<void> {
        await this.http.post('/records', {
            zone_id: zone.id,
            type: 'TXT',
            name,
            value,
            ttl: 60,
        });
    }

    protected async deleteTxt(_zone: IZoneRef, record: ITxtRecord): Promise<void> {
        await this.http.delete(`/records/${record.id}`);
    }
}
