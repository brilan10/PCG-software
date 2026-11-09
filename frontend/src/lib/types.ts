export type Rol = 'ADMIN' | 'DOC_PROCESS' | 'WORKER' | 'CLIENTE_PERSONA' | 'CLIENTE_EMPRESA'

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: 'CEO / Administrador General',
  DOC_PROCESS: 'Jefa de Sucursal & Finanzas',
  WORKER: 'Especialista / Staff PCG',
  CLIENTE_PERSONA: 'Cliente particular',
  CLIENTE_EMPRESA: 'Cliente empresa',
}

export type EspecialidadWorker = 'TECNICO' | 'DISENADOR' | 'DESARROLLADOR' | 'SOPORTE_GENERAL'

export const ESPECIALIDAD_WORKER_META: Record<
  EspecialidadWorker,
  { label: string; icon: string; desc: string; tone: 'blue' | 'violet' | 'green' | 'amber' }
> = {
  TECNICO: {
    label: 'Técnico Hardware & Soporte',
    icon: '🛠️',
    desc: 'Mantenimiento de computadores, electrónica, redes, bitácoras y seguridad',
    tone: 'blue',
  },
  DISENADOR: {
    label: 'Diseñador Gráfico & Branding',
    icon: '🎨',
    desc: 'Diseño de logos, marcas, tarjetas de presentación, branding y proyectos web',
    tone: 'violet',
  },
  DESARROLLADOR: {
    label: 'Desarrollador Web & Software',
    icon: '💻',
    desc: 'Desarrollo web corporativo, tiendas e-commerce y software a medida',
    tone: 'green',
  },
  SOPORTE_GENERAL: {
    label: 'Soporte General',
    icon: '⚙️',
    desc: 'Atención operativa y apoyo técnico general',
    tone: 'amber',
  },
}

export function getWorkerEspecialidad(u?: Usuario | null): EspecialidadWorker {
  if (!u) return 'SOPORTE_GENERAL'
  if (u.especialidad) return u.especialidad
  const text = `${u.cargo ?? ''} ${u.rolEtiqueta ?? ''} ${u.titulo ?? ''}`.toLowerCase()
  if (text.includes('diseñ') || text.includes('disen') || text.includes('logo') || text.includes('tarjeta') || text.includes('branding')) {
    return 'DISENADOR'
  }
  if (text.includes('desarroll') || text.includes('program') || text.includes('software')) {
    return 'DESARROLLADOR'
  }
  if (text.includes('técnic') || text.includes('tecnic') || text.includes('soporte') || text.includes('hardware') || text.includes('seguridad') || text.includes('prevención')) {
    return 'TECNICO'
  }
  return 'TECNICO'
}

export function isAptoTecnico(u?: Usuario | null): boolean {
  if (!u) return false
  if (u.rol === 'ADMIN') return true
  if (typeof u.aptoTecnico === 'boolean') return u.aptoTecnico
  const esp = getWorkerEspecialidad(u)
  return esp === 'TECNICO' || esp === 'SOPORTE_GENERAL'
}

export function isAptoDesarrollador(u?: Usuario | null): boolean {
  if (!u) return false
  if (u.rol === 'ADMIN') return true
  if (typeof u.aptoDesarrollador === 'boolean') return u.aptoDesarrollador
  const esp = getWorkerEspecialidad(u)
  return esp === 'DISENADOR' || esp === 'DESARROLLADOR'
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  password: string
  rol: Rol
  rolEtiqueta?: string
  rut?: string
  telefono?: string
  activo: boolean
  empresaId?: number
  cargo?: string
  titulo?: string
  horasSemanales?: number
  color?: string
  especialidad?: EspecialidadWorker
  /** Casilla de habilitación: Apto para trabajar como técnico (Hardware, soporte, bitácora) */
  aptoTecnico?: boolean
  /** Casilla de habilitación: Apto para participar/trabajar como desarrollador o creativo web */
  aptoDesarrollador?: boolean
  direccion?: string
  ciudad?: string
}

export interface Empresa {
  id: number
  razonSocial: string
  rut: string
  giro: string
  ciudad: string
  direccion: string
  contactoId: number
}

export type TipoHw =
  | 'DESKTOP'
  | 'LAPTOP'
  | 'SERVIDOR'
  | 'IMPRESORA'
  | 'CAMARA'
  | 'RED'
  | 'UPS'
  | 'TARJETA_GRAFICA'
  | 'PLACA_MADRE'
  | 'OTRO'

export const TIPO_HW_META: Record<
  TipoHw,
  { label: string; short: string; icon: string; tone: 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'slate' }
> = {
  DESKTOP: { label: 'PC Torre / Desktop', short: 'PC Torre', icon: '🖥️', tone: 'blue' },
  LAPTOP: { label: 'Laptop / Notebook', short: 'Laptop', icon: '💻', tone: 'violet' },
  SERVIDOR: { label: 'Servidor / NAS', short: 'Servidor', icon: '🗄️', tone: 'green' },
  IMPRESORA: { label: 'Impresora / Multifuncional', short: 'Impresora', icon: '🖨️', tone: 'amber' },
  CAMARA: { label: 'Cámara CCTV / NVR', short: 'Cámara', icon: '📹', tone: 'red' },
  RED: { label: 'Red / Router / Switch', short: 'Red', icon: '📡', tone: 'blue' },
  UPS: { label: 'UPS / Respaldo Energía', short: 'UPS', icon: '🔋', tone: 'green' },
  TARJETA_GRAFICA: { label: 'Tarjeta Gráfica (GPU)', short: 'GPU', icon: '🎮', tone: 'violet' },
  PLACA_MADRE: { label: 'Placa Madre', short: 'Placa', icon: '🧩', tone: 'slate' },
  OTRO: { label: 'Otro equipo / periférico', short: 'Otro', icon: '⚙️', tone: 'slate' },
}

export const ES_COMPUTO = (t: TipoHw) => t === 'DESKTOP' || t === 'LAPTOP' || t === 'SERVIDOR'

export interface Equipo {
  id: number
  empresaId?: number
  usuarioId: number
  codigo: string
  area: string
  tipo: TipoHw
  marca: string
  modelo: string
  serie: string
  cpu: string
  ramGb: number
  disipacion: 'AIRE' | 'LIQUIDA' | 'STOCK'
  gpu: string
  ultimaMantencion?: string
  proximaMantencion?: string
  ubicacion: 'EN_PODER_CLIENTE' | 'EN_TALLER_PCG'
}

export type TipoInterv = 'PREVENTIVO' | 'CORRECTIVO' | 'UPGRADE' | 'SOFTWARE' | 'REPARACION_ELECTRONICA'

export interface Intervencion {
  id: number
  equipoId: number
  otId?: number
  tecnicoId: number
  tipo: TipoInterv
  titulo: string
  detalle: string
  tempAntes?: number
  tempDespues?: number
  checklist: string[]
  insumos: string
  fecha: string
  garantiaDias: number
  visibleCliente: boolean
}

export type EstadoTicket = 'ABIERTO' | 'EN_COTIZACION' | 'COTIZADO' | 'ACEPTADO' | 'CERRADO' | 'CANCELADO'

export interface Mensaje {
  usuarioId: number
  texto: string
  interno: boolean
  fecha: string
}

export interface Ticket {
  id: number
  codigo: string
  usuarioId: number
  empresaId?: number
  tipo: 'COTIZACION' | 'MANTENCION' | 'SOPORTE' | 'CONSULTA'
  asunto: string
  descripcion: string
  equipoIds: number[]
  cantEquipos: number
  fechaCita?: string
  horaCita?: string
  modalidadAtencion?: 'LABORATORIO' | 'DOMICILIO'
  direccionRetiro?: string
  otId?: number
  estado: EstadoTicket
  mensajes: Mensaje[]
  creado: string
}

export interface Servicio {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  tarifaCliente?: number
  tarifaEmpresa?: number
  normal: number
  convenio: number
  costo?: number
  activo: boolean
}

export interface Paquete {
  id: number
  nombre: string
  sufijo: string
  servicioIds: number[]
}

export interface ItemCot {
  servicioId?: number
  descripcion: string
  cantidad: number
  normal: number
  convenio: number
}

export type EstadoCot = 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA'

export interface Cotizacion {
  id: number
  numero: string
  ticketId?: number
  usuarioId: number
  empresaId?: number
  emailDestino?: string
  paqueteId?: number
  modo: 'CONVENIO' | 'VOLUMEN' | 'CRITERIO'
  descuentoCriterioPct?: number
  descuentoCriterioMonto?: number
  motivoDescuento?: string
  planInicio?: string
  planFin?: string
  planTecnicoId?: number
  items: ItemCot[]
  cantEquipos: number
  subtotalNormal: number
  descuentoMonto: number
  total: number
  estado: EstadoCot
  fecha: string
  validaHasta: string
  otId?: number
  emitidaPor: number
}

export type EstadoOT = 'RECIBIDO' | 'EN_REVISION' | 'EN_DESARROLLO' | 'EN_QA' | 'LISTO' | 'ENTREGADO' | 'CANCELADA'
export const ESTADOS_OT: EstadoOT[] = ['RECIBIDO', 'EN_REVISION', 'EN_DESARROLLO', 'EN_QA', 'LISTO', 'ENTREGADO', 'CANCELADA']
export const ESTADO_OT_LABEL: Record<EstadoOT, string> = {
  RECIBIDO: 'Recibido',
  EN_REVISION: 'Revisión / Diagnóstico',
  EN_DESARROLLO: 'Reparación / Desarrollo',
  EN_QA: 'QA (Pruebas)',
  LISTO: 'Listo para entrega',
  ENTREGADO: 'Terminada / Entregada',
  CANCELADA: 'Cancelada',
}

export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'

export interface Tarea {
  id: number
  otId: number
  titulo: string
  asignadoId?: number
  estado: 'PENDIENTE' | 'EN_CURSO' | 'BLOQUEADA' | 'EN_REVISION' | 'HECHA'
  prioridad: Prioridad
  inicio?: string
  limite?: string
  hEst: number
  hReal?: number
  equipoId?: number
  dependeDe?: number
}

export const ESTADOS_TAREA: Tarea['estado'][] = ['PENDIENTE', 'EN_CURSO', 'BLOQUEADA', 'EN_REVISION', 'HECHA']
export const ESTADO_TAREA_LABEL: Record<Tarea['estado'], string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  BLOQUEADA: 'Bloqueada',
  EN_REVISION: 'En revisión',
  HECHA: 'Hecha',
}

export interface OT {
  id: number
  codigo: string
  ticketId?: number
  cotizacionId?: number
  proyectoId?: number
  origen: 'TICKET' | 'ADMIN' | 'PREVENTIVA'
  usuarioId: number
  empresaId?: number
  titulo: string
  descripcion: string
  tipo: 'MANTENIMIENTO' | 'DESARROLLO' | 'UPGRADE' | 'CONSULTORIA' | 'DISENO_BRANDING' | 'WEB_SOFTWARE'
  prioridad: Prioridad
  estado: EstadoOT
  tecnicoId?: number
  inicio: string
  fin: string
  horaCita?: string
  modalidadAtencion?: 'LABORATORIO' | 'DOMICILIO'
  direccionRetiro?: string
  equipoIds: number[]
  total: number
  estadoPago: 'PENDIENTE' | 'VERIFICANDO' | 'PAGADO'
  comprobanteNombre?: string
  requiereFactura?: boolean
  numeroFactura?: string
  facturaNombre?: string
  datosFacturacion?: { rut: string; razonSocial: string; giro: string }
  historial: { estado: EstadoOT; fecha: string; nota: string }[]
  comentarios: { usuarioId: number; texto: string; fecha: string }[]
  creado: string
}

export interface Programa {
  empresaId: number
  activo: boolean
  periodicidadMeses: number
  diasAviso: number
  emails: string
  ccInterno: boolean
}

export interface Correo {
  id: number
  tipo: 'COTIZACION' | 'ALERTA_PREVENTIVA' | 'ESTADO_OT' | 'INFORME' | 'OTRO'
  de?: string
  para: string
  cc?: string
  asunto: string
  cuerpo: string
  fecha: string
}

export interface Informe {
  id: number
  codigo: string
  tipo: 'EQUIPO' | 'OT' | 'PARQUE_EMPRESA' | 'PERIODO'
  equipoId?: number
  otId?: number
  empresaId?: number
  desde?: string
  hasta?: string
  titulo: string
  resumen: string
  fecha: string
  visibleCliente: boolean
  generadoPor: number
}

export type DireccionFactura = 'POR_COBRAR' | 'POR_PAGAR'
export type TipoDocFactura = 'FACTURA_AFECTA' | 'FACTURA_EXENTA' | 'BOLETA' | 'NOTA_COBRO' | 'PROVEEDOR'
export type EstadoFactura = 'PENDIENTE' | 'ABONADA' | 'PAGADA' | 'ANULADA'
export type MetodoPago = 'TRANSFERENCIA' | 'EFECTIVO' | 'TARJETA' | 'CHEQUE'

export interface FacturaCuenta {
  id: number
  folio: string
  direccion: DireccionFactura
  tipoDoc: TipoDocFactura
  empresaId?: number
  usuarioId?: number
  otId?: number
  cotizacionId?: number
  contraparteNombre: string
  contraparteRut: string
  concepto: string
  categoria: string
  fechaEmision: string
  fechaVencimiento: string
  montoNeto: number
  montoIva: number
  montoTotal: number
  montoPagado: number
  estado: EstadoFactura
  metodoPago?: MetodoPago
  fechaUltimoPago?: string
  notas?: string
}

export type RubroMovimiento =
  | 'EQUIPOS'
  | 'HERRAMIENTAS'
  | 'REPUESTOS'
  | 'INSUMOS'
  | 'SOFTWARE'
  | 'OPERACION'
  | 'INGRESO_OT'
  | 'INGRESO_CONVENIO'
  | 'CAPITAL'

export interface MovimientoCaja {
  id: number
  fecha: string
  tipo: 'INGRESO' | 'EGRESO'
  rubro?: RubroMovimiento
  categoria: string
  concepto: string
  itemComprado?: string
  cantidad?: number
  contraparte: string
  monto: number
  metodo: MetodoPago
  nroDocumento?: string
  conciliadoBanco?: boolean
  facturaId?: number
  otId?: number
}

export interface BancoConexion {
  conectado: boolean
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  titular: string
  rutTitular: string
  proveedorApi: 'FINTOC_OPEN_BANKING' | 'CARTOLA_CSV' | 'CORREO_NOTIFICACIONES'
  ultimaSincronizacion: string
}

export type CategoriaInventario =
  | 'HERRAMIENTA'
  | 'LICENCIA_SOFTWARE'
  | 'LICENCIA'
  | 'REPUESTO'
  | 'INSUMO'
  | 'EQUIPO_INTERNO'

export type EstadoHerramienta = 'OPERATIVO' | 'EN_TERRENO' | 'MANTENCION' | 'BAJA'

export type TipoLicenciaSoftware =
  | 'VOLUMEN_CORPORATIVO'
  | 'SUSCRIPCION_ANUAL'
  | 'OEM_RETAIL'
  | 'PERPETUA'

export interface ItemInventario {
  id: number
  codigo: string
  categoria: CategoriaInventario
  nombre: string
  marcaModelo: string
  descripcion?: string
  /** Cantidad total comprada o cupos totales de licencia */
  stockActual: number
  /** En licencias: cupos ya activados/usados; en herramientas/repuestos: unidades en uso o reservadas */
  enUso?: number
  stockMinimo: number
  unidad: string
  costoUnitario: number
  precioVentaSugerido?: number
  proveedor: string
  fechaUltimaCompra: string
  nroFacturaCompra?: string
  ubicacion: string
  responsableId?: number
  estadoFisico?: EstadoHerramienta
  /** Campos específicos para Licencias de Software */
  tipoLicencia?: TipoLicenciaSoftware
  claveLicencia?: string
  cuentaAsociada?: string
  fechaVencimientoLicencia?: string
  asignadoAClientes?: string[]
}

export type TipoProyectoWeb =
  | 'PAGINA_WEB_CORPORATIVA'
  | 'TIENDA_ECOMMERCE'
  | 'LANDING_PAGE'
  | 'SOFTWARE_A_MEDIDA'
  | 'MANTENCION_WEB'
  | 'APP_MOVIL'
  | 'INFRAESTRUCTURA_REDES'
  | 'CONSULTORIA_SISTEMAS'

export type ModalidadEjecucion =
  | 'SOLO_PCG'
  | 'CON_EMPRESA_EXTERNA'
  | 'SUBCONTRATO_EXTERNO'

export type EstadoCobroProyecto = 'PAGADO' | 'ANTICIPO_50' | 'PENDIENTE' | 'EN_CUOTAS'

export type EstadoProyectoWeb =
  | 'EN_DESARROLLO'
  | 'PRODUCCION_ACTIVO'
  | 'MANTENCION_ACTIVA'
  | 'PENDIENTE_RENOVACION'
  | 'ENTREGADO'
  | 'PAUSADO'

export interface PersonaExternaParticipante {
  id?: string
  nombre: string
  rolOParte: string
  empresa?: string
  contacto?: string
}

export interface ParticipanteProyecto {
  usuarioId: number
  rolEnProyecto: string
}

export interface EmpresaExternaColab {
  nombre: string
  rut?: string
  rolOParte: string
  costoPagado?: number
  personasParticipantes?: PersonaExternaParticipante[]
}

export interface ProyectoWebSoftware {
  id: number
  codigo: string
  empresaId?: number
  usuarioId?: number
  clienteNombre: string
  tipo: TipoProyectoWeb
  nombreProyecto: string
  descripcion?: string
  urlDominio?: string
  stackTecnologico?: string
  hostingProveedor?: string
  /** Monto en el cual se vendió el proyecto ($ CLP) */
  valorProyecto: number
  /** Monto efectivamente cobrado */
  montoCobrado?: number
  estadoCobro?: EstadoCobroProyecto
  incluyeMantencionWeb: boolean
  planMantencion?: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'SIN_MENSUALIDAD'
  valorMantencion: number
  fechaInicio: string
  fechaEntrega?: string
  proximaMantencionWeb?: string
  vencimientoDominioHosting?: string
  estado: EstadoProyectoWeb
  /** Líder técnico responsable en PCG SPA */
  responsableId: number
  /** Miembros del equipo interno de PCG SPA que participaron */
  participantesIds?: number[]
  participantesDetalle?: ParticipanteProyecto[]
  /** Personas o colaboradores externos que participaron en el proyecto (no son trabajadores de PCG) */
  personasExternas?: PersonaExternaParticipante[]
  /** Si fue ejecutado solo por PCG SPA o con una empresa externa */
  modalidadEjecucion?: ModalidadEjecucion
  empresaExterna?: EmpresaExternaColab
  notas?: string
}

export interface DB {
  version: number
  usuarios: Usuario[]
  empresas: Empresa[]
  equipos: Equipo[]
  intervenciones: Intervencion[]
  tickets: Ticket[]
  servicios: Servicio[]
  paquetes: Paquete[]
  cotizaciones: Cotizacion[]
  ots: OT[]
  tareas: Tarea[]
  programas: Programa[]
  /** claves "equipoId|fechaProgramada" de alertas ya enviadas o agendadas */
  alertasEnviadas: Record<string, 'ENVIADA' | 'AGENDADA'>
  correos: Correo[]
  informes: Informe[]
  facturas: FacturaCuenta[]
  movimientos: MovimientoCaja[]
  inventario: ItemInventario[]
  proyectosWeb: ProyectoWebSoftware[]
  bancoConexion?: BancoConexion
  config: {
    razonSocial: string
    giro: string
    rut: string
    telefono: string
    email: string
    condPago: string
    condPlazo: string
    condValidezDias: number
    condGarantiaDias: number
  }
  descuentos: { min: number; max: number | null; pct: number }[]
  seq: Record<string, number>
}

