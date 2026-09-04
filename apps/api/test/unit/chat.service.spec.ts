import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from '../../src/chat/chat.service';

describe('ChatService', () => {
  let chatService: ChatService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      application: { findFirst: vi.fn() },
      resource: { findMany: vi.fn() },
      metricPoint: { findMany: vi.fn() },
      deployment: { findMany: vi.fn() },
      incident: { findMany: vi.fn() },
      log: { findMany: vi.fn() },
      providerConnection: { findMany: vi.fn() },
    };

    chatService = new ChatService(prisma as any);
  });

  describe('getAvailableTools', () => {
    it('should return 10 tools', () => {
      const tools = chatService.getAvailableTools();
      expect(tools.length).toBe(10);
    });

    it('should include all required tools', () => {
      const tools = chatService.getAvailableTools();
      expect(tools).toContain('getApplication');
      expect(tools).toContain('getBackend');
      expect(tools).toContain('getFrontend');
      expect(tools).toContain('getDependencies');
      expect(tools).toContain('getHealth');
      expect(tools).toContain('getMetrics');
      expect(tools).toContain('getDeployments');
      expect(tools).toContain('getIncidents');
      expect(tools).toContain('getLogs');
      expect(tools).toContain('getProviderStatus');
    });
  });

  describe('executeTool', () => {
    it('should return error for unknown tool', async () => {
      const result = await chatService.executeTool('org-1', 'unknownTool', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });

    it('should execute getHealth tool', async () => {
      prisma.resource.findMany.mockResolvedValue([
        { name: 'Resource 1', status: 'active', type: 'web-service' },
        { name: 'Resource 2', status: 'error', type: 'database' },
      ]);

      const result = await chatService.executeTool('org-1', 'getHealth', {});
      expect(result.success).toBe(true);
      expect(result.data.total).toBe(2);
      expect(result.data.healthy).toBe(1);
      expect(result.data.unhealthy).toBe(1);
    });

    it('should execute getProviderStatus tool', async () => {
      prisma.providerConnection.findMany.mockResolvedValue([
        { id: '1', name: 'Render', providerType: 'render', status: 'valid', lastSyncAt: new Date() },
      ]);

      const result = await chatService.executeTool('org-1', 'getProviderStatus', {});
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
    });
  });

  describe('Chat tools are deterministic', () => {
    it('should return same result for same input', async () => {
      prisma.resource.findMany.mockResolvedValue([
        { name: 'Resource 1', status: 'active', type: 'web-service' },
      ]);

      const result1 = await chatService.executeTool('org-1', 'getHealth', {});
      const result2 = await chatService.executeTool('org-1', 'getHealth', {});

      expect(result1.data.total).toBe(result2.data.total);
      expect(result1.data.healthy).toBe(result2.data.healthy);
    });
  });
});
