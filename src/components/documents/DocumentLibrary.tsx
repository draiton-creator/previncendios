/**
 * Biblioteca Documental de Protocolos y Planes de Emergencia - Previncendios España
 */

import React from 'react';
import { FileText, Download, ShieldCheck, FileCheck, FolderOpen } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { Badge } from '../common/Badge';

export const DocumentLibrary: React.FC = () => {
  const { documents, filters } = useEmergency();

  const filteredDocs = documents.filter((doc) => {
    if (filters.municipalityId !== 'todas' && doc.municipalityId !== filters.municipalityId) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-purple-600" />
          Planes de Emergencia Local y Protocolos Oficiales
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Documentación técnica PEMU, fichas de evacuación y normativa forestal
        </p>
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

            <button
              onClick={() => alert(`Descargando documento: ${doc.title}`)}
              className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Descargar Documento PDF"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
