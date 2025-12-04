import { Injectable, Logger } from '@nestjs/common';

import { encodeCertPayload } from '@common/utils/certs/encode-node-payload';
import { generateNodeCert } from '@common/utils';
import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants/errors';

import { KeygenRepository } from './repositories/keygen.repository';
import { KeygenEntity } from './entities/keygen.entity';

@Injectable()
export class KeygenService {
    private readonly logger = new Logger(KeygenService.name);

    constructor(private readonly keygenRepository: KeygenRepository) {}

    public async generateKey(): Promise<TResult<{ payload: string } & KeygenEntity>> {
        try {
            const pubKey = await this.keygenRepository.findFirstByCriteria({});

            if (!pubKey) {
                return {
                    isOk: false,
                    ...ERRORS.KEYPAIR_CREATION_ERROR,
                };
            }

            if (!pubKey.caCert || !pubKey.caKey || !pubKey.clientCert || !pubKey.clientKey) {
                return {
                    isOk: false,
                    ...ERRORS.KEYPAIR_NOT_FOUND,
                };
            }

            const { nodeCertPem, nodeKeyPem } = await generateNodeCert(pubKey.caCert, pubKey.caKey);

            const nodePayload = encodeCertPayload({
                nodeCertPem,
                nodeKeyPem,
                caCertPem: pubKey.caCert,
                jwtPublicKey: pubKey.pubKey,
            });

            return {
                isOk: true,
                response: {
                    payload: nodePayload,
                    ...pubKey,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_PUBLIC_KEY_ERROR,
            };
        }
    }
}
