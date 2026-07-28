/**
 * Contexto de Autenticación y Gestión de Roles y Permisos
 * Previncendios España
 *
 * Ahora conectado a Firebase Auth y Firestore.
 * Mantiene `loginDemoRole` solo para desarrollo/evaluación.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole, GeoPoint } from '../types';

const DEFAULT_MUNICIPALITY = {
  id: 'muni_el_tiemblo',
  name: 'El Tiemblo',
  province: 'Ávila',
  autonomousCommunity: 'Castilla y León',
};

const buildDefaultProfile = (uid: string, email: string, role: UserRole): UserProfile => ({
  uid,
  email,
  displayName: email.split('@')[0],
  role,
  municipalityId: DEFAULT_MUNICIPALITY.id,
  municipalityName: DEFAULT_MUNICIPALITY.name,
  province: DEFAULT_MUNICIPALITY.province,
  autonomousCommunity: DEFAULT_MUNICIPALITY.autonomousCommunity,
  phone: '',
  geoConsent: false,
  isVerified: role !== 'invitado',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const defaultDemoUsers: Record<UserRole, UserProfile> = {
  superadmin: {
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
  },
  ayuntamiento: {
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
  },
  voluntario: {
    uid: 'usr-vol-01',
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
  },
  ciudadano: {
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
  },
  invitado: {
    uid: 'usr-invitado-01',
    email: 'invitado@previncendios.es',
    displayName: 'Ciudadano Invitado (Sin Registro)',
    role: 'invitado',
    municipalityId: 'muni_el_tiemblo',
    municipalityName: 'El Tiemblo',
    province: 'Ávila',
    autonomousCommunity: 'Castilla y León',
    phone: '',
    geoConsent: false,
    createdAt: '2026-07-28T12:00:00Z',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  loginDemoRole: (role: UserRole, municipalityId?: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, data: Partial<UserProfile>) => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  toggleGeoConsent: () => Promise<void>;
  updateUserLocation: (lat: number, lng: number) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isDemoMode: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(defaultDemoUsers.ayuntamiento);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Escuchar cambios de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setIsLoading(true);

      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUser(profile);
            setIsDemoMode(false);
          } else {
            // No hay perfil todavía, crear uno mínimo
            const newProfile: UserProfile = buildDefaultProfile(
              fbUser.uid,
              fbUser.email || '',
              'ciudadano'
            );
            await setDoc(userDocRef, newProfile, { merge: true });
            setUser(newProfile);
            setIsDemoMode(false);
          }
        } catch (err) {
          console.error('Error cargando perfil:', err);
          setAuthError('No se pudo cargar el perfil de usuario desde Firestore.');
        }
      } else {
        setUser(defaultDemoUsers.invitado);
        setIsDemoMode(true);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const setRole = (role: UserRole) => {
    loginDemoRole(role);
  };

  const loginDemoRole = (role: UserRole, municipalityId?: string) => {
    const targetUser = { ...defaultDemoUsers[role] };
    if (municipalityId) {
      targetUser.municipalityId = municipalityId;
    }
    setUser(targetUser);
    setIsDemoMode(true);
    setFirebaseUser(null);
    setAuthError(null);
  };

  const register = async (email: string, password: string, data: Partial<UserProfile>): Promise<void> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

      const newProfile: UserProfile = {
        ...buildDefaultProfile(fbUser.uid, fbUser.email || email, data.role || 'ciudadano'),
        ...data,
        uid: fbUser.uid,
        email: fbUser.email || email,
        updatedAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, newProfile, { merge: true });

      setUser(newProfile);
      setIsDemoMode(false);
    } catch (err: any) {
      console.error('Error en registro:', err);
      setAuthError(err.message || 'Error al registrar el usuario.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El onAuthStateChanged se encargará de cargar el perfil
    } catch (err: any) {
      console.error('Error en login:', err);
      setAuthError(err.message || 'Error al iniciar sesión.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role?: UserRole): Promise<void> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const provider = new GoogleAuthProvider();
      const { user: fbUser } = await signInWithPopup(auth, provider);

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUser(profile);
        setIsDemoMode(false);
      } else {
        const newProfile: UserProfile = {
          ...buildDefaultProfile(
            fbUser.uid,
            fbUser.email || '',
            role || 'ciudadano'
          ),
          displayName: fbUser.displayName || buildDefaultProfile(fbUser.uid, fbUser.email || '', role || 'ciudadano').displayName,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile, { merge: true });
        setUser(newProfile);
        setIsDemoMode(false);
      }
    } catch (err: any) {
      console.error('Error con Google:', err);
      setAuthError(err.message || 'Error al autenticar con Google.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (!isDemoMode) {
        await signOut(auth);
      }
      setUser(defaultDemoUsers.invitado);
      setIsDemoMode(true);
      setFirebaseUser(null);
      setAuthError(null);
    } catch (err: any) {
      console.error('Error en logout:', err);
      setAuthError(err.message || 'Error al cerrar sesión.');
      throw err;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Error reseteando contraseña:', err);
      setAuthError(err.message || 'Error al enviar el correo de recuperación.');
      throw err;
    }
  };

  const updateProfile = async (updatedData: Partial<UserProfile>): Promise<void> => {
    if (!user) return;

    const newProfile = { ...user, ...updatedData, updatedAt: new Date().toISOString() };
    setUser(newProfile);

    if (!isDemoMode && firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, updatedData);
      } catch (err: any) {
        console.error('Error actualizando perfil:', err);
        setAuthError(err.message || 'Error al actualizar el perfil.');
      }
    }
  };

  const toggleGeoConsent = async (): Promise<void> => {
    if (!user) return;
    await updateProfile({ geoConsent: !user.geoConsent });
  };

  const updateUserLocation = (latitude: number, longitude: number) => {
    if (!user) return;
    const currentLocation: GeoPoint = { latitude, longitude, updatedAt: new Date().toISOString() };
    updateProfile({ currentLocation });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'invitado',
        setRole,
        loginDemoRole,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        updateProfile,
        toggleGeoConsent,
        updateUserLocation,
        isAuthenticated: !!user && user.role !== 'invitado',
        isLoading,
        authError,
        isDemoMode,
        clearError,
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
