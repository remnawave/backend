import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace IssueAcmeCertificateCommand {
    export const url = REST_API.ACME.CERTIFICATES.ISSUE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.ISSUE(':uuid'),
        'post',
        'Issue or renew the certificate now',
        { scope: 'issue-certificate', kind: 'write' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    /**
     * Issuance is queued rather than awaited: an order takes tens of seconds and
     * the caller should not hold an HTTP request open for it. Progress shows up
     * in the certificate status and in its events.
     */
    export const ResponseSchema = z.object({
        response: z.object({
            isQueued: z.boolean(),
        }),
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
