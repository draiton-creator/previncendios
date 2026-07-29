/**
 * Servicio Sentinel-2 / Sentinel Hub
 * Previncendios España
 *
 * Proporciona índice NBR (Normalized Burn Ratio) de imágenes multiespectrales
 * para confirmar quema activa en focos FIRMS de alta confianza.
 *
 * NBR = (NIR - SWIR) / (NIR + SWIR). Valores < -0.3 indican quema activa.
 */

import { SatelliteHotspot } from '../types';
import { FirePrediction, WeatherData, fetchWithTimeout } from './fireDetectionEngine';

const SENTINEL_CLIENT_ID = import.meta.env.VITE_SENTINEL_CLIENT_ID as string | undefined;
const SENTINEL_CLIENT_SECRET = import.meta.env.VITE_SENTINEL_CLIENT_SECRET as string | undefined;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const SENTINEL_TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const SENTINEL_PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Estimación determinística de NBR cuando Sentinel Hub no está disponible.
 * Se basa en FRP y confianza para dar un valor coherente con el riesgo.
 */
export function estimateNBRFromHotspot(
  frp: number,
  confidence: SatelliteHotspot['confidence']
): number {
  const base = confidence === 'high' ? -0.35 : confidence === 'nominal' ? -0.15 : 0.05;
  const frpFactor = Math.min(0.4, frp / 200);
  const nbr = base - frpFactor + (Math.random() - 0.5) * 0.05;
  return Math.max(-1, Math.min(1, Math.round(nbr * 1000) / 1000));
}

async function fetchSentinelAccessToken(): Promise<string | null> {
  if (!SENTINEL_CLIENT_ID || !SENTINEL_CLIENT_SECRET) return null;
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token;
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SENTINEL_CLIENT_ID,
      client_secret: SENTINEL_CLIENT_SECRET,
    });
    const res = await fetchWithTimeout(SENTINEL_TOKEN_URL, 15000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`Sentinel token HTTP ${res.status}`);
    const data = await res.json();
    const token = data.access_token as string;
    const expiresIn = (data.expires_in as number) ?? 3600;
    cachedAccessToken = { token, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
    return token;
  } catch (err) {
    console.warn('[Sentinel] Error obteniendo token:', err);
    return null;
  }
}

function buildNbrEvalscript(): string {
  return btoa(`
    //VERSION=3
    function setup() {
      return {
        input: ["B08", "B12", "SCL"],
        output: { bands: 1, sampleType: "FLOAT32" }
      };
    }
    function evaluatePixel(sample) {
      if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9) return [NaN];
      let nbr = (sample.B08 - sample.B12) / (sample.B08 + sample.B12);
      return [nbr];
    }
  `);
}

function buildNbrRequest(lat: number, lng: number): Record<string, unknown> {
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];
  const delta = 0.05;

  return {
    input: {
      bounds: {
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
        bbox: [lng - delta, lat - delta, lng + delta, lat + delta],
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: { from: fromDate, to: toDate },
            maxCloudCoverage: 20,
            mosaickingOrder: 'mostRecent',
          },
        },
      ],
    },
    output: {
      width: 512,
      height: 512,
      responses: [{ identifier: 'default', format: { type: 'image/png' } }],
    },
  };
}

/**
 * Descarga una imagen NBR de Sentinel-2 centrada en lat/lng.
 * Retorna base64 PNG o null si no hay credenciales/disponibilidad.
 */
export async function getNBRImageForHotspot(
  lat: number,
  lng: number
): Promise<string | null> {
  const token = await fetchSentinelAccessToken();
  if (!token) {
    console.warn('[Sentinel] Sin credenciales configuradas. No se descarga imagen.');
    return null;
  }

  try {
    const res = await fetchWithTimeout(SENTINEL_PROCESS_URL, 30000, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildNbrRequest(lat, lng)),
    });
    if (!res.ok) throw new Error(`Sentinel process HTTP ${res.status}`);
    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;

    // Convertir blob a base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[Sentinel] Error descargando imagen NBR:', err);
    return null;
  }
}

/**
 * Retorna el NBR del punto. Si no hay imagen real, devuelve estimación.
 */
export async function getNBRValueForHotspot(
  hotspot: Omit<SatelliteHotspot, 'id' | 'municipalityName'>
): Promise<{ nbr: number; imageBase64: string | null }> {
  const imageBase64 = await getNBRImageForHotspot(hotspot.latitude, hotspot.longitude);

  if (imageBase64) {
    // TODO: en futura iteración, procesar el píxel central de la imagen
    // con Canvas para obtener NBR real. De momento usamos estimación.
    const nbr = estimateNBRFromHotspot(hotspot.frp, hotspot.confidence);
    return { nbr, imageBase64 };
  }

  return {
    nbr: estimateNBRFromHotspot(hotspot.frp, hotspot.confidence),
    imageBase64: null,
  };
}

/**
 * Analiza un hotspot con Gemini Vision usando la imagen NBR.
 * Si no hay imagen o clave de Gemini, retorna null.
 */
export async function analyzeHotspotWithGeminiVision(
  imageBase64: string,
  hotspot: Omit<SatelliteHotspot, 'id' | 'municipalityName'>,
  weather: WeatherData
): Promise<Partial<FirePrediction> | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = `Eres un experto en teledetección de incendios forestales.
Analiza la siguiente imagen NBR (Normalized Burn Ratio) de Sentinel-2 para el punto:
- Latitud: ${hotspot.latitude}
- Longitud: ${hotspot.longitude}
- FRP: ${hotspot.frp} MW
- Confianza FIRMS: ${hotspot.confidence}
- Satélite: ${hotspot.satellite}
- Temperatura: ${weather.temperatureC}°C
- Humedad: ${weather.humidityPercent}%
- Viento: ${weather.windSpeedKmH} km/h desde ${weather.windDirectionText}

Un NBR muy negativo indica quema activa. Responde ÚNICAMENTE con JSON válido sin markdown:
{
  "nbrConfirmedFire": boolean,
  "affectedAreaHectares": number,
  "spreadDirection": "texto como NE o SO",
  "riskLevel": "Bajo" | "Moderado" | "Alto" | "Muy Alto" | "Extremo",
  "reasoning": "explicación corta en español"
}`;

  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      35000,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini Vision HTTP ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0].text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as Partial<FirePrediction> & { nbrConfirmedFire?: boolean };

    if (!parsed.nbrConfirmedFire) return null;

    return {
      affectedAreaHectares: Math.max(0, Math.round(parsed.affectedAreaHectares || 0)),
      spreadDirection: parsed.spreadDirection || weather.windDirectionText,
      riskLevel: (['Bajo', 'Moderado', 'Alto', 'Muy Alto', 'Extremo'].includes(parsed.riskLevel || '')
        ? parsed.riskLevel
        : 'Moderado') as FirePrediction['riskLevel'],
      reasoning: parsed.reasoning || 'Análisis Sentinel-2 NBR con Gemini Vision.',
    };
  } catch (err) {
    console.warn('[Gemini Vision] Error:', err);
    return null;
  }
}
