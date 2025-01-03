import { Body, Controller, HttpCode, HttpStatus, Post, UseFilters } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AUTH_CONTROLLER, AUTH_ROUTES } from '@libs/contracts/api/controllers/auth';
import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { errorHandler } from '@common/helpers/error-handler.helper';

import { AuthResponseModel } from './model/auth-response.model';
import { LoginRequestDto, LoginResponseDto } from './dtos';
import { AuthService } from './auth.service';

@ApiTags('Auth Controller')
@Controller(AUTH_CONTROLLER)
@UseFilters(HttpExceptionFilter)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiBody({ type: LoginRequestDto })
    @ApiOkResponse({ type: [LoginResponseDto], description: 'Access token for further requests' })
    @ApiOperation({ summary: 'Login', description: 'Login to the system' })
    @HttpCode(HttpStatus.OK)
    @Post(AUTH_ROUTES.LOGIN)
    async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
        const result = await this.authService.login(body);

        const data = errorHandler(result);
        return {
            response: new AuthResponseModel(data),
        };
    }
}
