/**
 * Página de Alertas - Previncendios España
 */

import React from 'react';
import { AlertCenter } from '../../components/alerts/AlertCenter';

interface AlertsPageProps {
  onOpenCreateAlertModal: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onOpenCreateAlertModal }) => {
  return (
    <div>
      <AlertCenter onOpenCreateAlertModal={onOpenCreateAlertModal} />
    </div>
  );
};
