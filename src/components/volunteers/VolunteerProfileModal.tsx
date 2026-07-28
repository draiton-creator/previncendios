/**
 * Componente de Perfil y Ficha Operativa de Voluntario - Previncendios España
 * Incluye campos para Formación, Disponibilidad, Vehículo y Herramientas/Equipamiento.
 * Conectado e integrado directamente con la base de datos Firebase Firestore.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Clock,
  Truck,
  Wrench,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  MapPin,
  Save,
  Flame,
  Phone,
  Mail,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { VolunteerProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import {
  saveVolunteerProfileToFirestore,
  getVolunteerProfileFromFirestore,
} from '../../services/volunteerProfileService';
import { Badge } from '../common/Badge';

interface VolunteerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer?: VolunteerProfile | null; // Si se pasa, es para ver/editar. Si no, usa el voluntario logueado.
  readOnly?: boolean;
}

// Cursos predefinidos comunes en extinción y emergencias
const AVAILABLE_TRAININGS = [
  'Curso Básico de Incendios Forestales (CBIF)',
  'Primeros Auxilios y Soporte Vital Básico (SVB)',
  'Manejo Seguro de Motosierra y Cortafuegos',
  'Conducción Evasiva y Operación Off-Road 4x4',
  'Licencia de Radioaficionado / Red Remer Tetrapol',
  'Operador de Autobomba Ligera y Pesada',
  'Manejo de Herramientas Combinadas Gorgui y Pulaski',
  'Orientación, Cartografía y Cartomapeo Forestal',
  'EPI e Higiene Térmica en Extinción',
];

// Herramientas predefinidas
const AVAILABLE_TOOLS = [
  'Batefuegos Forestal',
  'Azada Pulaski',
  'Herramienta Combinada Gorgui',
  'Rastrillo McLeod',
  'Mochila Extintora de Agua (20L)',
  'Motosierra Forestal Profesionial',
  'Motobomba Portátil de Agua (600L/min)',
  'Generador Eléctrico Portátil',
  'Antorcha de Goteo para Contrafuego',
  'Mangueras de Alta Presión 25mm / 45mm',
  'Botiquín de Rescate y Soporte Vital',
];

export const VolunteerProfileModal: React.FC<VolunteerProfileModalProps> = ({
  isOpen,
  onClose,
  volunteer: initialVolunteer,
  readOnly = false,
}) => {
  const { user, role } = useAuth();
  const { updateVolunteerAvailability, municipalities } = useEmergency();

  const isSelf = !initialVolunteer || initialVolunteer.uid === user?.uid;
  const canEdit = !readOnly && (isSelf || role === 'superadmin' || role === 'ayuntamiento');

  const [activeTab, setActiveTab] = useState<'formacion' | 'disponibilidad' | 'vehiculo' | 'herramientas' | 'general'>('formacion');

  // Estado del Formulario
  const [profile, setProfile] = useState<VolunteerProfile>({
    uid: initialVolunteer?.uid || user?.uid || `vol-${Date.now()}`,
    userName: initialVolunteer?.userName || user?.displayName || 'Voluntario Acreditado',
    municipalityId: initialVolunteer?.municipalityId || user?.municipalityId || 'muni_el_tiemblo',
    municipalityName: initialVolunteer?.municipalityName || user?.municipalityName || 'El Tiemblo',
    province: initialVolunteer?.province || user?.province || 'Ávila',
    phone: initialVolunteer?.phone || user?.phone || '+34 600 000 000',
    email: initialVolunteer?.email || user?.email || 'voluntario@emergencias.es',
    groupOrAssociation: initialVolunteer?.groupOrAssociation || 'Protección Civil El Tiemblo',
    vehicleType: initialVolunteer?.vehicleType || 'Todoterreno Toyota Hilux 4x4',
    has4x4: initialVolunteer?.has4x4 ?? true,
    hasChainsaw: initialVolunteer?.hasChainsaw ?? false,
    hasWaterPump: initialVolunteer?.hasWaterPump ?? false,
    hasFirstAidCertification: initialVolunteer?.hasFirstAidCertification ?? true,
    epiComplete: initialVolunteer?.epiComplete ?? true,
    radioEquipment: initialVolunteer?.radioEquipment || 'Transceptor Walkie VHF/UHF Tetrapol',
    actionRadiusKm: initialVolunteer?.actionRadiusKm || 25,
    isAvailableNow: initialVolunteer?.isAvailableNow ?? true,
    availabilitySchedule: initialVolunteer?.availabilitySchedule || 'Disponibilidad Inmediata 24/7',
    assignedPatrolZone: initialVolunteer?.assignedPatrolZone || 'Sector Norte - Pista Alta',
    trainings: initialVolunteer?.trainings || [
      'Curso Básico de Incendios Forestales (CBIF)',
      'Primeros Auxilios y Soporte Vital Básico (SVB)',
    ],
    trainingHours: initialVolunteer?.trainingHours || 80,
    vehicleDetails: initialVolunteer?.vehicleDetails || 'Capacidad 5 personas, bola de remolque 3500kg y Winch 5T',
    toolsList: initialVolunteer?.toolsList || ['Batefuegos', 'Azada Pulaski', 'Mochila Extintora 20L'],
    notes: initialVolunteer?.notes || 'Voluntario habilitado para apoyo en primera intervención y patrullaje de vigilancia.',
    updatedAt: new Date().toISOString(),
  });

  const [customTraining, setCustomTraining] = useState('');
  const [customTool, setCustomTool] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar perfil desde Firestore cuando abre el modal
  useEffect(() => {
    if (isOpen) {
      const targetUid = initialVolunteer?.uid || user?.uid;
      if (targetUid) {
        setIsLoading(true);
        getVolunteerProfileFromFirestore(targetUid)
          .then((firestoreData) => {
            if (firestoreData) {
              setProfile(firestoreData);
            } else if (initialVolunteer) {
              setProfile(initialVolunteer);
            }
          })
          .catch((err) => console.error('Error cargando perfil voluntario:', err))
          .finally(() => setIsLoading(false));
      }
    }
  }, [isOpen, initialVolunteer, user]);

  if (!isOpen) return null;

  // Manejador Guardado en Firebase Firestore
  const handleSaveToFirebase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await saveVolunteerProfileToFirestore(profile);
      updateVolunteerAvailability(profile.uid, profile.isAvailableNow);
      setSuccessMessage('¡Perfil de voluntario sincronizado con éxito en Firebase Firestore!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error guardando en Firestore:', err);
      setErrorMessage(err.message || 'Error al guardar datos en la base de datos de Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle de un curso
  const toggleTraining = (courseName: string) => {
    if (!canEdit) return;
    setProfile((prev) => {
      const current = prev.trainings || [];
      const exists = current.includes(courseName);
      const updated = exists ? current.filter((c) => c !== courseName) : [...current, courseName];
      return { ...prev, trainings: updated };
    });
  };

  const addCustomTraining = () => {
    if (!customTraining.trim() || !canEdit) return;
    if (!profile.trainings?.includes(customTraining.trim())) {
      setProfile((prev) => ({
        ...prev,
        trainings: [...(prev.trainings || []), customTraining.trim()],
      }));
    }
    setCustomTraining('');
  };

  // Toggle de una herramienta
  const toggleTool = (toolName: string) => {
    if (!canEdit) return;
    setProfile((prev) => {
      const current = prev.toolsList || [];
      const exists = current.includes(toolName);
      const updated = exists ? current.filter((t) => t !== toolName) : [...current, toolName];

      // Sincronizar flags booleanos clave
      const hasChainsaw = updated.some((t) => t.toLowerCase().includes('motosierra'));
      const hasWaterPump = updated.some((t) => t.toLowerCase().includes('motobomba'));

      return {
        ...prev,
        toolsList: updated,
        hasChainsaw,
        hasWaterPump,
      };
    });
  };

  const addCustomTool = () => {
    if (!customTool.trim() || !canEdit) return;
    if (!profile.toolsList?.includes(customTool.trim())) {
      setProfile((prev) => ({
        ...prev,
        toolsList: [...(prev.toolsList || []), customTool.trim()],
      }));
    }
    setCustomTool('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  {profile.userName}
                </h2>
                <Badge variant={profile.isAvailableNow ? 'success' : 'neutral'}>
                  {profile.isAvailableNow ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                <span>{profile.groupOrAssociation || 'Protección Civil'}</span>
                <span>•</span>
                <span>{profile.municipalityName} ({profile.province})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notificaciones */}
        {successMessage && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center space-x-3 text-xs font-bold shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 flex items-center space-x-3 text-xs font-bold shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pestañas de Navegación Temática */}
        <div className="flex rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('formacion')}
            className={`flex-1 min-w-[110px] rounded-xl py-2 px-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'formacion'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Formación</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disponibilidad')}
            className={`flex-1 min-w-[110px] rounded-xl py-2 px-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'disponibilidad'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Disponibilidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vehiculo')}
            className={`flex-1 min-w-[110px] rounded-xl py-2 px-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'vehiculo'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Vehículo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('herramientas')}
            className={`flex-1 min-w-[110px] rounded-xl py-2 px-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'herramientas'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>Herramientas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 min-w-[110px] rounded-xl py-2 px-3 text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span>General</span>
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* 🎓 TAB: FORMACIÓN Y CERTIFICACIONES */}
          {activeTab === 'formacion' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    Cursos y Capacitaciones Acreditadas
                  </h3>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Horas Lectivas:
                    </label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={profile.trainingHours || 0}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, trainingHours: parseInt(e.target.value) || 0 }))
                      }
                      className="w-20 rounded-xl border border-gray-300 px-2.5 py-1 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_TRAININGS.map((course) => {
                    const isChecked = profile.trainings?.includes(course);
                    return (
                      <button
                        key={course}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleTraining(course)}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-100/70 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                        <span>{course}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Cursos personalizados añadidos */}
                {profile.trainings && profile.trainings.filter((t) => !AVAILABLE_TRAININGS.includes(t)).length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                      Otros Títulos Acreditados:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.trainings
                        .filter((t) => !AVAILABLE_TRAININGS.includes(t))
                        .map((course) => (
                          <span
                            key={course}
                            className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                          >
                            <span>{course}</span>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => toggleTraining(course)}
                                className="text-emerald-700 hover:text-red-600 dark:text-emerald-300 dark:hover:text-red-400"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Añadir Curso Personalizado */}
                {canEdit && (
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Añadir otra titulación o curso oficial..."
                      value={customTraining}
                      onChange={(e) => setCustomTraining(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTraining())}
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomTraining}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Certificación Sanitaria de Primeros Auxilios */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-xl bg-purple-100 p-2 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Certificación Activa de Primeros Auxilios (SVB / DESA)
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Habilita para prestar soporte sanitario de urgencia en evacuaciones
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={profile.hasFirstAidCertification}
                    onChange={(e) => setProfile((prev) => ({ ...prev, hasFirstAidCertification: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* 🕒 TAB: DISPONIBILIDAD Y COBERTURA */}
          {activeTab === 'disponibilidad' && (
            <div className="space-y-4">
              {/* Disponibilidad Actual en Tiempo Real */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    Estado de Disponibilidad en Tiempo Real
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Permite al Puesto de Mando (PMA) saber si puedes ser movilizado inmediatamente
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() =>
                    setProfile((prev) => {
                      const next = !prev.isAvailableNow;
                      updateVolunteerAvailability(prev.uid, next);
                      return { ...prev, isAvailableNow: next };
                    })
                  }
                  className={`rounded-2xl px-4 py-2 text-xs font-black shadow-sm transition-all ${
                    profile.isAvailableNow
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {profile.isAvailableNow ? 'DISPONIBLE EN ACTIVO' : 'NO DISPONIBLE'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Régimen / Horario de Disponibilidad */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Régimen / Horario de Guardia
                  </label>
                  <select
                    disabled={!canEdit}
                    value={profile.availabilitySchedule || 'Disponibilidad Inmediata 24/7'}
                    onChange={(e) => setProfile((prev) => ({ ...prev, availabilitySchedule: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Disponibilidad Inmediata 24/7">Disponibilidad Inmediata 24/7</option>
                    <option value="Tardes y Fines de Semana">Tardes y Fines de Semana</option>
                    <option value="Solo Bajo Llamada de Puesto de Mando">Solo Llamada Puesto Mando (PMA)</option>
                    <option value="Guardias de Fin de Semana">Guardias de Fin de Semana y Festivos</option>
                    <option value="Turno Nocturno de Guardias">Turno Nocturno de Retén</option>
                  </select>
                </div>

                {/* Radio de Acción Operativo (KM) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Radio de Acción Máximo (km)
                  </label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    min={5}
                    max={200}
                    value={profile.actionRadiusKm}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, actionRadiusKm: parseInt(e.target.value) || 25 }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Zona / Sector de Patrulla Asignado */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Zona o Sector de Patrulla Asignado (opcional)
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder="Ej. Sector Norte - Valle Iruelas / Pista del Castañar"
                    value={profile.assignedPatrolZone || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, assignedPatrolZone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 🛻 TAB: VEHÍCULO Y TRANSPORTE */}
          {activeTab === 'vehiculo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Vehículo / Medio
                  </label>
                  <select
                    disabled={!canEdit}
                    value={profile.vehicleType}
                    onChange={(e) => setProfile((prev) => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Todoterreno Toyota Hilux 4x4">Todoterreno 4x4 PickUp</option>
                    <option value="Tractor / Cisterna Agrícola">Tractor / Cisterna Agrícola</option>
                    <option value="Quad / Moto de Campo Todoterreno">Quad / Moto de Campo para Batida</option>
                    <option value="Furgón Ligero 4WD">Furgón Ligero 4WD de Apoyo</option>
                    <option value="A Pie / Retén Terrestre">A Pie / Retén Terrestre</option>
                  </select>
                </div>

                {/* Tracción 4x4 y Bola de remolque */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <div>
                    <label className="text-xs font-bold text-gray-900 dark:text-white block">
                      Tracción Total 4x4 & Bola
                    </label>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Apto para remolque de motobomba
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={profile.has4x4}
                    onChange={(e) => setProfile((prev) => ({ ...prev, has4x4: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Detalles del Vehículo y Capacidad de Carga
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    placeholder="Ej. Capacidad para 5 brigadistas, winche delantero 5T, depósito de agua de 500 Litros con racores Barcelona..."
                    value={profile.vehicleDetails || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, vehicleDetails: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 🛠️ TAB: HERRAMIENTAS Y EQUIPAMIENTO */}
          {activeTab === 'herramientas' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  Herramientas Manuales y Técnicas Disponibles
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_TOOLS.map((tool) => {
                    const isChecked = profile.toolsList?.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleTool(tool)}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          isChecked
                            ? 'border-amber-500 bg-amber-100/70 text-amber-950 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-200 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            isChecked ? 'text-amber-600 dark:text-amber-400' : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                        <span>{tool}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Herramientas personalizadas */}
                {profile.toolsList && profile.toolsList.filter((t) => !AVAILABLE_TOOLS.includes(t)).length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                      Otras Herramientas Registradas:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.toolsList
                        .filter((t) => !AVAILABLE_TOOLS.includes(t))
                        .map((tool) => (
                          <span
                            key={tool}
                            className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-950 dark:bg-amber-900/60 dark:text-amber-200"
                          >
                            <span>{tool}</span>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => toggleTool(tool)}
                                className="text-amber-700 hover:text-red-600 dark:text-amber-300 dark:hover:text-red-400"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Añadir Herramienta Personalizada */}
                {canEdit && (
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Añadir otra herramienta o equipo especial..."
                      value={customTool}
                      onChange={(e) => setCustomTool(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTool())}
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomTool}
                      className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Equipamiento de Protección Individual y Radio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      EPI Forestal Completo (NOMEX)
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Casco, guantes ignífugos, gafas y FFP3
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={profile.epiComplete ?? true}
                    onChange={(e) => setProfile((prev) => ({ ...prev, epiComplete: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Equipamiento de Comunicaciones Radio
                  </label>
                  <select
                    disabled={!canEdit}
                    value={profile.radioEquipment}
                    onChange={(e) => setProfile((prev) => ({ ...prev, radioEquipment: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Transceptor Walkie VHF/UHF Tetrapol">Walkie VHF/UHF Banderas Protección Civil</option>
                    <option value="Emisora Fija en Vehículo 4x4 (50W)">Emisora Fija 4x4 (50W)</option>
                    <option value="Walkie PMR446 Libres">Walkies PMR446 Libres</option>
                    <option value="Solo Teléfono Móvil y WhatsApp">Solo Teléfono Móvil / Cobertura Movistar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 👤 TAB: GENERAL Y DATOS DE CONTACTO */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Voluntario / Brigadista
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={profile.userName}
                    onChange={(e) => setProfile((prev) => ({ ...prev, userName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Agrupación / Colectivo
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder="Ej. Agrupación Voluntarios Protección Civil"
                    value={profile.groupOrAssociation || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, groupOrAssociation: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono Móvil de Urgencias
                  </label>
                  <input
                    type="tel"
                    disabled={!canEdit}
                    value={profile.phone || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    disabled={!canEdit}
                    value={profile.email || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Municipio Base
                  </label>
                  <select
                    disabled={!canEdit}
                    value={profile.municipalityId}
                    onChange={(e) => {
                      const selectedMuni = municipalities.find((m) => m.id === e.target.value);
                      setProfile((prev) => ({
                        ...prev,
                        municipalityId: e.target.value,
                        municipalityName: selectedMuni ? selectedMuni.name : prev.municipalityName,
                        province: selectedMuni ? selectedMuni.province : prev.province,
                      }));
                    }}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Notas y Observaciones Operativas
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    placeholder="Instrucciones especiales, alergias, conocimientos del terreno..."
                    value={profile.notes || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de Página del Modal */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 shrink-0">
          <div className="text-[11px] text-gray-400 dark:text-gray-500">
            Última actualización: {new Date(profile.updatedAt).toLocaleString('es-ES')}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition"
            >
              Cerrar
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleSaveToFirebase}
                disabled={isSaving}
                className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sincronizando con Firebase...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Guardar Ficha en Firebase</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
