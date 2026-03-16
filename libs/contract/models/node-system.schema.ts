import { z } from 'zod';

export const NetworkInterfaceSchema = z.object({
    interface: z.string(),
    rxBytesPerSec: z.number(),
    txBytesPerSec: z.number(),
    rxTotal: z.number(),
    txTotal: z.number(),
});

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

export const NodeSystemStatsSchema = z.object({
    memoryFree: z.number(),
    memoryUsed: z.number(),
    uptime: z.number(),
    loadAvg: z.array(z.number()),
    interface: z.nullable(NetworkInterfaceSchema),
});

export type TNodeSystemStats = z.infer<typeof NodeSystemStatsSchema>;

export const NodeSystemSchema = z.object({
    info: NodeSystemInfoSchema,
    stats: NodeSystemStatsSchema,
});

export type TNetworkInterface = z.infer<typeof NetworkInterfaceSchema>;
export type TNodeSystemInfo = z.infer<typeof NodeSystemInfoSchema>;
export type TNodeSystem = z.infer<typeof NodeSystemSchema>;
