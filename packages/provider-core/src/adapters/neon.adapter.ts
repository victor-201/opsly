import {
  ProviderAdapter,
  ProviderCredentials,
  ConnectionResult,
  ProviderCapabilities,
  NormalizedResource,
} from '../interfaces/provider-adapter';

export class NeonAdapter implements ProviderAdapter {
  private apiKey: string;
  private orgId?: string;

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
    this.orgId = credentials.orgId || undefined;

    const response = await fetch(this.projectsUrl(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      return { valid: true, accountInfo: { id: this.orgId ?? 'neon-account', name: 'Neon Account' } };
    }

    const body = await response.text().catch(() => '');
    const bodyExcerpt = body ? `: ${body.slice(0, 240)}` : '';
    const missingOrgId = /org_id is required/i.test(body);
    const error = missingOrgId
      ? 'API returned 400 (Neon): this account uses a personal API key. Add your Organization ID (Neon → Organization → Settings → General information) in the Organization ID field.'
      : `API returned ${response.status} (Neon)${bodyExcerpt}`;

    return { valid: false, error };
  }

  private projectsUrl(): string {
    return this.orgId
      ? `https://console.neon.tech/api/v2/projects?org_id=${encodeURIComponent(this.orgId)}`
      : 'https://console.neon.tech/api/v2/projects';
  }

  private withOrgId(url: string): string {
    return this.orgId
      ? `${url}${url.includes('?') ? '&' : '?'}org_id=${encodeURIComponent(this.orgId)}`
      : url;
  }

  async discoverResources(): Promise<NormalizedResource[]> {
    const response = await fetch(this.projectsUrl(), {
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
        this.withOrgId(`https://console.neon.tech/api/v2/projects/${project.id}/branches`),
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
      this.withOrgId(`https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}`),
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
