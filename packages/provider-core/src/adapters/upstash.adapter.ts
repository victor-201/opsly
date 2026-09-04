import {
  ProviderAdapter,
  ProviderCredentials,
  ConnectionResult,
  ProviderCapabilities,
  NormalizedResource,
} from '../interfaces/provider-adapter';

export class UpstashAdapter implements ProviderAdapter {
  private apiToken: string;
  private restUrl: string;

  getCapabilities(): ProviderCapabilities {
    return {
      health: true,
      metrics: ['commands', 'memory', 'connections'],
      deployments: false,
      logs: false,
      domains: false,
    };
  }

  async validateConnection(credentials: ProviderCredentials): Promise<ConnectionResult> {
    if (!credentials.apiToken || !credentials.restUrl) {
      return { valid: false, error: 'API token and REST URL are required' };
    }

    this.apiToken = credentials.apiToken;
    this.restUrl = credentials.restUrl;

    try {
      const response = await fetch(this.restUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: ['INFO'] }),
      });

      if (response.ok) {
        return { valid: true, accountInfo: { id: 'upstash-account', name: 'Upstash Account' } };
      }

      return { valid: false, error: `API returned ${response.status}` };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  async discoverResources(): Promise<NormalizedResource[]> {
    const response = await fetch(`${this.restUrl}/list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command: ['KEYS', '*'] }),
    });

    if (!response.ok) throw new Error('Failed to discover resources');

    const data = await response.json();
    const keys = data.result || [];

    return [
      {
        providerResourceId: 'upstash-redis',
        type: 'kv-store',
        name: 'Upstash Redis',
        status: 'active',
        providerUrl: 'https://console.upstash.com',
        capabilities: { persistence: true, clustering: false },
        metadata: {
          keyCount: keys.length,
        },
      },
    ];
  }

  async getResource(id: string): Promise<NormalizedResource> {
    return {
      providerResourceId: id,
      type: 'kv-store',
      name: 'Upstash Redis',
      status: 'active',
      capabilities: {},
      metadata: {},
    };
  }
}
