import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ProvidersModule } from './providers/providers.module';
import { ProviderConnectionsModule } from './provider-connections/provider-connections.module';
import { ResourcesModule } from './resources/resources.module';
import { ApplicationsModule } from './applications/applications.module';
import { RelationsModule } from './relations/relations.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { DomainsModule } from './domains/domains.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { LogsModule } from './logs/logs.module';
import { AlertsModule } from './alerts/alerts.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SyncModule } from './sync/sync.module';
import { ChatModule } from './chat/chat.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CommonModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    MembershipsModule,
    ProvidersModule,
    ProviderConnectionsModule,
    ResourcesModule,
    ApplicationsModule,
    RelationsModule,
    DeploymentsModule,
    DomainsModule,
    MonitoringModule,
    HealthModule,
    MetricsModule,
    LogsModule,
    AlertsModule,
    IncidentsModule,
    SyncModule,
    ChatModule,
    AuditModule,
    NotificationsModule,
    SettingsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware, RateLimitMiddleware)
      .forRoutes('*');
  }
}
