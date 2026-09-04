import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentOrgId } from '../common/decorators/current-org-id.decorator';
import { ChatService } from './chat.service';
import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ChatMessageDto {
  @ApiProperty({ description: 'Tool name to execute' })
  @IsString()
  tool: string;

  @ApiProperty({ description: 'Tool arguments', required: false })
  @IsObject()
  @IsOptional()
  args?: Record<string, any>;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('tools')
  @RequirePermission('chat:use')
  @ApiOperation({ summary: 'List available chat tools' })
  async getTools() {
    return { tools: this.chatService.getAvailableTools() };
  }

  @Post('execute')
  @RequirePermission('chat:use')
  @ApiOperation({ summary: 'Execute a chat tool' })
  async execute(
    @CurrentOrgId() orgId: string,
    @Body() dto: ChatMessageDto,
  ) {
    return this.chatService.executeTool(orgId, dto.tool, dto.args || {});
  }
}
