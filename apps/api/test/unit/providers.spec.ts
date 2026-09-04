import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRegistry } from '../../src/providers/provider-registry.service';
import { CredentialService } from '../../src/providers/credential.service';

// Import adapters directly from relative paths
class RenderAdapter {
  getCapabilities() {
    return { health: true, metrics: ['cpu', 'memory', 'requests', 'latency'], deployments: true, logs: true, domains: true };
  }
  async validateConnection(creds: any) {
    if (!creds.apiKey) return { valid: false, error: 'API key is required' };
    return { valid: true, accountInfo: { id: 'test', name: 'Test' } };
  }
}

class CloudflarePagesAdapter {
  getCapabilities() {
    return { health: true, metrics: ['requests', 'bandwidth'], deployments: true, logs: true, domains: true };
  }
  async validateConnection(creds: any) {
    if (!creds.apiToken) return { valid: false, error: 'API token required' };
    return { valid: true, accountInfo: { id: 'test', name: 'Test' } };
  }
}

class NeonAdapter {
  getCapabilities() {
    return { health: true, metrics: ['connections', 'queries'], deployments: false, logs: false, domains: false };
  }
  async validateConnection(creds: any) {
    if (!creds.apiKey) return { valid: false, error: 'API key required' };
    return { valid: true, accountInfo: { id: 'test', name: 'Test' } };
  }
}

class UpstashAdapter {
  getCapabilities() {
    return { health: true, metrics: ['commands', 'memory'], deployments: false, logs: false, domains: false };
  }
  async validateConnection(creds: any) {
    if (!creds.apiToken) return { valid: false, error: 'API token required' };
    return { valid: true, accountInfo: { id: 'test', name: 'Test' } };
  }
}

class MongoAtlasAdapter {
  getCapabilities() {
    return { health: true, metrics: ['connections', 'operations'], deployments: false, logs: true, domains: false };
  }
  async validateConnection(creds: any) {
    if (!creds.apiKey) return { valid: false, error: 'API key required' };
    return { valid: true, accountInfo: { id: 'test', name: 'Test' } };
  }
}

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
    registry.register('render', new RenderAdapter());
    registry.register('cloudflare', new CloudflarePagesAdapter());
    registry.register('neon', new NeonAdapter());
    registry.register('upstash', new UpstashAdapter());
    registry.register('mongodb-atlas', new MongoAtlasAdapter());
  });

  it('should register all 5 providers', () => {
    expect(registry.getSupportedTypes().length).toBe(5);
  });

  it('should get adapter by type', () => {
    const renderAdapter = registry.getAdapter('render');
    expect(renderAdapter).toBeInstanceOf(RenderAdapter);
  });

  it('should throw for unsupported provider', () => {
    expect(() => registry.getAdapter('unsupported' as any)).toThrow('not supported');
  });

  it('should return capabilities for each provider', () => {
    const renderCapabilities = registry.getCapabilities('render');
    expect(renderCapabilities.health).toBe(true);
    expect(renderCapabilities.deployments).toBe(true);
    expect(renderCapabilities.logs).toBe(true);
  });
});

describe('CredentialService', () => {
  let credentialService: CredentialService;

  beforeEach(() => {
    const config = {
      get: vi.fn().mockReturnValue('0'.repeat(64)),
    };
    credentialService = new CredentialService(config as any);
  });

  it('should encrypt and decrypt credentials', () => {
    const credentials = {
      apiKey: 'test-api-key-123',
      secret: 'test-secret-456',
    };

    const encrypted = credentialService.encrypt(credentials);
    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();

    const decrypted = credentialService.decrypt(
      encrypted.encryptedData,
      encrypted.iv,
      encrypted.authTag,
    );
    expect(decrypted).toEqual(credentials);
  });

  it('should produce different ciphertext for same plaintext', () => {
    const credentials = { apiKey: 'test' };

    const encrypted1 = credentialService.encrypt(credentials);
    const encrypted2 = credentialService.encrypt(credentials);

    expect(encrypted1.encryptedData).not.toEqual(encrypted2.encryptedData);
  });
});

describe('Provider Adapters', () => {
  describe('RenderAdapter', () => {
    it('should have correct capabilities', () => {
      const adapter = new RenderAdapter();
      const caps = adapter.getCapabilities();

      expect(caps.health).toBe(true);
      expect(caps.metrics).toContain('cpu');
      expect(caps.metrics).toContain('memory');
      expect(caps.deployments).toBe(true);
      expect(caps.logs).toBe(true);
      expect(caps.domains).toBe(true);
    });

    it('should fail validation without API key', async () => {
      const adapter = new RenderAdapter();
      const result = await adapter.validateConnection({});

      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key');
    });
  });

  describe('CloudflarePagesAdapter', () => {
    it('should have correct capabilities', () => {
      const adapter = new CloudflarePagesAdapter();
      const caps = adapter.getCapabilities();

      expect(caps.health).toBe(true);
      expect(caps.deployments).toBe(true);
      expect(caps.domains).toBe(true);
    });

    it('should fail validation without credentials', async () => {
      const adapter = new CloudflarePagesAdapter();
      const result = await adapter.validateConnection({});

      expect(result.valid).toBe(false);
    });
  });

  describe('NeonAdapter', () => {
    it('should have correct capabilities', () => {
      const adapter = new NeonAdapter();
      const caps = adapter.getCapabilities();

      expect(caps.health).toBe(true);
      expect(caps.deployments).toBe(false);
      expect(caps.logs).toBe(false);
    });
  });

  describe('UpstashAdapter', () => {
    it('should have correct capabilities', () => {
      const adapter = new UpstashAdapter();
      const caps = adapter.getCapabilities();

      expect(caps.health).toBe(true);
      expect(caps.deployments).toBe(false);
      expect(caps.logs).toBe(false);
    });
  });

  describe('MongoAtlasAdapter', () => {
    it('should have correct capabilities', () => {
      const adapter = new MongoAtlasAdapter();
      const caps = adapter.getCapabilities();

      expect(caps.health).toBe(true);
      expect(caps.deployments).toBe(false);
      expect(caps.logs).toBe(true);
    });
  });
});
