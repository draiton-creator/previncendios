/**
 * Lista de Incidencias y Fuego - Previncendios España
 */

import React, { useState } from 'react';
import { Flame, MapPin, Clock, AlertTriangle, Shield, CheckCircle2, Plus, Eye, Share2 } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { EmergencyEvent } from '../../types';
import { Badge } from '../common/Badge';

interface IncidentListProps {
  onSelectIncident: (incident: EmergencyEvent) => void;
  onOpenNewIncidentModal: () => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  onSelectIncident,
  onOpenNewIncidentModal,
}) => {
  const { incidents, filters, toggleMobilization, isUserMobilizedTo } = useEmergency();
  const { role } = useAuth();

  const filtered = incidents.filter((inc) => {
    if (filters.municipalityId !== 'todas' && inc.municipalityId !== filters.municipalityId) return false;
    if (filters.incidentType !== 'todos' && inc.type !== filters.incidentType) return false;
    if (filters.severity !== 'todas' && inc.severity !== filters.severity) return false;
    if (filters.status !== 'todos' && inc.status !== filters.status) return false;
    if (
      filters.searchTerm &&
      !inc.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
      !inc.locationDescription.toLowerCase().includes(filters.searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev) {
      case 'Nivel 3':
      case 'Nivel 2':
        return 'danger';
      case 'Nivel 1':
        return 'warning';
      case 'Nivel 0':
      default:
        return 'info';
    }
  };

  const getStatusBadgeVariant = (st: string) => {
    switch (st) {
      case 'detectado':
        return 'warning';
      case 'confirmado':
        return 'danger';
      case 'en_control':
        return 'info';
      case 'estabilizado':
        return 'purple';
      case 'extinguido':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera y Botón Nuevo Reporte */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-600" />
            Incidencias y Emergencias Registradas
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Mostrando {filtered.length} eventos activos en la zona seleccionada
          </p>
        </div>

        {role !== 'invitado' && (
          <button
            onClick={onOpenNewIncidentModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>Notificar Fuego / Incidencia</span>
          </button>
        )}
      </div>

      {/* Grid de Tarjetas de Incidencias */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-800">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-white">
            Sin Incidencias Activas
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            No hay avisos o fuegos registrados en esta localidad con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-red-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-red-900/50"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={getSeverityBadgeVariant(inc.severity)}>
                    {inc.severity}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(inc.status)}>
                    {inc.status.toUpperCase()}
                  </Badge>
                </div>

                <h3 className="mt-3 text-base font-extrabold text-gray-900 dark:text-white line-clamp-2">
                  {inc.title}
                </h3>

                <div className="mt-2 flex items-center space-x-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{inc.municipalityName} ({inc.province})</span>
                </div>

                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                  {inc.description}
                </p>

                {inc.assignedBrigade && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-2 text-[11px] font-medium text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                    <span className="font-bold text-gray-900 dark:text-white">Brigada: </span>
                    {inc.assignedBrigade}
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectIncident(inc)}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver ficha</span>
                </button>

                <button
                  onClick={() => toggleMobilization(inc.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-extrabold text-white transition-all shadow-sm flex items-center space-x-1 ${
                    isUserMobilizedTo(inc.id)
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <span>{isUserMobilizedTo(inc.id) ? '✓ En camino' : 'Voy en camino'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
