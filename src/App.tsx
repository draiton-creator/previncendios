/**
 * Previncendios España - Componente Principal App
 * Plataforma Nacional de Prevención y Gestión de Emergencias
 */

import React, { useState, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';

import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { RoleSelectorModal } from './components/common/RoleSelectorModal';
import { AlertBanner } from './components/alerts/AlertBanner';
import { GeoAlertBanner } from './components/satellite/GeoAlertBanner';

const SuperAdminDashboard = React.lazy(() => import('./pages/dashboards/SuperAdminDashboard'));
const MunicipalDashboard = React.lazy(() => import('./pages/dashboards/MunicipalDashboard'));
const CitizenDashboard = React.lazy(() => import('./pages/dashboards/CitizenDashboard'));
const GuestDashboard = React.lazy(() => import('./pages/dashboards/GuestDashboard'));

const FullMapPage = React.lazy(() => import('./pages/map/FullMapPage'));
const IncidentsPage = React.lazy(() => import('./pages/incidents/IncidentsPage'));
const AlertsPage = React.lazy(() => import('./pages/alerts/AlertsPage'));
const ResourcesPage = React.lazy(() => import('./pages/resources/ResourcesPage'));
const VolunteersPage = React.lazy(() => import('./pages/volunteers/VolunteersPage'));
const CommunicationsPage = React.lazy(() => import('./pages/communications/CommunicationsPage'));
const DocumentsPage = React.lazy(() => import('./pages/documents/DocumentsPage'));
const AuditPage = React.lazy(() => import('./pages/audit/AuditPage'));
const PresentationHome = React.lazy(() => import('./pages/home/PresentationHome'));

import { IncidentDetailModal } from './components/incidents/IncidentDetailModal';
import { NewIncidentModal } from './components/incidents/NewIncidentModal';
import { CreateAlertModal } from './components/alerts/CreateAlertModal';
import { ResourceRequestModal } from './components/resources/ResourceRequestModal';
import { CreateBandoModal } from './components/communications/CreateBandoModal';
import { RegisterModal } from './components/auth/RegisterModal';

const MainAppContent: React.FC = () => {
  const { role } = useAuth();
  const { selectedIncident, setSelectedIncident } = useEmergency();

  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Modales
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState<boolean>(false);
  const [isCreateAlertModalOpen, setIsCreateAlertModalOpen] = useState<boolean>(false);
  const [isResourceRequestModalOpen, setIsResourceRequestModalOpen] = useState<boolean>(false);
  const [isCreateBandoModalOpen, setIsCreateBandoModalOpen] = useState<boolean>(false);

  // Renderizador de Dashboard por Rol
  const renderDashboardByRole = () => {
    switch (role) {
      case 'superadmin':
        return <SuperAdminDashboard onNavigateTab={setActiveTab} />;
      case 'ayuntamiento':
        return (
          <MunicipalDashboard
            onNavigateTab={setActiveTab}
            onOpenNewIncidentModal={() => setIsNewIncidentModalOpen(true)}
            onOpenCreateAlertModal={() => setIsCreateAlertModalOpen(true)}
            onOpenCreateBandoModal={() => setIsCreateBandoModalOpen(true)}
          />
        );
      case 'voluntario':
      case 'ciudadano':
        return (
          <CitizenDashboard
            onNavigateTab={setActiveTab}
            onOpenNewIncidentModal={() => setIsNewIncidentModalOpen(true)}
          />
        );
      case 'invitado':
      default:
        return (
          <GuestDashboard
            onNavigateTab={setActiveTab}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
          />
        );
    }
  };

  // Renderizador de pestañas
  const renderTabContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <PresentationHome
            onNavigateTab={setActiveTab}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
          />
        );
      case 'dashboard':
        return renderDashboardByRole();
      case 'mapa':
        return <FullMapPage onSelectIncident={(inc) => setSelectedIncident(inc)} />;
      case 'incidencias':
        return (
          <IncidentsPage
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenNewIncidentModal={() => setIsNewIncidentModalOpen(true)}
          />
        );
      case 'alertas':
        return <AlertsPage onOpenCreateAlertModal={() => setIsCreateAlertModalOpen(true)} />;
      case 'recursos':
        return (
          <ResourcesPage
            onOpenResourceRequestModal={() => setIsResourceRequestModalOpen(true)}
          />
        );
      case 'voluntarios':
        return <VolunteersPage />;
      case 'comunicaciones':
        return (
          <CommunicationsPage
            onOpenCreateBandoModal={() => setIsCreateBandoModalOpen(true)}
          />
        );
      case 'documentos':
        return <DocumentsPage />;
      case 'auditoria':
        return <AuditPage />;
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased dark:bg-gray-950 dark:text-gray-100 transition-colors">
      {/* Banner de Alerta Crítica */}
      <AlertBanner onOpenAlertsTab={() => setActiveTab('alertas')} />

      {/* Alerta de fuego satelital cercano a la ubicación del usuario */}
      <GeoAlertBanner onOpenMap={() => setActiveTab('mapa')} />

      {/* Header Superior */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      />

      {/* Layout Principal con Sidebar */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Área Principal de Contenido */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
              Cargando panel...
            </div>
          }>
            <div className="mx-auto max-w-7xl">{renderTabContent()}</div>
          </Suspense>
        </main>
      </div>

      {/* Modales Flotantes */}
      <RoleSelectorModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />

      <NewIncidentModal
        isOpen={isNewIncidentModalOpen}
        onClose={() => setIsNewIncidentModalOpen(false)}
      />

      <CreateAlertModal
        isOpen={isCreateAlertModalOpen}
        onClose={() => setIsCreateAlertModalOpen(false)}
      />

      <ResourceRequestModal
        isOpen={isResourceRequestModalOpen}
        onClose={() => setIsResourceRequestModalOpen(false)}
      />

      <CreateBandoModal
        isOpen={isCreateBandoModalOpen}
        onClose={() => setIsCreateBandoModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EmergencyProvider>
          <MainAppContent />
        </EmergencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
