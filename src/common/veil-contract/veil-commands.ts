// Inline shim for the Veil command schemas.
//
// These mirror what `@remnawave/node-contract` exposes for Xray today
// (StartXrayCommand / StopXrayCommand / GetNodeHealthCheckCommand)
// and live here because the node-contract package version that ships
// them — published from the matching `feat(veil-core)` PR in
// remnawave/node — is not on npm yet.
//
// MIGRATION:
// Once node-contract@>=2.8.0 is published, delete this file and
// import the real namespaces from '@remnawave/node-contract':
//
//     import {
//         StartVeilCommand,
//         StopVeilCommand,
//         GetNodeHealthCheckVeilCommand,
//     } from '@remnawave/node-contract';
//
// The shapes here are kept identical to the upstream schemas so the
// swap is mechanical.

import { z } from 'zod';

const NODE_ROOT = '/node' as const;
const VEIL_CONTROLLER = 'veil' as const;
const VEIL_ROUTES = {
    START: 'start',
    STOP: 'stop',
    NODE_HEALTH_CHECK: 'healthcheck',
} as const;

const NodeSystemSchema = z.object({
    info: z.record(z.unknown()),
    stats: z.record(z.unknown()),
    interface: z.record(z.unknown()),
});

export namespace StartVeilCommand {
    export const url = `${NODE_ROOT}/${VEIL_CONTROLLER}/${VEIL_ROUTES.START}`;

    export const RequestSchema = z.object({
        internals: z.object({
            forceRestart: z.boolean().default(false),
            configHash: z.string(),
        }),
        serverConfig: z.string(),
        adminAddr: z.string().optional(),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isStarted: z.boolean(),
            version: z.string().nullable(),
            error: z.string().nullable(),
            nodeInformation: z.object({
                version: z.string().nullable(),
            }),
            system: NodeSystemSchema,
        }),
    });
    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace StopVeilCommand {
    export const url = `${NODE_ROOT}/${VEIL_CONTROLLER}/${VEIL_ROUTES.STOP}`;

    export const RequestSchema = z.object({}).strict();
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isStopped: z.boolean(),
        }),
    });
    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace GetNodeHealthCheckVeilCommand {
    export const url = `${NODE_ROOT}/${VEIL_CONTROLLER}/${VEIL_ROUTES.NODE_HEALTH_CHECK}`;

    export const RequestSchema = z.object({}).strict();
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isNodeOnline: z.boolean(),
            isVeilOnline: z.boolean(),
            veilVersion: z.string().nullable(),
            nodeVersion: z.string(),
        }),
    });
    export type Response = z.infer<typeof ResponseSchema>;
}
