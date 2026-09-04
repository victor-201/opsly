import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  data: any;
  error?: string;
}

@Injectable()
export class ChatService {
  private tools = new Map<string, (orgId: string, args: any) => Promise<any>>();

  constructor(private prisma: PrismaService) {
    this.registerTools();
  }

  private registerTools() {
    this.tools.set('getApplication', this.getApplication.bind(this));
    this.tools.set('getBackend', this.getBackend.bind(this));
    this.tools.set('getFrontend', this.getFrontend.bind(this));
    this.tools.set('getDependencies', this.getDependencies.bind(this));
    this.tools.set('getHealth', this.getHealth.bind(this));
    this.tools.set('getMetrics', this.getMetrics.bind(this));
    this.tools.set('getDeployments', this.getDeployments.bind(this));
    this.tools.set('getIncidents', this.getIncidents.bind(this));
    this.tools.set('getLogs', this.getLogs.bind(this));
    this.tools.set('getProviderStatus', this.getProviderStatus.bind(this));
  }

  async executeTool(orgId: string, toolName: string, args: any): Promise<ToolResult> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      return { tool: toolName, success: false, data: null, error: `Unknown tool: ${toolName}` };
    }

    try {
      const data = await tool(orgId, args);
      return { tool: toolName, success: true, data };
    } catch (error) {
      return { tool: toolName, success: false, data: null, error: String(error) };
    }
  }

  private async getApplication(orgId: string, args: { name: string }) {
    return this.prisma.application.findFirst({
      where: {
        organizationId: orgId,
        name: { contains: args.name, mode: 'insensitive' },
      },
      include: {
        applicationResources: {
          include: {
            resource: { select: { name: true, type: true, status: true, provider: true } },
          },
        },
        domains: true,
      },
    });
  }

  private async getBackend(orgId: string) {
    return this.prisma.resource.findMany({
      where: {
        organizationId: orgId,
        type: { in: ['web-service', 'api', 'database'] },
        deletedAt: null,
      },
      select: { id: true, name: true, type: true, status: true, provider: true },
    });
  }

  private async getFrontend(orgId: string) {
    return this.prisma.resource.findMany({
      where: {
        organizationId: orgId,
        type: { in: ['static-site', 'cdn', 'pages-project'] },
        deletedAt: null,
      },
      select: { id: true, name: true, type: true, status: true, provider: true },
    });
  }

  private async getDependencies(orgId: string, args: { applicationId: string }) {
    const app = await this.prisma.application.findFirst({
      where: { id: args.applicationId, organizationId: orgId },
      include: {
        applicationResources: {
          include: { resource: true },
        },
      },
    });

    if (!app) return null;

    return {
      application: app.name,
      resources: app.applicationResources.map((ar) => ({
        name: ar.resource.name,
        type: ar.resource.type,
        status: ar.resource.status,
      })),
    };
  }

  private async getHealth(orgId: string) {
    const resources = await this.prisma.resource.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: { name: true, status: true, type: true },
    });

    const healthy = resources.filter((r) => r.status === 'active').length;
    const unhealthy = resources.filter((r) => r.status !== 'active').length;

    return { total: resources.length, healthy, unhealthy, resources };
  }

  private async getMetrics(orgId: string, args?: { resourceId?: string }) {
    const where: any = { organizationId: orgId };
    if (args?.resourceId) where.resourceId = args.resourceId;

    return this.prisma.metricPoint.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });
  }

  private async getDeployments(orgId: string, args?: { resourceId?: string }) {
    const where: any = { organizationId: orgId };
    if (args?.resourceId) where.resourceId = args.resourceId;

    return this.prisma.deployment.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }

  private async getIncidents(orgId: string) {
    return this.prisma.incident.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async getLogs(orgId: string, args?: { resourceId?: string }) {
    const where: any = { organizationId: orgId };
    if (args?.resourceId) where.resourceId = args.resourceId;

    return this.prisma.log.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });
  }

  private async getProviderStatus(orgId: string) {
    return this.prisma.providerConnection.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, providerType: true, status: true, lastSyncAt: true },
    });
  }

  getAvailableTools() {
    return Array.from(this.tools.keys());
  }
}
