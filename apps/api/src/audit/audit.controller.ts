import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentOrgId } from '../common/decorators/current-org-id.decorator';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('audit')
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermission('audit:read')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  async findAll(
    @CurrentOrgId() orgId: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    const where: any = { organizationId: orgId };
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
