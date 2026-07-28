/**
 * Servicio de Integración de Detección Satelital FIRMS (NASA MODIS / VIIRS)
 * Previncendios España
 */

import { SatelliteHotspot } from '../types';

export const mockSatelliteHotspots: SatelliteHotspot[] = [
  {
    id: 'firms-001',
    latitude: 40.3842,
    longitude: -4.4328,
    brightness: 338.5,
    confidence: 'high',
    acqDate: '2026-07-28',
    acqTime: '11:42',
    satellite: 'VIIRS-NPP',
    frp: 42.8,
    municipalityName: 'El Tiemblo (Ávila)',
  },
  {
    id: 'firms-002',
    latitude: 40.4512,
    longitude: -4.4619,
    brightness: 312.1,
    confidence: 'nominal',
    acqDate: '2026-07-28',
    acqTime: '11:42',
    satellite: 'Aqua',
    frp: 18.3,
    municipalityName: 'Cebreros (Ávila)',
  },
  {
    id: 'firms-003',
    latitude: 36.7412,
    longitude: -5.1631,
    brightness: 345.0,
    confidence: 'high',
    acqDate: '2026-07-28',
    acqTime: '12:05',
    satellite: 'NOAA-20',
    frp: 65.2,
    municipalityName: 'Ronda (Málaga)',
  },
  {
    id: 'firms-004',
    latitude: 42.3481,
    longitude: -7.8631,
    brightness: 305.4,
    confidence: 'nominal',
    acqDate: '2026-07-28',
    acqTime: '10:15',
    satellite: 'Terra',
    frp: 12.1,
    municipalityName: 'Ourense (Galicia)',
  },
  {
    id: 'firms-005',
    latitude: 37.9125,
    longitude: -2.9984,
    brightness: 328.0,
    confidence: 'high',
    acqDate: '2026-07-28',
    acqTime: '12:20',
    satellite: 'VIIRS-NPP',
    frp: 31.4,
    municipalityName: 'Cazorla (Jaén)',
  },
];

export async function fetchFirmsHotspotsForSpain(): Promise<SatelliteHotspot[]> {
  // Simulación de respuesta de API NASA FIRMS con retardo de red
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSatelliteHotspots);
    }, 400);
  });
}
