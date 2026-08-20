import isEqual from 'lodash/isEqual';

export interface IInboundSource {
    network: string | null;
    port: number | null;
    rawInbound: unknown;
    security: string | null;
    tag: string;
    type: string;
}

export interface IInboundRecord extends IInboundSource {
    uuid: string;
}

export interface IInboundsDiff<TExisting, TIncoming> {
    toAdd: TIncoming[];
    toRemove: TExisting[];
    toUpdate: TExisting[];
}

const hasChanges = (existing: IInboundSource, incoming: IInboundSource): boolean =>
    existing.network !== incoming.network ||
    existing.security !== incoming.security ||
    existing.port !== incoming.port ||
    !isEqual(existing.rawInbound, incoming.rawInbound);

export function diffInbounds<TExisting extends IInboundRecord, TIncoming extends IInboundSource>(
    existingInbounds: TExisting[],
    incomingInbounds: TIncoming[],
): IInboundsDiff<TExisting, TIncoming> {
    const existingByTag = new Map(existingInbounds.map((inbound) => [inbound.tag, inbound]));
    const incomingByTag = new Map(incomingInbounds.map((inbound) => [inbound.tag, inbound]));

    const toRemove = existingInbounds.filter((existingInbound) => {
        const incomingInbound = incomingByTag.get(existingInbound.tag);

        return !incomingInbound || incomingInbound.type !== existingInbound.type;
    });

    const toAdd: TIncoming[] = [];
    const toUpdate: TExisting[] = [];

    for (const incomingInbound of incomingInbounds) {
        const existingInbound = existingByTag.get(incomingInbound.tag);

        if (!existingInbound || existingInbound.type !== incomingInbound.type) {
            toAdd.push(incomingInbound);
            continue;
        }

        if (!hasChanges(existingInbound, incomingInbound)) {
            continue;
        }

        toUpdate.push(
            Object.assign({}, existingInbound, {
                network: incomingInbound.network,
                port: incomingInbound.port,
                rawInbound: incomingInbound.rawInbound,
                security: incomingInbound.security,
            }),
        );
    }

    return { toAdd, toRemove, toUpdate };
}
