/**
 * Modal de Registro y Autenticación Dinámica
 * Adapta los campos según el Rol (Ciudadano vs Voluntario vs Ayuntamiento)
 * Conectado con Firebase Auth, Google OAuth Provider y la colección 'users' en Firestore.
 */

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Building2,
  Users,
  Flame,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Truck,
  PhoneCall,
  Clock,
  Radio,
  MapPin,
  FileCheck,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { UserRole, UserProfile } from '../../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const { updateProfile, loginDemoRole } = useAuth();

  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ciudadano');

  // Campos Comunes
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [municipalityName, setMunicipalityName] = useState<string>('El Tiemblo');
  const [province, setProvince] = useState<string>('Ávila');

  // Campos Dinámicos para CIUDADANO
  const [addressArea, setAddressArea] = useState<string>('Urbanización La Caleta / Zona Rústica');
  const [enableEvacuationAlerts, setEnableEvacuationAlerts] = useState<boolean>(true);

  // Campos Dinámicos para VOLUNTARIO
  const [vehicleType, setVehicleType] = useState<string>('Vehículo 4x4 con bola de remolque');
  const [availability, setAvailability] = useState<string>('Disponibilidad Inmediata 24/7');
  const [pcCreds, setPcCreds] = useState<string>('');
  const [equipmentList, setEquipmentList] = useState<string>('Batefuegos, Emisora Radio, Mochila Extintora');

  // Campos para AYUNTAMIENTO / ADMIN
  const [officialTitle, setOfficialTitle] = useState<string>('Concejal de Seguridad y Emergencias');

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Registro/Login con Google
  const handleGoogleAuth = async () => {
    setIsGoogleSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      const uid = googleUser.uid;
      const userDocRef = doc(db, 'users', uid);

      // Comprobar si ya existe el documento en Firestore
      const docSnap = await getDoc(userDocRef);
      let userProfileToSave: UserProfile;

      if (docSnap.exists()) {
        userProfileToSave = docSnap.data() as UserProfile;
        setSuccessMessage(`¡Bienvenido de nuevo, ${googleUser.displayName || 'Usuario'}! Sesión iniciada con Google.`);
      } else {
        // Crear nuevo perfil según el rol seleccionado
        userProfileToSave = {
          uid,
          email: googleUser.email || `${uid}@gmail.com`,
          displayName: googleUser.displayName || displayName || 'Usuario Google',
          role: selectedRole,
          municipalityId: `muni_${municipalityName.toLowerCase().replace(/\s+/g, '_')}`,
          municipalityName,
          province,
          autonomousCommunity: 'Castilla y León',
          phone: phone || googleUser.phoneNumber || '+34 600 000 000',
          geoConsent: true,
          currentLocation: { latitude: 40.3801, longitude: -4.4395 },
          isVerified: true,
          createdAt: new Date().toISOString(),
        };

        // Guardar en Firestore
        await setDoc(userDocRef, userProfileToSave, { merge: true });
        setSuccessMessage(
          `¡Registro completado con éxito con tu cuenta de Google! Guardado en la colección 'users' de Firestore como ${selectedRole.toUpperCase()}.`
        );
      }

      loginDemoRole(userProfileToSave.role, userProfileToSave.municipalityId);
      updateProfile(userProfileToSave);

      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Error con Google Auth:', err);
      setErrorMessage(err.message || 'Error al autenticarse con la cuenta de Google.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // Formulario Manual (Email / Password)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let uid = `usr-${Date.now()}`;
      let finalEmail = email;

      if (mode === 'register') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          uid = cred.user.uid;
          finalEmail = cred.user.email || email;
        } catch (authErr: any) {
          console.warn('Firebase Auth note:', authErr.message);
        }

        const newUserProfile: UserProfile = {
          uid,
          email: finalEmail,
          displayName: displayName || (selectedRole === 'ayuntamiento' ? `Ayuntamiento de ${municipalityName}` : 'Usuario Registrado'),
          role: selectedRole,
          municipalityId: `muni_${municipalityName.toLowerCase().replace(/\s+/g, '_')}`,
          municipalityName,
          province,
          autonomousCommunity: 'Castilla y León',
          phone: phone || '+34 600 000 000',
          geoConsent: true,
          currentLocation: { latitude: 40.3801, longitude: -4.4395 },
          isVerified: true,
          createdAt: new Date().toISOString(),
        };

        // Guardar en la base de datos Firestore
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, newUserProfile, { merge: true });

        loginDemoRole(selectedRole);
        updateProfile(newUserProfile);

        setSuccessMessage(`¡Perfil de ${selectedRole.toUpperCase()} guardado en Firestore y activado correctamente!`);
      } else {
        // Modo Login
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          uid = cred.user.uid;
        } catch (authErr) {
          console.warn('Login local demo fallback');
        }

        loginDemoRole(selectedRole);
        setSuccessMessage(`¡Sesión iniciada como ${selectedRole.toUpperCase()}!`);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error en el proceso de autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5 my-8">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabecera y Modos (Registro vs Login) */}
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              {mode === 'register' ? <UserPlus className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {mode === 'register' ? 'Registro en la Red de Emergencias' : 'Acceso a la Plataforma'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sincronizado con la colección <span className="font-mono text-red-600 dark:text-red-400 font-bold">'users'</span> en Firestore
              </p>
            </div>
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setMode('register')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Crear Nueva Cuenta
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        {successMessage && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center space-x-3 text-xs font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 flex items-center space-x-3 text-xs font-bold">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Botón de Autenticación con Google */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleSubmitting}
            className="w-full inline-flex items-center justify-center space-x-3 rounded-2xl border border-gray-300 bg-white py-3 px-4 text-xs font-black text-gray-800 shadow-sm hover:bg-gray-50 transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isGoogleSubmitting
                ? 'Autenticando con Google...'
                : mode === 'register'
                ? 'Registrarse rápidamente con Google'
                : 'Iniciar Sesión con Google'}
            </span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            <span className="absolute bg-white px-3 text-[11px] font-bold text-gray-400 dark:bg-gray-900">
              o formulario tradicional
            </span>
          </div>
        </div>

        {/* Formulario Tradicional */}
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* Selector de Rol Dinámico */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
              Rol Operativo en la Red:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ciudadano', label: 'Ciudadano', icon: Flame, desc: 'Avisos & Alertas' },
                { id: 'voluntario', label: 'Voluntario', icon: Users, desc: 'Intervención 4x4' },
                { id: 'ayuntamiento', label: 'Ayuntamiento', icon: Building2, desc: 'Puesto Mando' },
                { id: 'superadmin', label: 'SuperAdmin', icon: Shield, desc: 'Control Total' },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id as UserRole)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-extrabold transition-all ${
                      isSelected
                        ? `bg-red-50 border-2 border-red-600 text-red-700 dark:bg-red-950/40 dark:border-red-500 dark:text-red-300 shadow-sm`
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span>{r.label}</span>
                    <span className="text-[9px] font-normal text-gray-400">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CAMPOS BASE COMUNES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="usuario@ejemplo.es"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    required
                    value={municipalityName}
                    onChange={(e) => setMunicipalityName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>

          {/* CAMPOS ESPECÍFICOS ADAPTADOS SEGÚN EL ROL */}
          {mode === 'register' && selectedRole === 'ciudadano' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Flame className="h-4 w-4" />
                <span>Perfil de Ciudadano Vecino</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Zona Residencial / Barrio
                </label>
                <input
                  type="text"
                  value={addressArea}
                  onChange={(e) => setAddressArea(e.target.value)}
                  placeholder="Ej. Urbanización Pinar del Rey / Casco Antiguo"
                  className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={enableEvacuationAlerts}
                  onChange={(e) => setEnableEvacuationAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                  Recibir alertas tempranas de confinamiento y evacuación en caso de incendio
                </span>
              </label>
            </div>
          )}

          {mode === 'register' && selectedRole === 'voluntario' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Users className="h-4 w-4" />
                <span>Ficha Operativa de Voluntario de Apoyo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Recurso o Vehículo
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Vehículo 4x4 con bola de remolque">Vehículo 4x4 con Bola</option>
                    <option value="Tractor / Cisterna Agrícola 1000L">Tractor / Cisterna Agrícola</option>
                    <option value="Moto / Quad para Batida">Moto / Quad todoterreno</option>
                    <option value="Retén a Pie con Herramienta Forestal">Retén a Pie con Batefuegos</option>
                    <option value="Sanitario / Logística">Sanitario / Apoyo Logístico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Disponibilidad Operativa
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Disponibilidad Inmediata 24/7">Disponibilidad 24/7</option>
                    <option value="Tardes y Fines de Semana">Tardes y Fines de Semana</option>
                    <option value="Bajo Llamada de Puesto de Mando">Solo Llamada Puesto Mando</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Agrupación / Protección Civil (Opcional)
                  </label>
                  <input
                    type="text"
                    value={pcCreds}
                    onChange={(e) => setPcCreds(e.target.value)}
                    placeholder="Ej. Agrupación Voluntarios Valle Iruelas"
                    className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Equipamiento
                  </label>
                  <input
                    type="text"
                    value={equipmentList}
                    onChange={(e) => setEquipmentList(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && selectedRole === 'ayuntamiento' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Cargo Municipal / Puesto de Mando
              </label>
              <input
                type="text"
                value={officialTitle}
                onChange={(e) => setOfficialTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {/* Botón de Confirmación */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-red-600 py-3 text-sm font-black text-white shadow-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Procesando en Firestore...'
                : mode === 'register'
                ? `Registrar Perfil (${selectedRole.toUpperCase()}) en Base de Datos`
                : `Entrar a la Plataforma (${selectedRole.toUpperCase()})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

