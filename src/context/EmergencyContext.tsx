/**
 * Contexto de Gestión Operativa de Emergencias, Recursos e Incidencias
 * Previncendios España
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  EmergencyEvent,
  EmergencyAlert,
  OperationalResource,
  ResourceRequest,
  VolunteerProfile,
  PatrolLocation,
  BandoMessage,
  DocumentAttachment,
  ActivityLog,
  Municipality,
  SatelliteHotspot,
  FilterState,
  MapLayerState,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../types';
import {
  initialMunicipalities,
  initialEmergencyEvents,
  initialAlerts,
  initialResources,
  initialResourceRequests,
  initialVolunteerProfiles,
  initialPatrolLocations,
  initialMessages,
  initialDocuments,
  initialActivityLogs,
} from '../services/mockData';
import { fetchFirmsHotspotsForSpain } from '../services/firmsSatelliteService';
import { useAuth } from './AuthContext';

interface EmergencyContextType {
  municipalities: Municipality[];
  incidents: EmergencyEvent[];
  alerts: EmergencyAlert[];
  resources: OperationalResource[];
  resourceRequests: ResourceRequest[];
  volunteers: VolunteerProfile[];
  patrols: PatrolLocation[];
  messages: BandoMessage[];
  documents: DocumentAttachment[];
  activityLogs: ActivityLog[];
  satelliteHotspots: SatelliteHotspot[];
  
  // Filtros y Mapa
  filters: FilterState;
  mapLayers: MapLayerState;
  selectedIncident: EmergencyEvent | null;
  setSelectedIncident: (incident: EmergencyEvent | null) => void;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  updateMapLayers: (newLayers: Partial<MapLayerState>) => void;
  resetFilters: () => void;

  // Movilizaciones "Voy en camino"
  activeMobilizations: Record<string, string | null>;
  toggleMobilization: (incidentId: string) => void;
  isUserMobilizedTo: (incidentId: string) => boolean;

  // Acciones Operativas CRUD
  createIncident: (incidentData: Omit<EmergencyEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus, severity?: IncidentSeverity, brigade?: string) => void;
  createAlert: (alertData: Omit<EmergencyAlert, 'id' | 'createdAt' | 'isActive'>) => void;
  dismissAlert: (alertId: string) => void;
  createResource: (resourceData: Omit<OperationalResource, 'id' | 'updatedAt'>) => void;
  updateResourceStatus: (id: string, status: OperationalResource['status']) => void;
  requestResourceShare: (requestData: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateResourceRequestStatus: (id: string, status: ResourceRequest['status']) => void;
  createBandoMessage: (msgData: Omit<BandoMessage, 'id' | 'createdAt'>) => void;
  updateVolunteerAvailability: (uid: string, isAvailable: boolean) => void;
  updatePatrolLocation: (patrolData: Omit<PatrolLocation, 'id' | 'timestamp'>) => void;
  logActivity: (action: string, targetCollection: string, targetDocId: string, details: string) => void;
  refreshSatelliteData: () => Promise<void>;
}

const initialFilters: FilterState = {
  municipalityId: 'todas',
  province: 'todas',
  incidentType: 'todos',
  severity: 'todas',
  status: 'todos',
  searchTerm: '',
};

const initialMapLayers: MapLayerState = {
  showIncidents: true,
  showSatelliteFirms: true,
  showResources: true,
  showPatrols: true,
  showRiskZones: true,
  tileLayer: 'streets',
};

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [municipalities] = useState<Municipality[]>(initialMunicipalities);
  const [incidents, setIncidents] = useState<EmergencyEvent[]>(initialEmergencyEvents);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(initialAlerts);
  const [resources, setResources] = useState<OperationalResource[]>(initialResources);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(initialResourceRequests);
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>(initialVolunteerProfiles);
  const [patrols, setPatrols] = useState<PatrolLocation[]>(initialPatrolLocations);
  const [messages, setMessages] = useState<BandoMessage[]>(initialMessages);
  const [documents] = useState<DocumentAttachment[]>(initialDocuments);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [satelliteHotspots, setSatelliteHotspots] = useState<SatelliteHotspot[]>([]);
  
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [mapLayers, setMapLayers] = useState<MapLayerState>(initialMapLayers);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyEvent | null>(null);
  const [activeMobilizations, setActiveMobilizations] = useState<Record<string, string | null>>({});

  const toggleMobilization = (incidentId: string) => {
    const userUid = user?.uid || 'invitado';
    setActiveMobilizations((prev) => {
      const current = prev[userUid];
      const next = current === incidentId ? null : incidentId;
      if (next) {
        logActivity('MOVILIZACION_VOLUNTARIO', 'emergencyEvents', incidentId, `${user?.displayName || 'Usuario'} va en camino a la emergencia #${incidentId}`);
      } else {
        logActivity('CANCELAR_MOVILIZACION', 'emergencyEvents', incidentId, `${user?.displayName || 'Usuario'} ha cancelado la movilización a #${incidentId}`);
      }
      return { ...prev, [userUid]: next };
    });
  };

  const isUserMobilizedTo = (incidentId: string): boolean => {
    const userUid = user?.uid || 'invitado';
    return activeMobilizations[userUid] === incidentId;
  };

  // Cargar datos de FIRMS
  useEffect(() => {
    fetchFirmsHotspotsForSpain().then((hotspots) => {
      setSatelliteHotspots(hotspots);
    });
  }, []);

  const refreshSatelliteData = async () => {
    const data = await fetchFirmsHotspotsForSpain();
    setSatelliteHotspots(data);
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const updateMapLayers = (newLayers: Partial<MapLayerState>) => {
    setMapLayers((prev) => ({ ...prev, ...newLayers }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Auditoría automática
  const logActivity = (action: string, targetCollection: string, targetDocId: string, details: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      userUid: user?.uid || 'invitado',
      userName: user?.displayName || 'Invitado',
      userRole: user?.role || 'invitado',
      municipalityId: user?.municipalityId || 'muni_el_tiemblo',
      action,
      targetCollection,
      targetDocId,
      details,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Crear Incidencia
  const createIncident = (incidentData: Omit<EmergencyEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newIncident: EmergencyEvent = {
      ...incidentData,
      id: `evt-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setIncidents((prev) => [newIncident, ...prev]);
    logActivity('CREAR_INCIDENCIA', 'emergencyEvents', newIncident.id, `Reportada incidencia "${newIncident.title}" en ${newIncident.municipalityName}`);
  };

  // Actualizar Estado de Incidencia
  const updateIncidentStatus = (id: string, status: IncidentStatus, severity?: IncidentSeverity, brigade?: string) => {
    const now = new Date().toISOString();
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status,
            severity: severity || item.severity,
            assignedBrigade: brigade || item.assignedBrigade,
            updatedAt: now,
          };
        }
        return item;
      })
    );
    logActivity('ACTUALIZAR_INCIDENCIA', 'emergencyEvents', id, `Cambio de estado a "${status}" para la incidencia #${id}`);
  };

  // Crear Alerta Poblacional
  const createAlert = (alertData: Omit<EmergencyAlert, 'id' | 'createdAt' | 'isActive'>) => {
    const newAlert: EmergencyAlert = {
      ...alertData,
      id: `alt-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    logActivity('CREAR_ALERTA', 'alerts', newAlert.id, `Alerta de emergencia emitida: "${newAlert.title}" (${newAlert.severity.toUpperCase()})`);
  };

  // Desactivar Alerta
  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((item) => (item.id === alertId ? { ...item, isActive: false } : item))
    );
    logActivity('CANCELAR_ALERTA', 'alerts', alertId, `Desactivada alerta de emergencia #${alertId}`);
  };

  // Gestiones de Recursos
  const createResource = (resourceData: Omit<OperationalResource, 'id' | 'updatedAt'>) => {
    const newResource: OperationalResource = {
      ...resourceData,
      id: `res-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setResources((prev) => [newResource, ...prev]);
    logActivity('REGISTRAR_RECURSO', 'resources', newResource.id, `Alta de recurso operativo "${newResource.name}"`);
  };

  const updateResourceStatus = (id: string, status: OperationalResource['status']) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
    );
    logActivity('ESTADO_RECURSO', 'resources', id, `Cambio de disponibilidad a "${status}" para recurso #${id}`);
  };

  // Solicitud de Cesión de Recursos Intermunicipal
  const requestResourceShare = (requestData: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: ResourceRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };
    setResourceRequests((prev) => [newRequest, ...prev]);
    logActivity('SOLICITAR_CESION', 'resourceRequests', newRequest.id, `Solicitados recursos a ${newRequest.targetMunicipalityName}`);
  };

  const updateResourceRequestStatus = (id: string, status: ResourceRequest['status']) => {
    setResourceRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
    logActivity('RESPUESTA_CESION', 'resourceRequests', id, `Solicitud de cesión #${id} marcada como "${status}"`);
  };

  // Emitir Bando
  const createBandoMessage = (msgData: Omit<BandoMessage, 'id' | 'createdAt'>) => {
    const newMsg: BandoMessage = {
      ...msgData,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [newMsg, ...prev]);
    logActivity('EMITIR_BANDO', 'messages', newMsg.id, `Publicado comunicado oficial: "${newMsg.title}"`);
  };

  // Actualizar disponibilidad Voluntario
  const updateVolunteerAvailability = (uid: string, isAvailableNow: boolean) => {
    setVolunteers((prev) =>
      prev.map((v) => (v.uid === uid ? { ...v, isAvailableNow, updatedAt: new Date().toISOString() } : v))
    );
  };

  // Actualizar Patrulla GPS
  const updatePatrolLocation = (patrolData: Omit<PatrolLocation, 'id' | 'timestamp'>) => {
    const newPatrol: PatrolLocation = {
      ...patrolData,
      id: `patrol-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setPatrols((prev) => [newPatrol, ...prev.filter((p) => p.uid !== patrolData.uid)]);
  };

  return (
    <EmergencyContext.Provider
      value={{
        municipalities,
        incidents,
        alerts,
        resources,
        resourceRequests,
        volunteers,
        patrols,
        messages,
        documents,
        activityLogs,
        satelliteHotspots,
        filters,
        mapLayers,
        selectedIncident,
        setSelectedIncident,
        activeMobilizations,
        toggleMobilization,
        isUserMobilizedTo,
        updateFilters,
        updateMapLayers,
        resetFilters,
        createIncident,
        updateIncidentStatus,
        createAlert,
        dismissAlert,
        createResource,
        updateResourceStatus,
        requestResourceShare,
        updateResourceRequestStatus,
        createBandoMessage,
        updateVolunteerAvailability,
        updatePatrolLocation,
        logActivity,
        refreshSatelliteData,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency debe usarse dentro de un EmergencyProvider');
  }
  return context;
};
