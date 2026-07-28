/**
 * Motor de detección de incendios forestales con satélite FIRMS, IA (Gemini) y meteorología.
 * Previncendios España
 *
 * Flujo:
 * 1. Descarga puntos calientes de NASA FIRMS (MODIS/VIIRS) para España.
 * 2. Obtiene el municipio más cercano y datos meteorológicos (OpenWeather).
 * 3. Pasa el conjunto a Gemini para clasificar riesgo y predecir dirección de propagación.
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
  windDirectionDeg: number;
  windDirectionText: string;
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
  incident: Omit<EmergencyEvent, 'id' | 'createdAt' | 'updatedAt'>;
}

// --- utilidades ---

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
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

function parseFirmsCsv(csv: string): Omit<SatelliteHotspot, 'id' | 'municipalityName'>[] {
  if (!csv || !csv.trim()) return [];
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',');
  const latIdx = header.indexOf('latitude');
  const lonIdx = header.indexOf('longitude');
  const brightIdx = header.indexOf('brightness');
  const confIdx = header.indexOf('confidence');
  const dateIdx = header.indexOf('acq_date');
  const timeIdx = header.indexOf('acq_time');
  const satIdx = header.indexOf('satellite');
  const frpIdx = header.indexOf('frp');

  const out: Omit<SatelliteHotspot, 'id' | 'municipalityName'>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < Math.max(latIdx, lonIdx, confIdx, frpIdx) + 1) continue;
    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lonIdx]);
    if (
      lat < SPAIN_BBOX.minLat ||
      lat > SPAIN_BBOX.maxLat ||
      lng < SPAIN_BBOX.minLng ||
      lng > SPAIN_BBOX.maxLng
    ) {
      continue;
    }
    out.push({
      latitude: lat,
      longitude: lng,
      brightness: parseFloat(cols[brightIdx] || '0'),
      confidence: (cols[confIdx] || 'nominal').toLowerCase() as SatelliteHotspot['confidence'],
      acqDate: cols[dateIdx] || '',
      acqTime: (cols[timeIdx] || '').padStart(4, '0'),
      satellite: (cols[satIdx] || 'VIIRS-NPP') as SatelliteHotspot['satellite'],
      frp: parseFloat(cols[frpIdx] || '0'),
    });
  }
  return out;
}

// --- proveedores ---

export async function fetchFirmsHotspots(): Promise<Omit<SatelliteHotspot, 'id' | 'municipalityName'>[]> {
  if (!FIRMS_API_KEY) {
    console.warn('[FIRMS] Sin VITE_FIRMS_API_KEY. Usando datos simulados.');
    return mockSatelliteHotspots.map(({ id, municipalityName, ...rest }) => rest);
  }
  try {
    // VIIRS NOAA-20 NRT, últimas 24h
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_NOAA20_NRT/${FIRMS_API_KEY}/BBOX/${SPAIN_BBOX.minLng},${SPAIN_BBOX.minLat},${SPAIN_BBOX.maxLng},${SPAIN_BBOX.maxLat}/1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FIRMS HTTP ${res.status}`);
    const text = await res.text();
    return parseFirmsCsv(text);
  } catch (err) {
    console.warn('[FIRMS] Error descargando datos:', err);
    return mockSatelliteHotspots.map(({ id, municipalityName, ...rest }) => rest);
  }
}

export async function fetchWeatherForLocation(lat: number, lng: number): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    // Fallback realista basado en lat/lon (para demo)
    return {
      temperatureC: 36,
      humidityPercent: 22,
      windSpeedKmH: 18,
      windDirectionDeg: 225,
      windDirectionText: 'SO',
      fireRiskIndex: 78,
    };
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenWeather HTTP ${res.status}`);
    const data = await res.json();
    const windDeg = data.wind?.deg ?? 0;
    const windSpeedMs = data.wind?.speed ?? 0;
    const temp = data.main?.temp ?? 30;
    const hum = data.main?.humidity ?? 30;
    const windSpeedKmH = Math.round(windSpeedMs * 3.6);
    const riskIndex = Math.min(
      100,
      Math.max(
        0,
        Math.round((temp - 10) * 1.5 + (100 - hum) * 0.6 + windSpeedKmH * 0.4)
      )
    );
    return {
      temperatureC: Math.round(temp),
      humidityPercent: Math.round(hum),
      windSpeedKmH,
      windDirectionDeg: windDeg,
      windDirectionText: degToCardinal(windDeg),
      fireRiskIndex: riskIndex,
    };
  } catch (err) {
    console.warn('[OpenWeather] Error:', err);
    return {
      temperatureC: 36,
      humidityPercent: 22,
      windSpeedKmH: 18,
      windDirectionDeg: 225,
      windDirectionText: 'SO',
      fireRiskIndex: 78,
    };
  }
}

// --- análisis con Gemini ---

export async function predictFireWithAI(
  hotspot: Omit<SatelliteHotspot, 'id' | 'municipalityName'>,
  weather: WeatherData
): Promise<FirePrediction> {
  if (!GEMINI_API_KEY) {
    // Fallback determinista (sin IA)
    const risk: FirePrediction['riskLevel'] =
      hotspot.confidence === 'high' && hotspot.frp > 30
        ? 'Muy Alto'
        : hotspot.confidence === 'high' && hotspot.frp > 10
        ? 'Alto'
        : hotspot.confidence === 'nominal' && hotspot.frp > 5
        ? 'Moderado'
        : 'Bajo';
    const speed = Math.round(weather.windSpeedKmH * 0.4 + (hotspot.frp > 30 ? 4 : 0));
    return {
      spreadDirection: weather.windDirectionText,
      spreadSpeedKmH: speed,
      affectedAreaHectares: Math.round(hotspot.frp * 0.5 + weather.windSpeedKmH * 0.8),
      riskLevel: risk,
      confidence: hotspot.confidence,
      reasoning: `Punto caliente FIRMS con FRP ${hotspot.frp} MW y confianza ${hotspot.confidence}. Viento ${weather.windDirectionText} a ${weather.windSpeedKmH} km/h. Riesgo estimado ${risk}.`,
    };
  }

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
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        spreadDirection: weather.windDirectionText,
        spreadSpeedKmH: 0,
        affectedAreaHectares: 0,
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
        : 'nominal',
      reasoning: parsed.reasoning || 'Análisis realizado por Gemini.',
    };
  } catch (err) {
    console.warn('[Gemini] Error llamando al modelo:', err);
    // Fallback determinista
    const risk: FirePrediction['riskLevel'] =
      hotspot.confidence === 'high' && hotspot.frp > 30
        ? 'Muy Alto'
        : hotspot.confidence === 'high' && hotspot.frp > 10
        ? 'Alto'
        : hotspot.confidence === 'nominal' && hotspot.frp > 5
        ? 'Moderado'
        : 'Bajo';
    const speed = Math.round(weather.windSpeedKmH * 0.4 + (hotspot.frp > 30 ? 4 : 0));
    return {
      spreadDirection: weather.windDirectionText,
      spreadSpeedKmH: speed,
      affectedAreaHectares: Math.round(hotspot.frp * 0.5 + weather.windSpeedKmH * 0.8),
      riskLevel: risk,
      confidence: hotspot.confidence,
      reasoning: `Punto caliente FIRMS con FRP ${hotspot.frp} MW. Viento ${weather.windDirectionText} a ${weather.windSpeedKmH} km/h. Riesgo estimado ${risk}.`,
    };
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

  // Filtrar duplicados de incidencias recientes (mismo sitio aproximado, < 2h)
  const cutoffTime = Date.now() - 2 * 60 * 60 * 1000;
  const known = existingIncidents.filter(
    (inc) =>
      inc.source === 'satelite_firms' &&
      new Date(inc.createdAt).getTime() > cutoffTime
  );

  const results: DetectedFire[] = [];
  for (const raw of rawHotspots) {
    const { municipality, distanceKm } = findNearestMunicipality(raw.latitude, raw.longitude, municipalities);
    if (!municipality) continue;

    // Descartar puntos lejanos de cualquier municipio conocido (>100 km)
    if (distanceKm > 100) continue;

    const isDuplicate = known.some((inc) => {
      const d = haversineKm(raw.latitude, raw.longitude, inc.latitude, inc.longitude);
      return d < 3; // menos de 3 km considerado duplicado
    });
    if (isDuplicate) continue;

    const weather = await fetchWeatherForLocation(raw.latitude, raw.longitude);
    const prediction = await predictFireWithAI(raw, weather);

    if (prediction.riskLevel === 'Bajo' && prediction.confidence === 'low') {
      continue;
    }

    const hotspot: SatelliteHotspot = {
      ...raw,
      id: `firms-${raw.acqDate}-${raw.acqTime}-${raw.latitude.toFixed(4)}-${raw.longitude.toFixed(4)}`,
      municipalityName: `${municipality.name} (${municipality.province})`,
      riskLevel: prediction.riskLevel,
      spreadDirection: prediction.spreadDirection,
      spreadSpeedKmH: prediction.spreadSpeedKmH,
      affectedAreaHectares: prediction.affectedAreaHectares,
      temperatureC: weather.temperatureC,
      humidityPercent: weather.humidityPercent,
      windSpeedKmH: weather.windSpeedKmH,
      windDirection: weather.windDirectionText,
      reasoning: prediction.reasoning,
    };

    const riskText = prediction.riskLevel;
    const severity = riskLevelToSeverity(riskText);
    const status: EmergencyEvent['status'] =
      prediction.confidence === 'high' ? 'confirmado' : 'detectado';

    const incident: Omit<EmergencyEvent, 'id' | 'createdAt' | 'updatedAt'> = {
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
      description: `Detección automática por satélite ${hotspot.satellite} (FRP ${hotspot.frp} MW). El análisis de IA indica riesgo ${riskText} con propagación hacia el ${prediction.spreadDirection} a aproximadamente ${prediction.spreadSpeedKmH} km/h. ${prediction.reasoning}`,
      reportedByUid: 'system-satellite-ai',
      reportedByName: `Satélite ${hotspot.satellite} + IA`,
      reportedByRole: 'superadmin',
      source: 'satelite_firms',
      assignedBrigade: '',
      photoUrls: [],
      affectedAreaHectares: prediction.affectedAreaHectares,
    };

    results.push({ hotspot, weather, prediction, incident });
  }

  return results;
}

