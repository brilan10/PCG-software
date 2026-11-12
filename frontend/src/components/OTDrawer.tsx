import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { cambiarEstadoOT, registrarIntervencion } from '@/lib/actions'
import { ESTADOS_OT, ESTADO_OT_LABEL, ESTADOS_TAREA, ESTADO_TAREA_LABEL } from '@/lib/types'
import type { Intervencion, ItemOT, Prioridad, Tarea } from '@/lib/types'
import {
  CHECKLIST_MANT, fmtCLP, fmtFecha, fmtFechaHora, nextId, today, addDays,
  TAREAS_MANTENCION, TAREAS_PROYECTO_WEB, TAREAS_SOFTWARE_MEDIDA, TAREAS_DISENO_BRANDING,
} from '@/lib/util'
import { otTone, pagoTone, tareaTone } from '@/lib/tones'
import OTSchedulerCalendar from './OTSchedulerCalendar'
import { Avatar, Badge, Btn, Field, Modal, inputCls, prioTone } from './kit'

export default function OTDrawer({ otId, onClose }: { otId: number | null; onClose: () => void }) {
  const { db, user, mutate } = useStore()
  const [tab, setTab] = useState<'tareas' | 'servicios' | 'calendario' | 'pago' | 'historial' | 'comentarios'>('tareas')
  const [nuevaTarea, setNuevaTarea] = useState('')
  const [comentario, setComentario] = useState('')
  const [intervOpen, setIntervOpen] = useState(false)
  const [servicioSel, setServicioSel] = useState<string>('')
  const [customDesc, setCustomDesc] = useState<string>('')
  const [customPrecio, setCustomPrecio] = useState<number>(0)
  const [customCant, setCustomCant] = useState<number>(1)
  const [feedbackFinanzas, setFeedbackFinanzas] = useState<string>('')

  const ot = db.ots.find((o) => o.id === otId)
  if (!ot || !user) return null
  const canManage = user.rol === 'ADMIN' || user.rol === 'DOC_PROCESS'
  const canWork = canManage || user.rol === 'WORKER'
  const cliente = db.usuarios.find((u) => u.id === ot.usuarioId)
  const empresa = db.empresas.find((e) => e.id === ot.empresaId)
  const proy = ot.proyectoId ? db.proyectosWeb?.find((p) => p.id === ot.proyectoId) : undefined
  const tareas = db.tareas.filter((t) => t.otId === ot.id)
  const hechas = tareas.filter((t) => t.estado === 'HECHA').length
  const pct = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : (ot.estado === 'ENTREGADO' ? 100 : 0)
  const workers = db.usuarios.filter((u) => u.rol === 'WORKER' && u.activo)

  const setTarea = (id: number, patch: Partial<Tarea>) =>
    mutate((d) => {
      const t = d.tareas.find((x) => x.id === id)
      if (!t) return
      Object.assign(t, patch)
    })

  const cargarPresetTareas = (tipo: 'WEB' | 'SOFTWARE' | 'BRANDING' | 'MANTENCION') => {
    let list = TAREAS_MANTENCION
    if (tipo === 'WEB') list = TAREAS_PROYECTO_WEB
    if (tipo === 'SOFTWARE') list = TAREAS_SOFTWARE_MEDIDA
    if (tipo === 'BRANDING') list = TAREAS_DISENO_BRANDING

    mutate((d) => {
      let prevId: number | undefined
      list.forEach((t, i) => {
        const id = nextId(d.tareas)
        d.tareas.push({
          id,
          otId: ot.id,
          titulo: t.titulo,
          asignadoId: ot.tecnicoId,
          estado: 'PENDIENTE',
          prioridad: 'MEDIA',
          hEst: t.horas,
          inicio: addDays(ot.inicio, Math.floor(i / 2)),
          limite: addDays(ot.inicio, Math.floor(i / 2) + 2),
          dependeDe: prevId,
        })
        prevId = id
      })
    })
  }

  return (
    <Modal open onClose={onClose} title={`${ot.codigo} · ${ot.titulo}`} wide>
      {/* Panel de control rápido exclusivo para Administración */}
      {canManage && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-extrabold tracking-wide uppercase text-emerald-300">
              Control Admin OT
            </span>
            <Badge tone={otTone[ot.estado]}>{ESTADO_OT_LABEL[ot.estado]}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ot.estado !== 'ENTREGADO' && (
              <Btn
                size="sm"
                onClick={() =>
                  mutate((d) =>
                    cambiarEstadoOT(
                      d,
                      ot.id,
                      'ENTREGADO',
                      `OT marcada como Terminada / Entregada por ${user.nombre}`,
                    ),
                  )
                }
              >
                ✓ Marcar OT como Terminada
              </Btn>
            )}
            {ot.estado !== 'CANCELADA' && (
              <Btn
                size="sm"
                variant="danger"
                onClick={() =>
                  mutate((d) =>
                    cambiarEstadoOT(
                      d,
                      ot.id,
                      'CANCELADA',
                      `OT cancelada por ${user.nombre}`,
                    ),
                  )
                }
              >
                ✕ Cancelar OT
              </Btn>
            )}
            {(ot.estado === 'ENTREGADO' || ot.estado === 'CANCELADA') && (
              <Btn
                size="sm"
                variant="secondary"
                onClick={() =>
                  mutate((d) =>
                    cambiarEstadoOT(
                      d,
                      ot.id,
                      'EN_REVISION',
                      `OT reabierta por ${user.nombre}`,
                    ),
                  )
                }
              >
                ↺ Reabrir OT
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* Banner de Proyecto Web / Software Vinculado */}
      {proy && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white shadow-2xs">🚀</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black text-indigo-700">{proy.codigo}</span>
                <span className="text-sm font-extrabold text-slate-900">{proy.nombreProyecto}</span>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                  {proy.tipo.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                Cliente: <span className="font-bold text-slate-800">{proy.clienteNombre}</span>
                {proy.urlDominio && (
                  <> · Dominio: <a href={proy.urlDominio.startsWith('http') ? proy.urlDominio : `https://${proy.urlDominio}`} target="_blank" rel="noreferrer" className="font-mono font-bold text-sky-700 hover:underline">{proy.urlDominio} ↗</a></>
                )}
                {proy.stackTecnologico && <> · Stack: <span className="font-semibold text-slate-700">{proy.stackTecnologico}</span></>}
              </div>
            </div>
          </div>
          <Link
            to="/app/proyectos"
            className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-50"
          >
            Ver en Módulo Proyectos ↗
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <div className="text-xs text-slate-500">Cliente ({empresa ? '🏢 Empresa B2B' : '👤 Cliente Natural'})</div>
          <div className="text-sm font-medium">{empresa?.razonSocial ?? cliente?.nombre}</div>
          <div className="text-xs text-slate-500">{cliente?.nombre} · {cliente?.email}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Planificación y Hora Reservada</div>
          <div className="text-sm font-medium">
            {fmtFecha(ot.inicio)} → {fmtFecha(ot.fin)}
            {ot.horaCita && <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">🕒 {ot.horaCita} hrs</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            <Badge tone={otTone[ot.estado]}>{ESTADO_OT_LABEL[ot.estado]}</Badge>
            <Badge tone={prioTone[ot.prioridad]}>{ot.prioridad}</Badge>
            <Badge tone={pagoTone[ot.estadoPago]}>Pago {ot.estadoPago.toLowerCase()}</Badge>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Monto y Modalidad</div>
          <div className="text-sm font-medium">{ot.total ? fmtCLP(ot.total) : '—'}</div>
          <div className="text-xs text-slate-500">
            {ot.tipo} · {ot.modalidadAtencion === 'DOMICILIO' ? '🚗 Domicilio' : '🏢 Laboratorio'}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-6">
        <Field label="Estado de la OT">
          <select
            className={inputCls}
            value={ot.estado}
            disabled={!canWork}
            onChange={(e) => mutate((d) => cambiarEstadoOT(d, ot.id, e.target.value as typeof ot.estado))}
          >
            {ESTADOS_OT.map((s) => <option key={s} value={s}>{ESTADO_OT_LABEL[s]}</option>)}
          </select>
        </Field>
        <Field label="🚀 Proyecto Web Vinculado">
          <select
            className={inputCls}
            value={ot.proyectoId ?? ''}
            disabled={!canManage}
            onChange={(e) => {
              const pid = e.target.value ? Number(e.target.value) : undefined
              mutate((d) => {
                d.ots.find((x) => x.id === ot.id)!.proyectoId = pid
              })
            }}
          >
            <option value="">Sin proyecto vinculado</option>
            {db.proyectosWeb?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombreProyecto}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Técnico / Responsable">
          <select
            className={inputCls}
            value={ot.tecnicoId ?? ''}
            disabled={!canManage}
            onChange={(e) =>
              mutate((d) => {
                const nextTec = e.target.value ? Number(e.target.value) : undefined
                d.ots.find((o) => o.id === ot.id)!.tecnicoId = nextTec
                d.tareas
                  .filter((t) => t.otId === ot.id && t.estado !== 'HECHA')
                  .forEach((t) => {
                    t.asignadoId = nextTec
                  })
              })
            }
          >
            <option value="">Sin asignar</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.nombre}</option>)}
          </select>
        </Field>
        <Field label="🕒 Hora agendada">
          <select
            className={inputCls}
            value={ot.horaCita ?? ''}
            disabled={!canWork}
            onChange={(e) =>
              mutate((d) => {
                d.ots.find((o) => o.id === ot.id)!.horaCita = e.target.value || undefined
              })
            }
          >
            <option value="">Sin hora fija</option>
            {['09:00', '10:30', '12:00', '15:00', '16:30', '18:00'].map((h) => (
              <option key={h} value={h}>{h} hrs</option>
            ))}
          </select>
        </Field>
        <Field label="Prioridad">
          <select
            className={inputCls}
            value={ot.prioridad}
            disabled={!canManage}
            onChange={(e) => mutate((d) => { d.ots.find((o) => o.id === ot.id)!.prioridad = e.target.value as Prioridad })}
          >
            {(['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as Prioridad[]).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Monto OT ($ CLP)">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={ot.total}
            disabled={!canManage}
            onChange={(e) => mutate((d) => { d.ots.find((o) => o.id === ot.id)!.total = Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="🌐 Proyecto Web / Software">
          <select
            className={inputCls}
            value={ot.proyectoId ?? ''}
            disabled={!canManage}
            onChange={(e) =>
              mutate((d) => {
                const target = d.ots.find((o) => o.id === ot.id)
                if (target) {
                  target.proyectoId = e.target.value ? Number(e.target.value) : undefined
                }
              })
            }
          >
            <option value="">Sin Proyecto Asociado (General)</option>
            {db.proyectosWeb?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.clienteNombre} - {p.nombreProyecto}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {ot.proyectoId && proy && (
          <Link
            to="/app/proyectos"
            className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-bold text-indigo-800 hover:bg-indigo-100"
          >
            <span>🌐 Proyecto:</span>
            <span>{proy.codigo} · {proy.nombreProyecto}</span>
          </Link>
        )}
        {ot.equipoIds.map((id) => {
          const e = db.equipos.find((x) => x.id === id)
          return e ? (
            <Badge key={id} tone="slate">
              {e.codigo} · {e.marca} {e.modelo} {e.serie ? `(S/N: ${e.serie})` : ''}
            </Badge>
          ) : null
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-b border-slate-200">
        <div className="flex flex-wrap gap-1">
          {(['tareas', 'servicios', 'calendario', 'pago', 'historial', 'comentarios'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize ${tab === t ? 'border-pcg-green text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'servicios'
                ? `💼 Servicios & Cobros (${(ot.serviciosRealizados ?? []).length})`
                : t === 'pago'
                  ? 'Pago y Factura'
                  : t === 'calendario'
                    ? '📅 Calendario y Tiempos'
                    : t}
              {t === 'tareas' && ` (${hechas}/${tareas.length})`}
            </button>
          ))}
        </div>
        {canWork && ot.equipoIds.length > 0 && <Btn size="sm" variant="secondary" onClick={() => setIntervOpen(true)}>+ Registrar intervención</Btn>}
      </div>

      {tab === 'tareas' && (
        <div className="mt-3">
          <div className="mb-4 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Avance de ejecución de fases ({hechas} de {tareas.length} completadas)</span>
              <span className="text-sm font-black text-emerald-700">{pct}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                style={{ width: `${tareas.length > 0 ? (hechas / tareas.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {tareas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center space-y-3">
              <div className="text-2xl">📋</div>
              <div className="text-sm font-bold text-slate-800">Esta OT aún no tiene fases ni tareas planificadas</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Carga una plantilla recomendada para comenzar a dar seguimiento al avance en vivo:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cargarPresetTareas('WEB')}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  🌐 Fases Web / E-Commerce (9)
                </button>
                <button
                  type="button"
                  onClick={() => cargarPresetTareas('SOFTWARE')}
                  className="rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
                >
                  💻 Fases Software a Medida (7)
                </button>
                <button
                  type="button"
                  onClick={() => cargarPresetTareas('BRANDING')}
                  className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-100"
                >
                  🎨 Fases Diseño & Branding (6)
                </button>
                <button
                  type="button"
                  onClick={() => cargarPresetTareas('MANTENCION')}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100"
                >
                  🛠️ Fases Mantención PC/Notebook (8)
                </button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {tareas.map((t) => {
                const w = db.usuarios.find((u) => u.id === t.asignadoId)
                const dep = tareas.find((x) => x.id === t.dependeDe)
                const editable = canManage || (user.rol === 'WORKER' && t.asignadoId === user.id)
                const isHecha = t.estado === 'HECHA'

                return (
                  <li
                    key={t.id}
                    className={`rounded-xl border p-3 transition ${
                      isHecha ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isHecha}
                        disabled={!editable}
                        onChange={(e) =>
                          setTarea(t.id, {
                            estado: e.target.checked ? 'HECHA' : 'PENDIENTE',
                            hReal: e.target.checked ? (t.hReal ?? t.hEst) : undefined,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title={isHecha ? 'Marcar como pendiente' : 'Marcar como completada'}
                      />
                      <span className={`text-sm font-semibold flex-1 ${isHecha ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {t.titulo}
                      </span>
                      <Badge tone={prioTone[t.prioridad]}>{t.prioridad}</Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        {fmtFecha(t.inicio)} → {fmtFecha(t.limite)} · {t.hEst} h
                      </span>
                    </div>
                    {dep && <div className="mt-1 text-xs text-slate-400 pl-6">↳ depende de: {dep.titulo}</div>}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-6">
                      <select
                        className={`${inputCls} !w-auto !py-1 text-xs font-semibold`}
                        value={t.estado}
                        disabled={!editable}
                        onChange={(e) =>
                          setTarea(t.id, {
                            estado: e.target.value as Tarea['estado'],
                            hReal: e.target.value === 'HECHA' ? t.hReal ?? t.hEst : t.hReal,
                          })
                        }
                      >
                        {ESTADOS_TAREA.map((s) => <option key={s} value={s}>{ESTADO_TAREA_LABEL[s]}</option>)}
                      </select>
                      <Badge tone={tareaTone[t.estado]}>{ESTADO_TAREA_LABEL[t.estado]}</Badge>
                      <select
                        className={`${inputCls} !w-auto !py-1 text-xs`}
                        value={t.asignadoId ?? ''}
                        disabled={!canManage}
                        onChange={(e) => setTarea(t.id, { asignadoId: e.target.value ? Number(e.target.value) : undefined })}
                      >
                        <option value="">Sin asignar</option>
                        {workers.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nombre} ({x.especialidad === 'DESARROLLADOR' ? '💻 Dev' : x.especialidad === 'DISENADOR' ? '🎨 Diseñadora' : '🔧 Téc'})
                          </option>
                        ))}
                      </select>
                      {w && <Avatar name={w.nombre} color={w.color} size={22} />}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm(`¿Eliminar la tarea "${t.titulo}"?`)) return
                            mutate((d) => {
                              d.tareas = d.tareas.filter((x) => x.id !== t.id)
                            })
                          }}
                          className="ml-auto text-xs text-rose-500 hover:text-rose-700"
                          title="Eliminar tarea"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {canManage && (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!nuevaTarea.trim()) return
                mutate((d) => {
                  d.tareas.push({
                    id: nextId(d.tareas), otId: ot.id, titulo: nuevaTarea.trim(), estado: 'PENDIENTE', prioridad: 'MEDIA' as Prioridad,
                    hEst: 2, inicio: today(), limite: addDays(today(), 2), asignadoId: ot.tecnicoId,
                  })
                })
                setNuevaTarea('')
              }}
            >
              <input className={inputCls} placeholder="Nueva fase o tarea para el planner…" value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} />
              <Btn type="submit">+ Agregar al Planner</Btn>
            </form>
          )}
        </div>
      )}

      {tab === 'servicios' && (
        <div className="mt-4 space-y-4">
          {/* Resumen Superior */}
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Trabajos Realizados, Repuestos & Ganancias
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {fmtCLP(
                      (ot.serviciosRealizados ?? []).reduce((acc, it) => acc + (it.subtotal || it.precioUnitario * it.cantidad), 0) || ot.total || 0
                    )}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    ({(ot.serviciosRealizados ?? []).length} ítems en esta OT)
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 max-w-lg">
                  Agrega servicios del Catálogo de Tarifas (ej. Cambio de Pantalla, Pasta Térmica, Formateo) o trabajos libres. Puedes manipular precios y cantidades directamente.
                </p>
              </div>

              {/* Botón para Enviar a Finanzas */}
              <div className="flex flex-wrap items-center gap-2">
                {ot.registradoEnFinanzas ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs">
                    <span>✓ Cobro registrado en Finanzas</span>
                    <Link to="/app/finanzas" className="underline hover:text-emerald-950 font-black">
                      Ver Libro de Caja →
                    </Link>
                  </div>
                ) : (
                  <Btn
                    variant="primary"
                    onClick={() => {
                      const totalCobro =
                        (ot.serviciosRealizados ?? []).reduce(
                          (acc, it) => acc + (it.subtotal || it.precioUnitario * it.cantidad),
                          0,
                        ) || ot.total || 0

                      if (totalCobro <= 0) {
                        alert('El monto a registrar en Finanzas debe ser mayor a $0.')
                        return
                      }

                      const resumen =
                        (ot.serviciosRealizados ?? []).map((x) => `${x.cantidad}x ${x.descripcion}`).join(', ') ||
                        ot.titulo

                      mutate((d) => {
                        const targetOt = d.ots.find((x) => x.id === ot.id)
                        if (!targetOt) return
                        targetOt.total = totalCobro
                        targetOt.estadoPago = 'PAGADO'
                        targetOt.registradoEnFinanzas = true

                        const movId = nextId(d.movimientos)
                        targetOt.movimientoFinanzasId = movId

                        d.movimientos.push({
                          id: movId,
                          fecha: today(),
                          tipo: 'INGRESO',
                          rubro: 'INGRESO_OT',
                          categoria: 'Cobro OT / Servicio Taller',
                          concepto: `Cobro OT ${targetOt.codigo}: ${targetOt.titulo} (${resumen})`,
                          contraparte: empresa?.razonSocial ?? cliente?.nombre ?? 'Cliente Particular',
                          monto: totalCobro,
                          metodo: 'TRANSFERENCIA',
                          otId: targetOt.id,
                        })
                      })

                      setFeedbackFinanzas(
                        `¡Cobro de ${fmtCLP(totalCobro)} registrado con éxito en Finanzas / Libro de Caja!`,
                      )
                      setTimeout(() => setFeedbackFinanzas(''), 4500)
                    }}
                  >
                    💰 Enviar Ganancia a Finanzas (+{fmtCLP((ot.serviciosRealizados ?? []).reduce((acc, it) => acc + (it.subtotal || it.precioUnitario * it.cantidad), 0) || ot.total || 0)})
                  </Btn>
                )}
              </div>
            </div>

            {feedbackFinanzas && (
              <div className="mt-3 rounded-xl border border-emerald-400 bg-emerald-100 p-2.5 text-center text-xs font-bold text-emerald-900">
                {feedbackFinanzas}
              </div>
            )}
          </div>

          {/* Formulario para agregar servicio desde el Catálogo */}
          {canWork && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">
                  🛠️ Agregar Servicio desde el Catálogo o Trabajo Personalizado
                </span>
                <Link to="/app/catalogo" className="text-xs font-bold text-emerald-700 hover:underline">
                  Administrar precios en Catálogo →
                </Link>
              </div>

              <div className="grid gap-2 sm:grid-cols-12 items-end">
                <div className="sm:col-span-6">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Seleccionar del Catálogo de Servicios
                  </label>
                  <select
                    className={inputCls}
                    value={servicioSel}
                    onChange={(e) => {
                      const cod = e.target.value
                      setServicioSel(cod)
                      const serv = db.servicios?.find((s) => s.codigo === cod)
                      if (serv) {
                        setCustomDesc(serv.nombre)
                        const p = ot.empresaId
                          ? serv.tarifaEmpresa || (serv as any).tarifa_empresa || serv.normal
                          : serv.tarifaCliente || (serv as any).tarifa_cliente || serv.normal
                        setCustomPrecio(Number(p) || 0)
                      }
                    }}
                  >
                    <option value="">-- Elige un servicio del catálogo --</option>
                    {db.servicios?.map((s) => {
                      const p = ot.empresaId
                        ? s.tarifaEmpresa || (s as any).tarifa_empresa || s.normal
                        : s.tarifaCliente || (s as any).tarifa_cliente || s.normal
                      return (
                        <option key={s.id || s.codigo} value={s.codigo}>
                          {s.nombre} · {fmtCLP(p)} ({ot.empresaId ? 'Tarifa Empresa' : 'Tarifa Particular'})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={customCant}
                    onChange={(e) => setCustomCant(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Precio Unit. ($)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={customPrecio}
                    onChange={(e) => setCustomPrecio(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Btn
                    className="w-full"
                    variant="primary"
                    disabled={!customDesc.trim()}
                    onClick={() => {
                      const sub = customCant * customPrecio
                      const newItem: ItemOT = {
                        id: `ITEM-${Date.now()}`,
                        servicioCodigo: servicioSel || undefined,
                        descripcion: customDesc.trim(),
                        cantidad: customCant,
                        precioUnitario: customPrecio,
                        subtotal: sub,
                      }
                      mutate((d) => {
                        const targetOt = d.ots.find((x) => x.id === ot.id)
                        if (!targetOt) return
                        const list = targetOt.serviciosRealizados ?? []
                        list.push(newItem)
                        targetOt.serviciosRealizados = list
                        targetOt.total = list.reduce(
                          (a, b) => a + (b.subtotal || b.precioUnitario * b.cantidad),
                          0,
                        )
                      })
                      setServicioSel('')
                      setCustomDesc('')
                      setCustomPrecio(0)
                      setCustomCant(1)
                    }}
                  >
                    + Agregar
                  </Btn>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Descripción del trabajo o repuesto (editable):
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej: Cambio de pantalla LED 14 pulgadas FHD, Pasta térmica Arctic MX-4, Reparación de bisagra..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Tabla de Trabajos Realizados */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700">
              Detalle de Trabajos y Repuestos en esta OT
            </div>

            {(ot.serviciosRealizados ?? []).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No hay servicios ni repuestos agregados a esta OT aún.
                <br />
                Usa el formulario superior para añadir del catálogo o trabajos personalizados con su valor.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-3">Trabajo / Servicio</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Precio Unit.</th>
                    <th className="p-3 text-right">Subtotal</th>
                    {canWork && <th className="p-3 text-center">✕</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(ot.serviciosRealizados ?? []).map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/60 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{it.descripcion}</div>
                        {it.servicioCodigo && (
                          <span className="font-mono text-[10px] text-slate-400">
                            Código: {it.servicioCodigo}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">{it.cantidad}</td>
                      <td className="p-3 text-right font-mono">{fmtCLP(it.precioUnitario)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {fmtCLP(it.subtotal || it.precioUnitario * it.cantidad)}
                      </td>
                      {canWork && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              mutate((d) => {
                                const targetOt = d.ots.find((x) => x.id === ot.id)
                                if (!targetOt) return
                                const list = (targetOt.serviciosRealizados ?? []).filter((_, i) => i !== idx)
                                targetOt.serviciosRealizados = list
                                targetOt.total = list.reduce(
                                  (a, b) => a + (b.subtotal || b.precioUnitario * b.cantidad),
                                  0,
                                )
                              })
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Eliminar trabajo"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-black text-slate-900">
                  <tr>
                    <td colSpan={3} className="p-3 text-right text-xs uppercase tracking-wider">
                      Total OT:
                    </td>
                    <td className="p-3 text-right text-sm text-emerald-700 font-mono">
                      {fmtCLP(
                        (ot.serviciosRealizados ?? []).reduce(
                          (acc, it) => acc + (it.subtotal || it.precioUnitario * it.cantidad),
                          0,
                        ) || ot.total || 0,
                      )}
                    </td>
                    {canWork && <td />}
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'calendario' && (
        <div className="mt-4">
          <OTSchedulerCalendar
            value={{ inicio: ot.inicio, fin: ot.fin, tecnicoId: ot.tecnicoId }}
            excludeOtId={ot.id}
            onChange={(next) => {
              if (!canManage) return
              mutate((d) => {
                const target = d.ots.find((x) => x.id === ot.id)!
                target.inicio = next.inicio
                target.fin = next.fin
                target.tecnicoId = next.tecnicoId
              })
            }}
          />
        </div>
      )}

      {tab === 'pago' && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-slate-500">Estado de pago actual</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge tone={pagoTone[ot.estadoPago]}>{ot.estadoPago}</Badge>
                  <span className="font-semibold">{ot.total ? fmtCLP(ot.total) : 'Monto por definir'}</span>
                </div>
                {ot.comprobanteNombre && (
                  <div className="mt-1 text-xs text-emerald-700">📎 Comprobante adjunto: <b>{ot.comprobanteNombre}</b></div>
                )}
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Btn
                    size="sm"
                    onClick={() => mutate((d) => { d.ots.find((o) => o.id === ot.id)!.estadoPago = 'PAGADO' })}
                  >
                    ✓ Aprobar pago
                  </Btn>
                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick={() => mutate((d) => { d.ots.find((o) => o.id === ot.id)!.estadoPago = 'PENDIENTE' })}
                  >
                    Marcar pendiente
                  </Btn>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Facturación y respaldo digital</span>
              <Badge tone={ot.numeroFactura ? 'green' : 'slate'}>
                {ot.numeroFactura ? `Factura N° ${ot.numeroFactura}` : 'Sin factura emitida'}
              </Badge>
            </div>
            <Field label="N° de Factura emitida">
              <input
                className={inputCls}
                disabled={!canManage}
                value={ot.numeroFactura ?? ''}
                placeholder="Ej: FAC-000412"
                onChange={(e) => mutate((d) => { d.ots.find((o) => o.id === ot.id)!.numeroFactura = e.target.value })}
              />
            </Field>
            <Field label="Archivo de factura digitalizada">
              <input
                type="file"
                disabled={!canManage}
                className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) mutate((d) => { d.ots.find((o) => o.id === ot.id)!.facturaNombre = f.name })
                }}
              />
              {ot.facturaNombre && <span className="mt-1 block text-xs text-emerald-700">📄 {ot.facturaNombre}</span>}
            </Field>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <ol className="mt-4 space-y-3 border-l border-slate-200 pl-5">
          {ot.historial.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-pcg-green" />
              <Badge tone={otTone[h.estado]}>{ESTADO_OT_LABEL[h.estado]}</Badge>
              <span className="ml-2 text-xs text-slate-500">{fmtFechaHora(h.fecha)}</span>
              <div className="text-sm text-slate-600">{h.nota}</div>
            </li>
          ))}
        </ol>
      )}

      {tab === 'comentarios' && (
        <div className="mt-3">
          <ul className="space-y-2">
            {ot.comentarios.length === 0 && <li className="text-sm text-slate-400">Sin comentarios todavía.</li>}
            {ot.comentarios.map((c, i) => (
              <li key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="text-xs text-slate-500"><b>{db.usuarios.find((u) => u.id === c.usuarioId)?.nombre}</b> · {fmtFechaHora(c.fecha)}</div>
                {c.texto}
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!comentario.trim()) return
              mutate((d) => d.ots.find((o) => o.id === ot.id)!.comentarios.push({ usuarioId: user.id, texto: comentario.trim(), fecha: new Date().toISOString() }))
              setComentario('')
            }}
          >
            <input className={inputCls} placeholder="Escribe un comentario…" value={comentario} onChange={(e) => setComentario(e.target.value)} />
            <Btn type="submit">Enviar</Btn>
          </form>
        </div>
      )}

      {intervOpen && <IntervencionModal otId={ot.id} onClose={() => setIntervOpen(false)} />}
    </Modal>
  )
}

function IntervencionModal({ otId, onClose }: { otId: number; onClose: () => void }) {
  const { db, user, mutate } = useStore()
  const ot = db.ots.find((o) => o.id === otId)!
  const [equipoId, setEquipoId] = useState(ot.equipoIds[0])
  const [tipo, setTipo] = useState<Intervencion['tipo']>('PREVENTIVO')
  const [titulo, setTitulo] = useState('Mantención preventiva de hardware')
  const [detalle, setDetalle] = useState('')
  const [antes, setAntes] = useState('')
  const [despues, setDespues] = useState('')
  const [insumos, setInsumos] = useState('Pasta térmica premium certificada')
  const [visible, setVisible] = useState(true)
  const [check, setCheck] = useState<string[]>(CHECKLIST_MANT.slice(0, 4))

  return (
    <Modal open onClose={onClose} title="Registrar intervención (hoja de vida)" wide>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          mutate((d) =>
            registrarIntervencion(d, {
              equipoId, otId, tecnicoId: user!.id, tipo, titulo, detalle, checklist: check, insumos,
              tempAntes: antes ? Number(antes) : undefined, tempDespues: despues ? Number(despues) : undefined,
              garantiaDias: d.config.condGarantiaDias, visibleCliente: visible,
            }),
          )
          onClose()
        }}
      >
        <Field label="Equipo">
          <select className={inputCls} value={equipoId} onChange={(e) => setEquipoId(Number(e.target.value))}>
            {ot.equipoIds.map((id) => { const e = db.equipos.find((x) => x.id === id)!; return <option key={id} value={id}>{e.codigo} · {e.marca} {e.modelo}</option> })}
          </select>
        </Field>
        <Field label="Tipo">
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as Intervencion['tipo'])}>
            {['PREVENTIVO', 'CORRECTIVO', 'UPGRADE', 'SOFTWARE', 'REPARACION_ELECTRONICA'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2"><Field label="Título del trabajo"><input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></Field></div>
        <div className="sm:col-span-2"><Field label="Detalle técnico"><textarea className={inputCls} rows={3} value={detalle} onChange={(e) => setDetalle(e.target.value)} required /></Field></div>
        <Field label="Temp. CPU antes (°C)"><input className={inputCls} type="number" value={antes} onChange={(e) => setAntes(e.target.value)} /></Field>
        <Field label="Temp. CPU después (°C)"><input className={inputCls} type="number" value={despues} onChange={(e) => setDespues(e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Insumos usados"><input className={inputCls} value={insumos} onChange={(e) => setInsumos(e.target.value)} /></Field></div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">Checklist</span>
          <div className="grid gap-1 sm:grid-cols-2">
            {CHECKLIST_MANT.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={check.includes(c)} onChange={(e) => setCheck(e.target.checked ? [...check, c] : check.filter((x) => x !== c))} />
                {c}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Visible para el cliente en su portal</label>
        <div className="flex justify-end gap-2 sm:col-span-2"><Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn><Btn type="submit">Guardar en la hoja de vida</Btn></div>
      </form>
    </Modal>
  )
}

