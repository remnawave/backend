import { load } from 'js-yaml';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z, ZodError } from 'zod';

import { registerAs } from '@nestjs/config';

import { YAML_MERGE_SCHEMA } from '@common/utils';
import { isProduction } from '@common/utils/startup-app';
import { EVENTS } from '@libs/contracts/constants';

const ALL_EVENTS = [
    ...Object.values(EVENTS.USER),
    ...Object.values(EVENTS.USER_HWID_DEVICES),
    ...Object.values(EVENTS.NODE),
    ...Object.values(EVENTS.SERVICE),
    ...Object.values(EVENTS.ERRORS),
    ...Object.values(EVENTS.CRM),
    ...Object.values(EVENTS.TORRENT_BLOCKER),
    ...Object.values(EVENTS.ABUSE_BLOCKER),
] as const;

const eventConfigSchema = z.object({
    telegram: z.boolean(),
    webhook: z.boolean(),
    additionalWebhookUrls: z.array(z.url()).optional(),
});

const notificationsConfigSchema = z.object({
    events: z
        .partialRecord(z.enum(ALL_EVENTS as [string, ...string[]]), eventConfigSchema)
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
            const errors = e.issues
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

const PRODUCTION_CONFIG_PATH = '/var/lib/remnawave/configs/notifications/notifications-config.yml';

const LOCAL_CONFIG_FILENAME = join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'configs/notifications/notifications-config.yml',
);

export default registerAs('notifications', (): NotificationsConfig => {
    const configPath = isProduction() ? PRODUCTION_CONFIG_PATH : LOCAL_CONFIG_FILENAME;

    if (!existsSync(configPath)) {
        return { events: {} };
    }

    const content = readFileSync(configPath, 'utf8');
    const raw = load(content, { schema: YAML_MERGE_SCHEMA });

    return validateConfig(raw);
});
