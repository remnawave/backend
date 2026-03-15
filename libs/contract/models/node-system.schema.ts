import { z } from 'zod';

export const NodeSystemInfoSchema = z.object({
    arch: z.string(),
    cpus: z.number().int(),
    cpuModel: z.string(),
    memoryTotal: z.number(),
    hostname: z.string(),
    platform: z.string(),
    release: z.string(),
    type: z.string(),
    version: z.string(),
    networkInterfaces: z.array(z.string()),
});

export type TNodeSystemInfo = z.infer<typeof NodeSystemInfoSchema>;

export const NodeSystemStatsSchema = z.object({
    memoryFree: z.number(),
    uptime: z.number(),
});

export type TNodeSystemStats = z.infer<typeof NodeSystemStatsSchema>;

export const NodeSystemSchema = z.object({
    info: NodeSystemInfoSchema,
    stats: NodeSystemStatsSchema,
});

export type TNodeSystem = z.infer<typeof NodeSystemSchema>;
