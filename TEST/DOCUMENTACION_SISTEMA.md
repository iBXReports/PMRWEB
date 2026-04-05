# 🛡️ DOCUMENTACIÓN TÉCNICA: WebPMR Operational Command Center

Esta documentación detalla la arquitectura, funcionalidades y componentes tácticos del dashboard **WebPMR**, diseñado para la supervisión y orquestación de servicios de asistencia a pasajeros de movilidad reducida.

---

## 🏗️ 1. Arquitectura General y Estética
*   **Diseño "Elite Vibrant"**: Estética de alto contraste con elementos de *glassmorphism* (cristal esmerilado) y desenfoque cinemático (blur 12px).
*   **Dualidad de Temas**: Soporte nativo para Modo Oscuro (Pizarra Profunda/Azul Índigo) y Modo Claro (Gris Nube/Slate), con persistencia de estado.
*   **Sincronización Logística**: Sistema de renderizado reactivo a través de `DataManager` para asegurar que los KPIs y tablas reflejen la base de datos operativa en tiempo real.

---

## 🧭 2. Navegación Global (SIDEBAR)
El menú lateral utiliza una cuadrícula moderna de 2 columnas para optimizar el acceso táctico.
*   📊 **Dashboard**: Resumen ejecutivo y supervisión de agentes.
*   ✈️ **Vuelos**: Registro masivo de operaciones (24 horas).
*   🛣️ **Tramos**: Auditoría detallada de trayectos individuales.
*   ♿ **Pasajeros PMR**: Directorio estratégico de asistencias diarias.
*   📋 **Asignaciones**: Central de tareas y orquestación de personal.
*   🧑‍✈️ **Agentes**: *(En desarrollo)* Administración de personal.
*   ⏰ **Timeline**: cronograma detallado de hitos operativos.
*   ⚙️ **Ajustes**: Configuración técnica del panel.
*   ❓ **¿Cómo se usa?** (Wide): Botón de ancho completo para soporte rápido.

---

## 🛰️ 3. Barra de Utilidad Superior (TOPBAR)
*   🕒 **Reloj Dinámico**: Hora exacta con segundos para precisión en despegues/arribos.
*   ☁️ **Widget Clima**: Monitoreo de condiciones en Pudahuel (SCL).
*   🏷️ **Turno Actual**: Indicador visual del turno administrativo activo.
*   🟢 **Status DB**: Indicador de latencia y conexión con el servidor de datos central.
*   🌙 **Theme Toggle**: Selector instantáneo de modo oscuro/claro.

---

## 🖥️ 4. Pestaña: DASHBOARD (Mando Ejecutivo)
*   **Metrics Grid**: KPIs de alto nivel (Total asistencias, agentes activos/libres/en servicio).
*   **Distribución de Equipo**: Desglose visual por aerolínea (LATAM vs OLA) y estado administrativo (TICA).
*   **Flight Timelines**: Carruseles horizontales paginados de **5 en 5**. Permiten previsualizar los próximos 10 vuelos por categoría.
*   **Supervisión de Agentes**: Tarjetas vibrantes con indicadores de estado pulsantes.
    *   **Temporizadores H:M**: Seguimiento de colaciones y servicios con alertas de color (Verde >15m, Naranja <=15m, Rojo Excedido).
    *   **WA Hub**: Botón táctico de contacto directo vía WhatsApp en cada tarjeta.

---

## ✈️ 5. Pestaña: VUELOS (Listado General)
*   **Filtros de Precisión**: Búsqueda por número de vuelo y selector de fecha operativa.
*   **Grilla Aerolíneas (7x2)**: Sistema de filtrado visual mediante logos de aerolíneas estandarizados (120x35px) con bordes redondeados.
*   **Ops-Table Premium**: Tabla de alta densidad con:
    *   Logos de aerolínea con escalado inteligente (`object-fit`).
    *   Etiquetas de Terminal (NAC/INT).
    *   Badge de Gate y Ruta.

---

## 🛣️ 6. Pestaña: TRAMOS (Auditoría de Datos)
*   **Agregar Manual**: Botón prominente para cargar asistencias excepcionales.
*   **Tabla de Auditoría**:
    *   🕒 **ULT INFO**: Columna de trazabilidad que registra la hora exacta (formato 24h) cada vez que se cambia algún valor de **📍 TOMADO EN**, **🏁 DEJADO EN** o **⏱️ ESTADO**.
    *   🦺 **Agente Interactivo**: Al posicionar el cursor sobre el ID de agente, se despliega un popover con nombre completo, equipo y botón de WhatsApp.
    *   🧘 **Tipo Badge**: Distinción vibrante entre *ARRIBO* (Rojo) y *EMBARQUE* (Azul).

---

## ♿ 7. Pestaña: PASAJEROS PMR (Directorio Táctico)
*   **KPIs de Asistencia**:
    *   **PMR/Agentes NAC & INT**: Cálculo automático basado en terminal y ciudad de destino.
    *   **Estado Operativo**: Conteo de Aceptados, Cancelados y No Contactados.
*   **Registro 24 Horas**: Listado completo del día para auditoría integral.
*   **SSR Categorizado**: Badges con colores sólidos de alta visibilidad:
    *   🛑 **WCHC**: Red (Alta prioridad).
    *   🔵 **WCHR**: Blue (Estándar).
    *   🟠 **WCHS**: Orange (Especial).
    *   🟢 **MAAS**: Green (Asistencia general).
*   **Popover de Pasajero**: Al pasar el ratón sobre el nombre del pasajero, se visualiza el **PNR y Asiento** en una burbuja flotante.

---

## 📋 8. Pestaña: ASIGNACIONES (Mando de Personal)
*   **Auditoría de Tareas (6 KPIs)**: Seguimiento de tareas Asignadas, En Proceso, Terminadas, Fallidas, Agentes en Colación y Alertas de retraso.
*   **🕒 ULT INFO (Automático)**: Monitoreo cronométrico en formato 24 horas que se actualiza con cualquier cambio en el ciclo de vida de la tarea o el pasajero.
*   **Supervisión de Colaciones**: Automatización de ventanas de 60 minutos con sistema de alertas preventivas para evitar brechas operativas.
*   **Truncado Táctico**: Los nombres de pasajeros en tareas masivas se limitan a 15 caracteres para optimizar la densidad de información, con detalle total vía hover.

---

## 🛠️ 9. Módulos de Transacción (MODALES)
*   ➕ **Agregar PMR (Manual)**: Entrada de vuelo con datalist predictivo y asignación automática por CDO/SPVR.
*   📋 **Asignación Estratégica**: Orquestación masiva agrupada por número de vuelo para coordinar arribos/embarques completos en un solo paso.
*   🎯 **Nueva Tarea**: Creador de órdenes operacionales no-PMR (Colación, Insumos, Counters).

---
*Día de actualización: 03/04/2026*


Si, genera el script SQL exacto para asi yo despues pegarlo en el "SQL Editor" de Supabase y así dejar las tablas listas para recibir datos y luego de eso actua como un desarrollador web profesional y revisa todo el sitio web, quiero que busques errores e inconsistencias y me entregues un informe detallado de donde esta el error, problema, inconsistencia y como podria mejorarlo. Puedes tambien sugerirme o darme consejos relacionados a que podria hacer de novedoso en el sitio, es mas, dame 10 ejemplos en el informe. Tambien quiero que busques codigo basura y me indiques por que seria mejor eliminarlo.


Para que tengas una idea, el sitio web que estamos desarrollando es para tener el conocimiento de nuestra operacion como empresa en el aeropuerto, CargoMobility presta servicios de movilizacion de pasajeros "PMR" desde counters hasta el avion y desde el avion a la salida del aeropuerto, acompañando a los pasajeros que las aerolineas nos informan en todo momento.

Detallame todo el informe en un archivo nuevo

Mejor aun, hazme un sitio web en html con imagenes, colorida y todo de que mejorar, como mejorar y para que mejorar, ideas de kpi, graficos, dame 40 ideas para index.html, 40 paraagentepmr.html y 40 para aerolineas.html, detallado al mas minimo detalle, con codigo, imagenes, todo. Quiero que cada idea de la detalles y me expliques con MINIMO 400 PALABRAS CADA UNO el por que seria buena idea implementarlo, para que serviria y como ejecutarlo.
