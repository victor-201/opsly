import { Module } from '@nestjs/common';
import { ProviderRegistry } from './provider-registry.service';
import { CredentialService } from './credential.service';
import { ProviderConnectionsService } from './provider-connections.service';
import { ProviderConnectionsController } from './provider-connections.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ProviderConnectionsController],
  providers: [ProviderRegistry, CredentialService, ProviderConnectionsService],
  exports: [ProviderRegistry, CredentialService, ProviderConnectionsService],
})
export class ProvidersModule {}
