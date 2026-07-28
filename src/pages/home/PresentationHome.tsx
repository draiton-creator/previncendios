/**
 * Home Principal de Presentación de la Aplicación
 * Previncendios España - Red Nacional de Prevención y Respuesta Civil
 */

import React from 'react';
import {
  Flame,
  Shield,
  MapPin,
  Users,
  Building2,
  Mail,
  Bell,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Radio,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PresentationHomeProps {
  onNavigateTab: (tab: string) => void;
  onOpenRegisterModal: () => void;
  onOpenRoleModal: () => void;
}

export const PresentationHome: React.FC<PresentationHomeProps> = ({
  onNavigateTab,
  onOpenRegisterModal,
  onOpenRoleModal,
}) => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-gray-900 to-red-950 p-8 sm:p-12 text-white shadow-2xl border border-red-900/30">
        <div className="absolute -right-12 -top-12 h-96 w-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-12 h-64 w-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-red-300 border border-red-500/30">
            <Radio className="h-3.5 w-3.5 animate-pulse text-red-400" />
            <span>Plataforma Oficial de Prevención e Intervención</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Red Civil de Alerta Temprana y <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-400">Coordinación de Incendios</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-normal">
            Previncendios España es la infraestructura digital municipal e interprovincial que conecta a ciudadanos, voluntariado de apoyo 4x4, ayuntamientos y puestos de mando para la respuesta inmediata ante fuegos de interfaz e incendios forestales.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigateTab('mapa')}
              className="inline-flex items-center space-x-2.5 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-red-600/40 hover:bg-red-700 transition-all transform hover:-translate-y-0.5"
            >
              <MapPin className="h-5 w-5" />
              <span>Ver Mapa GPS en Vivo</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onOpenRegisterModal}
              className="inline-flex items-center space-x-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-gray-900 shadow-lg hover:bg-gray-100 transition-all transform hover:-translate-y-0.5"
            >
              <UserPlus className="h-5 w-5 text-red-600" />
              <span>Registrarse en la Red</span>
            </button>

            <button
              onClick={onOpenRoleModal}
              className="inline-flex items-center space-x-2 rounded-2xl bg-white/10 backdrop-blur px-5 py-3.5 text-sm font-bold text-gray-200 hover:bg-white/20 transition border border-white/20"
            >
              <Shield className="h-4 w-4 text-amber-400" />
              <span>Modo Evaluación Roles</span>
            </button>
          </div>
        </div>
      </div>

      {/* Módulos Destacados / Presentación de Capacidades */}
      <div>
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Infraestructura Completa para la Seguridad Municipal
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Diseñada para garantizar la máxima rapidez de aviso, movilización de retenes civiles y comunicación transparente con la población.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Detección Temprana */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 mb-4">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Detección Temprana y Foco en Mapa
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Reporte inmediato de avistamientos de humo con foto, coordenadas GPS en tiempo real y categorización automática del riesgo.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('incidencias')}
              className="mt-6 flex items-center text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <span>Ver Incidencias Activas</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>

          {/* Card 2: Retén de Voluntarios */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Retén Civil & Botón "Voy en Camino"
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Coordinación de voluntarios acreditados con vehículos 4x4, cisternas particulares, motos y apoyo logístico de avituallamiento.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('voluntarios')}
              className="mt-6 flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <span>Ver Panel de Voluntarios</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>

          {/* Card 3: Puesto de Mando Municipal */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Gestión para Ayuntamientos & CECOPI
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Emisión de Bandos municipales oficiales, petición de refuerzos de maquinaria pesada y sincronización con el 112.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="mt-6 flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <span>Acceder al Cuadro Municipal</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>

          {/* Card 4: Difusión por Gmail y Contactos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Boletines por Gmail & Google Contacts
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Importación de agendas de emergencia y envío de boletines masivos por correo electrónico institucional.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('comunicaciones')}
              className="mt-6 flex items-center text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <span>Probar Envíos por Gmail</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>

          {/* Card 5: Base de Datos Firestore */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-4">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Base de Datos y Registros Firestore
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Persistencia segura en la nube para perfiles, actas de movilización, registros de voluntarios y auditoría.
              </p>
            </div>
            <button
              onClick={onOpenRegisterModal}
              className="mt-6 flex items-center text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              <span>Crear Perfil en BD</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>

          {/* Card 6: Alertas a la Población */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 mb-4">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Centro de Alertas Civiles
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Notificaciones push y banners de confinamiento o evacuación preventiva en zonas rurales y urbanas.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('alertas')}
              className="mt-6 flex items-center text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              <span>Ver Alertas Activas</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Sección Registro por Rol / Llamada a la Acción */}
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
              ¿Quieres unirte a la Red de Emergencias?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl">
              Registra tu cuenta como ciudadano vecino, voluntario de primera intervención o representante del ayuntamiento. Todos los perfiles están vinculados y sincronizados en la base de datos de la plataforma.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenRegisterModal}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-red-700 transition"
            >
              Registrar Cuenta Ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
