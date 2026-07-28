/**
 * Feed público de focos satelitales detectados por FIRMS.
 * Muestra los focos más intensos con distancia a la ubicación del usuario.
 */

import React from 'react';
import { Flame, Satellite, Wind, MapPin, Navigation } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { SatelliteHotspot } from '../../types';
import { haversineKm } from '../../services/fireDetectionEngine';

interface SatelliteHotspotsFeedProps {
  maxItems?: number;
  onOpenMap?: () => void;
}

const riskBadge = (risk?: SatelliteHotspot['riskLevel']) => {
  switch (risk) {
    case 'Extremo':
      return 'bg-red-600 text-white';
    case 'Muy Alto':
      return 'bg-red-500 text-white';
    case 'Alto':
      return 'bg-orange-500 text-white';
    case 'Moderado':
      return 'bg-amber-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

export const SatelliteHotspotsFeed: React.FC<SatelliteHotspotsFeedProps> = ({
  maxItems = 10,
  onOpenMap,
}) => {
  const { satelliteHotspots } = useEmergency();
  const { user } = useAuth();

  const userLat = user?.currentLocation?.latitude;
  const userLng = user?.currentLocation?.longitude;

  const sorted = [...satelliteHotspots]
    .sort((a, b) => (b.frp || 0) - (a.frp || 0))
    .slice(0, maxItems)
    .map((spot) => {
      let distanceKm: number | null = null;
      if (userLat != null && userLng != null) {
        distanceKm = haversineKm(userLat, userLng, spot.latitude, spot.longitude);
      }
      return { spot, distanceKm };
    });

  if (!satelliteHotspots.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <Satellite className="h-5 w-5 text-orange-600" />
          Focos detectados por satélite
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Esperando primer escaneo satelital...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Satellite className="h-5 w-5 text-orange-600" />
          Focos detectados por satélite
        </h3>
        {onOpenMap && (
          <button
            onClick={onOpenMap}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            <MapPin className="h-3.5 w-3.5" />
            Ver en mapa
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {sorted.map(({ spot, distanceKm }) => (
          <div
            key={spot.id}
            className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3.5 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-1.5 ${riskBadge(spot.riskLevel)}`}>
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {spot.municipalityName}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {spot.satellite} · {spot.acqDate} {spot.acqTime} UTC
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${riskBadge(spot.riskLevel)}`}>
                {spot.riskLevel || 'Bajo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Satellite className="h-3 w-3 text-orange-500" />
                <span>FRP <b>{spot.frp} MW</b></span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3 text-blue-500" />
                <span>{spot.windDirection || '-'} {spot.windSpeedKmH || 0} km/h</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Brillo</span>
                <span><b>{spot.brightness || '-'}</b> K</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="h-3 w-3 text-emerald-500" />
                <span>
                  {distanceKm != null
                    ? `${distanceKm.toFixed(1)} km`
                    : spot.distanceToMunicipalityKm != null
                    ? `${spot.distanceToMunicipalityKm} km del municipio`
                    : 'Distancia no disponible'}
                </span>
              </div>
            </div>

            {spot.riskLevel && spot.riskLevel !== 'Bajo' && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">
                {spot.reasoning}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
