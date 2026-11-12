<?php
/**
 * PCG SPA - Autenticación con MySQL
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = DB::connect();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Método no permitido', 405);
    }

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    $email = trim($payload['email'] ?? '');
    $password = trim($payload['password'] ?? '');

    if (empty($email) || empty($password)) {
        jsonError('Correo o RUT y contraseña requeridos', 400);
    }

    $cleanRut = str_replace(['.', '-'], '', $email);
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE (LOWER(email) = LOWER(:id1) OR rut = :id2 OR REPLACE(REPLACE(rut, '.', ''), '-', '') = :id3) AND activo = 1 LIMIT 1");
    $stmt->execute([':id1' => $email, ':id2' => $email, ':id3' => $cleanRut]);
    $u = $stmt->fetch();

    if (!$u) {
        jsonError('Credenciales incorrectas o usuario inactivo', 401);
    }

    // Comprobación de password (soporta hash bcrypt, texto plano o clave maestra pcg123)
    $valid = ($password === $u['password']) || password_verify($password, $u['password']) || ($password === 'pcg123');

    if (!$valid) {
        jsonError('Credenciales incorrectas', 401);
    }

    // Usuario autenticado exitosamente
    $user = [
        'id' => (int)$u['id'],
        'nombre' => $u['nombre'],
        'email' => $u['email'],
        'rol' => $u['rol'],
        'rolEtiqueta' => $u['rol_etiqueta'],
        'rut' => $u['rut'],
        'telefono' => $u['telefono'],
        'cargo' => $u['cargo'],
        'titulo' => $u['titulo'],
        'empresaId' => $u['empresa_id'] !== null ? (int)$u['empresa_id'] : null,
        'color' => $u['color'],
        'activo' => (bool)$u['activo'],
    ];

    jsonResponse([
        'ok' => true,
        'message' => 'Autenticación exitosa',
        'user' => $user,
        'token' => base64_encode($u['id'] . ':' . time() . ':pcg_secure_session'),
    ]);

} catch (Throwable $e) {
    jsonError('Error en autenticación: ' . $e->getMessage(), 500);
}

