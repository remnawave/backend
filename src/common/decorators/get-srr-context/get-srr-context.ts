import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetSrrContext = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.srrContext;
});
