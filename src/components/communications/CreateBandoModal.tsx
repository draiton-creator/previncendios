/**
 * Modal para Publicar Bando Municipal - Previncendios España
 */

import React, { useState } from 'react';
import { MessageSquareText, Send, X } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';

interface CreateBandoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBandoModal: React.FC<CreateBandoModalProps> = ({ isOpen, onClose }) => {
  const { createBandoMessage, municipalities } = useEmergency();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState<'bando_oficial' | 'instruccion_voluntarios' | 'coordinacion_intermunicipal'>('bando_oficial');
  const [municipalityId, setMunicipalityId] = useState(user?.municipalityId || 'muni_el_tiemblo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const selectedMuni = municipalities.find((m) => m.id === municipalityId);

    createBandoMessage({
      senderUid: user?.uid || 'ayuntamiento',
      senderName: user?.displayName || 'Ayuntamiento Oficial',
      senderRole: user?.role || 'ayuntamiento',
      municipalityId,
      municipalityName: selectedMuni?.name || 'El Tiemblo',
      title,
      content,
      channel,
      targetRoles: ['ciudadano', 'voluntario', 'ayuntamiento', 'invitado'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <MessageSquareText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Publicar Comunicado / Bando Municipal
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Información oficial directa para vecinos y voluntarios
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
              Título del Bando / Aviso *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: BANDO OFICIAL: Estado de Prealerta por Riesgo Forestal"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Canal
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="bando_oficial">Bando Oficial (General)</option>
                <option value="instruccion_voluntarios">Instrucción Voluntarios</option>
                <option value="coordinacion_intermunicipal">Coordinación Intermunicipal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Municipio Emisor
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
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Texto Completo del Comunicado *
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escriba aquí el cuerpo de la comunicación oficial..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Publicar Comunicado Oficial</span>
          </button>
        </form>
      </div>
    </div>
  );
};
