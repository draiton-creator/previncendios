/**
 * Página de Incidencias y Fuego - Previncendios España
 */

import React from 'react';
import { IncidentList } from '../../components/incidents/IncidentList';
import { MapFilter } from '../../components/map/MapFilter';
import { EmergencyEvent } from '../../types';

interface IncidentsPageProps {
  onSelectIncident: (incident: EmergencyEvent) => void;
  onOpenNewIncidentModal: () => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  onSelectIncident,
  onOpenNewIncidentModal,
}) => {
  return (
    <div className="space-y-4">
      <MapFilter />
      <IncidentList
        onSelectIncident={onSelectIncident}
        onOpenNewIncidentModal={onOpenNewIncidentModal}
      />
    </div>
  );
};
