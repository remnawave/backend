import z from 'zod';

export const PasskeySettingsSchema = z.object({
    enabled: z.boolean(),
    rpId: z.nullable(
        z.string().refine(
            (val) => {
                if (val === 'localhost') {
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
                message: 'Must be a valid fully qualified domain name (FQDN), e.g. "remna.st"',
            },
        ),
    ),
    origin: z.nullable(
        z.string().refine(
            (value) => {
                if (/^http:\/\/localhost:\d+$/.test(value)) {
                    return true;
                }

                if (/^https:\/\/(?=.*\.[a-z]{2,})[^\s\/?#]+$/i.test(value)) {
                    return true;
                }

                return false;
            },
            {
                message: 'Must be a valid plain URL, e.g. "https://remna.st".',
            },
        ),
    ),
});

export type TRemnawavePasskeySettings = z.infer<typeof PasskeySettingsSchema>;
