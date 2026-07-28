/**
 * Servicio de Integración Google Workspace (Gmail & Google Contacts)
 * Permite enviar boletines de emergencia por Gmail e importar contactos.
 */

import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../firebase/config';

let cachedAccessToken: string | null = null;

// Configurar proveedor de Google con Scopes de Gmail y Contactos
export const googleWorkspaceProvider = new GoogleAuthProvider();
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

/**
 * Autenticar con Google OAuth para obtener el token de acceso a Workspace APIs
 */
export const authenticateGoogleWorkspace = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, googleWorkspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google OAuth.');
    }

    cachedAccessToken = accessToken;
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Error en autenticación Google Workspace:', error);
    throw error;
  }
};

/**
 * Obtener el token de acceso guardado en memoria
 */
export const getCachedAccessToken = () => cachedAccessToken;

/**
 * Estructura de Contacto importado de Google Contacts
 */
export interface GoogleContact {
  resourceName: string;
  name: string;
  email: string;
  phone?: string;
}

/**
 * Importar lista de contactos desde Google Contacts (People API)
 */
export const fetchGoogleContacts = async (accessToken?: string): Promise<GoogleContact[]> => {
  const token = accessToken || cachedAccessToken;
  if (!token) {
    throw new Error('Se requiere autenticación con Google para acceder a los contactos.');
  }

  const response = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al obtener contactos (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const connections = data.connections || [];

  return connections
    .map((person: any) => {
      const name = person.names?.[0]?.displayName || 'Contacto sin nombre';
      const email = person.emailAddresses?.[0]?.value || '';
      const phone = person.phoneNumbers?.[0]?.value || '';

      return {
        resourceName: person.resourceName || Math.random().toString(),
        name,
        email,
        phone,
      };
    })
    .filter((c: GoogleContact) => c.email.length > 0);
};

/**
 * Convertir texto plano a formato RFC 822 codificado en Base64URL para la API de Gmail
 */
function createRawEmail(to: string, subject: string, message: string): string {
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    '',
    message,
  ];

  const emailText = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(emailText)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Enviar mensaje / alerta de emergencia a través de Gmail API
 */
export const sendGmailEmergencyNotice = async (
  toEmail: string,
  subject: string,
  bodyText: string,
  accessToken?: string
): Promise<{ id: string; threadId: string }> => {
  const token = accessToken || cachedAccessToken;
  if (!token) {
    throw new Error('Se requiere autenticación con Google para enviar correo por Gmail.');
  }

  const rawMessage = createRawEmail(toEmail, subject, bodyText);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error enviando correo por Gmail (${response.status}): ${errorBody}`);
  }

  return await response.json();
};
