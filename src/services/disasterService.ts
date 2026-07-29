export interface DisasterEvent {
  id: string;
  type: 'earthquake' | 'flood' | 'storm' | 'tsunami';
  title: string;
  latitude: number;
  longitude: number;
  magnitude?: number;
  depthKm?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pubDate: string;
  url?: string;
  source: 'USGS' | 'GDACS' | 'AEMET' | 'Copernicus';
  description?: string;
}

/**
 * Terremotos recientes en España y alrededores (USGS).
 */
export async function fetchEarthquakesSpain(): Promise<DisasterEvent[]> {
  try {
    const url =
      'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-22&endtime=2026-07-29&minlatitude=35&maxlatitude=44&minlongitude=-10&maxlongitude=5&minmagnitude=2';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`USGS error: ${res.status}`);

    const data = await res.json();
    if (!data?.features || !Array.isArray(data.features)) return [];

    return data.features.map((feature: any): DisasterEvent => {
      const [lng, lat, depth] = feature.geometry.coordinates || [0, 0, 0];
      const props = feature.properties || {};
      const mag = props.mag ?? 0;

      let severity: DisasterEvent['severity'] = 'low';
      if (mag >= 5) severity = 'critical';
      else if (mag >= 4) severity = 'high';
      else if (mag >= 3) severity = 'medium';

      return {
        id: `usgs-${feature.id}`,
        type: 'earthquake',
        title: props.place || 'Terremoto desconocido',
        latitude: lat,
        longitude: lng,
        magnitude: mag,
        depthKm: depth,
        severity,
        pubDate: new Date(props.time).toISOString(),
        url: props.url,
        source: 'USGS',
        description: `Magnitud ${mag} · Profundidad ${Math.round(depth)} km`,
      };
    });
  } catch (err) {
    console.warn('[DisasterService] Error cargando terremotos:', err);
    return [];
  }
}

/**
 * Eventos globales recientes (inundaciones, tormentas) de GDACS.
 */
export async function fetchGdacsEvents(): Promise<DisasterEvent[]> {
  try {
    const url = 'https://www.gdacs.org/xml/rss_24h.xml';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GDACS error: ${res.status}`);

    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    const items = Array.from(xml.querySelectorAll('item'));

    const events: DisasterEvent[] = [];
    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const lat = parseFloat(item.querySelector('geo\:lat')?.textContent || '');
      const lng = parseFloat(item.querySelector('geo\:long')?.textContent || '');
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const category = item.querySelector('category')?.textContent || '';

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const type: DisasterEvent['type'] =
        category.toLowerCase().includes('flood')
          ? 'flood'
          : category.toLowerCase().includes('storm') || category.toLowerCase().includes('tc')
          ? 'storm'
          : category.toLowerCase().includes('tsunami')
          ? 'tsunami'
          : 'flood';

      const severity: DisasterEvent['severity'] = title.toLowerCase().includes('red') ? 'critical' : 'high';

      events.push({
        id: `gdacs-${link.split('/').pop() || Date.now()}-${events.length}`,
        type,
        title,
        latitude: lat,
        longitude: lng,
        severity,
        pubDate: new Date(pubDate).toISOString(),
        url: link,
        source: 'GDACS',
        description: category,
      });
    });

    return events;
  } catch (err) {
    console.warn('[DisasterService] Error cargando GDACS:', err);
    return [];
  }
}
