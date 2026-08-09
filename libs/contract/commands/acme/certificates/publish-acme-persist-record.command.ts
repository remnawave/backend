import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmePersistRecordSchema } from '../../../models';

export namespace PublishAcmePersistRecordCommand {
    export const url = REST_API.ACME.CERTIFICATES.PUBLISH_PERSIST_RECORD;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.PUBLISH_PERSIST_RECORD(':uuid'),
        'post',
        'Publish the persistent authorization record using the certificate credential',
        { scope: 'publish-persist-record', kind: 'write' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    export const ResponseSchema = z.object({
        response: AcmePersistRecordSchema,
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
