export const ERRORS = {
    INTERNAL_SERVER_ERROR: { code: 'A001', message: 'Server error', httpCode: 500 },
    LOGIN_ERROR: { code: 'A002', message: 'Login error', httpCode: 500 },
    UNAUTHORIZED: { code: 'A003', message: 'Unauthorized', httpCode: 401 },
    FORBIDDEN_ROLE_ERROR: { code: 'A004', message: 'Forbidden role error', httpCode: 403 },
    CREATE_API_TOKEN_ERROR: { code: 'A005', message: 'Create API token error', httpCode: 500 },
    DELETE_API_TOKEN_ERROR: { code: 'A006', message: 'Delete API token error', httpCode: 500 },
    REQUESTED_TOKEN_NOT_FOUND: {
        code: 'A007',
        message: 'Requested token not found',
        httpCode: 404,
    },
    FIND_ALL_API_TOKENS_ERROR: {
        code: 'A008',
        message: 'Find all API tokens error',
        httpCode: 500,
    },
    GET_PUBLIC_KEY_ERROR: {
        code: 'A009',
        message: 'Get public key error',
        httpCode: 500,
    },
    ENABLE_NODE_ERROR: {
        code: 'A010',
        message: 'Enable node error',
        httpCode: 500,
    },
    NODE_NOT_FOUND: {
        code: 'A011',
        message: 'Node not found',
        httpCode: 404,
    },

    CONFIG_NOT_FOUND: {
        code: 'A012',
        message: 'Configuration not found',
        httpCode: 404,
    },
    UPDATE_CONFIG_ERROR: {
        code: 'A013',
        message: 'Error updating configuration',
        httpCode: 500,
    },
    GET_CONFIG_ERROR: {
        code: 'A014',
        message: 'Error retrieving configuration',
        httpCode: 500,
    },
    DELETE_MANY_INBOUNDS_ERROR: {
        code: 'A015',
        message: 'Delete many inbounds error',
        httpCode: 500,
    },
    CREATE_MANY_INBOUNDS_ERROR: {
        code: 'A016',
        message: 'Create many inbounds error',
        httpCode: 500,
    },
    FIND_ALL_INBOUNDS_ERROR: {
        code: 'A017',
        message: 'Find all inbounds error',
        httpCode: 500,
    },
    CREATE_USER_ERROR: {
        code: 'A018',
        message: 'Failed to create user',
        httpCode: 500,
    },
    USER_USERNAME_ALREADY_EXISTS: {
        code: 'A019',
        message: 'User username already exists',
        httpCode: 400,
    },
    USER_SHORT_UUID_ALREADY_EXISTS: {
        code: 'A020',
        message: 'User short UUID already exists',
        httpCode: 400,
    },
    USER_SUBSCRIPTION_UUID_ALREADY_EXISTS: {
        code: 'A021',
        message: 'User subscription UUID already exists',
        httpCode: 400,
    },
    CREATE_USER_WITH_INBOUNDS_ERROR: {
        code: 'A022',
        message: 'User creation successful, but inbound creation failed. User not created.',
        httpCode: 500,
    },
    CANT_GET_CREATED_USER_WITH_INBOUNDS: {
        code: 'A023',
        message: 'User creation successful, but failed to get created user with inbounds.',
        httpCode: 500,
    },
    GET_ALL_USERS_ERROR: {
        code: 'A024',
        message: 'Get all users error',
        httpCode: 500,
    },
    USER_NOT_FOUND: {
        code: 'A025',
        message: 'User not found',
        httpCode: 404,
    },
    GET_USER_BY_ERROR: {
        code: 'A026',
        message: 'Get user by error',
        httpCode: 500,
    },
    REVOKE_USER_SUBSCRIPTION_ERROR: {
        code: 'A027',
        message: 'Revoke user subscription error',
        httpCode: 500,
    },
    DISABLE_USER_ERROR: {
        code: 'A028',
        message: 'Disable user error',
        httpCode: 500,
    },
    USER_ALREADY_DISABLED: {
        code: 'A029',
        message: 'User already disabled',
        httpCode: 400,
    },
    USER_ALREADY_ENABLED: {
        code: 'A030',
        message: 'User already enabled',
        httpCode: 400,
    },
    ENABLE_USER_ERROR: {
        code: 'A031',
        message: 'Enable user error',
        httpCode: 500,
    },
    CREATE_NODE_ERROR: {
        code: 'A032',
        message: 'Create node error',
        httpCode: 500,
    },
    NODE_NAME_ALREADY_EXISTS: {
        code: 'A033',
        message: 'Node name already exists',
        httpCode: 400,
    },
    NODE_ADDRESS_ALREADY_EXISTS: {
        code: 'A034',
        message: 'Node address already exists',
        httpCode: 400,
    },
    NODE_ERROR_WITH_MSG: {
        code: 'N001',
        message: '',
        httpCode: 500,
        withMessage: (message: string) => ({
            code: 'N001',
            message,
            httpCode: 500,
        }),
    },
    NODE_ERROR_500_WITH_MSG: {
        code: 'N002',
        message: '',
        httpCode: 500,
        withMessage: (message: string) => ({
            code: 'N002',
            message,
            httpCode: 500,
        }),
    },
    RESTART_NODE_ERROR: {
        code: 'A035',
        message: 'Restart node error',
        httpCode: 500,
    },
    GET_CONFIG_WITH_USERS_ERROR: {
        code: 'A036',
        message: 'Get config with users error',
        httpCode: 500,
    },
    DELETE_USER_ERROR: {
        code: 'A037',
        message: 'Delete user error',
        httpCode: 500,
    },
    UPDATE_NODE_ERROR: {
        code: 'A038',
        message: 'Update node error',
        httpCode: 500,
    },
    UPDATE_USER_ERROR: {
        code: 'A039',
        message: 'Update user error',
        httpCode: 500,
    },
    INCREMENT_USED_TRAFFIC_ERROR: {
        code: 'A040',
        message: 'Increment used traffic error',
        httpCode: 500,
    },
    GET_ALL_NODES_ERROR: {
        code: 'A041',
        message: 'Get all nodes error',
        httpCode: 500,
    },
    GET_ONE_NODE_ERROR: {
        code: 'A042',
        message: 'Get one node error',
        httpCode: 500,
    },
    DELETE_NODE_ERROR: {
        code: 'A043',
        message: 'Delete node error',
        httpCode: 500,
    },
    CREATE_HOST_ERROR: {
        code: 'A044',
        message: 'Create host error',
        httpCode: 500,
    },
    HOST_REMARK_ALREADY_EXISTS: {
        code: 'A045',
        message: 'Host remark already exists',
        httpCode: 400,
    },
    HOST_NOT_FOUND: {
        code: 'A046',
        message: 'Host not found',
        httpCode: 404,
    },
    DELETE_HOST_ERROR: {
        code: 'A047',
        message: 'Delete host error',
        httpCode: 500,
    },
    GET_USER_STATS_ERROR: {
        code: 'A048',
        message: 'Get user stats error',
        httpCode: 500,
    },
    UPDATE_USER_WITH_INBOUNDS_ERROR: {
        code: 'A049',
        message: 'Update user with inbounds error',
        httpCode: 500,
    },
    GET_ALL_HOSTS_ERROR: {
        code: 'A050',
        message: 'Get all hosts error',
        httpCode: 500,
    },
    REORDER_HOSTS_ERROR: {
        code: 'A051',
        message: 'Reorder hosts error',
        httpCode: 500,
    },
    UPDATE_HOST_ERROR: {
        code: 'A052',
        message: 'Update host error',
        httpCode: 500,
    },
    CREATE_CONFIG_ERROR: {
        code: 'A053',
        message: 'Create config error',
        httpCode: 500,
    },
    ENABLED_NODES_NOT_FOUND: {
        code: 'A054',
        message: 'Enabled nodes not found',
        httpCode: 409,
    },
    GET_NODES_USAGE_BY_RANGE_ERROR: {
        code: 'A055',
        message: 'Get nodes usage by range error',
        httpCode: 500,
    },
    RESET_USER_TRAFFIC_ERROR: {
        code: 'A056',
        message: 'Reset user traffic error',
        httpCode: 500,
    },
    REORDER_NODES_ERROR: {
        code: 'A057',
        message: 'Reorder nodes error',
        httpCode: 500,
    },
    GET_ALL_INBOUNDS_ERROR: {
        code: 'A058',
        message: 'Get all inbounds error',
        httpCode: 500,
    },
    BULK_DELETE_USERS_BY_STATUS_ERROR: {
        code: 'A059',
        message: 'Bulk delete users by status error',
        httpCode: 500,
    },
    UPDATE_INBOUND_ERROR: {
        code: 'A060',
        message: 'Update inbound error',
        httpCode: 500,
    },
    CONFIG_VALIDATION_ERROR: {
        code: 'A061',
        message: 'Config validation error',
        httpCode: 500,
        withMessage: (message: string) => ({
            code: 'A061',
            message,
            httpCode: 500,
        }),
    },
    USERS_NOT_FOUND: {
        code: 'A062',
        message: 'Users not found',
        httpCode: 404,
    },
    GET_USER_BY_UNIQUE_FIELDS_NOT_FOUND: {
        code: 'A063',
        message: 'User with specified params not found',
        httpCode: 404,
    },
    UPDATE_EXCEEDED_TRAFFIC_USERS_ERROR: {
        code: 'A064',
        message: 'Update exceeded traffic users error',
        httpCode: 500,
    },
    ADMIN_NOT_FOUND: {
        code: 'A065',
        message: 'Admin not found',
        httpCode: 404,
    },
    CREATE_ADMIN_ERROR: {
        code: 'A066',
        message: 'Create admin error',
        httpCode: 500,
    },
    GET_AUTH_STATUS_ERROR: { code: 'A067', message: 'Get auth status error', httpCode: 500 },
    FORBIDDEN: { code: 'A068', message: 'Forbidden', httpCode: 403 },
    DISABLE_NODE_ERROR: {
        code: 'A069',
        message: 'Disable node error',
        httpCode: 500,
    },
    GET_ONE_HOST_ERROR: {
        code: 'A070',
        message: 'Get one host error',
        httpCode: 500,
    },
    SUBSCRIPTION_SETTINGS_NOT_FOUND: {
        code: 'A071',
        message: 'Subscription settings not found',
        httpCode: 404,
    },
    GET_SUBSCRIPTION_SETTINGS_ERROR: {
        code: 'A072',
        message: 'Get subscription settings error',
        httpCode: 500,
    },
    UPDATE_SUBSCRIPTION_SETTINGS_ERROR: {
        code: 'A073',
        message: 'Update subscription settings error',
        httpCode: 500,
    },
    ADD_INBOUND_TO_USERS_ERROR: {
        code: 'A074',
        message: 'Add inbound to users error',
        httpCode: 500,
    },
    REMOVE_INBOUND_FROM_USERS_ERROR: {
        code: 'A075',
        message: 'Remove inbound from users error',
        httpCode: 500,
    },
    INBOUND_NOT_FOUND: {
        code: 'A076',
        message: 'Inbound not found',
        httpCode: 404,
    },
    ADD_INBOUND_TO_NODES_ERROR: {
        code: 'A077',
        message: 'Add inbound to nodes error',
        httpCode: 500,
    },
    REMOVE_INBOUND_FROM_NODES_ERROR: {
        code: 'A078',
        message: 'Remove inbound from nodes error',
        httpCode: 500,
    },
    DELETE_HOSTS_ERROR: {
        code: 'A079',
        message: 'Delete hosts error',
        httpCode: 500,
    },
    BULK_ENABLE_HOSTS_ERROR: {
        code: 'A080',
        message: 'Bulk enable hosts error',
        httpCode: 500,
    },
    BULK_DISABLE_HOSTS_ERROR: {
        code: 'A081',
        message: 'Bulk disable hosts error',
        httpCode: 500,
    },
    SET_INBOUND_TO_HOSTS_ERROR: {
        code: 'A082',
        message: 'Set inbound to hosts error',
        httpCode: 500,
    },
    SET_PORT_TO_HOSTS_ERROR: {
        code: 'A083',
        message: 'Set port to hosts error',
        httpCode: 500,
    },
    BULK_DELETE_USERS_BY_UUID_ERROR: {
        code: 'A084',
        message: 'Bulk delete users by UUID error',
        httpCode: 500,
    },
    BULK_REVOKE_USERS_SUBSCRIPTION_ERROR: {
        code: 'A085',
        message: 'Bulk revoke users subscription error',
        httpCode: 500,
    },
    BULK_RESET_USER_TRAFFIC_ERROR: {
        code: 'A086',
        message: 'Bulk reset user traffic error',
        httpCode: 500,
    },
    BULK_UPDATE_USERS_ERROR: {
        code: 'A087',
        message: 'Bulk update users error',
        httpCode: 500,
    },
    BULK_ADD_INBOUNDS_TO_USERS_ERROR: {
        code: 'A088',
        message: 'Bulk add inbounds to users error',
        httpCode: 500,
    },
    BULK_UPDATE_ALL_USERS_ERROR: {
        code: 'A089',
        message: 'Bulk update all users error',
        httpCode: 500,
    },
    INVALID_USER_STATUS_ERROR: {
        code: 'A089',
        message: 'LIMITED and EXPIRED statuses are not allowed to be set manually.',
        httpCode: 400,
    },
    KEYPAIR_CREATION_ERROR: {
        code: 'A090',
        message: 'Keypair creation error',
        httpCode: 500,
    },
    GET_USER_USAGE_BY_RANGE_ERROR: {
        code: 'A091',
        message: 'Get user usage by range error',
        httpCode: 500,
    },
    KEYPAIR_NOT_FOUND: {
        code: 'A092',
        message: 'Keypair not found. Restart app.',
        httpCode: 500,
    },
    ACTIVATE_ALL_INBOUNDS_ERROR: {
        code: 'A093',
        message: 'Activate all inbounds error',
        httpCode: 500,
    },
    GET_NODES_USER_USAGE_BY_RANGE_ERROR: {
        code: 'A094',
        message: 'Get nodes user usage by range error',
        httpCode: 500,
    },
    GET_NODES_REALTIME_USAGE_ERROR: {
        code: 'A095',
        message: 'Get nodes realtime usage error',
        httpCode: 500,
    },
    CREATE_HWID_USER_DEVICE_ERROR: {
        code: 'A096',
        message: 'Create hwid user device error',
        httpCode: 500,
    },
    CHECK_HWID_EXISTS_ERROR: {
        code: 'A097',
        message: 'Check hwid exists error',
        httpCode: 500,
    },
    USER_HWID_DEVICE_ALREADY_EXISTS: {
        code: 'A098',
        message: 'User hwid device already exists',
        httpCode: 400,
    },
    USER_HWID_DEVICE_LIMIT_REACHED: {
        code: 'A099',
        message: 'User hwid device limit reached',
        httpCode: 400,
    },
    GET_USER_HWID_DEVICES_ERROR: {
        code: 'A100',
        message: 'Get user hwid devices error',
        httpCode: 500,
    },
    DELETE_HWID_USER_DEVICE_ERROR: {
        code: 'A101',
        message: 'Delete hwid user device error',
        httpCode: 500,
    },
    UPSERT_HWID_USER_DEVICE_ERROR: {
        code: 'A102',
        message: 'Upsert hwid user device error',
        httpCode: 500,
    },
    GET_ALL_TAGS_ERROR: {
        code: 'A103',
        message: 'Get all tags error',
        httpCode: 500,
    },
    GETTING_ALL_SUBSCRIPTIONS_ERROR: {
        code: 'A104',
        message: 'Getting all subscriptions error',
        httpCode: 500,
    },
    TRIGGER_THRESHOLD_NOTIFICATION_ERROR: {
        code: 'A105',
        message: 'Trigger threshold notification error',
        httpCode: 500,
    },
    BULK_DELETE_BY_STATUS_ERROR: {
        code: 'A106',
        message: 'Bulk delete by status error',
        httpCode: 500,
    },
    CLEAN_OLD_USAGE_RECORDS_ERROR: {
        code: 'A107',
        message: 'Clean old usage records error',
        httpCode: 500,
    },
    VACUUM_TABLE_ERROR: {
        code: 'A108',
        message: 'Vacuum table error',
        httpCode: 500,
    },
    GET_CONFIG_PROFILES_ERROR: {
        code: 'A109',
        message: 'Get config profiles error',
        httpCode: 500,
    },
    GET_CONFIG_PROFILE_BY_UUID_ERROR: {
        code: 'A110',
        message: 'Get config profile by UUID error',
        httpCode: 500,
    },
    CONFIG_PROFILE_NOT_FOUND: {
        code: 'A111',
        message: 'Config profile not found',
        httpCode: 404,
    },
    CREATE_CONFIG_PROFILE_ERROR: {
        code: 'A112',
        message: 'Create config profile error',
        httpCode: 500,
    },
    INBOUNDS_WITH_SAME_TAG_ALREADY_EXISTS: {
        code: 'A113',
        message: 'Inbounds with same tag already exists in database. Inbound tags must be unique.',
        httpCode: 409,
    },
    CONFIG_PROFILE_NAME_ALREADY_EXISTS: {
        code: 'A114',
        message:
            'Config profile name already exists in database. Config profile names must be unique.',
        httpCode: 409,
    },
    GET_INBOUNDS_BY_PROFILE_UUID_ERROR: {
        code: 'A115',
        message: 'Get inbounds by profile UUID error',
        httpCode: 500,
    },
    GET_INTERNAL_SQUADS_ERROR: {
        code: 'A116',
        message: 'Get internal squads error',
        httpCode: 500,
    },
    GET_INTERNAL_SQUAD_BY_UUID_ERROR: {
        code: 'A117',
        message: 'Get internal squad by UUID error',
        httpCode: 500,
    },
    INTERNAL_SQUAD_NOT_FOUND: {
        code: 'A118',
        message: 'Internal squad not found',
        httpCode: 404,
    },
    CREATE_INTERNAL_SQUAD_ERROR: {
        code: 'A119',
        message: 'Create internal squad error',
        httpCode: 500,
    },
    INTERNAL_SQUAD_NAME_ALREADY_EXISTS: {
        code: 'A120',
        message: 'Internal squad name already exists',
        httpCode: 409,
    },
    UPDATE_INTERNAL_SQUAD_ERROR: {
        code: 'A121',
        message: 'Update internal squad error',
        httpCode: 500,
    },
    DELETE_INTERNAL_SQUAD_ERROR: {
        code: 'A122',
        message: 'Delete internal squad error',
        httpCode: 500,
    },
    CREATE_USER_WITH_INTERNAL_SQUAD_ERROR: {
        code: 'A123',
        message: 'Create user with internal squad error',
        httpCode: 500,
    },
    CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE: {
        code: 'A124',
        message: 'Config profile inbound not found in specified profile',
        httpCode: 404,
    },
    GET_USER_ACCESSIBLE_NODES_ERROR: {
        code: 'A125',
        message: 'Get user accessible nodes error',
        httpCode: 500,
    },
    GET_INFRA_PROVIDERS_ERROR: {
        code: 'A126',
        message: 'Get infra providers error',
        httpCode: 500,
    },
    GET_INFRA_PROVIDER_BY_UUID_ERROR: {
        code: 'A127',
        message: 'Get infra provider by UUID error',
        httpCode: 500,
    },
    INFRA_PROVIDER_NOT_FOUND: {
        code: 'A128',
        message: 'Infra provider not found',
        httpCode: 404,
    },
    DELETE_INFRA_PROVIDER_BY_UUID_ERROR: {
        code: 'A129',
        message: 'Delete infra provider by UUID error',
        httpCode: 500,
    },
    CREATE_INFRA_PROVIDER_ERROR: {
        code: 'A130',
        message: 'Create infra provider error',
        httpCode: 500,
    },
    UPDATE_INFRA_PROVIDER_ERROR: {
        code: 'A131',
        message: 'Update infra provider error',
        httpCode: 500,
    },
    CREATE_INFRA_BILLING_HISTORY_RECORD_ERROR: {
        code: 'A132',
        message: 'Create infra billing history record error',
        httpCode: 500,
    },
    GET_INFRA_BILLING_HISTORY_RECORDS_ERROR: {
        code: 'A133',
        message: 'Get infra billing history records error',
        httpCode: 500,
    },
    DELETE_INFRA_BILLING_HISTORY_RECORD_BY_UUID_ERROR: {
        code: 'A134',
        message: 'Delete infra billing history record by UUID error',
        httpCode: 500,
    },
    GET_BILLING_NODES_ERROR: {
        code: 'A135',
        message: 'Get billing nodes error',
        httpCode: 500,
    },
    UPDATE_INFRA_BILLING_NODE_ERROR: {
        code: 'A136',
        message: 'Update infra billing node error',
        httpCode: 500,
    },
    CREATE_INFRA_BILLING_NODE_ERROR: {
        code: 'A137',
        message: 'Create infra billing node error',
        httpCode: 500,
    },
    DELETE_INFRA_BILLING_NODE_BY_UUID_ERROR: {
        code: 'A138',
        message: 'Delete infra billing node by UUID error',
        httpCode: 500,
    },
    GET_BILLING_NODES_FOR_NOTIFICATIONS_ERROR: {
        code: 'A139',
        message: 'Get billing nodes for notifications error',
        httpCode: 500,
    },
    ADD_USERS_TO_INTERNAL_SQUAD_ERROR: {
        code: 'A140',
        message: 'Add users to internal squad error',
        httpCode: 500,
    },
    INTERNAL_SQUAD_BULK_ACTIONS_ERROR: {
        code: 'A141',
        message: 'Internal squad bulk actions error',
        httpCode: 500,
    },
    REMOVE_USERS_FROM_INTERNAL_SQUAD_ERROR: {
        code: 'A142',
        message: 'Remove users from internal squad error',
        httpCode: 500,
    },
    DELETE_CONFIG_PROFILE_BY_UUID_ERROR: {
        code: 'A143',
        message: 'Delete config profile by UUID error',
        httpCode: 500,
    },
    RESERVED_INTERNAL_SQUAD_NAME: {
        code: 'A144',
        message: 'This name is reserved by Remnawave. Please use a different name.',
        httpCode: 400,
    },
    RESERVED_CONFIG_PROFILE_NAME: {
        code: 'A145',
        message: 'This name is reserved by Remnawave. Please use a different name.',
        httpCode: 400,
    },
    UPDATE_CONFIG_PROFILE_ERROR: {
        code: 'A146',
        message: 'Update config profile error',
        httpCode: 500,
    },
    OAUTH2_PROVIDER_NOT_FOUND: {
        code: 'A147',
        message: 'OAuth2 provider not found',
        httpCode: 404,
    },
    OAUTH2_AUTHORIZE_ERROR: {
        code: 'A148',
        message: 'OAuth2 authorize error',
        httpCode: 500,
    },
    NODE_IS_DISABLED: {
        code: 'A149',
        message: 'Node is disabled',
        httpCode: 400,
    },
    SYNC_ACTIVE_PROFILE_ERROR: {
        code: 'A150',
        message: 'Sync active profile error',
        httpCode: 500,
    },
    GET_ALL_HOST_TAGS_ERROR: {
        code: 'A151',
        message: 'Get all host tags error',
        httpCode: 500,
    },
    NAME_OR_CONFIG_REQUIRED: {
        code: 'A152',
        message: 'Name or config is required',
        httpCode: 400,
    },
    NAME_OR_INBOUNDS_REQUIRED: {
        code: 'A153',
        message: 'Name or inbounds is required',
        httpCode: 400,
    },
    GET_INTERNAL_SQUAD_ACCESSIBLE_NODES_ERROR: {
        code: 'A154',
        message: 'Get internal squad accessible nodes error',
        httpCode: 500,
    },
    DELETE_HWID_USER_DEVICES_ERROR: {
        code: 'A155',
        message: 'Delete hwid user devices error',
        httpCode: 500,
    },
    CREATE_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR: {
        code: 'A156',
        message: 'Create user subscription request history error',
        httpCode: 500,
    },
    GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR: {
        code: 'A157',
        message: 'Get user subscription request history error',
        httpCode: 500,
    },
    GET_ALL_HWID_DEVICES_ERROR: {
        code: 'A158',
        message: 'Get all hwid devices error',
        httpCode: 500,
    },
    GET_HWID_DEVICES_STATS_ERROR: {
        code: 'A159',
        message: 'Get hwid devices stats error',
        httpCode: 500,
    },
    GET_USER_SUBSCRIPTION_REQUEST_HISTORY_STATS_ERROR: {
        code: 'A160',
        message: 'Get user subscription request history stats error',
        httpCode: 500,
    },
    GET_SNIPPETS_ERROR: {
        code: 'A161',
        message: 'Get snippets error',
        httpCode: 500,
    },
    SNIPPET_NOT_FOUND: {
        code: 'A162',
        message: 'Snippet not found',
        httpCode: 404,
    },
    DELETE_SNIPPET_BY_NAME_ERROR: {
        code: 'A163',
        message: 'Delete snippet by name error',
        httpCode: 500,
    },
    SNIPPET_NAME_ALREADY_EXISTS: {
        code: 'A164',
        message: 'Snippet name already exists',
        httpCode: 400,
    },
    UPDATE_SNIPPET_ERROR: {
        code: 'A165',
        message: 'Update snippet error',
        httpCode: 500,
    },
    SNIPPET_CANNOT_BE_EMPTY: {
        code: 'A166',
        message: 'Snippet cannot be empty',
        httpCode: 400,
    },
    SNIPPET_CANNOT_CONTAIN_EMPTY_OBJECTS: {
        code: 'A167',
        message: 'Snippet cannot contain empty objects',
        httpCode: 400,
    },
    GET_ALL_SUBSCRIPTION_TEMPLATES_ERROR: {
        code: 'A168',
        message: 'Get all subscription templates error',
        httpCode: 500,
    },
    GET_SUBSCRIPTION_TEMPLATE_BY_UUID_ERROR: {
        code: 'A169',
        message: 'Get subscription template by UUID error',
        httpCode: 500,
    },
    SUBSCRIPTION_TEMPLATE_NOT_FOUND: {
        code: 'A170',
        message: 'Subscription template not found',
        httpCode: 404,
    },
    UPDATE_SUBSCRIPTION_TEMPLATE_ERROR: {
        code: 'A171',
        message: 'Update subscription template error',
        httpCode: 500,
    },
    RESERVED_TEMPLATE_NAME: {
        code: 'A172',
        message: 'This name is reserved. Please use a different name.',
        httpCode: 400,
    },
    TEMPLATE_JSON_NOT_ALLOWED_FOR_YAML_TEMPLATE: {
        code: 'A173',
        message: 'Template JSON is not allowed for YAML template',
        httpCode: 400,
    },
    TEMPLATE_YAML_NOT_ALLOWED_FOR_JSON_TEMPLATE: {
        code: 'A174',
        message: 'Template YAML is not allowed for JSON template',
        httpCode: 400,
    },
    TEMPLATE_JSON_AND_YAML_CANNOT_BE_UPDATED_SIMULTANEOUSLY: {
        code: 'A175',
        message: 'Template JSON and YAML cannot be updated simultaneously',
        httpCode: 400,
    },
    TEMPLATE_NAME_ALREADY_EXISTS_FOR_THIS_TYPE: {
        code: 'A176',
        message: 'Template name already exists for this type',
        httpCode: 400,
    },
    DELETE_SUBSCRIPTION_TEMPLATE_ERROR: {
        code: 'A177',
        message: 'Delete subscription template error',
        httpCode: 500,
    },
    RESERVED_TEMPLATE_CANNOT_BE_DELETED: {
        code: 'A178',
        message: 'Reserved template cannot be deleted',
        httpCode: 400,
    },
    CREATE_SUBSCRIPTION_TEMPLATE_ERROR: {
        code: 'A179',
        message: 'Create subscription template error',
        httpCode: 500,
    },
} as const;
