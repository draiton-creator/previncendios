/**
 * Contexto de Gestión Operativa de Emergencias, Recursos e Incidencias
 * Previncendios España
 *
 * Conectado a Firestore para lectura/escritura en tiempo real.
 * Mantiene datos de demo/mock como respaldo cuando no hay sesión real.
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
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
  UserRole,
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
import { detectFires } from '../services/fireDetectionEngine';

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

  // Geolocalización pública para alertas sin registro
  publicLocation: { latitude: number; longitude: number } | null;
  setPublicLocation: (lat: number, lng: number) => void;

  // Estado
  isLoading: boolean;
  error: string | null;

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
  createIncident: (incidentData: Omit<EmergencyEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIncidentStatus: (id: string, status: IncidentStatus, severity?: IncidentSeverity, brigade?: string) => Promise<void>;
  createAlert: (alertData: Omit<EmergencyAlert, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  createResource: (resourceData: Omit<OperationalResource, 'id' | 'updatedAt'>) => Promise<void>;
  updateResourceStatus: (id: string, status: OperationalResource['status']) => Promise<void>;
  requestResourceShare: (requestData: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateResourceRequestStatus: (id: string, status: ResourceRequest['status']) => Promise<void>;
  createBandoMessage: (msgData: Omit<BandoMessage, 'id' | 'createdAt'>) => Promise<void>;
  updateVolunteerAvailability: (uid: string, isAvailable: boolean) => Promise<void>;
  updatePatrolLocation: (patrolData: Omit<PatrolLocation, 'id' | 'timestamp'>) => Promise<void>;
  logActivity: (action: string, targetCollection: string, targetDocId: string, details: string) => Promise<void>;
  runSatelliteScan: () => Promise<void>;
  isSatelliteScanning: boolean;
  lastSatelliteScan: string | null;
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
  showFirmsWms: true,
  tileLayer: 'streets',
};

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

const convertTimestamp = (value: unknown): string | unknown => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  return value;
};

const normalizeFirestoreDates = <T extends Record<string, any>>(data: T): T => {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp' || key.endsWith('At')) {
      normalized[key] = convertTimestamp(value);
    } else if (Array.isArray(value)) {
      normalized[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? normalizeFirestoreDates(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      normalized[key] = normalizeFirestoreDates(value);
    } else {
      normalized[key] = value;
    }
  }
  return normalized as T;
};

export const EmergencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();

  const [municipalities, setMunicipalities] = useState<Municipality[]>(initialMunicipalities);
  const [incidents, setIncidents] = useState<EmergencyEvent[]>(initialEmergencyEvents);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(initialAlerts);
  const [resources, setResources] = useState<OperationalResource[]>(initialResources);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(initialResourceRequests);
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>(initialVolunteerProfiles);
  const [patrols, setPatrols] = useState<PatrolLocation[]>(initialPatrolLocations);
  const [messages, setMessages] = useState<BandoMessage[]>(initialMessages);
  const [documents, setDocuments] = useState<DocumentAttachment[]>(initialDocuments);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [satelliteHotspots, setSatelliteHotspots] = useState<SatelliteHotspot[]>([]);
  const [publicLocation, setPublicLocationState] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSatelliteScanning, setIsSatelliteScanning] = useState<boolean>(false);
  const [lastSatelliteScan, setLastSatelliteScan] = useState<string | null>(null);

  const incidentsRef = useRef<EmergencyEvent[]>(incidents);
  const municipalitiesRef = useRef<Municipality[]>(municipalities);
  const satelliteHotspotsRef = useRef<SatelliteHotspot[]>([]);
  const isSatelliteScanningRef = useRef<boolean>(false);
  const scanInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  useEffect(() => {
    municipalitiesRef.current = municipalities;
  }, [municipalities]);

  useEffect(() => {
    satelliteHotspotsRef.current = satelliteHotspots;
  }, [satelliteHotspots]);

  // Cargar listado real de municipios españoles
  useEffect(() => {
    fetch('/municipios.json')
      .then((res) => res.json())
      .then((data: Municipality[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMunicipalities(data);
        }
      })
      .catch((err) => {
        console.warn('No se pudo cargar el listado real de municipios:', err);
      });
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [mapLayers, setMapLayers] = useState<MapLayerState>(initialMapLayers);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyEvent | null>(null);
  const [activeMobilizations, setActiveMobilizations] = useState<Record<string, string | null>>({});

  // Escuchar cambios de Firestore en tiempo real
  useEffect(() => {
    if (isDemoMode && !!user) {
      // Usuario en modo demo local: no sincronizamos, usa datos en memoria
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribers: Unsubscribe[] = [];

    const setupListener = <T,>(
      collectionName: string,
      setter: (data: T[]) => void,
      orderField: string = 'createdAt',
      fieldFilter?: { field: string; value: string }
    ) => {
      let q = collection(db, collectionName);
      if (fieldFilter) {
        q = query(q, where(fieldFilter.field, '==', fieldFilter.value), orderBy(orderField, 'desc')) as any;
      } else {
        q = query(q, orderBy(orderField, 'desc')) as any;
      }

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) =>
            normalizeFirestoreDates({ id: doc.id, ...doc.data() } as T)
          );
          setter(data);
          setIsLoading(false);
        },
        (err) => {
          console.warn(`Error escuchando ${collectionName}:`, err);
          setError(`Error cargando ${collectionName}: ${err.message}`);
          setIsLoading(false);
        }
      );
      unsubscribers.push(unsub);
    };

    // Colecciones públicas: visibles para todo el mundo (incluidos vecinos sin login)
    setupListener<EmergencyEvent>('emergencyEvents', setIncidents);
    setupListener<EmergencyAlert>('alerts', setAlerts);

    // Colecciones privadas: solo para usuarios autenticados
    if (user) {
      setupListener<OperationalResource>('resources', setResources);
      setupListener<ResourceRequest>('resourceRequests', setResourceRequests);
      setupListener<BandoMessage>('messages', setMessages);
      setupListener<DocumentAttachment>('documents', setDocuments as any);
      setupListener<ActivityLog>('activityLogs', setActivityLogs);

      // Colecciones filtradas por municipio
      setupListener<VolunteerProfile>('volunteers', setVolunteers, 'municipalityId', { field: 'municipalityId', value: user.municipalityId });
      setupListener<PatrolLocation>('patrolLocations', setPatrols, 'timestamp', { field: 'municipalityId', value: user.municipalityId });
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isDemoMode, user?.municipalityId]);

  // Escanear satélite FIRMS, analizar con IA y crear incidencias automáticamente
  const runSatelliteScan = async () => {
    if (isSatelliteScanningRef.current) return;
    isSatelliteScanningRef.current = true;
    setIsSatelliteScanning(true);
    setError(null);
    try {
      const detected = await detectFires(municipalitiesRef.current, incidentsRef.current);
      const newHotspots = detected.map((d) => d.hotspot);

      // Solo actualizar estado si realmente cambió el conjunto de focos, evitando re-renderizados del mapa
      const prevSet = new Set(satelliteHotspotsRef.current.map((h) => h.id));
      const newSet = new Set(newHotspots.map((h) => h.id));
      const hasChanges =
        newSet.size !== prevSet.size ||
        ![...newSet].every((id) => prevSet.has(id));
      if (hasChanges) {
        setSatelliteHotspots(newHotspots);
      }

      // Solo un usuario real puede crear incidencias oficiales; los demás ven los puntos calientes
      if (user && !isDemoMode) {
        let created = 0;
        for (const { incident } of detected) {
          if (!incident) continue;
          await createIncident(incident);
          created++;
        }
        setLastSatelliteScan(new Date().toISOString());
        if (detected.length > 0) {
          await logActivity(
            'ESCANEO_SATELITAL',
            'emergencyEvents',
            'satellite-ai',
            `Escaneo detectó ${detected.length} focos. Se crearon ${created} incidencias automáticas.`
          );
        }
      } else {
        setLastSatelliteScan(new Date().toISOString());
      }
    } catch (err: any) {
      console.error('Error escaneo satelital:', err);
      setError(`Error escaneo satelital: ${err.message}`);
    } finally {
      isSatelliteScanningRef.current = false;
      setIsSatelliteScanning(false);
    }
  };

  // Escanear satélite cada 1 minuto, pero esperar a tener el listado real de municipios
  useEffect(() => {
    if (municipalities.length <= 100 || scanInitializedRef.current) return;
    scanInitializedRef.current = true;
    runSatelliteScan();
    const interval = setInterval(() => {
      runSatelliteScan();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [municipalities]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const updateMapLayers = (newLayers: Partial<MapLayerState>) => {
    setMapLayers((prev) => ({ ...prev, ...newLayers }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const getMunicipalityScope = () => ({
    municipalityId: user?.municipalityId || 'muni_el_tiemblo',
    municipalityName: user?.municipalityName || 'El Tiemblo',
    province: user?.province || 'Ávila',
    autonomousCommunity: user?.autonomousCommunity || 'Castilla y León',
  });

  const logActivity = async (action: string, targetCollection: string, targetDocId: string, details: string) => {
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

    if (!isDemoMode && user) {
      try {
        await addDoc(collection(db, 'activityLogs'), {
          ...newLog,
          createdAt: Timestamp.now(),
        });
      } catch (err) {
        console.warn('Error guardando actividad en Firestore:', err);
      }
    }
  };

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

  const setPublicLocation = (lat: number, lng: number) => {
    setPublicLocationState({ latitude: lat, longitude: lng });
  };

  // Crear Incidencia
  const createIncident = async (incidentData: Omit<EmergencyEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newIncident: EmergencyEvent = {
      ...getMunicipalityScope(),
      ...incidentData,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    setIncidents((prev) => [newIncident, ...prev]);

    if (!isDemoMode) {
      try {
        const docRef = await addDoc(collection(db, 'emergencyEvents'), {
          ...newIncident,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        newIncident.id = docRef.id;
      } catch (err: any) {
        console.error('Error creando incidencia:', err);
        setError(err.message);
      }
    }

    logActivity('CREAR_INCIDENCIA', 'emergencyEvents', newIncident.id, `Reportada incidencia "${newIncident.title}" en ${newIncident.municipalityName}`);
  };

  // Actualizar Estado de Incidencia
  const updateIncidentStatus = async (id: string, status: IncidentStatus, severity?: IncidentSeverity, brigade?: string) => {
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

    if (!isDemoMode) {
      try {
        const docRef = doc(db, 'emergencyEvents', id);
        await updateDoc(docRef, {
          status,
          ...(severity && { severity }),
          ...(brigade && { assignedBrigade: brigade }),
          updatedAt: Timestamp.now(),
        });
      } catch (err: any) {
        console.error('Error actualizando incidencia:', err);
        setError(err.message);
      }
    }

    logActivity('ACTUALIZAR_INCIDENCIA', 'emergencyEvents', id, `Cambio de estado a "${status}" para la incidencia #${id}`);
  };

  // Crear Alerta Poblacional
  const createAlert = async (alertData: Omit<EmergencyAlert, 'id' | 'createdAt' | 'isActive'>) => {
    const newAlert: EmergencyAlert = {
      ...alertData,
      ...getMunicipalityScope(),
      id: `alt-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setAlerts((prev) => [newAlert, ...prev]);

    if (!isDemoMode) {
      try {
        const docRef = await addDoc(collection(db, 'alerts'), {
          ...newAlert,
          createdAt: Timestamp.now(),
        });
        newAlert.id = docRef.id;
      } catch (err: any) {
        console.error('Error creando alerta:', err);
        setError(err.message);
      }
    }

    logActivity('CREAR_ALERTA', 'alerts', newAlert.id, `Alerta de emergencia emitida: "${newAlert.title}" (${newAlert.severity.toUpperCase()})`);
  };

  // Desactivar Alerta
  const dismissAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((item) => (item.id === alertId ? { ...item, isActive: false } : item))
    );

    if (!isDemoMode) {
      try {
        const docRef = doc(db, 'alerts', alertId);
        await updateDoc(docRef, { isActive: false, updatedAt: Timestamp.now() });
      } catch (err: any) {
        console.error('Error desactivando alerta:', err);
        setError(err.message);
      }
    }

    logActivity('CANCELAR_ALERTA', 'alerts', alertId, `Desactivada alerta de emergencia #${alertId}`);
  };

  // Gestiones de Recursos
  const createResource = async (resourceData: Omit<OperationalResource, 'id' | 'updatedAt'>) => {
    const newResource: OperationalResource = {
      ...resourceData,
      ...getMunicipalityScope(),
      id: `res-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    setResources((prev) => [newResource, ...prev]);

    if (!isDemoMode) {
      try {
        const docRef = await addDoc(collection(db, 'resources'), {
          ...newResource,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        newResource.id = docRef.id;
      } catch (err: any) {
        console.error('Error creando recurso:', err);
        setError(err.message);
      }
    }

    logActivity('REGISTRAR_RECURSO', 'resources', newResource.id, `Alta de recurso operativo "${newResource.name}"`);
  };

  const updateResourceStatus = async (id: string, status: OperationalResource['status']) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
    );

    if (!isDemoMode) {
      try {
        const docRef = doc(db, 'resources', id);
        await updateDoc(docRef, { status, updatedAt: Timestamp.now() });
      } catch (err: any) {
        console.error('Error actualizando recurso:', err);
        setError(err.message);
      }
    }

    logActivity('ESTADO_RECURSO', 'resources', id, `Cambio de disponibilidad a "${status}" para recurso #${id}`);
  };

  // Solicitud de Cesión de Recursos Intermunicipal
  const requestResourceShare = async (requestData: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: ResourceRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };

    setResourceRequests((prev) => [newRequest, ...prev]);

    if (!isDemoMode) {
      try {
        const docRef = await addDoc(collection(db, 'resourceRequests'), {
          ...newRequest,
          createdAt: Timestamp.now(),
        });
        newRequest.id = docRef.id;
      } catch (err: any) {
        console.error('Error solicitando cesión:', err);
        setError(err.message);
      }
    }

    logActivity('SOLICITAR_CESION', 'resourceRequests', newRequest.id, `Solicitados recursos a ${newRequest.targetMunicipalityName}`);
  };

  const updateResourceRequestStatus = async (id: string, status: ResourceRequest['status']) => {
    setResourceRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );

    if (!isDemoMode) {
      try {
        const docRef = doc(db, 'resourceRequests', id);
        await updateDoc(docRef, { status, updatedAt: Timestamp.now() });
      } catch (err: any) {
        console.error('Error actualizando solicitud:', err);
        setError(err.message);
      }
    }

    logActivity('RESPUESTA_CESION', 'resourceRequests', id, `Solicitud de cesión #${id} marcada como "${status}"`);
  };

  // Emitir Bando
  const createBandoMessage = async (msgData: Omit<BandoMessage, 'id' | 'createdAt'>) => {
    const newMsg: BandoMessage = {
      ...msgData,
      ...getMunicipalityScope(),
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [newMsg, ...prev]);

    if (!isDemoMode) {
      try {
        const docRef = await addDoc(collection(db, 'messages'), {
          ...newMsg,
          createdAt: Timestamp.now(),
        });
        newMsg.id = docRef.id;
      } catch (err: any) {
        console.error('Error emitiendo bando:', err);
        setError(err.message);
      }
    }

    logActivity('EMITIR_BANDO', 'messages', newMsg.id, `Publicado comunicado oficial: "${newMsg.title}"`);
  };

  // Actualizar disponibilidad Voluntario
  const updateVolunteerAvailability = async (uid: string, isAvailableNow: boolean) => {
    setVolunteers((prev) =>
      prev.map((v) => (v.uid === uid ? { ...v, isAvailableNow, updatedAt: new Date().toISOString() } : v))
    );

    if (!isDemoMode) {
      try {
        const docRef = doc(db, 'volunteers', uid);
        await updateDoc(docRef, { isAvailableNow, updatedAt: Timestamp.now() });
      } catch (err: any) {
        console.error('Error actualizando voluntario:', err);
        setError(err.message);
      }
    }
  };

  // Actualizar Patrulla GPS
  const updatePatrolLocation = async (patrolData: Omit<PatrolLocation, 'id' | 'timestamp'>) => {
    const newPatrol: PatrolLocation = {
      ...patrolData,
      id: `patrol-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setPatrols((prev) => [newPatrol, ...prev.filter((p) => p.uid !== patrolData.uid)]);

    if (!isDemoMode) {
      try {
        const docRef = doc(db, 'patrolLocations', patrolData.uid);
        await setDoc(
          docRef,
          {
            ...newPatrol,
            timestamp: Timestamp.now(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.error('Error actualizando patrulla:', err);
        setError(err.message);
      }
    }
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
        publicLocation,
        setPublicLocation,
        isLoading,
        error,
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
        runSatelliteScan,
        isSatelliteScanning,
        lastSatelliteScan,
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
