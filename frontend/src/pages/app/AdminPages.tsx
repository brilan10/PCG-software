import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { resolverORegistrarCliente } from '@/lib/actions'
import { ESPECIALIDAD_WORKER_META, ESTADOS_TAREA, ESTADO_TAREA_LABEL, ROL_LABEL, TIPO_HW_META, getWorkerEspecialidad, isAptoDesarrollador, isAptoTecnico } from '@/lib/types'
import type { EspecialidadWorker, Rol, Tarea, TipoHw } from '@/lib/types'
import { fmtCLP, fmtFecha, fmtFechaHora, nextId } from '@/lib/util'
import { tareaTone } from '@/lib/tones'
import { Avatar, Badge, Btn, Card, Empty, Field, Modal, PageHeader, Table, cx, inputCls, prioTone, td } from '@/components/kit'
import {
  AnimatedNumber,
  AnimatedPillTabs,
  BackgroundBeamsHeader,
  MovingBorderBtn,
  SpotlightCard,
  Tilt3DCard,
} from '@/components/aceternity'
import { NuevoEquipoModal } from './Equipos'
import { ModalProyectoWebSoftware } from './Inventario'
import { TIPO_PROYECTO_WEB_META, proyectosDeEmpresa, recurrenteWeb } from '@/lib/inventarioMeta'

const TIPOS_RESUMEN: TipoHw[] = ['DESKTOP', 'LAPTOP', 'SERVIDOR', 'IMPRESORA', 'CAMARA', 'RED', 'UPS']

// ---------- 1. Empresas y Cartera de Clientes ----------
export function EmpresasPage() {
  const { db, mutate } = useStore()
  const [tab, setTab] = useState<'bento' | 'cartera' | 'b2b'>('bento')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [addEquipoEmpresaId, setAddEquipoEmpresaId] = useState<number | null>(null)
  const [webModal, setWebModal] = useState<{ empresaId?: number } | null>(null)

  // Formulario de nuevo cliente en cartera (Empresa o Particular)
  const [tipoCliente, setTipoCliente] = useState<'EMPRESA' | 'PERSONA'>('EMPRESA')
  const [razonSocial, setRazonSocial] = useState('')
  const [rut, setRut] = useState('')
  const [giro, setGiro] = useState('Servicios TI / General')
  const [ciudad, setCiudad] = useState('Santiago')
  const [direccion, setDireccion] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [telefono, setTelefono] = useState('+56 9 ')

  const b2bEquipos = db.equipos.filter((e) => e.empresaId !== undefined)
  const clientesCartera = db.usuarios.filter(
    (u) => u.rol === 'CLIENTE_EMPRESA' || u.rol === 'CLIENTE_PERSONA',
  )

  const clientesFiltrados = clientesCartera.filter((u) => {
    if (!q.trim()) return true
    const emp = db.empresas.find((e) => e.id === u.empresaId)
    const haystack = `${u.nombre} ${u.email} ${u.rut ?? ''} ${u.telefono ?? ''} ${emp?.razonSocial ?? ''} ${emp?.rut ?? ''} ${emp?.ciudad ?? ''}`.toLowerCase()
    return haystack.includes(q.toLowerCase())
  })

  const empresasFiltradas = db.empresas.filter(
    (em) =>
      !q.trim() ||
      `${em.razonSocial} ${em.rut} ${em.ciudad} ${em.giro}`.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <>
      <BackgroundBeamsHeader
        badge="Ecosistema Corporativo B2B & Cartera CRM · Aceternity 3D + Motion"
        title={
          <>
            Cartera de Clientes &{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent">
              Empresas B2B
            </span>
          </>
        }
        subtitle="Base de datos centralizada con tarjetas interactivas 3D Tilt, desglose animado de parque tecnológico y validación automática al emitir cotizaciones u OT."
        actions={
          <>
            <MovingBorderBtn onClick={() => setOpen(true)}>
              + Registrar Cliente en Cartera
            </MovingBorderBtn>
            <Btn variant="secondary" onClick={() => setWebModal({})}>
              🌐 + Web / Software
            </Btn>
            <Link to="/app/cotizaciones?nuevo=1">
              <Btn variant="secondary">+ Emitir Cotización</Btn>
            </Link>
            <Link to="/app/equipos">
              <Btn variant="secondary">▣ Inventario ({b2bEquipos.length})</Btn>
            </Link>
          </>
        }
      />

      {/* Resumen de Cartera + Parque B2B con Aceternity Spotlight + Motion Spring Counters */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
        <SpotlightCard
          spotlightColor="rgba(255, 255, 255, 0.25)"
          className="rounded-2xl border border-emerald-700 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-3 text-white shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">📂</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">Cartera BD</span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold">
            <AnimatedNumber value={clientesCartera.length} />
          </div>
          <div className="text-[11px] font-medium text-emerald-100">
            {db.empresas.length} B2B · {clientesCartera.filter((x) => x.rol === 'CLIENTE_PERSONA').length} Partic.
          </div>
        </SpotlightCard>
        {TIPOS_RESUMEN.map((t, i) => {
          const m = TIPO_HW_META[t]
          const count = b2bEquipos.filter((e) => e.tipo === t).length
          return (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
            >
              <Link to="/app/equipos" className="block">
                <SpotlightCard
                  spotlightColor="rgba(16, 185, 129, 0.22)"
                  className="group rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">
                      {m.icon}
                    </span>
                    <Badge tone={m.tone}>{m.short}</Badge>
                  </div>
                  <div className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    <AnimatedNumber value={count} />
                  </div>
                  <div className="truncate text-[11px] font-medium text-slate-500">{m.label}</div>
                </SpotlightCard>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Pestañas con Motion layoutId y buscador de Cartera */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <AnimatedPillTabs
          layoutId="empresas-view-pill"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'bento', label: '✨ Bento 3D Empresas B2B', badge: db.empresas.length },
            { id: 'cartera', label: '👥 Cartera Completa de Clientes', badge: clientesCartera.length },
            { id: 'b2b', label: '🏢 Tabla Parque Corporativo', badge: db.empresas.length },
          ]}
        />

        <input
          className={`${inputCls} !w-72`}
          placeholder="Buscar por RUT, correo, empresa o contacto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait">
        {tab === 'bento' && (
          <motion.div
            key="bento"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {empresasFiltradas.map((em, idx) => {
              const c = db.usuarios.find((u) => u.id === em.contactoId)
              const eqs = db.equipos.filter((e) => e.empresaId === em.id)
              const otsEmp = db.ots.filter((o) => o.empresaId === em.id)
              const cotsEmp = db.cotizaciones.filter((ct) => ct.empresaId === em.id)
              const prog = db.programas.find((p) => p.empresaId === em.id && p.activo)
              const porTipo = TIPOS_RESUMEN
                .map((t) => ({ tipo: t, count: eqs.filter((e) => e.tipo === t).length }))
                .filter((x) => x.count > 0)

              return (
                <motion.div
                  key={em.id}
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.06, type: 'spring', stiffness: 240, damping: 24 }}
                >
                  <Tilt3DCard
                    spotlightColor={prog ? 'rgba(16, 185, 129, 0.22)' : 'rgba(56, 189, 248, 0.2)'}
                    className="h-full rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-emerald-50/35 p-5 shadow-md transition-shadow hover:shadow-xl"
                  >
                    {/* Top row: Company & Preventive Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-800 text-lg font-extrabold text-emerald-300 shadow-md ring-1 ring-emerald-400/30">
                          {em.razonSocial.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                            {em.razonSocial}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-mono font-semibold text-slate-700">{em.rut}</span>
                            <span>·</span>
                            <span>📍 {em.ciudad}</span>
                          </div>
                        </div>
                      </div>
                      <Badge tone={prog ? 'green' : 'slate'}>
                        {prog ? `⚡ Activa (-${prog.diasAviso}d)` : 'Sin alerta'}
                      </Badge>
                    </div>

                    <div className="mt-2 truncate text-xs font-medium text-slate-500">
                      {em.giro} · {em.direccion}
                    </div>

                    {/* Páginas Web / Software contratado con PCG */}
                    {(() => {
                      const webs = proyectosDeEmpresa(db.proyectosWeb, em.id, em.razonSocial)
                      if (webs.length === 0) {
                        return (
                          <button
                            type="button"
                            onClick={() => setWebModal({ empresaId: em.id })}
                            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white/70 px-3 py-2 text-left text-xs text-slate-500 transition hover:border-emerald-400 hover:text-emerald-700"
                          >
                            <span>🌐 Sin página web ni software con PCG</span>
                            <span className="font-bold">+ Ofrecer / Registrar</span>
                          </button>
                        )
                      }
                      const mensual = recurrenteWeb(webs)
                      return (
                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                          <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-900">
                            <span>✓ Tiene {webs.length} web/software con PCG</span>
                            {mensual > 0 && <span>{fmtCLP(mensual)} / mantención</span>}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {webs.map((w) => {
                              const m = TIPO_PROYECTO_WEB_META[w.tipo]
                              return (
                                <Link
                                  key={w.id}
                                  to="/app/proyectos"
                                  title={`${w.nombreProyecto} · ${w.urlDominio}`}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-emerald-200 hover:ring-emerald-400"
                                >
                                  {m.icon} {(w.urlDominio ?? w.nombreProyecto).replace(/^https?:\/\//, '')}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* KPIs mini inside 3D card */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-center">
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          <AnimatedNumber value={eqs.length} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipos</div>
                      </div>
                      <div className="border-x border-slate-200/80">
                        <div className="text-lg font-extrabold text-indigo-700">
                          <AnimatedNumber value={otsEmp.length} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Órdenes OT</div>
                      </div>
                      <div>
                        <div className="text-lg font-extrabold text-amber-600">
                          <AnimatedNumber value={cotsEmp.length} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cotiz.</div>
                      </div>
                    </div>

                    {/* Animated hardware distribution bar */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Composición del Parque TI</span>
                        <span className="text-emerald-700">{eqs.length} registrados</span>
                      </div>
                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200/70">
                        {porTipo.map(({ tipo, count }, barIdx) => {
                          const pct = Math.max(8, Math.round((count / Math.max(1, eqs.length)) * 100))
                          const colors = [
                            'bg-emerald-500',
                            'bg-sky-500',
                            'bg-violet-500',
                            'bg-amber-500',
                            'bg-rose-500',
                            'bg-teal-500',
                          ]
                          return (
                            <motion.div
                              key={tipo}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: 0.15 + barIdx * 0.08, type: 'spring' }}
                              className={cx('h-full first:rounded-l-full last:rounded-r-full', colors[barIdx % colors.length])}
                              title={`${TIPO_HW_META[tipo].label}: ${count}`}
                            />
                          )
                        })}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {porTipo.map(({ tipo, count }) => {
                          const meta = TIPO_HW_META[tipo]
                          return (
                            <Badge key={tipo} tone={meta.tone}>
                              {meta.icon} {count} {meta.short}
                            </Badge>
                          )
                        })}
                        {porTipo.length === 0 && (
                          <span className="text-xs text-slate-400">Sin equipos registrados</span>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    {c && (
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={c.nombre} color={c.color ?? '#10b981'} size={28} />
                          <div className="min-w-0">
                            <div className="truncate font-bold text-slate-800">{c.nombre}</div>
                            <div className="truncate font-mono text-[11px] text-emerald-700">{c.email}</div>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {c.cargo ?? 'TI'}
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <div className="flex gap-1.5">
                        <Btn size="sm" variant="secondary" onClick={() => setAddEquipoEmpresaId(em.id)}>
                          + Equipo
                        </Btn>
                        {c && (
                          <Link
                            to={`/app/cotizaciones?nuevo=1&clienteId=${c.id}`}
                            className="inline-flex items-center rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
                          >
                            + Cotizar
                          </Link>
                        )}
                      </div>
                      <Link
                        to={`/app/equipos?empresa=${em.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Parque 360° →
                      </Link>
                    </div>
                  </Tilt3DCard>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {tab === 'cartera' && (
          <motion.div
            key="cartera"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Table head={['Cliente / Razón Social', 'Tipo', 'RUT y Ubicación', 'Contacto y Correo (para Cotizaciones)', 'Historial en PCG SPA', 'Web / Software con PCG', 'Acciones Rápidas']}>
              {clientesFiltrados.map((u) => {
                const emp = db.empresas.find((e) => e.id === u.empresaId)
                const cots = db.cotizaciones.filter((c) => c.usuarioId === u.id || (emp && c.empresaId === emp.id))
                const ots = db.ots.filter((o) => o.usuarioId === u.id || (emp && o.empresaId === emp.id))
                const eqs = db.equipos.filter((e) => (emp ? e.empresaId === emp.id : e.usuarioId === u.id))
                const correos = db.correos.filter((m) =>
                  m.para.toLowerCase().includes(u.email.toLowerCase()),
                )
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className={td}>
                      <div className="font-bold text-slate-900">{emp?.razonSocial ?? u.nombre}</div>
                      <div className="text-xs text-slate-500">
                        {emp ? `Contacto: ${u.nombre} (${u.cargo ?? 'Encargado TI'})` : 'Cliente Particular / Persona Natural'}
                      </div>
                    </td>
                    <td className={td}>
                      <Badge tone={emp ? 'violet' : 'blue'}>
                        {emp ? '🏢 Empresa B2B' : '👤 Particular'}
                      </Badge>
                    </td>
                    <td className={td}>
                      <div className="font-mono text-xs font-semibold text-slate-800">{emp?.rut ?? u.rut ?? 'Sin RUT'}</div>
                      <div className="text-xs text-slate-500">{emp ? `${emp.giro} · ${emp.ciudad}` : 'Atención directa'}</div>
                    </td>
                    <td className={td}>
                      <div className="font-mono text-xs font-semibold text-emerald-700">✉ {u.email}</div>
                      <div className="text-xs text-slate-500">📞 {u.telefono ?? '+56 9 4938 4043'}</div>
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={cots.length > 0 ? 'amber' : 'slate'}>{cots.length} cotiz.</Badge>
                        <Badge tone={ots.length > 0 ? 'blue' : 'slate'}>{ots.length} OT</Badge>
                        <Badge tone={eqs.length > 0 ? 'green' : 'slate'}>{eqs.length} eq.</Badge>
                        {correos.length > 0 && <Badge tone="violet">✉ {correos.length} envíos</Badge>}
                      </div>
                    </td>
                    <td className={td}>
                      {(() => {
                        const webs = emp
                          ? proyectosDeEmpresa(db.proyectosWeb, emp.id, emp.razonSocial)
                          : (db.proyectosWeb ?? []).filter(
                              (p) => p.usuarioId === u.id || p.clienteNombre.trim().toLowerCase() === u.nombre.trim().toLowerCase(),
                            )
                        if (webs.length === 0) {
                          return <span className="text-xs text-slate-400">— No tiene</span>
                        }
                        return (
                          <div className="flex flex-col gap-1">
                            {webs.map((w) => (
                              <Badge key={w.id} tone={TIPO_PROYECTO_WEB_META[w.tipo].tone}>
                                {TIPO_PROYECTO_WEB_META[w.tipo].icon} {TIPO_PROYECTO_WEB_META[w.tipo].short}
                                {w.incluyeMantencionWeb ? ' + Mant.' : ''}
                              </Badge>
                            ))}
                          </div>
                        )
                      })()}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link
                          to={`/app/cotizaciones?nuevo=1&clienteId=${u.id}`}
                          className="inline-flex items-center rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-500"
                        >
                          + Cotizar
                        </Link>
                        {emp && (
                          <Link
                            to={`/app/equipos?empresa=${emp.id}`}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Parque ({eqs.length})
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </Table>
          </motion.div>
        )}

        {tab === 'b2b' && (
          <motion.div
            key="b2b"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Table head={['Razón Social', 'RUT / Ciudad', 'Contacto', 'Parque y desglose por tipo de equipo', 'Alertas preventivas', 'Acciones']}>
              {empresasFiltradas.map((em) => {
                const c = db.usuarios.find((u) => u.id === em.contactoId)
                const eqs = db.equipos.filter((e) => e.empresaId === em.id)
                const prog = db.programas.find((p) => p.empresaId === em.id && p.activo)
                const porTipo = TIPOS_RESUMEN
                  .map((t) => ({ tipo: t, count: eqs.filter((e) => e.tipo === t).length }))
                  .filter((x) => x.count > 0)

                return (
                  <tr key={em.id}>
                    <td className={td}>
                      <div className="font-bold text-slate-900">{em.razonSocial}</div>
                      <div className="text-xs text-slate-500">{em.direccion}</div>
                    </td>
                    <td className={td}>
                      <div className="font-mono text-xs font-semibold text-slate-800">{em.rut}</div>
                      <div className="text-xs text-slate-500">{em.giro} · {em.ciudad}</div>
                    </td>
                    <td className={td}>
                      <div className="font-medium text-slate-800">{c?.nombre}</div>
                      <div className="text-xs text-slate-400">{c?.email}</div>
                    </td>
                    <td className={td}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-extrabold text-white">
                          {eqs.length} equipos en total
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {porTipo.map(({ tipo, count }) => {
                          const meta = TIPO_HW_META[tipo]
                          return (
                            <Badge key={tipo} tone={meta.tone}>
                              {meta.icon} {count} {meta.short}
                            </Badge>
                          )
                        })}
                        {porTipo.length === 0 && <span className="text-xs text-slate-400">Sin equipos registrados</span>}
                      </div>
                    </td>
                    <td className={td}>
                      <Badge tone={prog ? 'green' : 'slate'}>{prog ? `Activas (-${prog.diasAviso}d)` : 'Inactivas'}</Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Btn size="sm" variant="secondary" onClick={() => setAddEquipoEmpresaId(em.id)}>
                          + Equipo
                        </Btn>
                        <Link
                          to={`/app/equipos?empresa=${em.id}`}
                          className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Administrar parque →
                        </Link>
                        <Link
                          to="/app/alertas"
                          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Alertas
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </Table>
          </motion.div>
        )}
      </AnimatePresence>

      {addEquipoEmpresaId !== null && (
        <NuevoEquipoModal
          defaultEmpresaId={addEquipoEmpresaId}
          onClose={() => setAddEquipoEmpresaId(null)}
        />
      )}

      {webModal && (
        <ModalProyectoWebSoftware
          empresaIdInicial={webModal.empresaId}
          onClose={() => setWebModal(null)}
        />
      )}

      {open && (
        <Modal open onClose={() => setOpen(false)} title="Registrar Cliente en Cartera (con sugerencias y autorelleno en vivo)" wide>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              mutate((d) => {
                resolverORegistrarCliente(d, {
                  modo: 'VALIDAR_O_NUEVO',
                  tipoCliente,
                  razonSocial: tipoCliente === 'EMPRESA' ? razonSocial : contactoNombre,
                  rut,
                  giro,
                  ciudad,
                  direccion,
                  nombreContacto: contactoNombre,
                  email: contactoEmail,
                  telefono,
                  inscribirAlertas: true,
                })
              })
              setOpen(false)
            }}
          >
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={() => setTipoCliente('EMPRESA')}
                className={cx(
                  'flex-1 rounded-xl border px-3 py-2 text-xs font-extrabold transition',
                  tipoCliente === 'EMPRESA'
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 bg-white text-slate-600',
                )}
              >
                🏢 Empresa B2B (con RUT, Giro y Alertas)
              </button>
              <button
                type="button"
                onClick={() => setTipoCliente('PERSONA')}
                className={cx(
                  'flex-1 rounded-xl border px-3 py-2 text-xs font-extrabold transition',
                  tipoCliente === 'PERSONA'
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 bg-white text-slate-600',
                )}
              >
                👤 Cliente Particular / Persona Natural
              </button>
            </div>

            {/* Sugerencias en vivo mientras escribe en el modal de Cartera */}
            {(() => {
              const qStr = `${razonSocial} ${contactoNombre} ${rut} ${contactoEmail}`.trim().toLowerCase()
              if (qStr.length < 2) return null
              const sugs = clientesCartera.filter((u) => {
                const em = db.empresas.find((e) => e.id === u.empresaId)
                const hay = `${em?.razonSocial ?? ''} ${u.nombre} ${em?.rut ?? u.rut ?? ''} ${u.email}`.toLowerCase()
                return (
                  (razonSocial.trim().length >= 2 && hay.includes(razonSocial.trim().toLowerCase())) ||
                  (contactoNombre.trim().length >= 2 && hay.includes(contactoNombre.trim().toLowerCase())) ||
                  (rut.trim().length >= 2 && hay.includes(rut.trim().toLowerCase())) ||
                  (contactoEmail.trim().length >= 2 && hay.includes(contactoEmail.trim().toLowerCase()))
                )
              })
              if (sugs.length === 0) return null
              return (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-2.5 sm:col-span-2">
                  <div className="mb-1.5 text-[11px] font-extrabold text-emerald-900">
                    💡 Clientes ya registrados que coinciden (Haz clic para autorellenar sus datos):
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {sugs.slice(0, 4).map((u) => {
                      const em = db.empresas.find((e) => e.id === u.empresaId)
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setTipoCliente(em ? 'EMPRESA' : 'PERSONA')
                            setRazonSocial(em?.razonSocial ?? u.nombre)
                            setRut(em?.rut ?? u.rut ?? '')
                            setGiro(em?.giro ?? 'Servicios TI / General')
                            setCiudad(em?.ciudad ?? 'Santiago')
                            setDireccion(em?.direccion ?? '')
                            setContactoNombre(u.nombre)
                            setContactoEmail(u.email)
                            setTelefono(u.telefono ?? '+56 9 ')
                          }}
                          className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-left text-xs hover:border-emerald-400"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-bold text-slate-900">
                              {em ? `🏢 ${em.razonSocial}` : `👤 ${u.nombre}`}
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                              RUT {em?.rut ?? u.rut ?? 'S/R'} · {u.email}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            ⚡ Autorellenar
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {tipoCliente === 'EMPRESA' && (
              <Field label="Razón Social (Escribe para buscar o registrar)"><input className={inputCls} value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required placeholder="Ej: Constructora Andes / Inversiones..." /></Field>
            )}
            <Field label={tipoCliente === 'EMPRESA' ? 'RUT Empresa' : 'RUT Cliente'}>
              <input className={inputCls} value={rut} onChange={(e) => setRut(e.target.value)} required placeholder="76.XXX.XXX-X" />
            </Field>
            {tipoCliente === 'EMPRESA' && (
              <>
                <Field label="Giro"><input className={inputCls} value={giro} onChange={(e) => setGiro(e.target.value)} required /></Field>
                <Field label="Ciudad"><input className={inputCls} value={ciudad} onChange={(e) => setCiudad(e.target.value)} required /></Field>
                <div className="sm:col-span-2"><Field label="Dirección comercial"><input className={inputCls} value={direccion} onChange={(e) => setDireccion(e.target.value)} required /></Field></div>
              </>
            )}
            <Field label={tipoCliente === 'EMPRESA' ? 'Nombre del contacto (Escribe para buscar)' : 'Nombre completo (Escribe para buscar)'}>
              <input className={inputCls} value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} required placeholder="Ej: Pedro Muñoz / Carolina Reyes..." />
            </Field>
            <Field label="Correo electrónico (para cotizaciones y alertas)">
              <input type="email" className={inputCls} value={contactoEmail} onChange={(e) => setContactoEmail(e.target.value)} required />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input className={inputCls} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Btn type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
              <Btn type="submit">Validar y Guardar en Cartera</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ---------- 2. Personal / Trabajadores ----------
export function PersonalPage() {
  const { db, mutate } = useStore()
  const [open, setOpen] = useState(false)
  const [inlineEdit, setInlineEdit] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('pcg123')
  const [rol, setRol] = useState<Rol>('WORKER')
  const [especialidad, setEspecialidad] = useState<EspecialidadWorker>('TECNICO')
  const [aptoTecnico, setAptoTecnico] = useState(true)
  const [aptoDesarrollador, setAptoDesarrollador] = useState(false)
  const [rolEtiqueta, setRolEtiqueta] = useState('🎨 Diseñador / Especialista')
  const [cargo, setCargo] = useState('Técnico de soporte y mantención')
  const [titulo, setTitulo] = useState('Ingeniero / Técnico')
  const [horas, setHoras] = useState(40)
  const [color, setColor] = useState('#0ea5e9')

  const staff = db.usuarios.filter((u) => u.rol === 'ADMIN' || u.rol === 'DOC_PROCESS' || u.rol === 'WORKER')

  const openEdit = (u: (typeof staff)[number]) => {
    setEditId(u.id)
    setNombre(u.nombre)
    setEmail(u.email)
    setPassword(u.password || 'pcg123')
    setRol(u.rol)
    setEspecialidad(u.especialidad ?? getWorkerEspecialidad(u))
    setAptoTecnico(u.aptoTecnico !== undefined ? u.aptoTecnico : isAptoTecnico(u))
    setAptoDesarrollador(u.aptoDesarrollador !== undefined ? u.aptoDesarrollador : isAptoDesarrollador(u))
    setRolEtiqueta(u.rolEtiqueta ?? ROL_LABEL[u.rol])
    setCargo(u.cargo ?? '')
    setTitulo(u.titulo ?? '')
    setHoras(u.horasSemanales ?? 40)
    setColor(u.color ?? '#0ea5e9')
    setOpen(true)
  }

  const openNew = () => {
    setEditId(null)
    setNombre('')
    setEmail('')
    setPassword('pcg123')
    setRol('WORKER')
    setEspecialidad('TECNICO')
    setAptoTecnico(true)
    setAptoDesarrollador(false)
    setRolEtiqueta('🛠️ Especialista Técnico')
    setCargo('Técnico de soporte y mantención')
    setTitulo('Ingeniero / Técnico')
    setHoras(40)
    setColor('#0ea5e9')
    setOpen(true)
  }

  return (
    <>
      <BackgroundBeamsHeader
        variant="indigo"
        badge="Equipo Directivo, Finanzas, Seguridad & Diseño · PCG SPA"
        title="Personal y Especialidades de PCG SPA"
        subtitle="Haz clic en '✎ Editar Personal' en cualquier integrante o activa la 'Edición Directa en Tabla' para modificar nombre, rol, cargo, título profesional o capacidad."
        actions={
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="secondary"
              onClick={() => setInlineEdit((v) => !v)}
            >
              {inlineEdit ? '✓ Salir de Edición en Tabla' : '⚡ Edición Directa en Tabla'}
            </Btn>
            <MovingBorderBtn onClick={openNew}>
              + Crear trabajador / usuario interno
            </MovingBorderBtn>
          </div>
        }
      />

      {/* Tarjetas ejecutivas de los roles clave de PCG SPA */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {staff.map((u) => {
          const badgeTone =
            u.rol === 'ADMIN'
              ? 'blue'
              : u.rol === 'DOC_PROCESS'
                ? 'green'
                : u.nombre.toLowerCase().includes('javier')
                  ? 'violet'
                  : 'amber'
          return (
            <SpotlightCard key={u.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.nombre} color={u.color ?? '#1fb04a'} size={40} />
                  <div>
                    <div className="font-extrabold text-slate-900">{u.nombre}</div>
                    <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge tone={badgeTone}>{u.rolEtiqueta ?? ROL_LABEL[u.rol]}</Badge>
                {u.rol === 'WORKER' && (
                  <Badge tone="violet">
                    {ESPECIALIDAD_WORKER_META[getWorkerEspecialidad(u)].icon}{' '}
                    {ESPECIALIDAD_WORKER_META[getWorkerEspecialidad(u)].label}
                  </Badge>
                )}
              </div>
              <div className="mt-2 text-xs font-bold text-slate-800">{u.cargo}</div>
              {u.titulo && <div className="mt-0.5 text-[11px] text-slate-500">{u.titulo}</div>}
              {/* Casillas de Habilitación de Aptitud */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    mutate((d) => {
                      const x = d.usuarios.find((y) => y.id === u.id)
                      if (x) x.aptoTecnico = !isAptoTecnico(x)
                    })
                  }
                  className={cx(
                    'inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition shadow-2xs',
                    isAptoTecnico(u)
                      ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border border-slate-200 bg-slate-100 text-slate-400 opacity-80 hover:bg-slate-200',
                  )}
                  title="Clic para habilitar o inhabilitar como Técnico"
                >
                  <span>{isAptoTecnico(u) ? '✓' : '✗'}</span>
                  <span>🛠️ Técnico</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    mutate((d) => {
                      const x = d.usuarios.find((y) => y.id === u.id)
                      if (x) x.aptoDesarrollador = !isAptoDesarrollador(x)
                    })
                  }
                  className={cx(
                    'inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition shadow-2xs',
                    isAptoDesarrollador(u)
                      ? 'border border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100'
                      : 'border border-slate-200 bg-slate-100 text-slate-400 opacity-80 hover:bg-slate-200',
                  )}
                  title="Clic para habilitar o inhabilitar como Desarrollador Web"
                >
                  <span>{isAptoDesarrollador(u) ? '✓' : '✗'}</span>
                  <span>💻 Desarrollador</span>
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                <span className="text-slate-500">
                  {u.rol === 'WORKER' ? `Planner: ${u.horasSemanales ?? 40} h/sem` : 'Acceso Ejecutivo Global'}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(u)}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white shadow-2xs transition hover:bg-emerald-500"
                >
                  ✎ Editar Personal
                </button>
              </div>
            </SpotlightCard>
          )
        })}
      </div>

      <Table head={['Trabajador', 'Correo (login)', 'Rol / Especialidad', 'Cargo / Título', 'Aptitud Laboral', 'Capacidad Planner', 'Estado', 'Acciones']}>
        {staff.map((u) => {
          const badgeTone =
            u.rol === 'ADMIN'
              ? 'blue'
              : u.rol === 'DOC_PROCESS'
                ? 'green'
                : u.nombre.toLowerCase().includes('javier')
                  ? 'violet'
                  : 'amber'
          return (
            <tr key={u.id} className="hover:bg-slate-50/70">
              <td className={td}>
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.nombre} color={u.color ?? '#1fb04a'} />
                  {inlineEdit ? (
                    <input
                      className={`${inputCls} !py-1 text-xs font-bold`}
                      value={u.nombre}
                      onChange={(e) =>
                        mutate((d) => {
                          const target = d.usuarios.find((x) => x.id === u.id)
                          if (target) target.nombre = e.target.value
                        })
                      }
                    />
                  ) : (
                    <span className="font-bold text-slate-900">{u.nombre}</span>
                  )}
                </div>
              </td>
              <td className={`${td} font-mono text-xs`}>
                {inlineEdit ? (
                  <input
                    className={`${inputCls} !py-1 text-xs`}
                    value={u.email}
                    onChange={(e) =>
                      mutate((d) => {
                        const target = d.usuarios.find((x) => x.id === u.id)
                        if (target) target.email = e.target.value
                      })
                    }
                  />
                ) : (
                  u.email
                )}
              </td>
              <td className={td}>
                {inlineEdit ? (
                  <div className="space-y-1">
                    <select
                      className={`${inputCls} !py-1 text-xs`}
                      value={u.rol}
                      onChange={(e) =>
                        mutate((d) => {
                          const target = d.usuarios.find((x) => x.id === u.id)
                          if (target) target.rol = e.target.value as Rol
                        })
                      }
                    >
                      <option value="ADMIN">👑 CEO / Administrador</option>
                      <option value="DOC_PROCESS">💼 Jefa Sucursal & Finanzas</option>
                      <option value="WORKER">🛠️ Especialista / Diseñador / Técnico</option>
                    </select>
                    <input
                      className={`${inputCls} !py-1 text-xs`}
                      value={u.rolEtiqueta ?? ROL_LABEL[u.rol]}
                      placeholder="Etiqueta visible del rol"
                      onChange={(e) =>
                        mutate((d) => {
                          const target = d.usuarios.find((x) => x.id === u.id)
                          if (target) target.rolEtiqueta = e.target.value
                        })
                      }
                    />
                  </div>
                ) : (
                  <>
                    <Badge tone={badgeTone}>{u.rolEtiqueta ?? ROL_LABEL[u.rol]}</Badge>
                    {u.rol === 'WORKER' && (
                      <div className="mt-1">
                        <Badge tone="violet">
                          {ESPECIALIDAD_WORKER_META[getWorkerEspecialidad(u)].icon}{' '}
                          {ESPECIALIDAD_WORKER_META[getWorkerEspecialidad(u)].label}
                        </Badge>
                      </div>
                    )}
                    <div className="mt-0.5 text-[10px] text-slate-400">Permiso: {ROL_LABEL[u.rol]}</div>
                  </>
                )}
              </td>
              <td className={td}>
                {inlineEdit ? (
                  <div className="space-y-1">
                    <input
                      className={`${inputCls} !py-1 text-xs font-semibold`}
                      value={u.cargo ?? ''}
                      placeholder="Cargo en la empresa"
                      onChange={(e) =>
                        mutate((d) => {
                          const target = d.usuarios.find((x) => x.id === u.id)
                          if (target) target.cargo = e.target.value
                        })
                      }
                    />
                    <input
                      className={`${inputCls} !py-1 text-xs`}
                      value={u.titulo ?? ''}
                      placeholder="Título profesional / mención"
                      onChange={(e) =>
                        mutate((d) => {
                          const target = d.usuarios.find((x) => x.id === u.id)
                          if (target) target.titulo = e.target.value
                        })
                      }
                    />
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-slate-900">{u.cargo ?? '—'}</div>
                    {u.titulo && <div className="text-xs text-slate-500">{u.titulo}</div>}
                  </>
                )}
              </td>
              <td className={td}>
                <div className="flex flex-col gap-1 min-w-[130px]">
                  <button
                    type="button"
                    onClick={() =>
                      mutate((d) => {
                        const x = d.usuarios.find((y) => y.id === u.id)
                        if (x) x.aptoTecnico = !isAptoTecnico(x)
                      })
                    }
                    className={cx(
                      'inline-flex cursor-pointer items-center justify-between gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold transition shadow-2xs',
                      isAptoTecnico(u)
                        ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border border-slate-200 bg-slate-100 text-slate-400 line-through opacity-75 hover:bg-slate-200',
                    )}
                    title="Clic para cambiar aptitud técnica"
                  >
                    <span>🛠️ Técnico:</span>
                    <span>{isAptoTecnico(u) ? '✓ HABILITADO' : '✗ NO APTO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      mutate((d) => {
                        const x = d.usuarios.find((y) => y.id === u.id)
                        if (x) x.aptoDesarrollador = !isAptoDesarrollador(x)
                      })
                    }
                    className={cx(
                      'inline-flex cursor-pointer items-center justify-between gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold transition shadow-2xs',
                      isAptoDesarrollador(u)
                        ? 'border border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100'
                        : 'border border-slate-200 bg-slate-100 text-slate-400 line-through opacity-75 hover:bg-slate-200',
                    )}
                    title="Clic para cambiar aptitud como desarrollador web"
                  >
                    <span>💻 Web / Dev:</span>
                    <span>{isAptoDesarrollador(u) ? '✓ HABILITADO' : '✗ NO APTO'}</span>
                  </button>
                </div>
              </td>
              <td className={td}>
                {inlineEdit && u.rol === 'WORKER' ? (
                  <input
                    type="number"
                    className={`${inputCls} !w-20 !py-1 text-xs`}
                    value={u.horasSemanales ?? 40}
                    onChange={(e) =>
                      mutate((d) => {
                        const target = d.usuarios.find((x) => x.id === u.id)
                        if (target) target.horasSemanales = Number(e.target.value)
                      })
                    }
                  />
                ) : u.rol === 'WORKER' ? (
                  `${u.horasSemanales ?? 40} h/sem`
                ) : (
                  'Dirección / Gestión'
                )}
              </td>
              <td className={td}><Badge tone={u.activo ? 'green' : 'red'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
              <td className={`${td} text-right`}>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Btn size="sm" onClick={() => openEdit(u)}>
                    ✎ Editar Personal
                  </Btn>
                  {u.id !== 1 && (
                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() => mutate((d) => { const x = d.usuarios.find((y) => y.id === u.id)!; x.activo = !x.activo })}
                    >
                      {u.activo ? 'Desactivar' : 'Reactivar'}
                    </Btn>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </Table>

      {open && (
        <Modal
          open
          onClose={() => setOpen(false)}
          title={editId ? `✎ Editar Personal: ${nombre}` : 'Crear nuevo integrante de PCG SPA'}
          wide
        >
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              mutate((d) => {
                if (editId) {
                  const target = d.usuarios.find((x) => x.id === editId)
                  if (target) {
                    target.nombre = nombre
                    target.email = email
                    target.password = password || 'pcg123'
                    target.rol = rol
                    target.especialidad = rol === 'WORKER' ? especialidad : undefined
                    target.aptoTecnico = aptoTecnico
                    target.aptoDesarrollador = aptoDesarrollador
                    target.rolEtiqueta = rolEtiqueta.trim() || ROL_LABEL[rol]
                    target.cargo = cargo
                    target.titulo = titulo
                    target.horasSemanales = horas
                    target.color = color
                  }
                } else {
                  d.usuarios.push({
                    id: nextId(d.usuarios),
                    nombre,
                    email,
                    password: password || 'pcg123',
                    rol,
                    especialidad: rol === 'WORKER' ? especialidad : undefined,
                    aptoTecnico,
                    aptoDesarrollador,
                    rolEtiqueta: rolEtiqueta.trim() || ROL_LABEL[rol],
                    activo: true,
                    cargo,
                    titulo,
                    horasSemanales: horas,
                    color,
                  })
                }
              })
              setOpen(false)
            }}
          >
            {/* Plantillas rápidas de rol para 1 clic */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                ⚡ Plantillas rápidas de Rol / Especialidad en PCG SPA (Clic para rellenar):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: '👑 CEO / Administrador (Brilan)',
                    rol: 'ADMIN' as Rol,
                    especialidad: 'SOPORTE_GENERAL' as EspecialidadWorker,
                    aptoTecnico: true,
                    aptoDesarrollador: true,
                    etiqueta: '👑 CEO / Fundador & Administrador',
                    cargo: 'CEO / Fundador & Director de Ingeniería TI',
                    titulo: 'Ingeniero Informático · Licenciado en Ciencias de la Ingeniería Informática',
                  },
                  {
                    label: '💼 Jefa de Sucursal & Finanzas (Yovylin)',
                    rol: 'DOC_PROCESS' as Rol,
                    especialidad: 'SOPORTE_GENERAL' as EspecialidadWorker,
                    aptoTecnico: false,
                    aptoDesarrollador: false,
                    etiqueta: '💼 Jefa de Sucursal & Finanzas',
                    cargo: 'Jefa de Sucursal, Encargada de Finanzas, Facturación y Procesos',
                    titulo: 'Ingeniera Civil Industrial · Administración Financiera y Control de Gestión',
                  },
                  {
                    label: '🛡️ Seguridad Privada / Prevencionista Penal (Johan)',
                    rol: 'WORKER' as Rol,
                    especialidad: 'TECNICO' as EspecialidadWorker,
                    aptoTecnico: true,
                    aptoDesarrollador: false,
                    etiqueta: '🛡️ Ing. Seguridad Privada / Prevencionista Penal',
                    cargo: 'Seguridad Privada, Prevención de Riesgos con Mención Penal & Soporte',
                    titulo: 'Ingeniero en Seguridad Privada / Prevencionista con Mención Penal',
                  },
                  {
                    label: '🎨 Diseñador Logos & Tarjetas (Javier)',
                    rol: 'WORKER' as Rol,
                    especialidad: 'DISENADOR' as EspecialidadWorker,
                    aptoTecnico: true,
                    aptoDesarrollador: true,
                    etiqueta: '🎨 Diseñador (Logos y Tarjetas) & Técnico',
                    cargo: 'Diseñador Gráfico Corporativo (Logos, Tarjetas de Presentación, Branding) & Staff Técnico',
                    titulo: 'Diseñador Gráfico · Especialista en Tarjetas de Presentación y Logos',
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setRol(preset.rol)
                      setEspecialidad(preset.especialidad)
                      setAptoTecnico(preset.aptoTecnico)
                      setAptoDesarrollador(preset.aptoDesarrollador)
                      setRolEtiqueta(preset.etiqueta)
                      setCargo(preset.cargo)
                      setTitulo(preset.titulo)
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Nombre completo"><input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} required /></Field>
            <Field label="Correo corporativo (login)"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@pcg.cl" /></Field>
            <Field label="Nivel de permisos en el sistema">
              <select
                className={inputCls}
                value={rol}
                onChange={(e) => {
                  const nextRol = e.target.value as Rol
                  setRol(nextRol)
                }}
              >
                <option value="ADMIN">👑 CEO / Administrador General</option>
                <option value="DOC_PROCESS">💼 Jefa de Sucursal & Finanzas (Facturas, Caja, Cotizaciones, OT)</option>
                <option value="WORKER">🛠️ Trabajador / Especialista (Técnico, Diseñador, etc.)</option>
              </select>
            </Field>

            {rol === 'WORKER' && (
              <Field label="Especialidad y Perfil de Acceso (Limita qué módulos puede ver en el sistema)">
                <select
                  className={`${inputCls} font-bold text-violet-800 bg-violet-50/60`}
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value as EspecialidadWorker)}
                >
                  <option value="TECNICO">🛠️ Técnico Hardware & Soporte (Equipos, Bitácora, Taller, Tareas y OT)</option>
                  <option value="DISENADOR">🎨 Diseñador Gráfico & Branding (Proyectos, Logos, Tarjetas, Web y OT)</option>
                  <option value="DESARROLLADOR">💻 Desarrollador Web & Software (Proyectos, Tiendas, Código y Sistemas)</option>
                  <option value="SOPORTE_GENERAL">⚙️ Soporte General</option>
                </select>
              </Field>
            )}

            {/* Casillas de Habilitación de Aptitudes Laborales */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 sm:col-span-2 space-y-2.5 shadow-2xs">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Casillas de Aptitud Laboral y Asignación de Proyectos:</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500 normal-case">
                  Activa o desactiva según sus competencias
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                  aptoTecnico ? "border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-400" : "border-slate-200 bg-white hover:bg-slate-50"
                )}>
                  <input
                    type="checkbox"
                    checked={aptoTecnico}
                    onChange={(e) => setAptoTecnico(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-emerald-600"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>🛠️</span>
                      <span>Apto para trabajar como Técnico</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 leading-snug">
                      Habilita al trabajador para realizar mantenciones, diagnósticos de hardware, usar herramientas de taller y participar como técnico de soporte en terreno y proyectos.
                    </div>
                  </div>
                </label>

                <label className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                  aptoDesarrollador ? "border-violet-500 bg-violet-50/90 ring-1 ring-violet-400" : "border-slate-200 bg-white hover:bg-slate-50"
                )}>
                  <input
                    type="checkbox"
                    checked={aptoDesarrollador}
                    onChange={(e) => setAptoDesarrollador(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-violet-600"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>💻</span>
                      <span>Apto como Desarrollador / Creativo Web</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 leading-snug">
                      Habilita al trabajador para programar páginas web, e-commerce, diseñar logos, tarjetas corporativas y participar en proyectos de software y plataformas web.
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <Field label="Etiqueta de Rol Visible (Ej: Jefa de Sucursal & Finanzas / Diseñador)">
              <input
                className={inputCls}
                value={rolEtiqueta}
                onChange={(e) => setRolEtiqueta(e.target.value)}
                placeholder="Ej: 🎨 Diseñador (Logos y Tarjetas) & Técnico"
                required
              />
            </Field>
            <Field label="Cargo en PCG SPA">
              <input
                className={inputCls}
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej: Jefa de Sucursal y Encargada de Finanzas"
                required
              />
            </Field>
            <Field label="Título profesional / Especialidad">
              <input
                className={inputCls}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Ingeniero en Seguridad Privada / Prevencionista con Mención Penal"
              />
            </Field>
            <Field label="Capacidad horas semanales (Planner)">
              <input type="number" className={inputCls} value={horas} onChange={(e) => setHoras(Number(e.target.value))} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Color Planner">
                <input type="color" className="h-10 w-full cursor-pointer rounded border border-slate-300" value={color} onChange={(e) => setColor(e.target.value)} />
              </Field>
              <Field label="Contraseña de acceso">
                <input className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
              <Btn type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
              <Btn type="submit">{editId ? '💾 Guardar cambios del personal' : '+ Crear trabajador'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ---------- 3. Catálogo, descuentos y condiciones ----------
export function CatalogoPage() {
  const { db, user, mutate } = useStore()
  const isAdmin = user!.rol === 'ADMIN'

  return (
    <>
      <PageHeader
        title="Catálogo de servicios y motor de descuentos"
        subtitle="Precios base para las plantillas de cotización Excel y reglas automáticas por volumen"
      />

      <Card title="Catálogo de servicios (alimenta las cotizaciones)">
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span>🏷️</span>
            <span>Tarifas Diferenciadas por Segmento</span>
          </div>
          <p>
            • <b className="text-emerald-700">Tarifa Clientes (Particular):</b> Precio para personas naturales y particulares.
            <br />
            • <b className="text-indigo-700">Tarifa Empresas (B2B / Nominal):</b> Tarifa corporativa estándar aplicada a empresas e instituciones.
            <br />
            • <b className="text-amber-700">Tarifa Convenio Empresa:</b> Tarifa preferencial pactada para empresas con contrato de mantención recurrente.
          </p>
        </div>

        <Table
          head={[
            'Código',
            'Servicio',
            'Tarifa Clientes (Particular)',
            'Tarifa Empresas (B2B / Nominal)',
            'Tarifa Convenio Empresa',
            ...(isAdmin ? ['Costo Interno (solo CEO)'] : []),
          ]}
        >
          {db.servicios.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50/60 transition">
              <td className={`${td} font-mono text-xs font-bold text-slate-700`}>{s.codigo}</td>
              <td className={td}>
                <div className="font-semibold text-slate-900">{s.nombre}</div>
                <div className="text-xs text-slate-500 line-clamp-2">{s.descripcion}</div>
              </td>

              {/* 1. Tarifa Clientes Solamente (Persona Natural) */}
              <td className={td}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-700">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    className={`${inputCls} !w-32 border-emerald-300 bg-emerald-50/40 font-bold text-emerald-900 focus:border-emerald-500`}
                    value={s.tarifaCliente ?? s.normal}
                    onChange={(e) =>
                      mutate((d) => {
                        const target = d.servicios.find((x) => x.id === s.id)
                        if (target) {
                          const val = Number(e.target.value)
                          target.tarifaCliente = val
                        }
                      })
                    }
                  />
                </div>
                <span className="mt-0.5 block text-[10px] font-semibold text-emerald-700">Particular</span>
              </td>

              {/* 2. Tarifa Empresas (B2B / Nominal) */}
              <td className={td}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-700">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    className={`${inputCls} !w-32 border-indigo-300 bg-indigo-50/40 font-bold text-indigo-900 focus:border-indigo-500`}
                    value={s.tarifaEmpresa ?? s.normal}
                    onChange={(e) =>
                      mutate((d) => {
                        const target = d.servicios.find((x) => x.id === s.id)
                        if (target) {
                          const val = Number(e.target.value)
                          target.tarifaEmpresa = val
                          target.normal = val // Sincroniza para compatibilidad
                        }
                      })
                    }
                  />
                </div>
                <span className="mt-0.5 block text-[10px] font-semibold text-indigo-700">Corporativo B2B</span>
              </td>

              {/* 3. Tarifa Convenio Empresa */}
              <td className={td}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-700">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    className={`${inputCls} !w-28 border-amber-300 bg-amber-50/30 font-semibold text-amber-900 focus:border-amber-500`}
                    value={s.convenio}
                    onChange={(e) =>
                      mutate((d) => {
                        const target = d.servicios.find((x) => x.id === s.id)
                        if (target) target.convenio = Number(e.target.value)
                      })
                    }
                  />
                </div>
                <span className="mt-0.5 block text-[10px] text-amber-700">Con contrato</span>
              </td>

              {/* 4. Costo Interno (Solo CEO) */}
              {isAdmin && (
                <td className={td}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      className={`${inputCls} !w-28 font-medium text-slate-700`}
                      value={s.costo ?? 0}
                      onChange={(e) =>
                        mutate((d) => {
                          const target = d.servicios.find((x) => x.id === s.id)
                          if (target) target.costo = Number(e.target.value) || undefined
                        })
                      }
                    />
                  </div>
                  <span className="mt-0.5 block text-[10px] text-slate-400">Costo directo</span>
                </td>
              )}
            </tr>
          ))}
        </Table>
      </Card>

      <Card className="mt-6" title="Reglas de descuento automático por volumen de equipos">
        <div className="grid gap-3 sm:grid-cols-3">
          {db.descuentos.map((r, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">
                Rango: <b>{r.min}</b> a <b>{r.max ?? '∞'}</b> equipos
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  className={`${inputCls} !w-24`}
                  value={r.pct}
                  onChange={(e) => mutate((d) => { d.descuentos[idx].pct = Number(e.target.value) })}
                />
                <span className="text-sm font-semibold">% de descuento</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

// ---------- 4. Bandeja de correos simulados ----------
export function CorreosPage() {
  const { db, mutate } = useStore()
  const [editEmail, setEditEmail] = useState(false)
  const [senderEmail, setSenderEmail] = useState(db.config.email)

  return (
    <>
      <PageHeader
        title="Centro de Correos y Salida SMTP — PCG SPA"
        subtitle="Historial de cotizaciones, alertas preventivas (-7 días) y notificaciones enviadas desde el correo oficial de la empresa"
        actions={
          <Btn variant="secondary" onClick={() => setEditEmail(!editEmail)}>
            ⚙ Configurar correo remitente PCG SPA
          </Btn>
        }
      />

      {/* Tarjeta de cuenta remitente vinculada */}
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img src="/img/logo-pcg.png" alt="PCG SPA" className="h-10 rounded-xl bg-white px-2.5 py-1 shadow" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  Cuenta Remitente Corporativa
                </span>
                <Badge tone="green">● Lista para SMTP / Gmail</Badge>
              </div>
              <div className="mt-0.5 font-mono text-base font-extrabold text-white">
                {db.config.razonSocial} &lt;{db.config.email}&gt;
              </div>
              <div className="text-xs text-slate-300">
                Todas las cotizaciones y alertas preventivas quedan preparadas con este remitente para su vínculo directo en cPanel / Gmail SMTP.
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-emerald-200">
            <div className="text-2xl font-extrabold text-white">{db.correos.length}</div>
            <div>Correos despachados</div>
          </div>
        </div>

        {editEmail && (
          <form
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/15 pt-4"
            onSubmit={(e) => {
              e.preventDefault()
              mutate((d) => {
                d.config.email = senderEmail.trim() || d.config.email
              })
              setEditEmail(false)
            }}
          >
            <div className="min-w-72 flex-1">
              <label className="mb-1 block text-xs font-bold text-emerald-200">
                Correo oficial de PCG SPA (desde donde saldrán las cotizaciones y alertas)
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-sm text-slate-900"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                required
              />
            </div>
            <Btn type="submit">Guardar correo remitente</Btn>
          </form>
        )}
      </div>

      {db.correos.length === 0 ? (
        <Empty>Aún no se han enviado correos en esta sesión. Prueba crear/enviar una cotización o ejecutar el aviso semanal en Alertas Preventivas.</Empty>
      ) : (
        <div className="space-y-4">
          {db.correos.map((c) => {
            const tone =
              c.tipo === 'COTIZACION'
                ? 'blue'
                : c.tipo === 'ALERTA_PREVENTIVA'
                  ? 'amber'
                  : c.tipo === 'ESTADO_OT'
                    ? 'violet'
                    : 'green'
            return (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Badge tone={tone}>{c.tipo.replace('_', ' ')}</Badge>
                    <span className="text-sm font-extrabold text-slate-900">{c.asunto}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{fmtFechaHora(c.fecha)}</span>
                </div>
                <div className="grid gap-2 border-b border-slate-100 bg-white px-5 py-2.5 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-slate-400">De (Remitente PCG SPA):</span>{' '}
                    <span className="font-mono font-bold text-emerald-700">
                      {c.de ?? `${db.config.razonSocial} <${db.config.email}>`}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Para (Destinatario):</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{c.para}</span>
                    {c.cc && (
                      <span className="ml-2 text-slate-400">
                        (CC: <span className="font-mono">{c.cc}</span>)
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <pre className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/70 p-4 font-sans text-xs leading-relaxed text-slate-700">
                    {c.cuerpo}
                  </pre>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ---------- 5. Mis tareas (vista técnico) ----------
export function MisTareasPage() {
  const { db, user, mutate } = useStore()
  const tareas = db.tareas.filter((t) => t.asignadoId === user!.id)

  return (
    <>
      <PageHeader title="Mis tareas asignadas" subtitle="Actualiza el avance de tus tareas o abre la Orden de Trabajo para registrar la intervención en la hoja de vida" />
      {tareas.length === 0 ? (
        <Empty>No tienes tareas asignadas en este momento.</Empty>
      ) : (
        <Table head={['Tarea', 'Orden de Trabajo', 'Prioridad', 'Fecha límite', 'Horas est.', 'Estado', '']}>
          {tareas.map((t) => {
            const ot = db.ots.find((o) => o.id === t.otId)
            return (
              <tr key={t.id}>
                <td className={`${td} font-medium ${t.estado === 'HECHA' ? 'line-through text-slate-400' : ''}`}>{t.titulo}</td>
                <td className={td}>{ot?.codigo} · {ot?.titulo}</td>
                <td className={td}><Badge tone={prioTone[t.prioridad]}>{t.prioridad}</Badge></td>
                <td className={td}>{fmtFecha(t.limite)}</td>
                <td className={td}>{t.hEst} h</td>
                <td className={td}>
                  <select
                    className={`${inputCls} !w-36 !py-1 text-xs`}
                    value={t.estado}
                    onChange={(e) => mutate((d) => { d.tareas.find((x) => x.id === t.id)!.estado = e.target.value as Tarea['estado'] })}
                  >
                    {ESTADOS_TAREA.map((s) => <option key={s} value={s}>{ESTADO_TAREA_LABEL[s]}</option>)}
                  </select>
                  <div className="mt-1"><Badge tone={tareaTone[t.estado]}>{ESTADO_TAREA_LABEL[t.estado]}</Badge></div>
                </td>
                <td className={`${td} text-right`}>
                  {ot && (
                    <Link to={`/app/ot?ot=${ot.id}`} className="text-xs font-medium text-pcg-green hover:underline">
                      Abrir OT / Hoja de vida →
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
      )}
    </>
  )
}

export { fmtCLP }

