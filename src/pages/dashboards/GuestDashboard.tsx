/**
 * Dashboard Invitado (Acceso Público Limitado) - Previncendios España
 */

import React from 'react';
import { Eye, Shield, MapPin, Info, Flame, Lock, Radio } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { EmergencyMap } from '../../components/map/EmergencyMap';

interface GuestDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenRoleModal: () => void;
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({
  onNavigateTab,
  onOpenRoleModal,
}) => {
  const { incidents, alerts, messages, setSelectedIncident } = useEmergency();

  const publicIncidents = incidents.filter((i) => i.status !== 'extinguido');
  const publicAlerts = alerts.filter((a) => a.isActive);

  return (
    <div className="space-y-6">
      {/* Banner Público */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-800 via-slate-800 to-gray-900 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-gray-500/30 px-2.5 py-1 text-xs font-extrabold tracking-wider text-gray-200 border border-gray-400/30">
                PORTAL PÚBLICO INFORMATIVO
              </span>
              <span className="text-xs text-gray-300">Sin Registro Requerido</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Información Pública de Emergencias en España
            </h1>
            <p className="mt-1 text-xs text-gray-300 max-w-xl">
              Consulte en tiempo real el mapa público de incendios forestales, alertas poblacionales oficiales y recomendaciones AEMET.
            </p>
          </div>

          <button
            onClick={onOpenRoleModal}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 shrink-0"
          >
            Acceder como Voluntario / Ayuntamiento
          </button>
        </div>
      </div>

      {/* Espacio Publicitario / Sponsor Placeholder (Reservado para rol Invitado según requisitos) */}
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-4 text-center dark:border-gray-800 dark:bg-gray-900/60">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          ESPACIO PATROCINADO INSTITUCIONAL / CAMPAÑA DE PREVENCIÓN
        </span>
        <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          "En el monte, cero descuidos. Si ves humo, llama inmediatamente al 112." — Ministerio para la Transición Ecológica
        </p>
      </div>

      {/* Mapa Público */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-600" />
            Mapa Público de Incendios en España
          </h3>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Posiciones de patrullas restringidas
          </span>
        </div>

        <EmergencyMap
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
            onNavigateTab('incidencias');
          }}
          className="h-[420px] w-full rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800"
        />
      </div>

      {/* Bandos Públicos */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-600" />
          Bandos y Avisos Oficiales para la Población
        </h3>
        <div className="space-y-3">
          {messages.slice(0, 3).map((msg) => (
            <div key={msg.id} className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">{msg.title}</h4>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{msg.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
