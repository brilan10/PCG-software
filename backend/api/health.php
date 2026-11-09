<?php
/**
 * PCG SPA - Health Check & Diagnóstico MySQL
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = DB::connect();

    $tables = [
        'usuarios', 'empresas', 'equipos', 'intervenciones', 'tickets',
        'servicios', 'paquetes', 'cotizaciones', 'ots', 'tareas',
        'programas', 'alertas_enviadas', 'correos', 'informes',
        'facturas', 'movimientos', 'inventario', 'proyectos_web',
        'banco_conexion', 'configuracion', 'descuentos', 'secuencias'
    ];

    $counts = [];
    $totalRecords = 0;
    foreach ($tables as $t) {
        $c = (int)$pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
        $counts[$t] = $c;
        $totalRecords += $c;
    }

    $version = $pdo->query("SELECT VERSION()")->fetchColumn();

    jsonResponse([
        'status' => 'ONLINE',
        'database' => 'pcg_software',
        'motor' => 'MySQL / MariaDB (XAMPP)',
        'mysql_version' => $version,
        'php_version' => PHP_VERSION,
        'total_tables' => count($tables),
        'total_records' => $totalRecords,
        'tables' => $counts,
        'timestamp' => date('c'),
    ]);
} catch (Throwable $e) {
    jsonError('Fallo al conectar con MySQL en XAMPP: ' . $e->getMessage(), 500);
}

