-- 
-- SCHEMA: WEB PMR (Operational Management)
-- Compatible con MySQL (XAMPP) y escalable a Supabase (PostgreSQL)
--

CREATE DATABASE IF NOT EXISTS webpmr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE webpmr;

-- 1. Tabla de Agentes (RRHH y Estado Operativo)
CREATE TABLE IF NOT EXISTS agentes (
    id VARCHAR(20) PRIMARY KEY, -- Formato AG-0001
    nombre VARCHAR(100) NOT NULL,
    rut VARCHAR(20),
    telefono VARCHAR(20),
    direccion VARCHAR(100),
    direccion_num VARCHAR(20),
    comuna VARCHAR(50),
    equipo VARCHAR(50) DEFAULT 'LATAM',
    tica VARCHAR(50) DEFAULT '⛔Pendiente',
    ubicacion ENUM('NACIONAL', 'INTERNACIONAL', '-') DEFAULT 'NACIONAL',
    estado ENUM('available', 'lunch', 'service', 'absent', 'offline') DEFAULT 'offline',
    shift_status ENUM('active', 'inactive') DEFAULT 'inactive',
    lunch_start DATETIME NULL,
    last_task_time TIME NULL,
    role ENUM('agente', 'supervisor') DEFAULT 'agente',
    talla_polera VARCHAR(20) DEFAULT 'M',
    genero VARCHAR(20) DEFAULT 'MASCULINO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Vuelos (Programación Operativa)
CREATE TABLE IF NOT EXISTS vuelos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aerolinea_code VARCHAR(10), -- LA, OT
    aerolinea_name VARCHAR(50), -- LATAM, SKY, etc
    vuelo_num VARCHAR(20),
    fecha DATE NOT NULL,
    hora_programada TIME NOT NULL, -- ETD o ETA
    tipo ENUM('EMBARQUE', 'DESEMBARQUE') NOT NULL,
    terminal ENUM('NACIONAL', 'INTERNACIONAL') DEFAULT 'NACIONAL',
    gate VARCHAR(20),
    pmr_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Asistencias (Relación Vuelo - Agente - Tarea)
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vuelo_num VARCHAR(20),
    agente_id VARCHAR(20),
    pax_name VARCHAR(100),
    ssr VARCHAR(10),
    category VARCHAR(20), -- EMBARQUE / ARRIBO
    transfer_type VARCHAR(50), -- Tramo Completo / Ultima Milla
    pax_id VARCHAR(50), -- ID único para el pasajero (PMR-XXXX)
    status ENUM('pendiente', 'en curso', 'finalizado', 'rechazado') DEFAULT 'pendiente',
    status_pax VARCHAR(50) DEFAULT 'En Espera',
    tomado_en VARCHAR(100) DEFAULT 'Informar',
    dejado_en VARCHAR(100) DEFAULT 'Informar',
    obs TEXT,
    asignado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aceptado_at TIMESTAMP NULL,
    finalizado_at TIMESTAMP NULL,
    FOREIGN KEY (agente_id) REFERENCES agentes(id)
);

-- NOTA: Si ya tienes la tabla creada en Supabase, ejecuta:
-- ALTER TABLE asistencias ADD COLUMN pax_id VARCHAR(50);
-- ALTER TABLE asistencias ADD COLUMN aceptado_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE asistencias ADD COLUMN finalizado_at TIMESTAMP WITH TIME ZONE;


-- 4. Módulo de Licencias Médicas (RRHH)
CREATE TABLE IF NOT EXISTS licencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_agente VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    descripcion TEXT,
    adjuntos LONGTEXT, -- Almacenaremos JSON con nombres y base64/links
    status ENUM('pendiente', 'procesado') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_agente) REFERENCES agentes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 
-- DATA MOCK INITIAL (EXTENDIDO PARA PRUEBAS)
--

-- Borrado de datos previos para limpieza de pruebas (opcional)
DELETE FROM asistencias;
DELETE FROM vuelos;
DELETE FROM agentes;

-- 1. AGENTES (Diversidad de estados y equipos)
INSERT INTO agentes (id, nombre, rut, telefono, direccion, direccion_num, comuna, equipo, tica, ubicacion, estado, shift_status, role) VALUES
('AG-0001', 'JUAN DELGADO', '12.345.678-9', '+56 9 1111 2222', 'Av. El Trigal', '1044', 'Pudahuel', 'LATAM', '🪪Tica Vigente', 'NACIONAL', 'available', 'active', 'agente'),
('AG-0002', 'MARIA ROJAS', '9.876.543-1', '+56 9 3333 4444', 'Calle San Pablo', '8520', 'Santiago Centro', 'OLA', '🪪Tica Vigente', 'INTERNACIONAL', 'lunch', 'active', 'agente'),
('AG-0003', 'PEDRO RIVERA', '15.667.889-K', '+56 9 5555 6666', 'Pasaje Las Lilas', '22', 'Maipú', 'LATAM', '⛔Pendiente', 'NACIONAL', 'service', 'active', 'agente'),
('AG-0004', 'ANA SAAVEDRA', '17.737.508-K', '+56 9 7777 8888', 'Gran Avenida', '4500', 'San Miguel', 'OLA', '🎫Renovando Tica', 'INTERNACIONAL', 'available', 'active', 'agente'),
('AG-0005', 'CARLOS TAPIA', '10.223.445-5', '+56 9 9999 0000', 'Vicuña Mackenna', '120', 'La Florida', 'LATAM', '🪪Tica Vigente', 'NACIONAL', 'offline', 'inactive', 'agente'),
('CDO-001', 'ADMIN DASHBOARD', '11.223.344-5', '+56 9 0000 0000', '-', '-', '-', 'SUPERVISOR', '🪪Tica Vigente',  '-', 'available', 'active', 'supervisor');

-- 2. VUELOS (Programación para hoy)
INSERT INTO vuelos (aerolinea_code, aerolinea_name, vuelo_num, fecha, hora_programada, tipo, terminal, gate, pmr_count) VALUES
('LA', 'LATAM', 'LA120', CURRENT_DATE, '08:30:00', 'EMBARQUE', 'NACIONAL', 'D01', 3),
('LA', 'LATAM', 'LA670', CURRENT_DATE, '10:15:00', 'EMBARQUE', 'NACIONAL', 'D05', 5),
('SK', 'SKY', 'SK405', CURRENT_DATE, '11:00:00', 'DESEMBARQUE', 'NACIONAL', 'A12', 4),
('JA', 'JETSMART', 'JA204', CURRENT_DATE, '12:30:00', 'EMBARQUE', 'NACIONAL', 'B08', 2),
('LA', 'LATAM', 'LA702', CURRENT_DATE, '14:45:00', 'DESEMBARQUE', 'INTERNACIONAL', 'T2-C1', 6),
('CM', 'COPA', 'CM450', CURRENT_DATE, '16:20:00', 'EMBARQUE', 'INTERNACIONAL', 'T2-D5', 2);

-- 3. ASISTENCIAS (Tareas actuales y pendientes)
-- Tareas Pendientes (Para asignar desde 'Pasajeros PMR')
INSERT INTO asistencias (vuelo_num, agente_id, pax_name, ssr, category, status, status_pax, obs) VALUES
('LA120', NULL, 'DIEGO ARMANDO MARADONA', 'WCHR', 'EMBARQUE', 'pendiente', 'En Espera', 'Requiere apoyo en gate'),
('LA120', NULL, 'CLAUDIA SCHMITT', 'WCHC', 'EMBARQUE', 'pendiente', 'En Espera', 'Pasajero con movilidad reducida severa'),
('SK405', NULL, 'ROBERTO CARLOS', 'BLND', 'ARRIBO', 'pendiente', 'En Espera', 'Pasajero discapacitado visual'),
('LA702', NULL, 'GABRIEL GARCIA MARQUEZ', 'WCHR', 'ARRIBO', 'pendiente', 'En Espera', 'Trae silla propia de 15kg');

-- Tareas Asignadas (Para reasignar o auditar desde 'Asignaciones')
INSERT INTO asistencias (vuelo_num, agente_id, pax_name, ssr, category, status, status_pax, obs, asignado_at) VALUES
('LA670', 'AG-0001', 'ELIAS FIGUEROA', 'WCHS', 'EMBARQUE', 'en curso', 'Contactado', 'En puente de embarque', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('LA670', 'AG-0003', 'MARCELO SALAS', 'WCHR', 'EMBARQUE', 'en curso', 'Trayecto a Puerta', 'Maleta de mano pesada', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
('JA204', 'AG-0004', 'GABRIELA MISTRAL', 'WCHR', 'EMBARQUE', 'finalizado', 'Finalizado', 'Servicio completado sin novedad', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('SK405', 'AG-0001', 'PABLO NERUDA', 'WCHR', 'ARRIBO', 'en curso', 'En Conexión', 'Viene de vuelo internacional delay', DATE_SUB(NOW(), INTERVAL 10 MINUTE));
