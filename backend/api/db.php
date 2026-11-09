<?php
/**
 * PCG SPA - API Principal de Sincronización con Base de Datos MySQL
 * Maneja GET (Lectura completa tipada) y POST (Persistencia y Sincronización)
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = DB::connect();

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // ==========================================
        // 1. OBTENER TODAS LAS TABLAS DE MYSQL
        // ==========================================

        // Usuarios
        $stmt = $pdo->query("SELECT * FROM usuarios ORDER BY id ASC");
        $usuarios = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'nombre' => $r['nombre'],
                'email' => $r['email'],
                'password' => $r['password'],
                'rol' => $r['rol'],
                'rolEtiqueta' => $r['rol_etiqueta'] ?? null,
                'especialidad' => $r['especialidad'] ?? null,
                'aptoTecnico' => isset($r['apto_tecnico']) ? (bool)$r['apto_tecnico'] : true,
                'aptoDesarrollador' => isset($r['apto_desarrollador']) ? (bool)$r['apto_desarrollador'] : false,
                'rut' => $r['rut'] ?? null,
                'telefono' => $r['telefono'] ?? null,
                'activo' => (bool)$r['activo'],
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'cargo' => $r['cargo'] ?? null,
                'titulo' => $r['titulo'] ?? null,
                'horasSemanales' => $r['horas_semanales'] !== null ? (int)$r['horas_semanales'] : 40,
                'color' => $r['color'] ?? '#10b981',
            ];
        }, $stmt->fetchAll());

        // Empresas
        $stmt = $pdo->query("SELECT * FROM empresas ORDER BY id ASC");
        $empresas = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'razonSocial' => $r['razon_social'],
                'rut' => $r['rut'],
                'giro' => $r['giro'] ?? '',
                'ciudad' => $r['ciudad'] ?? 'Santiago',
                'direccion' => $r['direccion'] ?? '',
                'contactoId' => (int)$r['contacto_id'],
            ];
        }, $stmt->fetchAll());

        // Equipos
        $stmt = $pdo->query("SELECT * FROM equipos ORDER BY id ASC");
        $equipos = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'usuarioId' => (int)$r['usuario_id'],
                'codigo' => $r['codigo'],
                'area' => $r['area'] ?? '',
                'tipo' => $r['tipo'],
                'marca' => $r['marca'],
                'modelo' => $r['modelo'],
                'serie' => $r['serie'] ?? '',
                'cpu' => $r['cpu'] ?? '',
                'ramGb' => (int)$r['ram_gb'],
                'disipacion' => $r['disipacion'] ?? 'AIRE',
                'gpu' => $r['gpu'] ?? '',
                'ultimaMantencion' => $r['ultima_mantencion'],
                'proximaMantencion' => $r['proxima_mantencion'],
                'ubicacion' => $r['ubicacion'] ?? 'EN_PODER_CLIENTE',
            ];
        }, $stmt->fetchAll());

        // Intervenciones
        $stmt = $pdo->query("SELECT * FROM intervenciones ORDER BY id ASC");
        $intervenciones = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'equipoId' => (int)$r['equipo_id'],
                'otId' => $r['ot_id'] !== null ? (int)$r['ot_id'] : null,
                'tecnicoId' => (int)$r['tecnico_id'],
                'tipo' => $r['tipo'],
                'titulo' => $r['titulo'],
                'detalle' => $r['detalle'] ?? '',
                'tempAntes' => $r['temp_antes'] !== null ? (int)$r['temp_antes'] : null,
                'tempDespues' => $r['temp_despues'] !== null ? (int)$r['temp_despues'] : null,
                'checklist' => !empty($r['checklist']) ? json_decode($r['checklist'], true) : [],
                'insumos' => $r['insumos'] ?? '',
                'fecha' => $r['fecha'],
                'garantiaDias' => (int)$r['garantia_dias'],
                'visibleCliente' => (bool)$r['visible_cliente'],
            ];
        }, $stmt->fetchAll());

        // Tickets
        $stmt = $pdo->query("SELECT * FROM tickets ORDER BY id ASC");
        $tickets = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'codigo' => $r['codigo'],
                'usuarioId' => (int)$r['usuario_id'],
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'tipo' => $r['tipo'],
                'asunto' => $r['asunto'],
                'descripcion' => $r['descripcion'] ?? '',
                'equipoIds' => !empty($r['equipo_ids']) ? json_decode($r['equipo_ids'], true) : [],
                'cantEquipos' => (int)$r['cant_equipos'],
                'fechaCita' => $r['fecha_cita'],
                'horaCita' => $r['hora_cita'],
                'modalidadAtencion' => $r['modalidad_atencion'],
                'otId' => $r['ot_id'] !== null ? (int)$r['ot_id'] : null,
                'estado' => $r['estado'],
                'mensajes' => !empty($r['mensajes']) ? json_decode($r['mensajes'], true) : [],
                'creado' => $r['creado'],
            ];
        }, $stmt->fetchAll());

        // Servicios
        $stmt = $pdo->query("SELECT * FROM servicios ORDER BY id ASC");
        $servicios = array_map(function ($r) {
            $tarifaCliente = isset($r['tarifa_cliente']) && (int)$r['tarifa_cliente'] > 0 ? (int)$r['tarifa_cliente'] : (int)$r['normal'];
            $tarifaEmpresa = isset($r['tarifa_empresa']) && (int)$r['tarifa_empresa'] > 0 ? (int)$r['tarifa_empresa'] : (int)$r['normal'];
            return [
                'id' => (int)$r['id'],
                'codigo' => $r['codigo'],
                'nombre' => $r['nombre'],
                'descripcion' => $r['descripcion'] ?? '',
                'tarifaCliente' => $tarifaCliente,
                'tarifaEmpresa' => $tarifaEmpresa,
                'normal' => (int)$r['normal'],
                'convenio' => (int)$r['convenio'],
                'costo' => (int)$r['costo'],
                'activo' => (bool)$r['activo'],
            ];
        }, $stmt->fetchAll());

        // Paquetes
        $stmt = $pdo->query("SELECT * FROM paquetes ORDER BY id ASC");
        $paquetes = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'nombre' => $r['nombre'],
                'sufijo' => $r['sufijo'],
                'servicioIds' => !empty($r['servicio_ids']) ? json_decode($r['servicio_ids'], true) : [],
            ];
        }, $stmt->fetchAll());

        // Cotizaciones
        $stmt = $pdo->query("SELECT * FROM cotizaciones ORDER BY id ASC");
        $cotizaciones = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'numero' => $r['numero'],
                'ticketId' => $r['ticket_id'] !== null ? (int)$r['ticket_id'] : null,
                'usuarioId' => (int)$r['usuario_id'],
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'emailDestino' => $r['email_destino'] ?? null,
                'paqueteId' => $r['paquete_id'] !== null ? (int)$r['paquete_id'] : null,
                'modo' => $r['modo'],
                'descuentoCriterioPct' => $r['descuento_criterio_pct'] !== null ? (float)$r['descuento_criterio_pct'] : 0,
                'descuentoCriterioMonto' => $r['descuento_criterio_monto'] !== null ? (int)$r['descuento_criterio_monto'] : 0,
                'motivoDescuento' => $r['motivo_descuento'] ?? null,
                'planInicio' => $r['plan_inicio'],
                'planFin' => $r['plan_fin'],
                'planTecnicoId' => $r['plan_tecnico_id'] !== null ? (int)$r['plan_tecnico_id'] : null,
                'items' => !empty($r['items']) ? json_decode($r['items'], true) : [],
                'cantEquipos' => (int)$r['cant_equipos'],
                'subtotalNormal' => (int)$r['subtotal_normal'],
                'descuentoMonto' => (int)$r['descuento_monto'],
                'total' => (int)$r['total'],
                'estado' => $r['estado'],
                'fecha' => $r['fecha'],
                'validaHasta' => $r['valida_hasta'],
                'otId' => $r['ot_id'] !== null ? (int)$r['ot_id'] : null,
                'emitidaPor' => (int)($r['emitida_por'] ?? 1),
            ];
        }, $stmt->fetchAll());

        // OTs
        $stmt = $pdo->query("SELECT * FROM ots ORDER BY id ASC");
        $ots = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'codigo' => $r['codigo'],
                'ticketId' => $r['ticket_id'] !== null ? (int)$r['ticket_id'] : null,
                'cotizacionId' => $r['cotizacion_id'] !== null ? (int)$r['cotizacion_id'] : null,
                'proyectoId' => $r['proyecto_id'] !== null ? (int)$r['proyecto_id'] : null,
                'origen' => $r['origen'],
                'usuarioId' => (int)$r['usuario_id'],
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'titulo' => $r['titulo'],
                'descripcion' => $r['descripcion'] ?? '',
                'tipo' => $r['tipo'],
                'prioridad' => $r['prioridad'],
                'estado' => $r['estado'],
                'tecnicoId' => $r['tecnico_id'] !== null ? (int)$r['tecnico_id'] : null,
                'inicio' => $r['inicio'],
                'fin' => $r['fin'],
                'horaCita' => $r['hora_cita'] ?? null,
                'modalidadAtencion' => $r['modalidad_atencion'] ?? null,
                'equipoIds' => !empty($r['equipo_ids']) ? json_decode($r['equipo_ids'], true) : [],
                'total' => (int)$r['total'],
                'estadoPago' => $r['estado_pago'],
                'comprobanteNombre' => $r['comprobante_nombre'] ?? null,
                'requiereFactura' => (bool)$r['requiere_factura'],
                'numeroFactura' => $r['numero_factura'] ?? null,
                'facturaNombre' => $r['factura_nombre'] ?? null,
                'datosFacturacion' => !empty($r['datos_facturacion']) ? json_decode($r['datos_facturacion'], true) : null,
                'historial' => !empty($r['historial']) ? json_decode($r['historial'], true) : [],
                'comentarios' => !empty($r['comentarios']) ? json_decode($r['comentarios'], true) : [],
                'creado' => $r['creado'],
            ];
        }, $stmt->fetchAll());

        // Tareas
        $stmt = $pdo->query("SELECT * FROM tareas ORDER BY id ASC");
        $tareas = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'otId' => (int)$r['ot_id'],
                'titulo' => $r['titulo'],
                'asignadoId' => $r['asignado_id'] !== null ? (int)$r['asignado_id'] : null,
                'estado' => $r['estado'],
                'prioridad' => $r['prioridad'],
                'inicio' => $r['inicio'] ?? null,
                'limite' => $r['limite'] ?? null,
                'hEst' => (float)$r['h_est'],
                'hReal' => $r['h_real'] !== null ? (float)$r['h_real'] : null,
                'equipoId' => $r['equipo_id'] !== null ? (int)$r['equipo_id'] : null,
                'dependeDe' => $r['depende_de'] !== null ? (int)$r['depende_de'] : null,
            ];
        }, $stmt->fetchAll());

        // Programas
        $stmt = $pdo->query("SELECT * FROM programas ORDER BY id ASC");
        $programas = array_map(function ($r) {
            return [
                'empresaId' => (int)$r['empresa_id'],
                'activo' => (bool)$r['activo'],
                'periodicidadMeses' => (int)$r['periodicidad_meses'],
                'diasAviso' => (int)$r['dias_aviso'],
                'emails' => $r['emails'] ?? '',
                'ccInterno' => (bool)$r['cc_interno'],
            ];
        }, $stmt->fetchAll());

        // Alertas enviadas
        $stmt = $pdo->query("SELECT clave, estado FROM alertas_enviadas");
        $alertasEnviadas = [];
        foreach ($stmt->fetchAll() as $al) {
            $alertasEnviadas[$al['clave']] = $al['estado'];
        }

        // Correos
        $stmt = $pdo->query("SELECT * FROM correos ORDER BY id ASC");
        $correos = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'tipo' => $r['tipo'],
                'de' => $r['de'] ?? null,
                'para' => $r['para'],
                'cc' => $r['cc'] ?? null,
                'asunto' => $r['asunto'],
                'cuerpo' => $r['cuerpo'],
                'fecha' => $r['fecha'],
            ];
        }, $stmt->fetchAll());

        // Informes
        $stmt = $pdo->query("SELECT * FROM informes ORDER BY id ASC");
        $informes = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'codigo' => $r['codigo'],
                'tipo' => $r['tipo'],
                'equipoId' => $r['equipo_id'] !== null ? (int)$r['equipo_id'] : null,
                'otId' => $r['ot_id'] !== null ? (int)$r['ot_id'] : null,
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'desde' => $r['desde'],
                'hasta' => $r['hasta'],
                'titulo' => $r['titulo'],
                'resumen' => $r['resumen'] ?? '',
                'fecha' => $r['fecha'],
                'visibleCliente' => (bool)$r['visible_cliente'],
                'generadoPor' => (int)$r['generado_por'],
            ];
        }, $stmt->fetchAll());

        // Facturas
        $stmt = $pdo->query("SELECT * FROM facturas ORDER BY id ASC");
        $facturas = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'folio' => $r['folio'],
                'direccion' => $r['direccion'],
                'tipoDoc' => $r['tipo_doc'],
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'usuarioId' => $r['usuario_id'] !== null ? (int)$r['usuario_id'] : null,
                'otId' => $r['ot_id'] !== null ? (int)$r['ot_id'] : null,
                'cotizacionId' => $r['cotizacion_id'] !== null ? (int)$r['cotizacion_id'] : null,
                'contraparteNombre' => $r['contraparte_nombre'],
                'contraparteRut' => $r['contraparte_rut'],
                'concepto' => $r['concepto'],
                'categoria' => $r['categoria'],
                'fechaEmision' => $r['fecha_emision'],
                'fechaVencimiento' => $r['fecha_vencimiento'],
                'montoNeto' => (int)$r['monto_neto'],
                'montoIva' => (int)$r['monto_iva'],
                'montoTotal' => (int)$r['monto_total'],
                'montoPagado' => (int)$r['monto_pagado'],
                'estado' => $r['estado'],
                'metodoPago' => $r['metodo_pago'] ?? null,
                'fechaUltimoPago' => $r['fecha_ultimo_pago'],
                'notas' => $r['notas'] ?? null,
            ];
        }, $stmt->fetchAll());

        // Movimientos
        $stmt = $pdo->query("SELECT * FROM movimientos ORDER BY id ASC");
        $movimientos = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'fecha' => $r['fecha'],
                'tipo' => $r['tipo'],
                'rubro' => $r['rubro'] ?? null,
                'categoria' => $r['categoria'],
                'concepto' => $r['concepto'],
                'itemComprado' => $r['item_comprado'] ?? null,
                'cantidad' => $r['cantidad'] !== null ? (int)$r['cantidad'] : null,
                'contraparte' => $r['contraparte'],
                'monto' => (int)$r['monto'],
                'metodo' => $r['metodo'],
                'nroDocumento' => $r['nro_documento'] ?? null,
                'conciliadoBanco' => (bool)$r['conciliado_banco'],
                'facturaId' => $r['factura_id'] !== null ? (int)$r['factura_id'] : null,
                'otId' => $r['ot_id'] !== null ? (int)$r['ot_id'] : null,
            ];
        }, $stmt->fetchAll());

        // Inventario
        $stmt = $pdo->query("SELECT * FROM inventario ORDER BY id ASC");
        $inventario = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'codigo' => $r['codigo'],
                'categoria' => $r['categoria'],
                'nombre' => $r['nombre'],
                'marcaModelo' => $r['marca_modelo'] ?? '',
                'descripcion' => $r['descripcion'] ?? '',
                'stockActual' => (int)$r['stock_actual'],
                'enUso' => (int)$r['en_uso'],
                'stockMinimo' => (int)$r['stock_minimo'],
                'unidad' => $r['unidad'] ?? 'UN',
                'costoUnitario' => (int)$r['costo_unitario'],
                'precioVentaSugerido' => $r['precio_venta_sugerido'] !== null ? (int)$r['precio_venta_sugerido'] : null,
                'proveedor' => $r['proveedor'] ?? '',
                'fechaUltimaCompra' => $r['fecha_ultima_compra'] ?? '',
                'nroFacturaCompra' => $r['nro_factura_compra'] ?? null,
                'ubicacion' => $r['ubicacion'] ?? 'Taller Central',
                'responsableId' => $r['responsable_id'] !== null ? (int)$r['responsable_id'] : null,
                'estadoFisico' => $r['estado_fisico'] ?? null,
                'tipoLicencia' => $r['tipo_licencia'] ?? null,
                'claveLicencia' => $r['clave_licencia'] ?? null,
                'cuentaAsociada' => $r['cuenta_asociada'] ?? null,
                'fechaVencimientoLicencia' => $r['fecha_vencimiento_licencia'] ?? null,
                'asignadoAClientes' => !empty($r['asignado_a_clientes']) ? json_decode($r['asignado_a_clientes'], true) : [],
            ];
        }, $stmt->fetchAll());

        // Proyectos Web y Software
        $stmt = $pdo->query("SELECT * FROM proyectos_web ORDER BY id ASC");
        $proyectosWeb = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'codigo' => $r['codigo'],
                'empresaId' => $r['empresa_id'] !== null ? (int)$r['empresa_id'] : null,
                'usuarioId' => $r['usuario_id'] !== null ? (int)$r['usuario_id'] : null,
                'clienteNombre' => $r['cliente_nombre'],
                'tipo' => $r['tipo'],
                'nombreProyecto' => $r['nombre_proyecto'],
                'descripcion' => $r['descripcion'] ?? '',
                'urlDominio' => $r['url_dominio'] ?? null,
                'stackTecnologico' => $r['stack_tecnologico'] ?? null,
                'hostingProveedor' => $r['hostingProveedor'] ?? ($r['hosting_proveedor'] ?? null),
                'valorProyecto' => (int)$r['valor_proyecto'],
                'montoCobrado' => (int)$r['monto_cobrado'],
                'estadoCobro' => $r['estado_cobro'],
                'incluyeMantencionWeb' => (bool)$r['incluye_mantencion_web'],
                'planMantencion' => $r['plan_mantencion'],
                'valorMantencion' => (int)$r['valor_mantencion'],
                'fechaInicio' => $r['fecha_inicio'],
                'fechaEntrega' => $r['fecha_entrega'],
                'proximaMantencionWeb' => $r['proxima_mantencion_web'],
                'vencimientoDominioHosting' => $r['vencimiento_dominio_hosting'],
                'estado' => $r['estado'],
                'responsableId' => (int)$r['responsable_id'],
                'participantesIds' => !empty($r['participantes_ids']) ? json_decode($r['participantes_ids'], true) : [],
                'participantesDetalle' => !empty($r['participantes_detalle']) ? json_decode($r['participantes_detalle'], true) : [],
                'personasExternas' => !empty($r['personas_externas']) ? json_decode($r['personas_externas'], true) : [],
                'modalidadEjecucion' => $r['modalidad_ejecucion'] ?? 'SOLO_PCG',
                'empresaExterna' => !empty($r['empresa_externa']) ? json_decode($r['empresa_externa'], true) : null,
                'notas' => $r['notas'] ?? '',
            ];
        }, $stmt->fetchAll());

        // Conexión Bancaria
        $stmt = $pdo->query("SELECT * FROM banco_conexion WHERE id = 1 LIMIT 1");
        $bcRow = $stmt->fetch();
        $bancoConexion = $bcRow ? [
            'conectado' => (bool)$bcRow['conectado'],
            'banco' => $bcRow['banco'],
            'tipoCuenta' => $bcRow['tipo_cuenta'] ?? 'Cuenta Corriente',
            'numeroCuenta' => $bcRow['numero_cuenta'] ?? '',
            'titular' => $bcRow['titular'] ?? 'PCG SERVICIOS TECNOLOGICOS SPA',
            'rutTitular' => $bcRow['rut_titular'] ?? '77.806.251-8',
            'proveedorApi' => $bcRow['proveedor_api'] ?? 'FINTOC_OPEN_BANKING',
            'saldoActual' => (int)$bcRow['saldo_actual'],
            'ultimaSincronizacion' => $bcRow['ultima_sincronizacion'] ?? date('c'),
        ] : null;

        // Configuración Corporativa
        $stmt = $pdo->query("SELECT * FROM configuracion WHERE id = 1 LIMIT 1");
        $cfgRow = $stmt->fetch();
        $config = [
            'razonSocial' => $cfgRow['razon_social'] ?? 'PCG SPA',
            'giro' => $cfgRow['giro'] ?? 'Servicios Informáticos Integrales',
            'rut' => $cfgRow['rut'] ?? '77.806.251-8',
            'telefono' => $cfgRow['telefono'] ?? '+56 9 4938 4043',
            'email' => $cfgRow['email'] ?? 'serviciotecnicopcg@gmail.com',
            'condPago' => $cfgRow['cond_pago'] ?? '',
            'condPlazo' => $cfgRow['cond_plazo'] ?? '',
            'condValidezDias' => (int)($cfgRow['cond_validez_dias'] ?? 21),
            'condGarantiaDias' => (int)($cfgRow['cond_garantia_dias'] ?? 30),
        ];

        // Descuentos
        $stmt = $pdo->query("SELECT * FROM descuentos ORDER BY id ASC");
        $descuentos = array_map(function ($r) {
            return [
                'min' => (int)$r['min_equipos'],
                'max' => $r['max_equipos'] !== null ? (int)$r['max_equipos'] : null,
                'pct' => (int)$r['pct'],
            ];
        }, $stmt->fetchAll());

        // Secuencias
        $stmt = $pdo->query("SELECT clave, valor FROM secuencias");
        $seq = [];
        foreach ($stmt->fetchAll() as $sq) {
            $seq[$sq['clave']] = (int)$sq['valor'];
        }

        // Armar payload completo DB
        $db = [
            'version' => 1,
            'usuarios' => $usuarios,
            'empresas' => $empresas,
            'equipos' => $equipos,
            'intervenciones' => $intervenciones,
            'tickets' => $tickets,
            'servicios' => $servicios,
            'paquetes' => $paquetes,
            'cotizaciones' => $cotizaciones,
            'ots' => $ots,
            'tareas' => $tareas,
            'programas' => $programas,
            'alertasEnviadas' => $alertasEnviadas,
            'correos' => $correos,
            'informes' => $informes,
            'facturas' => $facturas,
            'movimientos' => $movimientos,
            'inventario' => $inventario,
            'proyectosWeb' => $proyectosWeb,
            'bancoConexion' => $bancoConexion,
            'config' => $config,
            'descuentos' => $descuentos,
            'seq' => $seq,
        ];

        jsonResponse([
            'ok' => true,
            'fuente' => 'MySQL (XAMPP - pcg_software)',
            'timestamp' => date('c'),
            'db' => $db,
        ]);
    }

    if ($method === 'POST') {
        // ==========================================
        // 2. SINCRONIZAR CAMBIOS A MYSQL
        // ==========================================
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!$payload || !is_array($payload)) {
            jsonError('Payload inválido. Debe ser JSON.', 400);
        }

        // Si viene envuelto en { db: { ... } }
        $data = $payload['db'] ?? $payload;

        $pdo->beginTransaction();
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

        // 1. Usuarios si viene
        if (isset($data['usuarios']) && is_array($data['usuarios'])) {
            $pdo->exec("DELETE FROM usuarios WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO usuarios (id, nombre, email, password, rol, rol_etiqueta, especialidad, apto_tecnico, apto_desarrollador, rut, telefono, activo, empresa_id, cargo, titulo, horas_semanales, color) VALUES (:id, :nombre, :email, :password, :rol, :rol_etiqueta, :especialidad, :apto_tecnico, :apto_desarrollador, :rut, :telefono, :activo, :empresa_id, :cargo, :titulo, :horas_semanales, :color)");
            foreach ($data['usuarios'] as $u) {
                $rawPass = $u['password'] ?? 'pcg123';
                // Si la contraseña no está ya hasheada con bcrypt ($2y$, $2a$, $2b$), la hasheamos
                if (!preg_match('/^\$2[ayb]\$.{56}$/', $rawPass)) {
                    $hashedPass = password_hash($rawPass, PASSWORD_BCRYPT);
                } else {
                    $hashedPass = $rawPass;
                }
                $st->execute([
                    ':id' => $u['id'],
                    ':nombre' => $u['nombre'],
                    ':email' => $u['email'],
                    ':password' => $hashedPass,
                    ':rol' => $u['rol'],
                    ':rol_etiqueta' => $u['rolEtiqueta'] ?? null,
                    ':especialidad' => $u['especialidad'] ?? null,
                    ':apto_tecnico' => (isset($u['aptoTecnico']) ? $u['aptoTecnico'] : true) ? 1 : 0,
                    ':apto_desarrollador' => (isset($u['aptoDesarrollador']) ? $u['aptoDesarrollador'] : false) ? 1 : 0,
                    ':rut' => $u['rut'] ?? null,
                    ':telefono' => $u['telefono'] ?? null,
                    ':activo' => ($u['activo'] ?? true) ? 1 : 0,
                    ':empresa_id' => $u['empresaId'] ?? null,
                    ':cargo' => $u['cargo'] ?? null,
                    ':titulo' => $u['titulo'] ?? null,
                    ':horas_semanales' => $u['horasSemanales'] ?? 40,
                    ':color' => $u['color'] ?? '#10b981',
                ]);
            }
        }

        // 2. Empresas si viene
        if (isset($data['empresas']) && is_array($data['empresas'])) {
            $pdo->exec("DELETE FROM empresas WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO empresas (id, razon_social, rut, giro, ciudad, direccion, contacto_id, activo) VALUES (:id, :razon_social, :rut, :giro, :ciudad, :direccion, :contacto_id, 1)");
            foreach ($data['empresas'] as $e) {
                $st->execute([
                    ':id' => $e['id'],
                    ':razon_social' => $e['razonSocial'],
                    ':rut' => $e['rut'],
                    ':giro' => $e['giro'] ?? null,
                    ':ciudad' => $e['ciudad'] ?? 'Santiago',
                    ':direccion' => $e['direccion'] ?? null,
                    ':contacto_id' => $e['contactoId'] ?? null,
                ]);
            }
        }

        // 3. Equipos
        if (isset($data['equipos']) && is_array($data['equipos'])) {
            $pdo->exec("DELETE FROM equipos WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO equipos (id, empresa_id, usuario_id, codigo, area, tipo, marca, modelo, serie, cpu, ram_gb, disipacion, gpu, ultima_mantencion, proxima_mantencion, ubicacion) VALUES (:id, :empresa_id, :usuario_id, :codigo, :area, :tipo, :marca, :modelo, :serie, :cpu, :ram_gb, :disipacion, :gpu, :ultima_mantencion, :proxima_mantencion, :ubicacion)");
            foreach ($data['equipos'] as $eq) {
                $st->execute([
                    ':id' => $eq['id'],
                    ':empresa_id' => $eq['empresaId'] ?? null,
                    ':usuario_id' => $eq['usuarioId'],
                    ':codigo' => $eq['codigo'],
                    ':area' => $eq['area'] ?? null,
                    ':tipo' => $eq['tipo'],
                    ':marca' => $eq['marca'],
                    ':modelo' => $eq['modelo'],
                    ':serie' => $eq['serie'] ?? null,
                    ':cpu' => $eq['cpu'] ?? null,
                    ':ram_gb' => $eq['ramGb'] ?? 8,
                    ':disipacion' => $eq['disipacion'] ?? 'AIRE',
                    ':gpu' => $eq['gpu'] ?? null,
                    ':ultima_mantencion' => !empty($eq['ultimaMantencion']) ? substr($eq['ultimaMantencion'], 0, 10) : null,
                    ':proxima_mantencion' => !empty($eq['proximaMantencion']) ? substr($eq['proximaMantencion'], 0, 10) : null,
                    ':ubicacion' => $eq['ubicacion'] ?? 'EN_PODER_CLIENTE',
                ]);
            }
        }

        // 4. Intervenciones
        if (isset($data['intervenciones']) && is_array($data['intervenciones'])) {
            $pdo->exec("DELETE FROM intervenciones WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO intervenciones (id, equipo_id, ot_id, tecnico_id, tipo, titulo, detalle, temp_antes, temp_despues, checklist, insumos, fecha, garantia_dias, visible_cliente) VALUES (:id, :equipo_id, :ot_id, :tecnico_id, :tipo, :titulo, :detalle, :temp_antes, :temp_despues, :checklist, :insumos, :fecha, :garantia_dias, :visible_cliente)");
            foreach ($data['intervenciones'] as $it) {
                $st->execute([
                    ':id' => $it['id'],
                    ':equipo_id' => $it['equipoId'],
                    ':ot_id' => $it['otId'] ?? null,
                    ':tecnico_id' => $it['tecnicoId'],
                    ':tipo' => $it['tipo'],
                    ':titulo' => $it['titulo'],
                    ':detalle' => $it['detalle'] ?? null,
                    ':temp_antes' => $it['tempAntes'] ?? null,
                    ':temp_despues' => $it['tempDespues'] ?? null,
                    ':checklist' => isset($it['checklist']) ? json_encode($it['checklist'], JSON_UNESCAPED_UNICODE) : null,
                    ':insumos' => $it['insumos'] ?? null,
                    ':fecha' => !empty($it['fecha']) ? substr($it['fecha'], 0, 10) : date('Y-m-d'),
                    ':garantia_dias' => $it['garantiaDias'] ?? 30,
                    ':visible_cliente' => ($it['visibleCliente'] ?? true) ? 1 : 0,
                ]);
            }
        }

        // 5. Tickets
        if (isset($data['tickets']) && is_array($data['tickets'])) {
            $pdo->exec("DELETE FROM tickets WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO tickets (id, codigo, usuario_id, empresa_id, tipo, asunto, descripcion, equipo_ids, cant_equipos, fecha_cita, hora_cita, modalidad_atencion, ot_id, estado, mensajes, creado) VALUES (:id, :codigo, :usuario_id, :empresa_id, :tipo, :asunto, :descripcion, :equipo_ids, :cant_equipos, :fecha_cita, :hora_cita, :modalidad_atencion, :ot_id, :estado, :mensajes, :creado)");
            foreach ($data['tickets'] as $tk) {
                $st->execute([
                    ':id' => $tk['id'],
                    ':codigo' => $tk['codigo'],
                    ':usuario_id' => $tk['usuarioId'],
                    ':empresa_id' => $tk['empresaId'] ?? null,
                    ':tipo' => $tk['tipo'],
                    ':asunto' => $tk['asunto'],
                    ':descripcion' => $tk['descripcion'] ?? null,
                    ':equipo_ids' => json_encode($tk['equipoIds'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':cant_equipos' => $tk['cantEquipos'] ?? 1,
                    ':fecha_cita' => !empty($tk['fechaCita']) ? substr($tk['fechaCita'], 0, 10) : null,
                    ':hora_cita' => $tk['horaCita'] ?? null,
                    ':modalidad_atencion' => $tk['modalidadAtencion'] ?? null,
                    ':ot_id' => $tk['otId'] ?? null,
                    ':estado' => $tk['estado'] ?? 'ABIERTO',
                    ':mensajes' => json_encode($tk['mensajes'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':creado' => !empty($tk['creado']) ? $tk['creado'] : date('Y-m-d H:i:s'),
                ]);
            }
        }

        // 6. Servicios
        if (isset($data['servicios']) && is_array($data['servicios'])) {
            $pdo->exec("DELETE FROM servicios WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO servicios (id, codigo, nombre, descripcion, tarifa_cliente, tarifa_empresa, normal, convenio, costo, activo) VALUES (:id, :codigo, :nombre, :descripcion, :tarifa_cliente, :tarifa_empresa, :normal, :convenio, :costo, :activo)");
            foreach ($data['servicios'] as $s) {
                $nom = $s['tarifaEmpresa'] ?? $s['normal'] ?? 0;
                $cli = $s['tarifaCliente'] ?? $nom;
                $st->execute([
                    ':id' => $s['id'],
                    ':codigo' => $s['codigo'],
                    ':nombre' => $s['nombre'],
                    ':descripcion' => $s['descripcion'] ?? null,
                    ':tarifa_cliente' => $cli,
                    ':tarifa_empresa' => $nom,
                    ':normal' => $nom,
                    ':convenio' => $s['convenio'] ?? 0,
                    ':costo' => $s['costo'] ?? 0,
                    ':activo' => ($s['activo'] ?? true) ? 1 : 0,
                ]);
            }
        }

        // 7. Paquetes
        if (isset($data['paquetes']) && is_array($data['paquetes'])) {
            $pdo->exec("DELETE FROM paquetes WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO paquetes (id, nombre, sufijo, servicio_ids) VALUES (:id, :nombre, :sufijo, :servicio_ids)");
            foreach ($data['paquetes'] as $p) {
                $st->execute([
                    ':id' => $p['id'],
                    ':nombre' => $p['nombre'],
                    ':sufijo' => $p['sufijo'],
                    ':servicio_ids' => json_encode($p['servicioIds'] ?? [], JSON_UNESCAPED_UNICODE),
                ]);
            }
        }

        // 8. Cotizaciones
        if (isset($data['cotizaciones']) && is_array($data['cotizaciones'])) {
            $pdo->exec("DELETE FROM cotizaciones WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO cotizaciones (id, numero, ticket_id, usuario_id, empresa_id, email_destino, paquete_id, modo, descuento_criterio_pct, descuento_criterio_monto, motivo_descuento, plan_inicio, plan_fin, plan_tecnico_id, items, cant_equipos, subtotal_normal, descuento_monto, total, estado, fecha, valida_hasta, ot_id, emitida_por) VALUES (:id, :numero, :ticket_id, :usuario_id, :empresa_id, :email_destino, :paquete_id, :modo, :descuento_criterio_pct, :descuento_criterio_monto, :motivo_descuento, :plan_inicio, :plan_fin, :plan_tecnico_id, :items, :cant_equipos, :subtotal_normal, :descuento_monto, :total, :estado, :fecha, :valida_hasta, :ot_id, :emitida_por)");
            foreach ($data['cotizaciones'] as $c) {
                $st->execute([
                    ':id' => $c['id'],
                    ':numero' => $c['numero'],
                    ':ticket_id' => $c['ticketId'] ?? null,
                    ':usuario_id' => $c['usuarioId'],
                    ':empresa_id' => $c['empresaId'] ?? null,
                    ':email_destino' => $c['emailDestino'] ?? null,
                    ':paquete_id' => $c['paqueteId'] ?? null,
                    ':modo' => $c['modo'] ?? 'CONVENIO',
                    ':descuento_criterio_pct' => $c['descuentoCriterioPct'] ?? 0,
                    ':descuento_criterio_monto' => $c['descuentoCriterioMonto'] ?? 0,
                    ':motivo_descuento' => $c['motivoDescuento'] ?? null,
                    ':plan_inicio' => !empty($c['planInicio']) ? substr($c['planInicio'], 0, 10) : null,
                    ':plan_fin' => !empty($c['planFin']) ? substr($c['planFin'], 0, 10) : null,
                    ':plan_tecnico_id' => $c['planTecnicoId'] ?? null,
                    ':items' => json_encode($c['items'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':cant_equipos' => $c['cantEquipos'] ?? 1,
                    ':subtotal_normal' => $c['subtotalNormal'] ?? 0,
                    ':descuento_monto' => $c['descuentoMonto'] ?? 0,
                    ':total' => $c['total'] ?? 0,
                    ':estado' => $c['estado'] ?? 'BORRADOR',
                    ':fecha' => !empty($c['fecha']) ? substr($c['fecha'], 0, 10) : date('Y-m-d'),
                    ':valida_hasta' => !empty($c['validaHasta']) ? substr($c['validaHasta'], 0, 10) : date('Y-m-d', strtotime('+21 days')),
                    ':ot_id' => $c['otId'] ?? null,
                    ':emitida_por' => $c['emitidaPor'] ?? 1,
                ]);
            }
        }

        // 9. OTs
        if (isset($data['ots']) && is_array($data['ots'])) {
            $pdo->exec("DELETE FROM ots WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO ots (id, codigo, ticket_id, cotizacion_id, proyecto_id, origen, usuario_id, empresa_id, titulo, descripcion, tipo, prioridad, estado, tecnico_id, inicio, fin, hora_cita, modalidad_atencion, equipo_ids, total, estado_pago, comprobante_nombre, requiere_factura, numero_factura, factura_nombre, datos_facturacion, historial, comentarios, creado) VALUES (:id, :codigo, :ticket_id, :cotizacion_id, :proyecto_id, :origen, :usuario_id, :empresa_id, :titulo, :descripcion, :tipo, :prioridad, :estado, :tecnico_id, :inicio, :fin, :hora_cita, :modalidad_atencion, :equipo_ids, :total, :estado_pago, :comprobante_nombre, :requiere_factura, :numero_factura, :factura_nombre, :datos_facturacion, :historial, :comentarios, :creado)");
            foreach ($data['ots'] as $o) {
                $st->execute([
                    ':id' => $o['id'],
                    ':codigo' => $o['codigo'],
                    ':ticket_id' => $o['ticketId'] ?? null,
                    ':cotizacion_id' => $o['cotizacionId'] ?? null,
                    ':proyecto_id' => $o['proyectoId'] ?? null,
                    ':origen' => $o['origen'] ?? 'TICKET',
                    ':usuario_id' => $o['usuarioId'],
                    ':empresa_id' => $o['empresaId'] ?? null,
                    ':titulo' => $o['titulo'],
                    ':descripcion' => $o['descripcion'] ?? '',
                    ':tipo' => $o['tipo'] ?? 'MANTENIMIENTO',
                    ':prioridad' => $o['prioridad'] ?? 'MEDIA',
                    ':estado' => $o['estado'] ?? 'RECIBIDO',
                    ':tecnico_id' => $o['tecnicoId'] ?? null,
                    ':inicio' => !empty($o['inicio']) ? substr($o['inicio'], 0, 10) : date('Y-m-d'),
                    ':fin' => !empty($o['fin']) ? substr($o['fin'], 0, 10) : date('Y-m-d'),
                    ':hora_cita' => $o['horaCita'] ?? null,
                    ':modalidad_atencion' => $o['modalidadAtencion'] ?? null,
                    ':equipo_ids' => json_encode($o['equipoIds'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':total' => $o['total'] ?? 0,
                    ':estado_pago' => $o['estadoPago'] ?? 'PENDIENTE',
                    ':comprobante_nombre' => $o['comprobanteNombre'] ?? null,
                    ':requiere_factura' => ($o['requiereFactura'] ?? false) ? 1 : 0,
                    ':numero_factura' => $o['numeroFactura'] ?? null,
                    ':factura_nombre' => $o['facturaNombre'] ?? null,
                    ':datos_facturacion' => isset($o['datosFacturacion']) ? json_encode($o['datosFacturacion'], JSON_UNESCAPED_UNICODE) : null,
                    ':historial' => json_encode($o['historial'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':comentarios' => json_encode($o['comentarios'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':creado' => !empty($o['creado']) ? $o['creado'] : date('Y-m-d H:i:s'),
                ]);
            }
        }

        // 10. Tareas
        if (isset($data['tareas']) && is_array($data['tareas'])) {
            $pdo->exec("DELETE FROM tareas WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO tareas (id, ot_id, titulo, asignado_id, estado, prioridad, inicio, limite, h_est, h_real, equipo_id, depende_de) VALUES (:id, :ot_id, :titulo, :asignado_id, :estado, :prioridad, :inicio, :limite, :h_est, :h_real, :equipo_id, :depende_de)");
            foreach ($data['tareas'] as $t) {
                $st->execute([
                    ':id' => $t['id'],
                    ':ot_id' => $t['otId'],
                    ':titulo' => $t['titulo'],
                    ':asignado_id' => $t['asignadoId'] ?? null,
                    ':estado' => $t['estado'] ?? 'PENDIENTE',
                    ':prioridad' => $t['prioridad'] ?? 'MEDIA',
                    ':inicio' => !empty($t['inicio']) ? substr($t['inicio'], 0, 10) : date('Y-m-d'),
                    ':limite' => !empty($t['limite']) ? substr($t['limite'], 0, 10) : date('Y-m-d'),
                    ':h_est' => $t['hEst'] ?? 1.0,
                    ':h_real' => $t['hReal'] ?? null,
                    ':equipo_id' => $t['equipoId'] ?? null,
                    ':depende_de' => $t['dependeDe'] ?? null,
                ]);
            }
        }

        // 11. Programas
        if (isset($data['programas']) && is_array($data['programas'])) {
            $pdo->exec("DELETE FROM programas WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO programas (empresa_id, activo, periodicidad_meses, dias_aviso, emails, cc_interno) VALUES (:empresa_id, :activo, :periodicidad_meses, :dias_aviso, :emails, :cc_interno)");
            foreach ($data['programas'] as $pr) {
                $st->execute([
                    ':empresa_id' => $pr['empresaId'],
                    ':activo' => ($pr['activo'] ?? true) ? 1 : 0,
                    ':periodicidad_meses' => $pr['periodicidadMeses'] ?? 3,
                    ':dias_aviso' => $pr['diasAviso'] ?? 7,
                    ':emails' => $pr['emails'] ?? '',
                    ':cc_interno' => ($pr['ccInterno'] ?? true) ? 1 : 0,
                ]);
            }
        }

        // 12. Alertas Enviadas
        if (isset($data['alertasEnviadas']) && is_array($data['alertasEnviadas'])) {
            $pdo->exec("DELETE FROM alertas_enviadas WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO alertas_enviadas (clave, estado) VALUES (:clave, :estado)");
            foreach ($data['alertasEnviadas'] as $k => $v) {
                $st->execute([':clave' => $k, ':estado' => $v]);
            }
        }

        // 13. Correos
        if (isset($data['correos']) && is_array($data['correos'])) {
            $pdo->exec("DELETE FROM correos WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO correos (id, tipo, de, para, cc, asunto, cuerpo, fecha) VALUES (:id, :tipo, :de, :para, :cc, :asunto, :cuerpo, :fecha)");
            foreach ($data['correos'] as $cor) {
                $st->execute([
                    ':id' => $cor['id'],
                    ':tipo' => $cor['tipo'],
                    ':de' => $cor['de'] ?? null,
                    ':para' => $cor['para'],
                    ':cc' => $cor['cc'] ?? null,
                    ':asunto' => $cor['asunto'],
                    ':cuerpo' => $cor['cuerpo'],
                    ':fecha' => $cor['fecha'] ?? date('Y-m-d H:i:s'),
                ]);
            }
        }

        // 14. Informes
        if (isset($data['informes']) && is_array($data['informes'])) {
            $pdo->exec("DELETE FROM informes WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO informes (id, codigo, tipo, equipo_id, ot_id, empresa_id, desde, hasta, titulo, resumen, fecha, visible_cliente, generado_por) VALUES (:id, :codigo, :tipo, :equipo_id, :ot_id, :empresa_id, :desde, :hasta, :titulo, :resumen, :fecha, :visible_cliente, :generado_por)");
            foreach ($data['informes'] as $inf) {
                $st->execute([
                    ':id' => $inf['id'],
                    ':codigo' => $inf['codigo'],
                    ':tipo' => $inf['tipo'],
                    ':equipo_id' => $inf['equipoId'] ?? null,
                    ':ot_id' => $inf['otId'] ?? null,
                    ':empresa_id' => $inf['empresaId'] ?? null,
                    ':desde' => !empty($inf['desde']) ? substr($inf['desde'], 0, 10) : null,
                    ':hasta' => !empty($inf['hasta']) ? substr($inf['hasta'], 0, 10) : null,
                    ':titulo' => $inf['titulo'],
                    ':resumen' => $inf['resumen'] ?? '',
                    ':fecha' => !empty($inf['fecha']) ? substr($inf['fecha'], 0, 10) : date('Y-m-d'),
                    ':visible_cliente' => ($inf['visibleCliente'] ?? true) ? 1 : 0,
                    ':generado_por' => $inf['generadoPor'] ?? 1,
                ]);
            }
        }

        // 15. Facturas
        if (isset($data['facturas']) && is_array($data['facturas'])) {
            $pdo->exec("DELETE FROM facturas WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO facturas (id, folio, direccion, tipo_doc, empresa_id, usuario_id, ot_id, cotizacion_id, contraparte_nombre, contraparte_rut, concepto, categoria, fecha_emision, fecha_vencimiento, monto_neto, monto_iva, monto_total, monto_pagado, estado, metodo_pago, fecha_ultimo_pago, notas) VALUES (:id, :folio, :direccion, :tipo_doc, :empresa_id, :usuario_id, :ot_id, :cotizacion_id, :contraparte_nombre, :contraparte_rut, :concepto, :categoria, :fecha_emision, :fecha_vencimiento, :monto_neto, :monto_iva, :monto_total, :monto_pagado, :estado, :metodo_pago, :fecha_ultimo_pago, :notas)");
            foreach ($data['facturas'] as $f) {
                $st->execute([
                    ':id' => $f['id'],
                    ':folio' => $f['folio'],
                    ':direccion' => $f['direccion'] ?? 'POR_COBRAR',
                    ':tipo_doc' => $f['tipoDoc'],
                    ':empresa_id' => $f['empresaId'] ?? null,
                    ':usuario_id' => $f['usuarioId'] ?? null,
                    ':ot_id' => $f['otId'] ?? null,
                    ':cotizacion_id' => $f['cotizacionId'] ?? null,
                    ':contraparte_nombre' => $f['contraparteNombre'],
                    ':contraparte_rut' => $f['contraparteRut'],
                    ':concepto' => $f['concepto'],
                    ':categoria' => $f['categoria'],
                    ':fecha_emision' => !empty($f['fechaEmision']) ? substr($f['fechaEmision'], 0, 10) : date('Y-m-d'),
                    ':fecha_vencimiento' => !empty($f['fechaVencimiento']) ? substr($f['fechaVencimiento'], 0, 10) : date('Y-m-d'),
                    ':monto_neto' => $f['montoNeto'] ?? 0,
                    ':monto_iva' => $f['montoIva'] ?? 0,
                    ':monto_total' => $f['montoTotal'] ?? 0,
                    ':monto_pagado' => $f['montoPagado'] ?? 0,
                    ':estado' => $f['estado'] ?? 'PAGADA',
                    ':metodo_pago' => $f['metodoPago'] ?? null,
                    ':fecha_ultimo_pago' => !empty($f['fechaUltimoPago']) ? substr($f['fechaUltimoPago'], 0, 10) : null,
                    ':notas' => $f['notas'] ?? null,
                ]);
            }
        }

        // 16. Movimientos
        if (isset($data['movimientos']) && is_array($data['movimientos'])) {
            $pdo->exec("DELETE FROM movimientos WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO movimientos (id, fecha, tipo, rubro, categoria, concepto, item_comprado, cantidad, contraparte, monto, metodo, nro_documento, conciliado_banco, factura_id, ot_id) VALUES (:id, :fecha, :tipo, :rubro, :categoria, :concepto, :item_comprado, :cantidad, :contraparte, :monto, :metodo, :nro_documento, :conciliado_banco, :factura_id, :ot_id)");
            foreach ($data['movimientos'] as $m) {
                $st->execute([
                    ':id' => $m['id'],
                    ':fecha' => !empty($m['fecha']) ? substr($m['fecha'], 0, 10) : date('Y-m-d'),
                    ':tipo' => $m['tipo'],
                    ':rubro' => $m['rubro'] ?? null,
                    ':categoria' => $m['categoria'],
                    ':concepto' => $m['concepto'],
                    ':item_comprado' => $m['itemComprado'] ?? null,
                    ':cantidad' => $m['cantidad'] ?? null,
                    ':contraparte' => $m['contraparte'] ?? '',
                    ':monto' => $m['monto'],
                    ':metodo' => $m['metodo'] ?? 'TRANSFERENCIA',
                    ':nro_documento' => $m['nroDocumento'] ?? null,
                    ':conciliado_banco' => ($m['conciliadoBanco'] ?? true) ? 1 : 0,
                    ':factura_id' => $m['facturaId'] ?? null,
                    ':ot_id' => $m['otId'] ?? null,
                ]);
            }
        }

        // 17. Inventario
        if (isset($data['inventario']) && is_array($data['inventario'])) {
            $pdo->exec("DELETE FROM inventario WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO inventario (id, codigo, categoria, nombre, marca_modelo, descripcion, stock_actual, en_uso, stock_minimo, unidad, costo_unitario, precio_venta_sugerido, proveedor, fecha_ultima_compra, nro_factura_compra, ubicacion, responsable_id, estado_fisico, tipo_licencia, clave_licencia, cuenta_asociada, fecha_vencimiento_licencia, asignado_a_clientes) VALUES (:id, :codigo, :categoria, :nombre, :marca_modelo, :descripcion, :stock_actual, :en_uso, :stock_minimo, :unidad, :costo_unitario, :precio_venta_sugerido, :proveedor, :fecha_ultima_compra, :nro_factura_compra, :ubicacion, :responsable_id, :estado_fisico, :tipo_licencia, :clave_licencia, :cuenta_asociada, :fecha_vencimiento_licencia, :asignado_a_clientes)");
            foreach ($data['inventario'] as $inv) {
                $st->execute([
                    ':id' => $inv['id'],
                    ':codigo' => $inv['codigo'],
                    ':categoria' => $inv['categoria'],
                    ':nombre' => $inv['nombre'],
                    ':marca_modelo' => $inv['marcaModelo'] ?? null,
                    ':descripcion' => $inv['descripcion'] ?? null,
                    ':stock_actual' => $inv['stockActual'] ?? 1,
                    ':en_uso' => $inv['enUso'] ?? 0,
                    ':stock_minimo' => $inv['stockMinimo'] ?? 1,
                    ':unidad' => $inv['unidad'] ?? 'UN',
                    ':costo_unitario' => $inv['costoUnitario'] ?? 0,
                    ':precio_venta_sugerido' => $inv['precioVentaSugerido'] ?? null,
                    ':proveedor' => $inv['proveedor'] ?? '',
                    ':fecha_ultima_compra' => !empty($inv['fechaUltimaCompra']) ? substr($inv['fechaUltimaCompra'], 0, 10) : null,
                    ':nro_factura_compra' => $inv['nroFacturaCompra'] ?? null,
                    ':ubicacion' => $inv['ubicacion'] ?? 'Taller Central',
                    ':responsable_id' => $inv['responsableId'] ?? null,
                    ':estado_fisico' => $inv['estadoFisico'] ?? null,
                    ':tipo_licencia' => $inv['tipoLicencia'] ?? null,
                    ':clave_licencia' => $inv['claveLicencia'] ?? null,
                    ':cuenta_asociada' => $inv['cuentaAsociada'] ?? null,
                    ':fecha_vencimiento_licencia' => !empty($inv['fechaVencimientoLicencia']) ? substr($inv['fechaVencimientoLicencia'], 0, 10) : null,
                    ':asignado_a_clientes' => isset($inv['asignadoAClientes']) ? json_encode($inv['asignadoAClientes'], JSON_UNESCAPED_UNICODE) : null,
                ]);
            }
        }

        // 18. Proyectos Web
        if (isset($data['proyectosWeb']) && is_array($data['proyectosWeb'])) {
            $pdo->exec("DELETE FROM proyectos_web WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO proyectos_web (id, codigo, empresa_id, usuario_id, cliente_nombre, tipo, nombre_proyecto, descripcion, url_dominio, stack_tecnologico, hosting_proveedor, valor_proyecto, monto_cobrado, estado_cobro, incluye_mantencion_web, plan_mantencion, valor_mantencion, fecha_inicio, fecha_entrega, proxima_mantencion_web, vencimiento_dominio_hosting, estado, responsable_id, participantes_ids, participantes_detalle, personas_externas, modalidad_ejecucion, empresa_externa, notas) VALUES (:id, :codigo, :empresa_id, :usuario_id, :cliente_nombre, :tipo, :nombre_proyecto, :descripcion, :url_dominio, :stack_tecnologico, :hosting_proveedor, :valor_proyecto, :monto_cobrado, :estado_cobro, :incluye_mantencion_web, :plan_mantencion, :valor_mantencion, :fecha_inicio, :fecha_entrega, :proxima_mantencion_web, :vencimiento_dominio_hosting, :estado, :responsable_id, :participantes_ids, :participantes_detalle, :personas_externas, :modalidad_ejecucion, :empresa_externa, :notas)");
            foreach ($data['proyectosWeb'] as $pw) {
                $st->execute([
                    ':id' => $pw['id'],
                    ':codigo' => $pw['codigo'],
                    ':empresa_id' => $pw['empresaId'] ?? null,
                    ':usuario_id' => $pw['usuarioId'] ?? null,
                    ':cliente_nombre' => $pw['clienteNombre'],
                    ':tipo' => $pw['tipo'],
                    ':nombre_proyecto' => $pw['nombreProyecto'],
                    ':descripcion' => $pw['descripcion'] ?? null,
                    ':url_dominio' => $pw['urlDominio'] ?? null,
                    ':stack_tecnologico' => $pw['stackTecnologico'] ?? null,
                    ':hosting_proveedor' => $pw['hostingProveedor'] ?? null,
                    ':valor_proyecto' => $pw['valorProyecto'] ?? 0,
                    ':monto_cobrado' => $pw['montoCobrado'] ?? 0,
                    ':estado_cobro' => $pw['estadoCobro'] ?? 'PAGADO',
                    ':incluye_mantencion_web' => ($pw['incluyeMantencionWeb'] ?? true) ? 1 : 0,
                    ':plan_mantencion' => $pw['planMantencion'] ?? 'MENSUAL',
                    ':valor_mantencion' => $pw['valorMantencion'] ?? 0,
                    ':fecha_inicio' => !empty($pw['fechaInicio']) ? substr($pw['fechaInicio'], 0, 10) : date('Y-m-d'),
                    ':fecha_entrega' => !empty($pw['fechaEntrega']) ? substr($pw['fechaEntrega'], 0, 10) : null,
                    ':proxima_mantencion_web' => !empty($pw['proximaMantencionWeb']) ? substr($pw['proximaMantencionWeb'], 0, 10) : null,
                    ':vencimiento_dominio_hosting' => !empty($pw['vencimientoDominioHosting']) ? substr($pw['vencimientoDominioHosting'], 0, 10) : null,
                    ':estado' => $pw['estado'] ?? 'PRODUCCION_ACTIVO',
                    ':responsable_id' => $pw['responsableId'] ?? 1,
                    ':participantes_ids' => json_encode($pw['participantesIds'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':participantes_detalle' => isset($pw['participantesDetalle']) ? json_encode($pw['participantesDetalle'], JSON_UNESCAPED_UNICODE) : null,
                    ':personas_externas' => isset($pw['personasExternas']) ? json_encode($pw['personasExternas'], JSON_UNESCAPED_UNICODE) : null,
                    ':modalidad_ejecucion' => $pw['modalidadEjecucion'] ?? 'SOLO_PCG',
                    ':empresa_externa' => isset($pw['empresaExterna']) ? json_encode($pw['empresaExterna'], JSON_UNESCAPED_UNICODE) : null,
                    ':notas' => $pw['notas'] ?? null,
                ]);
            }
        }

        // 19. Conexión Bancaria
        if (isset($data['bancoConexion']) && is_array($data['bancoConexion'])) {
            $bc = $data['bancoConexion'];
            $st = $pdo->prepare("INSERT INTO banco_conexion (id, conectado, banco, tipo_cuenta, numero_cuenta, titular, rut_titular, proveedor_api, saldo_actual, ultima_sincronizacion) VALUES (1, :conectado, :banco, :tipo_cuenta, :numero_cuenta, :titular, :rut_titular, :proveedor_api, :saldo_actual, :ultima_sincronizacion) ON DUPLICATE KEY UPDATE conectado = VALUES(conectado), banco = VALUES(banco), tipo_cuenta = VALUES(tipo_cuenta), numero_cuenta = VALUES(numero_cuenta), titular = VALUES(titular), rut_titular = VALUES(rut_titular), proveedor_api = VALUES(proveedor_api), saldo_actual = VALUES(saldo_actual), ultima_sincronizacion = VALUES(ultima_sincronizacion)");
            $st->execute([
                ':conectado' => ($bc['conectado'] ?? true) ? 1 : 0,
                ':banco' => $bc['banco'] ?? 'BancoEstado Empresas',
                ':tipo_cuenta' => $bc['tipoCuenta'] ?? 'Cuenta Corriente',
                ':numero_cuenta' => $bc['numeroCuenta'] ?? '',
                ':titular' => $bc['titular'] ?? '',
                ':rut_titular' => $bc['rutTitular'] ?? '',
                ':proveedor_api' => $bc['proveedorApi'] ?? 'FINTOC_OPEN_BANKING',
                ':saldo_actual' => $bc['saldoActual'] ?? 0,
                ':ultima_sincronizacion' => !empty($bc['ultimaSincronizacion']) ? date('Y-m-d H:i:s', strtotime($bc['ultimaSincronizacion'])) : date('Y-m-d H:i:s'),
            ]);
        }

        // 20. Configuración
        if (isset($data['config']) && is_array($data['config'])) {
            $cfg = $data['config'];
            $st = $pdo->prepare("INSERT INTO configuracion (id, razon_social, giro, rut, telefono, email, cond_pago, cond_plazo, cond_validez_dias, cond_garantia_dias) VALUES (1, :razon_social, :giro, :rut, :telefono, :email, :cond_pago, :cond_plazo, :cond_validez_dias, :cond_garantia_dias) ON DUPLICATE KEY UPDATE razon_social = VALUES(razon_social), giro = VALUES(giro), rut = VALUES(rut), telefono = VALUES(telefono), email = VALUES(email), cond_pago = VALUES(cond_pago), cond_plazo = VALUES(cond_plazo), cond_validez_dias = VALUES(cond_validez_dias), cond_garantia_dias = VALUES(cond_garantia_dias)");
            $st->execute([
                ':razon_social' => $cfg['razonSocial'] ?? 'PCG SPA',
                ':giro' => $cfg['giro'] ?? 'Servicios Informáticos Integrales',
                ':rut' => $cfg['rut'] ?? '77.806.251-8',
                ':telefono' => $cfg['telefono'] ?? '+56 9 4938 4043',
                ':email' => $cfg['email'] ?? 'serviciotecnicopcg@gmail.com',
                ':cond_pago' => $cfg['condPago'] ?? '',
                ':cond_plazo' => $cfg['condPlazo'] ?? '',
                ':cond_validez_dias' => $cfg['condValidezDias'] ?? 21,
                ':cond_garantia_dias' => $cfg['condGarantiaDias'] ?? 30,
            ]);
        }

        // 21. Descuentos
        if (isset($data['descuentos']) && is_array($data['descuentos'])) {
            $pdo->exec("DELETE FROM descuentos WHERE 1=1");
            $st = $pdo->prepare("INSERT INTO descuentos (min_equipos, max_equipos, pct) VALUES (:min_equipos, :max_equipos, :pct)");
            foreach ($data['descuentos'] as $d) {
                $st->execute([
                    ':min_equipos' => $d['min'],
                    ':max_equipos' => $d['max'] ?? null,
                    ':pct' => $d['pct'],
                ]);
            }
        }

        // 22. Secuencias
        if (isset($data['seq']) && is_array($data['seq'])) {
            $st = $pdo->prepare("INSERT INTO secuencias (clave, valor) VALUES (:clave, :valor) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
            foreach ($data['seq'] as $k => $v) {
                $st->execute([':clave' => $k, ':valor' => (int)$v]);
            }
        }

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        $pdo->commit();

        jsonResponse([
            'ok' => true,
            'message' => 'Base de datos sincronizada y persistida en MySQL exitosamente',
            'timestamp' => date('c'),
        ]);
    }

    jsonError('Método HTTP no soportado: ' . $method, 405);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonError('Error en base de datos MySQL: ' . $e->getMessage(), 500, [
        'trace' => $e->getTraceAsString(),
    ]);
}

