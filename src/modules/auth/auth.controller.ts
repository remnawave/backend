import {
    ApiForbiddenResponse,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, HttpStatus, UseFilters } from '@nestjs/common';

import { GetRemnawaveSettings } from '@common/decorators/get-remnawave-settings';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { UserAgent } from '@common/decorators/get-useragent/get-useragent';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { IpAddress } from '@common/decorators/get-ip/get-ip';
import { Endpoint } from '@common/decorators/base-endpoint';
import {
    GetStatusCommand,
    LoginCommand,
    RegisterCommand,
    TelegramCallbackCommand,
    OAuth2AuthorizeCommand,
    OAuth2CallbackCommand,
    GetPasskeyAuthenticationOptionsCommand,
    VerifyPasskeyAuthenticationCommand,
} from '@libs/contracts/commands';
import { AUTH_CONTROLLER } from '@libs/contracts/api/controllers/auth';
import { CONTROLLERS_INFO } from '@libs/contracts/api';

import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';

import {
    GetStatusResponseDto,
    LoginRequestDto,
    LoginResponseDto,
    RegisterRequestDto,
    RegisterResponseDto,
    TelegramCallbackRequestDto,
    TelegramCallbackResponseDto,
    OAuth2AuthorizeResponseDto,
    OAuth2CallbackResponseDto,
    OAuth2CallbackRequestDto,
    OAuth2AuthorizeRequestDto,
    GetPasskeyAuthenticationOptionsResponseDto,
    VerifyPasskeyAuthenticationRequestDto,
    VerifyPasskeyAuthenticationResponseDto,
} from './dtos';
import { RegisterResponseModel } from './model/register.response.model';
import { AuthResponseModel } from './model/auth-response.model';
import { AuthService } from './auth.service';

@ApiTags(CONTROLLERS_INFO.AUTH.tag)
@UseFilters(HttpExceptionFilter)
@Controller(AUTH_CONTROLLER)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiResponse({ type: LoginResponseDto, description: 'Access token for further requests' })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - Invalid credentials',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Invalid credentials' },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    })
    @Endpoint({
        command: LoginCommand,
        httpCode: HttpStatus.OK,
        apiBody: LoginRequestDto,
    })
    async login(
        @Body() body: LoginRequestDto,
        @IpAddress() ip: string,
        @UserAgent() userAgent: string,
    ): Promise<LoginResponseDto> {
        const result = await this.authService.login(body, ip, userAgent);

        const data = errorHandler(result);
        return {
            response: new AuthResponseModel(data),
        };
    }

    @ApiForbiddenResponse({
        description: 'Forbidden - Registration is not allowed',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 403 },
                message: { type: 'string', example: 'Registration is not allowed' },
                error: { type: 'string', example: 'Forbidden' },
            },
        },
    })
    @ApiResponse({ type: RegisterResponseDto, description: 'Access token for further requests' })
    @Endpoint({
        command: RegisterCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: RegisterRequestDto,
    })
    async register(@Body() body: RegisterRequestDto): Promise<RegisterResponseDto> {
        const result = await this.authService.register(body);

        const data = errorHandler(result);
        return {
            response: new RegisterResponseModel(data),
        };
    }

    @ApiResponse({ type: GetStatusResponseDto, description: 'Status of the system' })
    @Endpoint({
        command: GetStatusCommand,
        httpCode: HttpStatus.OK,
    })
    async getStatus(): Promise<GetStatusResponseDto> {
        const result = await this.authService.getStatus();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: TelegramCallbackResponseDto,
        description: 'Access token for further requests',
    })
    @Endpoint({
        command: TelegramCallbackCommand,
        httpCode: HttpStatus.OK,
        apiBody: TelegramCallbackRequestDto,
    })
    async telegramCallback(
        @Body() body: TelegramCallbackRequestDto,
        @IpAddress() ip: string,
        @UserAgent() userAgent: string,
    ): Promise<TelegramCallbackResponseDto> {
        const result = await this.authService.telegramCallback(body, ip, userAgent);

        const data = errorHandler(result);
        return {
            response: new AuthResponseModel(data),
        };
    }

    @ApiResponse({
        type: OAuth2AuthorizeResponseDto,
        description: 'OAuth2 authorization URL',
    })
    @Endpoint({
        command: OAuth2AuthorizeCommand,
        httpCode: HttpStatus.OK,
        apiBody: OAuth2AuthorizeRequestDto,
    })
    async oauth2Authorize(
        @Body() body: OAuth2AuthorizeRequestDto,
    ): Promise<OAuth2AuthorizeResponseDto> {
        const result = await this.authService.oauth2Authorize(body.provider);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: OAuth2CallbackResponseDto,
        description: 'Access token for further requests',
    })
    @Endpoint({
        command: OAuth2CallbackCommand,
        httpCode: HttpStatus.OK,
        apiBody: OAuth2CallbackRequestDto,
    })
    async oauth2Callback(
        @Body() body: OAuth2CallbackRequestDto,
        @IpAddress() ip: string,
        @UserAgent() userAgent: string,
    ): Promise<OAuth2CallbackResponseDto> {
        const result = await this.authService.oauth2Callback(
            body.code,
            body.state,
            body.provider,
            ip,
            userAgent,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: GetPasskeyAuthenticationOptionsResponseDto,
        description: 'Passkey authentication options',
    })
    @Endpoint({
        command: GetPasskeyAuthenticationOptionsCommand,
        httpCode: HttpStatus.OK,
    })
    async passkeyAuthenticationOptions(
        @GetRemnawaveSettings() remnawaveSettings: RemnawaveSettingsEntity,
    ): Promise<GetPasskeyAuthenticationOptionsResponseDto> {
        const result =
            await this.authService.generatePasskeyAuthenticationOptions(remnawaveSettings);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: VerifyPasskeyAuthenticationResponseDto,
        description: 'JWT access token after successful passkey authentication',
    })
    @Endpoint({
        command: VerifyPasskeyAuthenticationCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyPasskeyAuthenticationRequestDto,
    })
    async passkeyAuthenticationVerify(
        @Body() body: VerifyPasskeyAuthenticationRequestDto,
        @GetRemnawaveSettings() remnawaveSettings: RemnawaveSettingsEntity,
        @IpAddress() ip: string,
        @UserAgent() userAgent: string,
    ): Promise<VerifyPasskeyAuthenticationResponseDto> {
        const result = await this.authService.verifyPasskeyAuthentication(
            body,
            remnawaveSettings,
            ip,
            userAgent,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
