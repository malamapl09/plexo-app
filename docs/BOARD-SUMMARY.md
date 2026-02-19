# Plexo Operations Platform
## Resumen Ejecutivo para Junta Directiva — Febrero 2026

---

## Que es?

Plataforma digital propia para gestionar las operaciones diarias de todas las tiendas Plexo. Reemplaza procesos manuales (papel, WhatsApp, Excel) con un sistema integrado accesible desde web (gerencia/HQ) y movil (tiendas).

---

## Plataforma en Numeros

| Metrica | Valor |
|---------|-------|
| Modulos funcionales | 15 |
| Endpoints de API | 192 |
| Paginas web (dashboard) | 38 |
| Modulos moviles | 15 |
| Tablas de base de datos | 46 |
| Lineas de codigo | 95,000+ |
| Apps | 3 (API backend, Web dashboard, App movil iOS/Android) |

---

## Modulos Completados (Listos para Produccion)

### Operaciones Diarias

| Modulo | Descripcion | Web | Movil |
|--------|-------------|-----|-------|
| **Plan del Dia (Tareas)** | Asignacion diaria de tareas por tienda con fotos de evidencia, verificacion y seguimiento de completado | Si | Si |
| **Recepciones** | Gestion de entregas de proveedores con escaneo de codigo de barras, reporte de discrepancias con fotos y firma digital | Si | Si |
| **Incidencias** | Reporte de problemas en tienda con categorizacion automatica, asignacion al responsable correcto y seguimiento hasta resolucion | Si | Si |
| **Verificaciones** | Cola de verificacion para supervisores — validar tareas completadas por el equipo | Si | Si |

### Calidad y Cumplimiento

| Modulo | Descripcion | Web | Movil |
|--------|-------------|-----|-------|
| **Checklists / SOPs Digitales** | Listas de verificacion recurrentes (diarias/semanales/mensuales) con fotos por paso, puntuacion automatica | Si | Si |
| **Auditorias e Inspecciones** | Plantillas de auditoria con secciones y puntuacion, programacion de visitas, hallazgos con fotos | Si | Si |
| **Acciones Correctivas (CAPA)** | Se crean automaticamente desde auditorias (hallazgos), checklists (score < 70%) e incidencias de alta prioridad. Dashboard con vencimientos | Si | Si |
| **Planogramas** | Plantillas de merchandising visual con fotos de referencia, envio de fotos de implementacion para aprobacion de HQ | Si | Si |
| **Campanas** | Ejecucion de campanas promocionales con evidencia fotografica, ciclo de aprobacion/revision, dashboard de cumplimiento | Si | Si |

### Equipo y Desarrollo

| Modulo | Descripcion | Web | Movil |
|--------|-------------|-----|-------|
| **Capacitacion / LMS** | Cursos con lecciones y examenes, inscripcion por tienda, seguimiento de progreso y cumplimiento de obligatorios | Si | Si |
| **Gamificacion** | Sistema de puntos automaticos por completar tareas/checklists/auditorias/capacitaciones. Tabla de posiciones semanal/mensual. Insignias por logros | Si | Si |

### Administracion

| Modulo | Descripcion | Web | Movil |
|--------|-------------|-----|-------|
| **Comunicaciones (Anuncios)** | Envio de anuncios desde HQ con niveles de prioridad, acuse de recibo por usuario, recordatorios automaticos | Si | Si |
| **Gestion de Usuarios** | Alta/baja de empleados, asignacion a tiendas y roles | Si | - |
| **Gestion de Tiendas** | Configuracion de tiendas y regiones | Si | - |
| **Permisos por Modulo** | Control granular de acceso: 5 roles x 15 modulos, configurable por super administrador | Si | Si |

---

## Capacidades Tecnicas Destacadas

- **Tiempo real** — Cambios se reflejan instantaneamente en todas las pantallas via WebSocket
- **Modo offline** — La app movil funciona sin internet y sincroniza cuando se reconecta
- **Notificaciones push** — Alertas en el telefono para tareas nuevas, vencimientos, asignaciones
- **Tema claro/oscuro** — La app movil soporta ambos modos automaticamente
- **Fotos y firmas** — Evidencia fotografica y firma digital integradas en todos los modulos
- **Escaneo de codigos** — Lectura de codigos de barras con la camara del telefono
- **Reportes y dashboards** — Cada modulo tiene su panel de estadisticas y metricas

---

## Que Ofrece la Competencia vs Nosotros

| Funcionalidad | YOOBIC | Zipline | Taqtics | Zenput | **Plexo Ops** |
|--------------|--------|---------|---------|--------|-------------------|
| Tareas diarias | Si | Si | Si | Si | **Si** |
| Checklists/SOPs | Si | Si | Si | Si | **Si** |
| Auditorias | Si | No | Si | Si | **Si** |
| CAPA automatico | No | No | No | No | **Si** |
| Planogramas | Si | No | Si | No | **Si** |
| Campanas | No | Si | No | No | **Si** |
| Capacitacion/LMS | Si | Si | Si | No | **Si** |
| Gamificacion | Si | No | No | No | **Si** |
| Comunicaciones | Si | Si | Si | No | **Si** |
| Recepciones/Logistica | No | No | No | No | **Si** |
| Incidencias | No | No | Si | No | **Si** |
| Permisos por modulo | Si | Si | No | No | **Si** |
| App movil | Si | Si | Si | Si | **Si** |
| Dashboard web | Si | Si | Si | Si | **Si** |
| Modo offline | Si | No | No | No | **Si** |

**Ventaja clave:** Recepciones/logistica y CAPA automatico no existen en ninguna plataforma de la competencia. Nuestro sistema esta hecho a la medida para los procesos de Plexo.

---

## Comparacion de Costos

### Costo de plataformas competidoras (SaaS)

| Plataforma | Modelo de cobro | Costo estimado para Plexo |
|-----------|----------------|-------------------------------|
| YOOBIC | Por ubicacion + modulos | $5,000 - $15,000/mes (requiere 100+ ubicaciones) |
| Zipline | Por usuario (~$3-10/usuario) | $3,000 - $10,000/mes |
| Taqtics | Personalizado | $2,000 - $8,000/mes |
| Zenput/Crunchtime | Por ubicacion | $3,000 - $10,000/mes |
| Connecteam | Por hub + usuarios | $1,000 - $5,000/mes |

**Costo anual estimado con SaaS: $24,000 - $180,000/ano**

Ademas: costos de implementacion ($10,000-$50,000 una vez), sin personalizacion a procesos de Plexo, dependencia del proveedor, datos en servidores externos.

### Costo de nuestra plataforma (propia)

| Concepto | Costo |
|----------|-------|
| Servidor local (ya existente) | $0/mes |
| Apple Developer Program | $99/ano |
| Google Play Developer | $25 (una vez) |
| Firebase (notificaciones push) | Gratis (tier gratuito) |
| Dominio + SSL | ~$50/ano |
| **Total operativo** | **~$175/ano** |

**Ahorro anual estimado vs SaaS: $24,000 - $180,000**

### Ventajas adicionales de plataforma propia

- **Sin cobro por usuario** — no importa si son 50 o 5,000 empleados
- **Datos en nuestros servidores** — control total, cumplimiento local
- **Personalizable** — adaptamos a procesos exactos de Plexo
- **Sin dependencia de proveedor** — no hay riesgo de aumento de precios o cierre del servicio
- **Integracion futura** — se puede conectar con sistemas internos (SAP, nomina, inventario)

---

## Impacto Esperado en Eficiencia y Costos

Los siguientes datos provienen de estudios de la industria y casos documentados de empresas que implementaron plataformas similares.

### Ahorro de Tiempo

| Area | Mejora Esperada | Fuente |
|------|----------------|--------|
| Tareas administrativas de gerentes | **-50% del tiempo** en paperwork y seguimiento manual | YOOBIC / Boots case study |
| Tiempo de completar tareas diarias | **-25%** por digitalizacion y asignacion automatica | National Retail Federation |
| Eficiencia operativa general | **+10-20%** con gestion digital de tareas | U.S. Dept. of Commerce, 2024 |
| Horas ahorradas por tienda/ano | **Hasta 3,000+ horas** al eliminar procesos en papel | UK apparel chain (RFID + digital ops) |

**Ejemplo para Plexo:** Si un gerente de tienda ahorra 1 hora diaria en tareas administrativas, eso equivale a **~365 horas/ano por tienda**. Con 5 tiendas = **1,825 horas/ano** recuperadas para actividades que generan valor.

### Reduccion de Perdidas (Merma)

| Metrica | Impacto | Fuente |
|---------|---------|--------|
| Merma de inventario | **-10% a -18%** con auditorias digitales y capacitacion | NRF / Fashion chain case study |
| Errores operativos | **-30%** con checklists y auditorias estructuradas | Industria retail global |
| Discrepancias en recepciones | **Reduccion de +1% de perdida sobre ventas** al digitalizar verificacion | NetSuite / Industry data |

**Ejemplo para Plexo:** La merma promedio en retail es ~1.4% de ventas. Una reduccion de apenas 10% en merma podria significar **ahorros significativos anuales** dependiendo del volumen de ventas.

### Capacitacion y Cumplimiento

| Metrica | Impacto | Fuente |
|---------|---------|--------|
| Completado de capacitacion | **+50x en modulos completados** con plataforma digital | HP case study |
| Violaciones de cumplimiento | **3.5x mas probable** si completado de capacitacion es < 70% | Brandon Hall Group |
| Merma post-capacitacion | **-18% en merma** al lograr 91% de completado de capacitacion | Fashion chain, 300+ tiendas |
| Tasa de cumplimiento de tareas diarias | **Hasta 100%** con seguimiento digital y notificaciones | YOOBIC / Vitalia case study |

### Gamificacion y Compromiso del Equipo

| Metrica | Impacto | Fuente |
|---------|---------|--------|
| Productividad del empleado | **+48-60% mas engagement** en entorno gamificado | Zippia / IJGBL |
| Productividad de ventas | **+18%** en equipos comprometidos | Gallup |
| Completado de objetivos | **+30%** en tareas completadas | Global IT firm case study |
| Ausentismo | **-12%** con programas de reconocimiento | Microsoft case study |

### Resumen de ROI Proyectado

| Beneficio | Impacto Conservador | Impacto Optimista |
|-----------|--------------------|--------------------|
| Ahorro en tiempo gerencial | 1,825 hrs/ano (5 tiendas) | 3,650 hrs/ano |
| Reduccion de merma | -5% sobre merma actual | -18% sobre merma actual |
| Tasa de cumplimiento | 85% → 95% | 85% → 100% |
| Completado de capacitacion | 40% → 80% | 40% → 95% |
| Engagement del equipo | +30% | +60% |
| Costo de la plataforma | ~$175/ano | ~$175/ano |

> *"Las empresas con estrategias digitales sofisticadas ven un ROI promedio de 17-20% en sus inversiones digitales y 3.3x mayor crecimiento de ingresos vs empresas sin digitalizacion."* — Forrester Research

---

## Proximos Pasos (Roadmap)

### Fase Actual: Publicacion
- Publicar app en App Store y Google Play
- Desplegar servidor en infraestructura local
- Piloto en 1-2 tiendas

### Siguientes Modulos (en orden de prioridad)

| # | Modulo | Descripcion |
|---|--------|-------------|
| 1 | **Chat Interno** | Reemplazar grupos de WhatsApp con mensajeria integrada |
| 2 | **Asistencia / Reloj GPS** | Control de entrada/salida con geo-cerca por tienda |
| 3 | **Insights con IA** | Resumen diario inteligente, deteccion de anomalias, predicciones |
| 4 | **Vision por Computadora** | Verificacion automatica de planogramas y campanas con fotos |
| 5 | **Base de Conocimiento** | Biblioteca de procedimientos y SOPs buscable |
| 6 | **Programacion de Turnos** | Horarios, disponibilidad, costo laboral |

---

*Plexo Operations Platform v2.0 — Febrero 2026*
