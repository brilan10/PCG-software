<?php
/**
 * PCG SPA - Instalador Automático de Base de Datos MySQL / MariaDB (XAMPP)
 * Crea la base de datos pcg_software, ejecuta el schema y carga el 100% de los datos semilla.
 */

declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

$host = '127.0.0.1';
$port = 3306;
$user = 'root';
$pass = '';
$dbname = 'pcg_software';

echo "============================================================\n";
echo " PCG SPA - Instalador de Base de Datos MySQL (XAMPP)\n";
echo "============================================================\n\n";

try {
    echo "1. Conectando a MySQL en {$host}:{$port} con usuario '{$user}'...\n";
    $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "   ✓ Conexión establecida con éxito.\n\n";

    echo "2. Creando base de datos '{$dbname}' si no existe...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    $pdo->exec("USE `{$dbname}`;");
    echo "   ✓ Base de datos '{$dbname}' seleccionada.\n\n";

    $schemaFile = __DIR__ . '/database/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new RuntimeException("No se encontró el archivo de esquema en: {$schemaFile}");
    }

    echo "3. Ejecutando schema.sql...\n";
    $sql = file_get_contents($schemaFile);
    // Ejecutar statements
    $pdo->exec($sql);
    echo "   ✓ Todas las 21 tablas fueron creadas correctamente.\n\n";

    $seedFile = __DIR__ . '/database/seed.json';
    if (!file_exists($seedFile)) {
        throw new RuntimeException("No se encontró el archivo seed.json en: {$seedFile}");
    }

    echo "4. Cargando datos semilla desde seed.json...\n";
    $seedJson = file_get_contents($seedFile);
    $seed = json_decode($seedJson, true);
    if (!is_array($seed)) {
        throw new RuntimeException("Error decodificando seed.json");
    }

    $pdo->beginTransaction();

    // 1. Usuarios
    $stmtUser = $pdo->prepare("
        INSERT INTO usuarios (id, nombre, email, password, rol, rol_etiqueta, cargo, titulo, horas_semanales, color, empresa_id, rut, telefono, activo)
        VALUES (:id, :nombre, :email, :password, :rol, :rol_etiqueta, :cargo, :titulo, :horas_semanales, :color, :empresa_id, :rut, :telefono, :activo)
    ");
    foreach ($seed['usuarios'] ?? [] as $u) {
        $rawPass = $u['password'] ?? 'pcg123';
        $hashedPass = preg_match('/^\$2[ayb]\$.{56}$/', $rawPass) ? $rawPass : password_hash($rawPass, PASSWORD_BCRYPT);
        $stmtUser->execute([
            ':id' => $u['id'],
            ':nombre' => $u['nombre'],
            ':email' => $u['email'],
            ':password' => $hashedPass,
            ':rol' => $u['rol'],
            ':rol_etiqueta' => $u['rolEtiqueta'] ?? null,
            ':cargo' => $u['cargo'] ?? null,
            ':titulo' => $u['titulo'] ?? null,
            ':horas_semanales' => $u['horasSemanales'] ?? 40,
            ':color' => $u['color'] ?? '#10b981',
            ':empresa_id' => $u['empresaId'] ?? null,
            ':rut' => $u['rut'] ?? null,
            ':telefono' => $u['telefono'] ?? null,
            ':activo' => ($u['activo'] ?? true) ? 1 : 0,
        ]);
    }
    echo "   ✓ Usuarios insertados: " . count($seed['usuarios'] ?? []) . "\n";

    // 2. Empresas
    $stmtEmp = $pdo->prepare("
        INSERT INTO empresas (id, razon_social, rut, giro, ciudad, direccion, contacto_id, activo)
        VALUES (:id, :razon_social, :rut, :giro, :ciudad, :direccion, :contacto_id, :activo)
    ");
    foreach ($seed['empresas'] ?? [] as $e) {
        $stmtEmp->execute([
            ':id' => $e['id'],
            ':razon_social' => $e['razonSocial'],
            ':rut' => $e['rut'],
            ':giro' => $e['giro'] ?? null,
            ':ciudad' => $e['ciudad'] ?? 'Santiago',
            ':direccion' => $e['direccion'] ?? null,
            ':contacto_id' => $e['contactoId'] ?? null,
            ':activo' => ($e['activo'] ?? true) ? 1 : 0,
        ]);
    }
    echo "   ✓ Empresas insertadas: " . count($seed['empresas'] ?? []) . "\n";

    // 3. Equipos
    $stmtEq = $pdo->prepare("
        INSERT INTO equipos (id, usuario_id, empresa_id, codigo, tipo, marca, modelo, numero_serie, procesador, ram_gb, almacenamiento, tarjeta_grafica, estado, fecha_ingreso, fecha_ultima_mantencion, proxima_mantencion, notas)
        VALUES (:id, :usuario_id, :empresa_id, :codigo, :tipo, :marca, :modelo, :numero_serie, :procesador, :ram_gb, :almacenamiento, :tarjeta_grafica, :estado, :fecha_ingreso, :fecha_ultima_mantencion, :proxima_mantencion, :notas)
    ");
    foreach ($seed['equipos'] ?? [] as $eq) {
        $stmtEq->execute([
            ':id' => $eq['id'],
            ':usuario_id' => $eq['usuarioId'],
            ':empresa_id' => $eq['empresaId'] ?? null,
            ':codigo' => $eq['codigo'],
            ':tipo' => $eq['tipo'],
            ':marca' => $eq['marca'],
            ':modelo' => $eq['modelo'],
            ':numero_serie' => $eq['numeroSerie'] ?? null,
            ':procesador' => $eq['procesador'] ?? null,
            ':ram_gb' => $eq['ramGb'] ?? 8,
            ':almacenamiento' => $eq['almacenamiento'] ?? null,
            ':tarjeta_grafica' => $eq['tarjetaGrafica'] ?? null,
            ':estado' => $eq['estado'] ?? 'OPERATIVO',
            ':fecha_ingreso' => !empty($eq['fechaIngreso']) ? substr($eq['fechaIngreso'], 0, 10) : null,
            ':fecha_ultima_mantencion' => !empty($eq['fechaUltimaMantencion']) ? substr($eq['fechaUltimaMantencion'], 0, 10) : null,
            ':proxima_mantencion' => !empty($eq['proximaMantencion']) ? substr($eq['proximaMantencion'], 0, 10) : null,
            ':notas' => $eq['notas'] ?? null,
        ]);
    }
    echo "   ✓ Equipos insertados: " . count($seed['equipos'] ?? []) . "\n";

    // 4. Intervenciones
    $stmtInt = $pdo->prepare("
        INSERT INTO intervenciones (id, equipo_id, tecnico_id, fecha, tipo, titulo, detalle, temp_antes, temp_despues, checklist, insumos, garantia_dias, visible_cliente)
        VALUES (:id, :equipo_id, :tecnico_id, :fecha, :tipo, :titulo, :detalle, :temp_antes, :temp_despues, :checklist, :insumos, :garantia_dias, :visible_cliente)
    ");
    foreach ($seed['intervenciones'] ?? [] as $it) {
        $stmtInt->execute([
            ':id' => $it['id'],
            ':equipo_id' => $it['equipoId'],
            ':tecnico_id' => $it['tecnicoId'],
            ':fecha' => !empty($it['fecha']) ? substr($it['fecha'], 0, 10) : date('Y-m-d'),
            ':tipo' => $it['tipo'],
            ':titulo' => $it['titulo'],
            ':detalle' => $it['detalle'] ?? null,
            ':temp_antes' => $it['tempAntes'] ?? null,
            ':temp_despues' => $it['tempDespues'] ?? null,
            ':checklist' => isset($it['checklist']) ? json_encode($it['checklist'], JSON_UNESCAPED_UNICODE) : null,
            ':insumos' => $it['insumos'] ?? null,
            ':garantia_dias' => $it['garantiaDias'] ?? 30,
            ':visible_cliente' => ($it['visibleCliente'] ?? true) ? 1 : 0,
        ]);
    }
    echo "   ✓ Intervenciones insertadas: " . count($seed['intervenciones'] ?? []) . "\n";

    // 5. Tickets
    $stmtTk = $pdo->prepare("
        INSERT INTO tickets (id, codigo, usuario_id, empresa_id, tipo, asunto, descripcion, equipo_ids, cant_equipos, estado, fecha_cita, hora_cita, modalidad, mensajes, creado)
        VALUES (:id, :codigo, :usuario_id, :empresa_id, :tipo, :asunto, :descripcion, :equipo_ids, :cant_equipos, :estado, :fecha_cita, :hora_cita, :modalidad, :mensajes, :creado)
    ");
    foreach ($seed['tickets'] ?? [] as $tk) {
        $stmtTk->execute([
            ':id' => $tk['id'],
            ':codigo' => $tk['codigo'],
            ':usuario_id' => $tk['usuarioId'],
            ':empresa_id' => $tk['empresaId'] ?? null,
            ':tipo' => $tk['tipo'],
            ':asunto' => $tk['asunto'],
            ':descripcion' => $tk['descripcion'] ?? null,
            ':equipo_ids' => json_encode($tk['equipoIds'] ?? [], JSON_UNESCAPED_UNICODE),
            ':cant_equipos' => $tk['cantEquipos'] ?? 1,
            ':estado' => $tk['estado'] ?? 'ABIERTO',
            ':fecha_cita' => !empty($tk['fechaCita']) ? substr($tk['fechaCita'], 0, 10) : null,
            ':hora_cita' => $tk['horaCita'] ?? null,
            ':modalidad' => $tk['modalidad'] ?? null,
            ':mensajes' => json_encode($tk['mensajes'] ?? [], JSON_UNESCAPED_UNICODE),
            ':creado' => !empty($tk['creado']) ? $tk['creado'] : date('Y-m-d H:i:s'),
        ]);
    }
    echo "   ✓ Tickets insertados: " . count($seed['tickets'] ?? []) . "\n";

    // 6. Servicios
    $stmtSrv = $pdo->prepare("
        INSERT INTO servicios (id, codigo, nombre, descripcion, normal, convenio, costo, activo)
        VALUES (:id, :codigo, :nombre, :descripcion, :normal, :convenio, :costo, :activo)
    ");
    foreach ($seed['servicios'] ?? [] as $s) {
        $stmtSrv->execute([
            ':id' => $s['id'],
            ':codigo' => $s['codigo'],
            ':nombre' => $s['nombre'],
            ':descripcion' => $s['descripcion'] ?? null,
            ':normal' => $s['normal'] ?? 0,
            ':convenio' => $s['convenio'] ?? 0,
            ':costo' => $s['costo'] ?? 0,
            ':activo' => ($s['activo'] ?? true) ? 1 : 0,
        ]);
    }
    echo "   ✓ Servicios insertados: " . count($seed['servicios'] ?? []) . "\n";

    // 7. Paquetes
    $stmtPaq = $pdo->prepare("
        INSERT INTO paquetes (id, nombre, sufijo, servicio_ids)
        VALUES (:id, :nombre, :sufijo, :servicio_ids)
    ");
    foreach ($seed['paquetes'] ?? [] as $p) {
        $stmtPaq->execute([
            ':id' => $p['id'],
            ':nombre' => $p['nombre'],
            ':sufijo' => $p['sufijo'],
            ':servicio_ids' => json_encode($p['servicioIds'] ?? [], JSON_UNESCAPED_UNICODE),
        ]);
    }
    echo "   ✓ Paquetes insertados: " . count($seed['paquetes'] ?? []) . "\n";

    // 8. Cotizaciones
    $stmtCot = $pdo->prepare("
        INSERT INTO cotizaciones (id, numero, ticket_id, usuario_id, empresa_id, email_destino, paquete_id, modo, descuento_criterio_pct, descuento_criterio_monto, motivo_descuento, plan_inicio, plan_fin, plan_tecnico_id, items, cant_equipos, subtotal_normal, descuento_monto, total, estado, fecha, valida_hasta)
        VALUES (:id, :numero, :ticket_id, :usuario_id, :empresa_id, :email_destino, :paquete_id, :modo, :descuento_criterio_pct, :descuento_criterio_monto, :motivo_descuento, :plan_inicio, :plan_fin, :plan_tecnico_id, :items, :cant_equipos, :subtotal_normal, :descuento_monto, :total, :estado, :fecha, :valida_hasta)
    ");
    foreach ($seed['cotizaciones'] ?? [] as $c) {
        $stmtCot->execute([
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
        ]);
    }
    echo "   ✓ Cotizaciones insertadas: " . count($seed['cotizaciones'] ?? []) . "\n";

    // 9. OTs
    $stmtOT = $pdo->prepare("
        INSERT INTO ots (id, numero, cotizacion_id, ticket_id, empresa_id, usuario_id, tecnico_lider_id, tipo, prioridad, estado, fecha_inicio, fecha_compromiso, fecha_cierre, cant_equipos, equipo_ids, total, garantia_dias, comentarios)
        VALUES (:id, :numero, :cotizacion_id, :ticket_id, :empresa_id, :usuario_id, :tecnico_lider_id, :tipo, :prioridad, :estado, :fecha_inicio, :fecha_compromiso, :fecha_cierre, :cant_equipos, :equipo_ids, :total, :garantia_dias, :comentarios)
    ");
    foreach ($seed['ots'] ?? [] as $o) {
        $stmtOT->execute([
            ':id' => $o['id'],
            ':numero' => $o['numero'],
            ':cotizacion_id' => $o['cotizacionId'] ?? null,
            ':ticket_id' => $o['ticketId'] ?? null,
            ':empresa_id' => $o['empresaId'] ?? null,
            ':usuario_id' => $o['usuarioId'],
            ':tecnico_lider_id' => $o['tecnicoLiderId'] ?? null,
            ':tipo' => $o['tipo'] ?? 'PREVENTIVO',
            ':prioridad' => $o['prioridad'] ?? 'MEDIA',
            ':estado' => $o['estado'] ?? 'RECIBIDO',
            ':fecha_inicio' => !empty($o['fechaInicio']) ? substr($o['fechaInicio'], 0, 10) : date('Y-m-d'),
            ':fecha_compromiso' => !empty($o['fechaCompromiso']) ? substr($o['fechaCompromiso'], 0, 10) : date('Y-m-d'),
            ':fecha_cierre' => !empty($o['fechaCierre']) ? substr($o['fechaCierre'], 0, 10) : null,
            ':cant_equipos' => $o['cantEquipos'] ?? 1,
            ':equipo_ids' => json_encode($o['equipoIds'] ?? [], JSON_UNESCAPED_UNICODE),
            ':total' => $o['total'] ?? 0,
            ':garantia_dias' => $o['garantiaDias'] ?? 30,
            ':comentarios' => $o['comentarios'] ?? null,
        ]);
    }
    echo "   ✓ Órdenes de Trabajo (OT) insertadas: " . count($seed['ots'] ?? []) . "\n";

    // 10. Tareas
    $stmtTar = $pdo->prepare("
        INSERT INTO tareas (id, ot_id, titulo, descripcion, asignado_id, estado, prioridad, h_est, h_real, inicio, limite, equipo_id, depende_de)
        VALUES (:id, :ot_id, :titulo, :descripcion, :asignado_id, :estado, :prioridad, :h_est, :h_real, :inicio, :limite, :equipo_id, :depende_de)
    ");
    foreach ($seed['tareas'] ?? [] as $t) {
        $stmtTar->execute([
            ':id' => $t['id'],
            ':ot_id' => $t['otId'],
            ':titulo' => $t['titulo'],
            ':descripcion' => $t['descripcion'] ?? null,
            ':asignado_id' => $t['asignadoId'] ?? null,
            ':estado' => $t['estado'] ?? 'PENDIENTE',
            ':prioridad' => $t['prioridad'] ?? 'MEDIA',
            ':h_est' => $t['hEst'] ?? 1.0,
            ':h_real' => $t['hReal'] ?? null,
            ':inicio' => !empty($t['inicio']) ? substr($t['inicio'], 0, 10) : date('Y-m-d'),
            ':limite' => !empty($t['limite']) ? substr($t['limite'], 0, 10) : date('Y-m-d'),
            ':equipo_id' => $t['equipoId'] ?? null,
            ':depende_de' => $t['dependeDe'] ?? null,
        ]);
    }
    echo "   ✓ Tareas del Planner insertadas: " . count($seed['tareas'] ?? []) . "\n";

    // 11. Programas
    $stmtProg = $pdo->prepare("
        INSERT INTO programas (id, empresa_id, frecuencia_meses, proxima_fecha, activo)
        VALUES (:id, :empresa_id, :frecuencia_meses, :proxima_fecha, :activo)
    ");
    foreach ($seed['programas'] ?? [] as $pr) {
        $stmtProg->execute([
            ':id' => $pr['id'],
            ':empresa_id' => $pr['empresaId'],
            ':frecuencia_meses' => $pr['frecuenciaMeses'] ?? 3,
            ':proxima_fecha' => !empty($pr['proximaFecha']) ? substr($pr['proximaFecha'], 0, 10) : date('Y-m-d'),
            ':activo' => ($pr['activo'] ?? true) ? 1 : 0,
        ]);
    }
    echo "   ✓ Programas preventivos insertados: " . count($seed['programas'] ?? []) . "\n";

    // 12. Movimientos Financieros
    $stmtMov = $pdo->prepare("
        INSERT INTO movimientos (id, fecha, tipo, rubro, categoria, concepto, contraparte, monto, metodo, ot_id, cotizacion_id, inventario_id, proyecto_id, factura_nro, comprobante_url, conciliado_banco, notas)
        VALUES (:id, :fecha, :tipo, :rubro, :categoria, :concepto, :contraparte, :monto, :metodo, :ot_id, :cotizacion_id, :inventario_id, :proyecto_id, :factura_nro, :comprobante_url, :conciliado_banco, :notas)
    ");
    foreach ($seed['movimientos'] ?? [] as $m) {
        $stmtMov->execute([
            ':id' => $m['id'],
            ':fecha' => !empty($m['fecha']) ? substr($m['fecha'], 0, 10) : date('Y-m-d'),
            ':tipo' => $m['tipo'],
            ':rubro' => $m['rubro'],
            ':categoria' => $m['categoria'],
            ':concepto' => $m['concepto'],
            ':contraparte' => $m['contraparte'] ?? null,
            ':monto' => $m['monto'],
            ':metodo' => $m['metodo'] ?? 'TRANSFERENCIA',
            ':ot_id' => $m['otId'] ?? null,
            ':cotizacion_id' => $m['cotizacionId'] ?? null,
            ':inventario_id' => $m['inventarioId'] ?? null,
            ':proyecto_id' => $m['proyectoId'] ?? null,
            ':factura_nro' => $m['facturaNro'] ?? null,
            ':comprobante_url' => $m['comprobanteUrl'] ?? null,
            ':conciliado_banco' => ($m['conciliadoBanco'] ?? true) ? 1 : 0,
            ':notas' => $m['notas'] ?? null,
        ]);
    }
    echo "   ✓ Movimientos financieros insertados: " . count($seed['movimientos'] ?? []) . "\n";

    // 13. Facturas
    $stmtFac = $pdo->prepare("
        INSERT INTO facturas (id, numero_folio, tipo_doc, empresa_id, usuario_id, ot_id, cotizacion_id, fecha_emision, fecha_vencimiento, subtotal_neto, iva_monto, total_bruto, estado_sii, estado_pago, pdf_url, notas)
        VALUES (:id, :numero_folio, :tipo_doc, :empresa_id, :usuario_id, :ot_id, :cotizacion_id, :fecha_emision, :fecha_vencimiento, :subtotal_neto, :iva_monto, :total_bruto, :estado_sii, :estado_pago, :pdf_url, :notas)
    ");
    foreach ($seed['facturas'] ?? [] as $f) {
        $stmtFac->execute([
            ':id' => $f['id'],
            ':numero_folio' => $f['numeroFolio'],
            ':tipo_doc' => $f['tipoDoc'],
            ':empresa_id' => $f['empresaId'] ?? null,
            ':usuario_id' => $f['usuarioId'],
            ':ot_id' => $f['otId'] ?? null,
            ':cotizacion_id' => $f['cotizacionId'] ?? null,
            ':fecha_emision' => !empty($f['fechaEmision']) ? substr($f['fechaEmision'], 0, 10) : date('Y-m-d'),
            ':fecha_vencimiento' => !empty($f['fechaVencimiento']) ? substr($f['fechaVencimiento'], 0, 10) : date('Y-m-d'),
            ':subtotal_neto' => $f['subtotalNeto'],
            ':iva_monto' => $f['ivaMonto'],
            ':total_bruto' => $f['totalBruto'],
            ':estado_sii' => $f['estadoSii'] ?? 'ACEPTADO',
            ':estado_pago' => $f['estadoPago'] ?? 'PAGADA',
            ':pdf_url' => $f['pdfUrl'] ?? null,
            ':notas' => $f['notas'] ?? null,
        ]);
    }
    echo "   ✓ Facturas insertadas: " . count($seed['facturas'] ?? []) . "\n";

    // 14. Inventario (Herramientas, Licencias, Repuestos)
    $stmtInv = $pdo->prepare("
        INSERT INTO inventario (id, codigo, tipo, rubro, nombre, descripcion, marca, modelo, categoria, estado, serial_number, licencias_total, licencias_en_uso, licencias_claves, ubicacion, asignado_a_tipo, asignado_a_id, asignado_a_nombre, stock_actual, stock_minimo, costo_compra_clp, precio_venta_clp, fecha_adquisicion, proveedor_nombre, garantia_vence, notas)
        VALUES (:id, :codigo, :tipo, :rubro, :nombre, :descripcion, :marca, :modelo, :categoria, :estado, :serial_number, :licencias_total, :licencias_en_uso, :licencias_claves, :ubicacion, :asignado_a_tipo, :asignado_a_id, :asignado_a_nombre, :stock_actual, :stock_minimo, :costo_compra_clp, :precio_venta_clp, :fecha_adquisicion, :proveedor_nombre, :garantia_vence, :notas)
    ");
    foreach ($seed['inventario'] ?? [] as $inv) {
        $stmtInv->execute([
            ':id' => $inv['id'],
            ':codigo' => $inv['codigo'],
            ':tipo' => $inv['tipo'],
            ':rubro' => $inv['rubro'],
            ':nombre' => $inv['nombre'],
            ':descripcion' => $inv['descripcion'] ?? null,
            ':marca' => $inv['marca'] ?? null,
            ':modelo' => $inv['modelo'] ?? null,
            ':categoria' => $inv['categoria'] ?? null,
            ':estado' => $inv['estado'] ?? 'DISPONIBLE',
            ':serial_number' => $inv['serialNumber'] ?? null,
            ':licencias_total' => $inv['licenciasTotal'] ?? null,
            ':licencias_en_uso' => $inv['licenciasEnUso'] ?? null,
            ':licencias_claves' => isset($inv['licenciasClaves']) ? json_encode($inv['licenciasClaves'], JSON_UNESCAPED_UNICODE) : null,
            ':ubicacion' => $inv['ubicacion'] ?? null,
            ':asignado_a_tipo' => $inv['asignadoATipo'] ?? null,
            ':asignado_a_id' => $inv['asignadoAId'] ?? null,
            ':asignado_a_nombre' => $inv['asignadoANombre'] ?? null,
            ':stock_actual' => $inv['stockActual'] ?? 1,
            ':stock_minimo' => $inv['stockMinimo'] ?? 1,
            ':costo_compra_clp' => $inv['costoCompraCLP'] ?? 0,
            ':precio_venta_clp' => $inv['precioVentaCLP'] ?? 0,
            ':fecha_adquisicion' => !empty($inv['fechaAdquisicion']) ? substr($inv['fechaAdquisicion'], 0, 10) : null,
            ':proveedor_nombre' => $inv['proveedorNombre'] ?? null,
            ':garantia_vence' => !empty($inv['garantiaVence']) ? substr($inv['garantiaVence'], 0, 10) : null,
            ':notas' => $inv['notas'] ?? null,
        ]);
    }
    echo "   ✓ Ítems de inventario y herramientas insertados: " . count($seed['inventario'] ?? []) . "\n";

    // 15. Proyectos Web y Software
    $stmtProy = $pdo->prepare("
        INSERT INTO proyectos_web (id, codigo, empresa_id, usuario_id, cliente_nombre, tipo, nombre_proyecto, descripcion, url_dominio, stack_tecnologico, hosting_proveedor, valor_proyecto, monto_cobrado, estado_cobro, incluye_mantencion_web, plan_mantencion, valor_mantencion, fecha_inicio, fecha_entrega, proxima_mantencion_web, vencimiento_dominio_hosting, estado, responsable_id, participantes_ids, personas_externas, modalidad_ejecucion, empresa_externa, notas)
        VALUES (:id, :codigo, :empresa_id, :usuario_id, :cliente_nombre, :tipo, :nombre_proyecto, :descripcion, :url_dominio, :stack_tecnologico, :hosting_proveedor, :valor_proyecto, :monto_cobrado, :estado_cobro, :incluye_mantencion_web, :plan_mantencion, :valor_mantencion, :fecha_inicio, :fecha_entrega, :proxima_mantencion_web, :vencimiento_dominio_hosting, :estado, :responsable_id, :participantes_ids, :personas_externas, :modalidad_ejecucion, :empresa_externa, :notas)
    ");
    foreach ($seed['proyectosWeb'] ?? [] as $pw) {
        $stmtProy->execute([
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
            ':personas_externas' => isset($pw['personasExternas']) ? json_encode($pw['personasExternas'], JSON_UNESCAPED_UNICODE) : null,
            ':modalidad_ejecucion' => $pw['modalidadEjecucion'] ?? 'SOLO_PCG',
            ':empresa_externa' => isset($pw['empresaExterna']) ? json_encode($pw['empresaExterna'], JSON_UNESCAPED_UNICODE) : null,
            ':notas' => $pw['notas'] ?? null,
        ]);
    }
    echo "   ✓ Proyectos web y software insertados: " . count($seed['proyectosWeb'] ?? []) . "\n";

    // 16. Informes Técnicos
    $stmtInf = $pdo->prepare("
        INSERT INTO informes (id, codigo, ot_id, empresa_id, usuario_id, titulo, fecha, tecnico_id, resumen, equipos_atendidos, recomendaciones)
        VALUES (:id, :codigo, :ot_id, :empresa_id, :usuario_id, :titulo, :fecha, :tecnico_id, :resumen, :equipos_atendidos, :recomendaciones)
    ");
    foreach ($seed['informes'] ?? [] as $inf) {
        $stmtInf->execute([
            ':id' => $inf['id'],
            ':codigo' => $inf['codigo'],
            ':ot_id' => $inf['otId'],
            ':empresa_id' => $inf['empresaId'] ?? null,
            ':usuario_id' => $inf['usuarioId'],
            ':titulo' => $inf['titulo'],
            ':fecha' => !empty($inf['fecha']) ? substr($inf['fecha'], 0, 10) : date('Y-m-d'),
            ':tecnico_id' => $inf['tecnicoId'],
            ':resumen' => $inf['resumen'] ?? null,
            ':equipos_atendidos' => json_encode($inf['equiposAtendidos'] ?? [], JSON_UNESCAPED_UNICODE),
            ':recomendaciones' => $inf['recomendaciones'] ?? null,
        ]);
    }
    echo "   ✓ Informes técnicos insertados: " . count($seed['informes'] ?? []) . "\n";

    // 17. Banco Conexión
    if (!empty($seed['bancoConexion'])) {
        $bc = $seed['bancoConexion'];
        $stmtBc = $pdo->prepare("
            INSERT INTO banco_conexion (id, conectado, banco, numero_cuenta, saldo_actual, ultima_sincronizacion)
            VALUES (1, :conectado, :banco, :numero_cuenta, :saldo_actual, :ultima_sincronizacion)
            ON DUPLICATE KEY UPDATE conectado = VALUES(conectado), banco = VALUES(banco), numero_cuenta = VALUES(numero_cuenta), saldo_actual = VALUES(saldo_actual), ultima_sincronizacion = VALUES(ultima_sincronizacion)
        ");
        $stmtBc->execute([
            ':conectado' => ($bc['conectado'] ?? true) ? 1 : 0,
            ':banco' => $bc['banco'] ?? 'BancoEstado Empresas',
            ':numero_cuenta' => $bc['numeroCuenta'] ?? '00-078-91234-0',
            ':saldo_actual' => $bc['saldoActual'] ?? 4820000,
            ':ultima_sincronizacion' => $bc['ultimaSincronizacion'] ?? date('Y-m-d H:i:s'),
        ]);
        echo "   ✓ Conexión bancaria inicializada.\n";
    }

    // 18. Configuración
    if (!empty($seed['config'])) {
        $cfg = $seed['config'];
        $stmtCfg = $pdo->prepare("
            INSERT INTO configuracion (id, razon_social, rut, giro, direccion, ciudad, telefono, email, cond_pago, cond_plazo, cond_validez_dias, cond_garantia_dias, banco_datos)
            VALUES (1, :razon_social, :rut, :giro, :direccion, :ciudad, :telefono, :email, :cond_pago, :cond_plazo, :cond_validez_dias, :cond_garantia_dias, :banco_datos)
            ON DUPLICATE KEY UPDATE razon_social = VALUES(razon_social), rut = VALUES(rut), giro = VALUES(giro), direccion = VALUES(direccion), ciudad = VALUES(ciudad), telefono = VALUES(telefono), email = VALUES(email), cond_pago = VALUES(cond_pago), cond_plazo = VALUES(cond_plazo), cond_validez_dias = VALUES(cond_validez_dias), cond_garantia_dias = VALUES(cond_garantia_dias), banco_datos = VALUES(banco_datos)
        ");
        $stmtCfg->execute([
            ':razon_social' => $cfg['razonSocial'] ?? 'PCG SPA',
            ':rut' => $cfg['rut'] ?? '77.806.251-8',
            ':giro' => $cfg['giro'] ?? 'Servicios TI',
            ':direccion' => $cfg['direccion'] ?? 'Av. Providencia 1208, Of. 602',
            ':ciudad' => $cfg['ciudad'] ?? 'Santiago',
            ':telefono' => $cfg['telefono'] ?? '+56 9 4938 4043',
            ':email' => $cfg['email'] ?? 'serviciotecnicopcg@gmail.com',
            ':cond_pago' => $cfg['condPago'] ?? '',
            ':cond_plazo' => $cfg['condPlazo'] ?? '',
            ':cond_validez_dias' => $cfg['condValidezDias'] ?? 21,
            ':cond_garantia_dias' => $cfg['condGarantiaDias'] ?? 30,
            ':banco_datos' => isset($cfg['banco']) ? json_encode($cfg['banco'], JSON_UNESCAPED_UNICODE) : null,
        ]);
        echo "   ✓ Configuración corporativa PCG SPA guardada.\n";
    }

    // 19. Descuentos por volumen
    $stmtDesc = $pdo->prepare("
        INSERT INTO descuentos (id, min_equipos, max_equipos, pct)
        VALUES (:id, :min_equipos, :max_equipos, :pct)
    ");
    foreach ($seed['descuentos'] ?? [] as $d) {
        $stmtDesc->execute([
            ':id' => $d['id'],
            ':min_equipos' => $d['minEquipos'],
            ':max_equipos' => $d['maxEquipos'],
            ':pct' => $d['pct'],
        ]);
    }
    echo "   ✓ Tabla de descuentos por volumen insertada.\n";

    // 20. Secuencias
    $stmtSeq = $pdo->prepare("
        INSERT INTO secuencias (clave, valor)
        VALUES (:clave, :valor)
        ON DUPLICATE KEY UPDATE valor = VALUES(valor)
    ");
    foreach ($seed['seq'] ?? [] as $k => $v) {
        $stmtSeq->execute([':clave' => $k, ':valor' => $v]);
    }
    echo "   ✓ Secuencias correlativas (OT, COT, TCK) sincronizadas.\n";

    // 21. Correos
    $stmtMail = $pdo->prepare("
        INSERT INTO correos (id, tipo, de, para, cc, asunto, cuerpo, fecha)
        VALUES (:id, :tipo, :de, :para, :cc, :asunto, :cuerpo, :fecha)
    ");
    foreach ($seed['correos'] ?? [] as $cor) {
        $stmtMail->execute([
            ':id' => $cor['id'],
            ':tipo' => $cor['tipo'],
            ':de' => $cor['de'],
            ':para' => $cor['para'],
            ':cc' => $cor['cc'] ?? null,
            ':asunto' => $cor['asunto'],
            ':cuerpo' => $cor['cuerpo'],
            ':fecha' => $cor['fecha'] ?? date('Y-m-d H:i:s'),
        ]);
    }
    echo "   ✓ Historial de correos insertado: " . count($seed['correos'] ?? []) . "\n";

    $pdo->commit();

    echo "\n============================================================\n";
    echo " ¡INSTALACIÓN COMPLETADA EXITOSAMENTE AL 100% EN XAMPP!\n";
    echo " Base de datos: {$dbname} en MySQL localhost:{$port}\n";
    echo "============================================================\n";

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n❌ ERROR EN LA INSTALACIÓN:\n" . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

