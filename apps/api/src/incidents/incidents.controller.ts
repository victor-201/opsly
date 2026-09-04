import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentOrgId } from '../common/decorators/current-org-id.decorator';
import { IncidentsService } from './incidents.service';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateIncidentStatusDto {
  @ApiProperty({ example: 'investigating' })
  @IsString()
  status: string;
}

class AddIncidentNoteDto {
  @ApiProperty({ example: 'Investigating the issue' })
  @IsString()
  content: string;
}

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private service: IncidentsService) {}

  @Get()
  @RequirePermission('incidents:read')
  @ApiOperation({ summary: 'List incidents' })
  async findAll(@CurrentOrgId() orgId: string) {
    return this.service.findAll(orgId);
  }

  @Get(':id')
  @RequirePermission('incidents:read')
  @ApiOperation({ summary: 'Get incident details' })
  async findOne(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id/status')
  @RequirePermission('incidents:manage')
  @ApiOperation({ summary: 'Update incident status' })
  async updateStatus(
    @CurrentOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    return this.service.updateStatus(orgId, id, dto.status);
  }

  @Post(':id/notes')
  @RequirePermission('incidents:manage')
  @ApiOperation({ summary: 'Add incident note' })
  async addNote(
    @CurrentOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: AddIncidentNoteDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.service.addNote(orgId, id, dto.content, req.user.sub);
  }
}
