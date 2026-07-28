# FASE 3: Diseño de Interfaces y Experiencia de Usuario (UX)

## 1. Módulos y Navegación
- **Panel de Control (`dashboard`)**: Vistas adaptadas a los 4 roles (Superadmin, Ayuntamiento, Ciudadano/Voluntario e Invitado).
- **Mapa Operativo GPS (`mapa`)**: Mapa interactivo Leaflet con selector de capas (Fuegos, Satélites FIRMS NASA, Recursos, Patrullas GPS) y tipos de mapa (Callejero, Satélite, Relieve).
- **Incidencias (`incidencias`)**: Catálogo con severidad (`Nivel 0` a `Nivel 3`), estado (`detectado` a `extinguido`) y modal de notificación.
- **Centro de Alertas (`alertas`)**: Emisión de órdenes masivas de evacuación y aviso rojo poblacional.
- **Gestión de Recursos (`recursos`)**: Inventario de autobombas y solicitudes intermunicipales entre ayuntamientos.
- **Voluntariado (`voluntarios`)**: Directorio con filtro de tracción 4x4, motosierras, motobombas y radio.
- **Bandos (`comunicaciones`)**: Comunicados verficados.
- **Documentación (`documentos`)**: Archivos PDF de planes PEMU.
- **Auditoría (`auditoria`)**: Trazabilidad e historial de operaciones.

---

## 2. Pautas Visuales
- **Modo Claro y Oscuro**: Alternancia inmediata compatible con Tailwind CSS `dark:`.
- **Botones y Accesibilidad WCAG AA**: Botones táctiles grandes (mínimo 44px) diseñados para operaciones de campo en emergencias.
- **Respuesta Visual Sin Slop**: Sin degradados violetas artificiales ni tarjetas vacías; jerarquía tipográfica limpia.
