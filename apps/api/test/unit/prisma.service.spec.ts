import { describe, it, expect, vi } from 'vitest';
import { PrismaService } from '../../src/common/prisma.service';

function makeService() {
  const service = new PrismaService();
  service.baseDelayMs = 1;
  return service;
}

describe('PrismaService (DB connect retry)', () => {
  it('retries $connect on transient failures and succeeds', async () => {
    const service = makeService();
    let calls = 0;
    const connect = vi.fn(async () => {
      calls++;
      if (calls < 3) {
        throw new Error('Can\'t reach database server');
      }
    });
    vi.spyOn(service, '$connect').mockImplementation(connect);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.onModuleInit();

    expect(calls).toBe(3);
  });

  it('gives up after max retries and rethrows', async () => {
    const service = makeService();
    service.maxRetries = 3;
    const connect = vi.fn(async () => {
      throw new Error('Can\'t reach database server');
    });
    vi.spyOn(service, '$connect').mockImplementation(connect);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(service.onModuleInit()).rejects.toThrow('Can\'t reach database server');
    expect(connect).toHaveBeenCalledTimes(3);
  });
});