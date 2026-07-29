/**
 * Servicio GOES-19 — Satélite geoestacionario NOAA sobre el Atlántico.
 * Previncendios España
 *
 * GOES-19 ofrece actualizaciones cada 5-10 minutos, siendo la única fuente
 * FIRMS con latencia sub-15 minutos sobre España.
 */

import { SatelliteHotspot } from '../types';
import { parseFirmsCsv, SPAIN_AREA, fetchWithTimeout } from './fireDetectionEngine';

const FIRMS_API_KEY = import.meta.env.VITE_FIRMS_API_KEY as string | undefined;
const GOES_SOURCE = 'GOES_NRT';
const GOES_CACHE_TTL_MS = 8 * 60 * 1000; // 8 minutos

let goesCache: { ts: number; hotspots: Omit<SatelliteHotspot, 'id' | 'municipalityName'>[] } | null = null;

async function fetchGoesSource(dayRange = 1): Promise<Omit<SatelliteHotspot, 'id' | 'municipalityName'>[]> {
  if (!FIRMS_API_KEY) return [];
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_API_KEY}/${GOES_SOURCE}/${SPAIN_AREA}/${dayRange}`;
  const res = await fetchWithTimeout(url, 25000);
  if (!res.ok) throw new Error(`FIRMS ${GOES_SOURCE} HTTP ${res.status}`);
  const text = await res.text();
  const parsed = parseFirmsCsv(text, GOES_SOURCE);
  // Forzar satélite GOES-19 y marcar como geoestacionario
  return parsed.map((h) => ({ ...h, satellite: 'GOES-19', isGeostationary: true }));
}

export async function fetchGoesHotspots(
  dayRange = 1
): Promise<Omit<SatelliteHotspot, 'id' | 'municipalityName'>[]> {
  if (!FIRMS_API_KEY) {
    console.warn('[GOES-19] Sin VITE_FIRMS_API_KEY. Fuente geoestacionaria deshabilitada.');
    return [];
  }

  const now = Date.now();
  if (goesCache && now - goesCache.ts < GOES_CACHE_TTL_MS) {
    console.log('[GOES-19] usando caché');
    return goesCache.hotspots;
  }

  try {
    const hotspots = await fetchGoesSource(dayRange);
    goesCache = { ts: now, hotspots };
    return hotspots;
  } catch (err) {
    console.warn('[GOES-19] error descargando:', err);
    return goesCache?.hotspots ?? [];
  }
}
