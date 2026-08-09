import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmePersistRecordSchema } from '../../../models';

export namespace GetAcmePersistRecordCommand {
    export const url = REST_API.ACME.CERTIFICATES.PERSIST_RECORD;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.PERSIST_RECORD(':uuid'),
        'get',
        'Get the persistent authorization record for a dns-persist-01 certificate',
        { scope: 'get-persist-record', kind: 'read' },
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
