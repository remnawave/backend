import axios, { AxiosInstance, isAxiosError } from 'axios';

import { IZoneRef, ZoneRRSetSolver } from '../zone-solver.base';

const REQUEST_TIMEOUT_MS = 60_000;

/** LiveDNS keeps TXT values quoted; its minimum TTL is 300. */
function quote(value: string): string {
    return `"${value}"`;
}

function unquote(value: string): string {
    return value.replace(/^"|"$/g, '');
}

export class GandiSolver extends ZoneRRSetSolver {
    protected readonly label = 'gandi';

    private readonly http: AxiosInstance;

    constructor(payload: Record<string, string>) {
        super();

        this.http = axios.create({
            baseURL: 'https://api.gandi.net/v5/livedns',
            timeout: REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Bearer ${payload.apiToken}` },
        });
    }

    protected async listZones(): Promise<IZoneRef[]> {
        const { data } = await this.http.get('/domains');

        return (data ?? []).map((domain: { fqdn: string }) => ({
            id: domain.fqdn,
            name: domain.fqdn,
        }));
    }

    protected async getTxtValues(zone: IZoneRef, name: string): Promise<string[]> {
        try {
            const { data } = await this.http.get(`/domains/${zone.id}/records/${name}/TXT`);

            return (data.rrset_values ?? []).map(unquote);
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
                return [];
            }

            throw error;
        }
    }

    protected async putTxtValues(zone: IZoneRef, name: string, values: string[]): Promise<void> {
        if (values.length === 0) {
            await this.http.delete(`/domains/${zone.id}/records/${name}/TXT`);
            return;
        }

        await this.http.put(`/domains/${zone.id}/records/${name}/TXT`, {
            rrset_values: values.map(quote),
            rrset_ttl: 300,
        });
    }
}
