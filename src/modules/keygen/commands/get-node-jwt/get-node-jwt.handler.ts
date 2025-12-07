import * as jwt from 'jsonwebtoken';

import { IJWTAuthPayload } from 'src/modules/auth/interfaces';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS, ROLE } from '@libs/contracts/constants';

import { GetNodeJwtCommand } from './get-node-jwt.command';
import { KeygenService } from '../../keygen.service';

@CommandHandler(GetNodeJwtCommand)
export class GetNodeJwtHandler implements ICommandHandler<GetNodeJwtCommand> {
    private readonly logger = new Logger(GetNodeJwtHandler.name);

    constructor(private readonly keygenService: KeygenService) {}

    async execute() {
        const response = await this.keygenService.generateKey();

        if (!response.isOk) {
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }

        const { privKey, clientCert, clientKey, caCert } = response.response;

        const payload: IJWTAuthPayload = {
            uuid: null,
            username: null,
            role: ROLE.API,
        };

        const token = jwt.sign(payload, privKey, {
            algorithm: 'RS256',
            expiresIn: '9999d',
        });

        try {
            return ok({
                jwtToken: token,
                clientCert: clientCert!,
                clientKey: clientKey!,
                caCert: caCert!,
            });
        } catch (error) {
            this.logger.error(`Error getting node jwt: ${error}`);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
