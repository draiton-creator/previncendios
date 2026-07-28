/**
 * Servicio de Firebase Storage para subida de archivos
 * Previncendios España
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

export async function uploadFile(file: File, folder: string, prefix = ''): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '_').toLowerCase();
  const timestamp = Date.now();
  const path = `${folder}/${prefix}${timestamp}_${safeName}`;
  const fileRef = ref(storage, path);

  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  const url = await getDownloadURL(snapshot.ref);
  return { url, path, name: file.name };
}

export async function uploadIncidentPhoto(file: File, userId: string): Promise<UploadResult> {
  return uploadFile(file, 'incident-photos', `${userId || 'anonimo'}/`);
}

export async function uploadDocument(file: File, userId: string): Promise<UploadResult> {
  return uploadFile(file, 'documents', `${userId || 'anonimo'}/`);
}
