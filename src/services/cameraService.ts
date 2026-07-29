import { Camera } from '../types';

const LAPALMA_STATIONS_URL =
  'https://bi.lapalma.es/pentaho/plugin/cda/api/doQuery?path=%2Fpublic%2Fsc_lapalma%2Fverticals%2Fsql%2Ffireforest.cda&_TRUST_USER_=opendata_sc_lapalma&dataAccessId=fireforest_stations&outputType=json';

const LAPALMA_LASTDATA_URL =
  'https://bi.lapalma.es/pentaho/plugin/cda/api/doQuery?path=%2Fpublic%2Fsc_lapalma%2Fverticals%2Fsql%2Ffireforest.cda&_TRUST_USER_=opendata_sc_lapalma&dataAccessId=fireforest_lastdata&outputType=json';

interface CdaResponse {
  metadata?: { colName: string; colType: string; colIndex: number }[];
  resultset?: (string | number | boolean)[][];
}

function parsePoint(location: string): { lat: number; lng: number } | null {
  try {
    const parsed = JSON.parse(location);
    if (parsed.type === 'Point' && Array.isArray(parsed.coordinates)) {
      const [lng, lat] = parsed.coordinates;
      return { lat: Number(lat), lng: Number(lng) };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Obtiene cámaras públicas de detección de incendios forestales de La Palma.
 */
export async function fetchLaPalmaCameras(): Promise<Camera[]> {
  try {
    const [stationsRes, lastDataRes] = await Promise.all([
      fetch(LAPALMA_STATIONS_URL),
      fetch(LAPALMA_LASTDATA_URL),
    ]);

    const stations: CdaResponse = await stationsRes.json();
    const lastData: CdaResponse = await lastDataRes.json();

    const statusMap: Record<string, boolean> = {};
    lastData?.resultset?.forEach((row) => {
      const name = String(row[0] ?? '');
      const hasFireAlert = Boolean(row[3] ?? false);
      statusMap[name] = hasFireAlert;
    });

    const cameras: Camera[] = [];
    stations?.resultset?.forEach((row, index) => {
      const name = String(row[0] ?? '');
      const location = String(row[1] ?? '');
      const point = parsePoint(location);
      if (!point) return;

      const hasAlert = statusMap[name] ?? false;
      const id = `lapalma-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${index}`;

      cameras.push({
        id,
        name,
        latitude: point.lat,
        longitude: point.lng,
        source: 'lapalma',
        webUrl: 'https://lapalmasmart-open.lapalma.es/datosabiertos/catalogo/es/dataset/camaras-de-incendios-listado-de-camaras',
        status: hasAlert ? 'alert' : 'active',
        lastUpdate: new Date().toISOString(),
      });
    });

    return cameras;
  } catch (err) {
    console.warn('[CameraService] Error cargando cámaras de La Palma:', err);
    return [];
  }
}

/**
 * Agrega cámaras públicas de otras fuentes futuras.
 */
export async function fetchPublicCameras(): Promise<Camera[]> {
  const [lapalma] = await Promise.all([fetchLaPalmaCameras()]);
  return [...lapalma];
}
