/**
 * Servicio de Gestión e Integración con Firebase Firestore para Perfiles de Voluntarios
 * Previncendios España
 */

import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { VolunteerProfile } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Carga el perfil de voluntario desde Firestore por su UID
 */
export async function getVolunteerProfileFromFirestore(uid: string): Promise<VolunteerProfile | null> {
  const path = `volunteers/${uid}`;
  try {
    const docRef = doc(db, 'volunteers', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as VolunteerProfile;
    }
    return null;
  } catch (error) {
    console.warn(`[Firestore Fallback] No se pudo cargar perfil voluntario de Firestore para ${uid}:`, error);
    return null;
  }
}

/**
 * Guarda o actualiza el perfil completo de voluntario en la colección 'volunteers' de Firestore
 */
export async function saveVolunteerProfileToFirestore(profile: VolunteerProfile): Promise<void> {
  const path = `volunteers/${profile.uid}`;
  const now = new Date().toISOString();
  const profileToSave: VolunteerProfile = {
    ...profile,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'volunteers', profile.uid);
    await setDoc(docRef, profileToSave, { merge: true });

    // Sincronizar también con la colección 'users' para mantener el registro unificado
    const userDocRef = doc(db, 'users', profile.uid);
    await setDoc(
      userDocRef,
      {
        displayName: profile.userName,
        municipalityId: profile.municipalityId,
        municipalityName: profile.municipalityName,
        phone: profile.phone,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Escucha cambios en tiempo real en la ficha de un voluntario en Firestore
 */
export function subscribeToVolunteerProfile(
  uid: string,
  onUpdate: (profile: VolunteerProfile | null) => void
): () => void {
  const path = `volunteers/${uid}`;
  const docRef = doc(db, 'volunteers', uid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as VolunteerProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn(`[Firestore Snapshot Warning] Error escuchando voluntario ${uid}:`, error);
      onUpdate(null);
    }
  );
}
