import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async checkStaleResources() {
    this.logger.debug('Checking for stale resources');

    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);

    const staleResources = await this.prisma.resource.findMany({
      where: {
        lastSyncAt: { lt: staleThreshold },
        status: { not: 'inactive' },
        deletedAt: null,
      },
      select: { id: true, name: true, lastSyncAt: true },
    });

    if (staleResources.length > 0) {
      this.logger.warn(`Found ${staleResources.length} stale resources`);
    }
  }

  @Cron('*/15 * * * *')
  async evaluateAlertConditions() {
    this.logger.debug('Evaluating alert conditions');

    const resources = await this.prisma.resource.findMany({
      where: {
        status: { in: ['error', 'degraded'] },
        deletedAt: null,
      },
    });

    for (const resource of resources) {
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          organizationId: resource.organizationId,
          scope: { path: ['resourceId'], equals: resource.id },
          status: { in: ['active'] },
        },
      });

      if (!existingAlert) {
        await this.prisma.alert.create({
          data: {
            organizationId: resource.organizationId,
            name: `Resource ${resource.name} is ${resource.status}`,
            condition: 'resource_status',
            scope: {
              resourceId: resource.id,
              expectedStatus: 'active',
              currentStatus: resource.status,
            },
            status: 'active',
          },
        });
      }
    }
  }

  async getOrganizationAlerts(orgId: string) {
    return this.prisma.alert.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: {
        lastAcknowledgedAt: new Date(),
      },
    });
  }

  async resolveAlert(alertId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: {
        lastResolvedAt: new Date(),
        status: 'resolved',
      },
    });
  }
}
