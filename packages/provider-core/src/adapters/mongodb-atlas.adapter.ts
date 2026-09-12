import {
  ProviderAdapter,
  ProviderCredentials,
  ConnectionResult,
  ProviderCapabilities,
  NormalizedResource,
} from '../interfaces/provider-adapter';

export class MongoAtlasAdapter implements ProviderAdapter {
  private apiKey: string;
  private projectId: string;

  getCapabilities(): ProviderCapabilities {
    return {
      health: true,
      metrics: ['connections', 'operations', 'storage', 'cpu'],
      deployments: false,
      logs: true,
      domains: false,
    };
  }

  async validateConnection(credentials: ProviderCredentials): Promise<ConnectionResult> {
    if (!credentials.apiKey || !credentials.projectId) {
      return { valid: false, error: 'API key and project ID are required' };
    }

    this.apiKey = credentials.apiKey;
    this.projectId = credentials.projectId;

    try {
      const response = await fetch(
        `https://cloud.mongodb.com/api/atlas/v1.0/groups/${credentials.projectId}/clusters`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`:${credentials.apiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        return { valid: true, accountInfo: { id: credentials.projectId, name: 'MongoDB Atlas' } };
      }

      return { valid: false, error: await this.errorDetail(response) };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  private async errorDetail(response: Response): Promise<string> {
    const body = await response.text().catch(() => '');
    return `API returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ''}`;
  }

  async discoverResources(): Promise<NormalizedResource[]> {
    const response = await fetch(
      `https://cloud.mongodb.com/api/atlas/v1.0/groups/${this.projectId}/clusters`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${this.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) throw new Error('Failed to discover resources');

    const data = await response.json();
    return (data.results || []).map((cluster: any) => ({
      providerResourceId: cluster.id,
      type: 'database-cluster',
      name: cluster.name,
      region: cluster.providerSettings?.regionName,
      status: cluster.stateName === 'IDLE' ? 'active' : cluster.stateName?.toLowerCase(),
      providerUrl: `https://cloud.mongodb.com/v2#/clusters/detail/${cluster.name}`,
      capabilities: {
        autoScaling: cluster.autoScaling?.diskGBEnabled,
        sharding: cluster.clusterType === 'SHARDED',
      },
      metadata: {
        version: cluster.mongoDBVersion,
        tier: cluster.providerSettings?.instanceSizeName,
      },
    }));
  }

  async getResource(id: string): Promise<NormalizedResource> {
    const response = await fetch(
      `https://cloud.mongodb.com/api/atlas/v1.0/groups/${this.projectId}/clusters/${id}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${this.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) throw new Error('Failed to get resource');

    const cluster = await response.json();
    return {
      providerResourceId: cluster.id,
      type: 'database-cluster',
      name: cluster.name,
      status: cluster.stateName?.toLowerCase() || 'unknown',
      capabilities: {},
      metadata: {},
    };
  }
}
