import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, ip, headers } = request;
    const userId = request.user?.sub;
    const orgId = request.orgId;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logAudit({
            userId,
            organizationId: orgId,
            action: `${method} ${path}`,
            resource: path,
            result: 'success',
            ip,
            userAgent: headers['user-agent'],
          });
        },
        error: (error) => {
          this.logAudit({
            userId,
            organizationId: orgId,
            action: `${method} ${path}`,
            resource: path,
            result: 'error',
            errorMessage: error.message,
            ip,
            userAgent: headers['user-agent'],
          });
        },
      }),
    );
  }

  private async logAudit(data: {
    userId?: string;
    organizationId?: string;
    action: string;
    resource: string;
    result: string;
    errorMessage?: string;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: data.userId,
          organizationId: data.organizationId || 'system',
          action: data.action,
          resourceType: data.resource,
          result: data.result,
          ipAddress: data.ip,
          userAgent: data.userAgent,
          details: {
            errorMessage: data.errorMessage,
          },
        },
      });
    } catch {
      // Silently fail audit logging
    }
  }
}
