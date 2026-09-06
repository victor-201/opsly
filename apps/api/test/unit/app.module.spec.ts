import { describe, it, expect, vi, beforeEach } from 'vitest';

function mockRes() {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: (k: string, v: string) => { headers[k] = v; },
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('RateLimitMiddleware (T-043 audit fix)', () => {
  let RateLimitMiddleware: any;

  beforeEach(async () => {
    vi.resetModules();
    RateLimitMiddleware = (await import('../../src/common/middleware/rate-limit.middleware')).RateLimitMiddleware;
  });

  it('allows requests under the limit and sets rate-limit headers', () => {
    const m = new RateLimitMiddleware();
    const next = vi.fn();
    const res: any = mockRes();
    m.use({ ip: '10.0.0.1', path: '/api/v1/health' }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.headers['X-RateLimit-Limit']).toBe(100);
    expect(Number(res.headers['X-RateLimit-Remaining'])).toBe(99);
  });

  it('returns 429 after the per-minute limit is exceeded', () => {
    const m = new RateLimitMiddleware();
    const next = vi.fn();
    const req = { ip: '10.0.0.2', path: '/api/v1/health' };
    for (let i = 0; i < 101; i++) {
      const res: any = mockRes();
      m.use(req as any, res, next);
    }
    expect(next).toHaveBeenCalledTimes(100);
    const blocked: any = mockRes();
    m.use(req as any, blocked, next);
    expect(blocked.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(100);
  });
});

describe('SecurityHeadersMiddleware (T-043 audit fix)', () => {
  it('sets the OWASP-aligned security headers', async () => {
    vi.resetModules();
    const { SecurityHeadersMiddleware } = await import('../../src/common/middleware/security-headers.middleware');
    const m = new SecurityHeadersMiddleware();
    const next = vi.fn();
    const res: any = mockRes();
    m.use({} as any, res, next);
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(res.headers['X-Frame-Options']).toBe('DENY');
    expect(res.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(next).toHaveBeenCalled();
  });
});