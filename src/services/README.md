# Módulo de Servicios y Datos (`src/services`)

## Descripción
Provee la capa de integración de APIs externas, simulación de sensores satelitales (NASA FIRMS MODIS/VIIRS) y AEMET, además del conjunto inicial de datos para todo el territorio español.

## Servicios Incluidos
- `firmsSatelliteService.ts`: Simula la recepción de puntos calientes satelitales en tiempo real para incendios en España.
- `aemetService.ts`: Consulta del índice AEMET de riesgo de incendios y variables meteorológicas (temperatura, humedad, dirección y velocidad del viento).
- `mockData.ts`: Conjunto de datos semilla realistas de municipios españoles (El Tiemblo, Cebreros, Ronda, Cazorla, Ourense, Chiva), incidencias activas, alertas de evacuación, brigadas y recursos.
