import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    Query,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    ActivateAllInboundsCommand,
    CreateUserCommand,
    DeleteUserCommand,
    DisableUserCommand,
    EnableUserCommand,
    GetAllTagsCommand,
    GetAllUsersCommand,
    GetUserByEmailCommand,
    GetUserByShortUuidCommand,
    GetUserBySubscriptionUuidCommand,
    GetUserByTagCommand,
    GetUserByTelegramIdCommand,
    GetUserByUsernameCommand,
    GetUserByUuidCommand,
    ResetUserTrafficCommand,
    RevokeUserSubscriptionCommand,
    UpdateUserCommand,
} from '@libs/contracts/commands';
import { USERS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    ActivateAllInboundsRequestDto,
    ActivateAllInboundsResponseDto,
    CreateUserRequestDto,
    CreateUserResponseDto,
    DeleteUserRequestDto,
    DeleteUserResponseDto,
    DisableUserRequestDto,
    DisableUserResponseDto,
    EnableUserRequestDto,
    EnableUserResponseDto,
    GetAllTagsResponseDto,
    GetAllUsersQueryDto,
    GetAllUsersResponseDto,
    GetUserByShortUuidRequestDto,
    GetUserByShortUuidResponseDto,
    GetUserBySubscriptionUuidRequestDto,
    GetUserBySubscriptionUuidResponseDto,
    GetUserByTagRequestDto,
    GetUserByTagResponseDto,
    GetUserByUsernameRequestDto,
    GetUserByUsernameResponseDto,
    GetUserByUuidRequestDto,
    GetUserByUuidResponseDto,
    ResetUserTrafficRequestDto,
    ResetUserTrafficResponseDto,
    RevokeUserSubscriptionRequestDto,
    RevokeUserSubscriptionResponseDto,
    UpdateUserRequestDto,
    UpdateUserResponseDto,
} from '../dtos';
import {
    CreateUserResponseModel,
    GetAllTagsResponseModel,
    GetAllUsersResponseModel,
    GetFullUserResponseModel,
    GetUserResponseModel,
} from '../models';
import {
    GetUserByTelegramIdRequestDto,
    GetUserByTelegramIdResponseDto,
} from '../dtos/get-user-by-telegram-id.dto';
import { GetUserByEmailResponseDto } from '../dtos/get-user-by-email.dto';
import { GetUserByEmailRequestDto } from '../dtos/get-user-by-email.dto';
import { UsersService } from '../users.service';

@ApiBearerAuth('Authorization')
@ApiTags('Users Controller')
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(USERS_CONTROLLER)
export class UsersController {
    public readonly subPublicDomain: string;
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) {
        this.subPublicDomain = this.configService.getOrThrow<string>('SUB_PUBLIC_DOMAIN');
    }

    @ApiCreatedResponse({
        type: CreateUserResponseDto,
        description: 'User created successfully',
    })
    @Endpoint({
        command: CreateUserCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateUserRequestDto,
    })
    async createUser(@Body() body: CreateUserRequestDto): Promise<CreateUserResponseDto> {
        const result = await this.usersService.createUser(body);

        const data = errorHandler(result);
        return {
            response: new CreateUserResponseModel(data, this.subPublicDomain),
        };
    }

    @ApiOkResponse({
        type: UpdateUserResponseDto,
        description: 'User updated successfully',
    })
    @Endpoint({
        command: UpdateUserCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateUserRequestDto,
    })
    async updateUser(@Body() body: UpdateUserRequestDto): Promise<UpdateUserResponseDto> {
        const result = await this.usersService.updateUser(body);

        const data = errorHandler(result);
        return {
            response: new GetUserResponseModel(
                data.user,
                data.lastConnectedNode,
                this.subPublicDomain,
            ),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: DeleteUserResponseDto,
        description: 'User deleted successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: DeleteUserCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteUser(@Param() paramData: DeleteUserRequestDto): Promise<DeleteUserResponseDto> {
        const result = await this.usersService.deleteUser(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetAllUsersResponseDto,
        description: 'Users fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetAllUsersCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllUsers(@Query() query: GetAllUsersQueryDto): Promise<GetAllUsersResponseDto> {
        const { start, size, filters, filterModes, globalFilterMode, sorting } = query;
        const result = await this.usersService.getAllUsers({
            start,
            size,
            filters,
            filterModes,
            globalFilterMode,
            sorting,
        });

        const data = errorHandler(result);
        return {
            response: new GetAllUsersResponseModel({
                total: data.total,
                users: data.users.map(
                    (item) => new GetFullUserResponseModel(item, this.subPublicDomain),
                ),
            }),
        };
    }

    @ApiOkResponse({
        type: GetAllTagsResponseDto,
        description: 'Tags fetched successfully',
    })
    @Endpoint({
        command: GetAllTagsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllTags(): Promise<GetAllTagsResponseDto> {
        const result = await this.usersService.getAllTags();

        const data = errorHandler(result);
        return {
            response: new GetAllTagsResponseModel({
                tags: data,
            }),
        };
    }

    /* get by methods




    */

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: GetUserByShortUuidResponseDto,
        description: 'User fetched successfully',
    })
    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @Endpoint({
        command: GetUserByShortUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserByShortUuid(
        @Param() paramData: GetUserByShortUuidRequestDto,
    ): Promise<GetUserByShortUuidResponseDto> {
        const result = await this.usersService.getUserByUniqueFields({
            shortUuid: paramData.shortUuid,
        });

        const data = errorHandler(result);
        return {
            response: new GetFullUserResponseModel(data, this.subPublicDomain),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: GetUserBySubscriptionUuidResponseDto,
        description: 'User fetched successfully',
    })
    @ApiParam({
        name: 'subscriptionUuid',
        type: String,
        description: 'UUID of the subscription',
        required: true,
    })
    @Endpoint({
        command: GetUserBySubscriptionUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserBySubscriptionUuid(
        @Param() paramData: GetUserBySubscriptionUuidRequestDto,
    ): Promise<GetUserBySubscriptionUuidResponseDto> {
        const result = await this.usersService.getUserByUniqueFields({
            subscriptionUuid: paramData.subscriptionUuid,
        });

        const data = errorHandler(result);
        return {
            response: new GetFullUserResponseModel(data, this.subPublicDomain),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: GetUserByUuidResponseDto,
        description: 'User fetched successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: GetUserByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserByUuid(
        @Param() paramData: GetUserByUuidRequestDto,
    ): Promise<GetUserByUuidResponseDto> {
        const result = await this.usersService.getUserByUniqueFields({ uuid: paramData.uuid });

        const data = errorHandler(result);
        return {
            response: new GetFullUserResponseModel(data, this.subPublicDomain),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: GetUserByUsernameResponseDto,
        description: 'User fetched successfully',
    })
    @ApiParam({
        name: 'username',
        type: String,
        description: 'Username of the user',
        required: true,
    })
    @Endpoint({
        command: GetUserByUsernameCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserByUsername(
        @Param() paramData: GetUserByUsernameRequestDto,
    ): Promise<GetUserByUsernameResponseDto> {
        const result = await this.usersService.getUserByUniqueFields({
            username: paramData.username,
        });

        const data = errorHandler(result);
        return {
            response: new GetFullUserResponseModel(data, this.subPublicDomain),
        };
    }

    @ApiNotFoundResponse({
        description: 'Users not found',
    })
    @ApiOkResponse({
        type: GetUserByTelegramIdResponseDto,
        description: 'Users fetched successfully',
    })
    @ApiParam({
        name: 'telegramId',
        type: String,
        description: 'Telegram ID of the user',
        required: true,
    })
    @Endpoint({
        command: GetUserByTelegramIdCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserByTelegramId(
        @Param() paramData: GetUserByTelegramIdRequestDto,
    ): Promise<GetUserByTelegramIdResponseDto> {
        const result = await this.usersService.getUsersByTelegramIdOrEmail({
            telegramId: paramData.telegramId,
        });

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetFullUserResponseModel(item, this.subPublicDomain)),
        };
    }

    @ApiNotFoundResponse({
        description: 'Users not found',
    })
    @ApiOkResponse({
        type: GetUserByEmailResponseDto,
        description: 'Users fetched successfully',
    })
    @ApiParam({
        name: 'email',
        type: String,
        description: 'Email of the user',
        required: true,
    })
    @Endpoint({
        command: GetUserByEmailCommand,
        httpCode: HttpStatus.OK,
    })
    async getUsersByEmail(
        @Param() paramData: GetUserByEmailRequestDto,
    ): Promise<GetUserByEmailResponseDto> {
        const result = await this.usersService.getUsersByTelegramIdOrEmail({
            email: paramData.email,
        });

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetFullUserResponseModel(item, this.subPublicDomain)),
        };
    }

    @ApiNotFoundResponse({
        description: 'Users not found',
    })
    @ApiOkResponse({
        type: GetUserByTagResponseDto,
        description: 'Users fetched successfully',
    })
    @ApiParam({
        name: 'tag',
        type: String,
        description: 'Tag of the user',
        required: true,
        example: 'PROMO_1',
    })
    @Endpoint({
        command: GetUserByTagCommand,
        httpCode: HttpStatus.OK,
    })
    async getUsersByTag(
        @Param() paramData: GetUserByTagRequestDto,
    ): Promise<GetUserByTagResponseDto> {
        const result = await this.usersService.getUsersByTelegramIdOrEmail({
            tag: paramData.tag,
        });

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetFullUserResponseModel(item, this.subPublicDomain)),
        };
    }

    /* actions methods




    */

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: RevokeUserSubscriptionResponseDto,
        description: 'User subscription revoked successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: RevokeUserSubscriptionCommand,
        httpCode: HttpStatus.OK,
    })
    async revokeUserSubscription(
        @Param() paramData: RevokeUserSubscriptionRequestDto,
    ): Promise<RevokeUserSubscriptionResponseDto> {
        const result = await this.usersService.revokeUserSubscription(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: new GetUserResponseModel(
                data.user,
                data.lastConnectedNode,
                this.subPublicDomain,
            ),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: DisableUserResponseDto,
        description: 'User disabled successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: DisableUserCommand,
        httpCode: HttpStatus.OK,
    })
    @HttpCode(HttpStatus.OK)
    async disableUser(@Param() paramData: DisableUserRequestDto): Promise<DisableUserResponseDto> {
        const result = await this.usersService.disableUser(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: new GetUserResponseModel(
                data.user,
                data.lastConnectedNode,
                this.subPublicDomain,
            ),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: EnableUserResponseDto,
        description: 'User enabled successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: EnableUserCommand,
        httpCode: HttpStatus.OK,
    })
    async enableUser(@Param() paramData: EnableUserRequestDto): Promise<EnableUserResponseDto> {
        const result = await this.usersService.enableUser(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: new GetUserResponseModel(
                data.user,
                data.lastConnectedNode,
                this.subPublicDomain,
            ),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: ResetUserTrafficResponseDto,
        description: 'User traffic reset successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: ResetUserTrafficCommand,
        httpCode: HttpStatus.OK,
    })
    async resetUserTraffic(
        @Param() paramData: ResetUserTrafficRequestDto,
    ): Promise<ResetUserTrafficResponseDto> {
        const result = await this.usersService.resetUserTraffic(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: new GetUserResponseModel(
                data.user,
                data.lastConnectedNode,
                this.subPublicDomain,
            ),
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: ActivateAllInboundsResponseDto,
        description: 'All inbounds activated successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: ActivateAllInboundsCommand,
        httpCode: HttpStatus.OK,
    })
    async activateAllInbounds(
        @Param() paramData: ActivateAllInboundsRequestDto,
    ): Promise<ActivateAllInboundsResponseDto> {
        const result = await this.usersService.activateAllInbounds(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: new GetUserResponseModel(
                data.user,
                data.lastConnectedNode,
                this.subPublicDomain,
            ),
        };
    }
}
