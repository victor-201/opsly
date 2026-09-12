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

    const projects = await fetch(this.projectsUrl(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    const projectsBody = await projects.text().catch(() => '');

    if (projects.ok) {
      return { valid: true, accountInfo: { id: this.orgId ?? 'neon-account', name: 'Neon Account' } };
    }

    if (/org_id is required/i.test(projectsBody)) {
      const autoOrgId = await this.detectOrgId();
      if (autoOrgId) {
        this.orgId = autoOrgId;
        const retry = await fetch(this.projectsUrl(), {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
        });
        if (retry.ok) {
          return { valid: true, accountInfo: { id: autoOrgId, name: 'Neon Account' } };
        }
      }
      return {
        valid: false,
        error:
          'API returned 400 (Neon): this account uses a personal API key and no organization could be auto-detected. Add your Organization ID (Neon → Organization → Settings → General information) in the Organization ID field.',
      };
    }

    return { valid: false, error: `API returned ${projects.status} (Neon)${projectsBody ? `: ${projectsBody.slice(0, 240)}` : ''}` };
  }

  private async detectOrgId(): Promise<string | null> {
    try {
      const response = await fetch('https://console.neon.tech/api/v2/users/me/organizations', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return (data.organizations?.[0]?.id as string | undefined) ?? null;
    } catch {
      return null;
    }
  }

  async listOrganizations(
    credentials: ProviderCredentials,
  ): Promise<{ ok: boolean; organizations: { id: string; name: string }[]; error?: string }> {
    try {
      const response = await fetch('https://console.neon.tech/api/v2/users/me/organizations', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        return { ok: false, organizations: [], error: `Neon API returned ${response.status}` };
      }
      const data = await response.json();
      return {
        ok: true,
        organizations: (data.organizations ?? []).map((o: { id: string; name?: string }) => ({
          id: o.id,
          name: o.name || o.id,
        })),
      };
    } catch (error) {
      return { ok: false, organizations: [], error: String(error) };
    }
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
