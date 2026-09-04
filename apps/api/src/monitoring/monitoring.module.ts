import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, ScheduleModule.forRoot()],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
