/**
 * Motor de detección de incendios forestales con satélite FIRMS, IA (Gemini) y meteorología.
 * Previncendios España
 *
 * Flujo:
 * 1. Descarga puntos calientes de NASA FIRMS (MODIS/VIIRS) para España.
 * 2. Obtiene el municipio más cercano y datos meteorológicos (Open-Meteo / OpenWeather).
 * 3. Analiza el conjunto con IA (Gemini) solo en los focos más intensos para no ralentizar.
 * 4. Devuelve candidatos a SatelliteHotspot y EmergencyEvent listos para ser creados automáticamente.
 */

import { EmergencyEvent, Municipality, SatelliteHotspot } from '../types';
import { mockSatelliteHotspots } from './firmsSatelliteService';

const FIRMS_API_KEY = import.meta.env.VITE_FIRMS_API_KEY as string | undefined;
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Bounding box aproximado de España peninsular + Baleares + Canarias
const SPAIN_BBOX = {
  minLng: -18.4,
  minLat: 27.6,
  maxLng: 4.4,
  maxLat: 43.8,
};

const SPAIN_AREA = `${SPAIN_BBOX.minLng},${SPAIN_BBOX.minLat},${SPAIN_BBOX.maxLng},${SPAIN_BBOX.maxLat}`;

// Fuentes FIRMS a combinar para máxima cobertura (NRT = Near Real Time)
const FIRMS_SOURCES = ['VIIRS_NOAA20_NRT', 'VIIRS_SNPP_NRT', 'MODIS_NRT'] as const;

const CARDINAL_TO_DEG: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
};

export function cardinalToDegrees(cardinal: string): number {
  const key = cardinal.toUpperCase().split(' ')[0];
  return CARDINAL_TO_DEG[key] ?? 0;
}

export function destinationPoint(lat: number, lng: number, distanceKm: number, bearingDeg: number) {
  const R = 6371;
  const lat1 = toRadians(lat);
  const lng1 = toRadians(lng);
  const brng = toRadians(bearingDeg);
  const d = distanceKm / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { latitude: (lat2 * 180) / Math.PI, longitude: (lng2 * 180) / Math.PI };
}

export interface WeatherData {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmH: number;
  windGustKmH: number;
  windDirectionDeg: number;
  windDirectionText: string;
  precipitationMm: number;
  fireRiskIndex: number; // 0-100 aproximado
}

export interface FirePrediction {
  spreadDirection: string; // Ej: "NE", "SO"
  spreadSpeedKmH: number;
  affectedAreaHectares: number;
  riskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto' | 'Extremo';
  confidence: 'low' | 'nominal' | 'high';
  reasoning: string;
}

export interface DetectedFire {
  hotspot: SatelliteHotspot;
  weather: WeatherData;
  prediction: FirePrediction;
  incident: Omit<EmergencyEvent, 'id' | 'createdAt' | 'updatedAt'> | null;
}

// --- utilidades ---

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function degToCardinal(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

function findNearestMunicipality(lat: number, lng: number, municipalities: Municipality[]) {
  let nearest: Municipality | null = null;
  let minDist = Infinity;
  for (const muni of municipalities) {
    const dist = haversineKm(lat, lng, muni.centerLat, muni.centerLng);
    if (dist < minDist) {
      minDist = dist;
      nearest = muni;
    }
  }
  return { municipality: nearest, distanceKm: minDist };
}

function parseConfidence(value: string | undefined): SatelliteHotspot['confidence'] {
  const raw = (value || '').toString().trim().toLowerCase();
  if (['l', 'low', 'b', 'bajo', 'baja'].includes(raw)) return 'low';
  if (['n', 'nominal', 'm', 'medium', 'medio'].includes(raw)) return 'nominal';
  if (['h', 'high', 'alto', 'alta'].includes(raw)) return 'high';
  // MODIS devuelve un porcentaje 0-100
  const num = parseFloat(raw);
  if (!isNaN(num)) {
    if (num < 30) return 'low';
    if (num < 80) return 'nominal';
    return 'high';
  }
  return 'nominal';
}

function parseSatellite(value: string | undefined, source: string): SatelliteHotspot['satellite'] {
  const raw = (value || '').toString().trim().toUpperCase();
  const byValue: Record<string, SatelliteHotspot['satellite']> = {
    T: 'Terra',
    TERRA: 'Terra',
    A: 'Aqua',
    AQUA: 'Aqua',
    N: 'VIIRS-NPP',
    '1': 'VIIRS-NPP',
    SNPP: 'VIIRS-NPP',
    '2': 'NOAA-20',
    '3': 'NOAA-21',
    'NOAA-20': 'NOAA-20',
    'NOAA-21': 'NOAA-21',
    NOAA20: 'NOAA-20',
    NOAA21: 'NOAA-21',
  };
  if (byValue[raw]) return byValue[raw];

  const bySource: Record<string, SatelliteHotspot['satellite']> = {
    VIIRS_NOAA20_NRT: 'NOAA-20',
    VIIRS_SNPP_NRT: 'VIIRS-NPP',
    MODIS_NRT: 'Terra',
  };
  return bySource[source] || 'NOAA-20';
}

function parseFirmsCsv(csv: string, source: string): Omit<SatelliteHotspot, 'id' | 'municipalityName'>[] {
  if (!csv || !csv.trim()) return [];
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const latIdx = header.indexOf('latitude');
  const lonIdx = header.indexOf('longitude');
  const brightIdx = header.indexOf('brightness');
  const brightTi4Idx = header.indexOf('bright_ti4');
  const brightTi5Idx = header.indexOf('bright_ti5');
  const brightT31Idx = header.indexOf('bright_t31');
  const confIdx = header.indexOf('confidence');
  const dateIdx = header.indexOf('acq_date');
  const timeIdx = header.indexOf('acq_time');
  const satIdx = header.indexOf('satellite');
  const frpIdx = header.indexOf('frp');
  const versionIdx = header.indexOf('version');
  const scanIdx = header.indexOf('scan');
  const dayNightIdx = header.indexOf('daynight');

  if (latIdx < 0 || lonIdx < 0) return [];

  const out: Omit<SatelliteHotspot, 'id' | 'municipalityName'>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < Math.max(latIdx, lonIdx) + 1) continue;

    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lonIdx]);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < SPAIN_BBOX.minLat ||
      lat > SPAIN_BBOX.maxLat ||
      lng < SPAIN_BBOX.minLng ||
      lng > SPAIN_BBOX.maxLng
    ) {
      continue;
    }

    const brightness =
      parseFloat(
        cols[brightIdx] || cols[brightTi4Idx] || cols[brightT31Idx] || cols[brightTi5Idx] || '0'
      ) || 0;
    const frp = parseFloat(cols[frpIdx] || '0') || 0;
    const acqDate = cols[dateIdx] || '';
    const acqTime = (cols[timeIdx] || '').padStart(4, '0');

    out.push({
      latitude: lat,
      longitude: lng,
      brightness,
      confidence: parseConfidence(cols[confIdx]),
      acqDate,
      acqTime,
      satellite: parseSatellite(cols[satIdx], source),
      frp,
      scan: cols[scanIdx] || undefined,
      version: cols[versionIdx] || undefined,
      daynight: cols[dayNightIdx] || undefined,
    });
  }
  return out;
}

// Cachés para no saturar las APIs
let firmsCache: { ts: number; hotspots: Omit<SatelliteHotspot, 'id' | 'municipalityName'>[] } | null = null;
const FIRMS_CACHE_TTL_MS = 15_000; // 15 segundos: permite re-fresco frecuente sin duplicar llamadas

const weatherCache = new Map<string, { ts: number; data: WeatherData }>();
const weatherPromiseCache = new Map<string, Promise<WeatherData>>();
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;

const WEATHER_CONCURRENCY = 12;
const GEMINI_TOP_N = 10;
const GEMINI_MAX_CONCURRENCY = 3;

function areaKey(lat: number, lng: number, decimals = 1) {
  return `${lat.toFixed(decimals)}:${lng.toFixed(decimals)}`;
}

async function fetchWithTimeout(url: string, timeoutMs = 15000, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...(init || {}), signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFirmsSource(
  source: string,
  dayRange = 1
): Promise<Omit<SatelliteHotspot, 'id' | 'municipalityName'>[]> {
  if (!FIRMS_API_KEY) return [];
  // Orden correcto: MAP_KEY primero, luego SOURCE, luego ÁREA, luego DAY
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_API_KEY}/${source}/${SPAIN_AREA}/${dayRange}`;
  const res = await fetchWithTimeout(url, 25000);
  if (!res.ok) throw new Error(`FIRMS ${source} HTTP ${res.status}`);
  const text = await res.text();
  return parseFirmsCsv(text, source);
}

export async function fetchFirmsHotspots(
  dayRange = 1
): Promise<Omit<SatelliteHotspot, 'id' | 'municipalityName'>[]> {
  if (!FIRMS_API_KEY) {
    console.warn('[FIRMS] Sin VITE_FIRMS_API_KEY. Usando datos simulados.');
    return mockSatelliteHotspots.map(({ id, municipalityName, ...rest }) => rest);
  }

  const now = Date.now();
  if (firmsCache && now - firmsCache.ts < FIRMS_CACHE_TTL_MS) {
    console.log('[FIRMS] usando caché');
    return firmsCache.hotspots;
  }

  const results = await Promise.allSettled(FIRMS_SOURCES.map((s) => fetchFirmsSource(s, dayRange)));
  const all: Omit<SatelliteHotspot, 'id' | 'municipalityName'>[] = [];
  let anySuccess = false;

  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      anySuccess = true;
      all.push(...r.value);
    } else {
      console.warn(`[FIRMS] error descargando ${FIRMS_SOURCES[idx]}:`, r.reason);
    }
  });

  if (!anySuccess) {
    console.warn('[FIRMS] Todos los orígenes fallaron. Usando datos simulados.');
    return mockSatelliteHotspots.map(({ id, municipalityName, ...rest }) => rest);
  }

  // Deduplicar por ubicación/redondeo y hora aproximada (≈ 1 km)
  const seen = new Map<string, Omit<SatelliteHotspot, 'id' | 'municipalityName'>>();
  for (const h of all) {
    const key = `${h.acqDate}:${h.acqTime}:${h.latitude.toFixed(2)}:${h.longitude.toFixed(2)}`;
    const existing = seen.get(key);
    if (!existing || h.frp > existing.frp || (h.frp === existing.frp && h.confidence === 'high')) {
      seen.set(key, h);
    }
  }
  const deduped = Array.from(seen.values()).sort((a, b) => b.frp - a.frp);

  firmsCache = { ts: now, hotspots: deduped };
  return deduped;
}

export function getFirmsWmsBaseUrl(): string | null {
  return FIRMS_API_KEY ? `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/${FIRMS_API_KEY}/` : null;
}

async function runInBatches<T>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    while (queue.length) {
      const item = queue.shift()!;
      await fn(item, workerIndex);
    }
  });
  await Promise.all(workers);
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&windspeed_unit=kmh&timezone=auto`;
    const res = await fetchWithTimeout(url, 12000);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current || {};
    const windDeg = Number(c.wind_direction_10m ?? 0);
    const windSpeed = Number(c.wind_speed_10m ?? 0); // ya en km/h por windspeed_unit=kmh
    const windGust = Number(c.wind_gusts_10m ?? 0);
    const temp = Number(c.temperature_2m ?? 30);
    const hum = Number(c.relative_humidity_2m ?? 30);
    const precip = Number(c.precipitation ?? 0);
    const fireRiskIndex = computeFireRiskIndex(temp, hum, windSpeed, windGust, precip);
    return {
      temperatureC: Math.round(temp),
      humidityPercent: Math.round(hum),
      windSpeedKmH: Math.round(windSpeed),
      windGustKmH: Math.round(windGust),
      windDirectionDeg: Math.round(windDeg),
      windDirectionText: degToCardinal(windDeg),
      precipitationMm: Math.round(precip * 10) / 10,
      fireRiskIndex,
    };
  } catch (err) {
    console.warn('[Open-Meteo] error:', err);
    return null;
  }
}

async function fetchOpenWeather(lat: number, lng: number): Promise<WeatherData | null> {
  if (!OPENWEATHER_API_KEY) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;
    const res = await fetchWithTimeout(url, 12000);
    if (!res.ok) return null;
    const data = await res.json();
    const windDeg = data.wind?.deg ?? 0;
    const windSpeedMs = data.wind?.speed ?? 0;
    const windGustMs = data.wind?.gust ?? 0;
    const temp = data.main?.temp ?? 30;
    const hum = data.main?.humidity ?? 30;
    const precip = data.rain?.['1h'] ?? data.snow?.['1h'] ?? 0;
    const windSpeedKmH = Math.round(windSpeedMs * 3.6);
    const windGustKmH = Math.round(windGustMs * 3.6);
    const fireRiskIndex = computeFireRiskIndex(temp, hum, windSpeedKmH, windGustKmH, precip);
    return {
      temperatureC: Math.round(temp),
      humidityPercent: Math.round(hum),
      windSpeedKmH,
      windGustKmH,
      windDirectionDeg: Math.round(windDeg),
      windDirectionText: degToCardinal(windDeg),
      precipitationMm: Math.round(precip * 10) / 10,
      fireRiskIndex,
    };
  } catch (err) {
    console.warn('[OpenWeather] error:', err);
    return null;
  }
}

export async function fetchWeatherForLocation(lat: number, lng: number): Promise<WeatherData> {
  const key = areaKey(lat, lng, 1);
  const cached = weatherCache.get(key);
  const now = Date.now();
  if (cached && now - cached.ts < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = weatherPromiseCache.get(key);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<WeatherData> => {
    let data = await fetchOpenMeteo(lat, lng);
    if (!data && OPENWEATHER_API_KEY) {
      data = await fetchOpenWeather(lat, lng);
    }
    if (!data) {
      // Fallback regional veraniego; evita dejar el punto sin contexto
      data = {
        temperatureC: 30,
        humidityPercent: 35,
        windSpeedKmH: 15,
        windGustKmH: 20,
        windDirectionDeg: 225,
        windDirectionText: 'SO',
        precipitationMm: 0,
        fireRiskIndex: 65,
      };
    }
    weatherCache.set(key, { ts: Date.now(), data });
    return data;
  })();

  weatherPromiseCache.set(key, promise);
  try {
    return await promise;
  } finally {
    weatherPromiseCache.delete(key);
  }
}

function computeFireRiskIndex(
  temp: number,
  hum: number,
  windSpeed: number,
  windGust: number,
  precipitation: number
): number {
  let risk =
    (temp - 10) * 1.2 +
    (100 - hum) * 0.6 +
    windSpeed * 0.5 +
    Math.max(0, windGust - windSpeed) * 0.3 -
    precipitation * 8;
  return Math.min(100, Math.max(0, Math.round(risk)));
}

function predictFireDeterministic(
  hotspot: Omit<SatelliteHotspot, 'id' | 'municipalityName'>,
  weather: WeatherData
): FirePrediction {
  const fireScore =
    hotspot.frp * 2 +
    (weather.temperatureC - 10) * 1.5 +
    (100 - weather.humidityPercent) * 0.8 +
    weather.windSpeedKmH * 0.6 +
    weather.windGustKmH * 0.3 -
    weather.precipitationMm * 10 +
    (hotspot.confidence === 'high' ? 20 : hotspot.confidence === 'low' ? -10 : 0);

  let riskLevel: FirePrediction['riskLevel'] = 'Bajo';
  if (fireScore > 130) riskLevel = 'Extremo';
  else if (fireScore > 100) riskLevel = 'Muy Alto';
  else if (fireScore > 70) riskLevel = 'Alto';
  else if (fireScore > 40) riskLevel = 'Moderado';

  const spreadSpeedKmH = Math.max(
    0,
    Math.round(weather.windSpeedKmH * 0.4 + hotspot.frp * 0.05 + weather.windGustKmH * 0.1)
  );
  const affectedAreaHectares = Math.round(hotspot.frp * 0.8 + weather.windSpeedKmH * 0.5 + weather.temperatureC * 0.2);

  return {
    spreadDirection: weather.windDirectionText,
    spreadSpeedKmH,
    affectedAreaHectares,
    riskLevel,
    confidence: hotspot.confidence,
    reasoning: `${hotspot.satellite}: FRP ${hotspot.frp} MW, brillo ${hotspot.brightness} K, confianza ${hotspot.confidence}. Clima ${weather.temperatureC}°C / HR ${weather.humidityPercent}% / viento ${weather.windDirectionText} ${weather.windSpeedKmH} km/h (ráfagas ${weather.windGustKmH}) / lluvia ${weather.precipitationMm} mm. Riesgo ${riskLevel}.`,
  };
}

async function predictFireWithGemini(
  hotspot: Omit<SatelliteHotspot, 'id' | 'municipalityName'>,
  weather: WeatherData
): Promise<FirePrediction> {
  if (!GEMINI_API_KEY) return predictFireDeterministic(hotspot, weather);

  const prompt = `Eres un experto en detección de incendios forestales en España.
Analiza el siguiente punto caliente detectado por satélite y los datos meteorológicos:
- Latitud: ${hotspot.latitude}
- Longitud: ${hotspot.longitude}
- Brillo: ${hotspot.brightness} K
- FRP (Fire Radiative Power): ${hotspot.frp} MW
- Confianza: ${hotspot.confidence}
- Satélite: ${hotspot.satellite}
- Temperatura: ${weather.temperatureC} ºC
- Humedad: ${weather.humidityPercent}%
- Viento: ${weather.windSpeedKmH} km/h desde dirección ${weather.windDirectionText} (${weather.windDirectionDeg}º)
- Ráfagas: ${weather.windGustKmH} km/h
- Lluvia última hora: ${weather.precipitationMm} mm

Responde ÚNICAMENTE con un JSON válido sin markdown:
{
  "isFire": boolean,
  "riskLevel": "Bajo" | "Moderado" | "Alto" | "Muy Alto" | "Extremo",
  "confidence": "low" | "nominal" | "high",
  "spreadDirection": "texto como NE o SO",
  "spreadSpeedKmH": number,
  "affectedAreaHectares": number,
  "reasoning": "explicación corta en español"
}`;

  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      25000,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as Partial<FirePrediction & { isFire: boolean }>;
    if (!parsed.isFire) {
      return {
        ...predictFireDeterministic(hotspot, weather),
        riskLevel: 'Bajo',
        confidence: 'low',
        reasoning: 'El modelo no considera este punto caliente como un incendio activo.',
      };
    }
    return {
      spreadDirection: parsed.spreadDirection || weather.windDirectionText,
      spreadSpeedKmH: Math.max(0, Math.round(parsed.spreadSpeedKmH || 0)),
      affectedAreaHectares: Math.max(0, Math.round(parsed.affectedAreaHectares || 0)),
      riskLevel: ['Bajo', 'Moderado', 'Alto', 'Muy Alto', 'Extremo'].includes(parsed.riskLevel || '')
        ? (parsed.riskLevel as FirePrediction['riskLevel'])
        : 'Moderado',
      confidence: ['low', 'nominal', 'high'].includes(parsed.confidence || '')
        ? (parsed.confidence as FirePrediction['confidence'])
        : hotspot.confidence,
      reasoning: parsed.reasoning || 'Análisis realizado por Gemini.',
    };
  } catch (err) {
    console.warn('[Gemini] Error llamando al modelo:', err);
    return predictFireDeterministic(hotspot, weather);
  }
}

function riskLevelToSeverity(level: FirePrediction['riskLevel']): EmergencyEvent['severity'] {
  switch (level) {
    case 'Extremo':
      return 'Nivel 3';
    case 'Muy Alto':
      return 'Nivel 3';
    case 'Alto':
      return 'Nivel 2';
    case 'Moderado':
      return 'Nivel 1';
    default:
      return 'Nivel 0';
  }
}

function formatAcqDateTime(acqDate: string, acqTime: string): string {
  if (!acqDate) return new Date().toISOString();
  const time = acqTime.padStart(4, '0');
  const hours = time.slice(0, 2);
  const minutes = time.slice(2, 4);
  return `${acqDate}T${hours}:${minutes}:00Z`;
}

export async function detectFires(
  municipalities: Municipality[],
  existingIncidents: EmergencyEvent[] = []
): Promise<DetectedFire[]> {
  const rawHotspots = await fetchFirmsHotspots();
  if (!rawHotspots.length) return [];

  const cutoffTime = Date.now() - 2 * 60 * 60 * 1000;
  const known = existingIncidents.filter(
    (inc) =>
      inc.source === 'satelite_firms' &&
      new Date(inc.createdAt).getTime() > cutoffTime
  );

  // Encontrar municipio más cercano y descartar duplicados contra incidencias recientes
  type Enriched = {
    raw: Omit<SatelliteHotspot, 'id' | 'municipalityName'>;
    municipality: Municipality | null;
    distanceKm: number;
    weather: WeatherData | null;
    prediction: FirePrediction | null;
  };
  const enriched: Enriched[] = [];

  for (const raw of rawHotspots) {
    const { municipality, distanceKm } = findNearestMunicipality(
      raw.latitude,
      raw.longitude,
      municipalities
    );

    const isDuplicate = known.some((inc) => {
      const d = haversineKm(raw.latitude, raw.longitude, inc.latitude, inc.longitude);
      return d < 3;
    });
    if (isDuplicate) continue;

    enriched.push({ raw, municipality, distanceKm, weather: null, prediction: null });
  }

  // Obtener clima en paralelo con concurrencia controlada
  const weatherList = new Array<WeatherData>(enriched.length);
  await runInBatches(
    enriched.map((e, i) => ({ e, i })),
    WEATHER_CONCURRENCY,
    async ({ e, i }) => {
      weatherList[i] = await fetchWeatherForLocation(e.raw.latitude, e.raw.longitude);
    }
  );

  enriched.forEach((item, i) => {
    item.weather = weatherList[i];
    item.prediction = predictFireDeterministic(item.raw, item.weather);
  });

  // Enriquecer los focos más intensos con Gemini (top N)
  const indexesByFrp = enriched
    .map((_, i) => i)
    .sort((a, b) => enriched[b].raw.frp - enriched[a].raw.frp);
  const topIndexes = GEMINI_API_KEY
    ? indexesByFrp
        .filter((i) => enriched[i].raw.frp > 10 || enriched[i].raw.confidence === 'high')
        .slice(0, GEMINI_TOP_N)
    : [];

  await runInBatches(topIndexes, GEMINI_MAX_CONCURRENCY, async (i) => {
    const item = enriched[i];
    if (!item.weather) return;
    item.prediction = await predictFireWithGemini(item.raw, item.weather);
  });

  const results: DetectedFire[] = [];
  for (const item of enriched) {
    const { raw, municipality, distanceKm } = item;
    const weather = item.weather!;
    const prediction = item.prediction!;

    const municipalityName = municipality
      ? distanceKm <= 100
        ? `${municipality.name} (${municipality.province})`
        : `Zona rural — ${Math.round(distanceKm)} km de ${municipality.name} (${municipality.province})`
      : 'Zona sin municipio asignado';

    const hotspot: SatelliteHotspot = {
      ...raw,
      id: `firms-${raw.satellite}-${raw.acqDate}-${raw.acqTime}-${raw.latitude.toFixed(4)}-${raw.longitude.toFixed(4)}`,
      municipalityName,
      distanceToMunicipalityKm: Math.round(distanceKm * 10) / 10,
      riskLevel: prediction.riskLevel,
      spreadDirection: prediction.spreadDirection,
      spreadSpeedKmH: prediction.spreadSpeedKmH,
      affectedAreaHectares: prediction.affectedAreaHectares,
      temperatureC: weather.temperatureC,
      humidityPercent: weather.humidityPercent,
      windSpeedKmH: weather.windSpeedKmH,
      windGustKmH: weather.windGustKmH,
      windDirection: weather.windDirectionText,
      precipitationMm: weather.precipitationMm,
      reasoning: prediction.reasoning,
    };

    const riskText = prediction.riskLevel;
    const severity = riskLevelToSeverity(riskText);
    const status: EmergencyEvent['status'] =
      prediction.confidence === 'high' ? 'confirmado' : 'detectado';

    // No generar incidencia oficial para ruido puro (Bajo + low)
    const createIncident = !(riskText === 'Bajo' && hotspot.confidence === 'low');

    const incident: DetectedFire['incident'] = createIncident && municipality
      ? {
          title: `Detección satelital ${hotspot.satellite} - ${municipality.name}`,
          type: 'incendio_forestal',
          severity,
          status,
          municipalityId: municipality.id,
          municipalityName: municipality.name,
          province: municipality.province,
          latitude: raw.latitude,
          longitude: raw.longitude,
          locationDescription: `Punto caliente FIRMS a ${distanceKm.toFixed(1)} km del centro de ${municipality.name}. FRP ${hotspot.frp} MW, confianza ${hotspot.confidence}. Dirección de propagación estimada: ${prediction.spreadDirection}.`,
          description: `Detección automática por satélite ${hotspot.satellite} (FRP ${hotspot.frp} MW). El análisis indica riesgo ${riskText} con propagación hacia el ${prediction.spreadDirection} a aproximadamente ${prediction.spreadSpeedKmH} km/h. ${prediction.reasoning}`,
          reportedByUid: 'system-satellite-ai',
          reportedByName: `Satélite ${hotspot.satellite} + IA`,
          reportedByRole: 'superadmin',
          source: 'satelite_firms',
          assignedBrigade: '',
          photoUrls: [],
          affectedAreaHectares: prediction.affectedAreaHectares,
        }
      : null;

    results.push({ hotspot, weather, prediction, incident });
  }

  return results;
}
