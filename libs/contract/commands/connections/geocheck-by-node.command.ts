import { z } from 'zod';

import { CONNECTIONS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GeocheckByNodeCommand {
    export const url = REST_API.CONNECTIONS.GEOCHECK_BY_NODE;
    export const TSQ_url = url(':nodeUuid');

    export const endpointDetails = getEndpointDetails(
        CONNECTIONS_ROUTES.GEOCHECK_BY_NODE(':nodeUuid'),
        'post',
        'Request Geocheck for Node',
        { scope: 'geocheck', kind: 'read' },
        'Queues a geocheck on the node and returns a job ID. Poll "Get Geocheck for Node by Job ID" for the result, the node may take up to a minute to answer.',
    );

    export const RequestParamSchema = z.object({
        nodeUuid: z.uuid().describe('Node UUID'),
    });

    export const RequestBodySchema = z
        .object({
            ip: z.string().optional().describe('Check from this IP address'),
            interface: z.string().optional().describe('Check from this network interface'),
        })
        .refine((data) => !(data.ip && data.interface), {
            message: 'Only one of "ip" or "interface" can be specified',
            path: ['ip'],
        });

    export const ResponseSchema = z.object({
        response: z.object({
            jobId: z.string(),
        }),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
