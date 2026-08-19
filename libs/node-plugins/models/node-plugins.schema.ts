import { z } from 'zod';

const DOCS_LINK = `\n\n[📖 Documentation](https://docs.rw/docs/learn/node-plugins)`;

// https://github.com/colinhacks/zod/issues/5944
const IPV6 = z.regexes.ipv6.source.slice(1, -1);

const ipv6 = () => z.string().regex(new RegExp(`^(${IPV6})$`), { error: 'Invalid IPv6 address' });
const cidrv6 = () =>
    z.string().regex(new RegExp(`^(${IPV6})\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$`), {
        error: 'Invalid IPv6 CIDR range',
    });

const IpCidrOrExtSchema = z
    .union([
        z.union([z.cidrv4(), cidrv6()]),
        z.union([z.ipv4(), ipv6()]),
        z.string().startsWith('ext:'),
    ])
    .meta({
        title: 'IP address or CIDR range',
        markdownDescription: `IP address or CIDR range. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**.${DOCS_LINK}`,
    });

const IpListSchema = z
    .object({
        type: z.literal('ipList').meta({
            title: 'IP List',
            markdownDescription: `A list of IP addresses and CIDR ranges.${DOCS_LINK}`,
        }),
        items: z.array(z.union([z.cidrv4(), cidrv6(), z.union([z.ipv4(), ipv6()])])).meta({
            title: 'IP addresses and CIDR ranges',
            markdownDescription: [
                'IPv4 and IPv6 addresses, plain or as CIDR ranges. Mixing both families in one list is allowed.',
                '',
                '```json',
                '{',
                '  "type": "ipList",',
                '  "items": ["1.1.1.1", "10.0.0.0/8", "2001:db8::1", "2001:db8::/32"]',
                '}',
                '```',
                DOCS_LINK,
            ].join('\n'),
        }),
    })
    .meta({
        title: 'IP List',
        markdownDescription: `Shared list of IP addresses and CIDR ranges.${DOCS_LINK}`,
    });

const AsListSchema = z
    .object({
        type: z.literal('asList').meta({
            title: 'AS List',
            markdownDescription: `A list of autonomous system numbers.${DOCS_LINK}`,
        }),
        items: z.array(z.int().min(1).max(4294967295)).meta({
            title: 'Autonomous system numbers',
            markdownDescription: [
                'ASN numbers without the `AS` prefix, from 1 to 4294967295.',
                '',
                '```json',
                '{',
                '  "type": "asList",',
                '  "items": [13335, 15169, 32934]',
                '}',
                '```',
                DOCS_LINK,
            ].join('\n'),
        }),
    })
    .meta({
        title: 'AS List',
        markdownDescription: `Shared list of autonomous system numbers.${DOCS_LINK}`,
    });

export const SharedListConfigSchema = z
    .discriminatedUnion('type', [IpListSchema, AsListSchema])
    .meta({
        title: 'Shared List',
        markdownDescription: `Shared list body. Pick **ipList** for IP addresses and CIDR ranges, or **asList** for autonomous system numbers.${DOCS_LINK}`,
    });

export const SharedListSchema = z.discriminatedUnion('type', [
    IpListSchema.extend({ name: z.string().startsWith('ext:') }),
    AsListSchema.extend({ name: z.string().startsWith('ext:') }),
]);

export const TorrentBlockerPluginSchema = z.object({
    enabled: z.boolean().meta({
        title: 'Enabled',
        markdownDescription: `Please review documentation for this plugin before enabling it.${DOCS_LINK}`,
    }),
    blockDuration: z.int().meta({
        title: 'Block Duration',
        markdownDescription: `Duration of the block in seconds. \n\n If the block duration is 0, the block will be permanent. \n\n For example, if the block duration is 3600, the block will be permanent for 1 hour.${DOCS_LINK}`,
    }),
    ignoreLists: z
        .object({
            ip: z
                .array(z.union([z.union([z.ipv4(), ipv6()]), z.string().startsWith('ext:')]))
                .optional()
                .meta({
                    title: 'IP',
                    markdownDescription: `List of IP addresses ranges to ignore from the block. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**. \n\n You can also specify user IDs to ignore from the block. Please note that this field only supports IP addresses ranges, not CIDR ranges.${DOCS_LINK}`,
                }),
            userId: z
                .array(z.int())
                .optional()
                .meta({
                    title: 'User ID',
                    markdownDescription: `List of user IDs to ignore from the block. \n\n You can also specify user IDs to ignore from the block.${DOCS_LINK}`,
                }),
        })
        .meta({
            title: 'Ignore Lists',
            markdownDescription: `List of IP addresses to ignore from the block. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**. \n\n You can also specify user IDs to ignore from the block.${DOCS_LINK}`,
        }),
    includeRuleTags: z.optional(z.array(z.string()).min(1)).meta({
        title: 'Include Rule Tags',
        markdownDescription: `By default, Torrent Blocker creates a dedicated rule and injects it as **routing.rules[0]**. Specify an array of **ruleTag** values here if you want to block IPs matched by other routing rules as well.${DOCS_LINK}`,
    }),
    webhookUrl: z.optional(z.url()).meta({
        title: 'Webhook URL',
        markdownDescription: `Optional. Additional webhook URL to send to when a block is triggered.${DOCS_LINK}`,
    }),
    rulePlacement: z
        .number()
        .min(0)
        .max(1000)
        .optional()
        .default(0)
        .meta({
            title: 'Rule Placement',
            markdownDescription: `The position of the rule which Remnawave will inject into the routing.rules array. The default is 0. ${DOCS_LINK}`,
        }),
});

export const ConnectionDropPluginSchema = z.object({
    enabled: z.boolean().meta({
        title: 'Enabled',
        markdownDescription: `Controls whether IP addresses from the **whitelistIps** object will be used.${DOCS_LINK}`,
    }),
    whitelistIps: z
        .array(z.union([z.union([z.ipv4(), ipv6()]), z.string().startsWith('ext:')]))
        .meta({
            title: 'Whitelist IPs',
            markdownDescription: `List of IP addresses, for which the connection drop will not be applied, which is enabled by default for all IP addresses. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**. Please note that this field only supports IP addresses ranges, not CIDR ranges.${DOCS_LINK}`,
        }),
});

export const IngressFilterPluginSchema = z.object({
    enabled: z.boolean().meta({
        title: 'Enabled',
        markdownDescription: `If this plugin is enabled, all IP addresses specified in the **blockedIps** object will be blocked via nftables. **Use with caution.**${DOCS_LINK}`,
    }),
    blockedIps: z.array(IpCidrOrExtSchema).meta({
        title: 'Blocked IPs',
        markdownDescription: `List of IP addresses and CIDR ranges to block via nftables. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**.${DOCS_LINK}`,
    }),
});

export const EgressFilterPluginSchema = z.object({
    enabled: z.boolean().meta({
        title: 'Enabled',
        markdownDescription: `If this plugin is enabled, outbound connections to specified IP addresses and ports will be blocked. **Use with caution.**${DOCS_LINK}`,
    }),
    blockedIps: z
        .array(IpCidrOrExtSchema)
        .optional()
        .meta({
            title: 'Blocked IPs',
            markdownDescription: `List of destination IP addresses and CIDR ranges to block. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**. \n\n Example: \`["10.0.0.1", "ext:blocked_destinations"]\`${DOCS_LINK}`,
        }),
    blockedPorts: z
        .array(z.int().min(1).max(65535))
        .optional()
        .meta({
            title: 'Blocked Ports',
            markdownDescription: `List of destination ports to block. \n\n Example: \`[25, 465, 587]\` to block SMTP traffic.${DOCS_LINK}`,
        }),
});

const cleanupPathSchema = z
    .string()
    .trim()
    .min(1, { message: 'Path must not be empty' })
    .refine((v) => v.startsWith('/'), {
        message: 'Path must be absolute (start with "/")',
    })
    .refine((v) => !v.includes('\0'), {
        message: 'Path must not contain null bytes',
    });

export const preStartPluginSchema = z.object({
    enabled: z
        .boolean()
        .default(false)
        .meta({
            title: 'Enabled',
            markdownDescription: `Enables the pre-start stage. All enabled sections below run every time before the Xray-Core process starts — on node startup, on core restart, and after any configuration change that triggers a core reload. If a section fails, the failure is logged and the core still starts.${DOCS_LINK}`,
        }),
    cleanupSockets: z
        .object({
            enabled: z.boolean().meta({
                title: 'Enable socket cleanup',
                markdownDescription: `Removes stale unix socket files left behind by a previous core process that did not shut down cleanly. Such leftovers make Xray-Core fail to bind with \`address already in use\`. Only entries that are actually unix sockets are removed — regular files, directories and symlinks are always skipped.${DOCS_LINK}`,
            }),
            files: z
                .array(cleanupPathSchema)
                .max(64, { message: 'No more than 64 entries allowed' })
                .meta({
                    title: 'Files',
                    markdownDescription: `Absolute paths to socket files. Glob patterns are supported (\`*\`, \`?\`, \`[…]\`), for example \`/dev/shm/*.sock\`. Paths that do not exist are skipped silently.${DOCS_LINK}`,
                }),
        })
        .optional()
        .meta({
            title: 'Cleanup Sockets',
            markdownDescription: `Stale unix socket removal before the core starts.${DOCS_LINK}`,
        }),
});

export const NodePluginSchema = z.object({
    sharedLists: z
        .array(SharedListSchema)
        .optional()
        .default([])
        .meta({
            title: 'Shared Lists',
            markdownDescription: `Array of shared lists, which can be used in other plugins. Optional.${DOCS_LINK}`,
        }),
    torrentBlocker: TorrentBlockerPluginSchema.optional().meta({
        title: 'Torrent Blocker',
        markdownDescription: `Torrent Blocker Plugin configuration. Optional.${DOCS_LINK}`,
    }),
    ingressFilter: IngressFilterPluginSchema.optional().meta({
        title: 'Ingress Filter',
        markdownDescription: `Ingress Filter Plugin configuration. Optional.${DOCS_LINK}`,
    }),
    egressFilter: EgressFilterPluginSchema.optional().meta({
        title: 'Egress Filter',
        markdownDescription: `Egress Filter Plugin configuration. Optional.${DOCS_LINK}`,
    }),
    connectionDrop: ConnectionDropPluginSchema.optional().meta({
        title: 'Connection Drop',
        markdownDescription: `Connection Drop Plugin configuration. Optional.${DOCS_LINK}`,
    }),
    preStart: preStartPluginSchema.optional().meta({
        title: 'Pre-Start',
        markdownDescription: `Pre-Start Plugin configuration. Optional.${DOCS_LINK}`,
    }),
});

export const NodePluginEditorSchema = NodePluginSchema.omit({ sharedLists: true });

export type TSharedListConfig = z.infer<typeof SharedListConfigSchema>;
export type TNodePlugin = z.infer<typeof NodePluginSchema>;
export type TNodePluginEditor = z.infer<typeof NodePluginEditorSchema>;
