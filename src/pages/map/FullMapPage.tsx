/**
 * Página Completa del Mapa Operativo GPS - Previncendios España
 */

import React from 'react';
import { Map, Layers, RefreshCw } from 'lucide-react';
import { EmergencyMap } from '../../components/map/EmergencyMap';
import { MapFilter } from '../../components/map/MapFilter';
import { LayerControl } from '../../components/map/LayerControl';
import { useEmergency } from '../../context/EmergencyContext';
import { EmergencyEvent } from '../../types';

interface FullMapPageProps {
  onSelectIncident: (incident: EmergencyEvent) => void;
}

export const FullMapPage: React.FC<FullMapPageProps> = ({ onSelectIncident }) => {
  const { refreshSatelliteData } = useEmergency();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Map className="h-6 w-6 text-red-600" />
            Mapa Operativo GPS en Tiempo Real
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Geolocalización de fuegos, brigadas, satélites NASA FIRMS y puntos de agua
          </p>
        </div>

        <button
          onClick={refreshSatelliteData}
          className="flex items-center justify-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <RefreshCw className="h-4 w-4 text-red-500" />
          <span>Actualizar Datos Satelitales</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <MapFilter />

      {/* Selector de Capas */}
      <LayerControl />

      {/* Contenedor del Mapa */}
      <EmergencyMap
        onSelectIncident={onSelectIncident}
        className="h-[600px] w-full rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800"
      />
    </div>
  );
};
