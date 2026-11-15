<?php
/**
 * PCG SPA - Cambio Seguro de Contraseña
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

    $userId = (int)($payload['userId'] ?? 0);
    $currentPassword = trim($payload['currentPassword'] ?? '');
    $newPassword = trim($payload['newPassword'] ?? '');

    if ($userId <= 0) {
        jsonError('Identificador de usuario inválido', 400);
    }

    if (empty($newPassword) || strlen($newPassword) < 4) {
        jsonError('La nueva contraseña debe tener al menos 4 caracteres', 400);
    }

    $stmt = $pdo->prepare("SELECT id, nombre, email, password FROM usuarios WHERE id = :id AND activo = 1 LIMIT 1");
    $stmt->execute([':id' => $userId]);
    $u = $stmt->fetch();

    if (!$u) {
        jsonError('Usuario no encontrado o inactivo', 404);
    }

    // Verificar contraseña actual (si no se proporciona vacía)
    $storedPass = (string)$u['password'];
    $isDefault = ($storedPass === 'pcg123') || password_verify('pcg123', $storedPass);
    $currentMatches = ($currentPassword === $storedPass) || password_verify($currentPassword, $storedPass) || ($isDefault && $currentPassword === 'pcg123');

    if (!$currentMatches) {
        jsonError('La contraseña actual ingresada es incorrecta', 401);
    }

    // Hashear la nueva contraseña con BCRYPT
    $hashedNewPass = password_hash($newPassword, PASSWORD_BCRYPT);

    $updateStmt = $pdo->prepare("UPDATE usuarios SET password = :password WHERE id = :id");
    $updateStmt->execute([
        ':password' => $hashedNewPass,
        ':id' => $userId,
    ]);

    jsonResponse([
        'ok' => true,
        'message' => 'Contraseña actualizada correctamente',
        'esClavePorDefecto' => ($newPassword === 'pcg123'),
    ]);

} catch (Throwable $e) {
    jsonError('Error al actualizar contraseña: ' . $e->getMessage(), 500);
}
