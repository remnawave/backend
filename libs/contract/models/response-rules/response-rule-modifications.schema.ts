import z from 'zod';

export const ResponseRuleModificationsSchema = z
    .object({
        headers: z
            .array(
                z
                    .object({
                        key: z
                            .string()
                            .regex(
                                /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/,
                                'Invalid header name. Only letters(a-z, A-Z), numbers(0-9), underscores(_) and hyphens(-) are allowed.',
                            )
                            .describe(
                                JSON.stringify({
                                    markdownDescription:
                                        'Key of the response header. Must comply with RFC 7230.',
                                }),
                            ),
                        value: z
                            .string()
                            .min(1, 'Value is required')
                            .describe(
                                JSON.stringify({
                                    markdownDescription: 'Value of the response header. ',
                                }),
                            ),
                    })
                    .describe(
                        JSON.stringify({
                            markdownDescription:
                                '**Key** and **value** of the response header will be added to the response.',
                        }),
                    ),
            )
            .describe(
                JSON.stringify({
                    defaultSnippets: [
                        {
                            label: 'Examples: Add custom header',
                            markdownDescription: 'Add a custom header to the response',
                            body: [
                                {
                                    key: 'X-Custom-Header',
                                    value: 'CustomValue',
                                },
                            ],
                        },
                    ],
                    markdownDescription: 'Array of headers to be added when the rule is matched.',
                }),
            )
            .optional(),
    })
    .optional()
    .describe(
        JSON.stringify({
            examples: [
                {
                    headers: [
                        {
                            key: 'X-Custom-Header',
                            value: 'CustomValue',
                        },
                    ],
                },
            ],
            markdownDescription:
                'Response modifications to be applied when the rule is matched. Optional.',
        }),
    );
