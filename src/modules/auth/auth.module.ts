import { HttpModule } from '@nestjs/axios';
import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { getJWTConfig } from '@common/config/jwt/jwt.config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies';
import { COMMANDS } from './commands';

@Module({
    imports: [CqrsModule, JwtModule.registerAsync(getJWTConfig()), HttpModule],
    controllers: [AuthController],
    providers: [JwtStrategy, AuthService, ...COMMANDS],
})
export class AuthModule {}
