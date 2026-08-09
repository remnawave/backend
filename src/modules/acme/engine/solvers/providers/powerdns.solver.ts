import axios, { AxiosInstance } from 'axios';

import { IZoneRef, ZoneRRSetSolver } from '../zone-solver.base';

const REQUEST_TIMEOUT_MS = 60_000;

/** The PowerDNS API speaks canonical names (trailing dot) and quoted TXT. */
function quote(value: string): string {
    return `"${value}"`;
}

function unquote(value: string): string {
    return value.replace(/^"|"$/g, '');
}

interface IPdnsRRSet {
    name: string;
    records: { content: string }[];
    type: string;
}

export class PowerDnsSolver extends ZoneRRSetSolver {
    protected readonly label = 'powerdns';

    private readonly http: AxiosInstance;
    private readonly serverId: string;

    constructor(payload: Record<string, string>) {
        super();

        this.serverId = payload.serverId || 'localhost';
        this.http = axios.create({
            baseURL: `${payload.baseUrl.replace(/\/+$/, '')}/api/v1`,
            timeout: REQUEST_TIMEOUT_MS,
            headers: { 'X-API-Key': payload.apiKey },
        });
    }

    protected async listZones(): Promise<IZoneRef[]> {
        const { data } = await this.http.get(`/servers/${this.serverId}/zones`);

        return (data ?? []).map((zone: { id: string; name: string }) => ({
            id: zone.id,
            name: zone.name.replace(/\.$/, ''),
        }));
    }

    protected async getTxtValues(zone: IZoneRef, name: string): Promise<string[]> {
        const { data } = await this.http.get(`/servers/${this.serverId}/zones/${zone.id}`);
        const canonical = `${name}.${zone.name}.`;

        const rrset = (data.rrsets ?? []).find(
            (set: IPdnsRRSet) => set.type === 'TXT' && set.name === canonical,
        );

        return (rrset?.records ?? []).map((record: { content: string }) => unquote(record.content));
    }

    protected async putTxtValues(zone: IZoneRef, name: string, values: string[]): Promise<void> {
        const canonical = `${name}.${zone.name}.`;

        await this.http.patch(`/servers/${this.serverId}/zones/${zone.id}`, {
            rrsets: [
                values.length === 0
                    ? { name: canonical, type: 'TXT', changetype: 'DELETE' }
                    : {
                          name: canonical,
                          type: 'TXT',
                          ttl: 60,
                          changetype: 'REPLACE',
                          records: values.map((value) => ({
                              content: quote(value),
                              disabled: false,
                          })),
                      },
            ],
        });
    }
}
