import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

import { getJWTConfig } from '@common/config/jwt/jwt.config';

import { RequestAuthService } from './request-auth.service';

@Global()
@Module({
    imports: [CqrsModule, JwtModule.registerAsync(getJWTConfig())],
    providers: [RequestAuthService],
    exports: [RequestAuthService],
})
export class RequestAuthModule {}
