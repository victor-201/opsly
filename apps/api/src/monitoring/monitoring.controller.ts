import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentOrgId } from '../common/decorators/current-org-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private service: MonitoringService) {}

  @Get('alerts')
  @RequirePermission('alerts:read')
  @ApiOperation({ summary: 'Get organization alerts' })
  async getAlerts(@CurrentOrgId() orgId: string) {
    return this.service.getOrganizationAlerts(orgId);
  }

  @Post('alerts/:id/acknowledge')
  @RequirePermission('alerts:manage')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.acknowledgeAlert(id, userId);
  }

  @Post('alerts/:id/resolve')
  @RequirePermission('alerts:manage')
  @ApiOperation({ summary: 'Resolve an alert' })
  async resolveAlert(@Param('id') id: string) {
    return this.service.resolveAlert(id);
  }
}
