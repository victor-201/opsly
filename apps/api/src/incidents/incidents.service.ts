import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.incident.findMany({
      where: { organizationId: orgId },
      include: { notes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, organizationId: orgId },
      include: { notes: { orderBy: { createdAt: 'desc' } } },
    });

    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async updateStatus(orgId: string, id: string, status: string) {
    await this.findOne(orgId, id);

    const validTransitions: Record<string, string[]> = {
      detected: ['investigating'],
      investigating: ['acknowledged'],
      acknowledged: ['resolved'],
      resolved: ['closed'],
    };

    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');

    const allowed = validTransitions[incident.status] || [];

    if (!allowed.includes(status)) {
      throw new ForbiddenException(`Cannot transition from ${incident.status} to ${status}`);
    }

    return this.prisma.incident.update({
      where: { id },
      data: {
        status,
        timeline: {
          push: { status, timestamp: new Date().toISOString() },
        },
      },
    });
  }

  async addNote(orgId: string, id: string, content: string, authorId: string) {
    await this.findOne(orgId, id);

    return this.prisma.incidentNote.create({
      data: {
        incidentId: id,
        authorId,
        content,
      },
    });
  }
}
