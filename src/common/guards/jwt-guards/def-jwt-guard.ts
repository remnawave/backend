import type { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { RequestAuthService } from '@common/request-auth/request-auth.service';

@Injectable()
export class JwtDefaultGuard implements CanActivate {
    constructor(private readonly requestAuthService: RequestAuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        if (!this.requestAuthService.isAuthenticated(request)) {
            await this.requestAuthService.authenticate(request);
        }

        return true;
    }
}
