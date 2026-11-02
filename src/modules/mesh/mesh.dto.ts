import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const name = z.string().regex(/^[a-z][a-z0-9]{1,7}$/);
export const FlagsSchema = z
    .strictObject({
        auto_switch: z.boolean().optional(),
        auto_relay: z.boolean().optional(),
        auto_ip_update: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'At least one flag is required');
export class MeshFlagsDto extends createZodDto(FlagsSchema) {}
export class MeshPinDto extends createZodDto(
    z.strictObject({ node: z.string().min(1).max(128), pinned: z.boolean() }),
) {}
export class MeshNameDto extends createZodDto(z.strictObject({ name })) {}
export class MeshEtcdDto extends createZodDto(z.strictObject({ name, member: z.boolean() })) {}
export class MeshRelayDto extends createZodDto(
    z.strictObject({ exit: name, mode: z.enum(['auto', 'direct', 'relay']) }),
) {}
export class MeshJobDto extends createZodDto(
    z.strictObject({ id: z.string().regex(/^[a-f0-9]{6,32}$/) }),
) {}
// Credentials are used only for the explicit onboarding request; never stored by the panel.
export const NodeSchema = z
    .strictObject({
        name,
        host: z.ipv4(),
        user: z
            .string()
            .regex(/^[a-z_][a-z0-9_-]{0,31}$/)
            .default('root'),
        role: z.enum(['entry', 'exit']),
        rw_node: z.string().min(1).max(128).optional(),
        etcd: z.boolean().optional(),
        password: z.string().min(1).max(4096).optional(),
        private_key: z.string().min(1).max(16384).optional(),
    })
    .refine(
        (body) => Boolean(body.password) !== Boolean(body.private_key),
        'Supply exactly one authentication method',
    );
export class MeshNodeDto extends createZodDto(NodeSchema) {}
