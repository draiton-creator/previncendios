/**
 * Banner de Alerta Crítica - Previncendios España
 */

import React from 'react';
import { ShieldAlert, ChevronRight, X } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';

interface AlertBannerProps {
  onOpenAlertsTab: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ onOpenAlertsTab }) => {
  const { alerts } = useEmergency();

  const criticalAlert = alerts.find((a) => a.isActive && a.severity === 'critica');

  if (!criticalAlert) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-amber-600 px-4 py-2.5 text-white shadow-md animate-pulse">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="h-5 w-5 shrink-0 text-yellow-300" />
          <span className="truncate">
            <strong className="uppercase tracking-wider">ALERTA CRÍTICA:</strong> {criticalAlert.title}
          </span>
        </div>

        <button
          onClick={onOpenAlertsTab}
          className="flex shrink-0 items-center space-x-1 rounded-lg bg-white/20 px-3 py-1 text-xs font-bold transition-all hover:bg-white/30"
        >
          <span>Ver Instrucciones</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
