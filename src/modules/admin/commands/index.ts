import { CreateAdminHandler } from './create-admin';
import { CreatePasskeyHandler } from './create-passkey';
import { DeletePasskeyHandler } from './delete-passkey';
import { UpdateAdminPasswordHashHandler } from './update-admin-password-hash';
import { UpdatePasskeyHandler } from './update-passkey';

export const COMMANDS = [
    CreateAdminHandler,
    CreatePasskeyHandler,
    UpdatePasskeyHandler,
    DeletePasskeyHandler,
    UpdateAdminPasswordHashHandler,
];
