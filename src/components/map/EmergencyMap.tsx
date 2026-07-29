/**
 * Mapa Operativo GPS en Tiempo Real - Previncendios España
 * Utiliza Leaflet con capas de Callejero, Satélite y Relieve
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEmergency } from '../../context/EmergencyContext';
import { EmergencyEvent, SatelliteHotspot, OperationalResource, PatrolLocation } from '../../types';
import { cardinalToDegrees, destinationPoint, getFirmsWmsBaseUrl } from '../../services/fireDetectionEngine';

interface EmergencyMapProps {
  onSelectIncident?: (incident: EmergencyEvent) => void;
  className?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Iconos personalizados con SVG para emergencias
const createCustomMarkerIcon = (colorHex: string, labelSymbol: string, animatePulse: boolean = false) => {
  const pulseHtml = animatePulse
    ? `<span class="absolute -inset-1 rounded-full animate-ping opacity-75" style="background-color: ${colorHex}"></span>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full text-white font-bold shadow-lg border-2 border-white" style="background-color: ${colorHex}">
        ${pulseHtml}
        <span class="relative z-10 text-xs">${labelSymbol}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  onSelectIncident,
  className = 'h-[550px] w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden',
  centerLat = 40.3801,
  centerLng = -4.4395,
  zoom = 9,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const overlayWmsRef = useRef<Record<string, L.TileLayer | null>>({});

  const {
    incidents,
    satelliteHotspots,
    resources,
    patrols,
    mapLayers,
    filters,
    setSelectedIncident,
  } = useEmergency();

  // Filtrado avanzado de puntos calientes
  const confidenceRank: Record<string, number> = { low: 0, nominal: 1, high: 2 };
  const riskRank: Record<string, number> = { Bajo: 0, Moderado: 1, Alto: 2, 'Muy Alto': 3, Extremo: 4 };

  const filteredSatelliteHotspots = satelliteHotspots.filter((spot) => {
    if (filters.satelliteSource !== 'todos') {
      const source = filters.satelliteSource;
      if (source === 'FIRMS') {
        if (spot.satellite === 'GOES-19') return false;
      } else if (source === 'GOES') {
        if (spot.satellite !== 'GOES-19') return false;
      } else if (source === 'SEVIRI') {
        if (spot.satellite !== 'SEVIRI-MSG') return false;
      } else if (source === 'Sentinel-3') {
        if (spot.satellite !== 'Sentinel-3') return false;
      } else if (['MODIS', 'VIIRS', 'NOAA-20', 'NOAA-21'].includes(source)) {
        if (!spot.satellite?.toUpperCase().includes(source)) return false;
      }
    }

    if (filters.riskLevel !== 'todos' && spot.riskLevel !== filters.riskLevel) return false;
    if (filters.minConfidence !== 'todos' && (confidenceRank[spot.confidence] ?? 0) < (confidenceRank[filters.minConfidence] ?? 0)) return false;
    if (filters.minFrp > 0 && (spot.frp || 0) < filters.minFrp) return false;
    if (filters.showOnlyConfirmed && !spot.seviriConfirmed && !spot.riskLevel?.includes('Alto')) return false;

    if (filters.timeWindow !== 'todos') {
      const acq = new Date(`${spot.acqDate}T${spot.acqTime?.slice(0, 2) || '00'}:${spot.acqTime?.slice(2, 4) || '00'}:00Z`);
      const now = new Date();
      const hours = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 }[filters.timeWindow] || 0;
      if (now.getTime() - acq.getTime() > hours * 60 * 60 * 1000) return false;
    }

    return true;
  });

  // Filtrado de incidencias
  const filteredIncidents = incidents.filter((inc) => {
    if (filters.municipalityId !== 'todas' && inc.municipalityId !== filters.municipalityId) return false;
    if (filters.province !== 'todas' && inc.province !== filters.province) return false;
    if (filters.incidentType !== 'todos' && inc.type !== filters.incidentType) return false;
    if (filters.severity !== 'todas' && inc.severity !== filters.severity) return false;
    if (filters.status !== 'todos' && inc.status !== filters.status) return false;
    if (
      filters.searchTerm &&
      !inc.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
      !inc.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Inicialización del Mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoom,
        zoomControl: true,
        renderer: L.canvas(),
      });

      // Capa base predeterminada (Callejero OpenStreetMap)
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      });

      streetLayer.addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Actualizar Capa Base (Callejero vs Satélite vs Relieve) + capa WMS FIRMS opcional
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }
    Object.keys(overlayWmsRef.current).forEach((key) => {
      const layer = overlayWmsRef.current[key];
      if (layer) {
        map.removeLayer(layer);
        overlayWmsRef.current[key] = null;
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; OpenStreetMap';

    if (mapLayers.tileLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Imagery';
    } else if (mapLayers.tileLayer === 'terrain') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenTopoMap';
    }

    baseLayerRef.current = L.tileLayer(tileUrl, { attribution, maxZoom: 18 }).addTo(map);

    const overlayConfigs: Record<string, { url: string; options: L.WMSOptions }> = {};

    const firmsWmsUrl = getFirmsWmsBaseUrl();
    if (mapLayers.showFirmsWms && firmsWmsUrl) {
      overlayConfigs.firms = {
        url: firmsWmsUrl,
        options: {
          layers: 'fires_viirs_24,fires_modis_24',
          format: 'image/png',
          transparent: true,
          opacity: 0.85,
          version: '1.1.1',
        },
      };
    }

    if (mapLayers.showEffisWms) {
      overlayConfigs.effis = {
        url: 'https://maps.effis.emergency.copernicus.eu/effis',
        options: {
          layers: 'viirs.hs,modis.hs',
          format: 'image/png',
          transparent: true,
          opacity: 0.9,
          version: '1.3.0',
        },
      };
    }

    if (mapLayers.showSeviriWms) {
      overlayConfigs.seviri = {
        url: 'https://adaguc.lsasvcs.ipma.pt/adagucserver',
        options: {
          layers: 'FRP',
          styles: 'pointdata/point',
          format: 'image/png',
          transparent: true,
          opacity: 0.8,
          version: '1.3.0',
          DATASET: 'MSG-FRP',
        } as L.WMSOptions,
      };
    }

    if (mapLayers.showEffisFwiWms) {
      overlayConfigs.effisFwi = {
        url: 'https://maps.effis.emergency.copernicus.eu/effis',
        options: {
          layers: 'fwi',
          format: 'image/png',
          transparent: true,
          opacity: 0.6,
          version: '1.3.0',
        },
      };
    }

    if (mapLayers.showIgnCatastroWms) {
      overlayConfigs.ignCatastro = {
        url: 'https://www.ign.es/wms-inspire/catastro',
        options: {
          layers: 'BU.Building',
          format: 'image/png',
          transparent: true,
          opacity: 0.6,
          version: '1.3.0',
        },
      };
    }

    if (mapLayers.showAemetPrecipitationWms) {
      overlayConfigs.aemetPrecip = {
        url: 'https://maps.effis.emergency.copernicus.eu/effis',
        options: {
          layers: 'precipitation',
          format: 'image/png',
          transparent: true,
          opacity: 0.7,
          version: '1.3.0',
        },
      };
    }

    if (mapLayers.showEumetviewWms) {
      overlayConfigs.eumetview = {
        url: 'https://view.eumetsat.int/geoserver/wms',
        options: {
          layers: 'EO:EUM:DAT:MSG:HRSEVIRI',
          format: 'image/png',
          transparent: true,
          opacity: 0.7,
          version: '1.3.0',
        },
      };
    }

    if (mapLayers.showSentinel3Wms) {
      overlayConfigs.sentinel3 = {
        url: 'https://view.eumetsat.int/geoserver/ows',
        options: {
          layers: 'copernicus:sentinel3a_slstr_level2_frp',
          format: 'image/png',
          transparent: true,
          opacity: 0.9,
          version: '1.3.0',
        },
      };
    }

    Object.entries(overlayConfigs).forEach(([key, { url, options }]) => {
      overlayWmsRef.current[key] = L.tileLayer.wms(url, options).addTo(map);
    });
  }, [
    mapLayers.tileLayer,
    mapLayers.showFirmsWms,
    mapLayers.showEffisWms,
    mapLayers.showSeviriWms,
    mapLayers.showEffisFwiWms,
    mapLayers.showIgnCatastroWms,
    mapLayers.showAemetPrecipitationWms,
    mapLayers.showEumetviewWms,
    mapLayers.showSentinel3Wms,
  ]);

  // Dibujar Marcadores y Capas
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. DIBUJAR INCIDENCIAS
    if (mapLayers.showIncidents) {
      filteredIncidents.forEach((inc) => {
        let color = '#ef4444'; // Red
        let isPulse = false;

        if (inc.severity === 'Nivel 3' || inc.severity === 'Nivel 2') {
          color = '#dc2626'; // Dark Red
          isPulse = true;
        } else if (inc.severity === 'Nivel 1') {
          color = '#f97316'; // Orange
        } else if (inc.status === 'extinguido' || inc.status === 'falsa_alarma') {
          color = '#6b7280'; // Grey
        }

        const icon = createCustomMarkerIcon(color, '🔥', isPulse);
        const marker = L.marker([inc.latitude, inc.longitude], { icon });

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 text-slate-900';
        popupContent.innerHTML = `
          <div style="min-width: 220px">
            <span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
              ${inc.severity} • ${inc.status.toUpperCase()}
            </span>
            <h4 style="font-weight: 800; font-size: 14px; margin-top: 6px; margin-bottom: 2px;">${inc.title}</h4>
            <p style="font-size: 11px; color: #4b5563; margin-bottom: 8px;">📍 ${inc.locationDescription}</p>
            <p style="font-size: 11px; color: #1f2937; margin-bottom: 8px; line-clamp: 2;">${inc.description}</p>
            <div style="display: flex; gap: 8px;">
              <button style="flex: 1; background-color: #dc2626; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; border: none;">
                Ver Ficha
              </button>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=${inc.latitude},${inc.longitude}&travelmode=driving"
                target="_blank"
                rel="noopener noreferrer"
                style="flex: 1; background-color: #2563eb; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; text-decoration: none; text-align: center; display: inline-block;"
              >
                Cómo llegar
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const btn = popupContent.querySelector('button');
          if (btn) {
            btn.onclick = () => {
              setSelectedIncident(inc);
              if (onSelectIncident) onSelectIncident(inc);
            };
          }
        });

        markersLayer.addLayer(marker);
      });
    }

    // 2. DIBUJAR PUNTOS CALIENTES SATELITALES NASA FIRMS
    if (mapLayers.showSatelliteFirms) {
      filteredSatelliteHotspots.forEach((spot) => {
        const markerColor =
          spot.riskLevel === 'Extremo' || spot.riskLevel === 'Muy Alto'
            ? '#dc2626'
            : spot.riskLevel === 'Alto'
            ? '#f97316'
            : spot.riskLevel === 'Moderado'
            ? '#eab308'
            : '#6b7280';
        const radius = Math.max(4, Math.min(18, (spot.frp || 1) * 0.6 + 4));
        const marker = L.circleMarker([spot.latitude, spot.longitude], {
          radius,
          color: '#ffffff',
          weight: 1,
          opacity: 0.9,
          fillColor: markerColor,
          fillOpacity: 0.85,
        });

        const riskColor = markerColor;

        marker.bindPopup(`
          <div style="min-width: 240px; max-width: 320px;">
            <span style="background-color: ${riskColor}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">
              ${spot.satellite} · FRP ${spot.frp} MW
            </span>
            <h4 style="font-weight: 700; font-size: 13px; margin-top: 6px;">Anomalía Térmica FIRMS</h4>
            <p style="font-size: 11px; color: #4b5563; margin: 2px 0;"><b>Municipio:</b> ${spot.municipalityName}</p>
            <p style="font-size: 11px; color: #4b5563; margin: 2px 0;"><b>Brillo:</b> ${spot.brightness || '-'} K · <b>Confianza:</b> ${spot.confidence}</p>
            ${
              typeof spot.seviriFRP === 'number' && spot.seviriFRP > 0
                ? `<p style="font-size: 11px; color: #b45309; margin: 2px 0;"><b>SEVIRI FRP:</b> ${spot.seviriFRP.toFixed(1)} MW (confianza ${spot.seviriConfidence?.toFixed(0) ?? '-'}%)</p>`
                : ''
            }
            <p style="font-size: 10px; color: #6b7280; margin: 2px 0;"><b>Detección:</b> ${spot.acqDate} ${spot.acqTime} UTC${spot.daynight ? ' · ' + spot.daynight : ''}${spot.version ? ' · v' + spot.version : ''}</p>
            ${
              spot.riskLevel
                ? `
            <div style="margin-top: 8px; padding: 8px; background-color: #fefce8; border-radius: 6px;">
              <p style="font-size: 11px; color: ${riskColor}; font-weight: bold;">Riesgo: ${spot.riskLevel}</p>
              <p style="font-size: 11px; color: #4b5563; margin: 2px 0;"><b>Propagación:</b> ${spot.spreadDirection || '-'} a ${spot.spreadSpeedKmH || 0} km/h</p>
              <p style="font-size: 11px; color: #4b5563; margin: 2px 0;"><b>Área estimada:</b> ${spot.affectedAreaHectares || 0} ha</p>
              <p style="font-size: 10px; color: #6b7280; margin: 2px 0;"><b>Clima:</b> ${spot.temperatureC || '-'}ºC · HR ${spot.humidityPercent || '-'}% · viento ${spot.windDirection || '-'} ${spot.windSpeedKmH || 0} km/h${spot.windGustKmH ? ' (ráfagas ' + spot.windGustKmH + ')' : ''}${spot.precipitationMm ? ' · lluvia ' + spot.precipitationMm + 'mm' : ''}${typeof spot.airQualityIndex === 'number' && spot.airQualityIndex >= 0 ? ' · Aire AQI ' + spot.airQualityIndex + ' (PM2.5 ' + (spot.pm2_5 ? Math.round(spot.pm2_5) : '-') + ')' : ''}</p>
              <p style="font-size: 10px; color: #4b5563; margin-top: 4px; font-style: italic;">${spot.reasoning || ''}</p>
            </div>`
                : ''
            }
          </div>
        `);

        markersLayer.addLayer(marker);

        // Dibujar vector de propagación del fuego basado en viento y análisis de IA
        if (spot.spreadDirection && spot.spreadSpeedKmH) {
          const distanceKm = Math.max(0.5, spot.spreadSpeedKmH * 1.5);
          const bearing = cardinalToDegrees(spot.spreadDirection);
          const end = destinationPoint(spot.latitude, spot.longitude, distanceKm, bearing);
          const start = [spot.latitude, spot.longitude] as [number, number];
          const endPoint = [end.latitude, end.longitude] as [number, number];

          const spreadLine = L.polyline([start, endPoint], {
            color: riskColor,
            weight: 3,
            opacity: 0.85,
            dashArray: '6, 6',
          });
          markersLayer.addLayer(spreadLine);

          const arrowHead = L.circleMarker(endPoint, {
            radius: 4,
            fillColor: riskColor,
            color: '#ffffff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9,
          });
          markersLayer.addLayer(arrowHead);
        }
      });
    }

    // 3. DIBUJAR RECURSOS OPERATIVOS (Autobombas, Puntos de Agua)
    if (mapLayers.showResources) {
      resources.forEach((res) => {
        let symbol = '🚒';
        let color = '#2563eb'; // Blue

        if (res.category === 'punto_agua') {
          symbol = '💧';
          color = '#0284c7';
        } else if (res.category === 'refugio_albergue') {
          symbol = '⛺';
          color = '#059669';
        } else if (res.category === 'dron') {
          symbol = '🛸';
          color = '#7c3aed';
        }

        const icon = createCustomMarkerIcon(color, symbol);
        const marker = L.marker([res.latitude, res.longitude], { icon });

        marker.bindPopup(`
          <div style="min-width: 200px">
            <span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">
              ${res.category.toUpperCase()} • ${res.status.toUpperCase()}
            </span>
            <h4 style="font-weight: 700; font-size: 13px; margin-top: 6px;">${res.name}</h4>
            <p style="font-size: 11px; color: #4b5563;">Ayuntamiento: ${res.municipalityName}</p>
            <p style="font-size: 11px; color: #4b5563;">Capacidad: ${res.capacityOrQuantity}</p>
            <p style="font-size: 11px; color: #2563eb; font-weight: bold; margin-top: 4px;">📞 ${res.contactPerson} (${res.contactPhone})</p>
          </div>
        `);

        markersLayer.addLayer(marker);
      });
    }

    // 4. DIBUJAR PATRULLAS Y VOLUNTARIOS GEOLOCALIZADOS
    if (mapLayers.showPatrols) {
      patrols.forEach((pat) => {
        const icon = createCustomMarkerIcon('#10b981', '🚓');
        const marker = L.marker([pat.latitude, pat.longitude], { icon });

        marker.bindPopup(`
          <div style="min-width: 200px">
            <span style="background-color: #10b981; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">
              PATRULLA EN VIVO GPS
            </span>
            <h4 style="font-weight: 700; font-size: 13px; margin-top: 6px;">${pat.userName}</h4>
            <p style="font-size: 11px; color: #4b5563;">Velocidad: ${pat.speedKmH || 0} km/h</p>
            <p style="font-size: 11px; color: #4b5563;">Estado: ${pat.statusNote || 'En movimiento'}</p>
          </div>
        `);

        markersLayer.addLayer(marker);
      });
    }
  }, [
    filteredIncidents,
    satelliteHotspots,
    resources,
    patrols,
    mapLayers,
    getFirmsWmsBaseUrl,
  ]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />
    </div>
  );
};
