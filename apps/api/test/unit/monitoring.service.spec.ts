import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonitoringService } from '../../src/monitoring/monitoring.service';

describe('MonitoringService (T-042 regression)', () => {
  let service: MonitoringService;
  let loggerError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new MonitoringService({
      resource: {
        findMany: vi.fn(),
      },
      alert: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    } as any);
    loggerError = vi.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);
  });

  it('should not throw when checkStaleResources hits a DB error', async () => {
    (service as any).prisma.resource.findMany.mockRejectedValue(
      new Error('Can\'t reach database server at \'db:5432\''),
    );

    await expect(service.checkStaleResources()).resolves.toBeUndefined();
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('Stale resource check failed'),
    );
  });

  it('should not throw when evaluateAlertConditions hits a DB error', async () => {
    (service as any).prisma.resource.findMany.mockRejectedValue(
      new Error('Can\'t reach database server at \'db:5432\''),
    );

    await expect(service.evaluateAlertConditions()).resolves.toBeUndefined();
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('Alert evaluation failed'),
    );
  });

  it('should run checkStaleResources successfully when DB is reachable', async () => {
    (service as any).prisma.resource.findMany.mockResolvedValue([]);

    await expect(service.checkStaleResources()).resolves.toBeUndefined();
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('should create an alert when a degraded resource has no active alert', async () => {
    const degraded = {
      id: 'c9a35f8e-1111-4222-8333-444455556666',
      organizationId: '5b4f1acf-2222-4333-8444-555566667777',
      name: 'svc-a',
      status: 'degraded',
    };
    (service as any).prisma.resource.findMany.mockResolvedValue([degraded]);
    (service as any).prisma.alert.findFirst.mockResolvedValue(null);
    (service as any).prisma.alert.create.mockResolvedValue({ id: 'alert-1' });

    await service.evaluateAlertConditions();

    expect((service as any).prisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: degraded.organizationId,
          condition: 'resource_status',
          status: 'active',
        }),
      }),
    );
  });
});