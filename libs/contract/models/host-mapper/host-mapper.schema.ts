import { z } from 'zod';

const buildFromSchema = () =>
    z
        .string()
        .min(1)
        .max(512)
        .meta({
            title: 'Source path',
            markdownDescription: [
                'Dot-separated path inside the **raw inbound** of the config profile this host belongs to. Array items are addressed by index.',
                '',
                'With a `$host.` prefix the value is read from the **host** itself, after overrides have been resolved – `$host.securityOptions.serverName` holds the SNI that actually went into the config.',
                '',
                'Only a part of the host is readable. Each entry below also opens everything nested under it:',
                '',
                '`address`, `port`, `finalRemark`, `protocol`, `transport`, `security`, `protocolOptions`, `transportOptions`, `securityOptions`, `mux`, `streamOverrides.finalMask`, `streamOverrides.sockopt`, `clientOverrides.serverDescription`, `metadata.remark`, `metadata.tags`, `metadata.inboundTag`',
                '',
                'With a `$self.` prefix the value is read from the **generated config** itself, including everything earlier operations wrote. In Base64 that is the query string, or the link itself for operations with a `$link.` target.',
                '',
                '> If the path resolves to nothing – or points outside the list above – the operation is skipped and the target key is **not** created.',
            ].join('\n'),
            examples: [
                'streamSettings.tlsSettings.cipherSuites',
                'streamSettings.tlsSettings.alpn',
                'streamSettings.realitySettings.serverNames.0',
                '$host.address',
                '$host.securityOptions.serverName',
                '$host.transportOptions.path',
                '$host.mux.smux',
                '$self.tls.server_name',
                '$self.sni',
            ],
        });

const buildToSchema = (client: { examples: string[]; target: string }) =>
    z
        .string()
        .min(1)
        .max(512)
        .meta({
            title: 'Target path',
            markdownDescription: [
                `Dot-separated path inside ${client.target}, counted from its root.`,
                '',
                'Missing objects along the path are created. Array items are addressed by index, and keys with dashes are written as is (`ip-version`).',
                '',
                '> A path running through a value that is not an object – for example `path.foo`, where `path` holds a string – is refused, so an existing value is never destroyed.',
            ].join('\n'),
            examples: client.examples,
        });

const buildMatchPathSchema = () =>
    z
        .string()
        .min(1)
        .max(512)
        .meta({
            title: 'Path',
            markdownDescription: [
                'The value to check. Without a prefix it is read from the **raw inbound**, with `$host.` from the **host** – the same paths `copy` accepts.',
                '',
                'With `$self.` it is read from the **generated config**, including everything earlier operations wrote. In Base64 that is the query string, or the link itself for operations with a `$link.` target.',
                '',
                '> A path outside the readable part of the host never satisfies the condition, not even `exists: false`.',
            ].join('\n'),
            examples: [
                '$host.security',
                '$host.transport',
                '$host.metadata.tags',
                '$self.tls.utls',
                'streamSettings.realitySettings.serverNames',
            ],
        });

const MatchScalarSchema = z.union([z.string(), z.number(), z.boolean()]);

const HostMapperMatchSchema = z
    .union([
        z
            .strictObject({
                path: buildMatchPathSchema(),
                equals: MatchScalarSchema.meta({
                    title: 'Equals',
                    markdownDescription: 'The value must be exactly this.',
                }),
            })
            .meta({ title: 'Equals' }),
        z
            .strictObject({
                path: buildMatchPathSchema(),
                in: z.array(MatchScalarSchema).min(1).meta({
                    title: 'In',
                    markdownDescription: 'The value must be one of these.',
                }),
            })
            .meta({ title: 'In' }),
        z
            .strictObject({
                path: buildMatchPathSchema(),
                contains: MatchScalarSchema.meta({
                    title: 'Contains',
                    markdownDescription:
                        'An array must hold this item. A string must contain this substring.',
                }),
            })
            .meta({ title: 'Contains' }),
        z
            .strictObject({
                path: buildMatchPathSchema(),
                exists: z.boolean().meta({
                    title: 'Exists',
                    markdownDescription:
                        '`true` – the value is present. `false` – it is missing or `null`.',
                }),
            })
            .meta({ title: 'Exists' }),
    ])
    .meta({
        title: 'Field condition',
        markdownDescription:
            'A path and exactly one check: `equals`, `in`, `contains` or `exists`.',
    });

const HostMapperWhenSchema = z
    .object({
        srrRule: z
            .array(z.string().min(1).max(255))
            .min(1)
            .optional()
            .meta({
                title: 'SRR rule',
                markdownDescription: [
                    'Names of Subscription Response Rules. The operation runs only when the request was matched by one of them.',
                    '',
                    'Requests matched by no rule never satisfy this condition. The raw subscription endpoint is matched as `RAW`.',
                    '',
                    '> Rules are referenced by name – renaming a rule silently disables the condition.',
                ].join('\n'),
                examples: [['Happ', 'Streisand']],
            }),
        match: z.array(HostMapperMatchSchema).min(1).max(20).optional().meta({
            title: 'Field conditions',
            markdownDescription:
                'Checks on the host, the raw inbound or the generated config. All of them must pass.',
        }),
    })
    .meta({
        title: 'Condition',
        markdownDescription: [
            'The operation runs only when every listed condition is met. Without `when` it always runs.',
            '',
            '```json',
            JSON.stringify(
                {
                    srrRule: ['Happ'],
                    match: [
                        { path: '$host.security', in: ['reality', 'tls'] },
                        { path: '$host.metadata.tags', contains: 'cdn' },
                    ],
                },
                null,
                2,
            ),
            '```',
        ].join('\n'),
    });

const buildValueSchema = () =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.json()),
        z.record(z.string(), z.json()),
    ]);

const buildOperationsSchema = (client: {
    copySnippet: { from: string; to: string };
    examples: string[];
    pickSnippet: { to: string; values: unknown[] };
    setSnippet: { to: string; value: unknown };
    target: string;
    unsetSnippet: { to: string };
}) =>
    z
        .discriminatedUnion('op', [
            z
                .object({
                    op: z.literal('copy').meta({
                        title: 'Copy',
                        markdownDescription:
                            'Take a value from the raw inbound, the host or the generated config.',
                    }),
                    from: buildFromSchema(),
                    to: buildToSchema(client),
                    when: HostMapperWhenSchema.optional(),
                })
                .meta({
                    title: 'Copy a value',
                    markdownDescription: [
                        'Reads a value from the raw inbound, the host (`$host.`) or the generated config itself (`$self.`) and writes it into the generated config.',
                        '',
                        '```json',
                        JSON.stringify({ op: 'copy', ...client.copySnippet }, null, 2),
                        '```',
                    ].join('\n'),
                    defaultSnippets: [
                        {
                            label: 'copy',
                            description: 'Copy a value from the inbound, the host or the config',
                            body: { op: 'copy', from: '$1', to: '$2' },
                        },
                    ],
                }),

            z
                .object({
                    op: z.literal('set').meta({
                        title: 'Set',
                        markdownDescription: 'Write a fixed value.',
                    }),
                    value: buildValueSchema().meta({
                        title: 'Value',
                        markdownDescription:
                            'The value to write. Strings, numbers, booleans, arrays and objects are allowed.',
                    }),

                    to: buildToSchema(client),
                    when: HostMapperWhenSchema.optional(),
                })
                .meta({
                    title: 'Set a fixed value',
                    markdownDescription: [
                        'Writes a literal value into the generated config, creating the key if it is missing.',
                        '',
                        '```json',
                        JSON.stringify({ op: 'set', ...client.setSnippet }, null, 2),
                        '```',
                    ].join('\n'),
                    defaultSnippets: [
                        {
                            label: 'set',
                            description: 'Write a fixed value',
                            body: { op: 'set', to: '$1', value: '$2' },
                        },
                    ],
                }),

            z
                .object({
                    op: z.literal('pick').meta({
                        title: 'Pick',
                        markdownDescription: 'Write one of the listed values, chosen at random.',
                    }),
                    values: z.array(buildValueSchema()).min(1).max(100).meta({
                        title: 'Values',
                        markdownDescription:
                            'The values to choose from. A new one is picked on every subscription request. Strings, numbers, booleans, arrays and objects are allowed.',
                    }),

                    to: buildToSchema(client),
                    when: HostMapperWhenSchema.optional(),
                })
                .meta({
                    title: 'Pick a random value',
                    markdownDescription: [
                        'Writes one value from the list, chosen at random, into the generated config, creating the key if it is missing.',
                        '',
                        '```json',
                        JSON.stringify({ op: 'pick', ...client.pickSnippet }, null, 2),
                        '```',
                    ].join('\n'),
                    defaultSnippets: [
                        {
                            label: 'pick',
                            description: 'Write a random value from a list',
                            body: { op: 'pick', to: '$1', values: ['$2'] },
                        },
                    ],
                }),

            z
                .object({
                    op: z.literal('unset').meta({
                        title: 'Unset',
                        markdownDescription: 'Remove a field.',
                    }),
                    to: buildToSchema(client),
                    when: HostMapperWhenSchema.optional(),
                })
                .meta({
                    title: 'Remove a field',
                    markdownDescription: [
                        'Removes a field the generator produced by itself.',
                        '',
                        '```json',
                        JSON.stringify({ op: 'unset', ...client.unsetSnippet }, null, 2),
                        '```',
                        '',
                        '> Only the field itself is removed. A parent object left empty stays in the config as `{}`.',
                    ].join('\n'),
                    defaultSnippets: [
                        {
                            label: 'unset',
                            description: 'Remove a field',
                            body: { op: 'unset', to: '$1' },
                        },
                    ],
                }),
        ])
        .meta({
            title: 'Operation',
            markdownDescription: [
                'Operations run one after another, in the order they are listed.',
                '',
                'A later operation sees what the previous ones wrote, so an `unset` can remove a key an earlier `set` added.',
            ].join('\n'),
        });

export const XrayJsonHostMapperOperationsSchema = buildOperationsSchema({
    target: 'the generated **outbound**',
    examples: [
        'streamSettings.tlsSettings.enableSessionResumption',
        'streamSettings.tlsSettings.cipherSuites',
    ],
    copySnippet: {
        from: 'streamSettings.tlsSettings.cipherSuites',
        to: 'streamSettings.tlsSettings.cipherSuites',
    },
    pickSnippet: {
        to: 'streamSettings.tlsSettings.fingerprint',
        values: ['chrome', 'firefox', 'safari'],
    },
    setSnippet: { to: 'streamSettings.tlsSettings.enableSessionResumption', value: true },
    unsetSnippet: { to: 'mux' },
});

export const MihomoHostMapperOperationsSchema = buildOperationsSchema({
    target: 'the generated **proxy node**',
    examples: ['ip-version', 'client-fingerprint', 'tfo', 'reality-opts.support-x25519mlkem768'],
    copySnippet: { from: 'streamSettings.realitySettings.serverNames.0', to: 'servername' },
    pickSnippet: { to: 'client-fingerprint', values: ['chrome', 'firefox', 'safari'] },
    setSnippet: { to: 'reality-opts.support-x25519mlkem768', value: true },
    unsetSnippet: { to: 'smux' },
});

export const SingBoxHostMapperOperationsSchema = buildOperationsSchema({
    target: 'the generated **outbound**',
    examples: [
        'domain_resolver',
        'multiplex.protocol',
        'packet_encoding',
        'tcp_fast_open',
        'tls.insecure',
        'tls.utls.fingerprint',
    ],
    copySnippet: { from: 'streamSettings.realitySettings.serverNames.0', to: 'tls.server_name' },
    pickSnippet: { to: 'tls.utls.fingerprint', values: ['chrome', 'firefox', 'safari'] },
    setSnippet: { to: 'tls.utls.fingerprint', value: 'chrome' },
    unsetSnippet: { to: 'multiplex' },
});

export const Base64HostMapperOperationsSchema = buildOperationsSchema({
    target: 'the query string of the generated **share link**, or the link itself with a `$link.` prefix',
    examples: [
        '$link.address',
        '$link.port',
        '$link.password',
        '$link.remark',
        '$link.method',
        'alpn',
        'authority',
        'cs',
        'encryption',
        'extra',
        'flow',
        'fm',
        'fp',
        'headerType',
        'heartbeatPeriod',
        'host',
        'mode',
        'mtu',
        'obfs',
        'obfs-password',
        'path',
        'pbk',
        'pcs',
        'pinSHA256',
        'pqv',
        'security',
        'serviceName',
        'sid',
        'sni',
        'spx',
        'tti',
        'type',
        'vcn',
    ],
    copySnippet: { from: 'streamSettings.realitySettings.serverNames.0', to: 'sni' },
    pickSnippet: { to: 'fp', values: ['chrome', 'firefox', 'safari'] },
    setSnippet: { to: 'fp', value: 'chrome' },
    unsetSnippet: { to: 'fm' },
});

export const HostMapperOperationsSchema = XrayJsonHostMapperOperationsSchema;

export const HostMapperSchema = z
    .object({
        xrayJson: z
            .array(XrayJsonHostMapperOperationsSchema)
            .optional()
            .meta({
                title: 'Xray JSON',
                markdownDescription: [
                    'Operations applied to the **outbound** generated for this host in the Xray JSON subscription. Paths are counted from the root of the outbound.',
                    '',
                    '```json',
                    JSON.stringify(
                        [
                            {
                                op: 'copy',
                                from: 'streamSettings.tlsSettings.cipherSuites',
                                to: 'streamSettings.tlsSettings.cipherSuites',
                            },
                            { op: 'unset', to: 'mux' },
                        ],
                        null,
                        2,
                    ),
                    '```',
                ].join('\n'),
            }),
        mihomo: z
            .array(MihomoHostMapperOperationsSchema)
            .optional()
            .meta({
                title: 'Mihomo',
                markdownDescription: [
                    'Operations applied to the **proxy node** generated for this host in the Mihomo subscription.',
                    '',
                    'Paths are counted from the root of the node, where Mihomo keys are written in kebab-case.',
                    '',
                    '```json',
                    JSON.stringify([{ op: 'set', to: 'ip-version', value: 'ipv4' }], null, 2),
                    '```',
                ].join('\n'),
            }),
        base64: z
            .array(Base64HostMapperOperationsSchema)
            .optional()
            .meta({
                title: 'Base64',
                markdownDescription: [
                    'Operations applied to the share link generated for this host in the Base64 subscription.',
                    '',
                    '`to` is a plain query parameter name, not a path – dots carry no meaning here.',
                    '',
                    'With a `$link.` prefix the operation rewrites the link itself instead of its query string. Writable parts: `$link.address`, `$link.port`, `$link.password`, `$link.remark`, and `$link.method` for Shadowsocks. `$link.password` is the credential of the protocol.',
                    '',
                    '> A value that cannot make a valid link – an empty address, a port outside 1-65535 – is ignored, and the generated one is kept.',
                    '',
                    '```json',
                    JSON.stringify(
                        [
                            { op: 'set', to: 'fp', value: 'chrome' },
                            { op: 'unset', to: 'fm' },
                            { op: 'set', to: '$link.port', value: 2053 },
                            {
                                op: 'copy',
                                from: '$host.securityOptions.serverName',
                                to: '$link.address',
                            },
                        ],
                        null,
                        2,
                    ),
                    '```',
                ].join('\n'),
            }),
        singbox: z
            .array(SingBoxHostMapperOperationsSchema)
            .optional()
            .meta({
                title: 'sing-box',
                markdownDescription: [
                    'Operations applied to the **outbound** generated for this host in the sing-box subscription. Paths are counted from the root of the outbound.',
                    '',
                    'sing-box keys are written in snake_case, and the outbound of a Hysteria2 host has a shape of its own.',
                    '',
                    '```json',
                    JSON.stringify(
                        [
                            { op: 'set', to: 'tls.utls.fingerprint', value: 'chrome' },
                            { op: 'unset', to: 'multiplex' },
                        ],
                        null,
                        2,
                    ),
                    '```',
                ].join('\n'),
            }),
    })
    .meta({
        title: 'Host Mapper',
        markdownDescription: [
            'Rewrites the config generated for this host, per client type.',
            '',
            'Operations run **after** the generator has finished, so they can change or remove anything it produced.',
            '',
            'The source for `copy` is the raw inbound of the config profile this host belongs to, the host itself when the path starts with `$host.`, or the generated config when it starts with `$self.`.',
            '',
            '> `to` is never checked against the target client. A misspelled key is written exactly like a real one.',
        ].join('\n'),
    });

export type THostMapper = z.infer<typeof HostMapperSchema>;
export type THostMapperOperation = z.infer<typeof HostMapperOperationsSchema>;
export type THostMapperWhen = z.infer<typeof HostMapperWhenSchema>;
export type THostMapperMatch = z.infer<typeof HostMapperMatchSchema>;
