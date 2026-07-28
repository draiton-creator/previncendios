/**
 * Dashboard Municipal / Mando Local - Previncendios España
 */

import React, { useState, useEffect } from 'react';
import { Building2, Flame, BellRing, Truck, Send, Shield, Thermometer, Wind, Compass } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { EmergencyMap } from '../../components/map/EmergencyMap';
import { fetchAemetWeatherData, WeatherData } from '../../services/aemetService';
import { Badge } from '../../components/common/Badge';

interface MunicipalDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewIncidentModal: () => void;
  onOpenCreateAlertModal: () => void;
  onOpenCreateBandoModal: () => void;
}

export const MunicipalDashboard: React.FC<MunicipalDashboardProps> = ({
  onNavigateTab,
  onOpenNewIncidentModal,
  onOpenCreateAlertModal,
  onOpenCreateBandoModal,
}) => {
  const { user } = useAuth();
  const { incidents, alerts, resources, resourceRequests, setSelectedIncident } = useEmergency();

  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetchAemetWeatherData(user?.municipalityId || 'muni_el_tiemblo').then(setWeather);
  }, [user?.municipalityId]);

  const localIncidents = incidents.filter(
    (i) => i.municipalityId === user?.municipalityId && i.status !== 'extinguido'
  );

  const localAlerts = alerts.filter((a) => a.municipalityId === user?.municipalityId && a.isActive);

  const localResources = resources.filter((r) => r.municipalityId === user?.municipalityId);

  return (
    <div className="space-y-6">
      {/* Banner Municipal CECOPAL */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-blue-500/30 px-2.5 py-1 text-xs font-extrabold tracking-wider text-blue-200 border border-blue-400/30">
                CECOPAL MUNICIPAL
              </span>
              <span className="text-xs text-blue-300">{user?.municipalityName} ({user?.province})</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Mando de Coordinación Municipal
            </h1>
            <p className="mt-1 text-xs text-blue-200 max-w-xl">
              Protección Civil Local, gestión de retenes, aviso de bandos a vecinos y cesión de autobombas intermunicipal.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenCreateAlertModal}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700"
            >
              Emitir Alerta Evacuación
            </button>
            <button
              onClick={onOpenCreateBandoModal}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
            >
              Publicar Bando
            </button>
          </div>
        </div>
      </div>

      {/* Widget AEMET de Riesgo Meteorológico */}
      {weather && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                AEMET • RIESGO METEOROLÓGICO DE INCENDIOS
              </span>
              <div className="mt-1 flex items-center space-x-3">
                <Badge variant="danger">RIESGO {weather.fireRiskLevel.toUpperCase()}</Badge>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {user?.municipalityName}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center space-x-1.5">
                <Thermometer className="h-4 w-4 text-red-500" />
                <span>{weather.temperatureC} ºC</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Wind className="h-4 w-4 text-blue-500" />
                <span>{weather.windSpeedKmH} km/h ({weather.windDirection})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Compass className="h-4 w-4 text-amber-500" />
                <span>Humedad: {weather.humidityPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas KPI Locales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Incidencias en Municipio"
          value={localIncidents.length}
          subtitle="Fuegos y eventos locales"
          icon={Flame}
          colorTheme="red"
          onClick={() => onNavigateTab('incidencias')}
        />
        <StatCard
          title="Alertas Activas Locales"
          value={localAlerts.length}
          subtitle="Avisos a la población"
          icon={BellRing}
          colorTheme="amber"
          onClick={() => onNavigateTab('alertas')}
        />
        <StatCard
          title="Recursos Locales"
          value={localResources.length}
          subtitle="Autobombas, retenes y puntos agua"
          icon={Truck}
          colorTheme="blue"
          onClick={() => onNavigateTab('recursos')}
        />
        <StatCard
          title="Solicitudes Intermunicipales"
          value={resourceRequests.filter((r) => r.requestingMunicipalityId === user?.municipalityId).length}
          subtitle="Cesión de apoyo entre ayuntamientos"
          icon={Building2}
          colorTheme="purple"
          onClick={() => onNavigateTab('recursos')}
        />
      </div>

      {/* Mapa Local */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Mapa Operativo de {user?.municipalityName}
        </h3>
        <EmergencyMap
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
            onNavigateTab('incidencias');
          }}
          centerLat={40.3801}
          centerLng={-4.4395}
          zoom={11}
          className="h-[400px] w-full rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800"
        />
      </div>
    </div>
  );
};
