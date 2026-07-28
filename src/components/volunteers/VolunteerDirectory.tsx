/**
 * Directorio Cualificado de Voluntarios y Patrullas - Previncendios España
 */

import React, { useState } from 'react';
import { Users, Truck, ShieldCheck, Radio, CheckCircle, XCircle, MapPin, Search, Award, Wrench, Edit3, Eye, Plus, UserCheck } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { VolunteerProfileModal } from './VolunteerProfileModal';
import { VolunteerProfile } from '../../types';

export const VolunteerDirectory: React.FC = () => {
  const { volunteers, updateVolunteerAvailability, filters } = useEmergency();
  const { role, user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredVolunteers = volunteers.filter((vol) => {
    if (filters.municipalityId !== 'todas' && vol.municipalityId !== filters.municipalityId) return false;
    if (
      searchTerm &&
      !vol.userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !vol.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(vol.groupOrAssociation && vol.groupOrAssociation.toLowerCase().includes(searchTerm.toLowerCase()))
    )
      return false;
    return true;
  });

  const handleOpenMyProfile = () => {
    const myProfile = volunteers.find((v) => v.uid === user?.uid) || null;
    setSelectedVolunteer(myProfile);
    setIsModalOpen(true);
  };

  const handleOpenVolunteerCard = (vol: VolunteerProfile) => {
    setSelectedVolunteer(vol);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Red Acreditada de Voluntarios y Patrullas
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Voluntariado cualificado con formación, vehículos 4x4, herramientas de extinción y equipos de radio
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, vehículo, grupo..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3.5 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Botón Mi Perfil de Voluntario */}
          <button
            onClick={handleOpenMyProfile}
            className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <UserCheck className="h-4 w-4" />
            <span>{role === 'voluntario' ? 'Mi Perfil de Voluntario' : 'Editar / Crear Ficha'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Voluntarios */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVolunteers.map((vol) => (
          <div
            key={vol.uid}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <Badge variant={vol.isAvailableNow ? 'success' : 'neutral'}>
                    {vol.isAvailableNow ? 'DISPONIBLE EN ACTIVO' : 'NO DISPONIBLE'}
                  </Badge>
                </div>

                {role === 'voluntario' && user?.uid === vol.uid && (
                  <button
                    onClick={() => updateVolunteerAvailability(vol.uid, !vol.isAvailableNow)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    Cambiar Estado
                  </button>
                )}
              </div>

              <h3 className="mt-3 text-base font-extrabold text-gray-900 dark:text-white">
                {vol.userName}
              </h3>

              {vol.groupOrAssociation && (
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {vol.groupOrAssociation}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Vehículo: <strong>{vol.vehicleType}</strong>
              </div>

              {/* Badges de Especialidades / Medios */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vol.has4x4 && <Badge variant="info">Tracción 4x4</Badge>}
                {vol.hasChainsaw && <Badge variant="warning">Motosierra</Badge>}
                {vol.hasWaterPump && <Badge variant="danger">Motobomba</Badge>}
                {vol.hasFirstAidCertification && <Badge variant="purple">Primeros Auxilios</Badge>}
                {vol.epiComplete && <Badge variant="success">EPI Ignífugo</Badge>}
              </div>

              {/* Formación destacada */}
              {vol.trainings && vol.trainings.length > 0 && (
                <div className="mt-3 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800/60 text-[11px] text-gray-700 dark:text-gray-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-gray-900 dark:text-white">
                    <Award className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Formación ({vol.trainingHours || 0}h):</span>
                  </div>
                  <div className="line-clamp-2 italic">
                    {vol.trainings.join(', ')}
                  </div>
                </div>
              )}

              <div className="mt-3 text-[11px] font-medium text-gray-600 dark:text-gray-400 space-y-1 border-t border-gray-100 pt-2 dark:border-gray-800">
                <div>Radio de Acción: <strong>{vol.actionRadiusKm} km</strong></div>
                <div>Equipamiento Radio: <strong>{vol.radioEquipment}</strong></div>
                {vol.assignedPatrolZone && (
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Zona Asignada: {vol.assignedPatrolZone}
                  </div>
                )}
              </div>
            </div>

            {/* Acción abrir Ficha Completa */}
            <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
              <button
                onClick={() => handleOpenVolunteerCard(vol)}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Ficha Completa y Equipamiento</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ficha Completa Voluntario */}
      {isModalOpen && (
        <VolunteerProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          volunteer={selectedVolunteer}
        />
      )}
    </div>
  );
};
