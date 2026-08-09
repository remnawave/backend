import { IDnsSolver, IDnsSolverDescription } from './solver.interface';

/**
 * A credential with no automation behind it.
 *
 * It pairs with dns-persist-01, where one record is published by hand and every
 * issuance afterwards needs no DNS access. It cannot serve dns-01: that
 * challenge needs a fresh record within minutes of each order, and pretending
 * otherwise would only produce certificates that quietly stop renewing.
 */
export class ManualSolver implements IDnsSolver {
    public readonly canPublish = false;

    public async present(): Promise<void> {
        throw new Error(
            'Manual credentials cannot answer dns-01 challenges. Use dns-persist-01, or a credential that can publish records.',
        );
    }

    public async cleanup(): Promise<void> {
        // Nothing was published, so there is nothing to take back.
    }

    public async publishPersist(): Promise<void> {
        throw new Error(
            'Manual credentials cannot publish records. Copy the record from the panel and add it to your DNS zone.',
        );
    }

    public async describe(): Promise<IDnsSolverDescription> {
        return {
            isOk: true,
            message: 'Manual credential: records are published by the operator',
            allow: [],
            zones: [],
        };
    }
}
