/**
 * Contexto de Autenticación y Gestión de Roles y Permisos
 * Previncendios España
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole, GeoPoint } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  loginDemoRole: (role: UserRole, municipalityId?: string) => void;
  logout: () => void;
  updateProfile: (updatedData: Partial<UserProfile>) => void;
  toggleGeoConsent: () => void;
  updateUserLocation: (lat: number, lng: number) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const defaultSuperAdmin: UserProfile = {
  uid: 'usr-superadmin-01',
  email: 'superadmin@previncendios.gob.es',
  displayName: 'Admin Central Dirección General',
  role: 'superadmin',
  municipalityId: 'muni_el_tiemblo',
  municipalityName: 'El Tiemblo',
  province: 'Ávila',
  autonomousCommunity: 'Castilla y León',
  phone: '+34 91 555 0100',
  geoConsent: true,
  currentLocation: { latitude: 40.3801, longitude: -4.4395 },
  isVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultAyuntamiento: UserProfile = {
  uid: 'usr-ayto-tiemblo',
  email: 'emergencias@eltiemblo.es',
  displayName: 'Ayuntamiento de El Tiemblo (Oficial)',
  role: 'ayuntamiento',
  municipalityId: 'muni_el_tiemblo',
  municipalityName: 'El Tiemblo',
  province: 'Ávila',
  autonomousCommunity: 'Castilla y León',
  phone: '+34 918 62 50 02',
  geoConsent: true,
  currentLocation: { latitude: 40.3801, longitude: -4.4395 },
  isVerified: true,
  createdAt: '2026-01-10T08:00:00Z',
};

const defaultVoluntario: UserProfile = {
  uid: 'usr-vol-01',
  userName: 'Carlos Fernández Gómez',
  displayName: 'Carlos Fernández (Voluntario 4x4)',
  email: 'carlos.voluntario@gmail.com',
  role: 'voluntario',
  municipalityId: 'muni_el_tiemblo',
  municipalityName: 'El Tiemblo',
  province: 'Ávila',
  autonomousCommunity: 'Castilla y León',
  phone: '+34 600 123 456',
  geoConsent: true,
  currentLocation: { latitude: 40.3831, longitude: -4.4370 },
  isVerified: true,
  createdAt: '2026-02-01T10:00:00Z',
} as UserProfile;

const defaultCiudadano: UserProfile = {
  uid: 'usr-ciu-01',
  email: 'vecino.tiemblo@gmail.com',
  displayName: 'Laura Jiménez (Vecina El Tiemblo)',
  role: 'ciudadano',
  municipalityId: 'muni_el_tiemblo',
  municipalityName: 'El Tiemblo',
  province: 'Ávila',
  autonomousCommunity: 'Castilla y León',
  phone: '+34 655 88 99 00',
  geoConsent: true,
  currentLocation: { latitude: 40.3812, longitude: -4.4410 },
  isVerified: true,
  createdAt: '2026-03-15T12:00:00Z',
};

const defaultInvitado: UserProfile = {
  uid: 'usr-invitado-01',
  email: 'invitado@previncendios.es',
  displayName: 'Ciudadano Invitado (Sin Registro)',
  role: 'invitado',
  municipalityId: 'muni_el_tiemblo',
  municipalityName: 'El Tiemblo',
  province: 'Ávila',
  autonomousCommunity: 'Castilla y León',
  geoConsent: false,
  createdAt: '2026-07-28T12:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(defaultAyuntamiento);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Selector fácil de roles para demostración y evaluación operativa
  const loginDemoRole = (role: UserRole, municipalityId?: string) => {
    setIsLoading(true);
    let targetUser: UserProfile;

    switch (role) {
      case 'superadmin':
        targetUser = { ...defaultSuperAdmin };
        break;
      case 'ayuntamiento':
        targetUser = { ...defaultAyuntamiento };
        break;
      case 'voluntario':
        targetUser = { ...defaultVoluntario };
        break;
      case 'ciudadano':
        targetUser = { ...defaultCiudadano };
        break;
      case 'invitado':
      default:
        targetUser = { ...defaultInvitado };
        break;
    }

    if (municipalityId) {
      targetUser.municipalityId = municipalityId;
    }

    setTimeout(() => {
      setUser(targetUser);
      setIsLoading(false);
    }, 200);
  };

  const setRole = (role: UserRole) => {
    loginDemoRole(role);
  };

  const logout = () => {
    setUser(defaultInvitado);
  };

  const updateProfile = (updatedData: Partial<UserProfile>) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const toggleGeoConsent = () => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, geoConsent: !prev.geoConsent } : null));
  };

  const updateUserLocation = (latitude: number, longitude: number) => {
    if (!user) return;
    const currentLocation: GeoPoint = {
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
    };
    setUser((prev) => (prev ? { ...prev, currentLocation } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'invitado',
        setRole,
        loginDemoRole,
        logout,
        updateProfile,
        toggleGeoConsent,
        updateUserLocation,
        isAuthenticated: !!user && user.role !== 'invitado',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
