import { z } from 'zod';

export const NetworkInterfaceSchema = z.object({
    interface: z.string(),
    rxBytesPerSec: z.number(),
    txBytesPerSec: z.number(),
    rxTotal: z.number(),
    txTotal: z.number(),
});

export const WarpStatusSchema = z.object({
    installed: z.boolean(),
    running: z.boolean(),
    interfaceName: z.string().nullable(),
    publicIp: z.string().nullable(),
    warp: z.enum(['on', 'off', 'unknown']),
    colo: z.string().nullable(),
    lastError: z.string().nullable(),
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
    warp: z.optional(WarpStatusSchema),
});

export type TNodeSystemStats = z.infer<typeof NodeSystemStatsSchema>;

export const NodeSystemSchema = z.object({
    info: NodeSystemInfoSchema,
    stats: NodeSystemStatsSchema,
});

export type TNetworkInterface = z.infer<typeof NetworkInterfaceSchema>;
export type TNodeSystemInfo = z.infer<typeof NodeSystemInfoSchema>;
export type TNodeSystem = z.infer<typeof NodeSystemSchema>;
export type TWarpStatus = z.infer<typeof WarpStatusSchema>;
