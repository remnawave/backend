export const CONTROLLERS_INFO = {
    AUTH: {
        tag: 'Auth Controller',
        description: 'Used to authenticate admin users.',
    },
    API_TOKENS: {
        tag: 'API Tokens Controller',
        description:
            "Manage API tokens to use in your code. This controller can't be used with API token, only with Admin JWT token",
    },
    USERS: {
        tag: 'Users Controller',
        description: 'Manage users, change their status, reset traffic, etc.',
    },
    USERS_BULK_ACTIONS: {
        tag: 'Users Bulk Actions Controller',
        description: 'Bulk actions with users.',
    },
    USERS_STATS: {
        tag: 'Users Stats Controller',
        description: '',
    },
    HWID_USER_DEVICES: {
        tag: 'HWID User Devices Controller',
        description: '',
    },
    SUBSCRIPTION: {
        tag: '[Public] Subscription Controller',
        description:
            'Public Subscription Controller. Methods of this controller are not protected with auth. Use it only for public requests.',
    },
    SUBSCRIPTIONS: {
        tag: '[Protected] Subscriptions Controller',
        description:
            'Methods of this controller are protected with auth, most of them is returning the same informations as public Subscription Controller.',
    },
    CONFIG_PROFILES: {
        tag: 'Config Profiles Controller',
        description: 'Management of Config Profiles.',
    },
    INTERNAL_SQUADS: {
        tag: 'Internal Squads Controller',
        description: 'Management of Internal Squads.',
    },
    NODES: {
        tag: 'Nodes Controller',
        description: '',
    },
    HOSTS: {
        tag: 'Hosts Controller',
        description: '',
    },
    HOSTS_BULK_ACTIONS: {
        tag: 'Hosts Bulk Actions Controller',
        description: '',
    },
    SUBSCRIPTION_TEMPLATE: {
        tag: 'Subscription Template Controller',
        description: '',
    },
    SUBSCRIPTION_SETTINGS: {
        tag: 'Subscription Settings Controller',
        description: '',
    },
    INFRA_BILLING: {
        tag: 'Infra Billing Controller',
        description: '',
    },
    SYSTEM: {
        tag: 'System Controller',
        description: '',
    },
    BANDWIDTH_STATS: {
        tag: 'Bandwidth Stats Controller',
        description: '',
    },
    KEYGEN: {
        tag: 'Keygen Controller',
        description: 'Generation of SSL_CERT for Remnawave Node.',
    },
    SUBSCRIPTION_REQUEST_HISTORY: {
        tag: 'Subscription Request History Controller',
        description: '',
    },
    SNIPPETS: {
        tag: 'Snippets Controller',
        description: '',
    },
} as const;
