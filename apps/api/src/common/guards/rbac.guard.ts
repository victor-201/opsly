import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/prisma.service';
import { REQUIRE_PERMISSION_KEY } from '../../common/decorators/require-permission.decorator';

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  operator: 2,
  viewer: 1,
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'provider:connect',
    'provider:read',
    'provider:manage',
    'resource:read',
    'resource:manage',
    'deployment:read',
    'deployment:trigger',
    'deployment:rollback',
    'metrics:read',
    'logs:read',
    'alerts:read',
    'alerts:manage',
    'incidents:read',
    'incidents:manage',
    'chat:use',
    'audit:read',
    'settings:manage',
  ],
  admin: [
    'provider:connect',
    'provider:read',
    'provider:manage',
    'resource:read',
    'resource:manage',
    'deployment:read',
    'deployment:trigger',
    'deployment:rollback',
    'metrics:read',
    'logs:read',
    'alerts:read',
    'alerts:manage',
    'incidents:read',
    'incidents:manage',
    'chat:use',
    'audit:read',
    'settings:manage',
  ],
  operator: [
    'provider:read',
    'resource:read',
    'resource:manage',
    'deployment:read',
    'deployment:trigger',
    'metrics:read',
    'logs:read',
    'alerts:read',
    'alerts:manage',
    'incidents:read',
    'incidents:manage',
    'chat:use',
  ],
  viewer: [
    'provider:read',
    'resource:read',
    'deployment:read',
    'metrics:read',
    'logs:read',
    'alerts:read',
    'incidents:read',
    'chat:use',
  ],
};

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const orgId = request.headers['x-organization-id'];

    if (!orgId) {
      throw new ForbiddenException('Organization ID required');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.sub,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const rolePermissions = ROLE_PERMISSIONS[membership.role] || [];

    if (!rolePermissions.includes(requiredPermission)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.orgId = orgId;
    request.role = membership.role;

    return true;
  }
}
