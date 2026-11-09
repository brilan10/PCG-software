# prepare_deploy.ps1 - Script de Construccion y Empaquetado para Despliegue en WebHost Chile / cPanel
$ErrorActionPreference = "Stop"
$Workspace = $PSScriptRoot
$DeploydDir = "$Workspace\deployd"
$ZipPath = "$Workspace\deploy.zip"

Set-Location $Workspace

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  INICIANDO PREPARACION DE DESPLIEGUE - PCG SPA SOFTWARE" -ForegroundColor Cyan
Write-Host "  Destino: Carpeta deployd/ para WebHost Chile / cPanel" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Eliminar carpeta deploy/ antigua si existiera
if (Test-Path "$Workspace\deploy") {
    Write-Host "`nLimpiando carpeta redundante deploy/..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$Workspace\deploy"
}

# 2. Compilar Frontend (React + Vite + TypeScript)
Write-Host "`n[1/5] Compilando Frontend (React + Vite + TypeScript)..." -ForegroundColor Yellow
Set-Location "$Workspace\frontend"
npm.cmd run build
Set-Location $Workspace

# 3. Limpiar y recrear la carpeta oficial deployd/
Write-Host "`n[2/5] Preparando directorio oficial deployd/..." -ForegroundColor Yellow
if (Test-Path $DeploydDir) {
    Remove-Item -Recurse -Force "$DeploydDir\*"
} else {
    New-Item -ItemType Directory -Force -Path $DeploydDir | Out-Null
}

# 4. Copiar Frontend compilado (dist) a deployd/
Write-Host "`n[3/5] Copiando archivos compilados del Frontend a deployd/..." -ForegroundColor Yellow
Copy-Item -Path "$Workspace\frontend\dist\*" -Destination $DeploydDir -Recurse -Force

# 5. Copiar Backend PHP a deployd/backend/
Write-Host "`n[4/5] Copiando Backend PHP a deployd/backend/..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$DeploydDir\backend" | Out-Null
Copy-Item -Path "$Workspace\backend\*" -Destination "$DeploydDir\backend" -Recurse -Force

# Eliminar scripts temporales si existieran
if (Test-Path "$DeploydDir\backend\database\hash_passwords.php") {
    Remove-Item -Force "$DeploydDir\backend\database\hash_passwords.php"
}

# 6. Generar archivo .htaccess para enrutamiento limpio SPA + API en Apache (WebHost Chile)
Write-Host "`n[5/5] Generando .htaccess, reglas Apache y configuración de producción..." -ForegroundColor Yellow

$htaccessContent = @"
# .htaccess - PCG SPA Software de Gestión Integral TI
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Permitir acceso directo a backend y endpoints API
  RewriteRule ^backend/ - [L]
  RewriteRule ^api/(.*)$ backend/api/$1 [L]
  RewriteRule ^assets/ - [L]
  RewriteRule ^img/ - [L]

  # Si el archivo o directorio existe físicamente en el disco, servirlo directo
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Todo lo demás se redirige a la Single Page App (index.html de React)
  RewriteRule ^ index.html [L]
</IfModule>

# Seguridad, tipos MIME y prevención de caché antigua en navegadores / móviles
AddDefaultCharset UTF-8
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"

  # NUNCA cachear index.html para que los cambios en producción se reflejen de inmediato
  <FilesMatch "(index\.html|manifest\.json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
</IfModule>
"@

Set-Content -Path "$DeploydDir\.htaccess" -Value $htaccessContent -Encoding UTF8

# Copiar respaldo oficial de base de datos SQL con contraseñas en bcrypt
$sqlSource = "$Workspace\backend\database\database_pcg_software.sql"
if (Test-Path $sqlSource) {
    Copy-Item -Path $sqlSource -Destination "$DeploydDir\database_pcg_software.sql" -Force
}

# Configurar db.php en deployd optimizado con perfiles de WebHost Chile (usuario: pcginfor_admin)
$dbProdContent = @'
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
'@

Set-Content -Path "$DeploydDir\backend\config\db.php" -Value $dbProdContent -Encoding UTF8

# Manual de Despliegue para WebHost Chile
$instrucciones = @"
================================================================================
          MANUAL E INSTRUCCIONES DE DESPLIEGUE - PCG SPA SOFTWARE
                   (HOSTING WEBHOST CHILE / cPANEL / APACHE)
================================================================================

Este paquete deployd contiene la aplicación completa lista para producción en WebHost Chile.
Incluye:
  - Frontend SPA (React + TypeScript + Vite compilado y minificado).
  - Backend API REST en PHP (sin dependencias externas, 100% nativo).
  - Base de Datos MySQL (22 tablas, soporte UTF8MB4 y contraseñas hasheadas con bcrypt).
  - Enrutamiento Apache (.htaccess) para URLs amigables de React Router y API.

================================================================================
1. ESTRUCTURA EN EL SERVIDOR (/public_html/)
================================================================================
Al subir y descomprimir en la raíz de tu hosting (generalmente /public_html/),
la estructura debe quedar así:

  /public_html/
  │
  ├── index.html                       <- Single Page App (Frontend React)
  ├── .htaccess                        <- Reglas Apache de rutas SPA y API
  ├── database_pcg_software.sql        <- Dump completo de la base de datos MySQL
  ├── INSTRUCCIONES_DEPLOY_WEBHOST.txt <- Este manual de instalación
  ├── CREDENCIALES_PRODUCCION.txt      <- Cuentas y accesos predeterminados
  │
  ├── assets/                          <- JS, CSS y tipografías minificadas
  │     ├── index-XXXXX.js
  │     └── index-XXXXX.css
  │
  └── backend/                         <- Servicios y API en PHP
        ├── api/
        │     ├── db.php               <- Endpoint principal de sincronización
        │     ├── auth.php             <- Autenticación con verificación bcrypt
        │     └── health.php           <- Diagnóstico de conexión y tablas
        ├── config/
        │     ├── db.php               <- CONEXIÓN A BASE DE DATOS (pcginfor_admin)
        │     └── cors.php             <- Cabeceras CORS y JSON
        └── database/
              ├── schema.sql           <- Estructura DDL de las 22 tablas
              └── database_pcg_software.sql

================================================================================
2. PASO A PASO PARA SUBIR A WEBHOST CHILE (cPanel)
================================================================================

PASO 1: SUBIR EL ARCHIVO deploy.zip (O CONTENIDO DE deployd/)
1. Ingresa a tu cPanel de WebHost Chile.
2. Abre el "Administrador de Archivos" (File Manager).
3. Entra a la carpeta "public_html".
4. Haz clic en "Cargar" (Upload) y sube el archivo "deploy.zip" (o el contenido de deployd/).
5. Selecciona "deploy.zip" en public_html y presiona "Extraer" (Extract).

PASO 2: CREAR LA BASE DE DATOS EN cPANEL
1. En cPanel, dirígete a "Bases de datos MySQL".
2. Crea una base de datos nueva (ej: 'pcginfor_software' o 'pcginfor_pcg').
3. Asegúrate de que el usuario 'pcginfor_admin' tenga asignados TODOS LOS PRIVILEGIOS.

PASO 3: IMPORTAR database_pcg_software.sql
1. En cPanel, abre la herramienta "phpMyAdmin".
2. En la columna izquierda, haz clic en la base de datos creada.
3. Haz clic en la pestaña superior "Importar".
4. Selecciona el archivo 'database_pcg_software.sql' y presiona "Continuar" / "Importar".
   (Se crearán las 22 tablas con los 202 registros iniciales y claves bcrypt).

PASO 4: VERIFICAR CREDENCIALES EN backend/config/db.php
Las credenciales de tu usuario de cPanel ya quedaron preconfiguradas automáticamente:
  Usuario MySQL: pcginfor_admin
  Clave BD:      abc.1233.abc.123
Si tu base de datos se llama 'pcginfor_software' o 'pcginfor_pcg', se conectará de inmediato sin tocar nada.
Si le diste otro nombre a la base de datos (ej: 'pcginfor_mibd'), solo abre public_html/backend/config/db.php y ajusta el campo 'db'.

PASO 5: VERIFICAR Y PROBAR
1. Abre en tu navegador: https://tudominio.cl/backend/api/health.php
   Debe responder con status "ONLINE" y el conteo de 22 tablas.
2. Abre: https://tudominio.cl/
   El software cargará de inmediato con la píldora verde:
   "MySQL Conectado · BD en vivo"
"@

Set-Content -Path "$DeploydDir\INSTRUCCIONES_DEPLOY_WEBHOST.txt" -Value $instrucciones -Encoding UTF8

$credenciales = @"
================================================================================
             CREDENCIALES WEBHOST CHILE (cPanel / Base de Datos MySQL)
================================================================================

DATOS DE CONEXIÓN A BASE DE DATOS EN PRODUCCIÓN (cPanel):
  - Servidor / Host:      localhost (o 127.0.0.1)
  - Puerto MySQL:         3306
  - Usuario MySQL:        pcginfor_admin
  - Clave de usuario BD:  abc.1233.abc.123
  - Nombre BD sugerido:   pcginfor_software (o pcginfor_pcg)

================================================================================
              USUARIOS Y ACCESOS DEL SISTEMA WEB (PCG SPA)
================================================================================

Todas las contraseñas en la base de datos están encriptadas con hashes seguros BCRYPT
(password_hash con algoritmo PASSWORD_BCRYPT).

USUARIOS STAFF DE PCG:
  - Administrador / CEO:
      Email: brilan@pcg.cl
      Clave inicial: pcg123
      Rol: ADMIN (Acceso total a todos los módulos)

  - Finanzas / Jefa Sucursal:
      Email: yovylin@pcg.cl
      Clave inicial: pcg123
      Rol: DOC_PROCESS (Facturas, Flujo de Caja, Informes y Contratos)

  - Seguridad & Técnico:
      Email: johan@pcg.cl
      Clave inicial: pcg123
      Rol: WORKER (Mantenimientos, Checklist de Hardware y Planner)

  - Diseñador & Staff:
      Email: javier@pcg.cl
      Clave inicial: pcg123
      Rol: WORKER (Diseño de Identidad, Logos, Tarjetas y Proyectos)

CLIENTES CORPORATIVOS Y PERSONAS:
  - Constructora Andes: carolina@constructoraandes.cl (pcg123)
  - Clínica Sonrisa: andres@sonrisa.cl (pcg123)
  - Colegio San Agustín: informatica@colegiosanagustin.cl (pcg123)
  - Persona Natural: pedro@correo.cl (pcg123)
  - Persona Natural: matias.soto@gmail.com (pcg123)
"@

Set-Content -Path "$DeploydDir\CREDENCIALES_PRODUCCION.txt" -Value $credenciales -Encoding UTF8

# 7. Generar archivo comprimido deploy.zip a partir de deployd/ listo para cPanel
Write-Host "`nComprimiendo archivo deploy.zip desde deployd/..." -ForegroundColor Yellow
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
Compress-Archive -Path "$DeploydDir\*" -DestinationPath $ZipPath -Force

$zipSize = (Get-Item $ZipPath).Length / 1MB

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  DESPLIEGUE GENERADO CON EXITO PARA WEBHOST CHILE" -ForegroundColor Green
Write-Host "  Carpeta de despliegue oficial unica: $DeploydDir" -ForegroundColor Green
Write-Host "  Archivo ZIP para cPanel:              $ZipPath ($("{0:N2}" -f $zipSize) MB)" -ForegroundColor Green
Write-Host "  Base de Datos con BCRYPT:             $DeploydDir\database_pcg_software.sql" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
