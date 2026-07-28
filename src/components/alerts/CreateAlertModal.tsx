/**
 * Modal para Emitir Alerta Poblacional / Evacuación
 * Previncendios España
 */

import React, { useState } from 'react';
import { BellRing, ShieldAlert, X, Send } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { AlertType, AlertSeverity } from '../../types';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ isOpen, onClose }) => {
  const { createAlert, municipalities } = useEmergency();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('evacuacion');
  const [severity, setSeverity] = useState<AlertSeverity>('critica');
  const [municipalityId, setMunicipalityId] = useState(user?.municipalityId || 'muni_el_tiemblo');
  const [radiusKm, setRadiusKm] = useState<number>(10);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const selectedMuni = municipalities.find((m) => m.id === municipalityId);

    createAlert({
      title,
      message,
      type,
      severity,
      municipalityId,
      municipalityName: selectedMuni?.name || 'El Tiemblo',
      radiusKm,
      issuedByUid: user?.uid || 'ayuntamiento',
      issuedByName: user?.displayName || 'Oficial de Protección Civil',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-red-100 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
              <ShieldAlert className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Emitir Nueva Alerta Poblacional
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aviso prioritario masivo a la ciudadanía y dispositivos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Título de la Alerta *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: EVACUACIÓN PREVENTIVA: Sector Suroeste"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Alerta
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AlertType)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="evacuacion">Evacuación Urgente</option>
                <option value="preconfinamiento">Confinamiento en Hogar</option>
                <option value="alerta_roja">Alerta Roja / AEMET</option>
                <option value="aviso_preventivo">Aviso Preventivo</option>
                <option value="bando_informativo">Bando Municipal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Gravedad
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="critica">Crítica (Riesgo de Vida)</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja / Informativa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Municipio
              </label>
              <select
                value={municipalityId}
                onChange={(e) => setMunicipalityId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.province})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Radio de Acción (km)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Mensaje e Instrucciones Oficiales *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Indique las vías de evacuación habilitadas, puntos de encuentro y recomendaciones..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Difundir Alerta Poblacional</span>
          </button>
        </form>
      </div>
    </div>
  );
};
