import requestIp from 'request-ip';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IpAddress = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const headers = request?.headers || {};
    const hadXff = Object.prototype.hasOwnProperty.call(headers, 'x-forwarded-for');
    const savedXff = hadXff ? headers['x-forwarded-for'] : undefined;

    if (hadXff) {
        delete headers['x-forwarded-for'];
    }

    let ip = requestIp.getClientIp(request);

    if (hadXff) {
        headers['x-forwarded-for'] = savedXff as any;
    }

    if (ip) {
        return ip;
    }

    const xff = headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
        const firstIp = xff.split(',')[0]?.trim();
        if (firstIp) {
            return firstIp;
        }
    } else if (Array.isArray(xff) && xff.length > 0) {
        const firstIp = String(xff[0]).split(',')[0]?.trim();
        if (firstIp) {
            return firstIp;
        }
    }

    return 'Unknown';
});
