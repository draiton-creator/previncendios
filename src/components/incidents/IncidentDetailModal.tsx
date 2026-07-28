/**
 * Modal Detalle de Incidencia / Ficha de Emergencia
 * Previncendios España
 */

import React, { useState } from 'react';
import {
  Flame,
  MapPin,
  Clock,
  User,
  Shield,
  Truck,
  X,
  CheckCircle,
  AlertOctagon,
  Image as ImageIcon,
  Send,
} from 'lucide-react';
import { EmergencyEvent, IncidentStatus, IncidentSeverity } from '../../types';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface IncidentDetailModalProps {
  incident: EmergencyEvent | null;
  onClose: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({ incident, onClose }) => {
  const { updateIncidentStatus } = useEmergency();
  const { role } = useAuth();

  const [newStatus, setNewStatus] = useState<IncidentStatus>(incident?.status || 'confirmado');
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>(incident?.severity || 'Nivel 1');
  const [brigadeName, setBrigadeName] = useState<string>(incident?.assignedBrigade || '');

  if (!incident) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateIncidentStatus(incident.id, newStatus, newSeverity, brigadeName);
    onClose();
  };

  const canEditStatus = role === 'superadmin' || role === 'ayuntamiento' || role === 'voluntario';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-red-100 p-2.5 text-red-600 dark:bg-red-950 dark:text-red-400">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Badge variant={incident.severity === 'Nivel 3' ? 'danger' : 'warning'}>
                  {incident.severity}
                </Badge>
                <Badge variant="info">{incident.status.toUpperCase()}</Badge>
              </div>
              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {incident.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
          {/* Ubicación y Municipio */}
          <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center space-x-2 font-bold text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>
                {incident.municipalityName} ({incident.province})
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {incident.locationDescription}
            </p>
            <div className="mt-2 text-[11px] font-mono text-gray-400">
              GPS Coordenadas: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
            </div>
          </div>

          {/* Descripción de la Emergencia */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Descripción del Evento:</h4>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              {incident.description}
            </p>
          </div>

          {/* Fotos adjuntas */}
          {incident.photoUrls && incident.photoUrls.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                Evidencia Fotográfica:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {incident.photoUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Evidencia"
                    className="h-36 w-full rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Datos del Reportante y Brigada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800 bg-white dark:bg-gray-800/40">
              <span className="text-[11px] font-bold uppercase text-gray-400">Fuente / Reportante</span>
              <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-white">
                {incident.reportedByName}
              </p>
              <span className="text-[10px] text-gray-500 capitalize">Origen: {incident.source}</span>
            </div>

            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800 bg-white dark:bg-gray-800/40">
              <span className="text-[11px] font-bold uppercase text-gray-400">Brigada Asignada</span>
              <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-white">
                {incident.assignedBrigade || 'Pendiente de asignación'}
              </p>
            </div>
          </div>

          {/* Panel de Gestión Operativa para Ayuntamiento/Superadmin/Voluntario */}
          {canEditStatus && (
            <form onSubmit={handleUpdate} className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                Control de Mando Operativo
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Estado de Incidencia
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="detectado">1. Detectado</option>
                    <option value="confirmado">2. Confirmado</option>
                    <option value="en_control">3. En Control</option>
                    <option value="estabilizado">4. Estabilizado</option>
                    <option value="extinguido">5. Extinguido</option>
                    <option value="falsa_alarma">Falsa Alarma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Nivel de Severidad
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Nivel 0">Nivel 0 (Sin peligro)</option>
                    <option value="Nivel 1">Nivel 1 (Medios locales)</option>
                    <option value="Nivel 2">Nivel 2 (Medios autonom.)</option>
                    <option value="Nivel 3">Nivel 3 (Nacional / UME)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Brigada / Dotación
                  </label>
                  <input
                    type="text"
                    value={brigadeName}
                    onChange={(e) => setBrigadeName(e.target.value)}
                    placeholder="Ej: INFOCAL B-04"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center space-x-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
              >
                <Send className="h-4 w-4" />
                <span>Actualizar Estado de Emergencia</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
