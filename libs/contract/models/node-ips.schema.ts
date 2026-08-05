import { z } from 'zod';

import { NODE_IP_STATUSES } from '../constants/nodes/ip-statuses';

export const NodeIpSchema = z.object({
    ip: z.union([z.ipv4(), z.ipv6()]),
    status: z.enum(NODE_IP_STATUSES),
});

export const NodeIpsSchema = z.array(NodeIpSchema).max(64);

export type TNodeIp = z.infer<typeof NodeIpSchema>;
export type TNodeIps = z.infer<typeof NodeIpsSchema>;
