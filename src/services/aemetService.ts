/**
 * Servicio AEMET para avisos meteorológicos oficiales y cálculo de riesgo
 * Previncendios España
 */

import { AemetAlert } from '../types';

const AEMET_API_KEY = import.meta.env.VITE_AEMET_API_KEY as string | undefined;

export interface WeatherData {
  municipalityId: string;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmH: number;
  windDirection: string;
  fireRiskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto' | 'Extremo';
  forecast3Days: {
    day: string;
    maxTemp: number;
    risk: 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto' | 'Extremo';
  }[];
}

export const mockAemetData: Record<string, WeatherData> = {
  muni_el_tiemblo: {
    municipalityId: 'muni_el_tiemblo',
    temperatureC: 38.5,
    humidityPercent: 18,
    windSpeedKmH: 28,
    windDirection: 'SO (Suroeste)',
    fireRiskLevel: 'Extremo',
    forecast3Days: [
      { day: 'Hoy', maxTemp: 38.5, risk: 'Extremo' },
      { day: 'Mañana', maxTemp: 39.0, risk: 'Extremo' },
      { day: 'Jueves', maxTemp: 36.2, risk: 'Muy Alto' },
    ],
  },
  muni_cebreros: {
    municipalityId: 'muni_cebreros',
    temperatureC: 37.8,
    humidityPercent: 21,
    windSpeedKmH: 24,
    windDirection: 'O (Oeste)',
    fireRiskLevel: 'Muy Alto',
    forecast3Days: [
      { day: 'Hoy', maxTemp: 37.8, risk: 'Muy Alto' },
      { day: 'Mañana', maxTemp: 38.2, risk: 'Extremo' },
      { day: 'Jueves', maxTemp: 35.5, risk: 'Alto' },
    ],
  },
  muni_ronda: {
    municipalityId: 'muni_ronda',
    temperatureC: 41.2,
    humidityPercent: 14,
    windSpeedKmH: 32,
    windDirection: 'S (Terral)',
    fireRiskLevel: 'Extremo',
    forecast3Days: [
      { day: 'Hoy', maxTemp: 41.2, risk: 'Extremo' },
      { day: 'Mañana', maxTemp: 40.5, risk: 'Extremo' },
      { day: 'Jueves', maxTemp: 37.0, risk: 'Muy Alto' },
    ],
  },
  muni_cazorla: {
    municipalityId: 'muni_cazorla',
    temperatureC: 36.4,
    humidityPercent: 25,
    windSpeedKmH: 18,
    windDirection: 'SE (Sudeste)',
    fireRiskLevel: 'Alto',
    forecast3Days: [
      { day: 'Hoy', maxTemp: 36.4, risk: 'Alto' },
      { day: 'Mañana', maxTemp: 37.0, risk: 'Muy Alto' },
      { day: 'Jueves', maxTemp: 34.0, risk: 'Moderado' },
    ],
  },
};

async function aemetFetch(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

let aemetMunicipiosCache: { name: string; id: string }[] | null = null;
let aemetMunicipiosTs = 0;
const AEMET_MUNICIPIOS_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchAemetMunicipioList(): Promise<{ name: string; id: string }[]> {
  if (aemetMunicipiosCache && Date.now() - aemetMunicipiosTs < AEMET_MUNICIPIOS_TTL_MS) {
    return aemetMunicipiosCache;
  }
  if (!AEMET_API_KEY) return [];

  const url = `https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${AEMET_API_KEY}`;
  const res = await aemetFetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const list = Array.isArray(data) ? data.map((m: any) => ({ name: String(m.nombre || ''), id: String(m.id || '') })) : [];
  aemetMunicipiosCache = list;
  aemetMunicipiosTs = Date.now();
  return list;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function findAemetMunicipioCode(municipalityName: string): Promise<string | null> {
  const list = await fetchAemetMunicipioList();
  const target = normalize(municipalityName);
  const exact = list.find((m) => normalize(m.name) === target);
  if (exact) return exact.id;
  const contains = list.find((m) => normalize(m.name).includes(target) || target.includes(normalize(m.name)));
  return contains?.id || null;
}

function aemetCodeToIne(rawId: string): string {
  // AEMET devuelve códigos como 'id28013' o '28013'. El endpoint espera 5 dígitos.
  const cleaned = rawId.replace(/^id/i, '');
  return cleaned.replace(/\D/g, '');
}

function mapAemetRisk(tempC: number, windKmH: number, humidity: number): WeatherData['fireRiskLevel'] {
  const score = tempC * 1.5 + windKmH * 0.8 + (100 - humidity) * 0.4;
  if (score > 120) return 'Extremo';
  if (score > 90) return 'Muy Alto';
  if (score > 60) return 'Alto';
  if (score > 30) return 'Moderado';
  return 'Bajo';
}

const mockAemetAlerts: AemetAlert[] = [
  {
    id: 'aemet-demo-1',
    title: 'Aviso. Nivel amarillo. Temperaturas máximas. Valle del Guadalquivir',
    description: 'Aviso de temperatura máxima de nivel amarillo.',
    link: 'https://www.aemet.es/es/eltiempo/prediccion/avisos',
    pubDate: new Date().toISOString(),
    level: 'amarillo',
    phenomenon: 'Temperaturas máximas',
    area: 'Valle del Guadalquivir',
  },
  {
    id: 'aemet-demo-2',
    title: 'Aviso. Nivel naranja. Riesgo de incendios. Zona norte de Cáceres',
    description: 'Riesgo importante de incendios forestales por altas temperaturas y viento seco.',
    link: 'https://www.aemet.es/es/eltiempo/prediccion/avisos',
    pubDate: new Date().toISOString(),
    level: 'naranja',
    phenomenon: 'Riesgo de incendios',
    area: 'Zona norte de Cáceres',
  },
];

function parseLevelFromTitle(title: string): AemetAlert['level'] {
  const lower = title.toLowerCase();
  if (lower.includes('rojo')) return 'rojo';
  if (lower.includes('naranja')) return 'naranja';
  if (lower.includes('amarillo')) return 'amarillo';
  return 'verde';
}

function getXmlText(node: Element | null, tag: string): string {
  const el = node?.getElementsByTagName(tag)?.[0];
  return el?.textContent?.trim() || '';
}

export async function fetchAemetWeatherData(
  municipalityId: string,
  municipalityName?: string
): Promise<WeatherData> {
  const fallback = mockAemetData[municipalityId] || {
    municipalityId,
    temperatureC: 34.0,
    humidityPercent: 30,
    windSpeedKmH: 15,
    windDirection: 'N (Norte)',
    fireRiskLevel: 'Alto',
    forecast3Days: [
      { day: 'Hoy', maxTemp: 34.0, risk: 'Alto' },
      { day: 'Mañana', maxTemp: 35.0, risk: 'Alto' },
      { day: 'Pasado', maxTemp: 32.0, risk: 'Moderado' },
    ],
  };

  if (!AEMET_API_KEY || !municipalityName) return fallback;

  try {
    const code = await findAemetMunicipioCode(municipalityName);
    if (!code) return fallback;

    const ine = aemetCodeToIne(code);
    const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/horaria/${ine}?api_key=${AEMET_API_KEY}`;
    const res = await aemetFetch(url);
    if (!res.ok) return fallback;

    const data = await res.json();
    const forecastUrl = data?.datos;
    if (!forecastUrl || typeof forecastUrl !== 'string') return fallback;

    const forecastRes = await aemetFetch(forecastUrl);
    if (!forecastRes.ok) return fallback;

    const forecastData = await forecastRes.json();
    const day0 = Array.isArray(forecastData) ? forecastData[0] : null;
    const pred = day0?.prediccion?.dia?.[0];
    if (!pred) return fallback;

    const maxTemp = pred.temperatura?.maxima ?? 34;
    const minTemp = pred.temperatura?.minima ?? 20;
    const hum = pred.humedadRelativa?.maxima ?? 50;
    const wind = pred.viento?.[0]?.velocidad ?? 15;
    const windDir = pred.viento?.[0]?.direccion ?? 'N';

    const risk = mapAemetRisk(Number(maxTemp), Number(wind), Number(hum));

    const forecast3Days = (day0?.prediccion?.dia || [])
      .slice(0, 3)
      .map((d: any, i: number) => ({
        day: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : 'Pasado',
        maxTemp: Number(d.temperatura?.maxima ?? 30),
        risk: mapAemetRisk(
          Number(d.temperatura?.maxima ?? 30),
          Number(d.viento?.[0]?.velocidad ?? 15),
          Number(d.humedadRelativa?.maxima ?? 50)
        ),
      }));

    return {
      municipalityId,
      temperatureC: Math.round(Number(maxTemp)),
      humidityPercent: Math.round(Number(hum)),
      windSpeedKmH: Math.round(Number(wind)),
      windDirection: String(windDir),
      fireRiskLevel: risk,
      forecast3Days: forecast3Days.length
        ? forecast3Days
        : fallback.forecast3Days,
    };
  } catch (err) {
    console.warn('[AEMET] Error obteniendo datos reales:', err);
    return fallback;
  }
}

export async function fetchAemetAlerts(): Promise<AemetAlert[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    // Si hay API key, preferimos el endpoint oficial de AEMET (sin proxy).
    const feedUrl = AEMET_API_KEY
      ? 'https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAE_wah_RSS.xml'
      : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAE_wah_RSS.xml');
    const res = await fetch(feedUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (!res.ok) return mockAemetAlerts;

    const xmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const items = doc.querySelectorAll('item');

    const alerts: AemetAlert[] = [];
    items.forEach((item) => {
      const title = getXmlText(item, 'title');
      const description = getXmlText(item, 'description');
      const link = getXmlText(item, 'link');
      const pubDate = getXmlText(item, 'pubDate');
      const guid = getXmlText(item, 'guid');
      const level = parseLevelFromTitle(title);

      // Título típico: "Aviso. Nivel amarillo. Temperaturas máximas. Ampurdán"
      const parts = title.split('.').map((p) => p.trim()).filter(Boolean);
      const phenomenon = parts.length > 2 ? parts[2] : '';
      const area = parts.length > 3 ? parts.slice(3).join('. ') : (parts[3] || '');

      if (title) {
        alerts.push({
          id: guid || `aemet-${title}`,
          title,
          description,
          link,
          pubDate,
          level,
          phenomenon,
          area,
        });
      }
    });

    return alerts.length > 0 ? alerts : mockAemetAlerts;
  } catch (err) {
    console.warn('[AEMET] No se pudieron obtener avisos, usando fallback:', err);
    return mockAemetAlerts;
  }
}
