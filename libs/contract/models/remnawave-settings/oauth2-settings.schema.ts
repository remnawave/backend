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
                (val) => {
                    const fqdnRegex =
                        /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$)/;
                    if (fqdnRegex.test(val)) {
                        return true;
                    }

                    return false;
                },
                {
                    message: 'Must be a valid fully qualified domain name (FQDN), e.g. "docs.rw"',
                },
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
    keycloak: z
        .object({
            enabled: z.boolean(),
            realm: z.nullable(z.string()),
            clientId: z.nullable(z.string()),
            clientSecret: z.nullable(z.string()),
            frontendDomain: z.nullable(
                z.string().refine(
                    (val) => {
                        const fqdnRegex =
                            /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$)/;
                        if (fqdnRegex.test(val)) {
                            return true;
                        }

                        return false;
                    },
                    {
                        message:
                            'Must be a valid fully qualified domain name (FQDN), e.g. "docs.rw"',
                    },
                ),
            ),
            keycloakDomain: z.nullable(
                z.string().refine(
                    (val) => {
                        const fqdnRegex =
                            /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$)/;
                        if (fqdnRegex.test(val)) {
                            return true;
                        }

                        return false;
                    },
                    {
                        message:
                            'Must be a valid fully qualified domain name (FQDN), e.g. "docs.rw"',
                    },
                ),
            ),
            allowedEmails: z.array(z.string()),
        })
        .default({
            enabled: false,
            realm: null,
            frontendDomain: null,
            keycloakDomain: null,
            clientId: null,
            clientSecret: null,
            allowedEmails: [],
        }),
    generic: z
        .object({
            enabled: z.boolean(),
            clientId: z.nullable(z.string()),
            clientSecret: z.nullable(z.string()),
            withPkce: z.boolean(),
            authorizationUrl: z.nullable(z.string()),
            tokenUrl: z.nullable(z.string()),

            frontendDomain: z.nullable(
                z.string().refine(
                    (val) => {
                        if (val.startsWith('127.0.0.1') || val.startsWith('localhost')) {
                            return true;
                        }

                        const fqdnRegex =
                            /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$)/;
                        if (fqdnRegex.test(val)) {
                            return true;
                        }

                        return false;
                    },
                    {
                        message:
                            'Must be a valid fully qualified domain name (FQDN), e.g. "docs.rw"',
                    },
                ),
            ),
            allowedEmails: z.array(z.string()),
        })
        .default({
            enabled: false,
            frontendDomain: null,
            tokenUrl: null,
            clientId: null,
            clientSecret: null,
            withPkce: false,
            authorizationUrl: null,
            allowedEmails: [],
        }),
});

export type TOauth2Settings = z.infer<typeof Oauth2SettingsSchema>;
