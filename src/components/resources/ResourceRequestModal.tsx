/**
 * Modal para Solicitud Intermunicipal de Recursos
 * Previncendios España
 */

import React, { useState } from 'react';
import { Truck, Send, X, Building2 } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { RequestUrgency } from '../../types';

interface ResourceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceRequestModal: React.FC<ResourceRequestModalProps> = ({ isOpen, onClose }) => {
  const { requestResourceShare, municipalities } = useEmergency();
  const { user } = useAuth();

  const [targetMunicipalityId, setTargetMunicipalityId] = useState('muni_cebreros');
  const [resourceTypeNeeded, setResourceTypeNeeded] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<RequestUrgency>('alta');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTypeNeeded.trim()) return;

    const requestingMuni = municipalities.find((m) => m.id === (user?.municipalityId || 'muni_el_tiemblo'));
    const targetMuni = municipalities.find((m) => m.id === targetMunicipalityId);

    requestResourceShare({
      requestingMunicipalityId: requestingMuni?.id || 'muni_el_tiemblo',
      requestingMunicipalityName: requestingMuni?.name || 'El Tiemblo',
      targetMunicipalityId,
      targetMunicipalityName: targetMuni?.name || 'Cebreros',
      resourceTypeNeeded,
      quantityNeeded,
      urgencyLevel,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Solicitud de Apoyo Intermunicipal
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Petición de cesión de medios a ayuntamientos colindantes
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
              Ayuntamiento Destinatario de la Solicitud *
            </label>
            <select
              value={targetMunicipalityId}
              onChange={(e) => setTargetMunicipalityId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {municipalities
                .filter((m) => m.id !== (user?.municipalityId || 'muni_el_tiemblo'))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    Ayuntamiento de {m.name} ({m.province})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Recurso Requerido *
            </label>
            <input
              type="text"
              required
              value={resourceTypeNeeded}
              onChange={(e) => setResourceTypeNeeded(e.target.value)}
              placeholder="Ej: Autobomba Ligera 4x4 + Dron Térmico"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Cantidad
              </label>
              <input
                type="text"
                value={quantityNeeded}
                onChange={(e) => setQuantityNeeded(e.target.value)}
                placeholder="Ej: 1 Unidad"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Urgencia
              </label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as RequestUrgency)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="inmediata">Inmediata (Urgente)</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Notas y Justificación
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indique la causa del apoyo operativo y el sector de despliegue..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Enviar Solicitud Oficial de Apoyo</span>
          </button>
        </form>
      </div>
    </div>
  );
};
