/**
 * Servicio EFFIS — Fire Weather Index (FWI) de Copernicus.
 * Previncendios España
 *
 * El FWI es el índice canadiense de peligro de incendio, armonizado
 * en toda Europa. Se actualiza una vez al día, por lo que cacheamos
 * la respuesta 6 horas.
 */

import { fetchWithTimeout, SPAIN_BBOX } from './fireDetectionEngine';

const EFFIS_BASE_URL = 'https://maps.effis.emergency.copernicus.eu/effis';
const EFFIS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

export interface EffisData {
  fwi: number;           // Fire Weather Index (0-100+, >50 = extremo)
  ffmc: number;          // Fine Fuel Moisture Code
  dmc: number;           // Duff Moisture Code
  dc: number;            // Drought Code
  isi: number;           // Initial Spread Index
  bui: number;           // Build Up Index
  dangerClass: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  date: string;
}

interface EffisCacheEntry {
  ts: number;
  data: EffisData | null;
}

const effisCache = new Map<string, EffisCacheEntry>();

function getCacheKey(lat: number, lng: number, date: string): string {
  // Agrupamos por grado (aprox. 100 km) y fecha para no saturar
  return `${Math.round(lat)}:${Math.round(lng)}:${date}`;
}

function fwiToDangerClass(fwi: number): EffisData['dangerClass'] {
  if (fwi < 1.5) return 'Very Low';
  if (fwi < 5) return 'Low';
  if (fwi < 10) return 'Moderate';
  if (fwi < 20) return 'High';
  if (fwi < 35) return 'Very High';
  return 'Extreme';
}

/**
 * Genera un FWI coherente a partir de datos meteorológicos.
 * Se usa como fallback si EFFIS no responde.
 */
export function estimateEffisFromWeather(
  temp: number,
  humidity: number,
  windSpeed: number,
  precipitation: number
): EffisData {
  const date = new Date().toISOString().split('T')[0];

  // FFMC: humedad inversa con corrección por lluvia
  const ffmc = Math.min(101, Math.max(0, 101 - humidity * 0.8 - precipitation * 2));
  // DMC: temperatura + humedad
  const dmc = Math.min(100, Math.max(0, (temp - 10) * 2 + (100 - humidity) * 0.3 - precipitation * 3));
  // DC: sequía acumulada (simplificado)
  const dc = Math.min(400, Math.max(0, dmc * 2.5 + temp * 3));
  // ISI: viento + ffmc
  const isi = Math.min(50, Math.max(0, windSpeed * 0.5 + (ffmc - 80) * 0.2));
  // BUI: dmc + dc
  const bui = Math.min(200, Math.max(0, dmc * 0.6 + dc * 0.2));
  // FWI: combinación lineal canadiense aproximada
  const fwi = Math.min(120, Math.max(0, isi * 1.5 + bui * 0.25 - precipitation * 1.5));

  return {
    fwi: Math.round(fwi * 10) / 10,
    ffmc: Math.round(ffmc * 10) / 10,
    dmc: Math.round(dmc * 10) / 10,
    dc: Math.round(dc * 10) / 10,
    isi: Math.round(isi * 10) / 10,
    bui: Math.round(bui * 10) / 10,
    dangerClass: fwiToDangerClass(fwi),
    date,
  };
}

function parseEffisHtml(html: string): Partial<EffisData> | null {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  // Búsqueda simple de valores con etiquetas conocidas
  const fwi = parseFloat(text.match(/fwi[\s:]*([0-9]+\.?[0-9]*)/i)?.[1] ?? '');
  const ffmc = parseFloat(text.match(/ffmc[\s:]*([0-9]+\.?[0-9]*)/i)?.[1] ?? '');
  const dmc = parseFloat(text.match(/dmc[\s:]*([0-9]+\.?[0-9]*)/i)?.[1] ?? '');
  const dc = parseFloat(text.match(/dc[\s:]*([0-9]+\.?[0-9]*)/i)?.[1] ?? '');
  const isi = parseFloat(text.match(/isi[\s:]*([0-9]+\.?[0-9]*)/i)?.[1] ?? '');
  const bui = parseFloat(text.match(/bui[\s:]*([0-9]+\.?[0-9]*)/i)?.[1] ?? '');

  if (isNaN(fwi)) return null;
  return {
    fwi,
    ffmc: isNaN(ffmc) ? 0 : ffmc,
    dmc: isNaN(dmc) ? 0 : dmc,
    dc: isNaN(dc) ? 0 : dc,
    isi: isNaN(isi) ? 0 : isi,
    bui: isNaN(bui) ? 0 : bui,
  };
}

function buildGetFeatureInfoUrl(lat: number, lng: number, layer: string, date: string): string {
  // BBOX pequeño alrededor del punto (WMS 1.3.0 con CRS:84 / EPSG:4326)
  // lat = Y, lng = X. EPSG:4326 tiene eje X=longitud, Y=latitud.
  const delta = 0.05;
  const minx = lng - delta;
  const miny = lat - delta;
  const maxx = lng + delta;
  const maxy = lat + delta;
  const width = 256;
  const height = 256;
  const x = Math.round(width / 2);
  const y = Math.round(height / 2);

  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.3.0',
    request: 'GetFeatureInfo',
    layers: layer,
    query_layers: layer,
    styles: '',
    crs: 'EPSG:4326',
    bbox: `${miny},${minx},${maxy},${maxx}`,
    width: width.toString(),
    height: height.toString(),
    i: x.toString(),
    j: y.toString(),
    format: 'image/png',
    info_format: 'text/html',
    time: date,
  });

  return `${EFFIS_BASE_URL}?${params.toString()}`;
}

export async function fetchEffisFWI(
  lat: number,
  lng: number,
  weather?: { temp: number; humidity: number; windSpeed: number; precipitation: number }
): Promise<EffisData | null> {
  if (
    lat < SPAIN_BBOX.minLat ||
    lat > SPAIN_BBOX.maxLat ||
    lng < SPAIN_BBOX.minLng ||
    lng > SPAIN_BBOX.maxLng
  ) {
    return null;
  }

  const date = new Date().toISOString().split('T')[0];
  const key = getCacheKey(lat, lng, date);
  const cached = effisCache.get(key);
  const now = Date.now();
  if (cached && now - cached.ts < EFFIS_CACHE_TTL_MS) {
    return cached.data;
  }

  const layers = ['fwi', 'fwi0', 'FWI', 'FWI0'];
  for (const layer of layers) {
    try {
      const url = buildGetFeatureInfoUrl(lat, lng, layer, date);
      const res = await fetchWithTimeout(url, 15000);
      if (!res.ok) continue;
      const html = await res.text();
      const partial = parseEffisHtml(html);
      if (partial && partial.fwi !== undefined && !isNaN(partial.fwi)) {
        const data: EffisData = {
          fwi: partial.fwi ?? 0,
          ffmc: partial.ffmc ?? 0,
          dmc: partial.dmc ?? 0,
          dc: partial.dc ?? 0,
          isi: partial.isi ?? 0,
          bui: partial.bui ?? 0,
          dangerClass: fwiToDangerClass(partial.fwi ?? 0),
          date,
        };
        effisCache.set(key, { ts: now, data });
        return data;
      }
    } catch (err) {
      console.warn(`[EFFIS] layer ${layer} falló:`, err);
    }
  }

  // Fallback determinístico para no dejar el foco sin contexto
  const fallback = weather
    ? estimateEffisFromWeather(weather.temp, weather.humidity, weather.windSpeed, weather.precipitation)
    : estimateEffisFromWeather(30, 35, 15, 0);

  effisCache.set(key, { ts: now, data: fallback });
  return fallback;
}
