import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { ExtendedUsersSchema } from '../../models';
import { REST_API, USERS_ROUTES } from '../../api';

export namespace GetAllUsersCommand {
    export const url = REST_API.USERS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(USERS_ROUTES.GET, 'get', 'Get all users');

    const FilterSchema = z.object({
        id: z.string(),
        value: z.unknown(),
    });

    const SortingSchema = z.object({
        id: z.string(),
        desc: z.boolean(),
    });

    export const RequestQuerySchema = z.object({
        start: z.coerce
            .number()
            .default(0)
            .describe('Start index (offset) of the users to return, default is 0'),
        size: z.coerce
            .number()
            .min(1, 'Size (limit) must be greater than 0')
            .max(1000, 'Size (limit) must be less than 1000')
            .describe('Number of users to return, no more than 1000')
            .default(25),
        filters: z
            .preprocess(
                (str) => (typeof str === 'string' ? JSON.parse(str) : str),
                z.array(FilterSchema),
            )
            .optional(),

        filterModes: z
            .preprocess(
                (str) => (typeof str === 'string' ? JSON.parse(str) : str),
                z.record(z.string(), z.string()),
            )
            .optional(),

        globalFilterMode: z.string().optional(),

        sorting: z
            .preprocess(
                (str) => (typeof str === 'string' ? JSON.parse(str) : str),
                z.array(SortingSchema),
            )
            .optional(),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            users: z.array(ExtendedUsersSchema),
            total: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
