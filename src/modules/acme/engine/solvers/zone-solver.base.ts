import { AxiosError } from 'axios';

import { IDnsSolver, IDnsSolverDescription } from './solver.interface';

/**
 * Shared machinery for providers that organize records under a zone: find the
 * zone that owns the FQDN by the longest suffix, then let the concrete solver
 * talk to its API in terms of (zone, relative name).
 *
 * Two families cover every provider here:
 *  - ZoneRecordSolver for per-record APIs (each TXT value is its own object
 *    with an id);
 *  - ZoneRRSetSolver for rrset APIs (all TXT values under one name form a
 *    single set that is replaced atomically).
 */

export interface IZoneRef {
    /** Provider-side identifier used in record calls (often equals name). */
    id: string;
    /** The zone name, no trailing dot. */
    name: string;
}

export interface ITxtRecord {
    id: string;
    value: string;
}

/** The label part of the FQDN inside the zone, e.g. "_acme-challenge.svc". */
export function relativeName(fqdn: string, zone: string): string {
    return fqdn.slice(0, fqdn.length - zone.length - 1);
}

/** Reshape an axios failure into "<provider>: <status> <what the API said>". */
export function describeHttpError(label: string, error: unknown): Error {
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        const body = error.response?.data;
        const detail =
            typeof body === 'string'
                ? body.slice(0, 300)
                : JSON.stringify(body ?? error.message).slice(0, 300);

        return new Error(`${label}: ${status ?? ''} ${detail}`.trim());
    }

    return new Error(`${label}: ${String(error)}`);
}

abstract class ZoneSolverBase implements IDnsSolver {
    public readonly canPublish = true;

    protected abstract readonly label: string;

    public abstract present(fqdn: string, value: string): Promise<void>;
    public abstract cleanup(fqdn: string, value: string): Promise<void>;
    public abstract publishPersist(fqdn: string, value: string): Promise<void>;

    protected abstract listZones(): Promise<IZoneRef[]>;

    public async describe(): Promise<IDnsSolverDescription> {
        try {
            const zones = await this.listZones();

            return {
                allow: [],
                isOk: true,
                message: `${this.label}: credential is valid`,
                zones: zones.map((zone) => zone.name),
            };
        } catch (error) {
            return {
                allow: [],
                isOk: false,
                message: describeHttpError(this.label, error).message,
                zones: [],
            };
        }
    }

    /** The registered zone owning the FQDN, by longest suffix match. */
    protected async findZone(fqdn: string): Promise<IZoneRef> {
        const zones = await this.listZones();
        const needle = fqdn.toLowerCase();

        let best: IZoneRef | null = null;

        for (const zone of zones) {
            const name = zone.name.toLowerCase();

            if (
                (needle === name || needle.endsWith(`.${name}`)) &&
                (!best || name.length > best.name.length)
            ) {
                best = zone;
            }
        }

        if (!best) {
            throw new Error(`${this.label}: no zone matches ${fqdn}`);
        }

        return best;
    }
}

/** Providers where every TXT value is a separate record object with an id. */
export abstract class ZoneRecordSolver extends ZoneSolverBase {
    protected abstract listTxt(zone: IZoneRef, name: string): Promise<ITxtRecord[]>;
    protected abstract createTxt(zone: IZoneRef, name: string, value: string): Promise<void>;
    protected abstract deleteTxt(zone: IZoneRef, record: ITxtRecord): Promise<void>;

    public async present(fqdn: string, value: string): Promise<void> {
        try {
            const zone = await this.findZone(fqdn);
            const name = relativeName(fqdn, zone.name);
            const existing = await this.listTxt(zone, name);

            // Idempotent: re-presenting the same pair must not duplicate it.
            if (existing.some((record) => record.value === value)) {
                return;
            }

            await this.createTxt(zone, name, value);
        } catch (error) {
            throw describeHttpError(this.label, error);
        }
    }

    public async cleanup(fqdn: string, value: string): Promise<void> {
        try {
            const zone = await this.findZone(fqdn);
            const name = relativeName(fqdn, zone.name);
            const records = await this.listTxt(zone, name);

            for (const record of records) {
                if (record.value === value) {
                    await this.deleteTxt(zone, record);
                }
            }
        } catch (error) {
            throw describeHttpError(this.label, error);
        }
    }

    public async publishPersist(fqdn: string, value: string): Promise<void> {
        try {
            const zone = await this.findZone(fqdn);
            const name = relativeName(fqdn, zone.name);

            // The persist record is one-per-name: replace whatever is there.
            for (const record of await this.listTxt(zone, name)) {
                await this.deleteTxt(zone, record);
            }

            await this.createTxt(zone, name, value);
        } catch (error) {
            throw describeHttpError(this.label, error);
        }
    }
}

/** Providers where all TXT values under one name are a single replaceable set. */
export abstract class ZoneRRSetSolver extends ZoneSolverBase {
    protected abstract getTxtValues(zone: IZoneRef, name: string): Promise<string[]>;
    /** An empty list must remove the record set entirely. */
    protected abstract putTxtValues(zone: IZoneRef, name: string, values: string[]): Promise<void>;

    public async present(fqdn: string, value: string): Promise<void> {
        try {
            const zone = await this.findZone(fqdn);
            const name = relativeName(fqdn, zone.name);
            const values = await this.getTxtValues(zone, name);

            if (!values.includes(value)) {
                await this.putTxtValues(zone, name, [...values, value]);
            }
        } catch (error) {
            throw describeHttpError(this.label, error);
        }
    }

    public async cleanup(fqdn: string, value: string): Promise<void> {
        try {
            const zone = await this.findZone(fqdn);
            const name = relativeName(fqdn, zone.name);
            const values = await this.getTxtValues(zone, name);
            const kept = values.filter((existing) => existing !== value);

            if (kept.length !== values.length) {
                await this.putTxtValues(zone, name, kept);
            }
        } catch (error) {
            throw describeHttpError(this.label, error);
        }
    }

    public async publishPersist(fqdn: string, value: string): Promise<void> {
        try {
            const zone = await this.findZone(fqdn);

            await this.putTxtValues(zone, relativeName(fqdn, zone.name), [value]);
        } catch (error) {
            throw describeHttpError(this.label, error);
        }
    }
}
