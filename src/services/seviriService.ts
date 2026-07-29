/**
 * Servicio SEVIRI FRP (Fire Radiative Power) vía LSA SAF WMS
 * Previncendios España
 *
 * Consume el WMS de LSA SAF (IPMA) del producto MSG/SEVIRI FRP-PIXEL
 * para enriquecer focos FIRMS con FRP, confianza y tamaño de píxel.
 * Resolución: ~3 km, actualización cada 15 min.
 *
 * No requiere autenticación: el WMS de LSA SAF es público.
 */

export interface SeviriFRPData {
  lat: number;
  lng: number;
  frp: number; // MW
  fireConfidence: number; // %
  frpUncertainty: number; // MW
  pixelSize: number; // km²
  obsTime: string; // ISO 8601
  productTime: string; // ISO 8601 de la pasada SEVIRI usada
}

const LSA_WMS_BASE = 'https://adaguc.lsasvcs.ipma.pt/adagucserver';
const LSA_WMS_TIMEOUT_MS = 15000;
const SEVIRI_PIXEL_SIZE_KM2 = 9; // ~3 km x 3 km

function toIsoZ(d: Date): string {
  return d.toISOString().split('.')[0] + 'Z';
}

function roundTimeTo15Min(d: Date): Date {
  const ms = d.getTime();
  const min = 15 * 60 * 1000;
  return new Date(Math.floor(ms / min) * min);
}

function buildGetFeatureInfoUrl(
  lat: number,
  lng: number,
  productTime?: string
): string {
  // WMS 1.3.0 EPSG:4326: bbox es minY,minX,maxY,maxX
  const delta = 0.05;
  const miny = lat - delta;
  const minx = lng - delta;
  const maxy = lat + delta;
  const maxx = lng + delta;
  const width = 256;
  const height = 256;
  const i = Math.round(width / 2);
  const j = Math.round(height / 2);

  const time = productTime ?? toIsoZ(roundTimeTo15Min(new Date()));

  const params = new URLSearchParams({
    DATASET: 'MSG-FRP',
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    LAYERS: 'FRP',
    QUERY_LAYERS: 'FRP',
    STYLES: 'pointdata/point',
    CRS: 'EPSG:4326',
    BBOX: `${miny},${minx},${maxy},${maxx}`,
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
    I: i.toString(),
    J: j.toString(),
    INFO_FORMAT: 'application/json',
    TIME: time,
  });

  return `${LSA_WMS_BASE}?${params.toString()}`;
}

interface SeviriResponseItem {
  name?: string;
  data?: Record<string, string | number>;
}

function parseSeviriResponse(
  json: { value?: SeviriResponseItem[] },
  lat: number,
  lng: number
): SeviriFRPData | null {
  const items = Array.isArray(json.value) ? json.value : [];

  const get = (name: string): string | number | undefined => {
    const item = items.find((i) => i.name === name);
    if (!item?.data) return undefined;
    const times = Object.keys(item.data);
    // Tomar el último instante con dato real
    for (let t = times.length - 1; t >= 0; t--) {
      const v = item.data[times[t]];
      if (v !== 'nodata' && v !== 'None' && v !== '') {
        return v as string | number;
      }
    }
    return undefined;
  };

  const productTime = (() => {
    const item = items.find((i) => i.name === 'frp' || i.name === 'fire_confidence');
    if (!item?.data) return toIsoZ(roundTimeTo15Min(new Date()));
    const times = Object.keys(item.data);
    return times[times.length - 1] ?? toIsoZ(roundTimeTo15Min(new Date()));
  })();

  const frpRaw = get('frp');
  const confRaw = get('fire_confidence');

  if (frpRaw === undefined || confRaw === undefined) return null;

  const frp = typeof frpRaw === 'number' ? frpRaw : parseFloat(frpRaw);
  const fireConfidence =
    typeof confRaw === 'number' ? confRaw : parseFloat(confRaw);

  if (Number.isNaN(frp) || Number.isNaN(fireConfidence)) return null;

  const uncRaw = get('frp_uncertainty');
  const unc = typeof uncRaw === 'number' ? uncRaw : parseFloat(uncRaw ?? '0');

  const obsRaw = get('obs_time');
  const obsTime =
    typeof obsRaw === 'string'
      ? new Date(obsRaw).toISOString()
      : toIsoZ(roundTimeTo15Min(new Date()));

  return {
    lat,
    lng,
    frp,
    fireConfidence,
    frpUncertainty: Number.isNaN(unc) ? 0 : unc,
    pixelSize: SEVIRI_PIXEL_SIZE_KM2,
    obsTime,
    productTime,
  };
}

async function wmsFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LSA_WMS_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Consulta el FRP SEVIRI para un punto dado.
 * Si no hay dato o es 'nodata', devuelve null.
 */
export async function getSeviriFRP(
  lat: number,
  lng: number,
  productTime?: string
): Promise<SeviriFRPData | null> {
  if (
    lat < 18 ||
    lat > 50 ||
    lng < -20 ||
    lng > 20
  ) {
    return null;
  }

  try {
    const url = buildGetFeatureInfoUrl(lat, lng, productTime);
    const res = await wmsFetch(url);
    if (!res.ok) throw new Error(`SEVIRI WMS HTTP ${res.status}`);

    const json = (await res.json()) as { value?: SeviriResponseItem[] };
    const data = parseSeviriResponse(json, lat, lng);

    if (data) {
      console.log('[SEVIRI] FRP encontrado:', data.frp, 'MW en', lat, lng);
    }

    return data;
  } catch (err) {
    console.warn('[SEVIRI] Error consultando FRP:', err);
    return null;
  }
}
