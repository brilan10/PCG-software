import type {
  CategoriaInventario,
  EstadoCobroProyecto,
  EstadoProyectoWeb,
  ModalidadEjecucion,
  ProyectoWebSoftware,
  RubroMovimiento,
  TipoProyectoWeb,
} from './types'

/** Metadatos de categorías de inventario (separados del componente para no romper Fast Refresh de Vite). */
export const CATEGORIA_INV_META: Record<
  CategoriaInventario,
  {
    label: string
    short: string
    icon: string
    tone: 'violet' | 'blue' | 'amber' | 'green' | 'slate'
    rubroCaja: RubroMovimiento
    prefix: string
  }
> = {
  HERRAMIENTA: {
    label: 'Herramientas de Taller y Precisión (Destornilladores, Soldadura, Testers)',
    short: 'Herramientas',
    icon: '🛠️',
    tone: 'violet',
    rubroCaja: 'HERRAMIENTAS',
    prefix: 'INV-HER',
  },
  LICENCIA_SOFTWARE: {
    label: 'Licencias de Software & Suscripciones (Office, Windows, Antivirus, Adobe)',
    short: 'Licencias Software',
    icon: '💿',
    tone: 'blue',
    rubroCaja: 'SOFTWARE',
    prefix: 'INV-LIC',
  },
  REPUESTO: {
    label: 'Repuestos y Componentes Hardware (SSD, RAM, Fuentes, Pantallas)',
    short: 'Repuestos HW',
    icon: '🔩',
    tone: 'amber',
    rubroCaja: 'REPUESTOS',
    prefix: 'INV-REP',
  },
  INSUMO: {
    label: 'Insumos de Taller y Papelería Diseño (Pasta térmica, Alcohol, Tarjetas)',
    short: 'Insumos / Papelería',
    icon: '🧴',
    tone: 'green',
    rubroCaja: 'INSUMOS',
    prefix: 'INV-INS',
  },
  EQUIPO_INTERNO: {
    label: 'Equipos y Activos Internos de PCG SPA',
    short: 'Equipos Internos',
    icon: '💻',
    tone: 'slate',
    rubroCaja: 'EQUIPOS',
    prefix: 'INV-EQP',
  },
}

export const TIPO_PROYECTO_WEB_META: Record<
  TipoProyectoWeb,
  { label: string; short: string; icon: string; tone: 'blue' | 'violet' | 'green' | 'amber' }
> = {
  PAGINA_WEB_CORPORATIVA: { label: 'Página Web Corporativa + SEO', short: 'Página Web Corp.', icon: '🌐', tone: 'blue' },
  TIENDA_ECOMMERCE: { label: 'Tienda E-Commerce / Catálogo Online', short: 'E-Commerce', icon: '🛒', tone: 'green' },
  LANDING_PAGE: { label: 'Landing Page Comercial / Captación', short: 'Landing Page', icon: '🚀', tone: 'amber' },
  SOFTWARE_A_MEDIDA: { label: 'Software / Sistema Web a Medida', short: 'Software a Medida', icon: '💻', tone: 'violet' },
  MANTENCION_WEB: { label: 'Plan Mantención de Página Web & Hosting', short: 'Mantención Web', icon: '🔧', tone: 'green' },
  APP_MOVIL: { label: 'Aplicación Móvil (iOS / Android)', short: 'App Móvil', icon: '📱', tone: 'violet' },
  INFRAESTRUCTURA_REDES: { label: 'Proyecto Infraestructura / Servidores / Redes TI', short: 'Infraestructura TI', icon: '📡', tone: 'blue' },
  CONSULTORIA_SISTEMAS: { label: 'Consultoría / Auditoría de Sistemas', short: 'Consultoría TI', icon: '📑', tone: 'amber' },
}

export const MODALIDAD_EJECUCION_META: Record<
  ModalidadEjecucion,
  { label: string; short: string; icon: string; tone: 'green' | 'blue' | 'amber' }
> = {
  SOLO_PCG: {
    label: '100% Desarrollado y Ejecutado por PCG SPA',
    short: 'Solo PCG SPA',
    icon: '⚡',
    tone: 'green',
  },
  CON_EMPRESA_EXTERNA: {
    label: 'Desarrollado en Alianza / Consorcio con Empresa Externa',
    short: 'Alianza Externa',
    icon: '🤝',
    tone: 'blue',
  },
  SUBCONTRATO_EXTERNO: {
    label: 'Parte del proyecto subcontratada a Empresa / Profesional Externo',
    short: 'Subcontrato Externo',
    icon: '💼',
    tone: 'amber',
  },
}

export const ESTADO_COBRO_META: Record<
  EstadoCobroProyecto,
  { label: string; tone: 'green' | 'blue' | 'amber' | 'slate' }
> = {
  PAGADO: { label: '✓ 100% Pagado', tone: 'green' },
  ANTICIPO_50: { label: '⏳ Anticipo 50% Recibido', tone: 'blue' },
  EN_CUOTAS: { label: '📅 Pago en Cuotas', tone: 'amber' },
  PENDIENTE: { label: '⚠️ Cobro Pendiente', tone: 'slate' },
}

export const ESTADO_PROYECTO_WEB_META: Record<
  EstadoProyectoWeb,
  { label: string; tone: 'blue' | 'green' | 'violet' | 'amber' | 'slate' }
> = {
  EN_DESARROLLO: { label: '🛠️ En Desarrollo / QA', tone: 'blue' },
  PRODUCCION_ACTIVO: { label: '🚀 En Producción (Online)', tone: 'green' },
  MANTENCION_ACTIVA: { label: '⚡ Con Mantención Web Activa', tone: 'violet' },
  PENDIENTE_RENOVACION: { label: '⚠️ Por Renovar Hosting / Mantención', tone: 'amber' },
  ENTREGADO: { label: '✓ Proyecto Entregado Conforme', tone: 'green' },
  PAUSADO: { label: '⏸️ Pausado', tone: 'slate' },
}

/** Proyectos web/software asociados a una empresa (por empresaId o por nombre exacto). */
export function proyectosDeEmpresa(
  proyectos: ProyectoWebSoftware[] | undefined,
  empresaId: number,
  razonSocial: string,
): ProyectoWebSoftware[] {
  const rs = razonSocial.trim().toLowerCase()
  return (proyectos ?? []).filter(
    (p) => p.empresaId === empresaId || (!p.empresaId && p.clienteNombre.trim().toLowerCase() === rs),
  )
}

/** Monto recurrente de mantención web de una lista de proyectos (excluye pausados). */
export function recurrenteWeb(proyectos: ProyectoWebSoftware[]): number {
  return proyectos
    .filter((p) => p.incluyeMantencionWeb && p.estado !== 'PAUSADO')
    .reduce((acc, p) => acc + p.valorMantencion, 0)
}

