import { z } from 'zod';

const DOCS_LINK = `\n\n[📖 Documentation](https://docs.rw)`;

export const SharedListSchema = z.object({
    name: z.string().startsWith('ext:'),
    type: z.enum(['ipList']),
    items: z.array(z.string()),
});

export const TorrentBlockerPluginSchema = z.object({
    enabled: z.boolean().describe(
        JSON.stringify({
            markdownDescription: `Please review documentation for this plugin before enabling it.${DOCS_LINK}`,
        }),
    ),
    blockDuration: z
        .number()
        .int()
        .describe(
            JSON.stringify({
                markdownDescription: `Duration of the block in seconds. \n\n If the block duration is 0, the block will be permanent. \n\n For example, if the block duration is 3600, the block will be permanent for 1 hour.${DOCS_LINK}`,
            }),
        ),
    ignoreLists: z
        .object({
            ip: z
                .array(z.union([z.string().ip(), z.string().startsWith('ext:')]))
                .optional()
                .default([])
                .describe(
                    JSON.stringify({
                        markdownDescription: `List of IP addresses to ignore from the block. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**. \n\n You can also specify user IDs to ignore from the block.${DOCS_LINK}`,
                    }),
                ),
            userId: z
                .array(z.number().int())
                .optional()
                .default([])
                .describe(
                    JSON.stringify({
                        markdownDescription: `List of user IDs to ignore from the block. \n\n You can also specify user IDs to ignore from the block.${DOCS_LINK}`,
                    }),
                ),
        })
        .describe(
            JSON.stringify({
                markdownDescription: `List of IP addresses to ignore from the block. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**. \n\n You can also specify user IDs to ignore from the block.${DOCS_LINK}`,
            }),
        ),
});

export const BlacklistPluginSchema = z.object({
    enabled: z.boolean().describe(
        JSON.stringify({
            markdownDescription: `If this plugin is enabled, all IP addresses specified in the **ip** object will be blocked via nftables. **Use with caution.**${DOCS_LINK}`,
        }),
    ),
    ip: z.array(z.union([z.string().ip(), z.string().startsWith('ext:')])).describe(
        JSON.stringify({
            markdownDescription: `List of IP addresses to block via nftables. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**.${DOCS_LINK}`,
        }),
    ),
});

export const ConnectionDropPluginSchema = z.object({
    enabled: z.boolean().describe(
        JSON.stringify({
            markdownDescription: `Controls whether IP addresses from the **whitelistIps** object will be used.${DOCS_LINK}`,
        }),
    ),
    whitelistIps: z.array(z.union([z.string().ip(), z.string().startsWith('ext:')])).describe(
        JSON.stringify({
            markdownDescription: `List of IP addresses, for which the connection drop will not be applied, which is enabled by default for all IP addresses. \n\n You can use lists from **sharedLists** in the format: **ext:list_name**.${DOCS_LINK}`,
        }),
    ),
});

export const NodePluginSchema = z.object({
    sharedLists: z
        .array(SharedListSchema)
        .optional()
        .default([])
        .describe(
            JSON.stringify({
                markdownDescription: `Array of shared lists, which can be used in other plugins. Optional.${DOCS_LINK}`,
            }),
        ),
    torrentBlocker: TorrentBlockerPluginSchema.optional().describe(
        JSON.stringify({
            markdownDescription: `Torrent Blocker Plugin configuration. Optional.${DOCS_LINK}`,
        }),
    ),
    blacklist: BlacklistPluginSchema.optional().describe(
        JSON.stringify({
            markdownDescription: `Blacklist Plugin configuration. Optional.${DOCS_LINK}`,
        }),
    ),
    connectionDrop: ConnectionDropPluginSchema.optional().describe(
        JSON.stringify({
            markdownDescription: `Connection Drop Plugin configuration. Optional.${DOCS_LINK}`,
        }),
    ),
});

export type TNodePlugin = z.infer<typeof NodePluginSchema>;
