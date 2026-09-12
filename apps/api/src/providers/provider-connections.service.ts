import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProviderRegistry } from './provider-registry.service';
import { CredentialService } from './credential.service';
import { CreateProviderConnectionDto } from './dto/create-provider-connection.dto';
import { ProviderType } from '@opsly/shared';

@Injectable()
export class ProviderConnectionsService {
  constructor(
    private prisma: PrismaService,
    private registry: ProviderRegistry,
    private credentials: CredentialService,
  ) {}

  async create(orgId: string, dto: CreateProviderConnectionDto) {
    const adapter = this.registry.getAdapter(dto.providerType as ProviderType);

    const connection = await this.prisma.providerConnection.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        providerType: dto.providerType,
        status: 'validating',
      },
    });

    const credentials = Object.fromEntries(
      Object.entries(dto.credentials)
        .map(([k, v]) => [k, (v ?? '').trim()])
        .filter(([, v]) => v !== ''),
    );

    try {
      const result = await adapter.validateConnection(credentials);

      if (!result.valid) {
        await this.prisma.providerConnection.update({
          where: { id: connection.id },
          data: { status: 'invalid', lastSyncError: result.error },
        });
        const hint =
          /^API returned (401|403) \(/.test(result.error || '')
            ? ' Verify the credential is valid and has no extra spaces, quotes or newlines.'
            : /^API returned 400 \(/.test(result.error || '')
              ? ''
              : ' Check that the entered credentials are correct.';
        throw new BadRequestException(`Provider validation failed: ${result.error}.${hint}`);
      }

      const encrypted = this.credentials.encrypt(credentials);

      await this.prisma.credential.create({
        data: {
          providerConnectionId: connection.id,
          encryptedData: encrypted.encryptedData,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        },
      });

      return this.prisma.providerConnection.update({
        where: { id: connection.id },
        data: { status: 'valid' },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      await this.prisma.providerConnection.update({
        where: { id: connection.id },
        data: { status: 'error', lastSyncError: String(error) },
      });
      throw new BadRequestException('Failed to validate provider credentials');
    }
  }

  async findAll(orgId: string) {
    return this.prisma.providerConnection.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { resources: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const connection = await this.prisma.providerConnection.findFirst({
      where: { id, organizationId: orgId },
      include: { _count: { select: { resources: true } } },
    });

    if (!connection) {
      throw new NotFoundException('Provider connection not found');
    }

    return connection;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.providerConnection.delete({ where: { id } });
  }

  async getDecryptedCredentials(connectionId: string): Promise<Record<string, string>> {
    const credential = await this.prisma.credential.findFirst({
      where: { providerConnectionId: connectionId },
    });

    if (!credential) {
      throw new NotFoundException('Credentials not found');
    }

    return this.credentials.decrypt(
      credential.encryptedData,
      credential.iv,
      credential.authTag,
    );
  }
}
