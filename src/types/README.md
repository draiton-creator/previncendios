# Módulo de Tipos TypeScript (`src/types`)

## Descripción
Contiene las definiciones de tipos e interfaces TypeScript globales para la aplicación **Previncendios España**.

## Interfaces Clave
- `UserProfile`: Datos de usuario con rol (`superadmin`, `ayuntamiento`, `voluntario`, `ciudadano`, `invitado`), municipio y consentimiento de geolocalización.
- `Municipality`: Estructura territorial municipal de España, nivel de riesgo AEMET y municipios hermanados.
- `EmergencyEvent`: Incidencias con ubicación GPS, fotos, brigadas asignadas y nivel de gravedad.
- `EmergencyAlert`: Centro de alertas poblacionales por proximidad.
- `OperationalResource`: Recursos materiales y humanos movilizables (autobombas, retenes, drones, albergues).
- `ResourceRequest`: Solicitudes y cesiones intermunicipales de recursos.
- `VolunteerProfile`: Perfil cualificado con formación 4x4, motosierra, equipamiento radio y disponibilidad.
- `SatelliteHotspot`: Puntos de calor detectados por satélite NASA FIRMS.
- `ActivityLog`: Auditoría de acciones institucionales.
