/**
 * Modal de Notificación de Nueva Incidencia / Fuego
 * Previncendios España
 */

import React, { useState } from 'react';
import { Flame, MapPin, Camera, X, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { uploadIncidentPhoto } from '../../services/storageService';
import { IncidentType, IncidentSeverity } from '../../types';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({ isOpen, onClose }) => {
  const { createIncident, municipalities } = useEmergency();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentType>('incendio_forestal');
  const [severity, setSeverity] = useState<IncidentSeverity>('Nivel 1');
  const [municipalityId, setMunicipalityId] = useState(user?.municipalityId || 'muni_el_tiemblo');
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number>(user?.currentLocation?.latitude || 40.3801);
  const [longitude, setLongitude] = useState<number>(user?.currentLocation?.longitude || -4.4395);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationDescription.trim()) return;

    setUploading(true);
    setUploadStatus('Subiendo evidencia...');

    let uploadedUrls: string[] = [];
    if (photoUrl.trim()) uploadedUrls.push(photoUrl.trim());

    if (photoFiles.length > 0) {
      try {
        const results = await Promise.all(
          photoFiles.map((file) => uploadIncidentPhoto(file, user?.uid || 'anonimo'))
        );
        uploadedUrls = [...uploadedUrls, ...results.map((r) => r.url)];
      } catch (err) {
        console.warn('[Storage] Error subiendo fotos:', err);
        setUploadStatus('Error al subir algunas fotos. Se creará la incidencia sin ellas.');
      }
    }

    setUploading(false);

    const selectedMuni = municipalities.find((m) => m.id === municipalityId);

    await createIncident({
      title,
      type,
      severity,
      status: 'detectado',
      municipalityId,
      municipalityName: selectedMuni?.name || 'El Tiemblo',
      province: selectedMuni?.province || 'Ávila',
      latitude,
      longitude,
      locationDescription,
      description,
      reportedByUid: user?.uid || 'anonimo',
      reportedByName: user?.displayName || 'Ciudadano',
      reportedByRole: user?.role || 'ciudadano',
      source: user?.role === 'voluntario' ? 'voluntario' : 'ciudadano',
      photoUrls: uploadedUrls,
    });

    setUploadStatus(null);
    setPhotoFiles([]);
    onClose();
  };

  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {
          // Fallback a coordenadas por defecto
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-red-100 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Notificar Nueva Incidencia o Fuego
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aviso inmediato al Centro de Coordinación 112 y Ayuntamiento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Título del Aviso / Evento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Humo denso observado en ladera sur del pinar"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Emergencia
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="incendio_forestal">Incendio Forestal</option>
                <option value="incendio_urbano">Incendio Urbano</option>
                <option value="inundacion">Inundación / Riada</option>
                <option value="tormenta">Tormenta / Rayo</option>
                <option value="ola_calor">Riesgo por Ola de Calor</option>
                <option value="accidente">Accidente en Monte</option>
                <option value="otro">Otro Evento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Municipio Afectado
              </label>
              <select
                value={municipalityId}
                onChange={(e) => setMunicipalityId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.province})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Lugar Exacto / Paraje *
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <MapPin className="h-3 w-3" /> Usar Mi Ubicación GPS
              </button>
            </div>
            <input
              type="text"
              required
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="Ej: Paraje El Castañar, cerca de la pista de Iruelas km 4"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Descripción de la Situación
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa el tamaño de la columna, color del humo, dirección del viento o edificaciones cercanas..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Foto de Evidencia (Opcional)
            </label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3.5 py-2 text-xs text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-red-100 file:px-2 file:py-1 file:text-xs file:font-bold file:text-red-700 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:file:bg-red-950 dark:file:text-red-300"
              />
            </div>
            {photoFiles.length > 0 && (
              <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                {photoFiles.map((f) => f.name).join(', ')}
              </p>
            )}
            {uploadStatus && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
                {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                {uploadStatus}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{uploading ? 'Subiendo...' : 'Enviar Notificación Urgente'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
