import {
  ProviderAdapter,
  ProviderCredentials,
  ConnectionResult,
  ProviderCapabilities,
  NormalizedResource,
} from '../interfaces/provider-adapter';

export class NeonAdapter implements ProviderAdapter {
  private apiKey: string;

  getCapabilities(): ProviderCapabilities {
    return {
      health: true,
      metrics: ['connections', 'queries', 'storage', 'cpu'],
      deployments: false,
      logs: false,
      domains: false,
    };
  }

  async validateConnection(credentials: ProviderCredentials): Promise<ConnectionResult> {
    if (!credentials.apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    this.apiKey = credentials.apiKey;

    try {
      const response = await fetch('https://console.neon.tech/api/v2/projects', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return { valid: true, accountInfo: { id: 'neon-account', name: 'Neon Account' } };
      }

      return { valid: false, error: await this.errorDetail('Neon', response) };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  private async errorDetail(provider: string, response: Response): Promise<string> {
    const body = await response.text().catch(() => '');
    return `API returned ${response.status} (${provider})${body ? `: ${body.slice(0, 240)}` : ''}`;
  }

  async discoverResources(): Promise<NormalizedResource[]> {
    const response = await fetch('https://console.neon.tech/api/v2/projects', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Neon API error: ${response.status}`);

    const data = await response.json();
    const resources: NormalizedResource[] = [];

    for (const project of data.projects || []) {
      const branchesResponse = await fetch(
        `https://console.neon.tech/api/v2/projects/${project.id}/branches`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
        },
      );

      const branchesData = await branchesResponse.json();

      for (const branch of branchesData.branches || []) {
        resources.push({
          providerResourceId: `${project.id}:${branch.id}`,
          type: 'database',
          name: `${project.name}/${branch.name}`,
          region: branch.logical_size ? 'active' : 'idle',
          status: branch.active ? 'active' : 'idle',
          providerUrl: `https://console.neon.tech/app/projects/${project.id}`,
          capabilities: { branching: true, autoscaling: true },
          metadata: {
            projectId: project.id,
            branchId: branch.id,
            connectionString: branch.connection_uris?.[0]?.connection_uri,
          },
        });
      }
    }

    return resources;
  }

  async getResource(id: string): Promise<NormalizedResource> {
    const [projectId, branchId] = id.split(':');
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      },
    );

    if (!response.ok) throw new Error('Failed to get resource');

    const data = await response.json();
    const branch = data.branch;
    return {
      providerResourceId: id,
      type: 'database',
      name: branch.name,
      status: branch.active ? 'active' : 'idle',
      capabilities: {},
      metadata: {},
    };
  }
}
