import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeCredentialTestSchema } from '../../../models';

export namespace TestAcmeCredentialCommand {
    export const url = REST_API.ACME.CREDENTIALS.TEST;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CREDENTIALS.TEST(':uuid'),
        'post',
        'Check that the credential works and report what it may do',
        { scope: 'test-credential', kind: 'write' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    export const ResponseSchema = z.object({
        response: AcmeCredentialTestSchema,
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
