import { z } from 'zod';

export const SSH_TERMINAL_WS_PATH = '/api/node-ssh/ws';

export const SSH_TERMINAL_WS_PROTOCOL = 'rw';

const requestId = z.number().int().nonnegative();

export const SshOpenMessageSchema = z.object({
    t: z.literal('open'),
    host: z.string().min(1).max(253),
    port: z.number().int().min(1).max(65535),
    username: z.string().min(1).max(64),
    cols: z.number().int().min(1).max(1000),
    rows: z.number().int().min(1).max(1000),
});

export const SshResizeMessageSchema = z.object({
    t: z.literal('resize'),
    cols: z.number().int().min(1).max(1000),
    rows: z.number().int().min(1).max(1000),
});

export const SshIdentitiesReplySchema = z.object({
    t: z.literal('identities'),
    id: requestId,
    keys: z.array(z.string().min(1).max(4096)).max(16),
});

export const SshSignReplySchema = z.object({
    t: z.literal('sign'),
    id: requestId,
    signature: z.base64().max(2048),
});

export const SshHostKeyReplySchema = z.object({
    t: z.literal('hostkey'),
    id: requestId,
    accept: z.boolean(),
});

export const SshClientErrorSchema = z.object({
    t: z.literal('error'),
    id: requestId,
    message: z.string().max(500),
});

/** Browser -> panel. */
export const SshClientMessageSchema = z.discriminatedUnion('t', [
    SshOpenMessageSchema,
    SshResizeMessageSchema,
    SshIdentitiesReplySchema,
    SshSignReplySchema,
    SshHostKeyReplySchema,
    SshClientErrorSchema,
]);

/** Panel -> browser. */
export const SshServerMessageSchema = z.discriminatedUnion('t', [
    z.object({ t: z.literal('agent-identities'), id: requestId }),
    z.object({
        t: z.literal('agent-sign'),
        id: requestId,
        publicKey: z.base64().max(4096),
        data: z.base64().max(8192),
        hash: z.string().max(16).nullable(),
    }),
    z.object({
        t: z.literal('hostkey'),
        id: requestId,
        algo: z.string().max(64),
        fingerprint: z.string().max(128),
        key: z.base64().max(4096),
    }),
    z.object({ t: z.literal('ready') }),
    z.object({
        t: z.literal('exit'),
        code: z.number().int().nullable(),
        signal: z.string().max(32).nullable(),
    }),
    z.object({ t: z.literal('error'), message: z.string().max(500) }),
]);

export type TSshOpenMessage = z.infer<typeof SshOpenMessageSchema>;
export type TSshClientMessage = z.infer<typeof SshClientMessageSchema>;
export type TSshServerMessage = z.infer<typeof SshServerMessageSchema>;
