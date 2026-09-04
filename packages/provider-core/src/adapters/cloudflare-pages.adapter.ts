import {
  ProviderAdapter,
  ProviderCredentials,
  ConnectionResult,
  ProviderCapabilities,
  NormalizedResource,
} from '../interfaces/provider-adapter';

export class CloudflarePagesAdapter implements ProviderAdapter {
  private apiToken: string;
  private accountId: string;

  getCapabilities(): ProviderCapabilities {
    return {
      health: true,
      metrics: ['requests', 'bandwidth', 'cacheHitRatio'],
      deployments: true,
      logs: true,
      domains: true,
    };
  }

  async validateConnection(credentials: ProviderCredentials): Promise<ConnectionResult> {
    if (!credentials.apiToken || !credentials.accountId) {
      return { valid: false, error: 'API token and account ID are required' };
    }

    this.apiToken = credentials.apiToken;
    this.accountId = credentials.accountId;

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.apiToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        return {
          valid: true,
          accountInfo: { id: data.result.id, name: data.result.name },
        };
      }

      return { valid: false, error: data.errors?.[0]?.message || 'Validation failed' };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  async discoverResources(): Promise<NormalizedResource[]> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();
    if (!data.success) throw new Error('Failed to discover resources');

    return data.result.map((project: any) => ({
      providerResourceId: project.name,
      type: 'pages-project',
      name: project.name,
      environment: 'production',
      repository: project.source?.config?.repo_url,
      branch: project.source?.config?.branch,
      domain: project.subdomain ? `${project.subdomain}.pages.dev` : undefined,
      status: project.latest_deployment?.latest_stage?.status || 'unknown',
      providerUrl: `https://dash.cloudflare.com/${this.accountId}/pages`,
      capabilities: { buildConfig: true, previewDeployments: true },
      metadata: {
        deploymentUrl: project.latest_deployment?.url,
      },
    }));
  }

  async getResource(id: string): Promise<NormalizedResource> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();
    if (!data.success) throw new Error('Failed to get resource');

    const project = data.result;
    return {
      providerResourceId: project.name,
      type: 'pages-project',
      name: project.name,
      domain: project.subdomain ? `${project.subdomain}.pages.dev` : undefined,
      status: project.latest_deployment?.latest_stage?.status || 'unknown',
      capabilities: {},
      metadata: {},
    };
  }
}
