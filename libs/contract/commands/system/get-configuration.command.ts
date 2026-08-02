import { z } from 'zod';

import { REST_API, SYSTEM_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GetConfigurationCommand {
    export const url = REST_API.SYSTEM.CONFIGURATION;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SYSTEM_ROUTES.CONFIGURATION,
        'get',
        'Get Remnawave Configuration',
        { scope: 'configuration', kind: 'read' },
        'Returns some of the configuration values.',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            notifications: z.object({
                webhook: z.boolean().meta({
                    description: 'WEBHOOK_ENABLED',
                }),
                bandwidthUsage: z.array(z.number()).nullable().meta({
                    description: 'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD',
                }),
                notConnectedAfter: z.array(z.number()).nullable().meta({
                    description: 'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS',
                }),
                expirationNotifications: z.array(z.number()).nullable().meta({
                    description: 'EXPIRATION_NOTIFICATIONS',
                }),
            }),
            service: z.object({
                cleanUsageHistory: z.boolean().meta({
                    description: 'SERVICE_CLEAN_USAGE_HISTORY',
                }),
                disableUserUsageRecords: z.boolean().meta({
                    description: 'SERVICE_DISABLE_USER_USAGE_RECORDS',
                }),
                disableSrhRecords: z.boolean().meta({
                    description: 'SERVICE_DISABLE_SRH_RECORDS',
                }),
                exportToRedisStream: z.boolean().meta({
                    description: 'EXPORT_TO_STREAM_ENABLED',
                }),
            }),
            misc: z.object({
                shortUuidLength: z.number().meta({
                    description: 'SHORT_UUID_LENGTH',
                }),
                subPublicDomain: z.string(),
                userUsageIgnoreBelowBytes: z.number().meta({
                    description: 'USER_USAGE_IGNORE_BELOW_BYTES',
                }),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
