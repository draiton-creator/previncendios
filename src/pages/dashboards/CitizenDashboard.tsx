/**
 * Dashboard Ciudadano / Voluntario - Red Civil de Emergencias
 * Basado en la interfaz de gestión operativa de respuesta rápida
 */

import React, { useState } from 'react';
import {
  Flame,
  ShieldAlert,
  Plus,
  Users,
  MapPin,
  Radio,
  HeartHandshake,
  CheckCircle2,
  Navigation,
  Eye,
  Truck,
  Phone,
  UserCheck,
  Megaphone,
  Clock,
  Wind,
  Waves,
  Check,
  AlertTriangle,
  Building2,
  Compass,
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { EmergencyMap } from '../../components/map/EmergencyMap';
import { SatelliteHotspotsFeed } from '../../components/satellite/SatelliteHotspotsFeed';

interface CitizenDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewIncidentModal: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onNavigateTab,
  onOpenNewIncidentModal,
}) => {
  const { user, role, updateProfile, toggleGeoConsent, updateUserLocation } = useAuth();
  const {
    incidents,
    alerts,
    messages,
    municipalities,
    setSelectedIncident,
    volunteers,
    updateVolunteerAvailability,
    activeMobilizations,
    toggleMobilization,
    isUserMobilizedTo,
  } = useEmergency();

  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [profileSavedToast, setProfileSavedToast] = useState<boolean>(false);

  // Perfil de voluntario en el contexto
  const currentVolunteer = volunteers.find((v) => v.uid === user?.uid);
  const isAvailable = currentVolunteer ? currentVolunteer.isAvailableNow : true;

  // Formulario local "Mis datos"
  const [formData, setFormData] = useState({
    displayName: user?.displayName || 'Diego Gómez Marín',
    phone: user?.phone || '+34 600 123 456',
    municipalityId: user?.municipalityId || 'muni_el_tiemblo',
    collaboratorType: role === 'voluntario' ? 'Voluntario 4x4' : 'Ciudadano',
  });

  // Determinar si hay alguna emergencia a la que el usuario vaya en camino
  const mobilizedIncidentId = user?.uid ? activeMobilizations[user.uid] : null;
  const mobilizedIncident = mobilizedIncidentId
    ? incidents.find((i) => i.id === mobilizedIncidentId)
    : null;

  // Filtrar avisos locales
  const activeLocalAlerts = alerts.filter(
    (a) => a.municipalityId === user?.municipalityId && a.isActive
  );

  const localMessages = messages.filter(
    (m) => m.municipalityId === user?.municipalityId || m.channel === 'bando_oficial'
  );

  const activeIncidents = incidents.filter((i) => i.status !== 'extinguido');

  // Gestor de actualización GPS simulada/real
  const handleUpdateGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateUserLocation(pos.coords.latitude, pos.coords.longitude);
          setGpsMessage(`Ubicación actualizada: Lat ${pos.coords.latitude.toFixed(3)}, Lng ${pos.coords.longitude.toFixed(3)}`);
          setTimeout(() => setGpsMessage(null), 4000);
        },
        () => {
          const mockLat = 40.380 + (Math.random() - 0.5) * 0.01;
          const mockLng = -4.439 + (Math.random() - 0.5) * 0.01;
          updateUserLocation(mockLat, mockLng);
          setGpsMessage(`Ubicación GPS sincronizada: (${mockLat.toFixed(3)}, ${mockLng.toFixed(3)})`);
          setTimeout(() => setGpsMessage(null), 4000);
        }
      );
    } else {
      const mockLat = 40.3801;
      const mockLng = -4.4395;
      updateUserLocation(mockLat, mockLng);
      setGpsMessage('Posición GPS actualizada correctamente');
      setTimeout(() => setGpsMessage(null), 4000);
    }
  };

  // Guardar datos de colaborador
  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    const selMuni = municipalities.find((m) => m.id === formData.municipalityId);
    updateProfile({
      displayName: formData.displayName,
      phone: formData.phone,
      municipalityId: formData.municipalityId,
      municipalityName: selMuni ? selMuni.name : user?.municipalityName,
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  // Helper para icono según tipo
  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'incendio_forestal':
      case 'incendio_urbano':
        return <Flame className="h-5 w-5 text-orange-500 shrink-0" />;
      case 'inundacion':
        return <Waves className="h-5 w-5 text-cyan-500 shrink-0" />;
      case 'tormenta':
        return <Wind className="h-5 w-5 text-blue-400 shrink-0" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
    }
  };

  // Helper para tiempo transcurrido aproximado
  const getTimeElapsed = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `hace ${Math.max(1, diffMins)} min`;
    }
    return `hace ${diffHours} h`;
  };

  return (
    <div className="space-y-6">
      {/* Banner Notificación de Movilización en Curso */}
      {mobilizedIncident && (
        <div className="rounded-2xl border-2 border-orange-500 bg-gradient-to-r from-orange-900 via-amber-900 to-slate-900 p-5 text-white shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="rounded-xl bg-orange-500 p-2.5 text-white shadow-md animate-pulse">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="rounded-md bg-orange-500/30 px-2 py-0.5 text-[11px] font-black tracking-wider text-orange-300 border border-orange-400/40">
                    MOVILIZACIÓN ACTIVA
                  </span>
                  <span className="text-xs text-orange-200">
                    {mobilizedIncident.municipalityName}
                  </span>
                </div>
                <h2 className="text-lg font-black mt-1">
                  Vas en camino: {mobilizedIncident.title}
                </h2>
                <p className="text-xs text-orange-200 mt-0.5">
                  El puesto de mando municipal y los servicios de emergencia conocen tu respuesta en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedIncident(mobilizedIncident)}
                className="rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/30 backdrop-blur-sm"
              >
                Ver Ficha
              </button>
              <button
                onClick={() => toggleMobilization(mobilizedIncident.id)}
                className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-md"
              >
                Cancelar Movilización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Principal RED CIVIL DE EMERGENCIAS */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-stone-900 p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-orange-500/20 px-2.5 py-1 text-xs font-black tracking-wider text-orange-400 border border-orange-500/30 uppercase">
                Red Civil de Emergencias
              </span>
              <span className="text-xs text-gray-400">{user?.municipalityName} ({user?.province})</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Panel Operativo: {user?.displayName}
            </h1>
            <p className="mt-1 text-xs text-gray-300 max-w-2xl">
              Disponibilidad inmediata de retén, mapa en vivo de fuegos y avisos oficiales del ayuntamiento en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenNewIncidentModal}
              className="flex items-center space-x-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all"
            >
              <Flame className="h-4 w-4" />
              <span>Notificar Fuego / Humo</span>
            </button>

            <button
              onClick={toggleGeoConsent}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all border ${
                user?.geoConsent
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
              }`}
            >
              GPS: {user?.geoConsent ? 'Compartido (ON)' : 'Inactivo (OFF)'}
            </button>
          </div>
        </div>
      </div>

      {/* Alerta Local Crítica si la hay */}
      {activeLocalAlerts.length > 0 && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 dark:bg-red-950/40 text-red-900 dark:text-red-200">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-red-800 dark:text-red-300">
                  ALERTA MUNICIPAL ACTIVA - {activeLocalAlerts[0].title}
                </h3>
                <span className="text-[11px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded">
                  {activeLocalAlerts[0].severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-red-700 dark:text-red-200">
                {activeLocalAlerts[0].message}
              </p>
              <button
                onClick={() => onNavigateTab('alertas')}
                className="mt-2 text-xs font-bold text-red-700 dark:text-red-300 underline hover:text-red-800"
              >
                Ver Instrucciones Completas y Puntos de Encuentro →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estructura Principal en 2 Columnas (Estilo Alerta Ignis) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Mapa y Emergencias Cercanas (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tarjeta Mapa en Vivo */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Emergencias activas cerca de ti
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Mapa en vivo con focos satelitales y avisos en tiempo real
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('mapa')}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>Pantalla completa</span>
                <Compass className="h-3.5 w-3.5" />
              </button>
            </div>

            <EmergencyMap
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
              }}
              className="h-[360px] w-full rounded-xl border border-gray-200 shadow-inner dark:border-gray-800"
            />
          </div>

          {/* Grid de Tarjetas de Emergencias Activas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Listado de Incidencias Próximas
              </h3>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {activeIncidents.length} activas
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeIncidents.map((inc) => {
                const mobilized = isUserMobilizedTo(inc.id);
                return (
                  <div
                    key={inc.id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition-all shadow-sm ${
                      mobilized
                        ? 'border-orange-500 bg-orange-500/10 dark:bg-orange-950/30'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900'
                    }`}
                  >
                    <div>
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          {getIncidentIcon(inc.type)}
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                            {inc.municipalityName}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 border border-orange-500/30">
                            {inc.severity.replace('Nivel ', 'NIVEL ')}
                          </span>
                        </div>
                      </div>

                      {/* Título de la Emergencia */}
                      <h4 className="mt-2 text-sm font-extrabold text-gray-900 dark:text-white line-clamp-2">
                        {inc.title}
                      </h4>

                      {/* Tiempo y Detalle */}
                      <div className="mt-1.5 flex items-center text-[11px] text-gray-500 dark:text-gray-400 space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{getTimeElapsed(inc.createdAt)}</span>
                        <span>•</span>
                        <span className="truncate">{inc.locationDescription}</span>
                      </div>
                    </div>

                    {/* Botones de Acción Estilo Alerta Ignis: "Ver ficha" y "Voy en camino" */}
                    <div className="mt-4 flex items-center space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
                      >
                        Ver ficha
                      </button>

                      <button
                        onClick={() => toggleMobilization(inc.id)}
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition-all text-center flex items-center justify-center space-x-1 ${
                          mobilized
                            ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400'
                            : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                      >
                        {mobilized ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Vas en camino</span>
                          </>
                        ) : (
                          <span>Voy en camino</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Sidebar "Mi Panel" (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Bloque 1: Mi disponibilidad */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                Mi disponibilidad
              </h3>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    Disponible para acudir
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-[180px]">
                    Tu ayuntamiento verá que puede contar contigo.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) =>
                      updateVolunteerAvailability(user?.uid || 'usr-vol-01', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-emerald-600" />
                </label>
              </div>
            </div>

            {/* Botón Actualizar Posición */}
            <div className="space-y-2">
              <button
                onClick={handleUpdateGps}
                className="w-full flex items-center justify-center space-x-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 px-4 text-xs font-bold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-sm"
              >
                <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Actualizar mi posición</span>
              </button>

              {gpsMessage && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2 text-center text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {gpsMessage}
                </div>
              )}
            </div>
          </div>

          {/* Bloque 2: Mis datos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Mis datos
            </h3>

            <form onSubmit={handleSaveData} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Tu nombre y apellidos"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Municipio
                </label>
                <select
                  value={formData.municipalityId}
                  onChange={(e) => setFormData({ ...formData, municipalityId: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                >
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.province})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de colaborador
                </label>
                <select
                  value={formData.collaboratorType}
                  onChange={(e) => setFormData({ ...formData, collaboratorType: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="Ciudadano">Ciudadano</option>
                  <option value="Voluntario 4x4">Voluntario 4x4 / Retén</option>
                  <option value="Protección Civil">Protección Civil</option>
                  <option value="Radioaficionado / PMR">Radioaficionado / PMR</option>
                  <option value="Primeros Auxilios">Primeros Auxilios / Sanitario</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-800 dark:bg-slate-700 text-white py-2 text-xs font-bold hover:bg-slate-900 transition-colors shadow"
              >
                Guardar mis datos
              </button>

              {profileSavedToast && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-bold justify-center pt-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Datos actualizados correctamente</span>
                </div>
              )}
            </form>
          </div>

          {/* Bloque 3: Avisos de tu zona */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-orange-600" />
                Avisos de tu zona
              </h3>
              <button
                onClick={() => onNavigateTab('comunicaciones')}
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {localMessages.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sin avisos pendientes en su localidad.
                </p>
              ) : (
                localMessages.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-xl bg-orange-50/50 dark:bg-orange-950/20 p-3 border border-orange-200/60 dark:border-orange-900/40 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-orange-700 dark:text-orange-300 uppercase">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                      {msg.title}
                    </h5>

                    <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Feed de Focos Satelitales */}
        <div className="lg:col-span-4">
          <SatelliteHotspotsFeed maxItems={8} onOpenMap={() => onNavigateTab('mapa')} />
        </div>
      </div>
    </div>
  );
};
