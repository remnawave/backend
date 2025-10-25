import isFQDN from 'validator/lib/isFQDN';
import isURL from 'validator/lib/isURL';
import z from 'zod';

export const PasskeySettingsSchema = z.object({
    enabled: z.boolean(),
    rpId: z.nullable(
        z.string().refine(
            (val) =>
                val === 'localhost' ||
                isFQDN(val, {
                    require_tld: true,
                }),
            'Must be a valid fully qualified domain name (FQDN), e.g. "remna.st"',
        ),
    ),
    origin: z.nullable(
        z.string().refine(
            (val) =>
                /^http[s]?:\/\/localhost:\d+$/.test(val) ||
                isURL(val, {
                    protocols: ['http', 'https'],
                    require_protocol: true,
                    require_valid_protocol: true,
                    allow_fragments: false,
                    allow_query_components: false,
                    allow_trailing_dot: false,
                }),
            'Must be a valid URL, e.g. "https://remna.st"',
        ),
    ),
});

export type TRemnawavePasskeySettings = z.infer<typeof PasskeySettingsSchema>;
