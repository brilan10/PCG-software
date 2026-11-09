-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: pcg_software
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alertas_enviadas`
--

DROP TABLE IF EXISTS `alertas_enviadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alertas_enviadas` (
  `clave` varchar(100) NOT NULL,
  `estado` varchar(50) NOT NULL,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alertas_enviadas`
--

LOCK TABLES `alertas_enviadas` WRITE;
/*!40000 ALTER TABLE `alertas_enviadas` DISABLE KEYS */;
/*!40000 ALTER TABLE `alertas_enviadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banco_conexion`
--

DROP TABLE IF EXISTS `banco_conexion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banco_conexion` (
  `id` int(11) NOT NULL DEFAULT 1,
  `conectado` tinyint(1) DEFAULT 1,
  `banco` varchar(150) NOT NULL,
  `tipo_cuenta` varchar(100) DEFAULT NULL,
  `numero_cuenta` varchar(100) DEFAULT NULL,
  `titular` varchar(150) DEFAULT NULL,
  `rut_titular` varchar(50) DEFAULT NULL,
  `proveedor_api` varchar(100) DEFAULT 'FINTOC_OPEN_BANKING',
  `saldo_actual` bigint(20) DEFAULT 0,
  `ultima_sincronizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banco_conexion`
--

LOCK TABLES `banco_conexion` WRITE;
/*!40000 ALTER TABLE `banco_conexion` DISABLE KEYS */;
INSERT INTO `banco_conexion` VALUES (1,1,'BancoEstado Empresas / Cuenta Corriente','Cuenta Corriente Empresa (Solo Lectura)','•••• •••• 4829-1','PCG SPA','77.806.251-8','FINTOC_OPEN_BANKING',4820000,'2026-11-09 00:00:00');
/*!40000 ALTER TABLE `banco_conexion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion` (
  `id` int(11) NOT NULL DEFAULT 1,
  `razon_social` varchar(200) NOT NULL,
  `giro` varchar(255) DEFAULT NULL,
  `rut` varchar(20) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `cond_pago` text DEFAULT NULL,
  `cond_plazo` text DEFAULT NULL,
  `cond_validez_dias` int(11) DEFAULT 21,
  `cond_garantia_dias` int(11) DEFAULT 30,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion`
--

LOCK TABLES `configuracion` WRITE;
/*!40000 ALTER TABLE `configuracion` DISABLE KEYS */;
INSERT INTO `configuracion` VALUES (1,'PCG SPA','Servicios TI, Soporte, Mantenimiento de Equipos & Diseño de Logos y Tarjetas de Presentación','77.806.251-8','+56 9 4938 4043','serviciotecnicopcg@gmail.com','30 días crédito - Sincronizado con MySQL','1 a 2 jornadas hábiles coordinadas según disponibilidad',21,30);
/*!40000 ALTER TABLE `configuracion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correos`
--

DROP TABLE IF EXISTS `correos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `correos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) NOT NULL,
  `de` varchar(150) DEFAULT NULL,
  `para` varchar(150) NOT NULL,
  `cc` varchar(150) DEFAULT NULL,
  `asunto` varchar(255) NOT NULL,
  `cuerpo` text NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correos`
--

LOCK TABLES `correos` WRITE;
/*!40000 ALTER TABLE `correos` DISABLE KEYS */;
INSERT INTO `correos` VALUES (1,'COTIZACION','PCG SPA <serviciotecnicopcg@gmail.com>','carolina@constructoraandes.cl','serviciotecnicopcg@gmail.com','Cotización Oficial COT-2026-001-CORP — Constructora Andes SpA | PCG SPA','Estimada Carolina Reyes (Constructora Andes SpA),\n\nDesde el correo oficial de PCG SPA (serviciotecnicopcg@gmail.com), adjuntamos la cotización formal COT-2026-001-CORP para 9 equipos por un total final de $765.000 (ahorro aplicado de $405.000).\n\nAtentamente,\nPCG SPA · serviciotecnicopcg@gmail.com','2026-11-07 13:45:51'),(2,'COTIZACION','PCG SPA <serviciotecnicopcg@gmail.com>','rvaldes@pacificosur.cl, finanzas@pacificosur.cl','serviciotecnicopcg@gmail.com','Cotización Oficial COT-2026-002-SUPER — Logística y Transporte Pacífico Sur S.A. | PCG SPA','Estimado Rodrigo Valdés,\n\nAdjuntamos la cotización COT-2026-002-SUPER con descuento alianza logística por $459.000.\n\nAtentamente,\nPCG SPA · serviciotecnicopcg@gmail.com','2026-11-04 13:45:51'),(3,'ALERTA_PREVENTIVA','PCG SPA <serviciotecnicopcg@gmail.com>','fsoto@agrovallecentral.cl, planta@agrovallecentral.cl','serviciotecnicopcg@gmail.com','🔔 Aviso Preventivo (-7 días): 2 equipo(s) de Agroexportadora Valle Central SpA | PCG SPA','Estimados Agroexportadora Valle Central SpA,\n\nEl Servidor Dell PowerEdge T350 (AVC-035) y el equipo de Romana (AVC-036) se encuentran próximos a su mantención preventiva antes de temporada.\n\nAtentamente,\nPCG SPA · serviciotecnicopcg@gmail.com','2026-11-08 13:45:51');
/*!40000 ALTER TABLE `correos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizaciones`
--

DROP TABLE IF EXISTS `cotizaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cotizaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) NOT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `email_destino` varchar(150) DEFAULT NULL,
  `paquete_id` int(11) DEFAULT NULL,
  `modo` varchar(50) DEFAULT 'CONVENIO',
  `descuento_criterio_pct` decimal(5,2) DEFAULT 0.00,
  `descuento_criterio_monto` bigint(20) DEFAULT 0,
  `motivo_descuento` varchar(255) DEFAULT NULL,
  `plan_inicio` date DEFAULT NULL,
  `plan_fin` date DEFAULT NULL,
  `plan_tecnico_id` int(11) DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `cant_equipos` int(11) DEFAULT 1,
  `subtotal_normal` bigint(20) NOT NULL,
  `descuento_monto` bigint(20) DEFAULT 0,
  `total` bigint(20) NOT NULL,
  `estado` varchar(50) DEFAULT 'BORRADOR',
  `fecha` date NOT NULL,
  `valida_hasta` date NOT NULL,
  `ot_id` int(11) DEFAULT NULL,
  `emitida_por` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `idx_cot_numero` (`numero`),
  KEY `idx_cot_ticket` (`ticket_id`),
  KEY `idx_cot_empresa` (`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizaciones`
--

LOCK TABLES `cotizaciones` WRITE;
/*!40000 ALTER TABLE `cotizaciones` DISABLE KEYS */;
INSERT INTO `cotizaciones` VALUES (1,'COT-2026-001-CORP',2,5,1,'carolina@constructoraandes.cl',1,'CONVENIO',0.00,0,NULL,'2026-11-11','2026-11-14',4,'[{\"servicioId\":1,\"descripcion\":\"Mantención Preventiva de Hardware de PC\\nDesarme completo, limpieza profunda ultrasónica\\/aire, lubricación de ventiladores y pasta térmica premium certificada.\",\"cantidad\":9,\"normal\":45000,\"convenio\":40000},{\"servicioId\":2,\"descripcion\":\"Instalación de Windows + Office + Optimización Avanzada\\nFormateo profesional, activación correcta, configuración de rendimiento corporativo y afinamiento de arranque.\",\"cantidad\":9,\"normal\":50000,\"convenio\":45000},{\"servicioId\":4,\"descripcion\":\"Actualización Integral de Drivers y Programas Base\\nDrivers oficiales y programas base para todo el parque. 100% bonificado en convenio.\",\"cantidad\":9,\"normal\":35000,\"convenio\":0}]',9,1170000,405000,765000,'ENVIADA','2026-11-07','2026-11-28',NULL,2),(2,'COT-2026-002-SUPER',3,8,3,'rvaldes@pacificosur.cl, finanzas@pacificosur.cl',3,'CONVENIO',10.00,0,'Descuento alianza logística anual','2026-11-08','2026-11-12',3,'[{\"servicioId\":1,\"descripcion\":\"Mantención Preventiva de Hardware de PC\\nDesarme completo, limpieza profunda ultrasónica\\/aire, lubricación de ventiladores y pasta térmica premium certificada.\",\"cantidad\":6,\"normal\":45000,\"convenio\":40000},{\"servicioId\":2,\"descripcion\":\"Instalación de Windows + Office + Optimización Avanzada\\nFormateo profesional, activación correcta, configuración de rendimiento corporativo y afinamiento de arranque.\",\"cantidad\":6,\"normal\":50000,\"convenio\":45000},{\"servicioId\":4,\"descripcion\":\"Actualización Integral de Drivers y Programas Base\\nDrivers oficiales y programas base para todo el parque. 100% bonificado en convenio.\",\"cantidad\":6,\"normal\":35000,\"convenio\":0}]',6,780000,321000,459000,'ACEPTADA','2026-11-04','2026-11-25',5,1),(3,'COT-2026-003-MANT-AVAST',5,11,6,'fsoto@agrovallecentral.cl',2,'VOLUMEN',0.00,0,NULL,'2026-11-13','2026-11-16',4,'[{\"servicioId\":1,\"descripcion\":\"Mantención Preventiva de Hardware de PC\\nDesarme completo, limpieza profunda ultrasónica\\/aire, lubricación de ventiladores y pasta térmica premium certificada.\",\"cantidad\":5,\"normal\":45000,\"convenio\":40000},{\"servicioId\":2,\"descripcion\":\"Instalación de Windows + Office + Optimización Avanzada\\nFormateo profesional, activación correcta, configuración de rendimiento corporativo y afinamiento de arranque.\",\"cantidad\":5,\"normal\":50000,\"convenio\":45000},{\"servicioId\":4,\"descripcion\":\"Actualización Integral de Drivers y Programas Base\\nDrivers oficiales y programas base para todo el parque. 100% bonificado en convenio.\",\"cantidad\":5,\"normal\":35000,\"convenio\":0}]',5,650000,162500,487500,'ENVIADA','2026-11-08','2026-11-29',NULL,2);
/*!40000 ALTER TABLE `cotizaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `descuentos`
--

DROP TABLE IF EXISTS `descuentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `descuentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `min_equipos` int(11) NOT NULL,
  `max_equipos` int(11) DEFAULT NULL,
  `pct` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `descuentos`
--

LOCK TABLES `descuentos` WRITE;
/*!40000 ALTER TABLE `descuentos` DISABLE KEYS */;
INSERT INTO `descuentos` VALUES (13,1,2,0),(14,3,5,25),(15,6,NULL,25);
/*!40000 ALTER TABLE `descuentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `razon_social` varchar(200) NOT NULL,
  `rut` varchar(20) NOT NULL,
  `giro` varchar(200) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT 'Santiago',
  `direccion` varchar(255) DEFAULT NULL,
  `contacto_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rut` (`rut`),
  KEY `idx_empresas_rut` (`rut`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,'Constructora Andes SpA','76.123.456-7','Construcción e Ingeniería Civil','Santiago','Av. Providencia 1234, Of. 601',5,1,'2026-11-09 14:07:44'),(2,'Clínica Dental Sonrisa Ltda.','77.987.654-3','Servicios Odontológicos y Radiología','Valparaíso','Calle Condell 456, Piso 2',7,1,'2026-11-09 14:07:44'),(3,'Logística y Transporte Pacífico Sur S.A.','76.540.880-2','Transporte de Carga y Bodegaje','San Antonio','Ruta 78 Km 104, Parque Industrial',8,1,'2026-11-09 14:07:44'),(4,'Estudio Jurídico Vergara & Asociados SpA','78.210.430-9','Asesorías Legales y Tributarias','Las Condes, Santiago','Av. Apoquindo 4700, Piso 11',9,1,'2026-11-09 14:07:44'),(5,'Colegio Técnico San Agustín','65.120.990-K','Educación Técnico Profesional','Viña del Mar','Av. Libertad 890',10,1,'2026-11-09 14:07:44'),(6,'Agroexportadora Valle Central SpA','76.890.310-4','Packing y Exportación Frutícola','Rancagua','Camino Longitudinal Sur Km 85',11,1,'2026-11-09 14:07:44');
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipos`
--

DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `area` varchar(100) DEFAULT NULL,
  `tipo` varchar(50) NOT NULL,
  `marca` varchar(100) NOT NULL,
  `modelo` varchar(150) NOT NULL,
  `serie` varchar(100) DEFAULT NULL,
  `cpu` varchar(150) DEFAULT NULL,
  `ram_gb` int(11) DEFAULT 8,
  `disipacion` varchar(50) DEFAULT 'AIRE',
  `gpu` varchar(150) DEFAULT NULL,
  `ultima_mantencion` date DEFAULT NULL,
  `proxima_mantencion` date DEFAULT NULL,
  `ubicacion` varchar(50) DEFAULT 'EN_PODER_CLIENTE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_equipos_codigo` (`codigo`),
  KEY `idx_equipos_empresa` (`empresa_id`),
  KEY `idx_equipos_usuario` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipos`
--

LOCK TABLES `equipos` WRITE;
/*!40000 ALTER TABLE `equipos` DISABLE KEYS */;
INSERT INTO `equipos` VALUES (1,1,5,'CAN-001','Administraci?n','DESKTOP','HP','ProDesk 400 G7','SN10037','Intel i5-10500',16,'STOCK','Integrada','2026-05-16','2026-11-14','EN_PODER_CLIENTE'),(2,1,5,'CAN-002','Administración','DESKTOP','HP','ProDesk 400 G7','SN10074','Intel i5-10500',16,'STOCK','Integrada','2026-05-16','2026-11-14','EN_PODER_CLIENTE'),(3,1,5,'CAN-003','Contabilidad','LAPTOP','Lenovo','ThinkPad E14','SN10111','Intel i7-1165G7',16,'STOCK','Integrada','2026-05-16','2026-11-14','EN_PODER_CLIENTE'),(4,1,5,'CAN-004','Gerencia','DESKTOP','Dell','OptiPlex 7090','SN10148','Intel i7-10700',32,'AIRE','NVIDIA T400','2026-05-31','2026-11-29','EN_PODER_CLIENTE'),(5,1,5,'CAN-005','Ventas','LAPTOP','Asus','VivoBook 15','SN10185','AMD Ryzen 5 5500U',8,'STOCK','Integrada','2026-05-31','2026-11-29','EN_PODER_CLIENTE'),(6,1,5,'CAN-006','RRHH','DESKTOP','Lenovo','ThinkCentre M70','SN10222','Intel i3-10100',8,'STOCK','Integrada','2026-09-08','2027-03-09','EN_PODER_CLIENTE'),(7,1,5,'CAN-007','Proyectos BIM','DESKTOP','Armado','Workstation PCG','SN10259','AMD Ryzen 7 5800X',32,'LIQUIDA','RTX 3060','2026-09-08','2027-03-09','EN_PODER_CLIENTE'),(8,1,5,'CAN-008','Adquisiciones','LAPTOP','HP','ProBook 450','SN10296','Intel i5-1135G7',16,'STOCK','Integrada','2026-09-08','2027-03-09','EN_PODER_CLIENTE'),(9,1,5,'CAN-009','Recepción','DESKTOP','Acer','Veriton X','SN10333','Intel i3-9100',8,'STOCK','Integrada','2026-09-08','2027-03-09','EN_PODER_CLIENTE'),(10,2,7,'CDS-010','Recepción clínica','DESKTOP','Dell','Vostro 3888','SN10370','Intel i3-10100',8,'STOCK','Integrada','2026-05-08','2026-11-06','EN_PODER_CLIENTE'),(11,2,7,'CDS-011','Box Radiología 1','DESKTOP','HP','ProDesk 400 G6','SN10407','Intel i5-9500',16,'STOCK','Integrada','2026-05-14','2026-11-12','EN_PODER_CLIENTE'),(12,2,7,'CDS-012','Dirección Médica','LAPTOP','Lenovo','IdeaPad 3','SN10444','Intel i5-1035G1',8,'STOCK','Integrada','2026-05-15','2026-11-13','EN_PODER_CLIENTE'),(13,NULL,6,'PRT-013','Personal','LAPTOP','Asus','TUF Gaming F15','SN10481','Intel i5-11400H',8,'STOCK','GTX 1650',NULL,NULL,'EN_PODER_CLIENTE'),(14,1,5,'CAN-014','Sala de Servidores','SERVIDOR','Dell','PowerEdge T150','SN10518','Intel Xeon E-2314',64,'AIRE','RAID 1 NVMe 2TB','2026-05-17','2026-11-15','EN_PODER_CLIENTE'),(15,1,5,'CAN-015','Oficina Central','IMPRESORA','Brother','MFC-L8900CDW','SN10555','Láser Color Multifuncional',0,'STOCK','Red Gigabit / Wi-Fi / Dúplex','2026-08-09','2027-02-07','EN_PODER_CLIENTE'),(16,1,5,'CAN-016','Acceso Principal y Bodega','CAMARA','Hikvision','Kit NVR 8CH + Domo 4MP IP','SN10592','PoE IR 30m H.265+',0,'STOCK','Disco WD Purple 4TB','2026-10-08','2027-04-08','EN_PODER_CLIENTE'),(17,1,5,'CAN-017','Rack Comunicaciones','RED','Ubiquiti','UniFi Switch 24 PoE','SN10629','24 Puertos GbE + 2 SFP',0,'STOCK','VLAN Corporativa','2026-11-07','2027-05-08','EN_PODER_CLIENTE'),(18,1,5,'CAN-018','Rack Comunicaciones','UPS','APC','Smart-UPS 1500VA','SN10666','Respaldo Online 1500VA',0,'STOCK','Batería AGM sellada','2026-11-07','2027-05-08','EN_PODER_CLIENTE'),(19,2,7,'CDS-019','Recepción clínica','IMPRESORA','Epson','EcoTank L3250','SN10703','Sistema Continuo Tinta',0,'STOCK','Wi-Fi Direct / USB','2026-06-25','2026-12-24','EN_PODER_CLIENTE'),(20,2,7,'CDS-020','Sala de espera y acceso','CAMARA','Dahua','IPC-HDW2431T 4MP','SN10740','IP PoE WDR Micrófono',0,'STOCK','Grabación NVR 2TB','2026-07-10','2027-01-08','EN_PODER_CLIENTE'),(21,2,7,'CDS-021','Servidor Fichas Clínicas','SERVIDOR','HPE','ProLiant MicroServer Gen10+','SN10777','Intel Xeon E-2224',32,'AIRE','RAID 1 SSD 1TB','2026-05-13','2026-11-11','EN_PODER_CLIENTE'),(22,3,8,'LPS-022','Centro Control Flota','SERVIDOR','Dell','PowerEdge R250 Rack','SN10814','Intel Xeon E-2334',64,'AIRE','RAID 10 SAS 4TB','2026-05-15','2026-11-13','EN_PODER_CLIENTE'),(23,3,8,'LPS-023','Despacho Aduana','DESKTOP','Lenovo','ThinkCentre Neo 50s','SN10851','Intel i5-12400',16,'STOCK','Integrada','2026-05-17','2026-11-15','EN_PODER_CLIENTE'),(24,3,8,'LPS-024','Supervisión Puerto','LAPTOP','Dell','Latitude 5430 Rugged','SN10888','Intel i7-1255U',16,'STOCK','Integrada','2026-05-10','2026-11-08','EN_PODER_CLIENTE'),(25,3,8,'LPS-025','Bodega Etiquetado','IMPRESORA','Zebra','ZT230 Industrial','SN10925','Térmica Transferencia Red',0,'STOCK','Ethernet / Etiquetas Código Barras','2026-05-26','2026-11-24','EN_PODER_CLIENTE'),(26,3,8,'LPS-026','Perímetro Patio Camiones','CAMARA','Hikvision','PTZ AcuSense 4MP Zoom 25x','SN10962','IP PoE+ IR 100m',0,'STOCK','NVR 16CH 8TB','2026-06-15','2026-12-14','EN_PODER_CLIENTE'),(27,3,8,'LPS-027','Rack Sala Control','UPS','APC','Smart-UPS 3000VA Rack','SN10999','Online Doble Conversión',0,'STOCK','Pack Baterías RBC','2026-05-18','2026-11-16','EN_PODER_CLIENTE'),(28,4,9,'EJV-028','Socio Principal','LAPTOP','Lenovo','ThinkPad X1 Carbon Gen 10','SN11036','Intel i7-1260P',16,'STOCK','Iris Xe','2026-05-14','2026-11-12','EN_PODER_CLIENTE'),(29,4,9,'EJV-029','Área Litigios','LAPTOP','HP','EliteBook 840 G8','SN11073','Intel i5-1145G7',16,'STOCK','Integrada','2026-05-29','2026-11-27','EN_PODER_CLIENTE'),(30,4,9,'EJV-030','Secretaría Notarial','IMPRESORA','HP','LaserJet Enterprise M428fdw','SN11110','Láser Monocromática Dúplex',0,'STOCK','Red Gigabit / ADF Escáner','2026-05-16','2026-11-14','EN_PODER_CLIENTE'),(31,4,9,'EJV-031','Bóveda Documental','SERVIDOR','Synology','DiskStation DS923+ NAS','SN11147','AMD Ryzen Embedded R1600',16,'AIRE','4x 4TB WD Red Pro RAID 5','2026-06-20','2026-12-19','EN_PODER_CLIENTE'),(32,5,10,'CSA-032','Laboratorio Computación 1','DESKTOP','HP','ProOne 440 All-in-One','SN11184','Intel i5-11500T',16,'STOCK','Integrada','2026-05-25','2026-11-23','EN_PODER_CLIENTE'),(33,5,10,'CSA-033','Sala Profesores','IMPRESORA','Ricoh','IM 430F Multifuncional','SN11221','Láser 43 ppm Red',0,'STOCK','Bandeja Alta Capacidad','2026-06-10','2026-12-09','EN_PODER_CLIENTE'),(34,5,10,'CSA-034','Rack Enlaces Mineduc','RED','Cisco','Catalyst 1000-24P PoE','SN11258','24 Puertos GbE PoE 195W',0,'STOCK','VLAN / Firewall Educacional','2026-07-30','2027-01-28','EN_PODER_CLIENTE'),(35,6,11,'AVC-035','Control Frigorífico Packing','SERVIDOR','Dell','PowerEdge T350','SN11295','Intel Xeon E-2336',64,'AIRE','RAID 1 NVMe + Sensores Temperatura','2026-05-13','2026-11-11','EN_PODER_CLIENTE'),(36,6,11,'AVC-036','Romana Camiones','DESKTOP','Lenovo','ThinkCentre M75q Tiny','SN11332','AMD Ryzen 5 Pro 5650GE',16,'STOCK','Integrada','2026-05-16','2026-11-14','EN_PODER_CLIENTE'),(37,6,11,'AVC-037','Cámaras Línea Selección','CAMARA','Dahua','NVR 16CH + 12 Bullet 4MP IP67','SN11369','PoE Exterior Antivandálica',0,'STOCK','2x Disco WD Purple 6TB','2026-06-08','2026-12-07','EN_PODER_CLIENTE');
/*!40000 ALTER TABLE `equipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `folio` varchar(50) NOT NULL,
  `direccion` varchar(50) NOT NULL,
  `tipo_doc` varchar(50) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `ot_id` int(11) DEFAULT NULL,
  `cotizacion_id` int(11) DEFAULT NULL,
  `contraparte_nombre` varchar(200) NOT NULL,
  `contraparte_rut` varchar(50) NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `monto_neto` bigint(20) NOT NULL,
  `monto_iva` bigint(20) NOT NULL,
  `monto_total` bigint(20) NOT NULL,
  `monto_pagado` bigint(20) DEFAULT 0,
  `estado` varchar(50) DEFAULT 'PENDIENTE',
  `metodo_pago` varchar(50) DEFAULT NULL,
  `fecha_ultimo_pago` date DEFAULT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_facturas_folio` (`folio`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (1,'FAC-1038','POR_COBRAR','FACTURA_AFECTA',1,NULL,1,NULL,'Constructora Andes SpA','76.123.456-7','Mantención preventiva — Administración y Contabilidad (OT PCG-8921)','Mantención B2B','2026-10-28','2026-11-07',214286,40714,255000,255000,'PAGADA','TRANSFERENCIA','2026-11-06','Transferencia recibida en cuenta corriente BCI PCG SPA.'),(2,'FAC-1041','POR_COBRAR','FACTURA_AFECTA',1,NULL,NULL,1,'Constructora Andes SpA','76.123.456-7','Convenio corporativo parque 9 equipos (COT-001-CORP · 50% anticipo pagado)','Convenio Corporativo','2026-11-05','2026-11-21',642857,122143,765000,382500,'ABONADA','TRANSFERENCIA','2026-11-06','Cliente abonó el 50% inicial ($382.500). Saldo $382.500 contra entrega conforme.'),(3,'FAC-1042','POR_COBRAR','FACTURA_AFECTA',2,NULL,NULL,NULL,'Clínica Dental Sonrisa Ltda.','77.987.654-3','Mantención Impresora Epson EcoTank + Configuración Cámara CCTV Dahua IP','Soporte & CCTV','2026-10-22','2026-11-06',155462,29538,185000,0,'PENDIENTE',NULL,NULL,'Factura vencida hace 3 días. Contactar a Andrés Lagos para gestión de pago.'),(4,'BOL-3019','POR_COBRAR','BOLETA',NULL,6,2,NULL,'Pedro Muñoz (Cliente Particular)','12.345.678-5','Upgrade de RAM 16GB y SSD NVMe — Laptop Asus TUF Gaming (OT PCG-8922)','Upgrade Hardware','2026-11-07','2026-11-14',79832,15168,95000,30000,'ABONADA','TRANSFERENCIA','2026-11-07','Abono inicial de repuestos ($30.000). Saldo $65.000 al retirar equipo.'),(5,'FAC-1039','POR_COBRAR','FACTURA_AFECTA',1,NULL,3,NULL,'Constructora Andes SpA','76.123.456-7','Reparación urgente de fuente de poder 600W — Gerencia (OT PCG-8923)','Reparación Hardware','2026-11-02','2026-11-16',50420,9580,60000,60000,'PAGADA','TRANSFERENCIA','2026-11-08',NULL),(6,'PROV-88412','POR_PAGAR','PROVEEDOR',NULL,NULL,NULL,NULL,'Tecnoglobal S.A.','96.543.210-K','Compra lote 6 SSD NVMe Kingston 1TB + 4 módulos RAM DDR4 16GB 3200MHz','Repuestos y Hardware','2026-10-30','2026-11-15',403361,76639,480000,200000,'ABONADA','TRANSFERENCIA','2026-11-04','Crédito proveedor 15 días. Falta pagar saldo de $280.000.'),(7,'PROV-19204','POR_PAGAR','PROVEEDOR',NULL,NULL,NULL,NULL,'Intcomex Chile','96.812.340-5','Insumos de laboratorio: Jeringas pasta térmica Arctic MX-6, Pads térmicos y Alcohol Isopropílico','Insumos Laboratorio','2026-10-26','2026-11-07',96639,18361,115000,0,'PENDIENTE',NULL,NULL,'Factura por pagar vencida hace 2 días. Programar transferencia.'),(8,'PROV-7721','POR_PAGAR','PROVEEDOR',NULL,NULL,NULL,NULL,'Mayorista Seguridad & CCTV Sur SpA','76.441.920-1','Inyectores PoE Ubiquiti + Bobina cable UTP Cat6A Furukawa 305m','Redes y CCTV','2026-11-05','2026-11-20',109244,20756,130000,0,'PENDIENTE',NULL,NULL,'Material utilizado en cliente Constructora Andes SpA.'),(9,'PROV-5501','POR_PAGAR','PROVEEDOR',NULL,NULL,NULL,NULL,'Entel Empresas / Hosting & Fibra Taller PCG','92.580.000-7','Internet Fibra Dedicada Laboratorio + Servidor Cloud & Dominio PCG','Gastos Operacionales','2026-10-31','2026-11-08',46210,8780,54990,54990,'PAGADA','TRANSFERENCIA','2026-11-05',NULL),(10,'FAC-1044','POR_COBRAR','FACTURA_AFECTA',3,NULL,5,2,'Logística y Transporte Pacífico Sur S.A.','76.540.880-2','Mantención Servidor Rack R250 + Impresora Zebra Industrial + UPS (OT PCG-8925)','Infraestructura & Servidores','2026-11-05','2026-11-17',385714,73286,459000,250000,'ABONADA','TRANSFERENCIA','2026-11-07','Abono inicial $250.000. Saldo $209.000 al finalizar QA.'),(11,'FAC-1045','POR_COBRAR','FACTURA_AFECTA',4,NULL,6,NULL,'Estudio Jurídico Vergara & Asociados SpA','78.210.430-9','Optimización ThinkPad X1 Carbon + Auditoría Respaldo NAS Synology (OT PCG-8926)','Soporte Corporativo','2026-11-08','2026-11-23',159664,30336,190000,0,'PENDIENTE',NULL,NULL,'Pago a 15 días contra entrega de informe técnico.'),(12,'FAC-1036','POR_COBRAR','FACTURA_EXENTA',5,NULL,7,NULL,'Colegio Técnico San Agustín','65.120.990-K','Mantención Laboratorio Computación y Switch PoE Cisco (OT PCG-8927)','Educación & Redes','2026-10-28','2026-11-04',380000,0,380000,380000,'PAGADA','TRANSFERENCIA','2026-11-03',NULL);
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `informes`
--

DROP TABLE IF EXISTS `informes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `informes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `equipo_id` int(11) DEFAULT NULL,
  `ot_id` int(11) DEFAULT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `desde` date DEFAULT NULL,
  `hasta` date DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `resumen` text DEFAULT NULL,
  `fecha` date NOT NULL,
  `visible_cliente` tinyint(1) DEFAULT 1,
  `generado_por` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_inf_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `informes`
--

LOCK TABLES `informes` WRITE;
/*!40000 ALTER TABLE `informes` DISABLE KEYS */;
INSERT INTO `informes` VALUES (1,'INF-2026-0001','EQUIPO',4,NULL,1,NULL,NULL,'Informe técnico Dell OptiPlex 7090 (CAN-004)','Equipo en buen estado general. Temperaturas reducidas de 82°C a 47°C tras cambio de pasta térmica certificada.','2026-11-04',1,2),(2,'INF-2026-0002','PARQUE_EMPRESA',NULL,NULL,3,NULL,NULL,'Auditoría preventiva Parque TI — Logística Pacífico Sur','Revisión de Servidor Rack R250, UPS APC 3000VA e impresora industrial Zebra ZT230.','2026-11-06',1,1),(3,'INF-2026-0003','OT',NULL,7,5,NULL,NULL,'Cierre de OT — Laboratorio Colegio San Agustín','Mantención completada en 100% del laboratorio y switch PoE Cisco Catalyst.','2026-11-03',1,2);
/*!40000 ALTER TABLE `informes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intervenciones`
--

DROP TABLE IF EXISTS `intervenciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `intervenciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) NOT NULL,
  `ot_id` int(11) DEFAULT NULL,
  `tecnico_id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `detalle` text DEFAULT NULL,
  `temp_antes` int(11) DEFAULT NULL,
  `temp_despues` int(11) DEFAULT NULL,
  `checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checklist`)),
  `insumos` text DEFAULT NULL,
  `fecha` date NOT NULL,
  `garantia_dias` int(11) DEFAULT 30,
  `visible_cliente` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_interv_equipo` (`equipo_id`),
  KEY `idx_interv_tecnico` (`tecnico_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intervenciones`
--

LOCK TABLES `intervenciones` WRITE;
/*!40000 ALTER TABLE `intervenciones` DISABLE KEYS */;
INSERT INTO `intervenciones` VALUES (1,1,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',79,46,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-05-16',30,1),(2,2,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',80,47,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-05-16',30,1),(3,3,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',81,48,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-05-16',30,1),(4,4,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',82,49,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-05-31',30,1),(5,5,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',83,50,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-05-31',30,1),(6,6,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',84,45,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-09-08',30,1),(7,7,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',85,46,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-09-08',30,1),(8,8,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',78,47,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-09-08',30,1),(9,9,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',79,48,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-09-08',30,1),(10,14,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',84,47,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-05-17',30,1),(11,15,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',85,48,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-08-09',30,1),(12,16,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',78,49,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-10-08',30,1),(13,17,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',79,50,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-11-07',30,1),(14,18,NULL,4,'PREVENTIVO','Mantención preventiva de hardware','Desarme completo, limpieza profunda, lubricación de ventiladores y cambio de pasta térmica premium.',80,45,'[\"Desarme completo\",\"Limpieza profunda (aire \\/ ultrasónica)\",\"Lubricación de ventiladores\",\"Cambio de pasta térmica premium\"]','Pasta térmica premium certificada','2026-11-07',30,1),(15,1,NULL,3,'SOFTWARE','Reinstalación de Windows y Office','Formateo profesional, activación, drivers y optimización de arranque.',NULL,NULL,'[\"Instalación \\/ optimización de SO\",\"Actualización de drivers y programas base\"]','Licencia Office','2025-10-05',30,1),(16,10,NULL,4,'PREVENTIVO','Mantención preventiva','Limpieza general y cambio de pasta térmica.',82,49,'[\"Desarme completo\",\"Cambio de pasta térmica premium\"]','Pasta térmica','2025-10-05',30,1),(17,11,NULL,4,'PREVENTIVO','Mantención preventiva','Limpieza general y cambio de pasta térmica.',82,49,'[\"Desarme completo\",\"Cambio de pasta térmica premium\"]','Pasta térmica','2025-10-05',30,1);
/*!40000 ALTER TABLE `intervenciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario`
--

DROP TABLE IF EXISTS `inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `marca_modelo` varchar(150) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `stock_actual` int(11) DEFAULT 1,
  `en_uso` int(11) DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 1,
  `unidad` varchar(50) DEFAULT 'UN',
  `costo_unitario` bigint(20) DEFAULT 0,
  `precio_venta_sugerido` bigint(20) DEFAULT NULL,
  `proveedor` varchar(150) DEFAULT NULL,
  `fecha_ultima_compra` date DEFAULT NULL,
  `nro_factura_compra` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(150) DEFAULT NULL,
  `responsable_id` int(11) DEFAULT NULL,
  `estado_fisico` varchar(50) DEFAULT NULL,
  `tipo_licencia` varchar(50) DEFAULT NULL,
  `clave_licencia` text DEFAULT NULL,
  `cuenta_asociada` varchar(150) DEFAULT NULL,
  `fecha_vencimiento_licencia` date DEFAULT NULL,
  `asignado_a_clientes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`asignado_a_clientes`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_inv_codigo` (`codigo`),
  KEY `idx_inv_cat` (`categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario`
--

LOCK TABLES `inventario` WRITE;
/*!40000 ALTER TABLE `inventario` DISABLE KEYS */;
INSERT INTO `inventario` VALUES (1,'INV-HER-001','HERRAMIENTA','Kit Destornilladores de Precisión iFixit Pro Tech Toolkit (64 puntas)','iFixit IF145-307-4 · Puntas Magnéticas Torx / Pentalobe / Phillips','Juego maestro de destornilladores de precisión, pinzas ESD, spudgers y apertura de notebooks/MacBooks.',3,2,1,'kits',69990,NULL,'PC Factory S.A.','2026-11-02','FAC-88210','Banco de Trabajo 1 · Laboratorio PCG',4,'OPERATIVO',NULL,NULL,NULL,NULL,'[]'),(2,'INV-HER-002','HERRAMIENTA','Destornillador Eléctrico de Precisión Inalámbrico (Torque regulable)','Xiaomi Mijia Wiha 24-en-1 · Recargable USB-C','Destornillador motorizado de aluminio para desarme rápido de carcasas de notebooks y gabinetes.',2,2,1,'unidades',34990,NULL,'MercadoLibre Chile / Oficial','2026-10-26','BOL-99214','Maletín Terreno Corporativo',3,'EN_TERRENO',NULL,NULL,NULL,NULL,'[]'),(3,'INV-HER-003','HERRAMIENTA','Juego Destornilladores Aislados 1000V + Cruz/Paleta Taller Pesado','Stanley CushionGrip / Bahco Pro (Set 8 piezas)','Destornilladores imantados para armado de gabinetes ATX, racks de servidores y tableros eléctricos.',4,1,2,'sets',24990,NULL,'Sodimac Constructor / Imperial','2026-10-28','FAC-512090','Tablero Mural Taller PCG',4,'OPERATIVO',NULL,NULL,NULL,NULL,'[]'),(4,'INV-HER-004','HERRAMIENTA','Estación de Soldadura Digital SMD + Pistola de Aire Caliente','Yihua 853D Pro · Con Fuente DC y Multímetro','Estación 3 en 1 para rework de placas madre, cambio de pines de carga y microelectrónica.',1,1,1,'estación',115000,NULL,'PC Factory S.A.','2026-11-02','FAC-88210','Estación Microelectrónica · Laboratorio PCG',1,'OPERATIVO',NULL,NULL,NULL,NULL,'[]'),(5,'INV-HER-005','HERRAMIENTA','Soplador / Aspirador Eléctrico de Aire Comprimido 550W','CompuCleaner Xpert 2.0 ESD Safe','Turbina antiestática de alta presión para limpieza profunda de disipadores, fuentes y servidores.',2,1,1,'unidades',48000,NULL,'Sodimac Constructor / Imperial','2026-10-28','FAC-512090','Área Limpieza & Mantención',3,'OPERATIVO',NULL,NULL,NULL,NULL,'[]'),(6,'INV-HER-006','HERRAMIENTA','Multímetro Digital True RMS + Tester Digital de Fuentes ATX','UNI-T UT61E+ & Thermaltake Dr. Power II','Medición de voltajes de fuentes de poder ATX, continuidad en placas y diagnóstico eléctrico.',2,1,1,'kits',52000,NULL,'Casa Royal / Electrónica','2026-10-20','FAC-33108','Banco de Trabajo 1 · Laboratorio PCG',4,'OPERATIVO',NULL,NULL,NULL,NULL,'[]'),(7,'INV-LIC-001','LICENCIA_SOFTWARE','Licencia Microsoft Office 2021 Pro Plus LTSC (64-bit)','Microsoft Corp · Word, Excel, PowerPoint, Outlook, Access','Licencias perpetuas para activar en equipos de convenios corporativos y clientes de mantención.',25,18,5,'activaciones',14500,25000,'Licencias Corporativas Chile SpA','2026-10-30','FAC-77410','Bóveda Digital PCG (Nube / Portal VLSC)',1,NULL,'VOLUMEN_CORPORATIVO','XM2V9-8N7K4-P3Q2W-9R6T5-PCG21','serviciotecnicopcg@gmail.com','2027-11-09','[\"Constructora Andes SpA (9 eq.)\",\"Clínica Dental Sonrisa (4 eq.)\",\"Estudio Jurídico Vergara (5 eq.)\"]'),(8,'INV-LIC-002','LICENCIA_SOFTWARE','Avast Business Antivirus ProPlus (Consola Cloud Management)','Avast Business Security · Protección Endpoint + Firewall + Ransomware Shield','Bolsa de licencias anuales administradas para parques empresariales y notebooks de clientes.',30,27,5,'licencias',8900,18000,'Avast Partner Hub Latam','2026-10-15','INV-AV-9012','Consola Avast Business Cloud',3,NULL,'SUSCRIPCION_ANUAL','AVAST-CORP-9941-X82K-PCG5-2026','johan@pcg.cl','2026-11-23','[\"Constructora Andes SpA (9 eq.)\",\"Logística Pacífico Sur (8 eq.)\",\"Colegio San Agustín (10 eq.)\"]'),(9,'INV-LIC-003','LICENCIA_SOFTWARE','Licencias Windows 11 Pro OEM / Retail 64-bit','Microsoft Windows 11 Professional · Activación Digital BIOS/Cuenta','Claves originales para formateos limpios, upgrades desde Windows 10 Home y armado de Workstations.',15,13,4,'claves',12000,25000,'Tecnoglobal S.A.','2026-10-25','PROV-20041','Planilla Cifrada Licencias PCG',1,NULL,'OEM_RETAIL','W269N-WFGWX-YVC9B-4J6C9-T83GX','serviciotecnicopcg@gmail.com','2028-11-08','[\"Workstations Constructora Andes\",\"Clientes Particulares Formateo\"]'),(10,'INV-LIC-004','LICENCIA_SOFTWARE','Adobe Creative Cloud Todas las Apps (Illustrator, Photoshop, InDesign)','Adobe Systems · Plan Equipos Diseño Gráfico & Imprenta','Licencia oficial para diseño de Logos Vectoriales, Tarjetas de Presentación y Papelería Corporativa.',2,2,1,'puestos',44990,NULL,'Adobe Inc. Chile','2026-11-04','ADB-2026-1104','Estación de Diseño Gráfico PCG',4,NULL,'SUSCRIPCION_ANUAL','ADOBE-CC-TEAM-JAVIER-PCG-8841','javier@pcg.cl','2027-09-15','[\"Uso Interno PCG SPA — Área Diseño de Logos y Tarjetas (Javier Vergara)\"]'),(11,'INV-LIC-005','LICENCIA_SOFTWARE','ESET Endpoint Security + File Server Security (Servidores)','ESET Latinoamérica · Licenciamiento Ciberseguridad Corporativa','Licencias de seguridad avanzada y auditoría para servidores Windows Server y nodos críticos.',10,6,2,'nodos',19500,35000,'ESET Chile Distribuidor','2026-10-22','FAC-ESET-419','Portal ESET Protect Hub',3,NULL,'SUSCRIPCION_ANUAL','ESET-3391-ABCD-7742-PCGS-9001','johan@pcg.cl','2027-07-07','[\"Logística Pacífico Sur (Servidor Rack)\",\"Agroexportadora Valle Central (Servidor T350)\"]'),(12,'INV-REP-001','REPUESTO','Disco SSD NVMe M.2 PCIe 4.0 1TB','Kingston NV2 1000GB · 3500 MB/s Lectura','Unidades de estado sólido para upgrades de velocidad en notebooks y PCs de clientes.',4,1,2,'unidades',58000,79990,'Tecnoglobal S.A.','2026-10-31','PROV-20089','Estante Repuestos A1 · Bodega Sucursal',2,NULL,NULL,NULL,NULL,NULL,'[]'),(13,'INV-REP-002','REPUESTO','Memoria RAM DDR4 8GB 3200MHz SODIMM (Notebook)','Crucial by Micron CT8G4SFRA32A','Módulos RAM para ampliación a 16GB Dual-Channel en equipos corporativos.',2,0,3,'módulos',22000,36000,'SP Digital SpA','2026-11-05','PROV-20094','Estante Repuestos A2 · Bodega Sucursal',2,NULL,NULL,NULL,NULL,NULL,'[]'),(14,'INV-REP-003','REPUESTO','Fuente de Poder Certificada 650W 80 Plus Bronze ATX','Corsair CX650 / EVGA 650 BR','Fuentes de reemplazo ante fallas eléctricas en torres de escritorio y workstations.',2,0,1,'unidades',54000,78000,'SP Digital SpA','2026-11-05','PROV-20094','Estante Repuestos B1 · Bodega Sucursal',4,NULL,NULL,NULL,NULL,NULL,'[]'),(15,'INV-INS-001','INSUMO','Jeringas Pasta Térmica Alto Rendimiento Arctic MX-6 (8g)','Arctic Cooling MX-6 · Conductividad Térmica Superior','Insumo principal para mantenciones preventivas de CPU y GPU (rinde ~18 aplicaciones por jeringa).',6,2,3,'jeringas',11500,NULL,'Tecnoglobal S.A.','2026-10-31','PROV-20089','Gaveta Insumos Térmicos · Taller',4,NULL,NULL,NULL,NULL,NULL,'[]'),(16,'INV-INS-002','INSUMO','Alcohol Isopropílico 99.8% Grado Electrónico + Limpiacontactos','Química Universal / CRC Contact Cleaner','Limpieza ultrasónica de placas madre, contactos RAM y remoción de pasta térmica reseca.',4,1,2,'litros/envases',8500,NULL,'Sodimac Constructor / Imperial','2026-10-28','FAC-512090','Gabinete Químicos · Laboratorio PCG',3,NULL,NULL,NULL,NULL,NULL,'[]'),(17,'INV-INS-003','INSUMO','Cajas de Tarjetas Couché 350g Laminado Polipropileno Mate (x1.000 u.)','Papelería Gráfica Pro · Corte Preciso 9x5 cm','Insumo para entregas de servicio de Diseño e Impresión de Tarjetas de Presentación corporativas.',5,1,2,'cajas x1000',19900,45000,'Imprenta & Gráfica Digital Santiago','2026-11-03','FAC-44912','Área Diseño Gráfico · Sucursal PCG',4,NULL,NULL,NULL,NULL,NULL,'[]');
/*!40000 ALTER TABLE `inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos`
--

DROP TABLE IF EXISTS `movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `tipo` enum('INGRESO','EGRESO') NOT NULL,
  `rubro` varchar(100) DEFAULT NULL,
  `categoria` varchar(100) NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `item_comprado` varchar(255) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `contraparte` varchar(150) NOT NULL,
  `monto` bigint(20) NOT NULL,
  `metodo` varchar(50) DEFAULT 'TRANSFERENCIA',
  `nro_documento` varchar(100) DEFAULT NULL,
  `conciliado_banco` tinyint(1) DEFAULT 1,
  `factura_id` int(11) DEFAULT NULL,
  `ot_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mov_fecha` (`fecha`),
  KEY `idx_mov_tipo` (`tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos`
--

LOCK TABLES `movimientos` WRITE;
/*!40000 ALTER TABLE `movimientos` DISABLE KEYS */;
INSERT INTO `movimientos` VALUES (1,'2026-10-25','INGRESO','CAPITAL','Capital Operativo','Saldo inicial de caja operativa mensual PCG SPA',NULL,NULL,'Cuenta Empresa PCG SPA',950000,'TRANSFERENCIA','CARTOLA-001',1,NULL,NULL),(2,'2026-10-28','EGRESO','EQUIPOS','Compra de Equipos / Computadores','Compra de equipo de respaldo para préstamos B2B y estación de diagnóstico','Notebook Lenovo ThinkPad E14 Gen 4 + Monitor Dell 24\" IPS (Respaldo Taller)',2,'PC Factory Empresas',540000,'TRANSFERENCIA','FAC-PCF-99201',1,NULL,NULL),(3,'2026-10-31','EGRESO','HERRAMIENTAS','Herramientas de Taller y Laboratorio','Equipamiento de microelectrónica y herramientas de precisión para laboratorio PCG','Estación de Soldadura Aire Caliente SMD + Kit iFixit Pro Tech + Multímetro Digital Fluke',3,'Casa Royal / Mercadolibre Pro',215000,'TARJETA','BOL-88241',1,NULL,NULL),(4,'2026-11-02','EGRESO','HERRAMIENTAS','Herramientas de Taller y Laboratorio','Herramientas para mantención preventiva en terreno y certificación de puntos de red','Soplador Inalámbrico Alta Presión + Tester de Fuentes ATX y Cables RJ45/PoE',2,'Sodimac / Imperial Pro',89900,'TARJETA','FAC-77412',1,NULL,NULL),(5,'2026-11-04','EGRESO','REPUESTOS','Repuestos y Componentes (SSD, RAM, Fuentes)','Abono factura PROV-88412 (Lote SSD NVMe + RAM DDR4)','5x SSD NVMe Kingston 1TB + 4x RAM DDR4 16GB 3200MHz',9,'Tecnoglobal S.A.',200000,'TRANSFERENCIA','PROV-88412',1,6,NULL),(6,'2026-11-05','EGRESO','INSUMOS','Insumos (Pasta térmica, Limpieza, Cables)','Compra de insumos químicos y disipación para mantenciones preventivas','10x Pasta Térmica Arctic MX-6 + 6x Alcohol Isopropílico 1L + Pads Térmicos',16,'SP Digital SpA',94500,'TRANSFERENCIA','FAC-SPD-3310',1,NULL,NULL),(7,'2026-11-05','EGRESO','OPERACION','Gastos Operacionales','Pago factura PROV-5501 (Fibra Laboratorio + Cloud PCG)','Internet Fibra Dedicada 1Gbps Laboratorio + Hosting Cloud PCG',1,'Entel Empresas',54990,'TRANSFERENCIA','PROV-5501',1,9,NULL),(8,'2026-11-06','INGRESO','INGRESO_OT','Mantención B2B','Cobro total FAC-1038 (OT PCG-8921 Administración y Contabilidad)',NULL,NULL,'Constructora Andes SpA',255000,'TRANSFERENCIA','FAC-1038',1,1,1),(9,'2026-11-06','INGRESO','INGRESO_CONVENIO','Convenio Corporativo','Abono 50% FAC-1041 Convenio corporativo 9 equipos',NULL,NULL,'Constructora Andes SpA',382500,'TRANSFERENCIA','FAC-1041',1,2,NULL),(10,'2026-11-07','INGRESO','INGRESO_OT','Upgrade Hardware','Abono inicial BOL-3019 (OT PCG-8922 Laptop Asus TUF)',NULL,NULL,'Pedro Muñoz',30000,'TRANSFERENCIA','BOL-3019',1,4,2),(11,'2026-11-08','INGRESO','INGRESO_OT','Reparación Hardware','Pago FAC-1039 Reparación fuente de poder Gerencia (OT PCG-8923)',NULL,NULL,'Constructora Andes SpA',60000,'TRANSFERENCIA','FAC-1039',1,5,3);
/*!40000 ALTER TABLE `movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ots`
--

DROP TABLE IF EXISTS `ots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `cotizacion_id` int(11) DEFAULT NULL,
  `proyecto_id` int(11) DEFAULT NULL,
  `origen` varchar(50) DEFAULT 'TICKET',
  `usuario_id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` varchar(50) NOT NULL,
  `prioridad` varchar(50) DEFAULT 'MEDIA',
  `estado` varchar(50) DEFAULT 'RECIBIDO',
  `tecnico_id` int(11) DEFAULT NULL,
  `inicio` date NOT NULL,
  `fin` date NOT NULL,
  `hora_cita` varchar(20) DEFAULT NULL,
  `modalidad_atencion` varchar(50) DEFAULT NULL,
  `equipo_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`equipo_ids`)),
  `total` bigint(20) NOT NULL,
  `estado_pago` varchar(50) DEFAULT 'PENDIENTE',
  `comprobante_nombre` varchar(255) DEFAULT NULL,
  `requiere_factura` tinyint(1) DEFAULT 0,
  `numero_factura` varchar(50) DEFAULT NULL,
  `factura_nombre` varchar(255) DEFAULT NULL,
  `datos_facturacion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_facturacion`)),
  `historial` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`historial`)),
  `comentarios` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`comentarios`)),
  `creado` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_ots_codigo` (`codigo`),
  KEY `idx_ots_estado` (`estado`),
  KEY `idx_ots_tecnico` (`tecnico_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ots`
--

LOCK TABLES `ots` WRITE;
/*!40000 ALTER TABLE `ots` DISABLE KEYS */;
INSERT INTO `ots` VALUES (1,'PCG-2026-8921',NULL,NULL,NULL,'PREVENTIVA',5,1,'Mantención preventiva — Administración y Contabilidad','','MANTENIMIENTO','ALTA','EN_REVISION',4,'2026-11-07','2026-11-13','09:00','DOMICILIO','[1,2,3]',255000,'PAGADO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51'),(2,'PCG-2026-8922',NULL,NULL,NULL,'TICKET',6,NULL,'Upgrade de RAM y SSD — Laptop TUF Gaming (Cliente Natural)','','UPGRADE','MEDIA','EN_DESARROLLO',3,'2026-11-06','2026-11-11','10:30','LABORATORIO','[13]',95000,'VERIFICANDO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_DESARROLLO\",\"fecha\":\"2026-11-03T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51'),(3,'PCG-2026-8923',NULL,NULL,NULL,'ADMIN',5,1,'Reparación de fuente de poder — Gerencia','','MANTENIMIENTO','URGENTE','LISTO',3,'2026-11-01','2026-11-08',NULL,NULL,'[4]',60000,'PAGADO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_DESARROLLO\",\"fecha\":\"2026-11-03T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_QA\",\"fecha\":\"2026-11-05T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"LISTO\",\"fecha\":\"2026-11-07T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51'),(4,'PCG-2026-8924',NULL,NULL,NULL,'TICKET',7,2,'Diagnóstico equipo de recepción y Servidor HPE','','CONSULTORIA','ALTA','RECIBIDO',4,'2026-11-09','2026-11-13','12:00','DOMICILIO','[10,21]',145000,'PENDIENTE',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"}]','[]','2026-10-28 13:45:51'),(5,'PCG-2026-8925',NULL,NULL,NULL,'TICKET',8,3,'Mantención Servidor Rack R250 + Zebra Industrial + UPS','','MANTENIMIENTO','URGENTE','EN_QA',3,'2026-11-08','2026-11-12','15:00','DOMICILIO','[22,25,27]',459000,'PAGADO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_DESARROLLO\",\"fecha\":\"2026-11-03T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_QA\",\"fecha\":\"2026-11-05T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51'),(6,'PCG-2026-8926',NULL,NULL,NULL,'TICKET',9,4,'Optimización ThinkPad X1 Carbon + Respaldo NAS Synology','','CONSULTORIA','ALTA','EN_DESARROLLO',4,'2026-11-09','2026-11-12',NULL,NULL,'[28,31]',190000,'PENDIENTE',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_DESARROLLO\",\"fecha\":\"2026-11-03T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51'),(7,'PCG-2026-8927',NULL,NULL,NULL,'ADMIN',10,5,'Mantención Laboratorio Computación Colegio San Agustín','','MANTENIMIENTO','MEDIA','ENTREGADO',4,'2026-10-26','2026-11-03',NULL,NULL,'[32,33,34]',380000,'PAGADO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_DESARROLLO\",\"fecha\":\"2026-11-03T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_QA\",\"fecha\":\"2026-11-05T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"LISTO\",\"fecha\":\"2026-11-07T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"ENTREGADO\",\"fecha\":\"2026-11-09T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51'),(8,'PCG-2026-8928',NULL,NULL,NULL,'ADMIN',8,3,'Cambio de gabinete antiguo (reemplazado por equipo nuevo)','','UPGRADE','BAJA','CANCELADA',3,'2026-10-30','2026-11-04',NULL,NULL,'[23]',45000,'PENDIENTE',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"CANCELADA\",\"fecha\":\"2026-11-07T13:45:51.957Z\",\"nota\":\"OT cancelada por reprogramación de cliente\"}]','[]','2026-10-28 13:45:51'),(9,'PCG-2026-8929',NULL,NULL,NULL,'TICKET',12,NULL,'Mantención Preventiva + Pasta Térmica (10:30 hrs) — Notebook Personal','','MANTENIMIENTO','MEDIA','RECIBIDO',4,'2026-11-10','2026-11-11','10:30','LABORATORIO','[]',45000,'PENDIENTE',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"}]','[]','2026-10-28 13:45:51'),(10,'PCG-2026-8930',NULL,NULL,NULL,'TICKET',13,NULL,'Pack Full Mantención + Formateo (16:30 hrs) — Workstation Arquitectura','','MANTENIMIENTO','ALTA','RECIBIDO',3,'2026-11-11','2026-11-12','16:30','DOMICILIO','[]',80000,'PAGADO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"}]','[]','2026-10-28 13:45:51'),(11,'PCG-2026-8931',NULL,NULL,NULL,'ADMIN',9,4,'Diseño de Logo Corporativo + Tarjetas de Presentación Ejecutivas con QR','','DISENO_BRANDING','ALTA','EN_DESARROLLO',4,'2026-11-08','2026-11-12','11:00','LABORATORIO','[]',89000,'PAGADO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_DESARROLLO\",\"fecha\":\"2026-11-03T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51'),(12,'PCG-2026-8932',NULL,NULL,2,'ADMIN',7,2,'Desarrollo Página Web Corporativa + Agenda Online & Mantención Web','','WEB_SOFTWARE','ALTA','EN_DESARROLLO',1,'2026-11-05','2026-11-14','10:00','LABORATORIO','[]',275000,'PAGADO',NULL,0,NULL,NULL,NULL,'[{\"estado\":\"RECIBIDO\",\"fecha\":\"2026-10-30T13:45:51.957Z\",\"nota\":\"Equipo recibido y registrado\"},{\"estado\":\"EN_REVISION\",\"fecha\":\"2026-11-01T13:45:51.957Z\",\"nota\":\"Avance registrado\"},{\"estado\":\"EN_DESARROLLO\",\"fecha\":\"2026-11-03T13:45:51.957Z\",\"nota\":\"Avance registrado\"}]','[]','2026-10-28 13:45:51');
/*!40000 ALTER TABLE `ots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paquetes`
--

DROP TABLE IF EXISTS `paquetes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paquetes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `sufijo` varchar(50) NOT NULL,
  `servicio_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`servicio_ids`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paquetes`
--

LOCK TABLES `paquetes` WRITE;
/*!40000 ALTER TABLE `paquetes` DISABLE KEYS */;
INSERT INTO `paquetes` VALUES (1,'Convenio Corporativo','CORP','[1,2,4]'),(2,'Mantención + Avast Ultimate','MANT-AVAST','[1,5,4,6]'),(3,'Super Pack Integral + Avast','SUPER','[1,3,5,4,6]'),(4,'Solo mantención preventiva','MANT','[1]'),(5,'Pack Diseño: Logo + Tarjetas de Presentación','BRAND','[7,8,9]'),(6,'Pack Página Web Corporativa + Mantención Web','WEB-PRO','[10,11]');
/*!40000 ALTER TABLE `paquetes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programas`
--

DROP TABLE IF EXISTS `programas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `programas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `periodicidad_meses` int(11) DEFAULT 3,
  `dias_aviso` int(11) DEFAULT 7,
  `emails` text DEFAULT NULL,
  `cc_interno` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empresa_id` (`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programas`
--

LOCK TABLES `programas` WRITE;
/*!40000 ALTER TABLE `programas` DISABLE KEYS */;
INSERT INTO `programas` VALUES (25,1,1,6,7,'carolina@constructoraandes.cl',1),(26,2,1,6,7,'andres@sonrisa.cl, administracion@sonrisa.cl',1),(27,3,1,4,7,'rvaldes@pacificosur.cl, ti@pacificosur.cl',1),(28,4,1,6,7,'cfuentes@vergaraley.cl',1),(29,5,0,6,7,'informatica@colegiosanagustin.cl',1),(30,6,1,6,7,'fsoto@agrovallecentral.cl, planta@agrovallecentral.cl',1);
/*!40000 ALTER TABLE `programas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proyectos_web`
--

DROP TABLE IF EXISTS `proyectos_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `proyectos_web` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `cliente_nombre` varchar(200) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `nombre_proyecto` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `url_dominio` varchar(255) DEFAULT NULL,
  `stack_tecnologico` varchar(255) DEFAULT NULL,
  `hosting_proveedor` varchar(255) DEFAULT NULL,
  `valor_proyecto` bigint(20) NOT NULL,
  `monto_cobrado` bigint(20) DEFAULT 0,
  `estado_cobro` varchar(50) DEFAULT 'PAGADO',
  `incluye_mantencion_web` tinyint(1) DEFAULT 1,
  `plan_mantencion` varchar(50) DEFAULT 'MENSUAL',
  `valor_mantencion` bigint(20) DEFAULT 0,
  `fecha_inicio` date NOT NULL,
  `fecha_entrega` date DEFAULT NULL,
  `proxima_mantencion_web` date DEFAULT NULL,
  `vencimiento_dominio_hosting` date DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'PRODUCCION_ACTIVO',
  `responsable_id` int(11) NOT NULL,
  `participantes_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`participantes_ids`)),
  `participantes_detalle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`participantes_detalle`)),
  `personas_externas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`personas_externas`)),
  `modalidad_ejecucion` varchar(50) DEFAULT 'SOLO_PCG',
  `empresa_externa` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`empresa_externa`)),
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_proy_codigo` (`codigo`),
  KEY `idx_proy_tipo` (`tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proyectos_web`
--

LOCK TABLES `proyectos_web` WRITE;
/*!40000 ALTER TABLE `proyectos_web` DISABLE KEYS */;
INSERT INTO `proyectos_web` VALUES (1,'WEB-2026-001',1,5,'Constructora Andes SpA','PAGINA_WEB_CORPORATIVA','Sitio Web Corporativo + Portal de Obras y Licitaciones','Desarrollo web corporativo completo, catálogo de proyectos inmobiliarios, formulario de licitaciones y correos @constructoraandes.cl.','https://www.constructoraandes.cl','React + Next.js + Tailwind + Cloudflare SSL','VPS Cloud PCG / NIC Chile (.cl)',320000,320000,'PAGADO',1,'MENSUAL',35000,'2026-07-12','2026-08-06','2026-11-15','2027-07-07','MANTENCION_ACTIVA',1,'[1,4,2]','[]','[]','SOLO_PCG',NULL,'Incluye actualización mensual de galería de obras, backups semanales y soporte de correos corporativos.'),(2,'WEB-2026-002',2,7,'Clínica Dental Sonrisa SpA','PAGINA_WEB_CORPORATIVA','Página Web Clínica Dental + Reserva de Horas Online (WhatsApp & Agenda)','Portal institucional de la clínica, presentación de especialistas, integración directa a WhatsApp Business y sistema de reserva.','https://www.clinicasonrisa.cl','React + TypeScript + API Agenda Médica + SSL','Hosting Cloud PCG / NIC Chile (.cl)',275000,137500,'ANTICIPO_50',1,'MENSUAL',35000,'2026-10-25','2026-11-14','2026-12-14','2027-10-25','EN_DESARROLLO',1,'[1,4]','[]','[{\"nombre\":\"Carlos Muñoz\",\"rolOParte\":\"Fotógrafo Profesional & Drone\",\"empresa\":\"Agencia Andes Fotografía & Video SpA\",\"contacto\":\"+56 9 8812 3456\"},{\"nombre\":\"Camila Soto\",\"rolOParte\":\"Directora Audiovisual & Edición\",\"empresa\":\"Agencia Andes Fotografía & Video SpA\",\"contacto\":\"camila@andesfoto.cl\"}]','CON_EMPRESA_EXTERNA','{\"nombre\":\"Agencia Andes Fotografía & Video SpA\",\"rut\":\"76.882.114-3\",\"rolOParte\":\"Producción de fotografía profesional de boxes clínicos y video institucional\",\"costoPagado\":55000,\"personasParticipantes\":[{\"nombre\":\"Carlos Muñoz\",\"rolOParte\":\"Fotógrafo Profesional & Drone\",\"empresa\":\"Agencia Andes Fotografía & Video SpA\",\"contacto\":\"+56 9 8812 3456\"},{\"nombre\":\"Camila Soto\",\"rolOParte\":\"Directora Audiovisual & Edición\",\"empresa\":\"Agencia Andes Fotografía & Video SpA\",\"contacto\":\"camila@andesfoto.cl\"}]}','En etapa final de pruebas QA. Anticipo del 50% recibido contra entrega.'),(3,'SOFT-2026-003',3,8,'Logística y Transporte Pacífico Sur S.A.','SOFTWARE_A_MEDIDA','Sistema Web Intranet Control de Flota, Guías de Despacho y Romana','Plataforma web interna desarrollada a medida para el control de pesaje en romana, emisión de guías de despacho y seguimiento de camiones en ruta.','https://intranet.pacificosur.cl','React + Node.js + PostgreSQL + Docker','Servidor Dedicado / AWS Santiago',790000,790000,'PAGADO',1,'SEMESTRAL',120000,'2026-05-13','2026-07-02','2026-11-21','2027-05-13','MANTENCION_ACTIVA',1,'[1,3]','[]','[]','SOLO_PCG',NULL,'Software propio desarrollado 100% por PCG SPA. Incluye mantención de base de datos y soporte evolutivo.'),(4,'WEB-2026-004',4,9,'Estudio Jurídico Vergara & Asociados Ltda.','LANDING_PAGE','Landing Page Bufete de Abogados + Blog Legal & Contacto Cifrado','Sitio landing de captación corporativa, blog con artículos de asesoría penal y laboral, y formulario de contacto confidencial.','https://www.vergaraley.cl','Astro / React + Tailwind + SEO Legal','Vercel Pro / NIC Chile (.cl)',220000,220000,'PAGADO',1,'TRIMESTRAL',45000,'2026-09-10','2026-09-25','2026-11-12','2026-11-27','PENDIENTE_RENOVACION',4,'[4,1]','[]','[{\"nombre\":\"Ignacio Valenzuela\",\"rolOParte\":\"Redactor Legal Senior\",\"empresa\":\"Legal Copy Chile Consultores\",\"contacto\":\"ivalenzuela@legalcopy.cl\"}]','SUBCONTRATO_EXTERNO','{\"nombre\":\"Legal Copy Chile Consultores\",\"rut\":\"77.201.849-1\",\"rolOParte\":\"Redacción de copy jurídico, términos legales y política de privacidad\",\"costoPagado\":35000,\"personasParticipantes\":[{\"nombre\":\"Ignacio Valenzuela\",\"rolOParte\":\"Redactor Legal Senior\",\"empresa\":\"Legal Copy Chile Consultores\",\"contacto\":\"ivalenzuela@legalcopy.cl\"}]}','Renovación de certificado y dominio anual próxima en 18 días.'),(5,'WEB-2026-005',6,11,'Agroexportadora Valle Central SpA','TIENDA_ECOMMERCE','Portal Catálogo B2B Exportación Frutícola Multi-Idioma (ES/EN) + Mantención','Catálogo digital interactivo multi-idioma (Español e Inglés) para compradores internacionales de fruta fresca, con fichas técnicas descargables en PDF.','https://www.agrovallecentral.cl','Next.js + Catálogo Internacional + Cloudflare WAF','Cloud PCG / NIC Chile (.cl)',450000,450000,'PAGADO',1,'MENSUAL',45000,'2026-08-11','2026-09-05','2026-11-28','2027-08-11','PRODUCCION_ACTIVO',1,'[1,4,3]','[]','[]','SOLO_PCG',NULL,'Sitio web en inglés y español con fichas técnicas de exportación.'),(6,'INFRA-2026-006',5,10,'Colegio San Agustín','INFRAESTRUCTURA_REDES','Despliegue Red Wi-Fi Corporativa + Switch PoE + Portal Cautivo Alumnos','Implementación completa de red cableada Cat6 e inalámbrica para 3 salas de clases y laboratorio, con segmentación VLAN y portal cautivo.','https://wifi.colegiosanagustin.cl','Cisco Catalyst + Ubiquiti UniFi + RADIUS Server','Servidor Local Colegio / Red Interna',580000,580000,'PAGADO',1,'TRIMESTRAL',55000,'2026-09-30','2026-10-30','2027-01-28','2027-09-25','ENTREGADO',3,'[3,1,4]','[]','[]','SOLO_PCG',NULL,'Proyecto de infraestructura entregado conforme y certificado con informe de cobertura Wi-Fi.');
/*!40000 ALTER TABLE `proyectos_web` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `secuencias`
--

DROP TABLE IF EXISTS `secuencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `secuencias` (
  `clave` varchar(50) NOT NULL,
  `valor` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `secuencias`
--

LOCK TABLES `secuencias` WRITE;
/*!40000 ALTER TABLE `secuencias` DISABLE KEYS */;
INSERT INTO `secuencias` VALUES ('COT-2026',3),('INF-2026',3),('PCG-2026',8928),('TCK-2026',5);
/*!40000 ALTER TABLE `secuencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `normal` bigint(20) NOT NULL,
  `convenio` bigint(20) NOT NULL,
  `costo` bigint(20) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_servicios_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'MANT-PREV','Mantención Preventiva de Hardware de PC','Desarme completo, limpieza profunda ultrasónica/aire, lubricación de ventiladores y pasta térmica premium certificada.',45000,40000,0,1),(2,'SO-OFFICE','Instalación de Windows + Office + Optimización Avanzada','Formateo profesional, activación correcta, configuración de rendimiento corporativo y afinamiento de arranque.',50000,45000,0,1),(3,'SO-LIMPIO','SO Limpio + Optimización (sin Office)','Instalación limpia del sistema operativo y optimización de arranque y rendimiento.',50000,35000,0,1),(4,'DRIVERS','Actualización Integral de Drivers y Programas Base','Drivers oficiales y programas base para todo el parque. 100% bonificado en convenio.',35000,0,0,1),(5,'AVAST-ULT','Licencia Avast Ultimate (1 año) + Instalación','Licencia oficial con clave digital por equipo, protección en tiempo real, firewall y escudo anti-ransomware.',50000,30000,12000,1),(6,'DASH-INV','Dashboard de Inventario Técnico Digitalizado de Activos TI','Mapeo de hardware, componentes, estado de salud y ficha digital de cada equipo. 100% bonificado en convenio.',60000,0,0,1),(7,'DIS-LOGO','Diseño de Logo Corporativo Profesional + Manual de Marca','Creación de logotipo original vectorial (AI, PDF, PNG, SVG), paleta de colores y tipografías corporativas por nuestro diseñador Javier Vergara.',90000,65000,15000,1),(8,'DIS-TARJ','Diseño de Tarjetas de Presentación Ejecutivas (Frente/Dorso + QR)','Diseño gráfico profesional de tarjetas de presentación listas para imprenta con código QR de contacto directo.',45000,32000,8000,1),(9,'DIS-PACK','Pack Branding Completo: Logo Corporativo + Tarjetas de Presentación','Identidad visual corporativa completa: Diseño de Logo + Tarjetas de presentación ejecutivas + Firma de correo electrónico.',120000,89000,20000,1),(10,'WEB-CORP','Venta y Desarrollo de Página Web Corporativa (Responsive + SEO + SSL)','Desarrollo web moderno (React / Next.js / WordPress Pro), certificado SSL, correos corporativos, formulario de contacto y optimización SEO en Google.',320000,240000,35000,1),(11,'WEB-MANT','Mantención de Página Web, Hosting, Dominio .CL y Respaldo Mensual','Actualización de contenidos, parches de seguridad, monitoreo uptime 24/7, renovación SSL, respaldos cloud y soporte técnico web.',45000,35000,8000,1),(12,'WEB-ECOM','Desarrollo Tienda E-Commerce / Catálogo Online + Webpay/MercadoPago','Tienda virtual autoadministrable con carrito de compras, control de inventario web y pasarela de pago integrada.',490000,390000,50000,1),(13,'SOFT-MED','Desarrollo de Software / Sistema Web a Medida (Intranet / ERP / Portal)','Ingeniería de software a medida liderada por Brilan Bugueño (CEO): arquitectura full-stack, base de datos y panel administrativo.',850000,690000,90000,1);
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ot_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `asignado_id` int(11) DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'PENDIENTE',
  `prioridad` varchar(50) DEFAULT 'MEDIA',
  `inicio` date DEFAULT NULL,
  `limite` date DEFAULT NULL,
  `h_est` decimal(5,2) DEFAULT 1.00,
  `h_real` decimal(5,2) DEFAULT NULL,
  `equipo_id` int(11) DEFAULT NULL,
  `depende_de` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tareas_ot` (`ot_id`),
  KEY `idx_tareas_asignado` (`asignado_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (1,1,'Recepción y fotos del estado físico',4,'HECHA','ALTA','2026-11-07','2026-11-09',0.50,NULL,NULL,NULL),(2,1,'Diagnóstico y temperaturas iniciales',4,'HECHA','ALTA','2026-11-07','2026-11-09',0.50,NULL,NULL,1),(3,1,'Desarme y limpieza profunda',4,'EN_CURSO','ALTA','2026-11-08','2026-11-10',1.50,NULL,NULL,2),(4,1,'Lubricación de ventiladores y pasta térmica',4,'PENDIENTE','ALTA','2026-11-08','2026-11-10',0.50,NULL,NULL,3),(5,1,'SO, drivers y optimización (si aplica)',4,'PENDIENTE','ALTA','2026-11-09','2026-11-11',1.50,NULL,NULL,4),(6,1,'QA: pruebas y temperaturas finales',4,'PENDIENTE','ALTA','2026-11-09','2026-11-11',0.50,NULL,NULL,5),(7,1,'Registro en hoja de vida e informe',4,'PENDIENTE','ALTA','2026-11-10','2026-11-12',0.50,NULL,NULL,6),(8,1,'Entrega al cliente',4,'PENDIENTE','ALTA','2026-11-10','2026-11-12',0.25,NULL,NULL,7),(9,2,'Diagnóstico de disco y memoria',3,'HECHA','MEDIA','2026-11-06','2026-11-07',1.00,NULL,NULL,NULL),(10,2,'Instalar SSD NVMe y clonar sistema',3,'EN_CURSO','MEDIA','2026-11-07','2026-11-08',2.00,NULL,NULL,NULL),(11,2,'Ampliar RAM a 16 GB',3,'PENDIENTE','MEDIA','2026-11-08','2026-11-09',1.00,NULL,NULL,NULL),(12,2,'Pruebas y entrega',3,'PENDIENTE','MEDIA','2026-11-09','2026-11-10',0.50,NULL,NULL,NULL),(13,3,'Reemplazo de fuente 600W y pruebas',3,'HECHA','URGENTE','2026-11-01','2026-11-07',2.00,2.00,NULL,NULL),(14,4,'Recepción y diagnóstico inicial',NULL,'PENDIENTE','BAJA','2026-11-10','2026-11-12',1.00,NULL,NULL,NULL),(15,12,'Fase 1: Levantamiento, requerimientos y briefing de contenidos',6,'HECHA','MEDIA','2026-11-01','2026-11-02',3.00,3.00,NULL,NULL),(16,12,'Fase 2: Arquitectura de informaci?n y wireframes UI/UX',6,'HECHA','MEDIA','2026-11-03','2026-11-05',5.00,5.00,NULL,NULL),(17,12,'Fase 3: Dise?o visual interactivo en Figma y aprobaci?n de cliente',5,'HECHA','ALTA','2026-11-06','2026-11-08',8.00,7.50,NULL,NULL),(18,12,'Fase 4: Maquetaci?n responsive frontend (HTML5/Tailwind/React)',6,'EN_CURSO','ALTA','2026-11-09','2026-11-12',12.00,6.00,NULL,NULL),(19,12,'Fase 5: Integraci?n Backend, base de datos, CMS o formularios',6,'PENDIENTE','ALTA','2026-11-13','2026-11-16',10.00,NULL,NULL,NULL),(20,12,'Fase 6: Agenda de citas m?dicas online y alertas WhatsApp',6,'PENDIENTE','MEDIA','2026-11-17','2026-11-19',6.00,NULL,NULL,NULL),(21,12,'Fase 7: Pruebas QA multidispositivo, SEO y optimizaci?n de velocidad',3,'PENDIENTE','MEDIA','2026-11-20','2026-11-22',4.00,NULL,NULL,NULL),(22,12,'Fase 8: Configuraci?n Hosting cPanel, DNS, SSL y Despliegue en producci?n',3,'PENDIENTE','ALTA','2026-11-23','2026-11-24',3.00,NULL,NULL,NULL),(23,12,'Fase 9: Capacitaci?n de administraci?n al cliente y entrega final',6,'PENDIENTE','MEDIA','2026-11-25','2026-11-26',2.00,NULL,NULL,NULL);
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `tipo` varchar(50) NOT NULL,
  `asunto` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `equipo_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`equipo_ids`)),
  `cant_equipos` int(11) DEFAULT 1,
  `fecha_cita` date DEFAULT NULL,
  `hora_cita` varchar(20) DEFAULT NULL,
  `modalidad_atencion` varchar(50) DEFAULT NULL,
  `ot_id` int(11) DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'ABIERTO',
  `mensajes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mensajes`)),
  `creado` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_tickets_codigo` (`codigo`),
  KEY `idx_tickets_estado` (`estado`),
  KEY `idx_tickets_usuario` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,'TCK-2026-0001',7,2,'COTIZACION','Cotización mantención clínica dental + Servidor HPE','Necesitamos mantención urgente de recepción, box radiología y revisión del servidor de fichas.','[10,11,12,21]',4,NULL,NULL,NULL,NULL,'ABIERTO','[{\"usuarioId\":7,\"texto\":\"Buenas tardes, quedamos atentos a la cotización formal.\",\"interno\":false,\"fecha\":\"2026-11-08T13:45:51.957Z\"}]','2026-11-08 13:45:51'),(2,'TCK-2026-0002',5,1,'COTIZACION','Convenio corporativo parque completo (9 equipos)','Queremos cotizar mantención y optimización de todo el parque.','[1,2,3,4,5,6,7,8,9]',9,NULL,NULL,NULL,NULL,'COTIZADO','[]','2026-11-06 13:45:51'),(3,'TCK-2026-0003',8,3,'MANTENCION','Mantención Servidor Rack R250 + Impresora Zebra Aduana','El servidor de flota presenta ruido en ventiladores y requerimos limpieza de cabezal Zebra.','[22,23,25]',3,NULL,NULL,NULL,NULL,'ACEPTADO','[{\"usuarioId\":8,\"texto\":\"Favor coordinar visita técnica en planta San Antonio.\",\"interno\":false,\"fecha\":\"2026-11-07T13:45:51.957Z\"}]','2026-11-07 13:45:51'),(4,'TCK-2026-0004',9,4,'SOPORTE','Configuración respaldo NAS Synology y mantención ThinkPad X1','Necesitamos verificar las copias de seguridad encriptadas del estudio jurídico.','[28,31]',2,NULL,NULL,NULL,NULL,'ABIERTO','[]','2026-11-08 13:45:51'),(5,'TCK-2026-0005',11,6,'MANTENCION','Alistamiento temporada packing: Servidor Frigorífico + Cámaras CCTV','Revisión preventiva antes del inicio de cosecha y despacho.','[35,36,37]',3,NULL,NULL,NULL,NULL,'COTIZADO','[]','2026-11-05 13:45:51');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `rol_etiqueta` varchar(100) DEFAULT NULL,
  `especialidad` varchar(50) DEFAULT NULL,
  `apto_tecnico` tinyint(1) DEFAULT 1,
  `apto_desarrollador` tinyint(1) DEFAULT 0,
  `rut` varchar(20) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `empresa_id` int(11) DEFAULT NULL,
  `cargo` varchar(150) DEFAULT NULL,
  `titulo` varchar(150) DEFAULT NULL,
  `horas_semanales` int(11) DEFAULT 40,
  `color` varchar(20) DEFAULT '#10b981',
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_empresa` (`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Brilan Bugueño','brilan@pcg.cl','$2y$10$rsjKEiuH0AvEUFvkAfW0ZO0B3V3Restshk9/QdxbS8owqlRBcTixq','ADMIN','👑 CEO / Fundador & Administrador',NULL,1,1,NULL,NULL,1,NULL,'CEO / Fundador & Director de Ingeniería TI','Ingeniero Informático · Licenciado en Ciencias de la Ingeniería Informática',40,'#0284c7','2026-11-09 14:07:44'),(2,'Yovylin Bugueño','yovylin@pcg.cl','$2y$10$cXY8atK0v1j4HHbTtljbp.vRWGG/jH8fHkpnuLGa1ox8wMiCxDY.2','DOC_PROCESS','💼 Jefa de Sucursal & Finanzas',NULL,0,0,NULL,NULL,1,NULL,'Jefa de Sucursal, Encargada de Finanzas, Facturación y Procesos','Ingeniera Civil Industrial · Administración Financiera y Control de Gestión',40,'#059669','2026-11-09 14:07:44'),(3,'Johan Carrasco','johan@pcg.cl','$2y$10$ePcEDfYmSSKq8Acy2CfYP.toHVMCvvSGSauy4sgGPdqa9wq9B9/PK','WORKER','🛡️ Ing. Seguridad Privada / Prevencionista Penal','TECNICO',1,0,NULL,NULL,1,NULL,'Seguridad Privada, Prevención de Riesgos con Mención Penal & Soporte','Ingeniero en Seguridad Privada / Prevencionista con Mención Penal',40,'#2563eb','2026-11-09 14:07:44'),(4,'Javier Vergara','javier@pcg.cl','$2y$10$SVi9DOCg76XRAj.VC5wQd.kPFATge95OQpN5C7wyTnGZ8QY2C38NO','WORKER','🎨 Diseñador (Logos y Tarjetas) & Técnico','DISENADOR',1,1,NULL,NULL,1,NULL,'Diseñador Gráfico Corporativo (Logos, Tarjetas de Presentación, Branding) & Staff Técnico','Diseñador Gráfico · Especialista en Tarjetas de Presentación y Logos',40,'#9333ea','2026-11-09 14:07:44'),(5,'Carolina Reyes','carolina@constructoraandes.cl','$2y$10$ELE1N9Nr9xP38Ez923BiHucYgXqI3sGpLoF5UnnB8IUMxLrFkCdZa','CLIENTE_EMPRESA',NULL,NULL,1,0,NULL,'+56 9 5555 1111',1,1,'Jefa de Administración',NULL,40,'#10b981','2026-11-09 14:07:44'),(6,'Pedro Muñoz','pedro@correo.cl','$2y$10$bnR4897noTDRbtSvR4ZqseC8v84nB51atHRDzrxen16Mn5XyQcnoK','CLIENTE_PERSONA',NULL,NULL,1,0,'12345678-5',NULL,1,NULL,NULL,NULL,40,'#10b981','2026-11-09 14:07:44'),(7,'Andrés Lagos','andres@sonrisa.cl','$2y$10$CjSEZ3ymwhOXu6.cg5AIbuCGYVoL9OTm0KeTEDodkvYKNUVw.67sG','CLIENTE_EMPRESA',NULL,NULL,1,0,NULL,'+56 9 7788 2211',1,2,'Gerente Clínico',NULL,40,'#10b981','2026-11-09 14:07:44'),(8,'Rodrigo Valdés','rvaldes@pacificosur.cl','$2y$10$L1bK5RMqtvuLmHZwaR5cWumBRJ0zj4iY8freoshLL08oa24IbjNN.','CLIENTE_EMPRESA',NULL,NULL,1,0,NULL,'+56 9 8844 3322',1,3,'Jefe de Operaciones y TI',NULL,40,'#10b981','2026-11-09 14:07:44'),(9,'Camila Fuentes','cfuentes@vergaraley.cl','$2y$10$cmHt0HfNpUU63yc34SYB0.XqqZOELgSkFmks/h5BJayQwoayy5kii','CLIENTE_EMPRESA',NULL,NULL,1,0,NULL,'+56 9 6611 9900',1,4,'Socia Administradora',NULL,40,'#10b981','2026-11-09 14:07:44'),(10,'Marcelo Pizarro','informatica@colegiosanagustin.cl','$2y$10$YtMHUG2e4cn1aJibm5YM3eyQ5aLMpgfZFozDQk./ubmM2G/Ak7sz6','CLIENTE_EMPRESA',NULL,NULL,1,0,NULL,'+56 9 4433 1188',1,5,'Coordinador Enlaces y TI',NULL,40,'#10b981','2026-11-09 14:07:44'),(11,'Francisca Soto','fsoto@agrovallecentral.cl','$2y$10$dLjIFUH1AMsDnpCXPy9bje8HTmbHT9bKOFR1.ZZOcOXBJgyzjBE8S','CLIENTE_EMPRESA',NULL,NULL,1,0,NULL,'+56 9 9922 7744',1,6,'Subgerenta de Planta',NULL,40,'#10b981','2026-11-09 14:07:44'),(12,'Matías Soto','matias.soto@gmail.com','$2y$10$IqrDsH2X6lIHetVzHZ8JGuwGFP7iR2KG89E7JN2NVA6CKpEt9lmIe','CLIENTE_PERSONA',NULL,NULL,1,0,'19.442.810-3','+56 9 6211 4500',1,NULL,NULL,NULL,40,'#10b981','2026-11-09 14:07:44'),(13,'Valentina Morales','vmorales.arq@gmail.com','$2y$10$Hh4/JmbFnietrwCqMm3x8OT6aowI7T8UK2WdX1K49/u6pgx7p8kQS','CLIENTE_PERSONA',NULL,NULL,1,0,'18.730.112-K','+56 9 8190 3310',1,NULL,NULL,NULL,40,'#10b981','2026-11-09 14:07:44');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-09 15:52:42
