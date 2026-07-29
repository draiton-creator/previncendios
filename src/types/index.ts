/**
 * Previncendios España - Tipos TypeScript Globales
 * Plataforma Nacional de Prevención y Gestión de Emergencias
 */

export type UserRole = 'superadmin' | 'ayuntamiento' | 'voluntario' | 'ciudadano' | 'invitado';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  municipalityId: string;
  municipalityName: string;
  province: string;
  autonomousCommunity: string;
  phone?: string;
  geoConsent: boolean;
  currentLocation?: GeoPoint;
  isVerified?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Municipality {
  id: string;
  name: string;
  ineCode: string;
  province: string;
  autonomousCommunity: string;
  centerLat: number;
  centerLng: number;
  fireRiskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto' | 'Extremo';
  activeEmergencyCount: number;
  officialContactPhone: string;
  emergencyEmail: string;
  twinnedMunicipalityIds: string[]; // Municipios colaboradores o colindantes
  population?: number;
  createdAt: string;
}

export type IncidentType =
  | 'incendio_forestal'
  | 'incendio_urbano'
  | 'inundacion'
  | 'tormenta'
  | 'accidente'
  | 'ola_calor'
  | 'alerta_sanitaria'
  | 'otro';

export type IncidentSeverity = 'Nivel 0' | 'Nivel 1' | 'Nivel 2' | 'Nivel 3';

export type IncidentStatus =
  | 'detectado'
  | 'confirmado'
  | 'en_control'
  | 'estabilizado'
  | 'extinguido'
  | 'falsa_alarma';

export type IncidentSource =
  | 'ciudadano'
  | 'voluntario'
  | 'satelite_firms'
  | 'bomberos'
  | 'ayuntamiento';

export interface EmergencyEvent {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  municipalityId: string;
  municipalityName: string;
  province: string;
  latitude: number;
  longitude: number;
  locationDescription: string;
  description: string;
  reportedByUid: string;
  reportedByName: string;
  reportedByRole: UserRole;
  source: IncidentSource;
  assignedBrigade?: string;
  photoUrls: string[];
  affectedAreaHectares?: number;
  createdAt: string;
  updatedAt: string;
}

export type AlertType =
  | 'evacuacion'
  | 'preconfinamiento'
  | 'alerta_roja'
  | 'aviso_preventivo'
  | 'bando_informativo';

export type AlertSeverity = 'baja' | 'media' | 'alta' | 'critica';

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  severity: AlertSeverity;
  municipalityId: string;
  municipalityName: string;
  radiusKm: number;
  issuedByUid: string;
  issuedByName: string;
  emergencyEventId?: string;
  isActive: boolean;
  createdAt: string;
}

export type ResourceCategory =
  | 'vehiculo_moteado'
  | 'autobomba'
  | 'reten_terrestre'
  | 'herramientas_manuales'
  | 'punto_agua'
  | 'refugio_albergue'
  | 'materia_logistica'
  | 'dron';

export type ResourceStatus = 'disponible' | 'movilizado' | 'mantenimiento' | 'fuera_servicio';

export interface OperationalResource {
  id: string;
  name: string;
  category: ResourceCategory;
  status: ResourceStatus;
  municipalityId: string;
  municipalityName: string;
  capacityOrQuantity: string;
  latitude: number;
  longitude: number;
  contactPerson: string;
  contactPhone: string;
  updatedAt: string;
}

export type RequestUrgency = 'baja' | 'media' | 'alta' | 'inmediata';
export type RequestStatus = 'pendiente' | 'aceptada' | 'rechazada' | 'completada';

export interface ResourceRequest {
  id: string;
  requestingMunicipalityId: string;
  requestingMunicipalityName: string;
  targetMunicipalityId: string;
  targetMunicipalityName: string;
  resourceTypeNeeded: string;
  quantityNeeded: string;
  urgencyLevel: RequestUrgency;
  status: RequestStatus;
  notes: string;
  createdAt: string;
}

export interface VolunteerProfile {
  uid: string;
  userName: string;
  municipalityId: string;
  municipalityName?: string;
  province?: string;
  phone?: string;
  email?: string;
  groupOrAssociation?: string; // Ej: Protección Civil, Retén Forestal, Agrupación Local
  vehicleType: string;
  has4x4: boolean;
  hasChainsaw: boolean;
  hasWaterPump: boolean;
  hasFirstAidCertification: boolean;
  epiComplete?: boolean; // Traje Ignífugo, Casco, Mascarilla FFP3, Guantes, Botas
  radioEquipment: string;
  actionRadiusKm: number;
  isAvailableNow: boolean;
  availabilitySchedule?: string; // Ej: "Disponibilidad Inmediata 24/7", "Tardes y Fines de Semana"
  assignedPatrolZone?: string;
  trainings?: string[]; // Cursos de Incendios Forestales, Rescate, SVB, etc.
  trainingHours?: number; // Horas de formación acreditada
  vehicleDetails?: string; // Capacidad, remolque, matrícula/identificador
  toolsList?: string[]; // Batefuegos, Pulaski, Gorgui, Mochila Extintora, Generador, etc.
  notes?: string;
  updatedAt: string;
}

export interface PatrolLocation {
  id: string;
  uid: string;
  userName: string;
  role: UserRole;
  municipalityId: string;
  latitude: number;
  longitude: number;
  speedKmH?: number;
  statusNote?: string;
  timestamp: string;
}

export interface AemetAlert {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  level: 'verde' | 'amarillo' | 'naranja' | 'rojo';
  phenomenon: string;
  area: string;
}

export interface BandoMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: UserRole;
  municipalityId: string;
  municipalityName: string;
  title: string;
  content: string;
  channel: 'bando_oficial' | 'instruccion_voluntarios' | 'coordinacion_intermunicipal';
  targetRoles: UserRole[];
  createdAt: string;
}

export interface DocumentAttachment {
  id: string;
  title: string;
  category: 'protocolo' | 'bando' | 'plan_emergencia' | 'ficha_operativa' | 'publico';
  municipalityId: string;
  fileUrl: string;
  fileSize: string;
  uploadedBy: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userUid: string;
  userName: string;
  userRole: UserRole;
  municipalityId: string;
  action: string;
  targetCollection: string;
  targetDocId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemSettings {
  id: string;
  platformName: string;
  maintenanceMode: boolean;
  firmsApiEnabled: boolean;
  aemetApiEnabled: boolean;
  autoAlertDistanceKm: number;
  updatedAt: string;
}

export interface SatelliteHotspot {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: 'nominal' | 'high' | 'low';
  acqDate: string;
  acqTime: string;
  satellite: 'Aqua' | 'Terra' | 'VIIRS-NPP' | 'NOAA-20' | 'NOAA-21' | 'GOES-19' | string;
  isGeostationary?: boolean;
  frp: number; // Fire Radiative Power (MW)
  municipalityName: string;
  distanceToMunicipalityKm?: number;
  scan?: string;
  version?: string;
  daynight?: string;
  // Datos de predicción enriquecida por IA
  riskLevel?: 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto' | 'Extremo';
  spreadDirection?: string;
  spreadSpeedKmH?: number;
  affectedAreaHectares?: number;
  temperatureC?: number;
  humidityPercent?: number;
  windSpeedKmH?: number;
  windGustKmH?: number;
  windDirection?: string;
  precipitationMm?: number;
  airQualityIndex?: number;
  pm2_5?: number;
  pm10?: number;
  co?: number;
  no2?: number;
  reasoning?: string;
  // Datos SEVIRI (Meteosat Second Generation)
  seviriFRP?: number;
  seviriConfidence?: number;
  seviriConfirmed?: boolean;
}

export interface FilterState {
  municipalityId: string;
  province: string;
  incidentType: string;
  severity: string;
  status: string;
  searchTerm: string;
  // Filtros avanzados de satélite y riesgo
  satelliteSource: 'todos' | 'FIRMS' | 'GOES' | 'SEVIRI' | 'Sentinel-3' | 'MODIS' | 'VIIRS' | 'NOAA-20' | 'NOAA-21';
  riskLevel: 'todos' | 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto' | 'Extremo';
  minConfidence: 'todos' | 'low' | 'nominal' | 'high';
  timeWindow: 'todos' | '1h' | '6h' | '24h' | '7d';
  minFrp: number;
  showOnlyConfirmed: boolean;
}

export interface Camera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  source: 'lapalma' | 'dgt' | 'euskadi' | 'custom';
  streamUrl?: string;
  imageUrl?: string;
  webUrl?: string;
  status?: 'active' | 'inactive' | 'alert';
  lastUpdate?: string;
}

export interface MapLayerState {
  showIncidents: boolean;
  showSatelliteFirms: boolean;
  showResources: boolean;
  showPatrols: boolean;
  showRiskZones: boolean;
  showFirmsWms: boolean;
  showCameras: boolean;
  // Capas WMS adicionales
  showEffisWms: boolean;
  showSeviriWms: boolean;
  showEffisFwiWms: boolean;
  showIgnCatastroWms: boolean;
  showAemetPrecipitationWms: boolean;
  showEumetviewWms: boolean;
  showSentinel3Wms: boolean;
  tileLayer: 'streets' | 'satellite' | 'terrain';
}
