/**
 * Selector de Capas del Mapa Operativo - Previncendios España
 */

import React from 'react';
import { Layers, Flame, Satellite, Truck, Radio, Eye, Map, Globe, Mountain } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';

export const LayerControl: React.FC = () => {
  const { mapLayers, updateMapLayers } = useEmergency();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center space-x-1.5 pr-2 border-r border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300">
        <Layers className="h-4 w-4 text-red-600" />
        <span>CAPAS MAPA:</span>
      </div>

      {/* Incidencias */}
      <button
        onClick={() => updateMapLayers({ showIncidents: !mapLayers.showIncidents })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showIncidents
            ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Flame className="h-3.5 w-3.5" />
        <span>Incidencias</span>
      </button>

      {/* Satélite FIRMS NASA */}
      <button
        onClick={() => updateMapLayers({ showSatelliteFirms: !mapLayers.showSatelliteFirms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showSatelliteFirms
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Satellite className="h-3.5 w-3.5" />
        <span>Puntos Satélite NASA</span>
      </button>

      {/* Recursos */}
      <button
        onClick={() => updateMapLayers({ showResources: !mapLayers.showResources })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showResources
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Truck className="h-3.5 w-3.5" />
        <span>Recursos</span>
      </button>

      {/* Patrullas GPS */}
      <button
        onClick={() => updateMapLayers({ showPatrols: !mapLayers.showPatrols })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showPatrols
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Radio className="h-3.5 w-3.5" />
        <span>Patrullas GPS</span>
      </button>

      {/* Separador Capas Base */}
      <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

      {/* Selector Capa Base (Callejero / Satélite / Relieve) */}
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => updateMapLayers({ tileLayer: 'streets' })}
          className={`flex items-center space-x-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
            mapLayers.tileLayer === 'streets'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Map className="h-3 w-3" />
          <span>Callejero</span>
        </button>

        <button
          onClick={() => updateMapLayers({ tileLayer: 'satellite' })}
          className={`flex items-center space-x-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
            mapLayers.tileLayer === 'satellite'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Globe className="h-3 w-3" />
          <span>Satélite</span>
        </button>

        <button
          onClick={() => updateMapLayers({ tileLayer: 'terrain' })}
          className={`flex items-center space-x-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
            mapLayers.tileLayer === 'terrain'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Mountain className="h-3 w-3" />
          <span>Relieve</span>
        </button>
      </div>
    </div>
  );
};
