# FASE 2: Arquitectura Técnica y Modelo de Datos Firestore

## 1. Estructura del Proyecto
```
/
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── package.json
├── docs/
│   ├── FASE_1_RESUMEN_EJECUTIVO.md
│   ├── FASE_2_ARQUITECTURA_Y_FIRESTORE.md
│   ├── FASE_3_RUTAS_Y_DISEÑO_UX.md
│   ├── FASE_4_MANUAL_DE_OPERACION.md
│   └── FASE_5_REVISION_Y_PRODUCTION_CHECKLIST.md
└── src/
    ├── types/
    │   ├── index.ts
    │   └── README.md
    ├── firebase/
    │   ├── config.ts
    │   └── README.md
    ├── services/
    │   ├── firmsSatelliteService.ts
    │   ├── aemetService.ts
    │   ├── mockData.ts
    │   └── README.md
    ├── context/
    │   ├── AuthContext.tsx
    │   ├── ThemeContext.tsx
    │   ├── EmergencyContext.tsx
    │   └── README.md
    ├── components/
    │   ├── common/
    │   ├── map/
    │   ├── incidents/
    │   ├── alerts/
    │   ├── resources/
    │   ├── volunteers/
    │   ├── communications/
    │   ├── documents/
    │   ├── audit/
    │   └── README.md
    ├── pages/
    │   ├── dashboards/
    │   ├── map/
    │   ├── incidents/
    │   ├── alerts/
    │   ├── resources/
    │   ├── volunteers/
    │   ├── communications/
    │   ├── documents/
    │   ├── audit/
    │   └── README.md
    ├── App.tsx
    ├── main.tsx
    └── index.css
```

---

## 2. Colecciones en Firestore (`firebase-blueprint.json`)
1. `users`: Perfil con `uid`, `email`, `role`, `municipalityId`, `geoConsent`.
2. `municipalities`: Ayuntamientos con `ineCode`, `centerLat`, `centerLng`, `fireRiskLevel`.
3. `emergencyEvents`: Incidencias con `severity`, `status`, `assignedBrigade`, `photoUrls`.
4. `alerts`: Alertas de evacuación/confinamiento con `radiusKm` e `isActive`.
5. `resources`: Autobombas, retenes, drones, albergues con estado `disponible`/`movilizado`.
6. `resourceRequests`: Solicitudes e intercambios intermunicipales de recursos.
7. `volunteerProfiles`: Ficha avanzada con 4x4, motosierra, motobomba y radio.
8. `patrolLocations`: Posicionamiento GPS en vivo de patrullas.
9. `messages`: Bandos oficiales y comunicados.
10. `activityLogs`: Trazabilidad e historial de operaciones.
