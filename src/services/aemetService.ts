/**
 * Servicio AEMET para cálculo de riesgo de incendios y condiciones meteorológicas
 * Previncendios España
 */

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
