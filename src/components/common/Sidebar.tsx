/**
 * Sidebar de Navegación Operativa - Previncendios España
 */

import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Map,
  Flame,
  BellRing,
  Truck,
  Users,
  MessageSquareText,
  FileText,
  History,
  ShieldCheck,
  Building2,
  Info,
  X,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { role, user } = useAuth();
  const { incidents, alerts, resourceRequests } = useEmergency();

  const activeIncidentsCount = incidents.filter(
    (i) => i.status !== 'extinguido' && i.status !== 'falsa_alarma'
  ).length;

  const activeAlertsCount = alerts.filter((a) => a.isActive).length;

  const pendingRequestsCount = resourceRequests.filter((r) => r.status === 'pendiente').length;

  const navItems = [
    {
      id: 'inicio',
      label: 'Inicio / Presentación',
      icon: Sparkles,
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano', 'invitado'],
    },
    {
      id: 'dashboard',
      label: 'Panel de Control',
      icon: LayoutDashboard,
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano', 'invitado'],
    },
    {
      id: 'mapa',
      label: 'Mapa Operativo GPS',
      icon: Map,
      badge: 'EN VIVO',
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano', 'invitado'],
    },
    {
      id: 'incidencias',
      label: 'Incidencias y Fuego',
      icon: Flame,
      count: activeIncidentsCount,
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano', 'invitado'],
    },
    {
      id: 'alertas',
      label: 'Centro de Alertas',
      icon: BellRing,
      count: activeAlertsCount,
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano', 'invitado'],
    },
    {
      id: 'recursos',
      label: 'Gestión de Recursos',
      icon: Truck,
      count: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      roles: ['superadmin', 'ayuntamiento', 'voluntario'],
    },
    {
      id: 'voluntarios',
      label: 'Voluntariado y Patrullas',
      icon: Users,
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano'],
    },
    {
      id: 'comunicaciones',
      label: 'Bandos y Comunicados',
      icon: MessageSquareText,
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano', 'invitado'],
    },
    {
      id: 'documentos',
      label: 'Planes y Documentación',
      icon: FileText,
      roles: ['superadmin', 'ayuntamiento', 'voluntario', 'ciudadano', 'invitado'],
    },
    {
      id: 'auditoria',
      label: 'Auditoría e Histórico',
      icon: History,
      roles: ['superadmin', 'ayuntamiento'],
    },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Fondo Transparente Móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar contenedor */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera Móvil */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 md:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Menú Principal
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tarjeta Municipio / Ámbito */}
        <div className="m-3 rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/60">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Building2 className="h-4 w-4 text-red-500" />
            <span className="truncate">
              {role === 'superadmin' ? 'Ámbito Nacional (España)' : user?.municipalityName}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {role === 'superadmin' ? 'Gestión Centralizada 17 CC.AA.' : `Provincia de ${user?.province}`}
          </p>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.badge && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-white text-red-700'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Pie de Sidebar - Estado Operativo */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <div className="flex items-center space-x-2">
              <Radio className="h-4 w-4 animate-pulse text-emerald-600" />
              <span>Red 112 / CECOPI Sync</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
