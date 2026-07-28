/**
 * Dashboard Superadministrador Nacional - Previncendios España
 */

import React from 'react';
import { Flame, ShieldCheck, Building2, Satellite, Users, BellRing, Activity, CheckCircle2, Globe } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { StatCard } from '../../components/common/StatCard';
import { EmergencyMap } from '../../components/map/EmergencyMap';

interface SuperAdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigateTab }) => {
  const {
    incidents,
    alerts,
    resources,
    municipalities,
    satelliteHotspots,
    activityLogs,
    setSelectedIncident,
  } = useEmergency();

  const activeIncidents = incidents.filter((i) => i.status !== 'extinguido' && i.status !== 'falsa_alarma');
  const level23Incidents = activeIncidents.filter((i) => i.severity === 'Nivel 2' || i.severity === 'Nivel 3');

  return (
    <div className="space-y-6">
      {/* Banner de Mando Central Nacional */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-purple-500/30 px-2.5 py-1 text-xs font-extrabold tracking-wider text-purple-200 border border-purple-400/30">
                DIRECCIÓN GENERAL NACIONAL
              </span>
              <span className="text-xs text-purple-300">España • 17 CC.AA.</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Centro Nacional de Mando y Coordinación
            </h1>
            <p className="mt-1 text-xs text-purple-200 max-w-xl">
              Monitorización satelital en tiempo real, gestión de incendios forestales de Nivel 2 y 3, y coordinación UME.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('incidencias')}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700"
            >
              Ver {activeIncidents.length} Incidencias Activas
            </button>
            <button
              onClick={() => onNavigateTab('auditoria')}
              className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20"
            >
              Auditoría del Sistema
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI Globales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fuegos Activos Nivel 2/3"
          value={level23Incidents.length}
          subtitle="Requieren medios autonómicos / UME"
          icon={Flame}
          colorTheme="red"
          onClick={() => onNavigateTab('incidencias')}
        />
        <StatCard
          title="Puntos Calientes NASA FIRMS"
          value={satelliteHotspots.length}
          subtitle="Detecciones satelitales en 24h"
          icon={Satellite}
          colorTheme="amber"
          onClick={() => onNavigateTab('mapa')}
        />
        <StatCard
          title="Ayuntamientos Conectados"
          value={municipalities.length}
          subtitle="Red de CECOPALs activos"
          icon={Building2}
          colorTheme="blue"
          onClick={() => onNavigateTab('recursos')}
        />
        <StatCard
          title="Alertas Activas en Población"
          value={alerts.filter((a) => a.isActive).length}
          subtitle="Evacuaciones y confinamientos"
          icon={BellRing}
          colorTheme="purple"
          onClick={() => onNavigateTab('alertas')}
        />
      </div>

      {/* Mapa Principal de Mando */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Mapa Operativo Nacional de Emergencias
          </h3>
          <button
            onClick={() => onNavigateTab('mapa')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Expandir Mapa
          </button>
        </div>
        <EmergencyMap
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
            onNavigateTab('incidencias');
          }}
          className="h-[450px] w-full rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800"
        />
      </div>

      {/* Tabla Resumen de Actividad Reciente */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
          Registro Reciente de Auditoría y Acciones Institucionales
        </h3>
        <div className="space-y-2">
          {activityLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="flex items-center space-x-2">
                <span className="font-bold text-purple-600 dark:text-purple-400">{log.userName}</span>
                <span className="text-gray-500">— {log.details}</span>
              </div>
              <span className="text-[11px] text-gray-400">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
