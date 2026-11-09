-- ============================================================================
-- PCG SPA - Base de Datos MySQL / MariaDB (XAMPP)
-- Sistema Integral de Soporte TI, Mantenimiento, Facturación, Inventario & Software
-- ============================================================================

CREATE DATABASE IF NOT EXISTS pcg_software CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pcg_software;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USUARIOS Y PERSONAL DE PCG SPA
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_PERSONA', 'CLIENTE_EMPRESA') NOT NULL,
    rol_etiqueta VARCHAR(100) NULL,
    especialidad VARCHAR(50) NULL,
    apto_tecnico TINYINT(1) DEFAULT 1,
    apto_desarrollador TINYINT(1) DEFAULT 0,
    cargo VARCHAR(150) NULL,
    titulo VARCHAR(150) NULL,
    horas_semanales INT DEFAULT 40,
    color VARCHAR(20) DEFAULT '#10b981',
    empresa_id INT NULL,
    rut VARCHAR(20) NULL,
    telefono VARCHAR(30) NULL,
    activo TINYINT(1) DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_rol (rol),
    INDEX idx_usuarios_empresa (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. EMPRESAS Y CLIENTES CORPORATIVOS (B2B)
DROP TABLE IF EXISTS empresas;
CREATE TABLE empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(200) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    giro VARCHAR(200) NULL,
    ciudad VARCHAR(100) DEFAULT 'Santiago',
    direccion VARCHAR(255) NULL,
    contacto_id INT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_empresas_rut (rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. EQUIPOS INFORMÁTICOS Y COMPONENTES
DROP TABLE IF EXISTS equipos;
CREATE TABLE equipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    empresa_id INT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(150) NOT NULL,
    numero_serie VARCHAR(100) NULL,
    procesador VARCHAR(150) NULL,
    ram_gb INT DEFAULT 8,
    almacenamiento VARCHAR(150) NULL,
    tarjeta_grafica VARCHAR(150) NULL,
    estado VARCHAR(50) DEFAULT 'OPERATIVO',
    fecha_ingreso DATE NULL,
    fecha_ultima_mantencion DATE NULL,
    proxima_mantencion DATE NULL,
    notas TEXT NULL,
    INDEX idx_equipos_codigo (codigo),
    INDEX idx_equipos_empresa (empresa_id),
    INDEX idx_equipos_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. INTERVENCIONES TÉCNICAS Y HISTORIAL DE MANTENCIÓN
DROP TABLE IF EXISTS intervenciones;
CREATE TABLE intervenciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    detalle TEXT NULL,
    temp_antes INT NULL,
    temp_despues INT NULL,
    checklist JSON NULL,
    insumos TEXT NULL,
    garantia_dias INT DEFAULT 30,
    visible_cliente TINYINT(1) DEFAULT 1,
    INDEX idx_interv_equipo (equipo_id),
    INDEX idx_interv_tecnico (tecnico_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TICKETS DE SOPORTE Y SOLICITUD DE COTIZACIÓN
DROP TABLE IF EXISTS tickets;
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INT NOT NULL,
    empresa_id INT NULL,
    tipo VARCHAR(50) NOT NULL,
    asunto VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    equipo_ids JSON NULL,
    cant_equipos INT DEFAULT 1,
    estado VARCHAR(50) DEFAULT 'ABIERTO',
    fecha_cita DATE NULL,
    hora_cita VARCHAR(20) NULL,
    modalidad VARCHAR(50) NULL,
    mensajes JSON NULL,
    creado DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tickets_codigo (codigo),
    INDEX idx_tickets_estado (estado),
    INDEX idx_tickets_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CATÁLOGO DE SERVICIOS
DROP TABLE IF EXISTS servicios;
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    normal BIGINT NOT NULL,
    convenio BIGINT NOT NULL,
    costo BIGINT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    INDEX idx_servicios_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PAQUETES DE CONVENIO Y PLANTILLAS
DROP TABLE IF EXISTS paquetes;
CREATE TABLE paquetes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    sufijo VARCHAR(50) NOT NULL,
    servicio_ids JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. COTIZACIONES
DROP TABLE IF EXISTS cotizaciones;
CREATE TABLE cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    ticket_id INT NULL,
    usuario_id INT NOT NULL,
    empresa_id INT NULL,
    email_destino VARCHAR(150) NULL,
    paquete_id INT NULL,
    modo VARCHAR(50) DEFAULT 'CONVENIO',
    descuento_criterio_pct DECIMAL(5,2) DEFAULT 0,
    descuento_criterio_monto BIGINT DEFAULT 0,
    motivo_descuento VARCHAR(255) NULL,
    plan_inicio DATE NULL,
    plan_fin DATE NULL,
    plan_tecnico_id INT NULL,
    items JSON NOT NULL,
    cant_equipos INT DEFAULT 1,
    subtotal_normal BIGINT NOT NULL,
    descuento_monto BIGINT DEFAULT 0,
    total BIGINT NOT NULL,
    estado VARCHAR(50) DEFAULT 'BORRADOR',
    fecha DATE NOT NULL,
    valida_hasta DATE NOT NULL,
    INDEX idx_cot_numero (numero),
    INDEX idx_cot_ticket (ticket_id),
    INDEX idx_cot_empresa (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ORDENES DE TRABAJO (OT)
DROP TABLE IF EXISTS ots;
CREATE TABLE ots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    cotizacion_id INT NULL,
    proyecto_id INT NULL,
    ticket_id INT NULL,
    empresa_id INT NULL,
    usuario_id INT NOT NULL,
    tecnico_lider_id INT NULL,
    tipo VARCHAR(50) NOT NULL,
    prioridad VARCHAR(50) DEFAULT 'MEDIA',
    estado VARCHAR(50) DEFAULT 'RECIBIDO',
    fecha_inicio DATE NOT NULL,
    fecha_compromiso DATE NOT NULL,
    fecha_cierre DATE NULL,
    cant_equipos INT DEFAULT 1,
    equipo_ids JSON NULL,
    total BIGINT NOT NULL,
    garantia_dias INT DEFAULT 30,
    comentarios TEXT NULL,
    INDEX idx_ots_numero (numero),
    INDEX idx_ots_estado (estado),
    INDEX idx_ots_tecnico (tecnico_lider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TAREAS DEL PLANNER
DROP TABLE IF EXISTS tareas;
CREATE TABLE tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ot_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    asignado_id INT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    prioridad VARCHAR(50) DEFAULT 'MEDIA',
    h_est DECIMAL(5,2) DEFAULT 1.0,
    h_real DECIMAL(5,2) NULL,
    inicio DATE NOT NULL,
    limite DATE NOT NULL,
    equipo_id INT NULL,
    depende_de INT NULL,
    INDEX idx_tareas_ot (ot_id),
    INDEX idx_tareas_asignado (asignado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. PROGRAMAS DE MANTENIMIENTO PREVENTIVO
DROP TABLE IF EXISTS programas;
CREATE TABLE programas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT UNIQUE NOT NULL,
    frecuencia_meses INT DEFAULT 3,
    proxima_fecha DATE NOT NULL,
    activo TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. MOVIMIENTOS FINANCIEROS Y FLUJO DE CAJA
DROP TABLE IF EXISTS movimientos;
CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    tipo ENUM('INGRESO', 'EGRESO') NOT NULL,
    rubro VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    contraparte VARCHAR(150) NULL,
    monto BIGINT NOT NULL,
    metodo VARCHAR(50) DEFAULT 'TRANSFERENCIA',
    ot_id INT NULL,
    cotizacion_id INT NULL,
    inventario_id INT NULL,
    proyecto_id INT NULL,
    factura_nro VARCHAR(50) NULL,
    comprobante_url VARCHAR(255) NULL,
    conciliado_banco TINYINT(1) DEFAULT 1,
    notas TEXT NULL,
    INDEX idx_mov_fecha (fecha),
    INDEX idx_mov_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. FACTURAS EMITIDAS Y RECIBIDAS
DROP TABLE IF EXISTS facturas;
CREATE TABLE facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_folio VARCHAR(50) UNIQUE NOT NULL,
    tipo_doc VARCHAR(50) NOT NULL,
    empresa_id INT NULL,
    usuario_id INT NOT NULL,
    ot_id INT NULL,
    cotizacion_id INT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    subtotal_neto BIGINT NOT NULL,
    iva_monto BIGINT NOT NULL,
    total_bruto BIGINT NOT NULL,
    estado_sii VARCHAR(50) DEFAULT 'ACEPTADO',
    estado_pago VARCHAR(50) DEFAULT 'PAGADA',
    pdf_url VARCHAR(255) NULL,
    notas TEXT NULL,
    INDEX idx_facturas_folio (numero_folio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. INVENTARIO: HERRAMIENTAS, LICENCIAS SOFTWARE Y REPUESTOS
DROP TABLE IF EXISTS inventario;
CREATE TABLE inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    rubro VARCHAR(50) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    marca VARCHAR(100) NULL,
    modelo VARCHAR(150) NULL,
    categoria VARCHAR(100) NULL,
    estado VARCHAR(50) DEFAULT 'DISPONIBLE',
    serial_number VARCHAR(100) NULL,
    licencias_total INT NULL,
    licencias_en_uso INT NULL,
    licencias_claves JSON NULL,
    ubicacion VARCHAR(150) NULL,
    asignado_a_tipo VARCHAR(50) NULL,
    asignado_a_id INT NULL,
    asignado_a_nombre VARCHAR(150) NULL,
    stock_actual INT DEFAULT 1,
    stock_minimo INT DEFAULT 1,
    costo_compra_clp BIGINT DEFAULT 0,
    precio_venta_clp BIGINT DEFAULT 0,
    fecha_adquisicion DATE NULL,
    proveedor_nombre VARCHAR(150) NULL,
    garantia_vence DATE NULL,
    notas TEXT NULL,
    INDEX idx_inv_codigo (codigo),
    INDEX idx_inv_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. PROYECTOS VENDIDOS, SOFTWARE & PORTAFOLIO WEB
DROP TABLE IF EXISTS proyectos_web;
CREATE TABLE proyectos_web (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    empresa_id INT NULL,
    usuario_id INT NULL,
    cliente_nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    nombre_proyecto VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    url_dominio VARCHAR(255) NULL,
    stack_tecnologico VARCHAR(255) NULL,
    hosting_proveedor VARCHAR(255) NULL,
    valor_proyecto BIGINT NOT NULL,
    monto_cobrado BIGINT DEFAULT 0,
    estado_cobro VARCHAR(50) DEFAULT 'PAGADO',
    incluye_mantencion_web TINYINT(1) DEFAULT 1,
    plan_mantencion VARCHAR(50) DEFAULT 'MENSUAL',
    valor_mantencion BIGINT DEFAULT 0,
    fecha_inicio DATE NOT NULL,
    fecha_entrega DATE NULL,
    proxima_mantencion_web DATE NULL,
    vencimiento_dominio_hosting DATE NULL,
    estado VARCHAR(50) DEFAULT 'PRODUCCION_ACTIVO',
    responsable_id INT NOT NULL,
    participantes_ids JSON NULL,
    personas_externas JSON NULL,
    modalidad_ejecucion VARCHAR(50) DEFAULT 'SOLO_PCG',
    empresa_externa JSON NULL,
    notas TEXT NULL,
    INDEX idx_proy_codigo (codigo),
    INDEX idx_proy_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. INFORMES TÉCNICOS EMITIDOS
DROP TABLE IF EXISTS informes;
CREATE TABLE informes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    ot_id INT NOT NULL,
    empresa_id INT NULL,
    usuario_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    tecnico_id INT NOT NULL,
    resumen TEXT NULL,
    equipos_atendidos JSON NULL,
    recomendaciones TEXT NULL,
    INDEX idx_inf_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. CONEXIÓN BANCARIA
DROP TABLE IF EXISTS banco_conexion;
CREATE TABLE banco_conexion (
    id INT PRIMARY KEY DEFAULT 1,
    conectado TINYINT(1) DEFAULT 1,
    banco VARCHAR(150) NOT NULL,
    numero_cuenta VARCHAR(100) NULL,
    saldo_actual BIGINT DEFAULT 0,
    ultima_sincronizacion DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. CONFIGURACIÓN DEL SISTEMA Y REGLAS
DROP TABLE IF EXISTS configuracion;
CREATE TABLE configuracion (
    id INT PRIMARY KEY DEFAULT 1,
    razon_social VARCHAR(200) NOT NULL,
    rut VARCHAR(20) NOT NULL,
    giro VARCHAR(255) NULL,
    direccion VARCHAR(255) NULL,
    ciudad VARCHAR(100) NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    cond_pago TEXT NULL,
    cond_plazo TEXT NULL,
    cond_validez_dias INT DEFAULT 21,
    cond_garantia_dias INT DEFAULT 30,
    banco_datos JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. REGLA DE DESCUENTOS POR VOLUMEN
DROP TABLE IF EXISTS descuentos;
CREATE TABLE descuentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    min_equipos INT NOT NULL,
    max_equipos INT NOT NULL,
    pct INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. SECUENCIAS
DROP TABLE IF EXISTS secuencias;
CREATE TABLE secuencias (
    clave VARCHAR(50) PRIMARY KEY,
    valor INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. HISTORIAL DE CORREOS
DROP TABLE IF EXISTS correos;
CREATE TABLE correos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    de VARCHAR(150) NOT NULL,
    para VARCHAR(150) NOT NULL,
    cc VARCHAR(150) NULL,
    asunto VARCHAR(255) NOT NULL,
    cuerpo TEXT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

