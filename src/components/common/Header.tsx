/**
 * Header de la Aplicación - Previncendios España
 */

import React, { useState } from 'react';
import {
  Flame,
  Shield,
  Bell,
  Sun,
  Moon,
  UserCheck,
  UserPlus,
  MapPin,
  ChevronDown,
  Activity,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useEmergency } from '../../context/EmergencyContext';
import { UserRole } from '../../types';

const hasRealFirms = !!import.meta.env.VITE_FIRMS_API_KEY;
const hasRealWeather = !!import.meta.env.VITE_OPENWEATHER_API_KEY;
const hasGemini = !!import.meta.env.VITE_GEMINI_API_KEY;
const isSimulationMode = !hasRealFirms || !hasRealWeather;

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenRoleModal: () => void;
  onOpenRegisterModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenRoleModal,
  onOpenRegisterModal,
}) => {
  const { user, role, logout, isAuthenticated, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { alerts, activeEmergencyCount } = useEmergency();

  const activeAlertsCount = alerts.filter((a) => a.isActive).length;

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'ayuntamiento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'voluntario':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'ciudadano':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'invitado':
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'superadmin':
        return 'Superadministración Central';
      case 'ayuntamiento':
        return 'Personal Municipal';
      case 'voluntario':
        return 'Voluntario Acreditado';
      case 'ciudadano':
        return 'Ciudadano Registrado';
      case 'invitado':
        return 'Invitado (Consulta Pública)';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 sm:px-6">
      {/* Lado Izquierdo - Logo y Botón Menú */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Abrir Menú Navegación"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-white shadow-md shadow-red-500/20">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Previncendios <span className="text-red-600 dark:text-red-500">ESPAÑA</span>
              </span>
              <span className="hidden rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300 sm:inline-block">
                SISTEMA OPERATIVO
              </span>
              {isSimulationMode && (
                <span
                  className="hidden rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300 sm:inline-block"
                  title="Datos de FIRMS y/o OpenWeather no configurados. Añade las claves en .env para detección real."
                >
                  MODO SIMULACIÓN
                </span>
              )}
            </div>
            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
              Red Nacional de Coordinación y Alerta Temprana
            </p>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Selector de Rol, Tema, Notificaciones y Perfil */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Indicador de Alertas Activas */}
        {activeAlertsCount > 0 && (
          <div className="hidden items-center space-x-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            <span>{activeAlertsCount} Alertas Activas</span>
          </div>
        )}

        {/* Botón Registrarse */}
        <button
          onClick={onOpenRegisterModal}
          className="flex items-center space-x-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Registrarse</span>
        </button>

        {/* Botón Selector de Rol Demo */}
        <button
          onClick={onOpenRoleModal}
          className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all hover:shadow-sm ${getRoleBadgeColor(
            role
          )}`}
          title={isDemoMode ? 'Cambiar de rol de evaluación (modo demo)' : 'Ver perfil y roles'}
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden md:inline">
            {getRoleLabel(role)}
            {isDemoMode && ' · DEMO'}
          </span>
          <span className="md:hidden">{role.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {/* Botón Logout */}
        {isAuthenticated && !isDemoMode && (
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        )}

        {/* Botón Cambiar Tema Modo Claro/Oscuro */}
        <button
          onClick={toggleTheme}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm"
          title={`Modo actual: ${theme === 'light' ? 'Claro' : 'Oscuro'}. Clic para cambiar.`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-4 w-4 text-slate-700" />
              <span className="hidden sm:inline">Modo Oscuro</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          )}
        </button>

        {/* Info Municipio Activo */}
        {user && (
          <div className="hidden items-center space-x-1 text-xs font-medium text-gray-600 dark:text-gray-300 lg:flex">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            <span>{user.municipalityName} ({user.province})</span>
          </div>
        )}
      </div>
    </header>
  );
};
