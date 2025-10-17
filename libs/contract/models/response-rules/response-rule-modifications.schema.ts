import z from 'zod';

const exampleJson = JSON.stringify(
    {
        headers: [
            {
                key: 'X-Custom-Header',
                value: 'Custom Value',
            },
        ],
    },
    null,
    2,
);

const exampleHeaderJson = JSON.stringify(
    [
        {
            key: 'X-Custom-Header',
            value: 'Custom Value',
        },
    ],
    null,
    2,
);

export const ResponseRuleModificationsSchema = z
    .object({
        headers: z
            .array(
                z.object({
                    key: z
                        .string()
                        .regex(
                            /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/,
                            'Invalid header name. Only letters(a-z, A-Z), numbers(0-9), underscores(_) and hyphens(-) are allowed.',
                        )
                        .describe(
                            JSON.stringify({
                                title: 'Key',
                                markdownDescription:
                                    'Key of the response header. Must comply with RFC 7230.',
                            }),
                        ),
                    value: z
                        .string()
                        .min(1, 'Value is required')
                        .describe(
                            JSON.stringify({
                                title: 'Value',
                                markdownDescription: 'Value of the response header. ',
                            }),
                        ),
                }),
            )
            .describe(
                JSON.stringify({
                    markdownDescription: `Array of headers to be added when the rule is matched.\n\nExample:\n\`\`\`json\n${exampleHeaderJson}\n\`\`\``,
                }),
            ),
    })

    .optional()
    .describe(
        JSON.stringify({
            markdownDescription: `Response modifications to be applied when the rule is matched.\n\nExample:\n\`\`\`json\n${exampleJson}\n\`\`\``,
        }),
    );
