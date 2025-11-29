import { createZodDto } from 'nestjs-zod';

import {
    BulkAllExtendExpirationDateCommand,
    BulkAllResetTrafficUsersCommand,
    BulkAllUpdateUsersCommand,
    BulkDeleteUsersCommand,
    BulkExtendExpirationDateCommand,
    BulkResetTrafficUsersCommand,
    BulkRevokeUsersSubscriptionCommand,
    BulkUpdateUsersCommand,
    BulkUpdateUsersSquadsCommand,
} from '@libs/contracts/commands';

export class BulkResetTrafficUsersRequestDto extends createZodDto(
    BulkResetTrafficUsersCommand.RequestSchema,
) {}
export class BulkResetTrafficUsersResponseDto extends createZodDto(
    BulkResetTrafficUsersCommand.ResponseSchema,
) {}

export class BulkRevokeUsersSubscriptionRequestDto extends createZodDto(
    BulkRevokeUsersSubscriptionCommand.RequestSchema,
) {}
export class BulkRevokeUsersSubscriptionResponseDto extends createZodDto(
    BulkRevokeUsersSubscriptionCommand.ResponseSchema,
) {}

export class BulkDeleteUsersRequestDto extends createZodDto(BulkDeleteUsersCommand.RequestSchema) {}
export class BulkDeleteUsersResponseDto extends createZodDto(
    BulkDeleteUsersCommand.ResponseSchema,
) {}

export class BulkUpdateUsersRequestDto extends createZodDto(BulkUpdateUsersCommand.RequestSchema) {}
export class BulkUpdateUsersResponseDto extends createZodDto(
    BulkUpdateUsersCommand.ResponseSchema,
) {}

export class BulkUpdateUsersSquadsRequestDto extends createZodDto(
    BulkUpdateUsersSquadsCommand.RequestSchema,
) {}
export class BulkUpdateUsersSquadsResponseDto extends createZodDto(
    BulkUpdateUsersSquadsCommand.ResponseSchema,
) {}

export class BulkAllUpdateUsersRequestDto extends createZodDto(
    BulkAllUpdateUsersCommand.RequestSchema,
) {}
export class BulkAllUpdateUsersResponseDto extends createZodDto(
    BulkAllUpdateUsersCommand.ResponseSchema,
) {}

export class BulkAllResetTrafficUsersResponseDto extends createZodDto(
    BulkAllResetTrafficUsersCommand.ResponseSchema,
) {}

export class BulkAllExtendExpirationDateRequestDto extends createZodDto(
    BulkAllExtendExpirationDateCommand.RequestSchema,
) {}
export class BulkAllExtendExpirationDateResponseDto extends createZodDto(
    BulkAllExtendExpirationDateCommand.ResponseSchema,
) {}

export class BulkExtendExpirationDateRequestDto extends createZodDto(
    BulkExtendExpirationDateCommand.RequestSchema,
) {}
export class BulkExtendExpirationDateResponseDto extends createZodDto(
    BulkExtendExpirationDateCommand.ResponseSchema,
) {}
