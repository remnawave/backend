import { CreateWithAdvisoryLockHandler } from './create-with-advisory-lock';
import { CreateHwidUserDeviceHandler } from './create-hwid-user-device';
import { UpsertHwidUserDeviceHandler } from './upsert-hwid-user-device';

export const COMMANDS = [
    CreateHwidUserDeviceHandler,
    UpsertHwidUserDeviceHandler,
    CreateWithAdvisoryLockHandler,
];
