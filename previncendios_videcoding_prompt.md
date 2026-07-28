# PROMPT PARA VIDECODING — PREVINCENDIOS ESPAÑA
## Sistema Nacional de Detección y Gestión de Catástrofes
### Versión: OMEGA — Máxima prioridad: salvar vidas humanas, animales y territorio

---

## CONTEXTO DEL PROYECTO

Estás trabajando en **Previncendios España** ([https://previncendios-espana.web.app](https://previncendios-espana.web.app)), un sistema de alerta temprana de catástrofes para toda España. El repositorio está en `github.com/draiton-creator/previncendios`.

Stack actual: **React + TypeScript + Vite + Firebase (Firestore, Auth, Hosting) + Gemini 1.5 Flash + NASA FIRMS + Open-Meteo + OpenWeather**.

El sistema ya tiene:
- `src/services/fireDetectionEngine.ts` — Motor de detección con FIRMS (VIIRS_NOAA20_NRT, VIIRS_SNPP_NRT, MODIS_NRT), Open-Meteo, OpenWeather y Gemini
- `src/services/aemetService.ts` — AEMET conectado
- `src/services/firmsSatelliteService.ts` — Servicio FIRMS base
- `src/types/index.ts` — Tipos: EmergencyEvent, SatelliteHotspot, Municipality, UserProfile, VolunteerProfile, etc.
- `src/services/volunteerProfileService.ts` — Gestión de voluntarios
- Roles: superadmin, ayuntamiento, voluntario, ciudadano, invitado

**OBJETIVO CRÍTICO:** Transformar el sistema en la plataforma de detección más precisa y rápida de España. El objetivo no es solo detectar incendios: es detectar **cualquier catástrofe en minutos**, notificar a ayuntamientos, activar voluntarios y guiar a ciudadanos con instrucciones claras en tiempo real. **Nos van vidas en ello.**

---

## MÓDULO 1: NUEVOS SATÉLITES Y FUENTES DE DETECCIÓN ULTRA-RÁPIDA

### 1.1 Añadir NOAA-21 (VIIRS JPSS-2) al fireDetectionEngine.ts

En el array `FIRMS_SOURCES` de `src/services/fireDetectionEngine.ts`, añadir:

```typescript
const FIRMS_SOURCES = ['VIIRS_NOAA21_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_SNPP_NRT', 'MODIS_NRT'] as const;
```

NOAA-21 es el satélite VIIRS más moderno (JPSS-2, lanzado 2022), con resolución de 375 metros y cobertura de España aproximadamente 3 veces al día. Actualizar también `parseSatellite()` para reconocer `VIIRS_NOAA21_NRT` y mapearlo a `'NOAA-21'`.

### 1.2 Crear `src/services/goesService.ts` — Satélite Geoestacionario GOES-19

Crear un nuevo servicio que consulte GOES-19 (satélite geoestacionario de NOAA sobre el Atlántico) a través de la API de FIRMS para datos de incendios activos con latencia inferior a 10 minutos. GOES es el único satélite que da actualizaciones cada 5-10 minutos sobre España.

```typescript
// src/services/goesService.ts
const GOES_SOURCE = 'GOES_NRT'; // fuente FIRMS para GOES

export async function fetchGoesHotspots(): Promise<Omit<SatelliteHotspot, 'id' | 'municipalityName'>[]> {
  // Usar el mismo FIRMS_API_KEY y SPAIN_AREA que fireDetectionEngine
  // URL: https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/GOES_NRT/{SPAIN_AREA}/1
  // Cache TTL: 8 minutos (vs 15s de polares — GOES actualiza cada ~10 min)
  // Marcar hotspots con satellite: 'GOES-19' y agregar campo isGeostationary: true
  // Si GOES detecta un foco: PRIORIDAD MÁXIMA — latencia < 15 minutos desde el fuego real
}
```

Integrar `fetchGoesHotspots()` en el flujo principal de `detectFires()` en `fireDetectionEngine.ts`. Los focos GOES deben procesarse primero y marcarse con campo `isGeostationary: true` en `SatelliteHotspot` (añadir al type en `src/types/index.ts`).

### 1.3 Crear `src/services/sentinelService.ts` — ESA Sentinel Hub (imágenes multiespectrales)

Sentinel-2 tiene resolución de 10 metros y proporciona los índices más precisos para detectar incendios activos y área quemada. Crear servicio que:

1. Use la API gratuita de **Sentinel Hub** (EOBrowser/Copernicus Data Space Ecosystem) para obtener tiles de índice **NBR (Normalized Burn Ratio)** = `(NIR - SWIR) / (NIR + SWIR)`. Un NBR muy negativo indica quema activa.
2. Use **NDVI** para detectar pérdida súbita de vegetación comparando con la semana anterior.
3. Para cada foco FIRMS con `confidence === 'high'` o `frp > 50`, solicitar automáticamente una imagen Sentinel-2 centrada en esas coordenadas.
4. Pasar la imagen resultante a **Gemini Vision** (gemini-1.5-pro con `inlineData`) para análisis multimodal: confirmar si es fuego activo, estimar perímetro y dirección de propagación.

```typescript
// src/services/sentinelService.ts
const SENTINEL_CLIENT_ID = import.meta.env.VITE_SENTINEL_CLIENT_ID;
const SENTINEL_CLIENT_SECRET = import.meta.env.VITE_SENTINEL_CLIENT_SECRET;

export async function getNBRImageForHotspot(lat: number, lng: number): Promise<string | null> {
  // Retorna base64 de imagen NBR 512x512 px centrada en lat/lng, bbox de ~5km
  // Endpoint: https://sh.dataspace.copernicus.eu/api/v1/process
  // Auth: OAuth2 client_credentials
}

export async function analyzeHotspotWithGeminiVision(
  imageBase64: string,
  hotspot: SatelliteHotspot,
  weather: WeatherData
): Promise<FirePrediction> {
  // Llamar a gemini-1.5-pro con la imagen NBR + datos del hotspot + meteorología
  // Prompt especializado para análisis visual de incendios
}
```

Añadir al `.env.example`:
```
VITE_SENTINEL_CLIENT_ID=
VITE_SENTINEL_CLIENT_SECRET=
```

---

## MÓDULO 2: NUEVAS APIs DE DATOS PARA FUSIÓN MULTI-FUENTE EN GEMINI

### 2.1 Crear `src/services/effisService.ts` — EFFIS Copernicus (Sistema Europeo de Incendios Forestales)

EFFIS es el sistema oficial europeo. Proporciona el **FWI (Fire Weather Index)** diario para toda España, el índice más fiable del mundo para riesgo de incendio.

```typescript
// src/services/effisService.ts

export interface EffisData {
  fwi: number;           // Fire Weather Index (0-100+, >50 = extremo)
  ffmc: number;          // Fine Fuel Moisture Code
  dmc: number;           // Duff Moisture Code  
  dc: number;            // Drought Code
  isi: number;           // Initial Spread Index
  bui: number;           // Build Up Index
  dangerClass: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  date: string;
}

export async function fetchEffisFWI(lat: number, lng: number): Promise<EffisData | null> {
  // WMS endpoint de EFFIS: https://forest-fire.emergency.copernicus.eu/arcgis/services/EFFIS/StatisticsDB/MapServer/WMSServer
  // Usar GetFeatureInfo para obtener FWI puntual
  // Alternativa REST: https://ows.mundialis.de/services/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap (mapa de riesgo)
  // Cache: 6 horas (los datos FWI se actualizan 1 vez/día)
}
```

Integrar `fetchEffisFWI()` en `detectFires()`: para cada hotspot, obtener el FWI de EFFIS y añadirlo al contexto de Gemini. Si FWI > 50, aumentar automáticamente el nivel de riesgo mínimo a "Alto".

### 2.2 Ampliar `src/services/aemetService.ts` — Índice de Peligro de Incendios de AEMET

AEMET proporciona el índice oficial español de peligro meteorológico de incendios (IPMA). Ampliar el servicio existente para:

1. Endpoint `/api/prediccion/especial/incendio/` — obtiene el nivel de peligro por provincia (Bajo/Moderado/Alto/Muy Alto/Extremo) con validez de 24h.
2. Endpoint `/api/observacion/convencional/datos/estacion/{idema}` — datos de estaciones meteorológicas automáticas más cercanas al foco.
3. Endpoint `/api/prediccion/especial/sirena/` — Sistema de Información de Riesgo de Emergencias por Nivel de Alerta (SIRENA). Cuando AEMET activa nivel 3, el sistema debe generar automáticamente un `EmergencyAlert` de severidad `critica`.

Añadir a `SystemSettings` en `src/types/index.ts`:
```typescript
aemetSirenaEnabled: boolean;  // Monitorización SIRENA activa
```

### 2.3 Crear `src/services/copernicusEmergencyService.ts` — CEMS Rapid Mapping

Cuando un incendio supera nivel "Muy Alto", activar consulta a la API de **Copernicus Emergency Management Service** para obtener activaciones recientes cercanas a las coordenadas.

```typescript
// src/services/copernicusEmergencyService.ts
export async function getActiveCEMSActivations(lat: number, lng: number, radiusKm: number = 50) {
  // GET https://emergency.copernicus.eu/mapping/list-of-components/EMSR{code}/feed
  // Filtrar activaciones en España activas en los últimos 30 días
  // Si hay una activación CEMS activa en el radio, marcar el incendio como 'confirmado' automáticamente
}
```

### 2.4 Crear `src/services/igmeService.ts` — Cartografía de Combustibles (CNIG/MITECO)

El tipo de vegetación es el factor más determinante en la velocidad de propagación de un incendio.

```typescript
// src/services/igmeService.ts
export interface VegetationData {
  coverType: string;  // 'Matorral mediterráneo' | 'Pinar' | 'Eucaliptal' | 'Pastizal' | etc.
  fuelModel: number;  // Modelo de combustible NFFL (1-13) — crítico para modelos de propagación
  canopyCoverPercent: number;
  burnabilityIndex: number; // 0-10, 10 = máxima combustibilidad
}

export async function getVegetationDataForPoint(lat: number, lng: number): Promise<VegetationData | null> {
  // WMS del CNIG (MITECO): https://wms.mapama.gob.es/sig/Biodiversidad/UsosYCobertura/wms.aspx
  // Layer: 'Mapa de vegetación de España'
  // Usar GetFeatureInfo para obtener tipo de combustible en el punto exacto del hotspot
  // Cache: 30 días (los usos del suelo no cambian rápido)
}
```

### 2.5 Crear `src/services/inundacionService.ts` — Detección de Inundaciones (SAIH + Copernicus GFM)

Ampliar más allá de incendios. Crear servicio para detectar inundaciones:

```typescript
// src/services/inundacionService.ts

// Copernicus Global Flood Monitoring (GFM) — gratuito, tiempo real
export async function fetchFloodHazardSpain(): Promise<FloodPoint[]> {
  // API: https://global-flood-monitor.org/api/
  // Endpoint: /v1/products/observed_flood_extent?bbox=-9.5,27.6,4.5,43.8
  // Actualización cada 12 horas desde imágenes Sentinel-1 SAR
  // Retorna polígonos de inundación activa en España
}

// SAIH — Sistemas Automáticos de Información Hidrológica (8 confederaciones hidrográficas)
// APIs públicas de cada confederación (Tajo, Ebro, Segura, Guadalquivir, etc.)
export async function fetchSAIHTajoAlerts(): Promise<HydrologicalAlert[]> {
  // https://www.chtajo.es/LaCuenca/Paginas/SAIH.aspx — datos de aforos en tiempo real
  // Cuando nivel río > umbral de alerta, crear EmergencyEvent tipo 'inundacion'
}
```

Añadir a `IncidentType` en `src/types/index.ts`:
```typescript
| 'riada_flash_flood'
| 'deslizamiento'
| 'terremoto'
| 'tsunami_alerta'
| 'ola_calor_extremo'
| 'nevada_extrema'
| 'sequia_emergencia'
```

### 2.6 Crear `src/services/sismoService.ts` — Detección de Terremotos (IGN)

```typescript
// src/services/sismoService.ts
export async function fetchRecentEarthquakesSpain(): Promise<SeismicEvent[]> {
  // API del IGN (Instituto Geográfico Nacional):
  // https://www.ign.es/web/resources/sismologia/tproximos/cat_recent.txt
  // O endpoint JSON: https://www.ign.es/ign/rest/geocatalogo/evento/getRecentEvents
  // Polling cada 5 minutos
  // Si magnitud >= 4.0 en España: crear automáticamente EmergencyEvent tipo 'terremoto' Nivel 2
  // Si magnitud >= 5.5: Nivel 3 + EmergencyAlert severidad 'critica' en municipios afectados (radio = magnitud × 15 km)
}
```

Añadir `SeismicEvent` a `src/types/index.ts`:
```typescript
export interface SeismicEvent {
  id: string;
  magnitude: number;
  depth: number;         // km
  latitude: number;
  longitude: number;
  locality: string;
  datetime: string;
  feltRadiusKm: number;  // calculado = magnitud * 15
}
```

### 2.7 Crear `src/services/meteoAlertService.ts` — Alertas Meteo Multi-Fuente

```typescript
// src/services/meteoAlertService.ts

// AEMET Avisos (CAP alerts)
export async function fetchAemetCAP(): Promise<MeteoAlert[]> {
  // https://opendata.aemet.es/opendata/api/avisos_cap/ultimoelaborado/todasLocalidades
  // Formato CAP XML — parsear avisos activos de lluvia extrema, viento, nieve, calor
}

// Meteoalarm (sistema europeo EUMETNET)
export async function fetchMeteoalarmSpain(): Promise<MeteoAlert[]> {
  // https://www.meteoalarm.org/api/v1/warnings/Spain
  // Avisos harmonizados por CCAA — nivel de color (verde/amarillo/naranja/rojo)
}

// Cruzar ambas fuentes y crear EmergencyAlert automática si nivel ROJO en cualquier punto
```

---

## MÓDULO 3: MOTOR GEMINI FUSIÓN MULTI-FUENTE (EL CEREBRO DEL SISTEMA)

### 3.1 Refactorizar `predictFireWithGemini()` → `analyzeEmergencyWithGemini()`

Reemplazar la función actual `predictFireWithGemini()` en `fireDetectionEngine.ts` con una nueva función que reciba **TODAS las fuentes de datos** y genere un análisis unificado mucho más preciso:

```typescript
// En src/services/fireDetectionEngine.ts — reemplazar predictFireWithGemini()

export interface MultiSourceContext {
  // Satélites
  hotspot: Omit<SatelliteHotspot, 'id' | 'municipalityName'>;
  goesConfirmation?: boolean;    // ¿GOES también detecta fuego en este punto?
  sentinelNBR?: number;          // Índice NBR de Sentinel-2 (-1 a 1, < -0.3 = fuego activo)
  
  // Meteorología
  weather: WeatherData;          // Open-Meteo / OpenWeather
  aemetRiskLevel?: string;       // Índice oficial AEMET de peligro de incendio para esa provincia
  effisData?: EffisData;         // FWI, FFMC, ISI de EFFIS/Copernicus
  
  // Terreno y vegetación
  vegetationData?: VegetationData;  // Tipo de combustible CNIG
  elevation?: number;               // Altitud en metros (relieve afecta propagación)
  slope?: number;                   // Pendiente en grados (>30° = propagación muy rápida)
  aspectDeg?: number;               // Orientación de la ladera
  
  // Contexto territorial
  nearestMunicipality: Municipality;
  distanceKm: number;
  populationAtRisk?: number;         // Población en radio de 5 km
  criticalInfrastructure?: string[]; // 'hospital', 'escuela', 'autopista', 'embalse'
  
  // Historial
  historicalFiresInArea?: number;    // Número de incendios en ese punto en los últimos 5 años
  copernicusActivation?: boolean;    // ¿Hay activación CEMS activa en el radio?
}

export async function analyzeEmergencyWithGemini(ctx: MultiSourceContext): Promise<FirePrediction> {
  if (!GEMINI_API_KEY) return predictFireDeterministic(ctx.hotspot, ctx.weather);

  const prompt = `Eres el sistema de inteligencia artificial de PREVINCENDIOS ESPAÑA, la plataforma nacional de prevención de catástrofes. Tu análisis puede salvar vidas humanas, animales y preservar el territorio español. Sé extremadamente preciso.

## DATOS SATELITALES
- Satélite primario: ${ctx.hotspot.satellite}
- Coordenadas: ${ctx.hotspot.latitude.toFixed(4)}°N, ${ctx.hotspot.longitude.toFixed(4)}°E
- Fire Radiative Power (FRP): ${ctx.hotspot.frp} MW ${ctx.hotspot.frp > 100 ? '⚠️ INTENSIDAD MUY ALTA' : ctx.hotspot.frp > 30 ? '— intensidad significativa' : '— intensidad baja'}
- Temperatura de brillo: ${ctx.hotspot.brightness} K ${ctx.hotspot.brightness > 380 ? '(fuego activo casi seguro)' : '(posible punto caliente)'}
- Confianza FIRMS: ${ctx.hotspot.confidence}
- Hora detección UTC: ${ctx.hotspot.acqDate} ${ctx.hotspot.acqTime}
${ctx.goesConfirmation ? '- ⚡ GOES-19 CONFIRMA: Este mismo punto también aparece en el satélite geoestacionario. ALTA CERTEZA de fuego activo.' : '- GOES-19: sin confirmación geoestacionaria aún'}
${ctx.sentinelNBR !== undefined ? `- Índice NBR Sentinel-2: ${ctx.sentinelNBR.toFixed(3)} ${ctx.sentinelNBR < -0.3 ? '🔴 QUEMA ACTIVA CONFIRMADA POR IMAGEN MULTIESPECTRAL' : ctx.sentinelNBR < 0 ? '🟡 Posible vegetación estresada o quema incipiente' : '🟢 Vegetación sana — revisar si es anomalía térmica industrial'}` : ''}

## METEOROLOGÍA EN EL PUNTO
- Temperatura: ${ctx.weather.temperatureC}°C ${ctx.weather.temperatureC > 38 ? '⚠️ Temperatura extrema' : ''}
- Humedad relativa: ${ctx.weather.humidityPercent}% ${ctx.weather.humidityPercent < 20 ? '⚠️ Humedad crítica — combustible muy seco' : ctx.weather.humidityPercent < 35 ? '— humedad baja' : ''}
- Viento: ${ctx.weather.windSpeedKmH} km/h desde ${ctx.weather.windDirectionText} (${ctx.weather.windDirectionDeg}°) ${ctx.weather.windSpeedKmH > 50 ? '🔴 VIENTO MUY FUERTE' : ctx.weather.windSpeedKmH > 30 ? '⚠️ viento fuerte' : ''}
- Ráfagas máximas: ${ctx.weather.windGustKmH} km/h
- Precipitación última hora: ${ctx.weather.precipitationMm} mm
- Índice de riesgo calculado: ${ctx.weather.fireRiskIndex}/100
${ctx.aemetRiskLevel ? `- Índice oficial AEMET para la provincia: ${ctx.aemetRiskLevel} ⚠️ FUENTE OFICIAL ESPAÑOLA` : ''}
${ctx.effisData ? `- FWI EFFIS/Copernicus: ${ctx.effisData.fwi.toFixed(1)} (${ctx.effisData.dangerClass}) — ISI: ${ctx.effisData.isi.toFixed(1)} — BUI: ${ctx.effisData.bui.toFixed(1)}` : ''}

## TERRENO Y VEGETACIÓN
${ctx.vegetationData ? `- Tipo de combustible: ${ctx.vegetationData.coverType} (Modelo NFFL: ${ctx.vegetationData.fuelModel})
- Índice de combustibilidad: ${ctx.vegetationData.burnabilityIndex}/10 ${ctx.vegetationData.burnabilityIndex > 7 ? '🔴 COMBUSTIBLE MUY PELIGROSO' : ''}
- Cobertura de dosel: ${ctx.vegetationData.canopyCoverPercent}%` : '- Datos de vegetación no disponibles'}
${ctx.elevation !== undefined ? `- Altitud: ${ctx.elevation} m s.n.m.` : ''}
${ctx.slope !== undefined ? `- Pendiente: ${ctx.slope}° ${ctx.slope > 30 ? '⚠️ Pendiente pronunciada — propagación rápida cuesta arriba' : ''}` : ''}

## CONTEXTO TERRITORIAL Y RIESGO HUMANO
- Municipio más cercano: ${ctx.nearestMunicipality.name} (${ctx.nearestMunicipality.province}) — a ${ctx.distanceKm.toFixed(1)} km
${ctx.populationAtRisk !== undefined ? `- Población en radio de 5 km: ${ctx.populationAtRisk} personas` : ''}
${ctx.criticalInfrastructure?.length ? `- Infraestructuras críticas en radio de 10 km: ${ctx.criticalInfrastructure.join(', ')} ⚠️ PRIORIDAD PROTECCIÓN` : ''}
${ctx.historicalFiresInArea !== undefined ? `- Incendios históricos en esta zona (últimos 5 años): ${ctx.historicalFiresInArea}` : ''}
${ctx.copernicusActivation ? '- 🛰️ ACTIVACIÓN COPERNICUS CEMS ACTIVA EN EL ÁREA — Incendio confirmado por autoridades europeas' : ''}

## TU TAREA
Analiza TODOS los datos anteriores de forma integrada. Considera las correlaciones entre fuentes: un FRP bajo con FWI extremo y viento fuerte puede ser más peligroso que un FRP alto con lluvia y humedad alta.

Responde ÚNICAMENTE con JSON válido sin markdown, sin explicaciones adicionales:
{
  "isFire": boolean,
  "isConfirmedByMultipleSources": boolean,
  "riskLevel": "Bajo" | "Moderado" | "Alto" | "Muy Alto" | "Extremo",
  "confidence": "low" | "nominal" | "high",
  "spreadDirection": "texto como NE o SO",
  "spreadSpeedKmH": number,
  "affectedAreaHectares": number,
  "estimatedPerimeterKm": number,
  "timeToReachNearestTownMinutes": number,
  "evacuationUrgency": "ninguna" | "preventiva" | "inmediata" | "critica",
  "recommendedActions": {
    "forCitizens": "instrucción clara de 1 frase para ciudadanos",
    "forVolunteers": "instrucción operativa de 1 frase para voluntarios",
    "forMunicipality": "instrucción de 1 frase para el ayuntamiento"
  },
  "falseAlarmProbability": number,
  "reasoning": "análisis técnico detallado en español de 2-3 frases explicando la confluencia de factores",
  "urgentAlertRequired": boolean
}`;

  // Llamar a gemini-1.5-pro (no flash) para los análisis más críticos (frp > 50 o effisData.fwi > 40)
  // Usar gemini-1.5-flash para el resto (más rápido y económico)
  const useProModel = ctx.hotspot.frp > 50 || (ctx.effisData?.fwi ?? 0) > 40 || ctx.goesConfirmation;
  const model = useProModel ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
  
  // ... resto de la implementación de fetch a Gemini (mantener estructura actual)
}
```

### 3.2 Motor de análisis de catástrofes no-incendio

Crear `src/services/catastropheAnalysisEngine.ts` que centralice el análisis con Gemini para **inundaciones, terremotos, olas de calor extremas, nevadas y temporales**:

```typescript
// src/services/catastropheAnalysisEngine.ts

export async function analyzeFloodRisk(
  floodPoints: FloodPoint[],
  saihData: HydrologicalAlert[],
  weather: WeatherData,
  municipality: Municipality
): Promise<CatastropheAssessment> {
  // Prompt Gemini específico para inundaciones:
  // - Nivel actual de los ríos vs umbrales históricos
  // - Precipitación acumulada en cuenca (Open-Meteo historical)
  // - Hora estimada de llegada de la riada al núcleo urbano
  // - Zonas de evacuación prioritaria (zonas bajas, zonas inundables históricas)
}

export async function analyzeSeismicRisk(
  seismicEvent: SeismicEvent,
  municipalities: Municipality[]
): Promise<CatastropheAssessment> {
  // Prompt Gemini específico para terremotos:
  // - Radio de daños estimado según magnitud y profundidad
  // - Lista de municipios afectados ordenados por impacto
  // - Posibilidad de réplicas (zona sísmica activa vs. zona tranquila históricamente)
  // - Infraestructuras en riesgo (puentes, edificios antiguos en epicentro)
}

export async function analyzeHeatwaveRisk(
  temperatureData: WeatherData[],
  municipalities: Municipality[]
): Promise<CatastropheAssessment[]> {
  // Prompt Gemini para olas de calor:
  // - Temperatura máxima proyectada vs. récord histórico de la zona
  // - Índice de vulnerabilidad social (población > 65 años, zonas sin cobertura arbórea)
  // - Recomendaciones de apertura de puntos de refrigeración
}
```

---

## MÓDULO 4: SISTEMA DE ALERTAS Y NOTIFICACIONES EN TIEMPO REAL

### 4.1 Crear `src/services/alertOrchestrator.ts` — Orquestador de Alertas Críticas

Este es el módulo más importante para salvar vidas. Crear un orquestador que tome decisiones automáticas de alerta:

```typescript
// src/services/alertOrchestrator.ts

export interface AlertDecision {
  shouldAlert: boolean;
  alertType: AlertType;
  severity: AlertSeverity;
  affectedMunicipalityIds: string[];
  citizenMessage: string;     // Mensaje claro y directo para ciudadanos — qué hacer AHORA
  volunteerMessage: string;   // Instrucción operativa para voluntarios
  municipalityMessage: string; // Instrucción para responsables municipales
  autoActivateVolunteers: boolean;
  evacuationZones?: string[];  // Coordenadas de zonas de evacuación recomendadas
}

export async function evaluateAndAlert(
  detection: DetectedFire | CatastropheAssessment,
  municipalities: Municipality[]
): Promise<AlertDecision> {
  // REGLAS AUTOMÁTICAS — sin esperar confirmación humana:
  
  // REGLA 1: Si isConfirmedByMultipleSources = true Y riskLevel = 'Extremo'
  //   → alertType: 'alerta_roja', severity: 'critica', autoActivateVolunteers: true
  
  // REGLA 2: Si evacuationUrgency = 'critica'
  //   → alertType: 'evacuacion', ciudadanos con instrucciones claras de ruta de salida
  
  // REGLA 3: Si terremoto magnitude >= 5.0
  //   → alertType: 'alerta_roja' en municipios dentro del radio = magnitud * 15 km
  
  // REGLA 4: Si nivel río SAIH > umbral de alerta Y lluvia intensa en curso
  //   → alertType: 'preconfinamiento' en zonas de vega y zonas bajas
  
  // REGLA 5: Si FWI > 45 Y temperatura > 40°C Y viento > 40 km/h (triple convergencia)
  //   → alertType: 'aviso_preventivo' preventivo ANTES de que aparezca el fuego
  
  // Guardar automáticamente en Firestore: collection('emergencyAlerts').add(alertDecision)
  // Marcar como issuedByUid: 'system-ai-orchestrator'
}
```

### 4.2 Ampliar `EmergencyAlert` en `src/types/index.ts`

Añadir campos críticos para gestión real de emergencias:

```typescript
export interface EmergencyAlert {
  // ... campos existentes ...
  
  // NUEVOS CAMPOS:
  citizenInstructions: {
    doNow: string;          // "Evacúe inmediatamente por la N-401 dirección Toledo"
    doNotDo: string;        // "No use la A-3, cortada por humo"
    meetingPoint: string;   // "Punto de reunión: Polideportivo Municipal calle Cervantes"
    emergencyPhone: string; // "112 — Emergencias" o teléfono local
  };
  volunteerActivation: {
    isActive: boolean;
    assemblyPoint: string;   // "Parque de Bomberos de Torrijos"
    requiredEquipment: string[]; // ['traje_ignifugo', 'mochila_extintora']
    minimumPersonnel: number;
  };
  affectedMunicipalityIds: string[];  // Municipios en el radio de la alerta
  estimatedDurationHours: number;
  externalAgenciesNotified: string[]; // ['112', 'BRIF', 'Guardia_Civil', 'Cruz_Roja']
  aiConfidence: number;    // 0-100, confianza del análisis IA
  dataSourcesUsed: string[]; // ['FIRMS_NOAA21', 'GOES19', 'EFFIS', 'AEMET']
}
```

### 4.3 Crear `src/services/fcmNotificationService.ts` — Firebase Cloud Messaging

Crear servicio de notificaciones push para que los ciudadanos reciban alertas en el móvil instantáneamente:

```typescript
// src/services/fcmNotificationService.ts
// Usar Firebase Admin SDK (en Firebase Cloud Functions) para enviar FCM

// En el cliente (React):
export async function subscribeToMunicipalityAlerts(municipalityId: string): Promise<void> {
  // 1. Solicitar permiso de notificaciones al usuario
  // 2. Obtener FCM token con getToken() de firebase/messaging
  // 3. Guardar token en Firestore: users/{uid}/fcmTokens/{token}
  // 4. Suscribir al topic FCM: 'municipality-{municipalityId}'
}

// En Firebase Cloud Functions (crear src/functions/index.ts si no existe):
// - Trigger: onWrite en collection('emergencyAlerts')
// - Si nueva alerta con severity 'alta' o 'critica':
//   → Enviar FCM a topic 'municipality-{municipalityId}'
//   → Mensaje: título corto + instrucción principal + link a la app
```

### 4.4 Ampliar `src/services/googleWorkspaceService.ts` — Notificaciones Multi-Canal

El servicio `googleWorkspaceService.ts` ya existe. Ampliarlo para:

1. **WhatsApp Business API** (via Twilio o Vonage) — Los ayuntamientos en España pequeños usan WhatsApp. Cuando hay alerta crítica, enviar mensaje WhatsApp automático al número oficial del ayuntamiento.

2. **SMS de emergencia** — Via Twilio SMS, enviar SMS a los teléfonos de emergencia del municipio (`officialContactPhone` en `Municipality`).

3. **Sistema de megafonía/bando digital** — Generar automáticamente el texto del bando con las instrucciones de Gemini, listo para que el alcalde lo active con un botón.

Añadir al `.env.example`:
```
VITE_TWILIO_ACCOUNT_SID=
VITE_TWILIO_AUTH_TOKEN=
VITE_TWILIO_PHONE_NUMBER=
VITE_WHATSAPP_BUSINESS_TOKEN=
```

---

## MÓDULO 5: COORDINACIÓN DE EMERGENCIAS EN TIEMPO REAL

### 5.1 Crear `src/services/resourceCoordinationService.ts` — Coordinación Inteligente de Recursos

```typescript
// src/services/resourceCoordinationService.ts

export async function getOptimalResourceDeployment(
  emergency: EmergencyEvent,
  availableResources: OperationalResource[],
  volunteers: VolunteerProfile[],
  municipalities: Municipality[]
): Promise<ResourceDeploymentPlan> {
  // Llamar a Gemini con:
  // - Tipo y severidad del incendio/catástrofe
  // - Lista de recursos disponibles con su posición GPS
  // - Voluntarios disponibles con sus capacidades (4x4, motosierra, bomba agua, etc.)
  // - Municipios colaboradores (twinnedMunicipalityIds)
  // - Infraestructura crítica en riesgo
  
  // Gemini devuelve:
  // - Qué recursos desplegar primero y en qué orden
  // - Qué voluntarios activar según sus capacidades específicas
  // - Rutas de acceso recomendadas (evitando zonas de humo/fuego)
  // - Puntos de agua más cercanos
  // - Estimación de tiempo hasta control del incendio
}

export interface ResourceDeploymentPlan {
  priorityResources: Array<{ resourceId: string; role: string; estimatedArrivalMin: number }>;
  volunteerGroups: Array<{
    volunteers: string[];  // uids
    mission: string;
    assemblyPoint: string;
    requiredEquipment: string[];
  }>;
  accessRoutes: string[];
  waterPoints: Array<{ lat: number; lng: number; type: string; capacityLiters: number }>;
  estimatedControlTimeHours: number;
  geminiReasoning: string;
}
```

### 5.2 Mejorar el sistema de PatrolLocation — Tracking en tiempo real

El tipo `PatrolLocation` ya existe. Ampliar para soportar tracking activo de emergencias:

```typescript
// Añadir a PatrolLocation en src/types/index.ts:
export interface PatrolLocation {
  // ... campos existentes ...
  
  // NUEVOS:
  emergencyEventId?: string;  // Si está en misión activa, ID del incendio
  missionStatus?: 'en_ruta' | 'en_zona' | 'evacuando' | 'retorno';
  batteryLevel?: number;      // % batería del dispositivo (para saber si va a desconectarse)
  signalQuality?: number;     // Calidad de señal 0-4 (áreas rurales pueden perder cobertura)
  lastKnownLocation?: GeoPoint; // Última posición antes de perder señal
}
```

Crear Firebase Cloud Function que, cuando un voluntario no actualiza su posición en más de 15 minutos durante una misión activa, envíe alerta automática al coordinador municipal.

---

## MÓDULO 6: HISTÓRICO, ANALYTICS Y MACHINE LEARNING

### 6.1 Crear `src/services/historicalAnalysisService.ts`

```typescript
// src/services/historicalAnalysisService.ts

// Guardar en Firestore todos los focos detectados (confirmados y descartados)
// para construir un dataset de entrenamiento propio con el tiempo

export async function saveDetectionToHistory(
  detection: DetectedFire,
  wasConfirmedFire: boolean  // Confirmado por ayuntamiento o voluntario
): Promise<void> {
  // collection('detectionHistory').add({
  //   ...detection,
  //   wasConfirmedFire,
  //   savedAt: serverTimestamp()
  // })
}

// Análisis de patrones con Gemini
export async function getSeasonalRiskAnalysis(
  municipalityId: string,
  month: number
): Promise<SeasonalRiskReport> {
  // Obtener histórico de incendios en ese municipio
  // Cruzar con datos climatológicos históricos
  // Gemini genera informe de riesgo estacional con recomendaciones preventivas
}
```

### 6.2 Crear panel de Índice de Riesgo Municipal Consolidado

Añadir a cada `Municipality` en Firestore un campo `consolidatedRiskScore` (0-100) calculado diariamente por una Firebase Scheduled Function que combine:
- FWI de EFFIS
- Índice AEMET de peligro de incendio
- Histórico de incendios en los últimos 5 años
- Temperatura y humedad actuales
- Número de días sin lluvia

Este score aparece visible en el mapa con escala de colores y se actualiza cada hora.

---

## MÓDULO 7: INTERFAZ — PANEL DE CRISIS

### 7.1 Crear `src/pages/CrisisCommandCenter.tsx`

Panel de mando centralizado para situaciones de emergencia activa (solo visible para roles `superadmin` y `ayuntamiento`):

Secciones del panel:
1. **Barra superior roja parpadeante** cuando hay emergencia activa — no se puede ignorar
2. **Mapa en tiempo real** con:
   - Focos satelitales (todos los satélites)
   - Posición GPS de todos los voluntarios activos en misión
   - Vectores de propagación estimada (flechas animadas en dirección del viento)
   - Polígono de área estimada afectada (actualizado cada ciclo de detección)
   - Puntos de agua disponibles
   - Rutas de evacuación recomendadas (líneas verdes en el mapa)
3. **Panel de recursos** — lista de recursos disponibles/movilizados con estado en tiempo real
4. **Chat de coordinación** — `BandoMessage` filtrado por `canal: 'coordinacion_intermunicipal'`
5. **Timeline de la emergencia** — línea de tiempo con todos los eventos desde la primera detección
6. **Botones de acción rápida**:
   - "ACTIVAR VOLUNTARIOS" (cambia `isAvailableNow` + envía notificación push a todos los voluntarios del municipio)
   - "EMITIR BANDO DE EVACUACIÓN" (genera texto automático con Gemini + envía a todos los ciudadanos del municipio)
   - "SOLICITAR REFUERZOS" (crea `ResourceRequest` urgente a municipios colindantes)
   - "NOTIFICAR 112" (genera email/SMS al 112 con el resumen completo del incendio generado por Gemini)

### 7.2 Crear `src/pages/CitizenAlertPage.tsx`

Página pública (sin login) accesible en `/alerta` que muestre en tiempo real:
- Si hay alertas activas en el municipio del usuario (geolocalización automática)
- Instrucciones claras: **qué hacer AHORA** (texto grande, claro, sin tecnicismos)
- Mapa simplificado con zona de peligro y punto de evacuación más cercano
- Número de teléfono de emergencia del ayuntamiento prominente
- Sin información confusa — solo lo que el ciudadano necesita para salvarse

---

## MÓDULO 8: FIREBASE CLOUD FUNCTIONS

Crear `src/functions/index.ts` con las siguientes funciones:

```typescript
// Función 1: Ciclo de detección automática cada 10 minutos
export const scheduledFireDetection = onSchedule('every 10 minutes', async () => {
  // Ejecutar detectFires() con todos los satélites
  // Ejecutar fetchRecentEarthquakesSpain()
  // Ejecutar fetchFloodHazardSpain()
  // Para cada detección crítica: crear EmergencyEvent en Firestore
  // Para cada alerta: enviar FCM push notifications
});

// Función 2: Alerta por nueva entrada en emergencyAlerts
export const onNewEmergencyAlert = onDocumentCreated('emergencyAlerts/{alertId}', async (event) => {
  const alert = event.data?.data() as EmergencyAlert;
  if (['alta', 'critica'].includes(alert.severity)) {
    // Enviar FCM a topic 'municipality-{alert.municipalityId}'
    // Enviar WhatsApp/SMS al contacto de emergencia del municipio
    // Notificar a todos los voluntarios del municipio
  }
});

// Función 3: Watchdog de voluntarios en misión
export const volunteerWatchdog = onSchedule('every 15 minutes', async () => {
  // Buscar voluntarios con missionStatus != null que no hayan actualizado posición en 15 min
  // Crear alerta en Firestore: 'voluntario_sin_señal'
  // Notificar al coordinador municipal
});
```

---

## VARIABLES DE ENTORNO — Actualizar `.env.example`

```env
# Existentes (mantener)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIRMS_API_KEY=
VITE_OPENWEATHER_API_KEY=
VITE_GEMINI_API_KEY=

# Nuevas APIs a añadir
VITE_SENTINEL_CLIENT_ID=              # Copernicus Data Space / Sentinel Hub
VITE_SENTINEL_CLIENT_SECRET=          # Copernicus Data Space / Sentinel Hub
VITE_TWILIO_ACCOUNT_SID=             # Notificaciones SMS y WhatsApp
VITE_TWILIO_AUTH_TOKEN=
VITE_TWILIO_PHONE_NUMBER=
VITE_IGN_API_KEY=                     # Instituto Geográfico Nacional (terremotos)
VITE_GOOGLE_MAPS_API_KEY=             # Para elevación, pendiente y tipo de terreno
```

---

## PRIORIDAD DE IMPLEMENTACIÓN

Implementar en este orden exacto (de mayor a menor impacto en salvar vidas):

1. **CRÍTICO — Implementar primero:**
   - Módulo 3.1: Refactorizar `analyzeEmergencyWithGemini()` con contexto multi-fuente completo
   - Módulo 4.1: `alertOrchestrator.ts` con reglas automáticas
   - Módulo 4.2: Ampliar `EmergencyAlert` con instrucciones para ciudadanos

2. **MUY IMPORTANTE — Segunda iteración:**
   - Módulo 1.1: NOAA-21 en FIRMS_SOURCES
   - Módulo 1.2: `goesService.ts` (satélite geoestacionario <10 min)
   - Módulo 2.1: `effisService.ts` (FWI oficial europeo)
   - Módulo 2.3: `sismoService.ts` (terremotos IGN)

3. **IMPORTANTE — Tercera iteración:**
   - Módulo 4.3: FCM push notifications
   - Módulo 5.1: Coordinación inteligente de recursos
   - Módulo 7.1: `CrisisCommandCenter.tsx`
   - Módulo 7.2: `CitizenAlertPage.tsx`

4. **COMPLETAR SISTEMA — Cuarta iteración:**
   - Módulo 1.3: Sentinel Hub imágenes multiespectrales + Gemini Vision
   - Módulo 2.5: `inundacionService.ts`
   - Módulo 2.7: `meteoAlertService.ts`
   - Módulo 8: Firebase Cloud Functions scheduled

---

## NOTAS DE IMPLEMENTACIÓN CRÍTICAS

- **NUNCA romper el flujo existente** de `detectFires()` — añadir las nuevas fuentes de forma incremental con `Promise.allSettled()` y fallback graceful. Si una API falla, el sistema sigue funcionando.
- **Todos los nuevos servicios deben tener caché** para no saturar las APIs gratuitas. FIRMS tiene límite de 5.000 transacciones/10 min. EFFIS no tiene límite documentado pero ser respetuoso.
- **Gemini se usa con gemini-1.5-pro** para análisis críticos (FRP > 50 MW o FWI > 40) y **gemini-1.5-flash** para el resto. El coste es muy diferente.
- **Las instrucciones para ciudadanos deben estar en español claro, sin tecnicismos, en primera persona:** "Abandone su domicilio ahora. Use la N-401 dirección Toledo. No recoja objetos. Llame al 112."
- **Mantener TypeScript estricto** — `strict: true` en `tsconfig.json` ya configurado.
- **Todos los nuevos tipos van a `src/types/index.ts`** — no crear archivos de tipos separados.

