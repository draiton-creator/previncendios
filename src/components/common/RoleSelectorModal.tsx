/**
 * Modal de Selección de Rol Operativo - Previncendios España
 */

import React from 'react';
import { Shield, Building, Users, User, Eye, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import { UserRole } from '../../types';

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({ isOpen, onClose }) => {
  const { user, role, loginDemoRole, isAuthenticated, isDemoMode, logout } = useAuth();
  const { municipalities } = useEmergency();

  if (!isOpen) return null;

  const rolesList: {
    id: UserRole;
    title: string;
    description: string;
    icon: React.ElementType;
    badge: string;
    features: string[];
    color: string;
  }[] = [
    {
      id: 'superadmin',
      title: '1. Superadministrador',
      description: 'Dirección Nacional de Emergencias y Protección Civil.',
      icon: Shield,
      badge: 'Acceso Total',
      features: [
        'Gestión global de España y 17 Comunidades Autónomas',
        'Validación de ayuntamientos, roles y catálogos',
        'Auditoría completa de acciones e incidencias',
        'Acceso a mapa nacional y sensores FIRMS NASA',
      ],
      color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
    },
    {
      id: 'ayuntamiento',
      title: '2. Ayuntamiento / Mando Local',
      description: 'CECOPAL, Protección Civil Local y Alcaldía.',
      icon: Building,
      badge: 'Operaciones Municipales',
      features: [
        'Emisión de alertas poblacionales y evacuación',
        'Gestión de autobombas, retenes y puntos de agua',
        'Solicitud y cesión de recursos intermunicipales',
        'Publicación de bandos oficiales',
      ],
      color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
    },
    {
      id: 'voluntario',
      title: '3. Voluntario Acreditado',
      description: 'Especialistas 4x4, motoserristas, radio y apoyo.',
      icon: Users,
      badge: 'Perfil Avanzado',
      features: [
        'Reporte urgente de incendios con fotos y GPS',
        'Compartición de ubicación en patrulla autorizada',
        'Registro de equipamiento (4x4, motobomba, radio)',
        'Acceso a canal de instrucciones técnicas',
      ],
      color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
    },
    {
      id: 'ciudadano',
      title: '4. Ciudadano Registrado',
      description: 'Vecinos del municipio y residentes.',
      icon: User,
      badge: 'Residente / Avisos',
      features: [
        'Avisos de proximidad en tiempo real',
        'Notificación ciudadana con evidencia fotográfica',
        'Confirmación de disponibilidad voluntaria',
        'Rutas seguras y refugios de evacuación',
      ],
      color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    },
    {
      id: 'invitado',
      title: '5. Invitado (Consulta Pública)',
      description: 'Sin necesidad de registro previo.',
      icon: Eye,
      badge: 'Acceso Limitado',
      features: [
        'Consulta de mapa de incendios de acceso público',
        'Lectura de bandos e instrucciones de emergencia',
        'Recomendaciones oficiales AEMET',
        'Sin visibilidad de coordenadas exactas de brigadas',
      ],
      color: 'border-gray-400 bg-gray-50/50 dark:bg-gray-800/20',
    },
  ];

  const handleSelectRole = (roleId: UserRole) => {
    loginDemoRole(roleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {/* Cabecera Modal */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              {isDemoMode ? 'Simulación Operativa por Roles' : 'Perfil y Rol de Usuario'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isDemoMode
                ? 'Seleccione un rol para evaluar la interfaz, permisos y mapa interactivo'
                : `Sesión activa: ${user?.displayName || user?.email} (${role.toUpperCase()})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Roles */}
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {rolesList.map((item) => {
            const Icon = item.icon;
            const isCurrent = role === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectRole(item.id)}
                className={`group relative cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
                  item.color
                } ${isCurrent ? 'ring-2 ring-red-600 dark:ring-red-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-white p-2 text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white">
                      <Icon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-xs text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>

                <ul className="mt-3 space-y-1 border-t border-gray-200/60 pt-2 text-[11px] text-gray-500 dark:border-gray-700/60 dark:text-gray-400">
                  {item.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center space-x-1.5">
                      <span className="h-1 w-1 rounded-full bg-red-500"></span>
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Pie */}
        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
