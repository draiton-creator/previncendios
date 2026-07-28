/**
 * Página de Gestión de Recursos - Previncendios España
 */

import React from 'react';
import { ResourceList } from '../../components/resources/ResourceList';

interface ResourcesPageProps {
  onOpenResourceRequestModal: () => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ onOpenResourceRequestModal }) => {
  return (
    <div>
      <ResourceList onOpenResourceRequestModal={onOpenResourceRequestModal} />
    </div>
  );
};
