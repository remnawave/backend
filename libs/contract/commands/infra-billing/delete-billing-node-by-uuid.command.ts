import { z } from 'zod';

import { InfraBillingAvailableNodeSchema, InfraBillingNodeSchema } from '../../models';
import { INFRA_BILLING_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace DeleteInfraBillingNodeByUuidCommand {
    export const url = REST_API.INFRA_BILLING.DELETE_BILLING_NODE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        INFRA_BILLING_ROUTES.DELETE_BILLING_NODE(':uuid'),
        'delete',
        'Delete infra billing node',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            totalBillingNodes: z.number(),
            billingNodes: z.array(InfraBillingNodeSchema),
            availableBillingNodes: z.array(InfraBillingAvailableNodeSchema),
            totalAvailableBillingNodes: z.number(),
            stats: z.object({
                upcomingNodesCount: z.number(),
                currentMonthPayments: z.number(),
                totalSpent: z.number(),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
