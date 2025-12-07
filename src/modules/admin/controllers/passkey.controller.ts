import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { GetJWTPayload } from '@common/decorators/get-jwt-payload';
import { RolesGuard } from '@common/guards/roles/roles.guard';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles';
import {
    GetPasskeyRegistrationOptionsCommand,
    VerifyPasskeyRegistrationCommand,
    DeletePasskeyCommand,
    GetAllPasskeysCommand,
    UpdatePasskeyCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, PASSKEYS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import { IJWTAuthPayload } from '@modules/auth/interfaces';

import {
    DeletePasskeyRequestDto,
    DeletePasskeyResponseDto,
    GetAllPasskeysResponseDto,
    GetPasskeyRegistrationOptionsResponseDto,
    UpdatePasskeyRequestDto,
    UpdatePasskeyResponseDto,
    VerifyPasskeyRegistrationRequestDto,
    VerifyPasskeyRegistrationResponseDto,
} from '../dtos';
import { PasskeyService } from '../services/passkey.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.PASSKEYS.tag)
@Roles(ROLE.ADMIN)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(PASSKEYS_CONTROLLER)
export class PasskeyController {
    constructor(private readonly passkeyService: PasskeyService) {}

    @ApiResponse({
        type: GetPasskeyRegistrationOptionsResponseDto,
        description: 'Get passkey registration options',
    })
    @Endpoint({
        command: GetPasskeyRegistrationOptionsCommand,
        httpCode: HttpStatus.OK,
    })
    async passkeyRegistrationOptions(
        @GetJWTPayload() payload: IJWTAuthPayload,
    ): Promise<GetPasskeyRegistrationOptionsResponseDto> {
        const result = await this.passkeyService.generatePasskeyRegistrationOptions(payload);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: VerifyPasskeyRegistrationResponseDto,
        description: 'Verify passkey registration result',
    })
    @Endpoint({
        command: VerifyPasskeyRegistrationCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyPasskeyRegistrationRequestDto,
    })
    async passkeyRegistrationVerify(
        @Body() body: VerifyPasskeyRegistrationRequestDto,
        @GetJWTPayload() payload: IJWTAuthPayload,
    ): Promise<VerifyPasskeyRegistrationResponseDto> {
        const result = await this.passkeyService.verifyPasskeyRegistration(payload, body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: GetAllPasskeysResponseDto,
        description: 'Get all passkeys',
    })
    @Endpoint({
        command: GetAllPasskeysCommand,
        httpCode: HttpStatus.OK,
    })
    async getActivePasskeys(
        @GetJWTPayload() payload: IJWTAuthPayload,
    ): Promise<GetAllPasskeysResponseDto> {
        const result = await this.passkeyService.getActivePasskeys(payload);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: DeletePasskeyResponseDto,
        description: 'Delete passkey result',
    })
    @Endpoint({
        command: DeletePasskeyCommand,
        httpCode: HttpStatus.OK,
        apiBody: DeletePasskeyRequestDto,
    })
    async deletePasskey(
        @Body() body: DeletePasskeyRequestDto,
        @GetJWTPayload() payload: IJWTAuthPayload,
    ): Promise<DeletePasskeyResponseDto> {
        const result = await this.passkeyService.deletePasskey(payload, body.id);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: UpdatePasskeyResponseDto,
        description: 'Update passkey',
    })
    @Endpoint({
        command: UpdatePasskeyCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdatePasskeyRequestDto,
    })
    async updatePasskey(
        @Body() body: UpdatePasskeyRequestDto,
        @GetJWTPayload() payload: IJWTAuthPayload,
    ): Promise<UpdatePasskeyResponseDto> {
        const result = await this.passkeyService.updatePasskey(payload, body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
