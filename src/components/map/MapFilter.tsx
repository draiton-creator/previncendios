/**
 * Filtros de Búsqueda y Municipio - Previncendios España
 */

import React from 'react';
import { Search, Filter, RotateCcw, MapPin, Satellite, Flame, Clock, Gauge } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { FilterState } from '../../types';

export const MapFilter: React.FC = () => {
  const { filters, updateFilters, resetFilters, municipalities } = useEmergency();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
      {/* Campo Búsqueda */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          placeholder="Buscar por lugar, paraje o descripción..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Dropdowns Filtro */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:items-center">
        {/* Municipio */}
        <select
          value={filters.municipalityId}
          onChange={(e) => updateFilters({ municipalityId: e.target.value })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todas">Todos los Municipios</option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.province})
            </option>
          ))}
        </select>

        {/* Tipo de Incidencia */}
        <select
          value={filters.incidentType}
          onChange={(e) => updateFilters({ incidentType: e.target.value })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todos">Todos los Tipos</option>
          <option value="incendio_forestal">Incendio Forestal</option>
          <option value="incendio_urbano">Incendio Urbano</option>
          <option value="inundacion">Inundación</option>
          <option value="tormenta">Tormenta / Rayos</option>
          <option value="ola_calor">Ola de Calor</option>
          <option value="accidente">Accidente</option>
        </select>

        {/* Severidad */}
        <select
          value={filters.severity}
          onChange={(e) => updateFilters({ severity: e.target.value })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todas">Cualquier Nivel</option>
          <option value="Nivel 0">Nivel 0 (Bajo)</option>
          <option value="Nivel 1">Nivel 1 (Local)</option>
          <option value="Nivel 2">Nivel 2 (Regional)</option>
          <option value="Nivel 3">Nivel 3 (Nacional UME)</option>
        </select>

        {/* Estado */}
        <select
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todos">Cualquier Estado</option>
          <option value="detectado">Detectado</option>
          <option value="confirmado">Confirmado</option>
          <option value="en_control">En Control</option>
          <option value="estabilizado">Estabilizado</option>
          <option value="extinguido">Extinguido</option>
        </select>

        {/* Satélite */}
        <select
          value={filters.satelliteSource}
          onChange={(e) => updateFilters({ satelliteSource: e.target.value as FilterState['satelliteSource'] })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todos">Todos los satélites</option>
          <option value="GOES">GOES-19</option>
          <option value="SEVIRI">SEVIRI (EUMETSAT)</option>
          <option value="Sentinel-3">Sentinel-3</option>
          <option value="NOAA-21">NOAA-21 VIIRS</option>
          <option value="NOAA-20">NOAA-20 VIIRS</option>
          <option value="VIIRS">VIIRS-NPP</option>
          <option value="MODIS">MODIS Terra/Aqua</option>
        </select>

        {/* Riesgo */}
        <select
          value={filters.riskLevel}
          onChange={(e) => updateFilters({ riskLevel: e.target.value as FilterState['riskLevel'] })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todos">Cualquier riesgo</option>
          <option value="Bajo">Bajo</option>
          <option value="Moderado">Moderado</option>
          <option value="Alto">Alto</option>
          <option value="Muy Alto">Muy Alto</option>
          <option value="Extremo">Extremo</option>
        </select>

        {/* Confianza mínima */}
        <select
          value={filters.minConfidence}
          onChange={(e) => updateFilters({ minConfidence: e.target.value as FilterState['minConfidence'] })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todos">Cualquier confianza</option>
          <option value="low">Baja</option>
          <option value="nominal">Nominal</option>
          <option value="high">Alta</option>
        </select>

        {/* Ventana temporal */}
        <select
          value={filters.timeWindow}
          onChange={(e) => updateFilters({ timeWindow: e.target.value as FilterState['timeWindow'] })}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="todos">Cualquier momento</option>
          <option value="1h">Última hora</option>
          <option value="6h">Últimas 6 h</option>
          <option value="24h">Últimas 24 h</option>
          <option value="7d">Últimos 7 días</option>
        </select>

        {/* FRP mínimo */}
        <input
          type="number"
          min={0}
          step={1}
          value={filters.minFrp}
          onChange={(e) => updateFilters({ minFrp: Number(e.target.value) || 0 })}
          placeholder="FRP min"
          className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />

        {/* Solo confirmados */}
        <button
          onClick={() => updateFilters({ showOnlyConfirmed: !filters.showOnlyConfirmed })}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
            filters.showOnlyConfirmed
              ? 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/80 dark:text-red-300'
              : 'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
          }`}
          title="Solo focos confirmados por SEVIRI o riesgo Alto/Muy Alto/Extremo"
        >
          <Flame className="inline h-3.5 w-3.5 mr-1" />
          Confirmados
        </button>

        {/* Limpiar Filtros */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center space-x-1 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Restablecer Filtros"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Restablecer</span>
        </button>
      </div>
    </div>
  );
};
