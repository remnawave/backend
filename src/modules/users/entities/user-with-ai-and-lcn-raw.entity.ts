import { TResetPeriods } from '@libs/contracts/constants';
import { TUsersStatus } from '@libs/contracts/constants';

import { ILastConnectedNode } from '@modules/nodes-user-usage-history/interfaces/last-connected-node';
import { InboundsEntity } from '@modules/inbounds/entities';

import { IUserWithAsiAndLastConnectedNode } from '../interfaces';

export class UserWithAiAndLcnRawEntity {
    public uuid: string;
    public subscriptionUuid: string;
    public shortUuid: string;
    public username: string;
    public status: TUsersStatus;
    public usedTrafficBytes: bigint;
    public lifetimeUsedTrafficBytes: bigint;
    public trafficLimitBytes: bigint;
    public trafficLimitStrategy: TResetPeriods;
    public subLastUserAgent: string;
    public subLastOpenedAt: Date;

    public expireAt: Date;
    public onlineAt: Date;
    public subRevokedAt: Date | null;
    public lastTrafficResetAt: Date | null;

    public trojanPassword: string;
    public vlessUuid: string;
    public ssPassword: string;

    public description: null | string;
    public tag: null | string;

    public telegramId: bigint | null;
    public email: string | null;

    public hwidDeviceLimit: number | null;

    public createdAt: Date;
    public updatedAt: Date;

    public activeUserInbounds: InboundsEntity[];

    public lastConnectedNode: null | ILastConnectedNode;

    constructor(user: Partial<IUserWithAsiAndLastConnectedNode>) {
        Object.assign(this, user);

        if (user.activeUserInbounds) {
            this.activeUserInbounds = user.activeUserInbounds.map((item) => ({
                uuid: item.inbound.uuid,
                tag: item.inbound.tag,
                type: item.inbound.type,
                network: item.inbound.network,
                security: item.inbound.security,
            }));
        }

        if (user.lastConnectedNode) {
            this.lastConnectedNode = {
                nodeName: user.lastConnectedNode.nodeName,
                connectedAt: user.lastConnectedNode.connectedAt,
            };
        } else {
            this.lastConnectedNode = null;
        }

        return this;
    }
}
