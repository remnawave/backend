import requestIp from 'request-ip';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IpAddress = createParamDecorator((data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const cfConnectingIp = request.headers?.['cf-connecting-ip'] || request.headers?.['CF-Connecting-IP'];
    if (cfConnectingIp) {
        return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
    }

    if (request.clientIp) {
        return request.clientIp;
    }

    const ip = requestIp.getClientIp(request);
    return ip || 'Unknown';
});
