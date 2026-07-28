# FASE 1: Resumen Ejecutivo del Producto y Mapeo de Roles

## 1. Visión General del Producto
**Previncendios España** es la plataforma nacional unificada de alerta temprana, prevención y gestión integral de incendios forestales y emergencias territoriales para municipios y ciudadanía en España.

Permite la interconexión entre la **Dirección General / Superadministración Central**, **Ayuntamientos (CECOPAL)**, **Voluntariado cualificado de Protección Civil (con vehículos 4x4, motosierras, radios y motobombas)**, **Ciudadanía residente** e **Invitados**.

---

## 2. Supuestos Funcionales y Ámbito Territorio
- **Cobertura Territorial**: 17 Comunidades Autónomas, Provincias y Municipios de España (con datos de partida en Ávila: El Tiemblo y Cebreros, Málaga: Ronda, Jaén: Cazorla, Galicia: Ourense, Valencia: Chiva).
- **Integraciones Simuladas con Datos Reales**:
  - **NASA FIRMS (MODIS/VIIRS)**: Detección satelital de puntos calientes y potencia radiativa (FRP MW).
  - **AEMET**: Índice diario de riesgo meteorológico de incendios por municipio (temperatura, humedad y velocidad/dirección del viento).
  - **Red 112 / UME**: Protocolos de escalado desde Nivel 0 (Local) hasta Nivel 3 (Emergencia Nacional).

---

## 3. Matriz de Roles y Permisos (RBAC)

| Módulo / Funcionalidad | Superadmin | Ayuntamiento | Voluntario | Ciudadano | Invitado |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Mapa Público de Fuegos** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Notificar Incidencia con Foto / GPS** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Emitir Alerta Evacuación / Confinamiento** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Gestión y Cambio Estado de Fuego** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Gestión de Autobombas / Retenes** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Cesión Intermunicipal de Recursos** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Publicación de Bandos Oficiales** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Rastrear Patrullas en Tiempo Real GPS** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Registro de Auditoría e IP** | ✅ | ✅ | ❌ | ❌ | ❌ |
