import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ProviderType } from '@opsly/shared';
import {
  ProviderAdapter,
  ProviderCapabilities,
  RenderAdapter,
  CloudflarePagesAdapter,
  NeonAdapter,
  UpstashAdapter,
  MongoAtlasAdapter,
} from '@opsly/provider-core';

@Injectable()
export class ProviderRegistry implements OnModuleInit {
  private adapters = new Map<ProviderType, ProviderAdapter>();

  onModuleInit() {
    const typeToAdapter: Record<ProviderType, ProviderAdapter> = {
      render: new RenderAdapter(),
      cloudflare: new CloudflarePagesAdapter(),
      neon: new NeonAdapter(),
      upstash: new UpstashAdapter(),
      'mongodb-atlas': new MongoAtlasAdapter(),
    };

    for (const [type, adapter] of Object.entries(typeToAdapter)) {
      this.register(type as ProviderType, adapter);
    }
  }

  register(type: ProviderType, adapter: ProviderAdapter) {
    this.adapters.set(type, adapter);
  }

  getAdapter(type: ProviderType): ProviderAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      throw new NotFoundException(`Provider ${type} not supported`);
    }
    return adapter;
  }

  getCapabilities(type: ProviderType): ProviderCapabilities {
    return this.getAdapter(type).getCapabilities();
  }

  getAllCapabilities(): Map<ProviderType, ProviderCapabilities> {
    const result = new Map<ProviderType, ProviderCapabilities>();
    for (const [type, adapter] of this.adapters) {
      result.set(type, adapter.getCapabilities());
    }
    return result;
  }

  getSupportedTypes(): ProviderType[] {
    return Array.from(this.adapters.keys());
  }
}
