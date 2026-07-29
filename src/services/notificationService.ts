import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '../firebase/config';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export type NotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
};

/**
 * Solicita permiso de notificación y devuelve el token FCM si es posible.
 * Si no hay VAPID key, devuelve null pero deja el permiso concedido.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!('Notification' in window)) {
    console.warn('[FCM] Notificaciones no soportadas en este navegador');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[FCM] Permiso de notificación denegado');
    return null;
  }

  if (!(await isSupported())) {
    console.warn('[FCM] Firebase Messaging no soportado');
    return null;
  }

  if (!VAPID_KEY) {
    console.warn('[FCM] Falta VITE_FIREBASE_VAPID_KEY en .env');
    return null;
  }

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('[FCM] Token obtenido:', token);
    return token;
  } catch (err) {
    console.error('[FCM] Error obteniendo token:', err);
    return null;
  }
}

/**
 * Registra un listener para mensajes FCM en primer plano.
 */
export function onForegroundMessage(callback: (payload: NotificationPayload) => void): () => void {
  isSupported().then((supported) => {
    if (!supported || !VAPID_KEY) return;
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback({
        title: payload.notification?.title || 'Alerta',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        data: payload.data,
      });
    });
  });
  return () => {};
}

/**
 * Muestra una notificación local inmediata (no requiere FCM).
 */
export function showLocalNotification(payload: NotificationPayload): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: payload.data?.id as string | undefined,
      data: payload.data,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.error('[Notification] Error mostrando notificación:', err);
  }
}

/**
 * Verifica si el usuario ha concedido permiso de notificación.
 */
export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}
