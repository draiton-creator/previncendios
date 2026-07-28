/**
 * Página de Comunicaciones y Bandos - Previncendios España
 */

import React, { useState } from 'react';
import { AnnouncementsList } from '../../components/communications/AnnouncementsList';
import { GmailContactsIntegration } from '../../components/communications/GmailContactsIntegration';
import { MessageSquare, Mail } from 'lucide-react';

interface CommunicationsPageProps {
  onOpenCreateBandoModal: () => void;
}

export const CommunicationsPage: React.FC<CommunicationsPageProps> = ({ onOpenCreateBandoModal }) => {
  const [subTab, setSubTab] = useState<'bandos' | 'gmail'>('bandos');

  return (
    <div className="space-y-6">
      {/* Selector de Subpestañas */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 space-x-4">
        <button
          onClick={() => setSubTab('bandos')}
          className={`flex items-center space-x-2 border-b-2 pb-3 text-sm font-bold transition-all ${
            subTab === 'bandos'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Bandos y Avisos Locales</span>
        </button>

        <button
          onClick={() => setSubTab('gmail')}
          className={`flex items-center space-x-2 border-b-2 pb-3 text-sm font-bold transition-all ${
            subTab === 'gmail'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Boletines por Gmail y Contactos</span>
        </button>
      </div>

      {subTab === 'bandos' ? (
        <AnnouncementsList onOpenCreateBandoModal={onOpenCreateBandoModal} />
      ) : (
        <GmailContactsIntegration />
      )}
    </div>
  );
};
