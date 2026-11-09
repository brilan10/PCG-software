-- ============================================================
-- PCG - Esquema de base de datos v3 (MySQL / MariaDB 10.4+)
-- Consolida DOCUMENTACION_ARQUITECTURA.md (secciones 5 y 5.2).
--
-- v2: RUT en usuarios, solicitud_items, historial de estados,
--     cotizaciones, pagos, contratos, montos CLP como BIGINT,
--     descuentos con rango abierto.
-- v3: portal empresa (equipos por empresa), tickets, catalogo y
--     plantillas de cotizacion (Excel), programa preventivo y alertas,
--     informes, planner de OT (tareas), equipo publico, config.
--
-- Convencion: "solicitudes" = Orden de Trabajo (OT).
-- Archivos (comprobantes, facturas, informes, plantillas): rutas
-- PRIVADAS fuera de public_html, servidas por PHP con permisos.
-- ============================================================
SET NAMES utf8mb4;

-- ---------- USUARIOS Y EMPRESAS ----------
CREATE TABLE usuarios (
    id_usuario     INT PRIMARY KEY AUTO_INCREMENT,
    nombre         VARCHAR(100) NOT NULL,
    email          VARCHAR(100) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,             -- password_hash() PHP (Argon2id/bcrypt)
    rol            ENUM('ADMIN','DOC_PROCESS','WORKER','CLIENTE_PERSONA','CLIENTE_EMPRESA') NOT NULL,
    rut            VARCHAR(12) NULL,                  -- RUT persona natural (normalizado, sin puntos)
    telefono       VARCHAR(20),
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE,  -- cuentas creadas por el admin
    creado_por     INT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_rut (rut),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos profesionales del personal (admin crea trabajadores desde el panel)
CREATE TABLE perfil_trabajador (
    id_usuario     INT PRIMARY KEY,
    cargo          VARCHAR(100) NOT NULL,
    especialidad   VARCHAR(150),
    titulo_profesional VARCHAR(200),
    horas_semanales TINYINT DEFAULT 40,               -- capacidad para el planner
    color_planner  CHAR(7) DEFAULT '#22c55e',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clientes_empresa (
    id_empresa     INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario     INT NOT NULL,                      -- contacto principal
    razon_social   VARCHAR(150) NOT NULL,
    rut_empresa    VARCHAR(12) UNIQUE NOT NULL,
    giro           VARCHAR(100),
    direccion      VARCHAR(200),
    ciudad         VARCHAR(80),
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Varias personas de una misma empresa pueden entrar al portal B2B
CREATE TABLE empresa_contactos (
    id_empresa     INT NOT NULL,
    id_usuario     INT NOT NULL,
    cargo          VARCHAR(100),
    es_principal   BOOLEAN NOT NULL DEFAULT FALSE,
    recibe_alertas BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_empresa, id_usuario),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- EQUIPOS ----------
CREATE TABLE equipos_componentes (
    id_equipo      INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario     INT NOT NULL,                      -- quien lo registro
    id_empresa     INT NULL,                          -- NULL = cliente particular
    id_equipo_padre INT NULL,
    codigo_activo  VARCHAR(40) NULL,                  -- etiqueta de inventario del cliente
    area_responsable VARCHAR(100) NULL,               -- area / usuario final dentro de la empresa
    tipo_hardware  ENUM('DESKTOP','LAPTOP','TARJETA_GRAFICA','PLACA_MADRE','SERVIDOR','WEBAPP','OTRO') NOT NULL,
    marca          VARCHAR(50) NOT NULL,
    modelo         VARCHAR(100) NOT NULL,
    numero_serie   VARCHAR(100),
    procesador     VARCHAR(150),
    ram_gb         INT,
    tipo_disipacion ENUM('AIRE','LIQUIDA','STOCK','OTRO') DEFAULT 'STOCK',
    tarjeta_grafica VARCHAR(150),
    especificaciones_json JSON,
    fecha_ultima_mantencion DATE NULL,
    proxima_mantencion DATE NULL,                     -- calculada (ultima + periodicidad) o manual
    fotos_recepcion_json JSON,
    estado_ubicacion ENUM('EN_PODER_CLIENTE','EN_TALLER_PCG','DADO_DE_BAJA') DEFAULT 'EN_PODER_CLIENTE',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_equipos_empresa (id_empresa),
    INDEX idx_equipos_proxima (proxima_mantencion),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa),
    FOREIGN KEY (id_equipo_padre) REFERENCES equipos_componentes(id_equipo) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TICKETS (entrada del cliente: pide cotizacion/servicio) ----------
CREATE TABLE tickets (
    id_ticket      INT PRIMARY KEY AUTO_INCREMENT,
    codigo_ticket  VARCHAR(20) UNIQUE NOT NULL,       -- ej: TCK-2026-0001
    id_usuario     INT NOT NULL,                      -- quien lo abre
    id_empresa     INT NULL,
    tipo           ENUM('COTIZACION','MANTENCION','SOPORTE','CONSULTA') NOT NULL DEFAULT 'COTIZACION',
    asunto         VARCHAR(150) NOT NULL,
    descripcion    TEXT,
    cant_equipos   INT NOT NULL DEFAULT 1,
    estado         ENUM('ABIERTO','EN_COTIZACION','COTIZADO','ACEPTADO','CERRADO','CANCELADO') NOT NULL DEFAULT 'ABIERTO',
    id_asignado    INT NULL,                          -- DOC_PROCESS / ADMIN que lo atiende
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa),
    FOREIGN KEY (id_asignado) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ticket_equipos (
    id_ticket      INT NOT NULL,
    id_equipo      INT NOT NULL,
    PRIMARY KEY (id_ticket, id_equipo),
    FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo) REFERENCES equipos_componentes(id_equipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ticket_mensajes (
    id_mensaje     INT PRIMARY KEY AUTO_INCREMENT,
    id_ticket      INT NOT NULL,
    id_usuario     INT NOT NULL,
    mensaje        TEXT NOT NULL,
    interno        BOOLEAN NOT NULL DEFAULT FALSE,    -- nota interna: el cliente no la ve
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ORDENES DE TRABAJO (OT) ----------
CREATE TABLE solicitudes (
    id_solicitud   INT PRIMARY KEY AUTO_INCREMENT,
    codigo_seguimiento VARCHAR(20) UNIQUE NOT NULL,   -- ej: PCG-2026-8921 (OT y tracking publico)
    id_ticket      INT NULL,                          -- ticket de origen
    origen         ENUM('TICKET','ADMIN','PREVENTIVA') NOT NULL DEFAULT 'TICKET',
    id_usuario     INT NOT NULL,                      -- cliente
    id_empresa     INT NULL,
    id_tecnico_asignado INT NULL,                     -- responsable principal
    titulo         VARCHAR(150) NULL,
    descripcion    TEXT NULL,
    tipo_servicio  ENUM('MANTENIMIENTO','DESARROLLO','UPGRADE','CONSULTORIA') NOT NULL,
    prioridad      ENUM('BAJA','MEDIA','ALTA','URGENTE') NOT NULL DEFAULT 'MEDIA',
    estado         ENUM('RECIBIDO','EN_REVISION','EN_DESARROLLO','EN_QA','LISTO','ENTREGADO') DEFAULT 'RECIBIDO',
    orden_kanban   INT NOT NULL DEFAULT 0,            -- posicion dentro de la columna
    fecha_inicio_plan DATE NULL,                      -- planner / Gantt
    fecha_fin_plan DATE NULL,
    fecha_entrega_real DATE NULL,
    estado_pago    ENUM('PENDIENTE','VERIFICANDO','PAGADO','RECHAZADO') DEFAULT 'PENDIENTE',
    requiere_factura BOOLEAN DEFAULT FALSE,
    numero_factura VARCHAR(50),
    factura_path   VARCHAR(255),
    datos_facturacion_json JSON,
    subtotal       BIGINT NOT NULL DEFAULT 0,         -- CLP
    descuento_pct  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total          BIGINT NOT NULL DEFAULT 0,         -- CLP
    creado_por     INT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ot_estado (estado, orden_kanban),
    INDEX idx_ot_fechas (fecha_inicio_plan, fecha_fin_plan),
    FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa),
    FOREIGN KEY (id_tecnico_asignado) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE solicitud_items (
    id_item        INT PRIMARY KEY AUTO_INCREMENT,
    id_solicitud   INT NOT NULL,
    id_equipo      INT NOT NULL,
    descripcion    VARCHAR(255),
    precio_unitario BIGINT NOT NULL DEFAULT 0,        -- CLP
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo) REFERENCES equipos_componentes(id_equipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Timeline publico: cada cambio de estado queda registrado
CREATE TABLE solicitud_estados (
    id_estado      INT PRIMARY KEY AUTO_INCREMENT,
    id_solicitud   INT NOT NULL,
    estado         ENUM('RECIBIDO','EN_REVISION','EN_DESARROLLO','EN_QA','LISTO','ENTREGADO') NOT NULL,
    nota_publica   VARCHAR(255),
    id_usuario     INT NOT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Planner: tareas dentro de cada OT (lista, Kanban por tecnico, calendario y Gantt)
CREATE TABLE ot_tareas (
    id_tarea       INT PRIMARY KEY AUTO_INCREMENT,
    id_solicitud   INT NOT NULL,
    id_equipo      INT NULL,                          -- tarea sobre un equipo concreto
    titulo         VARCHAR(150) NOT NULL,
    descripcion    TEXT,
    id_asignado    INT NULL,
    estado         ENUM('PENDIENTE','EN_CURSO','BLOQUEADA','EN_REVISION','HECHA') NOT NULL DEFAULT 'PENDIENTE',
    prioridad      ENUM('BAJA','MEDIA','ALTA','URGENTE') NOT NULL DEFAULT 'MEDIA',
    fecha_inicio   DATE NULL,
    fecha_limite   DATE NULL,
    horas_estimadas DECIMAL(5,1) NULL,
    horas_reales   DECIMAL(5,1) NULL,
    depende_de     INT NULL,                          -- dependencia para el Gantt
    checklist_json JSON,
    orden          INT NOT NULL DEFAULT 0,
    completada_en  TIMESTAMP NULL,
    creado_por     INT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tareas_asignado (id_asignado, estado),
    INDEX idx_tareas_fechas (fecha_inicio, fecha_limite),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo) REFERENCES equipos_componentes(id_equipo) ON DELETE SET NULL,
    FOREIGN KEY (id_asignado) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (depende_de) REFERENCES ot_tareas(id_tarea) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ot_comentarios (
    id_comentario  INT PRIMARY KEY AUTO_INCREMENT,
    id_solicitud   INT NOT NULL,
    id_tarea       INT NULL,
    id_usuario     INT NOT NULL,
    comentario     TEXT NOT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_tarea) REFERENCES ot_tareas(id_tarea) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- CATALOGO, PAQUETES Y PLANTILLAS DE COTIZACION ----------
CREATE TABLE catalogo_servicios (
    id_servicio    INT PRIMARY KEY AUTO_INCREMENT,
    codigo         VARCHAR(30) UNIQUE NOT NULL,
    nombre         VARCHAR(150) NOT NULL,
    descripcion    TEXT,                              -- texto tecnico que aparece en la cotizacion
    precio_normal  BIGINT NOT NULL,                   -- CLP, tarifa lista
    precio_convenio BIGINT NOT NULL,                  -- CLP, tarifa convenio corporativo
    costo_interno  BIGINT NULL,                       -- SOLO ADMIN: nunca va al PDF del cliente
    activo         BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE paquetes_servicio (
    id_paquete     INT PRIMARY KEY AUTO_INCREMENT,
    nombre         VARCHAR(120) NOT NULL,             -- ej: Convenio Corporativo, Mantencion + Avast
    sufijo_numero  VARCHAR(20),                       -- ej: CORP, MANT-AVAST (para COT-2026-009-CORP)
    descripcion    TEXT,
    activo         BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE paquete_items (
    id_paquete     INT NOT NULL,
    id_servicio    INT NOT NULL,
    precio_convenio_override BIGINT NULL,             -- NULL = usa catalogo
    bonificado     BOOLEAN NOT NULL DEFAULT FALSE,    -- 100% bonificado en convenio
    orden          INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_paquete, id_servicio),
    FOREIGN KEY (id_paquete) REFERENCES paquetes_servicio(id_paquete) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES catalogo_servicios(id_servicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Excel comprado/propio (ej: Cotizacion_Formal_PCG_SPA.xlsx) registrado como plantilla
CREATE TABLE plantillas_cotizacion (
    id_plantilla   INT PRIMARY KEY AUTO_INCREMENT,
    nombre         VARCHAR(120) NOT NULL,
    archivo_path   VARCHAR(255) NOT NULL,             -- .xlsx en almacenamiento privado
    hoja           VARCHAR(80) NOT NULL,              -- hoja del libro a rellenar
    mapa_celdas_json JSON NOT NULL,                   -- {"cliente":"D8","rut":"D9","items_inicio":14,...}
    version        INT NOT NULL DEFAULT 1,
    activa         BOOLEAN NOT NULL DEFAULT TRUE,
    subida_por     INT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subida_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- COTIZACIONES, PAGOS, CONTRATOS ----------
CREATE TABLE cotizaciones (
    id_cotizacion  INT PRIMARY KEY AUTO_INCREMENT,
    numero         VARCHAR(30) UNIQUE NOT NULL,       -- COT-2026-009-CORP
    id_ticket      INT NULL,
    id_solicitud   INT NULL,                          -- se vincula al aceptarse y crearse la OT
    id_usuario     INT NOT NULL,                      -- cliente
    id_empresa     INT NULL,
    id_plantilla   INT NULL,
    id_paquete     INT NULL,
    version        INT NOT NULL DEFAULT 1,
    cant_equipos   INT NOT NULL DEFAULT 1,
    subtotal_normal BIGINT NOT NULL DEFAULT 0,
    descuento_monto BIGINT NOT NULL DEFAULT 0,
    total          BIGINT NOT NULL,
    condiciones_json JSON,                            -- pago 50/50, plazo, validez, garantia
    datos_snapshot_json JSON,                         -- foto de los datos usados al emitir
    xlsx_path      VARCHAR(255),
    pdf_path       VARCHAR(255),
    estado         ENUM('BORRADOR','ENVIADA','ACEPTADA','RECHAZADA','VENCIDA') DEFAULT 'BORRADOR',
    fecha_emision  DATE NOT NULL,
    valida_hasta   DATE,
    emitida_por    INT NOT NULL,
    enviada_en     TIMESTAMP NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket) ON DELETE SET NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa),
    FOREIGN KEY (id_plantilla) REFERENCES plantillas_cotizacion(id_plantilla),
    FOREIGN KEY (id_paquete) REFERENCES paquetes_servicio(id_paquete),
    FOREIGN KEY (emitida_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cotizacion_items (
    id_item        INT PRIMARY KEY AUTO_INCREMENT,
    id_cotizacion  INT NOT NULL,
    id_servicio    INT NULL,
    descripcion    TEXT NOT NULL,
    cantidad       INT NOT NULL DEFAULT 1,
    precio_normal  BIGINT NOT NULL,                   -- unitario
    precio_convenio BIGINT NOT NULL,                  -- unitario
    orden          INT NOT NULL DEFAULT 0,
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES catalogo_servicios(id_servicio) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pagos (
    id_pago        INT PRIMARY KEY AUTO_INCREMENT,
    id_solicitud   INT NOT NULL,
    monto          BIGINT NOT NULL,
    comprobante_path VARCHAR(255) NOT NULL,
    estado         ENUM('VERIFICANDO','APROBADO','RECHAZADO') DEFAULT 'VERIFICANDO',
    verificado_por INT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud),
    FOREIGN KEY (verificado_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contratos (
    id_contrato    INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario     INT NOT NULL,
    id_empresa     INT NULL,
    id_solicitud   INT NULL,
    titulo         VARCHAR(150) NOT NULL,
    archivo_path   VARCHAR(255) NOT NULL,
    vigente_hasta  DATE NULL,
    subido_por     INT NOT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud),
    FOREIGN KEY (subido_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- HOJA DE VIDA DEL EQUIPO ----------
CREATE TABLE historial_intervenciones (
    id_intervencion INT PRIMARY KEY AUTO_INCREMENT,
    id_equipo      INT NOT NULL,
    id_solicitud   INT,
    id_tarea       INT NULL,
    id_tecnico     INT NOT NULL,
    tipo_intervencion ENUM('PREVENTIVO','CORRECTIVO','REPARACION_ELECTRONICA','UPGRADE','SOFTWARE') NOT NULL,
    titulo_trabajo VARCHAR(150) NOT NULL,
    detalle_tecnico TEXT NOT NULL,
    temperaturas_o_pruebas TEXT,
    temp_cpu_antes_c TINYINT NULL,                    -- ej: 85
    temp_cpu_despues_c TINYINT NULL,                  -- ej: 48
    checklist_json JSON,                              -- limpieza, pasta termica, ventiladores, SO, drivers...
    insumos_json JSON,                                -- pasta termica usada, licencias, repuestos
    fotos_json JSON,                                  -- antes / despues
    documentos_adjuntos_json JSON,
    visible_cliente BOOLEAN NOT NULL DEFAULT TRUE,    -- el cliente B2B lo ve en su portal
    garantia_dias  SMALLINT NOT NULL DEFAULT 30,
    fecha_vencimiento_garantia DATE NULL,
    fecha_intervencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hist_equipo (id_equipo, fecha_intervencion),
    FOREIGN KEY (id_equipo) REFERENCES equipos_componentes(id_equipo),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud),
    FOREIGN KEY (id_tarea) REFERENCES ot_tareas(id_tarea) ON DELETE SET NULL,
    FOREIGN KEY (id_tecnico) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- INFORMES ----------
CREATE TABLE informes (
    id_informe     INT PRIMARY KEY AUTO_INCREMENT,
    codigo         VARCHAR(20) UNIQUE NOT NULL,       -- INF-2026-0001
    tipo           ENUM('EQUIPO','OT','PARQUE_EMPRESA','PERIODO') NOT NULL,
    id_equipo      INT NULL,
    id_solicitud   INT NULL,
    id_empresa     INT NULL,
    titulo         VARCHAR(150) NOT NULL,
    periodo_desde  DATE NULL,
    periodo_hasta  DATE NULL,
    resumen        TEXT,                              -- texto editable antes de emitir
    contenido_json JSON,                              -- snapshot de datos al generar
    pdf_path       VARCHAR(255),
    visible_cliente BOOLEAN NOT NULL DEFAULT FALSE,
    generado_por   INT NOT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_equipo) REFERENCES equipos_componentes(id_equipo) ON DELETE SET NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL,
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa) ON DELETE SET NULL,
    FOREIGN KEY (generado_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ALERTAS PREVENTIVAS ----------
-- El admin inscribe a las empresas que tienen activo el programa
CREATE TABLE programa_preventivo (
    id_programa    INT PRIMARY KEY AUTO_INCREMENT,
    id_empresa     INT UNIQUE NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    periodicidad_meses TINYINT NOT NULL DEFAULT 6,
    dias_aviso     TINYINT NOT NULL DEFAULT 7,        -- aviso 1 semana antes
    emails_destino VARCHAR(255) NULL,                 -- NULL = contactos con recibe_alertas
    cc_interno     BOOLEAN NOT NULL DEFAULT TRUE,     -- copia al correo de PCG
    activado_por   INT NOT NULL,
    activado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    desactivado_en TIMESTAMP NULL,
    notas          VARCHAR(255),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (activado_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Una fila por equipo y fecha; el cron diario (cPanel) las crea y envia
CREATE TABLE alertas_preventivas (
    id_alerta      INT PRIMARY KEY AUTO_INCREMENT,
    id_empresa     INT NOT NULL,
    id_equipo      INT NOT NULL,
    fecha_programada DATE NOT NULL,                   -- fecha de mantencion sugerida
    fecha_aviso    DATE NOT NULL,                     -- fecha_programada - dias_aviso
    estado         ENUM('PENDIENTE','ENVIADA','ERROR','AGENDADA','OMITIDA') NOT NULL DEFAULT 'PENDIENTE',
    id_notificacion INT NULL,
    enviada_en     TIMESTAMP NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_alerta_equipo_fecha (id_equipo, fecha_programada),   -- evita duplicados
    INDEX idx_alerta_aviso (estado, fecha_aviso),
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo) REFERENCES equipos_componentes(id_equipo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- DESCUENTOS ----------
-- Rangos cubiertos: 1-2 (0%), 3-5 (25%), 6+ (editable por el CEO)
CREATE TABLE reglas_descuento (
    id_regla       INT PRIMARY KEY AUTO_INCREMENT,
    min_equipos    INT NOT NULL,
    max_equipos    INT NULL,                          -- NULL = sin tope
    porcentaje_descuento DECIMAL(5,2) NOT NULL,
    activo         BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO reglas_descuento (min_equipos, max_equipos, porcentaje_descuento) VALUES
    (1, 2, 0.00),
    (3, 5, 25.00),
    (6, NULL, 25.00);   -- PENDIENTE DE DEFINIR: el documento original no fija 6+

-- ---------- NOTIFICACIONES, ARCHIVOS, EQUIPO PUBLICO, CONFIG ----------
CREATE TABLE notificaciones_email (
    id_notificacion INT PRIMARY KEY AUTO_INCREMENT,
    tipo           ENUM('COTIZACION','ALERTA_PREVENTIVA','ESTADO_OT','COMPROBANTE','INFORME','OTRO') NOT NULL DEFAULT 'OTRO',
    id_solicitud   INT NULL,
    id_empresa     INT NULL,
    destinatario   VARCHAR(255) NOT NULL,
    asunto         VARCHAR(200) NOT NULL,
    estado         ENUM('PENDIENTE','ENVIADO','ERROR') DEFAULT 'PENDIENTE',
    error          VARCHAR(255) NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL,
    FOREIGN KEY (id_empresa) REFERENCES clientes_empresa(id_empresa) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Archivos adjuntos genericos (OT, tickets, informes) en almacenamiento privado
CREATE TABLE archivos (
    id_archivo     INT PRIMARY KEY AUTO_INCREMENT,
    entidad_tipo   ENUM('TICKET','OT','TAREA','EQUIPO','INFORME','CONTRATO') NOT NULL,
    entidad_id     INT NOT NULL,
    nombre_original VARCHAR(200) NOT NULL,
    ruta_privada   VARCHAR(255) NOT NULL,
    mime           VARCHAR(100) NOT NULL,
    tamano_bytes   INT NOT NULL,
    visible_cliente BOOLEAN NOT NULL DEFAULT FALSE,
    subido_por     INT NOT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_archivos_entidad (entidad_tipo, entidad_id),
    FOREIGN KEY (subido_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tarjetas de la landing (seccion "Nuestro equipo"); id_usuario NULL si no tiene login
CREATE TABLE equipo_miembros (
    id_miembro     INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario     INT NULL,
    nombre         VARCHAR(100) NOT NULL,
    titulos_json   JSON NOT NULL,                     -- lista de titulos / grados
    bio_corta      VARCHAR(300),
    foto_path      VARCHAR(255),
    orden          INT NOT NULL DEFAULT 0,
    visible        BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO equipo_miembros (nombre, titulos_json, orden) VALUES
    ('Yovylin Bugueño',  JSON_ARRAY('Ingeniera Civil Industrial', 'Licenciada (título de licenciatura)'), 1),
    ('Brilan Bugueño',   JSON_ARRAY('Licenciado en Ciencias de la Ingeniería Informática', 'Ingeniero Informático'), 2),
    ('Johan Carrasco',   JSON_ARRAY('Ingeniero en Seguridad Privada', 'Prevencionista de Riesgos (menciones penales)'), 3);

-- Datos de la empresa y condiciones comerciales editables desde el panel.
-- Los datos bancarios y el RUT se cargan desde el panel, no desde este archivo.
CREATE TABLE config_empresa (
    clave          VARCHAR(60) PRIMARY KEY,
    valor          TEXT NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO config_empresa (clave, valor) VALUES
    ('razon_social', 'PCG SPA'),
    ('giro', 'Servicios TI, Soporte & Mantenimiento de Equipos'),
    ('cond_forma_pago', '50% al iniciar los trabajos y 50% contra recepción conforme'),
    ('cond_plazo_ejecucion', '1 a 2 jornadas hábiles coordinadas según disponibilidad'),
    ('cond_validez_dias_habiles', '15'),
    ('cond_garantia_dias', '30');

-- Semilla del catalogo tomada de Cotizacion_Formal_PCG_SPA.xlsx (editable en el panel)
INSERT INTO catalogo_servicios (codigo, nombre, descripcion, precio_normal, precio_convenio, costo_interno) VALUES
    ('MANT-PREV',  'Mantención Preventiva de Hardware de PC',
        'Desarme completo, limpieza profunda ultrasónica/aire, lubricación de ventiladores y pasta térmica premium certificada.', 45000, 40000, NULL),
    ('SO-OFFICE',  'Instalación de Windows + Office + Optimización Avanzada',
        'Formateo profesional, activación correcta, configuración de rendimiento corporativo y afinamiento de arranque.', 50000, 45000, NULL),
    ('SO-LIMPIO',  'SO Limpio + Optimización (sin Office)',
        'Instalación limpia del sistema operativo y optimización de arranque y rendimiento.', 50000, 35000, NULL),
    ('DRIVERS',    'Actualización Integral de Drivers y Programas Base',
        'Drivers oficiales y programas base para todo el parque.', 35000, 0, NULL),
    ('AVAST-ULT',  'Licencia Avast Ultimate (1 año) + Instalación',
        'Licencia oficial con clave digital por equipo, protección en tiempo real, firewall y escudo anti-ransomware.', 50000, 30000, 12000),
    ('DASH-INV',   'Dashboard de Inventario Técnico Digitalizado de Activos TI',
        'Mapeo de hardware, componentes, estado de salud y ficha digital de cada equipo.', 60000, 0, NULL);

-- Plantillas de tareas que se aplican al crear una OT segun el tipo de servicio
CREATE TABLE plantillas_ot (
    id_plantilla   INT PRIMARY KEY AUTO_INCREMENT,
    nombre         VARCHAR(120) NOT NULL,
    tipo_servicio  ENUM('MANTENIMIENTO','DESARROLLO','UPGRADE','CONSULTORIA') NOT NULL,
    tareas_json    JSON NOT NULL,                     -- [{"titulo":"...","horas":1.5,"orden":1,"depende_de":null}]
    activa         BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO plantillas_ot (nombre, tipo_servicio, tareas_json) VALUES
    ('Mantención preventiva estándar', 'MANTENIMIENTO', JSON_ARRAY(
        JSON_OBJECT('orden',1,'titulo','Recepción y fotos del estado físico','horas',0.5),
        JSON_OBJECT('orden',2,'titulo','Diagnóstico y temperaturas iniciales','horas',0.5),
        JSON_OBJECT('orden',3,'titulo','Desarme y limpieza profunda','horas',1.5),
        JSON_OBJECT('orden',4,'titulo','Lubricación de ventiladores y pasta térmica','horas',0.5),
        JSON_OBJECT('orden',5,'titulo','SO, drivers y optimización (si aplica)','horas',1.5),
        JSON_OBJECT('orden',6,'titulo','QA: pruebas y temperaturas finales','horas',0.5),
        JSON_OBJECT('orden',7,'titulo','Registro en hoja de vida e informe','horas',0.5),
        JSON_OBJECT('orden',8,'titulo','Entrega al cliente','horas',0.25)));

-- Archivos adjuntos genericos (OT, tickets, informes) en almacenamiento privado
CREATE TABLE archivos (
    id_archivo     INT PRIMARY KEY AUTO_INCREMENT,
    entidad_tipo   ENUM('TICKET','OT','TAREA','EQUIPO','INFORME','CONTRATO') NOT NULL,
    entidad_id     INT NOT NULL,
    nombre_original VARCHAR(200) NOT NULL,
    ruta_privada   VARCHAR(255) NOT NULL,
    mime           VARCHAR(100) NOT NULL,
    tamano_bytes   INT NOT NULL,
    visible_cliente BOOLEAN NOT NULL DEFAULT FALSE,
    subido_por     INT NOT NULL,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_archivos_entidad (entidad_tipo, entidad_id),
    FOREIGN KEY (subido_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tarjetas de la landing (seccion "Nuestro equipo"); id_usuario NULL si no tiene login
CREATE TABLE equipo_miembros (
    id_miembro     INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario     INT NULL,
    nombre         VARCHAR(100) NOT NULL,
    titulos_json   JSON NOT NULL,                     -- lista de titulos / grados
    bio_corta      VARCHAR(300),
    foto_path      VARCHAR(255),
    orden          INT NOT NULL DEFAULT 0,
    visible        BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO equipo_miembros (nombre, titulos_json, orden) VALUES
    ('Yovylin Bugueño',  JSON_ARRAY('Ingeniera Civil Industrial', 'Licenciada (título de licenciatura)'), 1),
    ('Brilan Bugueño',   JSON_ARRAY('Licenciado en Ciencias de la Ingeniería Informática', 'Ingeniero Informático'), 2),
    ('Johan Carrasco',   JSON_ARRAY('Ingeniero en Seguridad Privada', 'Prevencionista de Riesgos (menciones penales)'), 3);

-- Datos de la empresa y condiciones comerciales editables desde el panel.
-- Los datos bancarios y el RUT se cargan desde el panel, no desde este archivo.
CREATE TABLE config_empresa (
    clave          VARCHAR(60) PRIMARY KEY,
    valor          TEXT NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO config_empresa (clave, valor) VALUES
    ('razon_social', 'PCG SPA'),
    ('giro', 'Servicios TI, Soporte & Mantenimiento de Equipos'),
    ('cond_forma_pago', '50% al iniciar los trabajos y 50% contra recepción conforme'),
    ('cond_plazo_ejecucion', '1 a 2 jornadas hábiles coordinadas según disponibilidad'),
    ('cond_validez_dias_habiles', '15'),
    ('cond_garantia_dias', '30');

-- Semilla del catalogo tomada de Cotizacion_Formal_PCG_SPA.xlsx (editable en el panel)
INSERT INTO catalogo_servicios (codigo, nombre, descripcion, precio_normal, precio_convenio, costo_interno) VALUES
    ('MANT-PREV',  'Mantención Preventiva de Hardware de PC',
        'Desarme completo, limpieza profunda ultrasónica/aire, lubricación de ventiladores y pasta térmica premium certificada.', 45000, 40000, NULL),
    ('SO-OFFICE',  'Instalación de Windows + Office + Optimización Avanzada',
        'Formateo profesional, activación correcta, configuración de rendimiento corporativo y afinamiento de arranque.', 50000, 45000, NULL),
    ('SO-LIMPIO',  'SO Limpio + Optimización (sin Office)',
        'Instalación limpia del sistema operativo y optimización de arranque y rendimiento.', 50000, 35000, NULL),
    ('DRIVERS',    'Actualización Integral de Drivers y Programas Base',
        'Drivers oficiales y programas base para todo el parque.', 35000, 0, NULL),
    ('AVAST-ULT',  'Licencia Avast Ultimate (1 año) + Instalación',
        'Licencia oficial con clave digital por equipo, protección en tiempo real, firewall y escudo anti-ransomware.', 50000, 30000, 12000),
    ('DASH-INV',   'Dashboard de Inventario Técnico Digitalizado de Activos TI',
        'Mapeo de hardware, componentes, estado de salud y ficha digital de cada equipo.', 60000, 0, NULL);
