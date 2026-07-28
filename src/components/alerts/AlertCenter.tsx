/**
 * Centro de Alertas y Evacuación Poblacional - Previncendios España
 */

import React, { useState } from 'react';
import { BellRing, ShieldAlert, Radio, Plus, CheckCircle, Trash2, MapPin, Send, Cloud } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface AlertCenterProps {
  onOpenCreateAlertModal: () => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ onOpenCreateAlertModal }) => {
  const { alerts, dismissAlert, filters, aemetAlerts } = useEmergency();
  const { role } = useAuth();

  const filteredAlerts = alerts.filter((alt) => {
    if (filters.municipalityId !== 'todas' && alt.municipalityId !== filters.municipalityId) return false;
    return true;
  });

  const canCreateAlert = role === 'superadmin' || role === 'ayuntamiento';

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BellRing className="h-6 w-6 text-red-600" />
            Centro de Alertas Poblacionales
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Emisión y difusión masiva de órdenes de evacuación, confinamiento y avisos
          </p>
        </div>

        {canCreateAlert && (
          <button
            onClick={onOpenCreateAlertModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>Emitir Alerta Poblacional</span>
          </button>
        )}
      </div>

      {/* Lista de Alertas */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-800">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-white">
            Sin Alertas Poblacionales Activas
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            La zona se encuentra bajo niveles habituales sin avisos de evacuación vigentes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              className={`rounded-2xl border p-5 transition-all ${
                alt.isActive
                  ? 'border-red-300 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/20 shadow-sm'
                  : 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant={alt.severity === 'critica' ? 'danger' : 'warning'}>
                      {alt.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="neutral">{alt.type.toUpperCase()}</Badge>
                    {!alt.isActive && <Badge variant="success">DESACTIVADA</Badge>}
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white mt-2">
                    {alt.title}
                  </h3>

                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {alt.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                      {alt.municipalityName} (Radio: {alt.radiusKm} km)
                    </span>
                    <span>Emitido por: {alt.issuedByName}</span>
                    <span>Hora: {new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {canCreateAlert && alt.isActive && (
                  <button
                    onClick={() => dismissAlert(alt.id)}
                    className="self-start rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-gray-700"
                  >
                    Desactivar Alerta
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Avisos meteorológicos oficiales AEMET */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <Cloud className="h-4 w-4 text-blue-500" />
          Avisos meteorológicos AEMET
        </h3>
        {aemetAlerts.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No hay avisos meteorológicos activos.</p>
        ) : (
          <div className="grid gap-2">
            {aemetAlerts.slice(0, 12).map((alert) => {
              const levelColor =
                alert.level === 'rojo'
                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900'
                  : alert.level === 'naranja'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900'
                  : alert.level === 'amarillo'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900'
                  : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-900';
              return (
                <a
                  key={alert.id}
                  href={alert.link || 'https://www.aemet.es/es/eltiempo/prediccion/avisos'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3 text-xs ${levelColor}`}
                >
                  <div>
                    <span className="font-bold uppercase tracking-wide">{alert.level}</span>
                    <span className="mx-1.5">·</span>
                    <span className="font-semibold">{alert.phenomenon || 'Aviso meteorológico'}</span>
                    <span className="mx-1.5">·</span>
                    <span>{alert.area}</span>
                    {alert.description && (
                      <p className="mt-1 text-[11px] opacity-90">{alert.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] opacity-75">
                    {alert.pubDate ? new Date(alert.pubDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : ''}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
