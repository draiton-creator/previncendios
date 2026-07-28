/**
 * Configuración e Inicialización de Firebase SDK
 * Previncendios España
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Inicializar la app de Firebase (evitar duplicados)
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Instancia de Auth
export const auth: Auth = getAuth(app);

// Instancia de Firestore con base de datos configurada
export const db: Firestore = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);
