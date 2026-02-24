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
        applyHeadersToEnd: z
            .boolean()
            .optional()
            .describe(
                JSON.stringify({
                    markdownDescription:
                        'By default, headers are added when forming the response. In some cases, headers set in SRR may be overridden by headers from other parts of the system. If you set this flag to **true**, headers from SRR will be added at the very end, just before the response is sent. In this case, SRR headers may override headers from other sections.',
                }),
            )
            .optional(),
        subscriptionTemplate: z
            .string()
            .min(1, 'Subscription template name is required')
            .optional()
            .describe(
                JSON.stringify({
                    markdownDescription:
                        'Override the subscription template with the given name. If not provided, the default subscription template will be used. If the template name is not found, the default subscription template for this type will be used. **This modification have higher priority than settings from External Squads.**',
                }),
            ),
        ignoreHostXrayJsonTemplate: z
            .boolean()
            .optional()
            .describe(
                JSON.stringify({
                    markdownDescription:
                        "Each Host may have its own Xray Json Template. If you set this flag to **true**, the Xray Json Template defined by the SRR will be used. **The Host's Xray Json Template will be ignored.**",
                }),
            ),
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
