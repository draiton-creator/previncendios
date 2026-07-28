/**
 * Biblioteca Documental de Protocolos y Planes de Emergencia - Previncendios España
 */

import React, { useState, useRef } from 'react';
import { FileText, Download, ShieldCheck, FileCheck, FolderOpen, Upload, Loader2, X } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { uploadDocument } from '../../services/storageService';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const DocumentLibrary: React.FC = () => {
  const { documents, filters } = useEmergency();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<'PEMU' | 'Plano' | 'Normativa' | 'Ficha' | 'Otro'>('PEMU');
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filteredDocs = documents.filter((doc) => {
    if (filters.municipalityId !== 'todas' && doc.municipalityId !== filters.municipalityId) return false;
    return true;
  });

  const canUpload = user && (user.role === 'superadmin' || user.role === 'ayuntamiento');

  const handleUpload = async () => {
    if (!selectedFile || !newDocTitle.trim() || !user) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadDocument(selectedFile, user.uid);
      await addDoc(collection(db, 'documents'), {
        title: newDocTitle.trim(),
        category: newDocCategory,
        municipalityId: user.municipalityId || '',
        fileUrl: result.url,
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedBy: user.displayName || user.email || 'Usuario',
        uploadedByUid: user.uid,
        isPublic: newDocIsPublic,
        createdAt: serverTimestamp(),
      });
      setShowUploadModal(false);
      setNewDocTitle('');
      setSelectedFile(null);
      setNewDocIsPublic(false);
    } catch (err) {
      console.error('[Storage] Error subiendo documento:', err);
      setUploadError('Error al subir el documento. Verifica los permisos.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-purple-600" />
            Planes de Emergencia Local y Protocolos Oficiales
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Documentación técnica PEMU, fichas de evacuación y normativa forestal
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 shrink-0"
          >
            <Upload className="h-4 w-4" />
            Subir Documento
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <FileText className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <Badge variant="purple">{doc.category.toUpperCase()}</Badge>
                  {doc.isPublic ? <Badge variant="success">PÚBLICO</Badge> : <Badge variant="warning">USO INTERNO</Badge>}
                </div>
                <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {doc.fileSize} • Subido por: {doc.uploadedBy}
                </p>
              </div>
            </div>

            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Descargar Documento PDF"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        ))}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Subir Documento</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ej: Plan de Emergencia Municipal 2026"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as typeof newDocCategory)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="PEMU">PEMU</option>
                  <option value="Plano">Plano</option>
                  <option value="Normativa">Normativa</option>
                  <option value="Ficha">Ficha de evacuación</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Archivo PDF *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-100 file:px-2 file:py-1 file:text-xs file:font-bold file:text-purple-700 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:file:bg-purple-950 dark:file:text-purple-300"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={newDocIsPublic}
                  onChange={(e) => setNewDocIsPublic(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Documento público (visible para ciudadanos)
              </label>
              {uploadError && (
                <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
              )}
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !newDocTitle.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-purple-700 transition-all disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Subiendo...' : 'Subir Documento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
