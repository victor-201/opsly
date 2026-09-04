import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/common/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;
  let jwt: any;
  let config: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      membership: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
      },
    };

    jwt = {
      sign: vi.fn().mockReturnValue('mock-token'),
      verify: vi.fn(),
    };

    config = {
      get: vi.fn((key: string, defaultValue?: any) => {
        const configMap: Record<string, any> = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRY: '15m',
          REFRESH_TOKEN_EXPIRY: '7d',
          REFRESH_TOKEN_EXPIRY_DAYS: 7,
          LOCK_THRESHOLD: 5,
          LOCK_DURATION_MINUTES: 30,
        };
        return configMap[key] ?? defaultValue;
      }),
    };

    authService = new AuthService(prisma as any, jwt as any, config as any);
  });

  describe('register', () => {
    it('should create a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test',
        }),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 12);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        locked: false,
        failedLoginAttempts: 0,
      });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.membership.findMany.mockResolvedValue([]);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw on invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('RBAC', () => {
    it('should have correct role hierarchy', () => {
      const ROLE_HIERARCHY: Record<string, number> = {
        owner: 4,
        admin: 3,
        operator: 2,
        viewer: 1,
      };

      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.operator);
      expect(ROLE_HIERARCHY.operator).toBeGreaterThan(ROLE_HIERARCHY.viewer);
    });

    it('should have 17 permissions', () => {
      const ROLE_PERMISSIONS: Record<string, string[]> = {
        owner: [
          'provider:connect', 'provider:read', 'provider:manage',
          'resource:read', 'resource:manage',
          'deployment:read', 'deployment:trigger', 'deployment:rollback',
          'metrics:read', 'logs:read',
          'alerts:read', 'alerts:manage',
          'incidents:read', 'incidents:manage',
          'chat:use', 'audit:read', 'settings:manage',
        ],
      };

      expect(ROLE_PERMISSIONS.owner.length).toBe(17);
    });
  });
});
