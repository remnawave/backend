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
        JWT_API_TOKENS_SECRET: z
            .string()
            .refine(
                (val) => val !== 'change_me',
                'JWT_API_TOKENS_SECRET cannot be set to "change_me"',
            ),
        TELEGRAM_BOT_TOKEN: z.string().optional(),
        TELEGRAM_ADMIN_ID: z.string().optional(),
        NODES_NOTIFY_CHAT_ID: z.string().optional(),
        IS_TELEGRAM_ENABLED: z.string().default('false'),
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
    })
    .superRefine((data, ctx) => {
        if (data.WEBHOOK_ENABLED === 'true') {
            if (!data.WEBHOOK_URL) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'WEBHOOK_URL is required when WEBHOOK_ENABLED is true',
                    path: ['WEBHOOK_URL'],
                });
            } else if (!data.WEBHOOK_URL.startsWith('https://')) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'WEBHOOK_URL must start with https://',
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

        if (data.IS_TELEGRAM_ENABLED === 'true') {
            if (!data.TELEGRAM_BOT_TOKEN) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'TELEGRAM_BOT_TOKEN is required when IS_TELEGRAM_ENABLED is true',
                    path: ['TELEGRAM_BOT_TOKEN'],
                });
            }
            if (!data.TELEGRAM_ADMIN_ID) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'TELEGRAM_ADMIN_ID is required when IS_TELEGRAM_ENABLED is true',
                    path: ['TELEGRAM_ADMIN_ID'],
                });
            }
            if (!data.NODES_NOTIFY_CHAT_ID) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'NODES_NOTIFY_CHAT_ID is required when IS_TELEGRAM_ENABLED is true',
                    path: ['NODES_NOTIFY_CHAT_ID'],
                });
            }
        }
    });

export type ConfigSchema = z.infer<typeof configSchema>;
export class Env extends createZodDto(configSchema) {}
