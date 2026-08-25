import { z } from 'zod';

import { NODE_SSH_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace EvaluateVaultCommand {
    export const url = REST_API.NODE_SSH.EVALUATE_VAULT;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_SSH_ROUTES.EVALUATE_VAULT,
        'post',
        'Oblivious evaluation step for unlocking the SSH key vault',
        { scope: 'node-ssh', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        blinded: z.base64().max(128),
    });

    export const ResponseSchema = z.object({
        response: z.object({
            evaluated: z.base64(),
        }),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
