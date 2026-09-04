import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentOrgId } from '../common/decorators/current-org-id.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private service: ApplicationsService) {}

  @Post()
  @RequirePermission('resource:manage')
  @ApiOperation({ summary: 'Create an application' })
  async create(@CurrentOrgId() orgId: string, @Body() dto: CreateApplicationDto) {
    return this.service.create(orgId, dto);
  }

  @Get()
  @RequirePermission('resource:read')
  @ApiOperation({ summary: 'List applications' })
  async findAll(@CurrentOrgId() orgId: string) {
    return this.service.findAll(orgId);
  }

  @Get(':id')
  @RequirePermission('resource:read')
  @ApiOperation({ summary: 'Get application details' })
  async findOne(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Put(':id')
  @RequirePermission('resource:manage')
  @ApiOperation({ summary: 'Update application' })
  async update(
    @CurrentOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('resource:manage')
  @ApiOperation({ summary: 'Delete application' })
  async remove(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    await this.service.remove(orgId, id);
  }

  @Post(':id/resources/:resourceId')
  @RequirePermission('resource:manage')
  @ApiOperation({ summary: 'Link resource to application' })
  async linkResource(
    @CurrentOrgId() orgId: string,
    @Param('id') appId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.service.linkResource(orgId, appId, resourceId, 1.0);
  }

  @Delete(':id/resources/:resourceId')
  @RequirePermission('resource:manage')
  @ApiOperation({ summary: 'Unlink resource from application' })
  async unlinkResource(
    @CurrentOrgId() orgId: string,
    @Param('id') appId: string,
    @Param('resourceId') resourceId: string,
  ) {
    await this.service.unlinkResource(orgId, appId, resourceId);
  }
}
