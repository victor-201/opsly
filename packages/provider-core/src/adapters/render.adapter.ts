import {
  ProviderAdapter,
  ProviderCredentials,
  ConnectionResult,
  ProviderCapabilities,
  NormalizedResource,
} from '../interfaces/provider-adapter';

export class RenderAdapter implements ProviderAdapter {
  private apiKey: string;

  getCapabilities(): ProviderCapabilities {
    return {
      health: true,
      metrics: ['cpu', 'memory', 'requests', 'latency'],
      deployments: true,
      logs: true,
      domains: true,
    };
  }

  async validateConnection(credentials: ProviderCredentials): Promise<ConnectionResult> {
    if (!credentials.apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    this.apiKey = credentials.apiKey;

    try {
      const response = await fetch('https://api.render.com/v1/services', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          accountInfo: {
            id: data[0]?.owner_id || 'unknown',
            name: 'Render Account',
          },
        };
      }

      return { valid: false, error: await this.errorDetail('Render', response) };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  private async errorDetail(provider: string, response: Response): Promise<string> {
    const body = await response.text().catch(() => '');
    return `API returned ${response.status} (${provider})${body ? `: ${body.slice(0, 240)}` : ''}`;
  }

  async discoverResources(): Promise<NormalizedResource[]> {
    const response = await fetch('https://api.render.com/v1/services', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Render API error: ${response.status}`);
    }

    const data = await response.json();
    return data.map((service: any) => ({
      providerResourceId: service.id,
      type: service.type,
      name: service.name,
      region: service.region,
      environment: service.service_details?.env,
      repository: service.repo,
      branch: service.branch,
      status: service.service_details?.status || 'unknown',
      providerUrl: `https://dashboard.render.com/web/${service.id}`,
      capabilities: {
        autoDeploy: service.auto_deploy,
        healthCheck: true,
        ssl: true,
      },
      metadata: {
        runtime: service.service_details?.runtime,
        plan: service.service_details?.plan,
      },
    }));
  }

  async getResource(id: string): Promise<NormalizedResource> {
    const response = await fetch(`https://api.render.com/v1/services/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Render API error: ${response.status}`);
    }

    const service = await response.json();
    return {
      providerResourceId: service.id,
      type: service.type,
      name: service.name,
      region: service.region,
      status: service.service_details?.status || 'unknown',
      capabilities: { autoDeploy: service.auto_deploy },
      metadata: {},
    };
  }
}
