export const PASSKEYS_CONTROLLER = 'passkeys' as const;

export const PASSKEYS_ROUTES = {
    GET_ALL_PASSKEYS: '', // get
    DELETE_PASSKEY: '', // delete
    UPDATE_PASSKEY: '', // patch

    GET_REGISTRATION_OPTIONS: 'registration/options', // get
    VERIFY_REGISTRATION: 'registration/verify', // post
} as const;
