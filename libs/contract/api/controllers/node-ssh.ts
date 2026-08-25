export const NODE_SSH_CONTROLLER = 'node-ssh' as const;

export const NODE_SSH_ROUTES = {
    CREATE_TICKET: (uuid: string) => `${uuid}/ticket`, // post
    EVALUATE_VAULT: 'vault/evaluate', // post
} as const;
