import axios, { AxiosInstance } from 'axios';

import { ITxtRecord, IZoneRef, ZoneRecordSolver } from '../zone-solver.base';

const REQUEST_TIMEOUT_MS = 60_000;

interface IPorkbunRecord {
    content: string;
    id: string;
    name: string;
    type: string;
}

/**
 * Porkbun authenticates with both keys in every request body, and its minimum
 * TTL is 600.
 */
export class PorkbunSolver extends ZoneRecordSolver {
    protected readonly label = 'porkbun';

    private readonly http: AxiosInstance;
    private readonly auth: { apikey: string; secretapikey: string };

    constructor(payload: Record<string, string>) {
        super();

        this.auth = { apikey: payload.apiKey, secretapikey: payload.secretApiKey };
        this.http = axios.create({
            baseURL: 'https://api.porkbun.com/api/json/v3',
            timeout: REQUEST_TIMEOUT_MS,
        });
    }

    protected async listZones(): Promise<IZoneRef[]> {
        const { data } = await this.http.post('/domain/listAll', this.auth);

        return (data.domains ?? []).map((domain: { domain: string }) => ({
            id: domain.domain,
            name: domain.domain,
        }));
    }

    protected async listTxt(zone: IZoneRef, name: string): Promise<ITxtRecord[]> {
        const { data } = await this.http.post(
            `/dns/retrieveByNameType/${zone.id}/TXT/${name}`,
            this.auth,
        );

        return (data.records ?? []).map((record: IPorkbunRecord) => ({
            id: record.id,
            value: record.content,
        }));
    }

    protected async createTxt(zone: IZoneRef, name: string, value: string): Promise<void> {
        await this.http.post(`/dns/create/${zone.id}`, {
            ...this.auth,
            type: 'TXT',
            name,
            content: value,
            ttl: '600',
        });
    }

    protected async deleteTxt(zone: IZoneRef, record: ITxtRecord): Promise<void> {
        await this.http.post(`/dns/delete/${zone.id}/${record.id}`, this.auth);
    }
}
