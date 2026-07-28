/**
 * Tablón de Bandos y Comunicados Oficiales - Previncendios España
 */

import React from 'react';
import { MessageSquareText, Plus, Building2, Calendar, Radio, Shield } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface AnnouncementsListProps {
  onOpenCreateBandoModal: () => void;
}

export const AnnouncementsList: React.FC<AnnouncementsListProps> = ({ onOpenCreateBandoModal }) => {
  const { messages, filters } = useEmergency();
  const { role } = useAuth();

  const filteredMessages = messages.filter((msg) => {
    if (filters.municipalityId !== 'todas' && msg.municipalityId !== filters.municipalityId) return false;
    return true;
  });

  const canCreateBando = role === 'superadmin' || role === 'ayuntamiento';

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquareText className="h-6 w-6 text-blue-600" />
            Bandos Oficiales y Tablón de Instrucciones
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Comunicaciones institucionales verficadas para la población y equipos
          </p>
        </div>

        {canCreateBando && (
          <button
            onClick={onOpenCreateBandoModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>Publicar Bando Municipal</span>
          </button>
        )}
      </div>

      {/* Lista de Mensajes */}
      <div className="space-y-3">
        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <Badge variant={msg.channel === 'bando_oficial' ? 'info' : 'warning'}>
                    {msg.channel.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {msg.municipalityName}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-extrabold text-gray-900 dark:text-white">
                  {msg.title}
                </h3>

                <p className="mt-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {msg.content}
                </p>

                <div className="mt-3 flex items-center space-x-3 text-[11px] font-semibold text-gray-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    Emisor: {msg.senderName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
