import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
        metadata: {
          repositoryUrl: dto.repositoryUrl,
          type: dto.type,
        },
      },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.application.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { applicationResources: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, organizationId: orgId },
      include: {
        applicationResources: {
          include: {
            resource: {
              select: { id: true, type: true, status: true, provider: true, name: true },
            },
          },
        },
        domains: true,
      },
    });

    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async update(orgId: string, id: string, dto: UpdateApplicationDto) {
    await this.findOne(orgId, id);
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.repositoryUrl) {
      const app = await this.prisma.application.findUnique({ where: { id } });
      if (app) {
        updateData.metadata = { ...((app.metadata as object) || {}), repositoryUrl: dto.repositoryUrl };
      }
    }
    return this.prisma.application.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.application.delete({ where: { id } });
  }

  async linkResource(orgId: string, appId: string, resourceId: string, confidence: number) {
    await this.findOne(orgId, appId);
    return this.prisma.applicationResource.create({
      data: {
        applicationId: appId,
        resourceId,
        confidence,
      },
    });
  }

  async unlinkResource(orgId: string, appId: string, resourceId: string) {
    await this.findOne(orgId, appId);
    await this.prisma.applicationResource.deleteMany({
      where: { applicationId: appId, resourceId },
    });
  }
}
