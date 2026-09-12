import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.locked) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedException('Account locked');
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { locked: false, failedLoginAttempts: 0 },
      });
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockThreshold = this.config.get('LOCK_THRESHOLD', 5);

      if (attempts >= lockThreshold) {
        const lockDuration = this.config.get('LOCK_DURATION_MINUTES', 30);
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            locked: true,
            lockedUntil: new Date(Date.now() + lockDuration * 60 * 1000),
          },
        });
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts },
        });
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, locked: false, lockedUntil: null },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { organization: true },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_SECRET'),
      });

      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: payload.sub,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      let matched: (typeof storedTokens)[number] | null = null;
      for (const token of storedTokens) {
        if (await bcrypt.compare(refreshToken, token.tokenHash)) {
          matched = token;
          break;
        }
      }

      if (!matched) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.prisma.refreshToken.update({
        where: { id: matched.id },
        data: { revoked: true },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user.id, user.email);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      {
        expiresIn: this.config.get('JWT_EXPIRY', '15m'),
        secret: this.config.get('JWT_SECRET'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email },
      {
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRY', '7d'),
        secret: this.config.get('JWT_SECRET'),
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresIn = this.config.get('REFRESH_TOKEN_EXPIRY_DAYS', 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
