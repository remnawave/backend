import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

import { getJWTConfig } from '@common/config/jwt/jwt.config';

import { ClientIpService } from './client-ip.service';
import { RequestAuthService } from './request-auth.service';

@Global()
@Module({
    imports: [CqrsModule, JwtModule.registerAsync(getJWTConfig())],
    providers: [RequestAuthService, ClientIpService],
    exports: [RequestAuthService, ClientIpService],
})
export class RequestAuthModule {}
