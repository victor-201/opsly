import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [AuditController],
})
export class AuditModule {}
