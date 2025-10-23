import isFQDN from 'validator/lib/isFQDN';
import z from 'zod';

export const Oauth2SettingsSchema = z.object({
    github: z.object({
        enabled: z.boolean(),
        clientId: z.nullable(z.string()),
        clientSecret: z.nullable(z.string()),
        allowedEmails: z.array(z.string()),
    }),
    pocketid: z.object({
        enabled: z.boolean(),
        clientId: z.nullable(z.string()),
        clientSecret: z.nullable(z.string()),
        plainDomain: z.nullable(
            z.string().refine(
                (val) =>
                    val === 'localhost' ||
                    isFQDN(val, {
                        require_tld: true,
                    }),
                'Must be a valid fully qualified domain name (FQDN), e.g. "remna.st"',
            ),
        ),
        allowedEmails: z.array(z.string()),
    }),
    yandex: z.object({
        enabled: z.boolean(),
        clientId: z.nullable(z.string()),
        clientSecret: z.nullable(z.string()),
        allowedEmails: z.array(z.string()),
    }),
});

export type TOauth2Settings = z.infer<typeof Oauth2SettingsSchema>;
