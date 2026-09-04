import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentOrgId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgId;
  },
);
