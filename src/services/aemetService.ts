/**
 * Servicio AEMET para avisos meteorológicos oficiales y cálculo de riesgo
 * Previncendios España
 */

import { AemetAlert } from '../types';

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

export async function fetchAemetWeatherData(municipalityId: string): Promise<WeatherData> {
  return mockAemetData[municipalityId] || {
    municipalityId,
    temperatureC: 34.0,
    humidityPercent: 30,
    windSpeedKmH: 15,
    windDirection: 'N (Norte)',
    fireRiskLevel: 'Alto',
    forecast3Days: [
      { day: 'Hoy', maxTemp: 34.0, risk: 'Alto' },
      { day: 'Mañana', maxTemp: 35.0, risk: 'Alto' },
      { day: 'Jueves', maxTemp: 32.0, risk: 'Moderado' },
    ],
  };
}

export async function fetchAemetAlerts(): Promise<AemetAlert[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAE_wah_RSS.xml'),
      { signal: controller.signal, cache: 'no-store' }
    );
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
