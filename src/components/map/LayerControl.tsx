/**
 * Selector de Capas del Mapa Operativo - Previncendios España
 */

import React from 'react';
import { Layers, Flame, Satellite, Truck, Radio, Map, Globe, Mountain, RefreshCw, ShieldAlert, CloudRain, MapPinned, Video } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';

export const LayerControl: React.FC = () => {
  const { mapLayers, updateMapLayers, runSatelliteScan, isSatelliteScanning, lastSatelliteScan } = useEmergency();

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

      {/* Cámaras Públicas */}
      <button
        onClick={() => updateMapLayers({ showCameras: !mapLayers.showCameras })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showCameras
            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Video className="h-3.5 w-3.5" />
        <span>Cámaras</span>
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

      {/* Capa WMS FIRMS (raster NASA) */}
      <button
        onClick={() => updateMapLayers({ showFirmsWms: !mapLayers.showFirmsWms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showFirmsWms
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>FIRMS NASA</span>
      </button>

      {/* Capa WMS EFFIS */}
      <button
        onClick={() => updateMapLayers({ showEffisWms: !mapLayers.showEffisWms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showEffisWms
            ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>EFFIS Activos</span>
      </button>

      {/* Capa WMS SEVIRI */}
      <button
        onClick={() => updateMapLayers({ showSeviriWms: !mapLayers.showSeviriWms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showSeviriWms
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Satellite className="h-3.5 w-3.5" />
        <span>SEVIRI</span>
      </button>

      {/* Capa WMS Riesgo FWI EFFIS */}
      <button
        onClick={() => updateMapLayers({ showEffisFwiWms: !mapLayers.showEffisFwiWms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showEffisFwiWms
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Map className="h-3.5 w-3.5" />
        <span>Riesgo FWI</span>
      </button>

      {/* Capa WMS IGN Catastro */}
      <button
        onClick={() => updateMapLayers({ showIgnCatastroWms: !mapLayers.showIgnCatastroWms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showIgnCatastroWms
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <MapPinned className="h-3.5 w-3.5" />
        <span>IGN Catastro</span>
      </button>

      {/* Capa WMS Precipitación AEMET */}
      <button
        onClick={() => updateMapLayers({ showAemetPrecipitationWms: !mapLayers.showAemetPrecipitationWms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showAemetPrecipitationWms
            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <CloudRain className="h-3.5 w-3.5" />
        <span>Precipitación</span>
      </button>

      {/* Capa WMS EUMETView */}
      <button
        onClick={() => updateMapLayers({ showEumetviewWms: !mapLayers.showEumetviewWms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showEumetviewWms
            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>EUMETView</span>
      </button>

      {/* Capa WMS Sentinel-3 FRP */}
      <button
        onClick={() => updateMapLayers({ showSentinel3Wms: !mapLayers.showSentinel3Wms })}
        className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
          mapLayers.showSentinel3Wms
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 opacity-60'
        }`}
      >
        <Satellite className="h-3.5 w-3.5" />
        <span>Sentinel-3</span>
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

      <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

      <button
        onClick={runSatelliteScan}
        disabled={isSatelliteScanning}
        title="Escanear satélite FIRMS con IA"
        className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
          isSatelliteScanning
            ? 'bg-amber-100 text-amber-800 animate-pulse'
            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
        }`}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isSatelliteScanning ? 'animate-spin' : ''}`} />
        <span>{isSatelliteScanning ? 'Escaneando...' : 'Escanear satélite'}</span>
      </button>

      {lastSatelliteScan && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:inline">
          Último: {new Date(lastSatelliteScan).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
