import {
  Controller,
  Get,
  Post,
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
import { ProviderConnectionsService } from './provider-connections.service';
import { CreateProviderConnectionDto } from './dto/create-provider-connection.dto';
import { PreviewOrganizationsDto } from './dto/preview-organizations.dto';

@ApiTags('Provider Connections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('provider-connections')
export class ProviderConnectionsController {
  constructor(private service: ProviderConnectionsService) {}

  @Post('organizations')
  @RequirePermission('provider:connect')
  @ApiOperation({ summary: 'List selectable organizations for a provider' })
  async listOrganizations(@Body() dto: PreviewOrganizationsDto) {
    return this.service.listOrganizations(dto);
  }

  @Post()
  @RequirePermission('provider:connect')
  @ApiOperation({ summary: 'Connect a provider account' })
  async create(
    @CurrentOrgId() orgId: string,
    @Body() dto: CreateProviderConnectionDto,
  ) {
    return this.service.create(orgId, dto);
  }

  @Get()
  @RequirePermission('provider:read')
  @ApiOperation({ summary: 'List provider connections' })
  async findAll(@CurrentOrgId() orgId: string) {
    return this.service.findAll(orgId);
  }

  @Get(':id')
  @RequirePermission('provider:read')
  @ApiOperation({ summary: 'Get provider connection details' })
  async findOne(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Delete(':id')
  @RequirePermission('provider:manage')
  @ApiOperation({ summary: 'Disconnect provider' })
  async remove(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    await this.service.remove(orgId, id);
  }
}
