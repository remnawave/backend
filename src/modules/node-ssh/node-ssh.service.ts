import { randomBytes } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';
import { SSH_TERMINAL_WS_PATH } from '@libs/contracts/models';

import type { IJWTAuthPayload } from '@modules/auth/interfaces';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';

import { ISshTicketPayload } from './interfaces';
import { CreateSshTicketResponseModel } from './models';

export const SSH_TICKET_TTL_SECONDS = 15;

const ticketKey = (ticket: string) => `ssh_ticket:${ticket}`;

@Injectable()
export class NodeSshService {
    private readonly logger = new Logger(NodeSshService.name);

    constructor(
        private readonly rawCacheService: RawCacheService,
        private readonly queryBus: QueryBus,
    ) {}

    public async createTicket(
        nodeUuid: string,
        payload: IJWTAuthPayload,
        clientIp: string,
    ): Promise<TResult<CreateSshTicketResponseModel>> {
        try {
            if (!payload.uuid) {
                return fail(ERRORS.UNAUTHORIZED);
            }

            const node = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));
            if (!node.isOk) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const ticket = randomBytes(32).toString('base64url');

            const ticketPayload: ISshTicketPayload = {
                adminUuid: payload.uuid,
                nodeUuid: node.response.uuid,
                clientIp,
            };

            await this.rawCacheService.set(
                ticketKey(ticket),
                ticketPayload,
                SSH_TICKET_TTL_SECONDS,
            );

            return ok(
                new CreateSshTicketResponseModel({
                    ticket,
                    path: SSH_TERMINAL_WS_PATH,
                    expiresInSeconds: SSH_TICKET_TTL_SECONDS,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_SSH_TICKET_ERROR);
        }
    }

    public async consumeTicket(
        ticket: string,
        clientIp: string,
    ): Promise<ISshTicketPayload | null> {
        let raw: null | string;
        try {
            raw = await this.rawCacheService.getDelString(ticketKey(ticket));
        } catch (error) {
            this.logger.error(`Failed to consume SSH ticket: ${String(error)}`);
            return null;
        }

        if (!raw) {
            return null;
        }

        let payload: ISshTicketPayload;
        try {
            payload = JSON.parse(raw) as ISshTicketPayload;
        } catch {
            return null;
        }

        if (payload.clientIp !== clientIp) {
            this.logger.warn(
                `SSH ticket was issued to ${payload.clientIp} but redeemed from ${clientIp}, rejecting.`,
            );
            return null;
        }

        return payload;
    }
}
