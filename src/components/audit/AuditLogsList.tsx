/**
 * Registro de Auditoría y Trazabilidad Institucional - Previncendios España
 */

import React from 'react';
import { History, Shield, User, Clock, Terminal } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { Badge } from '../common/Badge';

export const AuditLogsList: React.FC = () => {
  const { activityLogs } = useEmergency();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="h-6 w-6 text-indigo-600" />
          Registro de Auditoría e Histórico de Acciones (Trazabilidad)
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Trazabilidad completa de operaciones, cambios de estado y emisión de alertas institucionales
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 uppercase text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Hora / Fecha</th>
              <th className="px-4 py-3">Usuario / Entidad</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Detalles</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {activityLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                  {log.userName}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="purple">{log.userRole.toUpperCase()}</Badge>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {log.action}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {log.details}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-400">
                  {log.ipAddress || '194.224.18.12'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
