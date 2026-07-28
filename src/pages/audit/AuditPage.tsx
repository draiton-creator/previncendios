/**
 * Página de Auditoría e Histórico - Previncendios España
 */

import React from 'react';
import { AuditLogsList } from '../../components/audit/AuditLogsList';

export const AuditPage: React.FC = () => {
  return (
    <div>
      <AuditLogsList />
    </div>
  );
};
