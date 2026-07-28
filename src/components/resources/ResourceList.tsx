/**
 * Inventario y Cesión de Recursos Operativos - Previncendios España
 */

import React, { useState } from 'react';
import { Truck, Droplet, Tent, Radio, Plus, Send, CheckCircle2, AlertCircle, Building2, MapPin } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface ResourceListProps {
  onOpenResourceRequestModal: () => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({ onOpenResourceRequestModal }) => {
  const {
    resources,
    resourceRequests,
    updateResourceStatus,
    updateResourceRequestStatus,
    filters,
  } = useEmergency();
  const { role, user } = useAuth();

  const filteredResources = resources.filter((res) => {
    if (filters.municipalityId !== 'todas' && res.municipalityId !== filters.municipalityId) return false;
    return true;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'autobomba':
      case 'vehiculo_moteado':
        return Truck;
      case 'punto_agua':
        return Droplet;
      case 'refugio_albergue':
        return Tent;
      default:
        return Radio;
    }
  };

  const getStatusVariant = (st: string) => {
    switch (st) {
      case 'disponible':
        return 'success';
      case 'movilizado':
        return 'danger';
      case 'mantenimiento':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Seccion 1: Solicitudes de Cesión Intermunicipal (Ayuntamientos) */}
      {(role === 'superadmin' || role === 'ayuntamiento') && resourceRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              Solicitudes e Intercambio de Recursos Entre Municipios
            </h3>
            <button
              onClick={onOpenResourceRequestModal}
              className="flex items-center space-x-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Pedir Apoyo a Municipio Vecino</span>
            </button>
          </div>

          <div className="space-y-2">
            {resourceRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-800 border border-amber-100 dark:border-gray-700 gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                      {req.requestingMunicipalityName} → {req.targetMunicipalityName}
                    </span>
                    <Badge variant={req.status === 'aceptada' ? 'success' : 'warning'}>
                      {req.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    <strong>Recurso Necesario:</strong> {req.resourceTypeNeeded} ({req.quantityNeeded})
                  </p>
                  <p className="text-[11px] text-gray-500 italic">{req.notes}</p>
                </div>

                {req.status === 'pendiente' && (role === 'superadmin' || user?.municipalityId === req.targetMunicipalityId) && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => updateResourceRequestStatus(req.id, 'aceptada')}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Aceptar y Ceder
                    </button>
                    <button
                      onClick={() => updateResourceRequestStatus(req.id, 'rechazada')}
                      className="rounded-lg bg-gray-200 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seccion 2: Catálogo e Inventario de Recursos */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Truck className="h-6 w-6 text-blue-600" />
              Inventario de Recursos y Materiales Operativos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Autobombas, retenes, drones, albergues y puntos de agua autorizados
            </p>
          </div>

          {(role === 'superadmin' || role === 'ayuntamiento') && (
            <button
              onClick={onOpenResourceRequestModal}
              className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>Solicitar Apoyo Intermunicipal</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((res) => {
            const CategoryIcon = getCategoryIcon(res.category);
            return (
              <div
                key={res.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase text-gray-400">
                        {res.category.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant={getStatusVariant(res.status)}>
                      {res.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-base font-extrabold text-gray-900 dark:text-white">
                    {res.name}
                  </h3>

                  <div className="mt-2 flex items-center space-x-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span>{res.municipalityName}</span>
                  </div>

                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    <strong>Capacidad / Especificación:</strong> {res.capacityOrQuantity}
                  </p>

                  <div className="mt-3 text-[11px] font-medium text-gray-500">
                    Persona de Contacto: <strong>{res.contactPerson}</strong> ({res.contactPhone})
                  </div>
                </div>

                {(role === 'superadmin' || role === 'ayuntamiento') && (
                  <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Cambiar disponibilidad:</span>
                    <select
                      value={res.status}
                      onChange={(e) => updateResourceStatus(res.id, e.target.value as any)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="movilizado">Movilizado</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="fuera_servicio">Fuera de Servicio</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
