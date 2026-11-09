<?php
/**
 * PCG SPA - Conexión de Base de Datos PDO MySQL
 * Configuración Oficial para WebHost Chile / cPanel y Local
 */

declare(strict_types=1);

// ============================================================================
// 1. CONFIGURACIÓN OFICIAL WEBHOST CHILE (cPanel)
// ============================================================================
define('DB_PROD_HOST', 'localhost');
define('DB_PROD_USER', 'pcginfor_admin');
define('DB_PROD_PASS', 'abc.1233.abc.123');
define('DB_PROD_NAME', 'pcginfor_software');

class DB {
    private static ?PDO $pdo = null;

    public static function connect(): PDO {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $dbNames = [
            DB_PROD_NAME,
            'pcginfor_pcg',
            'pcginfor_software',
            'pcginfor_pcgsoftware',
            'pcginfor_pcg_software',
            'pcginfor_basededatos',
            'pcginfor_bd',
            'pcg_software'
        ];

        $configs = [];

        // Conexiones en Producción (Host: localhost y 127.0.0.1)
        foreach (array_unique($dbNames) as $dbName) {
            $configs[] = [
                'host' => DB_PROD_HOST,
                'port' => 3306,
                'db'   => $dbName,
                'user' => DB_PROD_USER,
                'pass' => DB_PROD_PASS,
            ];
            $configs[] = [
                'host' => '127.0.0.1',
                'port' => 3306,
                'db'   => $dbName,
                'user' => DB_PROD_USER,
                'pass' => DB_PROD_PASS,
            ];
        }

        // Fallback de Desarrollo Local (XAMPP root sin clave)
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

        throw new RuntimeException("Error al conectar con la base de datos MySQL en WebHost Chile / XAMPP: " . $lastError);
    }
}
