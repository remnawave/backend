import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const configSchema = z
    .object({
        DATABASE_URL: z.string(),
        APP_PORT: z
            .string()
            .default('3000')
            .transform((port) => parseInt(port, 10)),
        METRICS_PORT: z
            .string()
            .default('3001')
            .transform((port) => parseInt(port, 10)),
        JWT_AUTH_SECRET: z
            .string()
            .refine((val) => val !== 'change_me', 'JWT_AUTH_SECRET cannot be set to "change_me"'),
        JWT_AUTH_LIFETIME: z
            .string()
            .default('12')
            .transform((val) => parseInt(val, 10)),
        JWT_API_TOKENS_SECRET: z
            .string()
            .refine(
                (val) => val !== 'change_me',
                'JWT_API_TOKENS_SECRET cannot be set to "change_me"',
            ),

        IS_TELEGRAM_NOTIFICATIONS_ENABLED: z.string().default('false'),
        TELEGRAM_BOT_TOKEN: z.string().optional(),
        TELEGRAM_NOTIFY_USERS_CHAT_ID: z.string().optional(),
        TELEGRAM_NOTIFY_USERS_THREAD_ID: z
            .string()
            .transform((val) => (val === '' ? undefined : val))
            .optional(),

        TELEGRAM_NOTIFY_NODES_CHAT_ID: z.string().optional(),
        TELEGRAM_NOTIFY_NODES_THREAD_ID: z
            .string()
            .transform((val) => (val === '' ? undefined : val))
            .optional(),

        TELEGRAM_NOTIFY_CRM_CHAT_ID: z.string().optional(),
        TELEGRAM_NOTIFY_CRM_THREAD_ID: z
            .string()
            .transform((val) => (val === '' ? undefined : val))
            .optional(),

        TELEGRAM_OAUTH_ENABLED: z.string().default('false'),
        TELEGRAM_OAUTH_ADMIN_IDS: z
            .string()
            .optional()
            .transform((val) => {
                if (!val || val === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    throw new Error('TELEGRAM_OAUTH_ADMIN_IDS must be a valid JSON array');
                }
            })
            .pipe(z.array(z.number()).optional()),

        FRONT_END_DOMAIN: z.string(),
        IS_DOCS_ENABLED: z.string().default('false'),
        SCALAR_PATH: z.string().default('/scalar'),
        SWAGGER_PATH: z.string().default('/docs'),
        METRICS_USER: z.string(),
        METRICS_PASS: z.string(),
        SUB_PUBLIC_DOMAIN: z.string(),
        WEBHOOK_ENABLED: z.string().default('false'),
        WEBHOOK_URL: z.string().optional(),
        WEBHOOK_SECRET_HEADER: z.string().optional(),
        REDIS_HOST: z.string(),
        REDIS_PORT: z
            .string()
            .transform((port) => parseInt(port, 10))
            .refine((port) => port > 0 && port <= 65535, 'Port must be between 1 and 65535'),
        REDIS_PASSWORD: z.optional(z.string()),
        REDIS_DB: z
            .string()
            .transform((db) => parseInt(db, 10))
            .refine((db) => db >= 0 && db <= 15, 'Redis DB index must be between 0 and 15')
            .default('1'),
        SHORT_UUID_LENGTH: z
            .string()
            .default('16')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val >= 16 && val <= 64, 'SHORT_UUID_LENGTH must be between 16 and 64'),
        IS_HTTP_LOGGING_ENABLED: z.string().default('false'),
        IS_CROWDIN_EDITOR_ENABLED: z.string().default('false'),
        REMNAWAVE_BRANCH: z.string().default('dev'),

        HWID_DEVICE_LIMIT_ENABLED: z.string().default('false'),
        HWID_FALLBACK_DEVICE_LIMIT: z.optional(
            z
                .string()
                .transform((val) => parseInt(val, 10))
                .refine(
                    (val) => val >= 1 && val <= 999,
                    'HWID_FALLBACK_DEVICE_LIMIT must be between 1 and 999',
                ),
        ),
        HWID_MAX_DEVICES_ANNOUNCE: z.optional(z.string()),

        // COOKIE_AUTH_ENABLED: z
        //     .string()
        //     .default('false')
        //     .transform((val) => val === 'true'),
        // COOKIE_AUTH_NONCE: z.optional(z.string()),

        SERVICE_CLEAN_USAGE_HISTORY: z.string().default('false'),

        BANDWIDTH_USAGE_NOTIFICATIONS_ENABLED: z.string().default('false'),
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

        OAUTH2_GITHUB_ENABLED: z.string().default('false'),
        OAUTH2_GITHUB_CLIENT_ID: z.string().optional(),
        OAUTH2_GITHUB_CLIENT_SECRET: z.string().optional(),
        OAUTH2_GITHUB_ALLOWED_EMAILS: z
            .string()
            .optional()
            .transform((val) => {
                if (!val || val === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    throw new Error('OAUTH2_GITHUB_ALLOWED_EMAILS must be a valid JSON array');
                }
            })
            .pipe(z.array(z.string()).optional()),

        OAUTH2_POCKETID_ENABLED: z.string().default('false'),
        OAUTH2_POCKETID_CLIENT_ID: z.string().optional(),
        OAUTH2_POCKETID_CLIENT_SECRET: z.string().optional(),
        OAUTH2_POCKETID_PLAIN_DOMAIN: z.string().optional(),
        OAUTH2_POCKETID_ALLOWED_EMAILS: z
            .string()
            .optional()
            .transform((val) => {
                if (!val || val === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    throw new Error('OAUTH2_POCKETID_ALLOWED_EMAILS must be a valid JSON array');
                }
            })
            .pipe(z.array(z.string()).optional()),

        OAUTH2_YANDEX_ENABLED: z.string().default('false'),
        OAUTH2_YANDEX_CLIENT_ID: z.string().optional(),
        OAUTH2_YANDEX_CLIENT_SECRET: z.string().optional(),
        OAUTH2_YANDEX_ALLOWED_EMAILS: z
            .string()
            .optional()
            .transform((val) => {
                if (!val || val === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    throw new Error('OAUTH2_YANDEX_ALLOWED_EMAILS must be a valid JSON array');
                }
            })
            .pipe(z.array(z.string()).optional()),

        BRANDING_TITLE: z.string().optional(),
        BRANDING_LOGO_URL: z.string().optional(),
        NOT_CONNECTED_USERS_NOTIFICATIONS_ENABLED: z.string().default('false'),
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
    })
    .superRefine((data, ctx) => {
        if (data.WEBHOOK_ENABLED === 'true') {
            if (!data.WEBHOOK_URL) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'WEBHOOK_URL is required when WEBHOOK_ENABLED is true',
                    path: ['WEBHOOK_URL'],
                });
            } else if (
                !data.WEBHOOK_URL.startsWith('http://') &&
                !data.WEBHOOK_URL.startsWith('https://')
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'WEBHOOK_URL must start with http:// or https://',
                    path: ['WEBHOOK_URL'],
                });
            }

            if (!data.WEBHOOK_SECRET_HEADER) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'WEBHOOK_SECRET_HEADER is required when WEBHOOK_ENABLED is true',
                    path: ['WEBHOOK_SECRET_HEADER'],
                });
            } else {
                if (data.WEBHOOK_SECRET_HEADER.length < 32) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'WEBHOOK_SECRET_HEADER must be at least 32 characters long',
                        path: ['WEBHOOK_SECRET_HEADER'],
                    });
                }
                if (!/^[a-zA-Z0-9]+$/.test(data.WEBHOOK_SECRET_HEADER)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'WEBHOOK_SECRET_HEADER must contain only letters and numbers',
                        path: ['WEBHOOK_SECRET_HEADER'],
                    });
                }
            }
        }

        if (data.IS_TELEGRAM_NOTIFICATIONS_ENABLED === 'true') {
            if (!data.TELEGRAM_BOT_TOKEN) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'TELEGRAM_BOT_TOKEN is required when IS_TELEGRAM_NOTIFICATIONS_ENABLED is true',
                    path: ['TELEGRAM_BOT_TOKEN'],
                });
            }
            if (!data.TELEGRAM_NOTIFY_NODES_CHAT_ID) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'TELEGRAM_NOTIFY_NODES_CHAT_ID is required when IS_TELEGRAM_NOTIFICATIONS_ENABLED is true',
                    path: ['TELEGRAM_NOTIFY_NODES_CHAT_ID'],
                });
            }
        }

        if (data.HWID_DEVICE_LIMIT_ENABLED === 'true') {
            if (!data.HWID_FALLBACK_DEVICE_LIMIT) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'HWID_FALLBACK_DEVICE_LIMIT is required when HWID_DEVICE_LIMIT_ENABLED is true',
                    path: ['HWID_FALLBACK_DEVICE_LIMIT'],
                });
            }

            if (!data.HWID_MAX_DEVICES_ANNOUNCE) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'HWID_MAX_DEVICES_ANNOUNCE is required when HWID_DEVICE_LIMIT_ENABLED is true',
                    path: ['HWID_MAX_DEVICES_ANNOUNCE'],
                });
            }
        }

        if (data.TELEGRAM_OAUTH_ENABLED === 'true') {
            if (!data.TELEGRAM_OAUTH_ADMIN_IDS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'TELEGRAM_OAUTH_ADMIN_IDS is required when TELEGRAM_OAUTH_ENABLED is true',
                    path: ['TELEGRAM_OAUTH_ADMIN_IDS'],
                });
            }

            if (!data.TELEGRAM_OAUTH_ADMIN_IDS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'TELEGRAM_OAUTH_ADMIN_IDS is required when TELEGRAM_OAUTH_ENABLED is true',
                    path: ['TELEGRAM_OAUTH_ADMIN_IDS'],
                });
            } else if (data.TELEGRAM_OAUTH_ADMIN_IDS.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'TELEGRAM_OAUTH_ADMIN_IDS must not be empty',
                    path: ['TELEGRAM_OAUTH_ADMIN_IDS'],
                });
            }

            if (!data.TELEGRAM_BOT_TOKEN) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'TELEGRAM_BOT_TOKEN is required when TELEGRAM_OAUTH_ENABLED is true',
                    path: ['TELEGRAM_BOT_TOKEN'],
                });
            }
        }

        if (data.OAUTH2_GITHUB_ENABLED === 'true') {
            if (!data.OAUTH2_GITHUB_CLIENT_ID) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_GITHUB_CLIENT_ID is required when OAUTH2_GITHUB_ENABLED is true',
                    path: ['OAUTH2_GITHUB_CLIENT_ID'],
                });
            }

            if (!data.OAUTH2_GITHUB_CLIENT_SECRET) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_GITHUB_CLIENT_SECRET is required when OAUTH2_GITHUB_ENABLED is true',
                    path: ['OAUTH2_GITHUB_CLIENT_SECRET'],
                });
            }

            if (!data.OAUTH2_GITHUB_ALLOWED_EMAILS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_GITHUB_ALLOWED_EMAILS is required when OAUTH2_GITHUB_ENABLED is true',
                    path: ['OAUTH2_GITHUB_ALLOWED_EMAILS'],
                });
            }
        }

        if (data.OAUTH2_POCKETID_ENABLED === 'true') {
            if (!data.OAUTH2_POCKETID_CLIENT_ID) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_POCKETID_CLIENT_ID is required when OAUTH2_POCKETID_ENABLED is true',
                    path: ['OAUTH2_POCKETID_CLIENT_ID'],
                });
            }

            if (!data.OAUTH2_POCKETID_CLIENT_SECRET) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_POCKETID_CLIENT_SECRET is required when OAUTH2_POCKETID_ENABLED is true',
                    path: ['OAUTH2_POCKETID_CLIENT_SECRET'],
                });
            }

            if (!data.OAUTH2_POCKETID_PLAIN_DOMAIN) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_POCKETID_PLAIN_DOMAIN is required when OAUTH2_POCKETID_ENABLED is true',
                    path: ['OAUTH2_POCKETID_PLAIN_DOMAIN'],
                });
            }

            if (!data.OAUTH2_POCKETID_ALLOWED_EMAILS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_POCKETID_ALLOWED_EMAILS is required when OAUTH2_POCKETID_ENABLED is true',
                    path: ['OAUTH2_POCKETID_ALLOWED_EMAILS'],
                });
            }
        }

        if (data.OAUTH2_YANDEX_ENABLED === 'true') {
            if (!data.OAUTH2_YANDEX_CLIENT_ID) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_YANDEX_CLIENT_ID is required when OAUTH2_YANDEX_ENABLED is true',
                    path: ['OAUTH2_YANDEX_CLIENT_ID'],
                });
            }

            if (!data.OAUTH2_YANDEX_CLIENT_SECRET) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_YANDEX_CLIENT_SECRET is required when OAUTH2_YANDEX_ENABLED is true',
                    path: ['OAUTH2_YANDEX_CLIENT_SECRET'],
                });
            }

            if (!data.OAUTH2_YANDEX_ALLOWED_EMAILS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'OAUTH2_YANDEX_ALLOWED_EMAILS is required when OAUTH2_YANDEX_ENABLED is true',
                    path: ['OAUTH2_YANDEX_ALLOWED_EMAILS'],
                });
            }
        }
        // if (data.COOKIE_AUTH_ENABLED) {
        //     if (!data.COOKIE_AUTH_NONCE) {
        //         ctx.addIssue({
        //             code: z.ZodIssueCode.custom,
        //             message: 'COOKIE_AUTH_NONCE is required when COOKIE_AUTH_ENABLED is true',
        //             path: ['COOKIE_AUTH_NONCE'],
        //         });
        //     } else if (!data.COOKIE_AUTH_NONCE) {
        //         if (!/^[a-zA-Z0-9]+$/.test(data.COOKIE_AUTH_NONCE)) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'COOKIE_AUTH_NONCE can only contain letters and numbers',
        //                 path: ['COOKIE_AUTH_NONCE'],
        //             });
        //         }

        //         if (data.COOKIE_AUTH_NONCE.length > 64) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'COOKIE_AUTH_NONCE must be less than 64 characters',
        //                 path: ['COOKIE_AUTH_NONCE'],
        //             });
        //         }

        //         if (data.COOKIE_AUTH_NONCE.length < 6) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'COOKIE_AUTH_NONCE must be at least 6 characters',
        //                 path: ['COOKIE_AUTH_NONCE'],
        //             });
        //         }
        //     }
        // }

        if (data.BANDWIDTH_USAGE_NOTIFICATIONS_ENABLED === 'true') {
            if (!data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD is required when BANDWIDTH_USAGE_NOTIFICATIONS_ENABLED is true',
                    path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                });
            } else if (data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD must not be empty',
                    path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                });
            } else {
                if (data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD.length > 5) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
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
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'All threshold values must be integers between 25 and 95',
                        path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                    });
                }

                if (
                    !data.BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD.every(
                        (value, index, array) => index === 0 || value > array[index - 1],
                    )
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Threshold values must be in strictly ascending order',
                        path: ['BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD'],
                    });
                }
            }
        }

        if (data.NOT_CONNECTED_USERS_NOTIFICATIONS_ENABLED === 'true') {
            if (!data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS is required when NOT_CONNECTED_USERS_NOTIFICATIONS_ENABLED is true',
                    path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                });
            } else if (data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS must not be empty',
                    path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                });
            } else {
                if (data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.length > 3) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS must contain at most 3 values',
                        path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                    });
                }

                if (
                    data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.some(
                        (t) => isNaN(t) || !Number.isInteger(t) || t < 1 || t > 168,
                    )
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'All hours values must be integers between 1 and 168',
                        path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                    });
                }

                if (
                    !data.NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS.every(
                        (value, index, array) => index === 0 || value > array[index - 1],
                    )
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Hours values must be in strictly ascending order',
                        path: ['NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS'],
                    });
                }
            }
        }

        if (data.JWT_AUTH_LIFETIME > 168 || data.JWT_AUTH_LIFETIME < 12) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'JWT_AUTH_LIFETIME must be between 12 and 168 hours.',
                path: ['JWT_AUTH_LIFETIME'],
            });
        }

        if (data.REMNAWAVE_BRANCH !== 'dev' && data.REMNAWAVE_BRANCH !== 'main') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'REMNAWAVE_BRANCH is modified in the Dockerfile. Please do not change it.',
                path: ['REMNAWAVE_BRANCH'],
            });
        }
    });

export type ConfigSchema = z.infer<typeof configSchema>;
export class Env extends createZodDto(configSchema) {}
