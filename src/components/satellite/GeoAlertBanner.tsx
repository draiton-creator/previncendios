/**
 * Alerta geolocalizada de fuego cercano - Previncendios España
 * Muestra un aviso cuando hay un foco satelital de alto riesgo cerca de la ubicación del usuario.
 */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, MapPin, X } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { SatelliteHotspot } from '../../types';
import { haversineKm } from '../../services/fireDetectionEngine';

const CRITICAL_DISTANCE_KM = 30;
const WARNING_DISTANCE_KM = 50;

interface GeoAlertBannerProps {
  onOpenMap?: () => void;
}

export const GeoAlertBanner: React.FC<GeoAlertBannerProps> = ({ onOpenMap }) => {
  const { satelliteHotspots, publicLocation } = useEmergency();
  const { user } = useAuth();
  const [nearest, setNearest] = React.useState<{
    spot: SatelliteHotspot;
    distanceKm: number;
  } | null>(null);
  const [dismissed, setDismissed] = React.useState<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const userLat = user?.currentLocation?.latitude ?? publicLocation?.latitude;
  const userLng = user?.currentLocation?.longitude ?? publicLocation?.longitude;

  useEffect(() => {
    if (userLat == null || userLng == null) {
      setNearest(null);
      return;
    }

    let best: { spot: SatelliteHotspot; distanceKm: number } | null = null;
    for (const spot of satelliteHotspots) {
      const distanceKm = haversineKm(userLat, userLng, spot.latitude, spot.longitude);
      if (distanceKm <= WARNING_DISTANCE_KM) {
        if (!best || distanceKm < best.distanceKm) {
          best = { spot, distanceKm };
        }
      }
    }

    setNearest(best);

    if (best && best.distanceKm <= CRITICAL_DISTANCE_KM && 'Notification' in window && Notification.permission === 'granted') {
      const key = `${best.spot.id}-${best.distanceKm.toFixed(1)}`;
      if (!notifiedRef.current.has(key)) {
        notifiedRef.current.add(key);
        new Notification('Fuego detectado cerca de ti', {
          body: `${best.spot.riskLevel || 'Foco'} a ${best.distanceKm.toFixed(1)} km en ${best.spot.municipalityName}`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [satelliteHotspots, userLat, userLng]);

  if (!nearest || dismissed === nearest.spot.id) return null;

  const isCritical = nearest.distanceKm <= CRITICAL_DISTANCE_KM;

  return (
    <div
      className={`relative px-4 py-3 text-white shadow-md ${
        isCritical
          ? 'bg-gradient-to-r from-red-700 via-red-600 to-amber-600 animate-pulse'
          : 'bg-gradient-to-r from-amber-600 to-orange-600'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-200" />
          <span className="truncate text-xs sm:text-sm font-bold">
            <strong className="uppercase tracking-wider">
              {isCritical ? 'FUEGO CERCANO:' : 'FUEGO A ' + WARNING_DISTANCE_KM + ' KM:'}
            </strong>{' '}
            {nearest.spot.riskLevel || 'Foco'} a {nearest.distanceKm.toFixed(1)} km ·{' '}
            {nearest.spot.municipalityName} · propagación {nearest.spot.spreadDirection} {nearest.spot.spreadSpeedKmH || 0} km/h
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="flex items-center space-x-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-[11px] font-bold transition-all hover:bg-white/30"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Ver mapa</span>
            </button>
          )}
          <button
            onClick={() => setDismissed(nearest.spot.id)}
            className="rounded-lg bg-white/20 p-1.5 hover:bg-white/30"
            aria-label="Descartar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
