import type { DB, Equipo, ItemCot, Cotizacion } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => isoDate(new Date())

const parse = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (iso: string, n: number) => {
  const d = parse(iso)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

export const addMonths = (iso: string, n: number) => {
  const d = parse(iso)
  d.setMonth(d.getMonth() + n)
  return isoDate(d)
}

export const diffDays = (a: string, b: string) =>
  Math.round((parse(a).getTime() - parse(b).getTime()) / 86400000)

export const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

export const fmtFecha = (iso?: string) => {
  if (!iso) return '—'
  const d = parse(iso)
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

export const fmtFechaHora = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

/** Genera el siguiente código correlativo, ej. TCK-2026-0003. */
export function nextCode(db: DB, prefix: string, pads = 4) {
  const year = new Date().getFullYear()
  const key = `${prefix}-${year}`
  db.seq[key] = (db.seq[key] ?? 0) + 1
  return `${prefix}-${year}-${String(db.seq[key]).padStart(pads, '0')}`
}

export function nextId(list: { id: number }[]) {
  return list.reduce((m, x) => Math.max(m, x.id), 0) + 1
}

export function normRut(r: string) {
  return r.replace(/[.\s-]/g, '').toLowerCase()
}

// ---------- Alertas preventivas ----------
export interface AlertaCalc {
  key: string
  empresaId: number
  equipoId: number
  programada: string
  aviso: string
  diasRestantes: number
  estado: 'PENDIENTE' | 'ENVIADA' | 'AGENDADA'
  vencida: boolean
  /** true si ya llegó la fecha de aviso */
  debeAvisar: boolean
}

export function calcAlertas(db: DB): AlertaCalc[] {
  const hoy = today()
  const out: AlertaCalc[] = []
  for (const p of db.programas) {
    if (!p.activo) continue
    for (const e of db.equipos.filter((x) => x.empresaId === p.empresaId && x.proximaMantencion)) {
      const programada = e.proximaMantencion!
      const aviso = addDays(programada, -p.diasAviso)
      const key = `${e.id}|${programada}`
      out.push({
        key,
        empresaId: p.empresaId,
        equipoId: e.id,
        programada,
        aviso,
        diasRestantes: diffDays(programada, hoy),
        estado: db.alertasEnviadas[key] ?? 'PENDIENTE',
        vencida: diffDays(programada, hoy) < 0,
        debeAvisar: diffDays(hoy, aviso) >= 0,
      })
    }
  }
  return out.sort((a, b) => a.programada.localeCompare(b.programada))
}

export function semaforo(e: Pick<Equipo, 'proximaMantencion'>) {
  if (!e.proximaMantencion) return { color: 'slate', label: 'Sin fecha' } as const
  const d = diffDays(e.proximaMantencion, today())
  if (d < 0) return { color: 'red', label: `Vencida hace ${-d} d` } as const
  if (d <= 30) return { color: 'amber', label: `En ${d} d` } as const
  return { color: 'green', label: `En ${d} d` } as const
}

// ---------- Cotizaciones ----------
export function reglaDescuento(db: DB, cant: number) {
  const r = db.descuentos.find((x) => cant >= x.min && (x.max === null || cant <= x.max))
  return r?.pct ?? 0
}

export function calcCot(
  db: DB,
  items: ItemCot[],
  cant: number,
  modo: Cotizacion['modo'],
  criterio?: { pct?: number; monto?: number },
): Pick<Cotizacion, 'subtotalNormal' | 'descuentoMonto' | 'total'> {
  const subtotalNormal = items.reduce((s, i) => s + i.normal * i.cantidad, 0)
  const base =
    modo === 'CONVENIO'
      ? items.reduce((s, i) => s + i.convenio * i.cantidad, 0)
      : modo === 'VOLUMEN'
        ? Math.round(subtotalNormal * (1 - reglaDescuento(db, cant) / 100))
        : subtotalNormal
  const trasPct = criterio?.pct ? Math.round(base * (1 - Math.min(100, Math.max(0, criterio.pct)) / 100)) : base
  const total = Math.max(0, trasPct - (criterio?.monto ?? 0))
  return { subtotalNormal, descuentoMonto: Math.max(0, subtotalNormal - total), total }
}

export const TAREAS_MANTENCION: { titulo: string; horas: number }[] = [
  { titulo: 'Recepción y fotos del estado físico', horas: 0.5 },
  { titulo: 'Diagnóstico y temperaturas iniciales', horas: 0.5 },
  { titulo: 'Desarme y limpieza profunda', horas: 1.5 },
  { titulo: 'Lubricación de ventiladores y pasta térmica', horas: 0.5 },
  { titulo: 'SO, drivers y optimización (si aplica)', horas: 1.5 },
  { titulo: 'QA: pruebas y temperaturas finales', horas: 0.5 },
  { titulo: 'Registro en hoja de vida e informe', horas: 0.5 },
  { titulo: 'Entrega al cliente', horas: 0.25 },
]

export const TAREAS_PROYECTO_WEB: { titulo: string; horas: number }[] = [
  { titulo: 'Fase 1: Levantamiento, requerimientos y briefing de contenidos', horas: 3 },
  { titulo: 'Fase 2: Arquitectura de información y wireframes UI/UX', horas: 5 },
  { titulo: 'Fase 3: Diseño visual interactivo en Figma y aprobación de cliente', horas: 8 },
  { titulo: 'Fase 4: Maquetación responsive frontend (HTML5/Tailwind/React)', horas: 12 },
  { titulo: 'Fase 5: Integración Backend, base de datos, CMS o formularios', horas: 10 },
  { titulo: 'Fase 6: Pasarela de pago Webpay / E-commerce (si aplica)', horas: 6 },
  { titulo: 'Fase 7: Pruebas QA multidispositivo, SEO y optimización de velocidad', horas: 4 },
  { titulo: 'Fase 8: Configuración Hosting, DNS, SSL y Despliegue en producción', horas: 3 },
  { titulo: 'Fase 9: Capacitación de administración al cliente y entrega final', horas: 2 },
]

export const TAREAS_SOFTWARE_MEDIDA: { titulo: string; horas: number }[] = [
  { titulo: 'Fase 1: Análisis de requerimientos funcionales y reglas de negocio', horas: 4 },
  { titulo: 'Fase 2: Diseño de arquitectura, diagrama ER y esquema de base de datos', horas: 6 },
  { titulo: 'Fase 3: Desarrollo de API Backend, autenticación y seguridad', horas: 14 },
  { titulo: 'Fase 4: Desarrollo de vistas frontend, tablas, formularios y lógica', horas: 18 },
  { titulo: 'Fase 5: Pruebas de integración, control de errores y validaciones QA', horas: 8 },
  { titulo: 'Fase 6: Puesta en marcha en servidor staging / producción', horas: 4 },
  { titulo: 'Fase 7: Documentación técnica, manual de usuario y traspaso', horas: 3 },
]

export const TAREAS_DISENO_BRANDING: { titulo: string; horas: number }[] = [
  { titulo: 'Fase 1: Briefing de marca, valores y análisis visual de competencia', horas: 2 },
  { titulo: 'Fase 2: Moodboard conceptual, paletas cromáticas y tipografías', horas: 3 },
  { titulo: 'Fase 3: Diseño de propuestas de isotipo / logotipo vectorial', horas: 6 },
  { titulo: 'Fase 4: Ronda de feedback, ajustes y aprobación de la identidad', horas: 2 },
  { titulo: 'Fase 5: Diseño de papelería, tarjetas de presentación y mockups', horas: 4 },
  { titulo: 'Fase 6: Manual de normas gráficas y exportación de activos (SVG/AI/PNG)', horas: 3 },
]

export const CHECKLIST_MANT = [
  'Desarme completo',
  'Limpieza profunda (aire / ultrasónica)',
  'Lubricación de ventiladores',
  'Cambio de pasta térmica premium',
  'Limpieza antiestática de fuente de poder',
  'Instalación / optimización de SO',
  'Actualización de drivers y programas base',
  'Antivirus instalado y activado',
  'Pruebas de estrés y temperaturas finales',
]

