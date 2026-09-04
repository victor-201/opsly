import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentOrgId } from '../common/decorators/current-org-id.decorator';
import { ResourcesService } from './resources.service';

@ApiTags('Resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private service: ResourcesService) {}

  @Get()
  @RequirePermission('resource:read')
  @ApiOperation({ summary: 'List resources' })
  @ApiQuery({ name: 'provider', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentOrgId() orgId: string,
    @Query('provider') provider?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(orgId, { provider, type, status, search });
  }

  @Get(':id')
  @RequirePermission('resource:read')
  @ApiOperation({ summary: 'Get resource details' })
  async findOne(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Delete(':id')
  @RequirePermission('resource:manage')
  @ApiOperation({ summary: 'Soft delete resource' })
  async remove(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId, id);
  }
}
