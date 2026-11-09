<?php
/**
 * PCG SPA - Conexión de Base de Datos PDO MySQL
 * Configuración oficial y resiliente para WebHost Chile / cPanel y Local
 */

declare(strict_types=1);

class DB {
    private static ?PDO $pdo = null;

    public static function connect(): PDO {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        // 1. Variables de entorno (si se definen en cPanel / .env / Apache)
        $envHost = getenv('DB_HOST') ?: null;
        $envDb   = getenv('DB_NAME') ?: null;
        $envUser = getenv('DB_USER') ?: null;
        $envPass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : null;

        $configs = [];

        if ($envHost && $envDb && $envUser) {
            $configs[] = [
                'host' => $envHost,
                'port' => (int)(getenv('DB_PORT') ?: 3306),
                'db'   => $envDb,
                'user' => $envUser,
                'pass' => $envPass ?? '',
            ];
        }

        // 2. Perfiles oficiales de WebHost Chile (cPanel: pcginfor_admin)
        $configs[] = [
            'host' => 'localhost',
            'port' => 3306,
            'db'   => 'pcginfor_software',
            'user' => 'pcginfor_admin',
            'pass' => 'abc.1233.abc.123',
        ];
        $configs[] = [
            'host' => 'localhost',
            'port' => 3306,
            'db'   => 'pcginfor_pcg',
            'user' => 'pcginfor_admin',
            'pass' => 'abc.1233.abc.123',
        ];
        $configs[] = [
            'host' => '127.0.0.1',
            'port' => 3306,
            'db'   => 'pcginfor_software',
            'user' => 'pcginfor_admin',
            'pass' => 'abc.1233.abc.123',
        ];
        $configs[] = [
            'host' => '127.0.0.1',
            'port' => 3306,
            'db'   => 'pcginfor_pcg',
            'user' => 'pcginfor_admin',
            'pass' => 'abc.1233.abc.123',
        ];

        // 3. Perfil Local XAMPP
        $configs[] = [
            'host' => 'localhost',
            'port' => 3306,
            'db'   => 'pcg_software',
            'user' => 'root',
            'pass' => '',
        ];
        $configs[] = [
            'host' => '127.0.0.1',
            'port' => 3306,
            'db'   => 'pcg_software',
            'user' => 'root',
            'pass' => '',
        ];

        $lastError = null;
        foreach ($configs as $cfg) {
            try {
                $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['db']};charset=utf8mb4";
                $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], $options);
                if ($pdo) {
                    self::$pdo = $pdo;
                    return self::$pdo;
                }
            } catch (PDOException $e) {
                $lastError = $e->getMessage();
            }
        }

        http_response_code(500);
        echo json_encode([
            "ok" => false,
            "error" => "Error de conexión a la base de datos MySQL en WebHost Chile: " . $lastError
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
