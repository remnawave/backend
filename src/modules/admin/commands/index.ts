import { CreatePasskeyHandler } from './create-passkey';
import { UpdatePasskeyHandler } from './update-passkey';
import { DeletePasskeyHandler } from './delete-passkey';
import { CreateAdminHandler } from './create-admin';

export const COMMANDS = [
    CreateAdminHandler,
    CreatePasskeyHandler,
    UpdatePasskeyHandler,
    DeletePasskeyHandler,
];
