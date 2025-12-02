import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    BulkAllExtendExpirationDateCommand,
    BulkAllResetTrafficUsersCommand,
    BulkAllUpdateUsersCommand,
    BulkDeleteUsersByStatusCommand,
    BulkDeleteUsersCommand,
    BulkExtendExpirationDateCommand,
    BulkResetTrafficUsersCommand,
    BulkRevokeUsersSubscriptionCommand,
    BulkUpdateUsersCommand,
    BulkUpdateUsersSquadsCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, USERS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    BulkAllResetTrafficUsersResponseDto,
    BulkAllUpdateUsersRequestDto,
    BulkAllUpdateUsersResponseDto,
    BulkDeleteUsersByStatusRequestDto,
    BulkDeleteUsersByStatusResponseDto,
    BulkDeleteUsersRequestDto,
    BulkDeleteUsersResponseDto,
    BulkResetTrafficUsersRequestDto,
    BulkResetTrafficUsersResponseDto,
    BulkRevokeUsersSubscriptionRequestDto,
    BulkRevokeUsersSubscriptionResponseDto,
    BulkUpdateUsersSquadsRequestDto,
    BulkUpdateUsersSquadsResponseDto,
    BulkUpdateUsersRequestDto,
    BulkUpdateUsersResponseDto,
    BulkAllExtendExpirationDateResponseDto,
    BulkAllExtendExpirationDateRequestDto,
    BulkExtendExpirationDateResponseDto,
    BulkExtendExpirationDateRequestDto,
} from '../dtos';
import { UsersService } from '../users.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.USERS_BULK_ACTIONS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(USERS_CONTROLLER)
export class UsersBulkActionsController {
    public readonly subPublicDomain: string;
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) {
        this.subPublicDomain = this.configService.getOrThrow<string>('SUB_PUBLIC_DOMAIN');
    }

    @ApiOkResponse({
        type: BulkDeleteUsersByStatusResponseDto,
        description: 'Users deleted successfully',
    })
    @Endpoint({
        command: BulkDeleteUsersByStatusCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkDeleteUsersByStatusRequestDto,
    })
    async bulkDeleteUsersByStatus(
        @Body() body: BulkDeleteUsersByStatusRequestDto,
    ): Promise<BulkDeleteUsersByStatusResponseDto> {
        const result = await this.usersService.bulkDeleteUsersByStatus(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkDeleteUsersResponseDto,
        description: 'Users deleted successfully',
    })
    @Endpoint({
        command: BulkDeleteUsersCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkDeleteUsersRequestDto,
    })
    async bulkDeleteUsers(
        @Body() body: BulkDeleteUsersRequestDto,
    ): Promise<BulkDeleteUsersResponseDto> {
        const result = await this.usersService.bulkDeleteUsersByUuid(body.uuids);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkRevokeUsersSubscriptionResponseDto,
        description: 'Users subscription revoked successfully',
    })
    @Endpoint({
        command: BulkRevokeUsersSubscriptionCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkRevokeUsersSubscriptionRequestDto,
    })
    async bulkRevokeUsersSubscription(
        @Body() body: BulkRevokeUsersSubscriptionRequestDto,
    ): Promise<BulkRevokeUsersSubscriptionResponseDto> {
        const result = await this.usersService.bulkRevokeUsersSubscription(body.uuids);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkResetTrafficUsersResponseDto,
        description: 'Users traffic reset successfully',
    })
    @Endpoint({
        command: BulkResetTrafficUsersCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkResetTrafficUsersRequestDto,
    })
    async bulkResetUserTraffic(
        @Body() body: BulkResetTrafficUsersRequestDto,
    ): Promise<BulkResetTrafficUsersResponseDto> {
        const result = await this.usersService.bulkResetUserTraffic(body.uuids);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkUpdateUsersResponseDto,
        description: 'Users updated successfully',
    })
    @Endpoint({
        command: BulkUpdateUsersCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkUpdateUsersRequestDto,
    })
    async bulkUpdateUsers(
        @Body() body: BulkUpdateUsersRequestDto,
    ): Promise<BulkUpdateUsersResponseDto> {
        const result = await this.usersService.bulkUpdateUsers(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkUpdateUsersSquadsResponseDto,
        description: 'Internal squads updated successfully',
    })
    @Endpoint({
        command: BulkUpdateUsersSquadsCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkUpdateUsersSquadsRequestDto,
    })
    async bulkUpdateUsersInternalSquads(
        @Body() body: BulkUpdateUsersSquadsRequestDto,
    ): Promise<BulkUpdateUsersSquadsResponseDto> {
        const result = await this.usersService.bulkUpdateUsersInternalSquads(
            body.uuids,
            body.activeInternalSquads,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkExtendExpirationDateResponseDto,
        description: 'Users expiration date extended successfully',
    })
    @ApiOperation({
        summary: 'Bulk Extend Users Expiration Date',
        description: 'Bulk extend all users expiration date',
    })
    @Endpoint({
        command: BulkExtendExpirationDateCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkExtendExpirationDateRequestDto,
    })
    async bulkExtendExpirationDate(
        @Body() body: BulkExtendExpirationDateRequestDto,
    ): Promise<BulkExtendExpirationDateResponseDto> {
        const result = await this.usersService.bulkExtendExpirationDate({
            uuids: body.uuids,
            extendDays: body.extendDays,
        });

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkAllUpdateUsersResponseDto,
        description: 'All users updated successfully',
    })
    @Endpoint({
        command: BulkAllUpdateUsersCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkAllUpdateUsersRequestDto,
    })
    async bulkUpdateAllUsers(
        @Body() body: BulkAllUpdateUsersRequestDto,
    ): Promise<BulkAllUpdateUsersResponseDto> {
        const result = await this.usersService.bulkUpdateAllUsers(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkAllResetTrafficUsersResponseDto,
        description: 'All users traffic reset successfully',
    })
    @ApiOperation({
        summary: 'Bulk Reset All Users Traffic',
        description: 'Bulk reset all users traffic',
    })
    @Endpoint({
        command: BulkAllResetTrafficUsersCommand,
        httpCode: HttpStatus.OK,
    })
    async bulkAllResetUserTraffic(): Promise<BulkAllResetTrafficUsersResponseDto> {
        const result = await this.usersService.bulkAllResetUserTraffic();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkAllExtendExpirationDateResponseDto,
        description: 'All users expiration date extended successfully',
    })
    @ApiOperation({
        summary: 'Bulk Extend All Users Expiration Date',
        description: 'Bulk extend all users expiration date',
    })
    @Endpoint({
        command: BulkAllExtendExpirationDateCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkAllExtendExpirationDateRequestDto,
    })
    async bulkAllExtendExpirationDate(
        @Body() body: BulkAllExtendExpirationDateRequestDto,
    ): Promise<BulkAllExtendExpirationDateResponseDto> {
        const result = await this.usersService.bulkAllExtendExpirationDate(body.extendDays);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
