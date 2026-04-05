<?php
/**
 * API BRIDGE: WEB PMR
 * Punto de entrada para el Dashboard en tiempo real.
 * Retorna datos en JSON para ser consumidos por script.js
 */

try {
    require_once 'db.php';
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? 'get_all';

switch ($action) {
    case 'db_status':
        try {
            require_once 'db.php';
            echo json_encode(['status' => 'success', 'message' => 'DB Connected']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
    case 'get_agents':
        try {
            $stmt = $pdo->query("SELECT * FROM agentes ORDER BY nombre ASC");
            $agents = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $agents]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_flights':
        try {
            $stmt = $pdo->query("SELECT * FROM vuelos WHERE fecha >= CURRENT_DATE ORDER BY fecha, hora_programada ASC");
            $flights = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $flights]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'save_agents':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
            break;
        }
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $agents = $input['agents'] ?? [];

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO agentes (id, nombre, rut, telefono, direccion, comuna, equipo, tica, estado, shift_status) 
                                   VALUES (:id, :nombre, :rut, :telefono, :direccion, :comuna, :equipo, :tica, :estado, :shift_status)
                                   ON DUPLICATE KEY UPDATE 
                                   nombre = VALUES(nombre), 
                                   rut = VALUES(rut),
                                   telefono = VALUES(telefono), 
                                   direccion = VALUES(direccion),
                                   comuna = VALUES(comuna),
                                   equipo = VALUES(equipo), 
                                   tica = VALUES(tica), 
                                   estado = VALUES(estado), 
                                   shift_status = VALUES(shift_status)");

            foreach ($agents as $agent) {
                $stmt->execute([
                    ':id' => $agent['id'],
                    ':nombre' => strtoupper($agent['name']),
                    ':rut' => $agent['rut'] ?? '---',
                    ':telefono' => $agent['phone'] ?? '+56 9 -----',
                    ':direccion' => $agent['address'] ?? '-',
                    ':comuna' => $agent['commune'] ?? '-',
                    ':equipo' => (strpos(strtoupper($agent['team']), 'LATAM') !== false) ? 'LATAM' : 'OLA',
                    ':tica' => ($agent['tica'] ? 1 : 0),
                    ':estado' => $agent['status'] ?? 'offline',
                    ':shift_status' => $agent['shift'] ?? 'inactive'
                ]);
            }
            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => count($agents) . ' agentes procesados']);
        } catch (Exception $e) {
            if ($pdo->inTransaction())
                $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'assign_tasks':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
            break;
        }
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $tasks = $input['tasks'] ?? [];

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO asistencias (vuelo_num, agente_id, pax_name, ssr, category, transfer_type, obs) 
                                   VALUES (:vn, :aid, :pn, :ssr, :cat, :tt, :obs)");

            foreach ($tasks as $task) {
                $stmt->execute([
                    ':vn' => $task['flight'],
                    ':aid' => $task['assignedTo'],
                    ':pn' => strtoupper($task['pax']),
                    ':ssr' => $task['ssr'],
                    ':cat' => $task['category'],
                    ':tt' => $task['transferType'] ?? 'Tramo Completo',
                    ':obs' => $task['obs'] ?? ''
                ]);
            }
            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => count($tasks) . ' asignaciones creadas']);
        } catch (Exception $e) {
            if ($pdo->inTransaction())
                $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_agent_tasks':
        try {
            $agent_id = $_GET['agent_id'] ?? '';
            if (!$agent_id)
                throw new Exception("ID de agente requerido");

            $stmt = $pdo->prepare("SELECT * FROM asistencias WHERE agente_id = :id AND status != 'finalizado' AND status != 'rechazado' ORDER BY asignado_at DESC");
            $stmt->execute([':id' => $agent_id]);
            $tasks = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $tasks]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'update_task_status':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
            break;
        }
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $task_id = $input['task_id'];
            $status = $input['status'];
            $tomado = $input['tomado_en'] ?? null;
            $dejado = $input['dejado_en'] ?? null;
            $status_pax = $input['status_pax'] ?? null;

            $sql = "UPDATE asistencias SET status = :status";
            $params = [':status' => $status, ':id' => $task_id];

            if ($status === 'en curso')
                $sql .= ", aceptado_at = IFNULL(aceptado_at, CURRENT_TIMESTAMP)";
            if ($status === 'finalizado')
                $sql .= ", finalizado_at = CURRENT_TIMESTAMP";

            if ($tomado) {
                $sql .= ", tomado_en = :tomado";
                $params[':tomado'] = $tomado;
            }
            if ($dejado) {
                $sql .= ", dejado_en = :dejado";
                $params[':dejado'] = $dejado;
            }
            if ($status_pax) {
                $sql .= ", status_pax = :sp";
                $params[':sp'] = $status_pax;
            }

            $sql .= " WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'update_profile':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
            break;
        }
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE agentes SET 
                                    direccion = :direccion, 
                                    direccion_num = :num,
                                    telefono = :telefono, 
                                    tica = :tica, 
                                    talla_polera = :talla, 
                                    genero = :genero,
                                    comuna = :comuna
                                   WHERE id = :id");
            $stmt->execute([
                ':direccion' => $input['direccion'],
                ':num' => $input['num'],
                ':telefono' => $input['telefono'],
                ':tica' => $input['tica'],
                ':talla' => $input['talla'],
                ':genero' => $input['genero'],
                ':comuna' => $input['comuna'],
                ':id' => $input['id']
            ]);
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'login':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $rawRut = $input['rut'] ?? '';
            $cleanRut = str_replace(['.', '-', ' '], '', $rawRut);

            $stmt = $pdo->prepare("SELECT id, nombre, role, equipo FROM agentes WHERE REPLACE(REPLACE(rut, '.', ''), '-', '') = :rut LIMIT 1");
            $stmt->execute([':rut' => $cleanRut]);
            $user = $stmt->fetch();

            if ($user && is_array($user)) {
                echo json_encode(['status' => 'success', 'user' => $user]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'RUT no encontrado en el sistema.']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'add_medical_license':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO licencias (id_agente, fecha_inicio, fecha_fin, descripcion, adjuntos) VALUES (:id, :inicio, :fin, :desc, :adj)");
            $stmt->execute([
                ':id' => $input['id_agente'],
                ':inicio' => $input['fecha_inicio'],
                ':fin' => $input['fecha_fin'],
                ':desc' => $input['descripcion'],
                ':adj' => json_encode($input['adjuntos'])
            ]);
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_all_licenses':
        try {
            $stmt = $pdo->query("SELECT l.*, a.nombre as agente_nombre FROM licencias l JOIN agentes a ON l.id_agente = a.id ORDER BY l.created_at DESC");
            $licenses = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $licenses]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_all_tasks':
        try {
            $stmt = $pdo->query("SELECT t.*, a.nombre as agente_nombre FROM asistencias t LEFT JOIN agentes a ON t.agente_id = a.id ORDER BY t.asignado_at DESC");
            $tasks = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $tasks]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_all_asistencias':
        try {
            $stmt = $pdo->query("SELECT * FROM asistencias ORDER BY asignado_at DESC");
            $asistencias = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $asistencias]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida']);
        break;
}
?>