export const CONTROLLERS_INFO = {
    USERS: {
        tag: 'Users Controller',
        description: 'Manage users, change their status, reset traffic, etc.',
        resource: 'users',
    },
    USERS_BULK_ACTIONS: {
        tag: 'Users Bulk Actions Controller',
        description: 'Bulk actions with users.',
        resource: 'users',
    },
    HWID_USER_DEVICES: {
        tag: 'HWID User Devices Controller',
        description: '',
        resource: 'hwid-user-devices',
    },
    SUBSCRIPTION: {
        tag: '[Public] Subscription Controller',
        description:
            'Public Subscription Controller. Methods of this controller are not protected with auth. Use it only for public requests.',
        resource: 'subscription',
    },
    SUBSCRIPTIONS: {
        tag: '[Protected] Subscriptions Controller',
        description:
            'Methods of this controller are protected with auth, most of them is returning the same informations as public Subscription Controller.',
        resource: 'subscriptions',
    },
    NODES: {
        tag: 'Nodes Controller',
        description: '',
        resource: 'nodes',
    },
    NODE_PLUGINS: {
        tag: 'Node Plugins Controller',
        description: '',
        resource: 'node-plugins',
    },
    NODE_SSH: {
        tag: 'Node SSH Controller',
        description: '',
        resource: 'node-ssh',
    },
    NODE_INTEGRATIONS: {
        tag: 'Node Integrations Controller',
        description: 'Management of Node Integrations.',
        resource: 'node-integrations',
    },
    BANDWIDTH_STATS: {
        tag: 'Bandwidth Stats Controller',
        description: '',
        resource: 'bandwidth-stats',
    },
    CONNECTIONS: {
        tag: 'Connections Controller',
        description: 'Management of connections by user and node.',
        resource: 'connections',
    },
    CONFIG_PROFILES: {
        tag: 'Config Profiles Controller',
        description: 'Management of Config Profiles.',
        resource: 'config-profiles',
    },
    INTERNAL_SQUADS: {
        tag: 'Internal Squads Controller',
        description: 'Management of Internal Squads.',
        resource: 'internal-squads',
    },
    EXTERNAL_SQUADS: {
        tag: 'External Squads Controller',
        description: 'Management of External Squads.',
        resource: 'external-squads',
    },
    HOSTS: {
        tag: 'Hosts Controller',
        description: '',
        resource: 'hosts',
    },
    HOSTS_BULK_ACTIONS: {
        tag: 'Hosts Bulk Actions Controller',
        description: '',
        resource: 'hosts',
    },
    SUBSCRIPTION_TEMPLATE: {
        tag: 'Subscription Template Controller',
        description: '',
        resource: 'subscription-template',
    },
    SUBSCRIPTION_SETTINGS: {
        tag: 'Subscription Settings Controller',
        description: '',
        resource: 'subscription-settings',
    },
    INFRA_BILLING: {
        tag: 'Infra Billing Controller',
        description: '',
        resource: 'infra-billing',
    },
    SYSTEM: {
        tag: 'System Controller',
        description: '',
        resource: 'system',
    },
    KEYGEN: {
        tag: 'Keygen Controller',
        description: 'Generation of SECRET_KEY for Remnawave Node.',
        resource: 'keygen',
    },
    SUBSCRIPTION_REQUEST_HISTORY: {
        tag: 'Subscription Request History Controller',
        description: '',
        resource: 'subscription-request-history',
    },
    SNIPPETS: {
        tag: 'Snippets Controller',
        description: '',
        resource: 'snippets',
    },
    REMNAAWAVE_SETTINGS: {
        tag: 'Remnawave Settings Controller',
        description: '',
        resource: 'remnawave-settings',
    },
    SUBSCRIPTION_PAGE_CONFIGS: {
        tag: 'Subscription Page Configs Controller',
        description: '',
        resource: 'subscription-page-configs',
    },
    METADATA: {
        tag: 'Metadata Controller',
        description: 'Manage arbitrary metadata for Users and Nodes.',
        resource: 'metadata',
    },
    AUTH: {
        tag: 'Auth Controller',
        description: 'Used to authenticate admin users.',
        resource: 'auth',
    },
    PASSKEYS: {
        tag: 'Passkeys Controller',
        description: 'Management of Passkeys.',
        resource: 'passkeys',
    },
    API_TOKENS: {
        tag: 'API Tokens Controller',
        description:
            "Manage API tokens to use in your code. This controller can't be used with API token, only with Admin JWT token",
        resource: 'api-tokens',
    },
} as const;
