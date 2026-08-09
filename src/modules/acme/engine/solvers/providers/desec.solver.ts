import axios, { AxiosInstance, isAxiosError } from 'axios';

import { IZoneRef, ZoneRRSetSolver } from '../zone-solver.base';

const REQUEST_TIMEOUT_MS = 60_000;

/**
 * deSEC serves TXT contents quoted and refuses TTLs below the domain minimum
 * (3600 unless lowered by support).
 */
function quote(value: string): string {
    return `"${value}"`;
}

function unquote(value: string): string {
    return value.replace(/^"|"$/g, '');
}

export class DesecSolver extends ZoneRRSetSolver {
    protected readonly label = 'desec';

    private readonly http: AxiosInstance;

    constructor(payload: Record<string, string>) {
        super();

        this.http = axios.create({
            baseURL: 'https://desec.io/api/v1',
            timeout: REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Token ${payload.apiToken}` },
        });
    }

    protected async listZones(): Promise<IZoneRef[]> {
        const { data } = await this.http.get('/domains/');

        return (data ?? []).map((domain: { name: string }) => ({
            id: domain.name,
            name: domain.name,
        }));
    }

    protected async getTxtValues(zone: IZoneRef, name: string): Promise<string[]> {
        try {
            const { data } = await this.http.get(`/domains/${zone.id}/rrsets/${name}/TXT/`);

            return (data.records ?? []).map(unquote);
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
                return [];
            }

            throw error;
        }
    }

    protected async putTxtValues(zone: IZoneRef, name: string, values: string[]): Promise<void> {
        // An empty records list deletes the rrset - exactly the semantics the
        // base class expects.
        await this.http.put(`/domains/${zone.id}/rrsets/${name}/TXT/`, {
            subname: name,
            type: 'TXT',
            ttl: 3600,
            records: values.map(quote),
        });
    }
}
