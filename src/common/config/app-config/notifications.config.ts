import { readFileSync, existsSync } from 'node:fs';
import { z, ZodError } from 'zod';
import { join } from 'node:path';
import * as yaml from 'js-yaml';

import { registerAs } from '@nestjs/config';

import { EVENTS } from '@libs/contracts/constants';

const ALL_EVENTS = [
    ...Object.values(EVENTS.USER),
    ...Object.values(EVENTS.USER_HWID_DEVICES),
    ...Object.values(EVENTS.NODE),
    ...Object.values(EVENTS.SERVICE),
    ...Object.values(EVENTS.ERRORS),
    ...Object.values(EVENTS.CRM),
] as const;

const eventConfigSchema = z.object({
    telegram: z.boolean(),
    webhook: z.boolean(),
});

const notificationsConfigSchema = z.object({
    events: z
        .record(z.enum(ALL_EVENTS as [string, ...string[]]), eventConfigSchema)
        .nullable()
        .transform((val) => val ?? {}),
});

export type NotificationEventConfig = z.infer<typeof eventConfigSchema>;
export type NotificationsConfig = z.infer<typeof notificationsConfigSchema>;

function validateConfig(raw: unknown): NotificationsConfig {
    try {
        return notificationsConfigSchema.parse(raw);
    } catch (e) {
        if (e instanceof ZodError) {
            const errors = e.errors
                .map((err) => `❌ ${err.path.join('.')}: ${err.message}`)
                .join('\n');

            const error = new Error(`
[NotificationsConfig] Validation Errors:
${errors}

Please fix the notifications config file and restart the application.`);

            error.stack = '';
            throw error;
        }

        const error = new Error(`Notifications config error: ${e}`);
        error.stack = '';
        throw error;
    }
}

const CONFIG_FILENAME = 'notifications-config.yml';

export default registerAs('notifications', (): NotificationsConfig => {
    const configPath = join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        'configs/notifications/',
        CONFIG_FILENAME,
    );

    if (!existsSync(configPath)) {
        return { events: {} };
    }

    const content = readFileSync(configPath, 'utf8');
    const raw = yaml.load(content);

    return validateConfig(raw);
});
