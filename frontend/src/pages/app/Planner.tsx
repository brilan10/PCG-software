import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useScope } from '@/lib/scope'
import { cambiarEstadoOT, crearOT, resolverORegistrarCliente } from '@/lib/actions'
import type { DatosClienteForm } from '@/lib/actions'
import { ESTADOS_OT, ESTADO_OT_LABEL } from '@/lib/types'
import type { OT, Prioridad } from '@/lib/types'
import {
  addDays, calcAlertas, diffDays, fmtCLP, fmtFecha, fmtFechaHora, isoDate, today,
  TAREAS_MANTENCION, TAREAS_PROYECTO_WEB, TAREAS_SOFTWARE_MEDIDA, TAREAS_DISENO_BRANDING,
} from '@/lib/util'
import { otTone } from '@/lib/tones'
import OTDrawer from '@/components/OTDrawer'
import OTSchedulerCalendar from '@/components/OTSchedulerCalendar'
import type { OTScheduleValue } from '@/components/OTSchedulerCalendar'
import SelectorCarteraCliente from '@/components/SelectorCarteraCliente'
import AgendarHoraModal from '@/components/AgendarHoraModal'
import { Avatar, Badge, Btn, Card, Empty, Field, Modal, PageHeader, Table, cx, inputCls, prioTone, td } from '@/components/kit'

type View = 'todas' | 'tablero' | 'trabajador' | 'calendario' | 'gantt' | 'lista'
const VIEWS: [View, string][] = [
  ['todas', '📋 Todas las OT'],
  ['tablero', '▦ Tablero Kanban'],
  ['trabajador', '👷 Por trabajador'],
  ['calendario', '📅 Calendario'],
  ['gantt', '━ Línea de tiempo'],
  ['lista', '≡ Tabla'],
]

export default function OTPage() {
  const { user } = useStore()
  return user!.rol === 'CLIENTE_EMPRESA' || user!.rol === 'CLIENTE_PERSONA' ? <ClientOTs /> : <Planner />
}

function Planner() {
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<View>('todas')
  const [fTec, setFTec] = useState('')
  const [fPrio, setFPrio] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fTipoCli, setFTipoCli] = useState<'' | 'B2B' | 'NATURAL'>('')
  const [fCategoria, setFCategoria] = useState<'' | 'PROYECTOS' | 'BRANDING' | 'MANTENCION'>('')
  const [fProyecto, setFProyecto] = useState<string>(() => params.get('proyectoId') ?? '')
  const [q, setQ] = useState('')
  const [nueva, setNueva] = useState(() => params.get('nueva') === '1')
  const [agendarHora, setAgendarHora] = useState(() => params.get('agendar') === '1')
  const canManage = user!.rol === 'ADMIN' || user!.rol === 'DOC_PROCESS'
  const openId = params.get('ot') ? Number(params.get('ot')) : null
  const open = (id: number | null) => setParams(id ? { ot: String(id) } : {}, { replace: true })

  const ots = useMemo(
    () =>
      sc.ots.filter((o) => {
        const emp = db.empresas.find((e) => e.id === o.empresaId)
        const cli = db.usuarios.find((u) => u.id === o.usuarioId)
        const proy = o.proyectoId ? db.proyectosWeb?.find((p) => p.id === o.proyectoId) : undefined
        const matchTec = !fTec || (fTec === '0' ? !o.tecnicoId : o.tecnicoId === Number(fTec))
        const matchPrio = !fPrio || o.prioridad === fPrio
        const matchEst =
          !fEstado ||
          (fEstado === 'ACTIVAS'
            ? o.estado !== 'ENTREGADO' && o.estado !== 'CANCELADA'
            : o.estado === fEstado)
        const matchTipoCli =
          !fTipoCli || (fTipoCli === 'B2B' ? Boolean(o.empresaId) : !o.empresaId)
        const matchCat =
          !fCategoria ||
          (fCategoria === 'PROYECTOS'
            ? o.tipo === 'WEB_SOFTWARE' || o.tipo === 'DESARROLLO' || Boolean(o.proyectoId)
            : fCategoria === 'BRANDING'
              ? o.tipo === 'DISENO_BRANDING'
              : o.tipo === 'MANTENIMIENTO' || o.tipo === 'UPGRADE' || o.tipo === 'CONSULTORIA')
        const matchProy = !fProyecto || String(o.proyectoId) === fProyecto
        const matchQ =
          !q ||
          `${o.codigo} ${o.titulo} ${emp?.razonSocial ?? ''} ${cli?.nombre ?? ''} ${o.horaCita ?? ''} ${proy?.nombreProyecto ?? ''} ${proy?.codigo ?? ''}`
            .toLowerCase()
            .includes(q.toLowerCase())
        return matchTec && matchPrio && matchEst && matchTipoCli && matchCat && matchProy && matchQ
      }),
    [sc.ots, fTec, fPrio, fEstado, fTipoCli, fCategoria, fProyecto, q, db.empresas, db.usuarios, db.proyectosWeb],
  )

  const proyectosCount = sc.ots.filter((o) => o.tipo === 'WEB_SOFTWARE' || o.tipo === 'DESARROLLO' || Boolean(o.proyectoId)).length
  const brandingCount = sc.ots.filter((o) => o.tipo === 'DISENO_BRANDING').length
  const mantCount = sc.ots.filter((o) => o.tipo === 'MANTENIMIENTO' || o.tipo === 'UPGRADE' || o.tipo === 'CONSULTORIA').length

  return (
    <>
      <PageHeader
        title="Órdenes de trabajo (Todas las OT)"
        subtitle={`Visualización completa de las ${sc.ots.length} OT del sistema: Proyectos Web, Desarrollo, Branding y Mantención`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="secondary"
              onClick={() => setAgendarHora(true)}
            >
              📅 Agendar Hora (Mantención / Laboratorio)
            </Btn>
            {canManage && <Btn onClick={() => setNueva(true)}>+ Nueva OT / Planificar Fases</Btn>}
          </div>
        }
      />

      {/* Selector de Categoría principal: Proyectos Web, Branding, Mantención */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 pb-3">
        <span className="mr-1 text-xs font-bold text-slate-500">Filtrar por Especialidad:</span>
        <button
          type="button"
          onClick={() => { setFCategoria(''); setFProyecto('') }}
          className={cx(
            'rounded-xl border px-3 py-1.5 text-xs font-extrabold transition',
            fCategoria === '' && fProyecto === ''
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          🌐 Todas las Categorías ({sc.ots.length})
        </button>
        <button
          type="button"
          onClick={() => setFCategoria(fCategoria === 'PROYECTOS' ? '' : 'PROYECTOS')}
          className={cx(
            'rounded-xl border px-3 py-1.5 text-xs font-extrabold transition',
            fCategoria === 'PROYECTOS'
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50',
          )}
        >
          🚀 Proyectos Web & Software ({proyectosCount})
        </button>
        <button
          type="button"
          onClick={() => setFCategoria(fCategoria === 'BRANDING' ? '' : 'BRANDING')}
          className={cx(
            'rounded-xl border px-3 py-1.5 text-xs font-extrabold transition',
            fCategoria === 'BRANDING'
              ? 'border-violet-600 bg-violet-600 text-white shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-violet-50',
          )}
        >
          🎨 Diseño & Branding ({brandingCount})
        </button>
        <button
          type="button"
          onClick={() => setFCategoria(fCategoria === 'MANTENCION' ? '' : 'MANTENCION')}
          className={cx(
            'rounded-xl border px-3 py-1.5 text-xs font-extrabold transition',
            fCategoria === 'MANTENCION'
              ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-amber-50',
          )}
        >
          🛠️ Mantención Hardware ({mantCount})
        </button>

        {db.proyectosWeb && db.proyectosWeb.length > 0 && (
          <select
            className={`${inputCls} !w-56 !py-1 text-xs font-bold text-indigo-900 border-indigo-200 bg-indigo-50/50`}
            value={fProyecto}
            onChange={(e) => {
              setFProyecto(e.target.value)
              if (e.target.value) setFCategoria('')
            }}
          >
            <option value="">📁 Filtrar por Proyecto Web...</option>
            {db.proyectosWeb.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombreProyecto}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Resumen rápido por estado para filtrar en 1 clic */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFEstado('')}
          className={cx(
            'rounded-xl border px-3 py-1.5 text-xs font-extrabold transition',
            fEstado === ''
              ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          Todas ({sc.ots.length})
        </button>
        {ESTADOS_OT.map((st) => {
          const count = sc.ots.filter((o) => o.estado === st).length
          const active = fEstado === st
          return (
            <button
              key={st}
              type="button"
              onClick={() => setFEstado(active ? '' : st)}
              className={cx(
                'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
                active
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {ESTADO_OT_LABEL[st]} ({count})
            </button>
          )
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
          {VIEWS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={cx(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                view === k ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <input className={`${inputCls} !w-52`} placeholder="Buscar OT, cliente u hora…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} !w-44`} value={fTipoCli} onChange={(e) => setFTipoCli(e.target.value as '' | 'B2B' | 'NATURAL')}>
          <option value="">Todos los clientes</option>
          <option value="B2B">🏢 Solo Empresas B2B</option>
          <option value="NATURAL">👤 Solo Clientes Naturales</option>
        </select>
        <select className={`${inputCls} !w-44`} value={fTec} onChange={(e) => setFTec(e.target.value)}>
          <option value="">Todos los técnicos</option>
          <option value="0">Sin asignar</option>
          {db.usuarios.filter((u) => u.rol === 'WORKER').map((w) => <option key={w.id} value={w.id}>{w.nombre}</option>)}
        </select>
        <select className={`${inputCls} !w-36`} value={fPrio} onChange={(e) => setFPrio(e.target.value)}>
          <option value="">Toda prioridad</option>
          {['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].map((p) => <option key={p}>{p}</option>)}
        </select>
        <span className="ml-auto rounded-full bg-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700">
          Mostrando {ots.length} de {sc.ots.length} OT
        </span>
      </div>

      {view === 'todas' && <AllOTsView ots={ots} open={open} />}
      {view === 'tablero' && <Board ots={ots} open={open} />}
      {view === 'trabajador' && <Lanes ots={ots} open={open} />}
      {view === 'calendario' && <CalendarView ots={ots} open={open} />}
      {view === 'gantt' && <Gantt ots={ots} open={open} />}
      {view === 'lista' && <ListView ots={ots} open={open} />}

      <OTDrawer otId={openId} onClose={() => open(null)} />
      {agendarHora && (
        <AgendarHoraModal
          onClose={() => setAgendarHora(false)}
          onSuccess={(newOtId) => open(newOtId)}
        />
      )}
      {nueva && (
        <NuevaOT
          proyectoIdInicial={params.get('proyectoId') ? Number(params.get('proyectoId')) : undefined}
          onClose={() => {
            setNueva(false)
            if (params.get('nueva') || params.get('proyectoId')) {
              setParams({}, { replace: true })
            }
          }}
          onCreate={(d) => {
            mutate((x) => {
              const res = resolverORegistrarCliente(x, d.clienteForm)
              crearOT(x, {
                ...d,
                usuarioId: res.usuarioId,
                empresaId: res.empresaId,
                creadoPor: user!.id,
              })
            })
            setNueva(false)
            if (params.get('nueva') || params.get('proyectoId')) {
              setParams({}, { replace: true })
            }
          }}
        />
      )}
    </>
  )
}

// ---------- Vista Completa de Todas las OT ----------
function AllOTsView({ ots, open }: { ots: OT[]; open: (id: number) => void }) {
  if (ots.length === 0) {
    return <Empty>No hay órdenes de trabajo con los filtros seleccionados.</Empty>
  }
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...ots].reverse().map((o) => (
        <OTCard key={o.id} ot={o} open={open} showStateBadge />
      ))}
    </div>
  )
}

// ---------- Tarjeta ----------
function OTCard({
  ot,
  open,
  draggable,
  onDragStart,
  showStateBadge,
}: {
  ot: OT
  open: (id: number) => void
  draggable?: boolean
  onDragStart?: (e: DragEvent) => void
  showStateBadge?: boolean
}) {
  const { db, user, mutate } = useStore()
  const canManage = user?.rol === 'ADMIN' || user?.rol === 'DOC_PROCESS'
  const tec = db.usuarios.find((u) => u.id === ot.tecnicoId)
  const emp = db.empresas.find((e) => e.id === ot.empresaId)
  const cli = db.usuarios.find((u) => u.id === ot.usuarioId)
  const proy = ot.proyectoId ? db.proyectosWeb?.find((p) => p.id === ot.proyectoId) : undefined
  const tareas = db.tareas.filter((t) => t.otId === ot.id)
  const hechas = tareas.filter((t) => t.estado === 'HECHA').length
  const pct = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : (ot.estado === 'ENTREGADO' ? 100 : 0)
  const atrasada = ot.fin < today() && ot.estado !== 'LISTO' && ot.estado !== 'ENTREGADO' && ot.estado !== 'CANCELADA'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, scale: 1.01 }}
      draggable={draggable}
      onDragStart={onDragStart as never}
      onClick={() => open(ot.id)}
      className={cx(
        'cursor-pointer rounded-xl border bg-white p-3.5 text-left shadow-sm transition-shadow hover:shadow-md',
        ot.estado === 'CANCELADA'
          ? 'border-rose-200 bg-rose-50/40 opacity-80'
          : atrasada
            ? 'border-rose-300 ring-1 ring-rose-200'
            : 'border-slate-200/90 hover:border-emerald-300',
        draggable && 'active:cursor-grabbing',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-xs font-bold text-indigo-700">{ot.codigo}</span>
        <div className="flex items-center gap-1">
          {showStateBadge && <Badge tone={otTone[ot.estado]}>{ESTADO_OT_LABEL[ot.estado]}</Badge>}
          <Badge tone={prioTone[ot.prioridad]}>{ot.prioridad}</Badge>
        </div>
      </div>
      <div className={cx('mt-1 text-sm font-semibold leading-snug text-slate-900', ot.estado === 'CANCELADA' && 'line-through text-slate-500')}>
        {ot.titulo}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
        <span className={cx('rounded-md px-1.5 py-0.5 text-[10px] font-bold', emp ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700')}>
          {emp ? '🏢 B2B' : '👤 Natural'}
        </span>
        <span className="font-medium">{emp?.razonSocial ?? cli?.nombre}</span>
      </div>
      {proy && (
        <Link
          to="/app/proyectos"
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/90 px-2 py-0.5 text-[11px] font-bold text-indigo-900 shadow-2xs hover:bg-indigo-100 transition"
        >
          <span>🚀</span>
          <span className="truncate">{proy.codigo} · {proy.nombreProyecto}</span>
          <span className="ml-auto text-[10px] text-indigo-600">Ver ↗</span>
        </Link>
      )}
      {ot.horaCita && (
        <div className="mt-1.5 flex flex-col gap-0.5 rounded-lg border border-emerald-200 bg-emerald-50/90 px-2 py-1 text-[11px] font-bold text-emerald-800">
          <div>🕒 Hora agendada: {ot.horaCita} hrs · {ot.modalidadAtencion === 'DOMICILIO' ? '🚗 Domicilio' : '🏢 Laboratorio'}</div>
          {ot.direccionRetiro && <div className="text-[10px] font-semibold text-slate-600">📍 {ot.direccionRetiro}</div>}
        </div>
      )}
      {tareas.length > 0 && (
        <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/90 p-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600">Planner ({hechas}/{tareas.length} hechas)</span>
            <span className="font-extrabold text-emerald-700">{pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className={atrasada ? 'font-semibold text-rose-600' : 'text-slate-400'}>{atrasada ? '⚠ Atrasada · ' : ''}{fmtFecha(ot.inicio)} → {fmtFecha(ot.fin)}</span>
        {tec ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <Avatar name={tec.nombre} color={tec.color} size={22} />
            <span className="max-w-24 truncate">{tec.nombre.split(' ')[0]}</span>
          </span>
        ) : (
          <span className="text-slate-400">Sin asignar</span>
        )}
      </div>

      {/* Controles rápidos de Admin directamente en la tarjeta */}
      {canManage && ot.estado !== 'ENTREGADO' && ot.estado !== 'CANCELADA' && (
        <div
          className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() =>
              mutate((d) => cambiarEstadoOT(d, ot.id, 'ENTREGADO', `Marcada como Terminada por ${user?.nombre}`))
            }
            className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            ✓ Terminada
          </button>
          <button
            type="button"
            onClick={() =>
              mutate((d) => cambiarEstadoOT(d, ot.id, 'CANCELADA', `Cancelada por ${user?.nombre}`))
            }
            className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100"
          >
            ✕ Cancelar
          </button>
        </div>
      )}
    </motion.div>
  )
}

const colTheme: Record<string, { bg: string; bar: string }> = {
  RECIBIDO: { bg: 'from-sky-50/90 to-slate-100/70 border-sky-200/80', bar: 'from-sky-400 to-blue-600' },
  EN_REVISION: { bg: 'from-indigo-50/90 to-slate-100/70 border-indigo-200/80', bar: 'from-indigo-400 to-violet-600' },
  EN_DESARROLLO: { bg: 'from-fuchsia-50/90 to-slate-100/70 border-fuchsia-200/80', bar: 'from-fuchsia-500 to-purple-600' },
  EN_QA: { bg: 'from-amber-50/90 to-slate-100/70 border-amber-200/80', bar: 'from-amber-400 to-orange-500' },
  LISTO: { bg: 'from-emerald-50/90 to-slate-100/70 border-emerald-200/80', bar: 'from-emerald-400 to-green-600' },
  ENTREGADO: { bg: 'from-teal-50/90 to-slate-100/70 border-teal-200/80', bar: 'from-teal-400 to-cyan-600' },
  CANCELADA: { bg: 'from-rose-50/90 to-slate-100/70 border-rose-200/80', bar: 'from-rose-500 to-red-600' },
}

// ---------- Tablero ----------
function Board({ ots, open }: { ots: OT[]; open: (id: number) => void }) {
  const { user, mutate } = useStore()
  const [over, setOver] = useState<string | null>(null)
  const canMove = (o: OT) => user!.rol !== 'CLIENTE_EMPRESA' && (user!.rol !== 'WORKER' || o.tecnicoId === user!.id)
  return (
    <div className="flex gap-3.5 overflow-x-auto pb-3">
      {ESTADOS_OT.map((estado, idx) => {
        const col = ots.filter((o) => o.estado === estado)
        const th = colTheme[estado]
        return (
          <motion.div
            key={estado}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onDragOver={(e) => { e.preventDefault(); setOver(estado) }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(null)
              const id = Number(e.dataTransfer.getData('text/plain'))
              mutate((d) => {
                const o = d.ots.find((x) => x.id === id)
                if (o && canMove(o)) cambiarEstadoOT(d, id, estado, 'Movida en el tablero')
              })
            }}
            className={cx(
              'w-72 shrink-0 overflow-hidden rounded-2xl border bg-gradient-to-b shadow-xs transition',
              th.bg,
              over === estado && 'ring-2 ring-emerald-500 bg-emerald-50',
            )}
          >
            <div className={cx('h-1.5 w-full bg-gradient-to-r', th.bar)} />
            <div className="p-2.5">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <Badge tone={otTone[estado]}>{ESTADO_OT_LABEL[estado]}</Badge>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-slate-600">{col.length}</span>
              </div>
              <div className="space-y-2.5">
                {col.map((o) => (
                  <OTCard key={o.id} ot={o} open={open} draggable={canMove(o)} onDragStart={(e) => e.dataTransfer.setData('text/plain', String(o.id))} />
                ))}
                {col.length === 0 && <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/50 p-5 text-center text-xs text-slate-400">Arrastra y suelta aquí</div>}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ---------- Por trabajador ----------
function Lanes({ ots, open }: { ots: OT[]; open: (id: number) => void }) {
  const { db } = useStore()
  const lanes = [...db.usuarios.filter((u) => u.rol === 'WORKER' && u.activo).map((w) => ({ w, id: w.id as number | undefined })), { w: undefined, id: undefined }]
  return (
    <div className="space-y-4">
      {lanes.map(({ w, id }) => {
        const mine = ots.filter((o) => o.tecnicoId === id)
        const tareas = db.tareas.filter((t) => t.asignadoId === id && t.estado !== 'HECHA')
        const horas = tareas.reduce((s, t) => s + t.hEst, 0)
        const cap = w?.horasSemanales ?? 40
        const pct = Math.min(100, (horas / cap) * 100)
        return (
          <Card key={id ?? 'none'} className="!p-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
              {w ? <Avatar name={w.nombre} color={w.color} size={32} /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">?</span>}
              <div>
                <div className="text-sm font-semibold">{w?.nombre ?? 'Sin asignar'} ({mine.length} OT)</div>
                <div className="text-xs text-slate-500">{w?.cargo ?? 'OT pendientes de asignación'}</div>
              </div>
              {w && (
                <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                  Carga: {horas.toFixed(1)} h / {cap} h
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className={cx('h-full', pct > 85 ? 'bg-pcg-red' : 'bg-pcg-green')} style={{ width: `${pct}%` }} /></div>
                </div>
              )}
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              {mine.length === 0 ? <div className="text-sm text-slate-400">Sin OT en este filtro.</div> : mine.map((o) => <OTCard key={o.id} ot={o} open={open} showStateBadge />)}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ---------- Calendario ----------
function CalendarView({ ots, open }: { ots: OT[]; open: (id: number) => void }) {
  const { db } = useStore()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const first = new Date(cursor)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset)
  const days = Array.from({ length: 42 }, (_, i) => isoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)))
  const alertas = calcAlertas(db)
  const hoy = today()
  return (
    <Card className="!p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold capitalize">{new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(cursor)}</h3>
        <div className="flex gap-1">
          <Btn size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</Btn>
          <Btn size="sm" variant="secondary" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Hoy</Btn>
          <Btn size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</Btn>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-medium text-slate-500">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth = Number(d.slice(5, 7)) - 1 === cursor.getMonth()
          const list = ots.filter((o) => o.inicio <= d && d <= o.fin)
          const al = alertas.filter((a) => a.programada === d)
          return (
            <div key={d} className={cx('min-h-28 border-b border-r border-slate-100 p-1.5', !inMonth && 'bg-slate-50/60')}>
              <div className={cx('mb-1 text-xs', d === hoy ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-pcg-green font-semibold text-white' : inMonth ? 'text-slate-600' : 'text-slate-300')}>{Number(d.slice(8))}</div>
              <div className="space-y-0.5">
                {list.slice(0, 5).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => open(o.id)}
                    className={cx(
                      'block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition',
                      o.estado === 'ENTREGADO'
                        ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                        : o.estado === 'CANCELADA'
                          ? 'bg-rose-50 text-rose-600 line-through'
                          : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
                    )}
                    title={`${o.codigo} · ${o.horaCita ? `${o.horaCita} hrs · ` : ''}${o.titulo}`}
                  >
                    {o.horaCita && o.inicio === d ? `🕒 ${o.horaCita} · ` : ''}{o.codigo.slice(-4)} · {o.titulo}
                  </button>
                ))}
                {list.length > 5 && <div className="text-[11px] text-slate-400">+{list.length - 5} más</div>}
                {al.length > 0 && <div className="truncate rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800" title="Mantención preventiva sugerida">◔ {al.length} preventiva{al.length > 1 ? 's' : ''}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ---------- Gantt ----------
const barColor: Record<string, string> = {
  RECIBIDO: 'bg-slate-400',
  EN_REVISION: 'bg-blue-500',
  EN_DESARROLLO: 'bg-violet-500',
  EN_QA: 'bg-amber-500',
  LISTO: 'bg-emerald-500',
  ENTREGADO: 'bg-teal-500',
  CANCELADA: 'bg-rose-500',
}

function Gantt({ ots, open }: { ots: OT[]; open: (id: number) => void }) {
  const { db } = useStore()
  const [tareas, setTareas] = useState(true)
  const hoy = today()
  const start = addDays(hoy, -14)
  const span = 56
  const pos = (ini: string, fin: string) => {
    const l = Math.max(0, diffDays(ini, start))
    const r = Math.min(span, diffDays(fin, start) + 1)
    return { left: `${(l / span) * 100}%`, width: `${Math.max(1.2, ((r - l) / span) * 100)}%` }
  }
  const weeks = Array.from({ length: span / 7 }, (_, i) => addDays(start, i * 7))
  return (
    <Card className="!p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold">Línea de tiempo (8 semanas · todas las OT)</h3>
        <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={tareas} onChange={(e) => setTareas(e.target.checked)} /> Mostrar tareas</label>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[260px_1fr] border-b border-slate-100 text-xs text-slate-500">
            <div className="px-4 py-2 font-medium">OT / tarea</div>
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
              {weeks.map((w) => <div key={w} className="border-l border-slate-100 px-2 py-2">{fmtFecha(w).slice(0, 6)}</div>)}
            </div>
          </div>
          {ots.map((o) => {
            const ts = db.tareas.filter((t) => t.otId === o.id && t.inicio && t.limite)
            return (
              <div key={o.id}>
                <GanttRow label={<button onClick={() => open(o.id)} className="truncate text-left text-sm font-medium hover:underline">{o.codigo.slice(-4)} · {o.horaCita ? `(${o.horaCita}) ` : ''}{o.titulo}</button>} hoy={diffDays(hoy, start)} span={span}>
                  <div className={cx('absolute top-2 h-4 rounded', barColor[o.estado])} style={pos(o.inicio, o.fin)} title={`${fmtFecha(o.inicio)} → ${fmtFecha(o.fin)}`} />
                </GanttRow>
                {tareas && ts.map((t) => {
                  const dep = db.tareas.find((x) => x.id === t.dependeDe)
                  return (
                    <GanttRow key={t.id} label={<span className="truncate pl-4 text-xs text-slate-500">{dep ? '↳ ' : '· '}{t.titulo}</span>} hoy={diffDays(hoy, start)} span={span}>
                      <div className={cx('absolute top-3 h-2.5 rounded-sm', t.estado === 'HECHA' ? 'bg-emerald-300' : 'bg-slate-300')} style={pos(t.inicio!, t.limite!)} />
                    </GanttRow>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function GanttRow({ label, children, hoy, span }: { label: React.ReactNode; children: React.ReactNode; hoy: number; span: number }) {
  return (
    <div className="grid grid-cols-[260px_1fr] border-b border-slate-50">
      <div className="flex min-w-0 items-center px-4 py-1.5">{label}</div>
      <div className="relative h-8">
        <div className="absolute inset-y-0 w-px bg-pcg-red/60" style={{ left: `${(hoy / span) * 100}%` }} />
        {children}
      </div>
    </div>
  )
}

// ---------- Lista ----------
function ListView({ ots, open }: { ots: OT[]; open: (id: number) => void }) {
  const { db, user, mutate } = useStore()
  const canManage = user?.rol === 'ADMIN' || user?.rol === 'DOC_PROCESS'
  return (
    <Table head={['OT', 'Título y Modalidad', 'Cliente / Tipo', 'Proyecto / Planner', 'Estado', 'Prioridad', 'Técnico', 'Fecha / Hora Cita', 'Monto', 'Acción rápida Admin']}>
      {[...ots].reverse().map((o) => {
        const emp = db.empresas.find((e) => e.id === o.empresaId)
        const cli = db.usuarios.find((u) => u.id === o.usuarioId)
        const proy = o.proyectoId ? db.proyectosWeb?.find((p) => p.id === o.proyectoId) : undefined
        const tareas = db.tareas.filter((t) => t.otId === o.id)
        const hechas = tareas.filter((t) => t.estado === 'HECHA').length
        const pct = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : (o.estado === 'ENTREGADO' ? 100 : 0)

        return (
          <tr key={o.id} onClick={() => open(o.id)} className="cursor-pointer hover:bg-slate-50">
            <td className={`${td} font-bold text-indigo-700`}>{o.codigo}</td>
            <td className={cx(td, o.estado === 'CANCELADA' && 'line-through text-slate-400')}>
              <div className="font-semibold text-slate-900">{o.titulo}</div>
              {o.horaCita && (
                <div className="text-[11px] font-bold text-emerald-700">
                  🕒 Hora reservada: {o.horaCita} hrs · {o.modalidadAtencion === 'DOMICILIO' ? '🚗 Domicilio' : '🏢 Laboratorio'}
                  {o.direccionRetiro && <span className="block text-[10px] font-normal text-slate-500">📍 {o.direccionRetiro}</span>}
                </div>
              )}
            </td>
            <td className={td}>
              <div className="font-medium text-slate-900">{emp?.razonSocial ?? cli?.nombre}</div>
              <div className="text-[11px] text-slate-500">{emp ? '🏢 Empresa B2B' : '👤 Cliente Natural'}</div>
            </td>
            <td className={td}>
              {proy ? (
                <div className="space-y-1">
                  <Link
                    to="/app/proyectos"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 transition"
                  >
                    <span>🚀</span> {proy.codigo} ↗
                  </Link>
                  <div className="truncate max-w-[150px] text-[11px] text-slate-600 font-medium">{proy.nombreProyecto}</div>
                </div>
              ) : (
                <span className="text-xs text-slate-400">— Hardware / Estándar</span>
              )}
              {tareas.length > 0 && (
                <div className="mt-1.5 space-y-0.5 min-w-[120px]">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{hechas}/{tareas.length} hechas</span>
                    <span className="font-bold text-emerald-700">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </td>
            <td className={td}><Badge tone={otTone[o.estado]}>{ESTADO_OT_LABEL[o.estado]}</Badge></td>
            <td className={td}><Badge tone={prioTone[o.prioridad]}>{o.prioridad}</Badge></td>
            <td className={td}>{db.usuarios.find((u) => u.id === o.tecnicoId)?.nombre ?? '—'}</td>
            <td className={td}>
              <div className="text-xs font-medium text-slate-800">{fmtFecha(o.inicio)} → {fmtFecha(o.fin)}</div>
              {o.horaCita && <div className="text-[11px] text-emerald-700">{o.horaCita} hrs</div>}
            </td>
            <td className={`${td} font-semibold`}>{o.total ? fmtCLP(o.total) : '—'}</td>
            <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
              {canManage ? (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {o.estado !== 'ENTREGADO' && (
                    <Btn
                      size="sm"
                      onClick={() =>
                        mutate((d) => cambiarEstadoOT(d, o.id, 'ENTREGADO', `Marcada como Terminada por ${user?.nombre}`))
                      }
                    >
                      ✓ Terminada
                    </Btn>
                  )}
                  {o.estado !== 'CANCELADA' && (
                    <Btn
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        mutate((d) => cambiarEstadoOT(d, o.id, 'CANCELADA', `Cancelada por ${user?.nombre}`))
                      }
                    >
                      ✕ Cancelar
                    </Btn>
                  )}
                  {(o.estado === 'ENTREGADO' || o.estado === 'CANCELADA') && (
                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        mutate((d) => cambiarEstadoOT(d, o.id, 'EN_REVISION', `Reabierta por ${user?.nombre}`))
                      }
                    >
                      ↺ Reabrir
                    </Btn>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400">Ver →</span>
              )}
            </td>
          </tr>
        )
      })}
    </Table>
  )
}

// ---------- Nueva OT con Planificador de Proyecto ----------
type NuevaData = Omit<Parameters<typeof crearOT>[1], 'creadoPor' | 'usuarioId' | 'empresaId'> & {
  clienteForm: DatosClienteForm
}

interface TareaPlanItem {
  id: string
  titulo: string
  asignadoId?: number
  hEst: number
  dias: number
}

function NuevaOT({
  onClose,
  onCreate,
  proyectoIdInicial,
}: {
  onClose: () => void
  onCreate: (d: NuevaData) => void
  proyectoIdInicial?: number
}) {
  const { db } = useStore()
  const clientes = db.usuarios.filter((u) => u.rol === 'CLIENTE_EMPRESA' || u.rol === 'CLIENTE_PERSONA')
  const defaultCli = clientes[0]
  const defaultEmp = db.empresas.find((e) => e.id === defaultCli?.empresaId)

  const [proyectoId, setProyectoId] = useState<number | undefined>(proyectoIdInicial)
  const proyInicial = proyectoIdInicial ? db.proyectosWeb?.find((p) => p.id === proyectoIdInicial) : undefined

  const [clienteForm, setClienteForm] = useState<DatosClienteForm>(() => {
    if (proyInicial) {
      const cliProy = proyInicial.usuarioId ? db.usuarios.find((u) => u.id === proyInicial.usuarioId) : undefined
      const empProy = proyInicial.empresaId ? db.empresas.find((e) => e.id === proyInicial.empresaId) : undefined
      return {
        modo: 'CARTERA',
        usuarioId: cliProy?.id ?? defaultCli?.id,
        tipoCliente: empProy ? 'EMPRESA' : 'PERSONA',
        razonSocial: empProy?.razonSocial ?? proyInicial.clienteNombre,
        rut: empProy?.rut ?? '76.123.456-7',
        giro: empProy?.giro ?? 'Servicios / Comercio',
        ciudad: empProy?.ciudad ?? 'Santiago',
        direccion: empProy?.direccion ?? '',
        nombreContacto: cliProy?.nombre ?? proyInicial.clienteNombre,
        email: cliProy?.email ?? 'contacto@' + (proyInicial.urlDominio ?? 'cliente.cl'),
        telefono: cliProy?.telefono ?? '+56 9 8765 4321',
        inscribirAlertas: true,
      }
    }
    return {
      modo: 'CARTERA',
      usuarioId: defaultCli?.id,
      tipoCliente: defaultCli?.rol === 'CLIENTE_PERSONA' ? 'PERSONA' : 'EMPRESA',
      razonSocial: defaultEmp?.razonSocial ?? defaultCli?.nombre ?? '',
      rut: defaultEmp?.rut ?? defaultCli?.rut ?? '',
      giro: defaultEmp?.giro ?? 'Servicios TI / General',
      ciudad: defaultEmp?.ciudad ?? 'Santiago',
      direccion: defaultEmp?.direccion ?? '',
      nombreContacto: defaultCli?.nombre ?? '',
      email: defaultCli?.email ?? '',
      telefono: defaultCli?.telefono ?? '+56 9 ',
      inscribirAlertas: true,
    }
  })

  const cli = clientes.find((c) => c.id === clienteForm.usuarioId)
  const equiposCli =
    clienteForm.modo === 'CARTERA'
      ? db.equipos.filter((e) => (cli?.empresaId ? e.empresaId === cli.empresaId : e.usuarioId === clienteForm.usuarioId && !e.empresaId))
      : []

  const [busqEquipo, setBusqEquipo] = useState('')
  const equiposFiltrados = useMemo(() => {
    if (!busqEquipo.trim()) return equiposCli
    const q = busqEquipo.toLowerCase().trim()
    return equiposCli.filter(
      (e) =>
        (e.serie && e.serie.toLowerCase().includes(q)) ||
        e.codigo.toLowerCase().includes(q) ||
        `${e.marca} ${e.modelo}`.toLowerCase().includes(q),
    )
  }, [equiposCli, busqEquipo])

  const [equipoIds, setEquipoIds] = useState<number[]>([])
  const [titulo, setTitulo] = useState(() =>
    proyInicial ? `Plan de Fases & Desarrollo · ${proyInicial.nombreProyecto}` : ''
  )
  const [descripcion, setDescripcion] = useState(() =>
    proyInicial ? `OT de planificación para ${proyInicial.nombreProyecto} (${proyInicial.clienteNombre}). Stack: ${proyInicial.stackTecnologico ?? 'Web'}.` : ''
  )
  const [tipo, setTipo] = useState<OT['tipo']>(() =>
    proyInicial?.tipo === 'SOFTWARE_A_MEDIDA' ? 'DESARROLLO' : proyInicial ? 'WEB_SOFTWARE' : 'MANTENIMIENTO'
  )
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA')
  const [horaCita, setHoraCita] = useState<string>('10:30')
  const [modalidadAtencion, setModalidadAtencion] = useState<'LABORATORIO' | 'DOMICILIO'>('LABORATORIO')
  const [plan, setPlan] = useState<OTScheduleValue>({
    inicio: today(),
    fin: addDays(today(), proyInicial ? 14 : 4),
    tecnicoId: proyInicial?.responsableId ?? 3,
  })
  const [total, setTotal] = useState(() => proyInicial ? String(proyInicial.valorProyecto) : '')

  // Planificador de Tareas / Fases
  const [tareasPlan, setTareasPlan] = useState<TareaPlanItem[]>(() => {
    if (proyInicial) {
      const template = proyInicial.tipo === 'SOFTWARE_A_MEDIDA' ? TAREAS_SOFTWARE_MEDIDA : TAREAS_PROYECTO_WEB
      return template.map((t, idx) => ({
        id: `t-${idx}-${Date.now()}`,
        titulo: t.titulo,
        asignadoId: proyInicial.responsableId ?? 3,
        hEst: t.horas,
        dias: 2,
      }))
    }
    return TAREAS_MANTENCION.map((t, idx) => ({
      id: `t-${idx}-${Date.now()}`,
      titulo: t.titulo,
      asignadoId: 3,
      hEst: t.horas,
      dias: 1,
    }))
  })

  const workers = useMemo(() => db.usuarios.filter((u) => u.rol === 'WORKER'), [db.usuarios])

  const cargarPreset = (modo: 'WEB' | 'SOFTWARE' | 'BRANDING' | 'MANTENCION') => {
    let list = TAREAS_MANTENCION
    if (modo === 'WEB') list = TAREAS_PROYECTO_WEB
    if (modo === 'SOFTWARE') list = TAREAS_SOFTWARE_MEDIDA
    if (modo === 'BRANDING') list = TAREAS_DISENO_BRANDING
    setTareasPlan(
      list.map((t, idx) => ({
        id: `t-${idx}-${Date.now()}`,
        titulo: t.titulo,
        asignadoId: plan.tecnicoId,
        hEst: t.horas,
        dias: modo === 'MANTENCION' ? 1 : 2,
      }))
    )
  }

  const horasTotales = useMemo(
    () => tareasPlan.reduce((acc, t) => acc + (Number(t.hEst) || 0), 0),
    [tareasPlan],
  )

  return (
    <Modal open onClose={onClose} title="Planificador de OT & Tareas de Proyecto (Planner)" wide>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          onCreate({
            titulo,
            descripcion,
            tipo,
            prioridad,
            clienteForm,
            equipoIds,
            tecnicoId: plan.tecnicoId,
            inicio: plan.inicio,
            fin: plan.fin,
            horaCita: horaCita || undefined,
            modalidadAtencion,
            origen: 'ADMIN',
            total: Number(total) || 0,
            plantilla: false,
            proyectoId: proyectoId || undefined,
            tareasPersonalizadas: tareasPlan.map((t) => ({
              titulo: t.titulo,
              asignadoId: t.asignadoId,
              hEst: Number(t.hEst) || 1,
              dias: Number(t.dias) || 2,
              prioridad,
              estado: 'PENDIENTE',
            })),
          })
        }}
      >
        {/* Selector de Proyecto Web / Software */}
        <div className="sm:col-span-2 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/70 p-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">🚀</span>
              <div>
                <div className="text-xs font-bold text-indigo-950">Vincular esta OT a un Proyecto Web / Software</div>
                <div className="text-[11px] text-slate-500">Permite planificar las fases de desarrollo y ver el avance directamente en el proyecto</div>
              </div>
            </div>
            {proyectoId && (
              <button
                type="button"
                onClick={() => setProyectoId(undefined)}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                ✕ Desvincular proyecto
              </button>
            )}
          </div>
          <div className="mt-2">
            <select
              className={inputCls}
              value={proyectoId ?? ''}
              onChange={(e) => {
                const pid = e.target.value ? Number(e.target.value) : undefined
                setProyectoId(pid)
                if (pid) {
                  const p = db.proyectosWeb?.find((x) => x.id === pid)
                  if (p) {
                    if (!titulo || titulo.startsWith('Plan de Fases')) {
                      setTitulo(`Plan de Fases & Desarrollo · ${p.nombreProyecto}`)
                    }
                    if (!total && p.valorProyecto) {
                      setTotal(String(p.valorProyecto))
                    }
                    if (p.tipo === 'SOFTWARE_A_MEDIDA') {
                      setTipo('DESARROLLO')
                      cargarPreset('SOFTWARE')
                    } else {
                      setTipo('WEB_SOFTWARE')
                      cargarPreset('WEB')
                    }
                    const cliProy = p.usuarioId ? db.usuarios.find((u) => u.id === p.usuarioId) : undefined
                    const empProy = p.empresaId ? db.empresas.find((emp) => emp.id === p.empresaId) : undefined
                    if (cliProy || empProy) {
                      setClienteForm({
                        modo: 'CARTERA',
                        usuarioId: cliProy?.id ?? defaultCli?.id,
                        tipoCliente: empProy ? 'EMPRESA' : 'PERSONA',
                        razonSocial: empProy?.razonSocial ?? p.clienteNombre,
                        rut: empProy?.rut ?? '76.123.456-7',
                        giro: empProy?.giro ?? 'Servicios TI',
                        ciudad: empProy?.ciudad ?? 'Santiago',
                        direccion: empProy?.direccion ?? '',
                        nombreContacto: cliProy?.nombre ?? p.clienteNombre,
                        email: cliProy?.email ?? 'contacto@' + (p.urlDominio ?? 'cliente.cl'),
                        telefono: cliProy?.telefono ?? '+56 9 ',
                        inscribirAlertas: true,
                      })
                    }
                  }
                }
              }}
            >
              <option value="">Ninguno (OT independiente de soporte técnico / mantención física)</option>
              {db.proyectosWeb?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.nombreProyecto} — ({p.clienteNombre})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sm:col-span-2">
          <SelectorCarteraCliente
            value={clienteForm}
            onChange={(next) => {
              setClienteForm(next)
              setEquipoIds([])
            }}
          />
        </div>

        <Field label="Título de la OT">
          <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ej: Fase 1 y 2 Desarrollo Web y Maquetación" />
        </Field>
        <Field label="Monto Total ($ CLP)"><input type="number" className={inputCls} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0" /></Field>
        <Field label="Tipo de servicio">
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as OT['tipo'])}>
            <option value="WEB_SOFTWARE">WEB_SOFTWARE (🌐 Venta / Desarrollo Página Web & Software)</option>
            <option value="DESARROLLO">DESARROLLO (💻 Software a Medida, APIs & Sistemas)</option>
            <option value="DISENO_BRANDING">DISENO_BRANDING (🎨 Logos, Branding & Mockups)</option>
            <option value="MANTENIMIENTO">MANTENIMIENTO (🛠️ Hardware / Preventiva / Laboratorio)</option>
            <option value="UPGRADE">UPGRADE (⚡ RAM / SSD / Componentes)</option>
            <option value="CONSULTORIA">CONSULTORIA (🛡️ Auditoría / Redes / Seguridad)</option>
          </select>
        </Field>
        <Field label="Prioridad">
          <select className={inputCls} value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
            {['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="🕒 Hora agendada (opcional)">
          <select className={inputCls} value={horaCita} onChange={(e) => setHoraCita(e.target.value)}>
            <option value="">Sin hora específica</option>
            {['09:00', '10:30', '12:00', '15:00', '16:30', '18:00'].map((h) => (
              <option key={h} value={h}>{h} hrs</option>
            ))}
          </select>
        </Field>
        <Field label="Modalidad de atención">
          <select className={inputCls} value={modalidadAtencion} onChange={(e) => setModalidadAtencion(e.target.value as 'LABORATORIO' | 'DOMICILIO')}>
            <option value="LABORATORIO">🏢 En Oficina / Laboratorio PCG SPA</option>
            <option value="DOMICILIO">🚗 Terreno / Remoto / Domicilio</option>
          </select>
        </Field>

        <div className="sm:col-span-2">
          <OTSchedulerCalendar value={plan} onChange={setPlan} />
        </div>

        {equiposCli.length > 0 && (
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="block text-xs font-semibold text-slate-700">Equipos físicos incluidos (con N° de serie)</span>
              <input
                type="text"
                value={busqEquipo}
                onChange={(e) => setBusqEquipo(e.target.value)}
                placeholder="🔍 Buscar por S/N o modelo..."
                className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs focus:border-pcg-green focus:outline-none"
              />
            </div>
            <div className="grid max-h-36 gap-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:grid-cols-2">
              {equiposFiltrados.map((e) => (
                <label key={e.id} className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200/80 bg-white p-2 text-xs shadow-2xs hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={equipoIds.includes(e.id)}
                      onChange={(ev) => setEquipoIds(ev.target.checked ? [...equipoIds, e.id] : equipoIds.filter((x) => x !== e.id))}
                    />
                    <div>
                      <span className="font-semibold text-slate-900">{e.codigo} · {e.marca} {e.modelo}</span>
                      <div className="font-mono text-[10px] text-slate-500">S/N: {e.serie || 'Sin número'}</div>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{e.area}</span>
                </label>
              ))}
              {equiposFiltrados.length === 0 && (
                <div className="col-span-2 p-2 text-center text-xs text-slate-400">No se encontraron equipos con el N° de serie ingresado.</div>
              )}
            </div>
          </div>
        )}

        <div className="sm:col-span-2"><Field label="Descripción / Alcance"><textarea className={inputCls} rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></Field></div>

        {/* PLANIFICADOR INTERACTIVO DE FASES / TAREAS */}
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <span className="text-sm font-extrabold text-slate-900">Planificador de Fases & Tareas de la OT</span>
              </div>
              <div className="text-xs text-slate-500">
                Define las tareas con su responsable y horas estimadas para calcular el avance real
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-200">
              {tareasPlan.length} tareas · {horasTotales} hrs estimadas
            </div>
          </div>

          {/* Plantillas Rápidas */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Cargar plantilla rápida:</span>
            <button
              type="button"
              onClick={() => cargarPreset('WEB')}
              className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-50"
            >
              🌐 Web / E-Commerce (9)
            </button>
            <button
              type="button"
              onClick={() => cargarPreset('SOFTWARE')}
              className="rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-50"
            >
              💻 Software a Medida (7)
            </button>
            <button
              type="button"
              onClick={() => cargarPreset('BRANDING')}
              className="rounded-lg border border-violet-300 bg-white px-2.5 py-1 text-xs font-bold text-violet-700 shadow-2xs hover:bg-violet-50"
            >
              🎨 Branding / Diseño (6)
            </button>
            <button
              type="button"
              onClick={() => cargarPreset('MANTENCION')}
              className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-700 shadow-2xs hover:bg-amber-50"
            >
              🛠️ Mantención Hardware (8)
            </button>
            <button
              type="button"
              onClick={() => setTareasPlan([])}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            >
              🧹 Limpiar
            </button>
          </div>

          {/* Lista de Tareas Planificadas */}
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
            {tareasPlan.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                No hay tareas en el planificador. Selecciona una plantilla arriba o agrega tareas personalizadas con el botón de abajo.
              </div>
            ) : (
              tareasPlan.map((t, idx) => (
                <div key={t.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                    {idx + 1}
                  </span>
                  <input
                    className={`${inputCls} flex-1 !py-1 text-xs font-medium`}
                    value={t.titulo}
                    placeholder="Título o fase..."
                    onChange={(e) => {
                      const next = [...tareasPlan]
                      next[idx].titulo = e.target.value
                      setTareasPlan(next)
                    }}
                    required
                  />
                  <select
                    className={`${inputCls} !w-44 !py-1 text-xs`}
                    value={t.asignadoId ?? ''}
                    onChange={(e) => {
                      const next = [...tareasPlan]
                      next[idx].asignadoId = e.target.value ? Number(e.target.value) : undefined
                      setTareasPlan(next)
                    }}
                  >
                    <option value="">Sin asignar</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nombre.split(' ')[0]} {w.especialidad === 'DESARROLLADOR' ? '💻 Dev' : w.especialidad === 'DISENADOR' ? '🎨 Diseñadora' : '🔧 Téc'}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className={`${inputCls} !w-16 !py-1 text-center text-xs`}
                      value={t.hEst}
                      title="Horas estimadas"
                      onChange={(e) => {
                        const next = [...tareasPlan]
                        next[idx].hEst = Number(e.target.value) || 1
                        setTareasPlan(next)
                      }}
                    />
                    <span className="text-[10px] text-slate-500 font-bold">hrs</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTareasPlan(tareasPlan.filter((_, i) => i !== idx))}
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Eliminar tarea"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setTareasPlan([
                  ...tareasPlan,
                  {
                    id: `t-new-${Date.now()}`,
                    titulo: `Fase ${tareasPlan.length + 1}: `,
                    asignadoId: plan.tecnicoId,
                    hEst: 2,
                    dias: 2,
                  },
                ])
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              + Agregar Fase / Tarea
            </button>
            <span className="text-xs text-slate-500">
              Total: <strong className="text-slate-800">{tareasPlan.length} tareas</strong> que generarán el avance de la OT
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Crear OT y Activar Planner</Btn>
        </div>
      </form>
    </Modal>
  )
}

// ---------- Vista cliente ----------
function ClientOTs() {
  const sc = useScope()
  const { db, mutate } = useStore()
  const [params, setParams] = useSearchParams()
  const [agendar, setAgendar] = useState(() => params.get('agendar') === '1')
  const openId = params.get('ot') ? Number(params.get('ot')) : null
  const open = (id: number | null) => setParams(id ? { ot: String(id) } : {}, { replace: true })

  return (
    <>
      <PageHeader
        title="Mis trabajos y horas agendadas"
        subtitle="Seguimiento en vivo de tus equipos, horas reservadas de mantención, comprobantes de pago y facturas"
        actions={
          <Btn onClick={() => setAgendar(true)}>
            📅 Agendar Hora de Mantención
          </Btn>
        }
      />
      {sc.ots.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-3xl">🛠️</div>
            <div className="mt-2 text-base font-bold text-slate-900">¿Tu equipo necesita mantención preventiva o formateo?</div>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Reserva una hora directamente en el calendario de nuestro laboratorio o solicita retiro a domicilio.
            </p>
            <div className="mt-4">
              <Btn onClick={() => setAgendar(true)}>📅 Generar Hora de Mantención Ahora</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...sc.ots].reverse().map((o) => {
            const idx = ESTADOS_OT.indexOf(o.estado)
            const tec = db.usuarios.find((u) => u.id === o.tecnicoId)
            return (
              <Card
                key={o.id}
                title={`${o.codigo} · ${o.titulo}`}
                action={
                  <div className="flex items-center gap-2">
                    {o.horaCita && (
                      <Badge tone="green">
                        🕒 Hora: {fmtFecha(o.inicio)} · {o.horaCita} hrs
                      </Badge>
                    )}
                    <Badge tone={otTone[o.estado]}>{ESTADO_OT_LABEL[o.estado]}</Badge>
                  </div>
                }
              >
                <div className="flex items-center">
                  {ESTADOS_OT.slice(0, 5).map((s, i) => (
                    <div key={s} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div className={cx('flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold', i <= idx ? 'bg-pcg-green text-white' : 'bg-slate-200 text-slate-500')}>{i <= idx ? '✓' : i + 1}</div>
                        <div className="mt-1 w-20 text-center text-[11px] text-slate-500">{ESTADO_OT_LABEL[s]}</div>
                      </div>
                      {i < 4 && <div className={cx('mb-5 h-0.5 flex-1', i < idx ? 'bg-pcg-green' : 'bg-slate-200')} />}
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-5">
                  <div>
                    <span className="text-xs text-slate-400">Fecha y Hora Reservada</span><br />
                    <span className="font-semibold text-slate-900">
                      {fmtFecha(o.inicio)} {o.horaCita ? `· ${o.horaCita} hrs` : ''}
                    </span>
                    <div className="text-[11px] text-emerald-700">
                      {o.modalidadAtencion === 'DOMICILIO' ? '🚗 Retiro / Domicilio' : '🏢 Laboratorio PCG SPA'}
                    </div>
                  </div>
                  <div><span className="text-xs text-slate-400">Entrega estimada</span><br />{fmtFecha(o.fin)}</div>
                  <div>
                    <span className="text-xs text-slate-400">Técnico asignado</span><br />
                    {tec?.nombre ?? 'Equipo Técnico PCG'}
                  </div>
                  <div><span className="text-xs text-slate-400">Monto</span><br />{o.total ? fmtCLP(o.total) : '—'}</div>
                  <div>
                    <span className="text-xs text-slate-400">Pago y factura</span><br />
                    <Badge tone={o.estadoPago === 'PAGADO' ? 'green' : o.estadoPago === 'VERIFICANDO' ? 'blue' : 'amber'}>
                      Pago {o.estadoPago.toLowerCase()}
                    </Badge>
                    {o.numeroFactura && <span className="ml-2 text-xs font-semibold text-emerald-700">Factura {o.numeroFactura}</span>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    {o.comprobanteNombre ? (
                      <span className="text-emerald-700">📎 Comprobante enviado: <b>{o.comprobanteNombre}</b></span>
                    ) : (
                      <span className="text-slate-500">Sube tu comprobante de transferencia para validación del CEO:</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      className="text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          mutate((d) => {
                            const x = d.ots.find((y) => y.id === o.id)!
                            x.comprobanteNombre = f.name
                            if (x.estadoPago === 'PENDIENTE') x.estadoPago = 'VERIFICANDO'
                          })
                        }
                      }}
                    />
                    <Btn size="sm" variant="secondary" onClick={() => open(o.id)}>
                      Ver bitácora y avance →
                    </Btn>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  {o.historial.slice().reverse().slice(0, 3).map((h, i) => <li key={i}>{fmtFechaHora(h.fecha)} · {ESTADO_OT_LABEL[h.estado]} — {h.nota}</li>)}
                </ul>
              </Card>
            )
          })}
        </div>
      )}

      <OTDrawer otId={openId} onClose={() => open(null)} />
      {agendar && (
        <AgendarHoraModal
          onClose={() => setAgendar(false)}
          onSuccess={(newOtId) => open(newOtId)}
        />
      )}
    </>
  )
}

