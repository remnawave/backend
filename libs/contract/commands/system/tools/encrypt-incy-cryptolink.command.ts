import { z } from 'zod';

import { REST_API, SYSTEM_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace EncryptIncyCryptoLinkCommand {
    export const url = REST_API.SYSTEM.TOOLS.ENCRYPT_INCY_CRYPTO_LINK;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SYSTEM_ROUTES.TOOLS.ENCRYPT_INCY_CRYPTO_LINK,
        'post',
        'Encrypt Incy Crypto Link',
        { scope: 'encrypt-incy-crypto-link', kind: 'read' },
    );
    export const RequestSchema = z.object({
        linkToEncrypt: z.string().url(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            encryptedLink: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
