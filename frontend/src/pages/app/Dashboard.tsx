import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useScope } from '@/lib/scope'
import { ESPECIALIDAD_WORKER_META, ESTADOS_OT, ESTADO_OT_LABEL, ESTADO_TAREA_LABEL, getWorkerEspecialidad } from '@/lib/types'
import { ESTADO_PROYECTO_WEB_META } from '@/lib/inventarioMeta'
import { calcAlertas, fmtCLP, fmtFecha, semaforo, today } from '@/lib/util'
import { otTone, ticketTone, cotTone, tareaTone } from '@/lib/tones'
import AgendarHoraModal from '@/components/AgendarHoraModal'
import { Avatar, Badge, Btn, Card, Empty, Kpi, prioTone, cx } from '@/components/kit'
import {
  AnimatedNumber,
  BackgroundBeamsHeader,
  LiveActivityTicker,
  MovingBorderBtn,
  SpotlightCard,
} from '@/components/aceternity'

const stageStyle = [
  { bar: 'from-sky-400 to-blue-600', bg: 'from-sky-50 to-blue-50/40', ring: 'border-sky-200', text: 'text-sky-700' },
  { bar: 'from-indigo-400 to-violet-600', bg: 'from-indigo-50 to-violet-50/40', ring: 'border-indigo-200', text: 'text-indigo-700' },
  { bar: 'from-fuchsia-500 to-purple-600', bg: 'from-fuchsia-50 to-purple-50/40', ring: 'border-fuchsia-200', text: 'text-fuchsia-700' },
  { bar: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50/40', ring: 'border-amber-200', text: 'text-amber-700' },
  { bar: 'from-emerald-400 to-green-600', bg: 'from-emerald-50 to-teal-50/40', ring: 'border-emerald-200', text: 'text-emerald-700' },
  { bar: 'from-teal-400 to-cyan-600', bg: 'from-teal-50 to-cyan-50/40', ring: 'border-teal-200', text: 'text-teal-700' },
  { bar: 'from-rose-400 to-red-600', bg: 'from-rose-50 to-red-50/40', ring: 'border-rose-200', text: 'text-rose-700' },
]

export default function Dashboard() {
  const { user } = useStore()
  if (user!.rol === 'ADMIN' || user!.rol === 'DOC_PROCESS') return <StaffDashboard />
  if (user!.rol === 'WORKER') return <WorkerDashboard />
  return <ClientDashboard />
}

function StaffDashboard() {
  const { db, user } = useStore()
  const nav = useNavigate()
  const [agendarHora, setAgendarHora] = useState(false)
  const hoy = today()
  const activas = db.ots.filter((o) => o.estado !== 'ENTREGADO' && o.estado !== 'CANCELADA')
  const atrasadas = activas.filter((o) => o.fin < hoy && o.estado !== 'LISTO')
  const ticketsAbiertos = db.tickets.filter((t) => t.estado === 'ABIERTO' || t.estado === 'EN_COTIZACION')
  const cotPend = db.cotizaciones.filter((c) => c.estado === 'ENVIADA')
  const alertas = calcAlertas(db).filter((a) => a.estado === 'PENDIENTE' && a.debeAvisar)
  const counts = ESTADOS_OT.map((e) => db.ots.filter((o) => o.estado === e).length)
  const max = Math.max(1, ...counts)
  const workers = db.usuarios.filter((u) => u.rol === 'WORKER' && u.activo)

  const cajaActual =
    (db.movimientos ?? []).filter((m) => m.tipo === 'INGRESO').reduce((a, m) => a + m.monto, 0) -
    (db.movimientos ?? []).filter((m) => m.tipo === 'EGRESO').reduce((a, m) => a + m.monto, 0)
  const meDeben = (db.facturas ?? [])
    .filter((f) => f.direccion === 'POR_COBRAR' && f.estado !== 'ANULADA')
    .reduce((a, f) => a + Math.max(0, f.montoTotal - f.montoPagado), 0)
  const deboPagar = (db.facturas ?? [])
    .filter((f) => f.direccion === 'POR_PAGAR' && f.estado !== 'ANULADA')
    .reduce((a, f) => a + Math.max(0, f.montoTotal - f.montoPagado), 0)

  const tickerItems = [
    ...db.ots.slice(0, 4).map((o) => {
      const cli = o.empresaId
        ? db.empresas.find((e) => e.id === o.empresaId)?.razonSocial
        : db.usuarios.find((u) => u.id === o.usuarioId)?.nombre
      return {
        icon: o.horaCita ? '🕒' : '🔧',
        label: `${o.codigo} · ${cli ?? 'Cliente'}`,
        tag: o.horaCita ? `Cita ${o.horaCita}` : ESTADO_OT_LABEL[o.estado],
        tone: o.estado === 'LISTO' || o.estado === 'ENTREGADO' ? 'emerald' : 'violet',
      }
    }),
    ...cotPend.slice(0, 2).map((c) => ({
      icon: '💲',
      label: `Cotización ${c.numero} enviada`,
      tag: fmtCLP(c.total),
      tone: 'amber',
    })),
    ...alertas.slice(0, 2).map((a) => {
      const eq = db.equipos.find((e) => e.id === a.equipoId)
      const em = db.empresas.find((e) => e.id === a.empresaId)
      return {
        icon: '🔔',
        label: `Preventiva ${eq?.codigo ?? 'EQ'} (${em?.razonSocial ?? 'B2B'})`,
        tag: `En ${a.diasRestantes}d`,
        tone: 'rose',
      }
    }),
  ]

  return (
    <>
      {/* Hero Banner Aceternity Background Beams + Moving Border CTA */}
      <BackgroundBeamsHeader
        badge="Centro de Control Ejecutivo · PCG SPA · Telemetría en Vivo"
        title={
          <>
            Hola,{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
              {user!.nombre.split(' ')[0]}
            </span>{' '}
            👋
          </>
        }
        subtitle="Monitoreo interactivo de órdenes de trabajo, cotizaciones Excel, cartera corporativa B2B, clientes naturales y flujo financiero."
        actions={
          <>
            <MovingBorderBtn onClick={() => setAgendarHora(true)}>
              📅 Agendar Hora (Cliente Natural)
            </MovingBorderBtn>
            <Link to="/app/ot">
              <Btn variant="secondary">▤ Ver Todas las OT ({db.ots.length})</Btn>
            </Link>
            <Link to="/app/empresas">
              <Btn variant="secondary">🏢 Empresas 3D ({db.empresas.length})</Btn>
            </Link>
            <Link to="/app/cotizaciones?nuevo=1">
              <Btn variant="secondary">+ Cotización Excel</Btn>
            </Link>
          </>
        }
      />

      <LiveActivityTicker items={tickerItems} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Tickets por atender" value={ticketsAbiertos.length} hint="Solicitudes de clientes" tone="blue" />
        <Kpi label="OT activas" value={activas.length} hint="En taller / desarrollo" tone="violet" />
        <Kpi label="OT atrasadas" value={atrasadas.length} hint={atrasadas.length ? 'Requieren prioridad' : 'Todo al día'} tone={atrasadas.length ? 'red' : 'green'} />
        <Kpi label="Cotizaciones enviadas" value={cotPend.length} hint="Esperan respuesta" tone="amber" />
        <Kpi label="Avisos preventivos (-7d)" value={alertas.length} hint="Listos para despacho" tone="green" />
      </div>

      {/* Resumen ejecutivo de Finanzas y Facturas con Aceternity Spotlight + Motion Spring Counters */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link to="/app/finanzas" className="block">
          <SpotlightCard
            spotlightColor="rgba(16, 185, 129, 0.24)"
            className="group rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                💰 CAJA ACTUAL DISPONIBLE
              </span>
              <span className="transition-transform group-hover:translate-x-1 group-hover:underline">Ver finanzas →</span>
            </div>
            <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
              <AnimatedNumber value={cajaActual} formatCLP />
            </div>
            <div className="mt-0.5 text-xs text-slate-500">Dinero líquido en cuenta de PCG SPA</div>
          </SpotlightCard>
        </Link>

        <Link to="/app/finanzas" className="block">
          <SpotlightCard
            spotlightColor="rgba(14, 165, 233, 0.24)"
            className="group rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/40 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-bold text-sky-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                📥 ME DEBEN (CUENTAS POR COBRAR)
              </span>
              <span className="transition-transform group-hover:translate-x-1 group-hover:underline">Cobrar →</span>
            </div>
            <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
              <AnimatedNumber value={meDeben} formatCLP />
            </div>
            <div className="mt-0.5 text-xs text-slate-500">Facturas y boletas pendientes de clientes</div>
          </SpotlightCard>
        </Link>

        <Link to="/app/finanzas" className="block">
          <SpotlightCard
            spotlightColor="rgba(244, 63, 94, 0.22)"
            className="group rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/90 via-white to-orange-50/40 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                📤 DEBO PAGAR (PROVEEDORES)
              </span>
              <span className="transition-transform group-hover:translate-x-1 group-hover:underline">Pagar →</span>
            </div>
            <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
              <AnimatedNumber value={deboPagar} formatCLP />
            </div>
            <div className="mt-0.5 text-xs text-slate-500">Facturas de repuestos e insumos por pagar</div>
          </SpotlightCard>
        </Link>
      </div>

      <Card
        className="mt-6"
        accent="violet"
        title="Pipeline Inteligente de Órdenes de Trabajo (OT)"
        action={
          <Link to="/app/ot" className="text-xs font-semibold text-emerald-700 hover:underline">
            Abrir Planner interactivo →
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
          {ESTADOS_OT.map((e, i) => {
            const prev = counts[i - 1]
            const st = stageStyle[i]
            return (
              <motion.div
                key={e}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className={cx('rounded-2xl border bg-gradient-to-b p-3.5 shadow-2xs', st.bg, st.ring)}
              >
                <div className="truncate text-xs font-semibold text-slate-600">{ESTADO_OT_LABEL[e]}</div>
                <div className={cx('mt-0.5 text-3xl font-extrabold', st.text)}>{counts[i]}</div>
                <div className="h-4 text-[11px] font-semibold text-emerald-600">
                  {i > 0 && prev > 0 ? `${Math.round((counts[i] / prev) * 100)}% conversión` : 'Etapa activa'}
                </div>
                <div className="mt-2 flex h-24 items-end rounded-xl bg-white/80 p-1.5 ring-1 ring-slate-200/60">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(counts[i] ? 16 : 4, (counts[i] / max) * 100)}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.07, type: 'spring' }}
                    className={cx('w-full rounded-lg bg-gradient-to-t shadow-sm', st.bar)}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Listado rápido de TODAS las OT con hora agendada y tipo de cliente */}
      <Card
        className="mt-6"
        accent="emerald"
        title={`📋 Todas las Órdenes de Trabajo de PCG SPA (${db.ots.length} OT)`}
        action={
          <div className="flex items-center gap-2">
            <Btn size="sm" variant="secondary" onClick={() => setAgendarHora(true)}>
              📅 Agendar Hora (Cliente Natural)
            </Btn>
            <Link to="/app/ot" className="text-xs font-semibold text-emerald-700 hover:underline">
              Ver Planner completo →
            </Link>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...db.ots].reverse().map((o) => {
            const emp = db.empresas.find((e) => e.id === o.empresaId)
            const cli = db.usuarios.find((u) => u.id === o.usuarioId)
            const tec = db.usuarios.find((u) => u.id === o.tecnicoId)
            return (
              <Link
                key={o.id}
                to={`/app/ot?ot=${o.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-indigo-700 group-hover:underline">{o.codigo}</span>
                    <Badge tone={otTone[o.estado]}>{ESTADO_OT_LABEL[o.estado]}</Badge>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-bold text-slate-900">{o.titulo}</div>
                  <div className="mt-1 text-[11px] font-medium text-slate-500">
                    {emp ? `🏢 ${emp.razonSocial}` : `👤 ${cli?.nombre ?? 'Cliente Natural'}`}
                  </div>
                  {o.horaCita && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      🕒 {fmtFecha(o.inicio)} · {o.horaCita} hrs
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span>{tec?.nombre ?? 'Sin técnico'}</span>
                  <span className="font-bold text-slate-800">{o.total ? fmtCLP(o.total) : '—'}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </Card>

      {agendarHora && (
        <AgendarHoraModal
          onClose={() => setAgendarHora(false)}
          onSuccess={(newOtId) => nav(`/app/ot?ot=${newOtId}`)}
        />
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Rendimiento y carga semanal por técnico" accent="blue">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase text-slate-400">
              <tr>
                <th className="pb-2.5">Técnico</th>
                <th className="pb-2.5">OT</th>
                <th className="pb-2.5">Tareas</th>
                <th className="pb-2.5">Capacidad semanal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((w) => {
                const tareas = db.tareas.filter((t) => t.asignadoId === w.id && t.estado !== 'HECHA')
                const horas = tareas.reduce((s, t) => s + t.hEst, 0)
                const pct = Math.min(100, Math.round((horas / (w.horasSemanales ?? 40)) * 100))
                return (
                  <tr key={w.id} className="transition hover:bg-slate-50">
                    <td className="py-3">
                      <span className="flex items-center gap-2.5 font-semibold text-slate-800">
                        <Avatar name={w.nombre} color={w.color} size={32} />
                        <span>
                          {w.nombre}
                          <span className="block text-xs font-normal text-slate-400">{w.cargo}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 font-bold text-indigo-700">{activas.filter((o) => o.tecnicoId === w.id).length}</td>
                    <td className="py-3 font-semibold text-sky-700">{tareas.length}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-28 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/70">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(8, pct)}%` }}
                            transition={{ duration: 0.6 }}
                            className={cx(
                              'h-full rounded-full bg-gradient-to-r',
                              pct > 85 ? 'from-amber-500 to-rose-600' : 'from-emerald-400 to-sky-500',
                            )}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {horas.toFixed(1)} h / {w.horasSemanales ?? 40} h
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card
          title="Alertas preventivas de la semana (aviso 7 días antes)"
          accent="amber"
          action={
            <Link to="/app/alertas" className="text-xs font-semibold text-emerald-700 hover:underline">
              Configurar y enviar →
            </Link>
          }
        >
          {alertas.length === 0 ? (
            <Empty>No hay avisos pendientes de envío.</Empty>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {alertas.slice(0, 6).map((a, idx) => {
                const e = db.equipos.find((x) => x.id === a.equipoId)!
                return (
                  <motion.li
                    key={a.key}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/40 px-3.5 py-2.5"
                  >
                    <span>
                      <span className="font-semibold text-slate-800">
                        {db.empresas.find((x) => x.id === a.empresaId)?.razonSocial}
                      </span>{' '}
                      · <b className="text-emerald-700">{e.codigo}</b> ({e.marca} {e.modelo})
                    </span>
                    <Badge tone={a.vencida ? 'red' : 'amber'}>{fmtFecha(a.programada)}</Badge>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Tickets recientes de clientes"
          accent="emerald"
          action={
            <Link to="/app/tickets" className="text-xs font-semibold text-emerald-700 hover:underline">
              Ver todos →
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100 text-sm">
            {[...db.tickets].reverse().slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 transition hover:bg-slate-50/80">
                <Link to={`/app/tickets/${t.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                  <b className="text-indigo-700">{t.codigo}</b> · {t.asunto}
                </Link>
                <Badge tone={ticketTone[t.estado]}>{t.estado.replace('_', ' ')}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Cotizaciones emitidas"
          accent="violet"
          action={
            <Link to="/app/cotizaciones" className="text-xs font-semibold text-emerald-700 hover:underline">
              Ver todas →
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100 text-sm">
            {[...db.cotizaciones].reverse().slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 transition hover:bg-slate-50/80">
                <Link to={`/app/cotizaciones/${c.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                  <b className="text-violet-700">{c.numero}</b> · <span className="font-bold text-emerald-700">{fmtCLP(c.total)}</span>
                </Link>
                <Badge tone={cotTone[c.estado]}>{c.estado}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

function WorkerDashboard() {
  const { db, user } = useStore()
  const esp = getWorkerEspecialidad(user)
  const espMeta = ESPECIALIDAD_WORKER_META[esp]
  const isDisenador = esp === 'DISENADOR'
  const isDev = esp === 'DESARROLLADOR'
  const mias = db.tareas.filter((t) => t.asignadoId === user!.id && t.estado !== 'HECHA')
  const hechas = db.tareas.filter((t) => t.asignadoId === user!.id && t.estado === 'HECHA')
  const hoy = today()

  const misProyectos = (db.proyectosWeb ?? []).filter(
    (p) => p.responsableId === user!.id || p.participantesIds?.includes(user!.id),
  )

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user!.nombre} color={user!.color ?? '#2563eb'} size={52} />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <span>{espMeta.icon}</span>
                <span>{isDisenador ? 'Panel Creativo & Branding' : isDev ? 'Panel de Software & Web' : 'Panel Técnico Operativo'}</span>
                <span className="text-white/40">·</span>
                <span>{user!.cargo}</span>
              </span>
              <h1 className="mt-1 text-2xl font-extrabold">
                Hola, {user!.nombre.split(' ')[0]} {espMeta.icon}
              </h1>
              <p className="text-xs text-slate-300">{user!.titulo ?? 'Especialista PCG SPA'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(isDisenador || isDev) && (
              <Link to="/app/proyectos">
                <Btn className="bg-gradient-to-r from-violet-600 to-pink-600 text-white">
                  🎨 Proyectos y Logos ({misProyectos.length})
                </Btn>
              </Link>
            )}
            <Link to="/app/tareas">
              <Btn>✔ Mis tareas ({mias.length})</Btn>
            </Link>
            <Link to="/app/ot">
              <Btn variant="secondary">▤ Tablero Kanban</Btn>
            </Link>
            {!isDisenador && !isDev && (
              <Link to="/app/equipos">
                <Btn variant="secondary">▣ Bitácora Equipos</Btn>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-4">
        {(isDisenador || isDev) ? (
          <Kpi label="Proyectos en desarrollo / cartera" value={misProyectos.length} tone="violet" />
        ) : (
          <Kpi label="Tareas en curso / pendientes" value={mias.length} tone="blue" />
        )}
        <Kpi label="Tareas completadas" value={hechas.length} tone="green" />
        <Kpi label="Tareas atrasadas" value={mias.filter((t) => t.limite && t.limite < hoy).length} tone="red" />
        <Kpi label="Carga asignada" value={`${mias.reduce((s, t) => s + t.hEst, 0).toFixed(1)} h`} hint={`de ${user!.horasSemanales ?? 40} h semanales`} tone="violet" />
      </div>

      <Card
        className="mt-6"
        accent="blue"
        title="Tus próximas intervenciones y tareas"
        action={
          <Link to="/app/tareas" className="text-xs font-semibold text-emerald-700 hover:underline">
            Gestionar todas →
          </Link>
        }
      >
        {mias.length === 0 ? (
          <Empty>No tienes tareas pendientes. ¡Excelente trabajo!</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mias.slice(0, 8).map((t, i) => {
              const ot = db.ots.find((o) => o.id === t.otId)!
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={prioTone[t.prioridad]}>{t.prioridad}</Badge>
                      <Badge tone={tareaTone[t.estado]}>{ESTADO_TAREA_LABEL[t.estado]}</Badge>
                    </div>
                    <div className="mt-2 font-bold text-slate-900">{t.titulo}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      OT: <b className="text-indigo-700">{ot.codigo}</b> · {ot.titulo}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                    <span className="text-slate-500">Límite: {fmtFecha(t.limite)} · {t.hEst} h</span>
                    <Link to={`/app/ot?ot=${ot.id}`} className="font-semibold text-emerald-700 hover:underline">
                      Abrir OT / Bitácora →
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}

function ClientDashboard() {
  const { db, user } = useStore()
  const sc = useScope()
  const nav = useNavigate()
  const [agendarHora, setAgendarHora] = useState(false)
  const emp = db.empresas.find((e) => e.id === user!.empresaId)
  const porVencer = sc.equipos.filter((e) => e.proximaMantencion && semaforo(e).color !== 'green')
  const pend = sc.cotizaciones.filter((c) => c.estado === 'ENVIADA')

  const misProyectos = (db.proyectosWeb ?? []).filter((p) => {
    if (user!.empresaId && p.empresaId === user!.empresaId) return true
    if (p.usuarioId === user!.id) return true
    if (emp && p.clienteNombre?.toLowerCase().includes(emp.razonSocial.toLowerCase())) return true
    return false
  })
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-900 p-6 text-white shadow-xl"
      >
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-emerald-300">
              {emp ? 'Portal Corporativo de Clientes · PCG SPA' : 'Portal de Atención a Clientes Particulares · PCG SPA'}
            </span>
            <h1 className="mt-2 text-2xl font-extrabold">{emp ? emp.razonSocial : `Hola, ${user!.nombre}`}</h1>
            <p className="text-xs text-slate-300">
              Reserva horas de mantención en laboratorio o domicilio, revisa el avance de tus equipos y descarga informes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setAgendarHora(true)}>
              📅 Agendar Hora de Mantención
            </Btn>
            <Link to="/app/tickets?nuevo=1">
              <Btn variant="secondary">+ Solicitar ticket / cotización</Btn>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Equipos registrados" value={sc.equipos.length} tone="blue" />
        <Kpi label="Trabajos y horas agendadas" value={sc.ots.length} tone="violet" />
        <Kpi label="Cotizaciones por responder" value={pend.length} tone="amber" />
        <Kpi label="Mantenciones próximas" value={porVencer.length} tone={porVencer.length ? 'red' : 'green'} />
      </div>
      {pend.length > 0 && (
        <Card className="mt-6" accent="amber" title="Tienes cotizaciones esperando tu respuesta">
          {pend.map((c) => (
            <Link
              key={c.id}
              to={`/app/cotizaciones/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm transition hover:bg-amber-100/70"
            >
              <b className="text-amber-950">{c.numero}</b>
              <span className="font-semibold text-emerald-800">{fmtCLP(c.total)} · válida hasta {fmtFecha(c.validaHasta)} →</span>
            </Link>
          ))}
        </Card>
      )}

      {misProyectos.length > 0 && (
        <Card
          className="mt-6"
          title={`🚀 Mis Proyectos Web & Software Desarrollados con PCG (${misProyectos.length})`}
          accent="emerald"
          action={
            <Link to="/app/tickets?nuevo=1" className="text-xs font-semibold text-emerald-700 hover:underline">
              + Solicitar requerimiento / reunión →
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {misProyectos.map((p) => {
              const eMeta = ESTADO_PROYECTO_WEB_META[p.estado] ?? { label: p.estado, tone: 'green' }
              const otsVinculadas = (db.ots ?? []).filter((o) => o.proyectoId === p.id)
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-black text-emerald-700">{p.codigo}</span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{p.nombreProyecto}</h3>
                    </div>
                    <Badge tone={eMeta.tone}>{eMeta.label}</Badge>
                  </div>

                  {p.descripcion && (
                    <p className="text-xs text-slate-600 line-clamp-2">{p.descripcion}</p>
                  )}

                  {p.urlDominio && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white">
                      <span className="truncate font-mono text-sky-300">{p.urlDominio}</span>
                      <a
                        href={p.urlDominio.startsWith('http') ? p.urlDominio : `https://${p.urlDominio}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-white/30"
                      >
                        Abrir ↗
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 text-xs">
                    <span className="font-semibold text-slate-600">
                      Órdenes de trabajo vinculadas: <b className="text-indigo-700">{otsVinculadas.length}</b>
                    </span>
                    {p.incluyeMantencionWeb && p.planMantencion !== 'SIN_MENSUALIDAD' && p.proximaMantencionWeb && (
                      <span className="font-semibold text-emerald-700">
                        Próx. mantención: {fmtFecha(p.proximaMantencionWeb)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <Link
                      to={`/app/tickets?nuevo=1&asunto=${encodeURIComponent(`Agendar Reunión de Avance: ${p.nombreProyecto} (${p.codigo})`)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-indigo-700"
                    >
                      📅 Agendar Reunión sobre Proyecto
                    </Link>
                    <Link
                      to="/app/proyectos"
                      className="text-xs font-bold text-slate-600 hover:text-emerald-700"
                    >
                      Ver Ficha del Proyecto →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card
          title="Mis trabajos y horas reservadas"
          accent="violet"
          action={<Link to="/app/ot" className="text-xs font-semibold text-emerald-700 hover:underline">Ver todos ({sc.ots.length}) →</Link>}
        >
          {sc.ots.length === 0 ? (
            <Empty>No tienes trabajos ni horas reservadas aún.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {[...sc.ots].reverse().map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <Link to={`/app/ot?ot=${o.id}`} className="font-medium hover:text-emerald-700">
                      <b className="text-indigo-700">{o.codigo}</b> · {o.titulo}
                    </Link>
                    {o.horaCita && (
                      <div className="text-xs font-semibold text-emerald-700">
                        🕒 {fmtFecha(o.inicio)} a las {o.horaCita} hrs ({o.modalidadAtencion === 'DOMICILIO' ? 'Domicilio' : 'Laboratorio'})
                      </div>
                    )}
                  </div>
                  <Badge tone={otTone[o.estado]}>{ESTADO_OT_LABEL[o.estado]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card
          title="Estado de mis equipos"
          accent="blue"
          action={<Link to="/app/equipos" className="text-xs font-semibold text-emerald-700 hover:underline">Ver parque completo →</Link>}
        >
          <ul className="divide-y divide-slate-100 text-sm">
            {sc.equipos.slice(0, 6).map((e) => {
              const s = semaforo(e)
              return (
                <li key={e.id} className="flex items-center justify-between py-2.5">
                  <Link to={`/app/equipos/${e.id}`} className="font-medium hover:text-emerald-700">
                    <b className="text-sky-700">{e.codigo}</b> · {e.marca} {e.modelo} ({e.area})
                  </Link>
                  <Badge tone={s.color === 'slate' ? 'slate' : s.color}>{s.label}</Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      {agendarHora && (
        <AgendarHoraModal
          onClose={() => setAgendarHora(false)}
          onSuccess={(newOtId) => nav(`/app/ot?ot=${newOtId}`)}
        />
      )}
    </>
  )
}
