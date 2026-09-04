import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  async create(@Request() req: { user: { sub: string } }, @Body() dto: CreateOrganizationDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List user organizations' })
  async findAll(@Request() req: { user: { sub: string } }) {
    return this.service.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  async findOne(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.findOne(req.user.sub, id);
  }

  @Delete(':id')
  @RequirePermission('settings:manage')
  @ApiOperation({ summary: 'Delete organization (owner only)' })
  async remove(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    await this.service.remove(req.user.sub, id);
  }
}
