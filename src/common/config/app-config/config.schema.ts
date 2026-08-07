import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const booleanString = (def: 'true' | 'false' = 'false') =>
    z
        .string()
        .default(def)
        .transform((val) => (val === '' ? def : val))
        .refine((val) => val === 'true' || val === 'false', 'Must be "true" or "false".')
        .transform((val) => val === 'true')
        .pipe(z.boolean());

export const configSchema = z
    .object({
        __RW_METADATA_VERSION: z.string().default('1.1.1'),
        __RW_METADATA_GIT_BACKEND_COMMIT: z
            .string()
            .default('0f344f388807f5323b49024a563b3f8146d66857'),
        __RW_METADATA_GIT_FRONTEND_COMMIT: z
            .string()
            .default('0f344f388807f5323b49024a563b3f8146d66857'),
        __RW_METADATA_GIT_BRANCH: z.string().default('dev'),
        __RW_METADATA_BUILD_TIME: z.string().default('2011-11-11T11:11:11Z'),
        __RW_METADATA_BUILD_NUMBER: z.string().default('0'),

        DATABASE_URL: z.string(),
        APP_PORT: z
            .string()
            .default('3000')
            .transform((port) => parseInt(port, 10)),
        METRICS_PORT: z
            .string()
            .default('3001')
            .transform((port) => parseInt(port, 10)),
        APP_SECRET: z
            .string()
            .refine((val) => val !== 'change_me', 'APP_SECRET cannot be set to "change_me"'),
        JWT_AUTH_LIFETIME: z
            .string()
            .default('12')
            .transform((val) => parseInt(val, 10)),
        IS_TELEGRAM_NOTIFICATIONS_ENABLED: booleanString('false'),
        TELEGRAM_BOT_TOKEN: z.string().optional(),
        TELEGRAM_BOT_API_ROOT: z.string().default('https://api.telegram.org'),
        TELEGRAM_BOT_PROXY: z
            .string()
            .optional()
            .refine(
                (val) => val !== 'change_me',
                'TELEGRAM_BOT_PROXY cannot be set to "change_me"',
            ),
        TELEGRAM_NOTIFY_USERS: z.string().optional(),
        TELEGRAM_NOTIFY_NODES: z.string().optional(),
        TELEGRAM_NOTIFY_CRM: z.string().optional(),
        TELEGRAM_NOTIFY_SERVICE: z.string().optional(),
        TELEGRAM_NOTIFY_TBLOCKER: z.string().optional(),

        FRONT_END_DOMAIN: z.string(),
        PANEL_DOMAIN: z.string().optional(),
        METRICS_USER: z.string().min(1),
        METRICS_PASS: z.string().min(1),
        SUB_PUBLIC_DOMAIN: z.string(),
        WEBHOOK_ENABLED: booleanString('false'),
        WEBHOOK_URL: z.string().optional(),
        WEBHOOK_SECRET_HEADER: z.string().optional(),
        REDIS_HOST: z.string().optional(),
        REDIS_PORT: z
            .string()
            .optional()
            .transform((port) => (port ? parseInt(port, 10) : undefined))
            .refine(
                (port) => port === undefined || (port > 0 && port <= 65535),
                'Port must be between 1 and 65535',
            ),
        REDIS_SOCKET: z.string().optional(),
        REDIS_USERNAME: z.optional(z.string()),
        REDIS_PASSWORD: z.optional(z.string()),
        REDIS_DB: z
            .string()
            .transform((db) => parseInt(db, 10))
            .refine((db) => db >= 0 && db <= 15, 'Redis DB index must be between 0 and 15')
            .prefault('1'),
        SHORT_UUID_LENGTH: z
            .string()
            .default('16')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val >= 16 && val <= 64, 'SHORT_UUID_LENGTH must be between 16 and 64'),
        IS_HTTP_LOGGING_ENABLED: booleanString('false'),
        ENABLE_DEBUG_LOGS: booleanString('false'),
        REMNAWAVE_BRANCH: z.string().default('dev'),
        SERVICE_CLEAN_USAGE_HISTORY: booleanString('false'),
        SERVICE_DISABLE_USER_USAGE_RECORDS: booleanString('false'),
        SERVICE_DISABLE_SRH_RECORDS: booleanString('false'),
        EXPORT_TO_STREAM_ENABLED: booleanString('false'),
        EXPORT_TO_STREAM_MAXLEN: z
            .string()
            .default('3000')
            .transform((val) => parseInt(val, 10))
            .refine(
                (val) => Number.isInteger(val) && val > 0,
                'EXPORT_TO_STREAM_MAXLEN must be a positive integer',
            ),
        BANDWIDTH_USAGE_NOTIFICATIONS_ENABLED: booleanString('false'),
        BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD: z
            .string()
            .optional()
            .transform((val) => {
                if (!val || val === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    throw new Error(
                        'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD must be a valid JSON array',
                    );
                }
            })
            .pipe(z.array(z.number()).optional()),

        NOT_CONNECTED_USERS_NOTIFICATIONS_ENABLED: booleanString('false'),
        NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS: z
            .string()
            .optional()
            .transform((val) => {
                if (!val || val === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    throw new Error(
                        'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS must be a valid JSON array',
                    );
                }
            })
            .pipe(z.array(z.number()).optional()),
        USER_USAGE_IGNORE_BELOW_BYTES: z
            .string()
            .default('0')
            .transform((bytes) => BigInt(bytes))
            .pipe(z.bigint().max(1_048_576n)),
        EXPIRATION_NOTIFICATIONS_ENABLED: booleanString('false'),
        EXPIRATION_NOTIFICATIONS: z
            .string()
            .optional()
            .transform((val) => {
                if (!val || val === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    throw new Error('EXPIRATION_NOTIFICATIONS must be a valid JSON array');
                }
            })
            .pipe(z.array(z.number()).optional()),
    })
    .superRefine((data, ctx) => {
        if (!data.REDIS_SOCKET && (!data.REDIS_HOST || !data.REDIS_PORT)) {
            ctx.issues.push({
                input: data,
                code: 'custom',
                message: 'Either REDIS_SOCKET or both REDIS_HOST and REDIS_PORT must be provided',
                path: ['REDIS_HOST'],
            });
        }

        if (data.REDIS_SOCKET && data.REDIS_HOST && data.REDIS_PORT) {
            ctx.issues.push({
                input: data,
                code: 'custom',
                message: 'REDIS_SOCKET, REDIS_HOST and REDIS_PORT cannot be provided together',
                path: ['REDIS_SOCKET'],
            });
        }

        if (data.WEBHOOK_ENABLED) {
            if (!data.WEBHOOK_URL) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message: 'WEBHOOK_URL is required when WEBHOOK_ENABLED is true',
                    path: ['WEBHOOK_URL'],
                });
            } else if (
                !data.WEBHOOK_URL.startsWith('http://') &&
                !data.WEBHOOK_URL.startsWith('https://')
            ) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message: 'WEBHOOK_URL must start with http:// or https://',
                    path: ['WEBHOOK_URL'],
                });
            }

            if (!data.WEBHOOK_SECRET_HEADER) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message: 'WEBHOOK_SECRET_HEADER is required when WEBHOOK_ENABLED is true',
                    path: ['WEBHOOK_SECRET_HEADER'],
                });
            } else {
                if (data.WEBHOOK_SECRET_HEADER.length < 32) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message: 'WEBHOOK_SECRET_HEADER must be at least 32 characters long',
                        path: ['WEBHOOK_SECRET_HEADER'],
                    });
                }
                if (!/^[a-zA-Z0-9]+$/.test(data.WEBHOOK_SECRET_HEADER)) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message: 'WEBHOOK_SECRET_HEADER must contain only letters and numbers',
                        path: ['WEBHOOK_SECRET_HEADER'],
                    });
                }
            }

            if (data.WEBHOOK_URL) {
                if (data.WEBHOOK_URL.includes(',')) {
                    const webhookUrls = data.WEBHOOK_URL.split(',');
                    for (const webhookUrl of webhookUrls) {
                        if (
                            !webhookUrl.startsWith('http://') &&
                            !webhookUrl.startsWith('https://')
                        ) {
                            ctx.issues.push({
                                input: data,
                                code: 'custom',
                                message: 'WEBHOOK_URL must start with http:// or https://',
                                path: ['WEBHOOK_URL'],
                            });
                        }
                    }
                }
            }
        }

        if (data.IS_TELEGRAM_NOTIFICATIONS_ENABLED) {
            if (!data.TELEGRAM_BOT_TOKEN) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message:
                        'TELEGRAM_BOT_TOKEN is required when IS_TELEGRAM_NOTIFICATIONS_ENABLED is true',
                    path: ['TELEGRAM_BOT_TOKEN'],
                });
            }
        }

        if (data.BANDWIDTH_USAGE_NOTIFICATIONS_ENABLED) {
            if (!data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message:
                        'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD is required when BANDWIDTH_USAGE_NOTIFICATIONS_ENABLED is true',
                    path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                });
            } else if (data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD.length === 0) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message: 'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD must not be empty',
                    path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                });
            } else {
                if (data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD.length > 5) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message:
                            'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD must contain at most 5 values',
                        path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                    });
                }

                if (
                    data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD.some(
                        (t) => isNaN(t) || !Number.isInteger(t) || t < 25 || t > 95,
                    )
                ) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message: 'All threshold values must be integers between 25 and 95',
                        path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                    });
                }

                if (
                    !data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD.every(
                        (value, index, array) => index === 0 || value > array[index - 1],
                    )
                ) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message: 'Threshold values must be in strictly ascending order',
                        path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                    });
                }
            }
        }

        if (data.NOT_CONNECTED_USERS_NOTIFICATIONS_ENABLED) {
            if (!data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message:
                        'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS is required when NOT_CONNECTED_USERS_NOTIFICATIONS_ENABLED is true',
                    path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                });
            } else if (data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.length === 0) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message: 'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS must not be empty',
                    path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                });
            } else {
                if (data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.length > 3) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message:
                            'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS must contain at most 3 values',
                        path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                    });
                }

                if (
                    data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.some(
                        (t) => isNaN(t) || !Number.isInteger(t) || t < 1 || t > 744,
                    )
                ) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message: 'All hours values must be integers between 1 and 744',
                        path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                    });
                }

                if (
                    !data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.every(
                        (value, index, array) => index === 0 || value > array[index - 1],
                    )
                ) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message: 'Hours values must be in strictly ascending order',
                        path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                    });
                }
            }
        }

        if (data.EXPIRATION_NOTIFICATIONS_ENABLED) {
            if (!data.EXPIRATION_NOTIFICATIONS) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message:
                        'EXPIRATION_NOTIFICATIONS is required when EXPIRATION_NOTIFICATIONS_ENABLED is true',
                    path: ['EXPIRATION_NOTIFICATIONS'],
                });
            } else if (data.EXPIRATION_NOTIFICATIONS.length === 0) {
                ctx.issues.push({
                    input: data,
                    code: 'custom',
                    message: 'EXPIRATION_NOTIFICATIONS must not be empty',
                    path: ['EXPIRATION_NOTIFICATIONS'],
                });
            } else {
                if (
                    data.EXPIRATION_NOTIFICATIONS.some(
                        (t) => isNaN(t) || !Number.isInteger(t) || t === 0 || t < -744 || t > 744,
                    )
                ) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message:
                            'All expiration values must be non-zero integers between -744 and 744',
                        path: ['EXPIRATION_NOTIFICATIONS'],
                    });
                }

                if (data.EXPIRATION_NOTIFICATIONS.filter((t) => t < 0).length > 5) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message:
                            'EXPIRATION_NOTIFICATIONS must contain at most 5 negative values (before expiration)',
                        path: ['EXPIRATION_NOTIFICATIONS'],
                    });
                }

                if (data.EXPIRATION_NOTIFICATIONS.filter((t) => t > 0).length > 5) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message:
                            'EXPIRATION_NOTIFICATIONS must contain at most 5 positive values (after expiration)',
                        path: ['EXPIRATION_NOTIFICATIONS'],
                    });
                }

                if (
                    new Set(data.EXPIRATION_NOTIFICATIONS).size !==
                    data.EXPIRATION_NOTIFICATIONS.length
                ) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message: 'EXPIRATION_NOTIFICATIONS must not contain duplicate values',
                        path: ['EXPIRATION_NOTIFICATIONS'],
                    });
                }

                if (
                    !data.EXPIRATION_NOTIFICATIONS.every(
                        (value, index, array) => index === 0 || value > array[index - 1],
                    )
                ) {
                    ctx.issues.push({
                        input: data,
                        code: 'custom',
                        message:
                            'EXPIRATION_NOTIFICATIONS values must be in strictly ascending order',
                        path: ['EXPIRATION_NOTIFICATIONS'],
                    });
                }
            }
        }

        if (data.JWT_AUTH_LIFETIME > 168 || data.JWT_AUTH_LIFETIME < 12) {
            ctx.issues.push({
                input: data,
                code: 'custom',
                message: 'JWT_AUTH_LIFETIME must be between 12 and 168 hours.',
                path: ['JWT_AUTH_LIFETIME'],
            });
        }

        if (data.REMNAWAVE_BRANCH !== 'dev' && data.REMNAWAVE_BRANCH !== 'main') {
            ctx.issues.push({
                input: data,
                code: 'custom',
                message: 'REMNAWAVE_BRANCH is modified in the Dockerfile. Please do not change it.',
                path: ['REMNAWAVE_BRANCH'],
            });
        }
    });

export type ConfigSchema = z.infer<typeof configSchema>;
export class Env extends createZodDto(configSchema) {}
