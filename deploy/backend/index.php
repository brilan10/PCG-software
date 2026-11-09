<?php
/**
 * PCG SPA - Panel Principal del Backend PHP & MySQL (XAMPP)
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

$dbOnline = false;
$stats = [];
$errorMsg = null;

try {
    $pdo = DB::connect();
    $dbOnline = true;
    $version = $pdo->query("SELECT VERSION()")->fetchColumn();
    $stats['users'] = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
    $stats['empresas'] = $pdo->query("SELECT COUNT(*) FROM empresas")->fetchColumn();
    $stats['equipos'] = $pdo->query("SELECT COUNT(*) FROM equipos")->fetchColumn();
    $stats['tickets'] = $pdo->query("SELECT COUNT(*) FROM tickets")->fetchColumn();
    $stats['ots'] = $pdo->query("SELECT COUNT(*) FROM ots")->fetchColumn();
    $stats['proyectos'] = $pdo->query("SELECT COUNT(*) FROM proyectos_web")->fetchColumn();
    $stats['inventario'] = $pdo->query("SELECT COUNT(*) FROM inventario")->fetchColumn();
} catch (Throwable $e) {
    $errorMsg = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PCG SPA - Backend PHP & MySQL (XAMPP)</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-8 font-sans">
    <div class="max-w-4xl mx-auto space-y-6">
        <header class="border-b border-slate-800 pb-6 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
                    ⚡
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-white">PCG SPA Backend API</h1>
                    <p class="text-xs text-slate-400">Servicio de Datos en Vivo &bull; PHP <?= PHP_VERSION ?> + MySQL (XAMPP)</p>
                </div>
            </div>
            <div>
                <?php if ($dbOnline): ?>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span class="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
                        MySQL Conectado (100% Operativo)
                    </span>
                <?php else: ?>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                        <span class="h-2 w-2 rounded-full bg-red-400 mr-2"></span>
                        Desconectado de MySQL
                    </span>
                <?php endif; ?>
            </div>
        </header>

        <?php if ($errorMsg): ?>
            <div class="bg-red-950/50 border border-red-800/80 rounded-xl p-4 text-sm text-red-200">
                <strong>Error de conexión:</strong> <?= htmlspecialchars($errorMsg) ?>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Usuarios</p>
                    <p class="text-2xl font-bold text-emerald-400 mt-1"><?= $stats['users'] ?></p>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Empresas</p>
                    <p class="text-2xl font-bold text-blue-400 mt-1"><?= $stats['empresas'] ?></p>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Equipos</p>
                    <p class="text-2xl font-bold text-purple-400 mt-1"><?= $stats['equipos'] ?></p>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Proyectos Web</p>
                    <p class="text-2xl font-bold text-amber-400 mt-1"><?= $stats['proyectos'] ?></p>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Órdenes Trabajo (OT)</p>
                    <p class="text-2xl font-bold text-rose-400 mt-1"><?= $stats['ots'] ?></p>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tickets</p>
                    <p class="text-2xl font-bold text-cyan-400 mt-1"><?= $stats['tickets'] ?></p>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Inventario</p>
                    <p class="text-2xl font-bold text-lime-400 mt-1"><?= $stats['inventario'] ?></p>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Base de Datos</p>
                    <p class="text-xs font-mono text-slate-300 mt-2 truncate">pcg_software (MariaDB <?= htmlspecialchars($version ?? '') ?>)</p>
                </div>
            </div>
        <?php endif; ?>

        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 class="text-lg font-semibold text-white mb-3">Endpoints API Disponibles</h2>
            <div class="space-y-3 font-mono text-xs">
                <div class="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                        <span class="text-slate-300">/api/db.php</span>
                    </div>
                    <span class="text-slate-400">Descarga el estado completo sincronizado con MySQL</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">POST</span>
                        <span class="text-slate-300">/api/db.php</span>
                    </div>
                    <span class="text-slate-400">Persiste y actualiza cambios en todas las tablas de MySQL</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">POST</span>
                        <span class="text-slate-300">/api/auth.php</span>
                    </div>
                    <span class="text-slate-400">Autentica usuarios directamente contra la tabla usuarios</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 font-bold">GET</span>
                        <span class="text-slate-300">/api/health.php</span>
                    </div>
                    <span class="text-slate-400">Diagnóstico de estado y conteo de filas de todas las 22 tablas</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>

