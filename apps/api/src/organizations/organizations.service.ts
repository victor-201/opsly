import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing) throw new ForbiddenException('Organization slug already exists');

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        memberships: {
          create: { userId, role: 'owner' },
        },
      },
      include: { memberships: true },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: (org.memberships.find((m) => m.userId === userId) ?? org.memberships[0]).role,
    };
  }

  async findAll(userId: string) {
    return this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      include: { _count: { select: { memberships: true, resources: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, memberships: { some: { userId } } },
      include: {
        memberships: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        _count: { select: { resources: true, applications: true } },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async remove(userId: string, id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: id, userId } },
    });

    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only owner can delete organization');
    }

    await this.prisma.organization.delete({ where: { id } });
  }
}
