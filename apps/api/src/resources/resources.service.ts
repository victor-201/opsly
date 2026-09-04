import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, filters?: { provider?: string; type?: string; status?: string; search?: string }) {
    const where: any = { organizationId: orgId, deletedAt: null };

    if (filters?.provider) where.provider = filters.provider;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.resource.findMany({
      where,
      include: {
        providerConnection: { select: { name: true, providerType: true } },
        applicationResources: {
          include: { application: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(orgId: string, id: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        providerConnection: { select: { name: true, providerType: true } },
        applicationResources: {
          include: { application: { select: { id: true, name: true } } },
        },
        deployments: { orderBy: { startedAt: 'desc' }, take: 10 },
        metricPoints: { orderBy: { recordedAt: 'desc' }, take: 50 },
        logs: { orderBy: { recordedAt: 'desc' }, take: 50 },
      },
    });

    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.resource.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
  }
}
