import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { RequireAuth, ActiveOrgGate } from '../guards/RequireAuth';
import { RequirePermission } from '../guards/RequirePermission';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { OrgSetupPage } from '../pages/auth/OrgSetupPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ApplicationsPage } from '../pages/applications/ApplicationsPage';
import { ApplicationDetailPage } from '../pages/applications/ApplicationDetailPage';
import { ResourcesPage } from '../pages/resources/ResourcesPage';
import { ResourceDetailPage } from '../pages/resources/ResourceDetailPage';
import { ProvidersPage } from '../pages/providers/ProvidersPage';
import { AlertsPage } from '../pages/alerts/AlertsPage';
import { IncidentsPage } from '../pages/incidents/IncidentsPage';
import { IncidentDetailPage } from '../pages/incidents/IncidentDetailPage';
import { ChatPage } from '../pages/chat/ChatPage';
import { AuditPage } from '../pages/audit/AuditPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { ForbiddenPage, NotFoundPage } from '../pages/StatusPage';

import { PERMISSIONS } from '../lib/permissions';

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/org/setup" element={<OrgSetupPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          <Route path="/" element={<RequireAuth><ActiveOrgGate><DashboardLayout /></ActiveOrgGate></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />

            <Route path="resources" element={<ResourcesPage />} />
            <Route path="resources/:id" element={<ResourceDetailPage />} />

            <Route
              path="providers"
              element={
                <RequirePermission permission={PERMISSIONS.providerRead}>
                  <ProvidersPage />
                </RequirePermission>
              }
            />

            <Route
              path="alerts"
              element={
                <RequirePermission permission={PERMISSIONS.alertsRead}>
                  <AlertsPage />
                </RequirePermission>
              }
            />

            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentDetailPage />} />

            <Route
              path="chat"
              element={
                <RequirePermission permission={PERMISSIONS.chatUse}>
                  <ChatPage />
                </RequirePermission>
              }
            />

            <Route
              path="audit"
              element={
                <RequirePermission permission={PERMISSIONS.auditRead}>
                  <AuditPage />
                </RequirePermission>
              }
            />

            <Route
              path="settings"
              element={
                <RequirePermission permission={PERMISSIONS.settingsManage}>
                  <SettingsPage />
                </RequirePermission>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}