import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useScope } from '@/lib/scope'
import { aceptarCotizacion, emitirCotizacion, enviarCotizacion, resolverORegistrarCliente } from '@/lib/actions'
import type { DatosClienteForm } from '@/lib/actions'
import { downloadCotizacionXlsx } from '@/lib/xlsx'
import type { Cotizacion, ItemCot, Prioridad } from '@/lib/types'
import { addDays, calcCot, fmtCLP, fmtFecha, reglaDescuento, today } from '@/lib/util'
import { cotTone } from '@/lib/tones'
import OTSchedulerCalendar from '@/components/OTSchedulerCalendar'
import type { OTScheduleValue } from '@/components/OTSchedulerCalendar'
import SelectorCarteraCliente from '@/components/SelectorCarteraCliente'
import { Badge, Btn, Empty, Field, Modal, PageHeader, Table, inputCls, td } from '@/components/kit'

export function CotizacionesPage() {
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const openNew = params.get('nuevo') === '1'
  const ticketId = params.get('ticketId') ? Number(params.get('ticketId')) : undefined
  const clienteIdParam = params.get('clienteId') ? Number(params.get('clienteId')) : undefined
  const canCreate = user!.rol === 'ADMIN' || user!.rol === 'DOC_PROCESS'

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        subtitle="Plantillas Excel PCG SPA, validación de Cartera de Clientes (auto-registro en BD), descuento a criterio y calendario OT"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canCreate && (
              <Link
                to="/app/empresas"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs transition hover:border-emerald-300 hover:text-emerald-700"
              >
                📂 Ver Cartera de Clientes ({db.usuarios.filter((u) => u.rol === 'CLIENTE_EMPRESA' || u.rol === 'CLIENTE_PERSONA').length})
              </Link>
            )}
            {canCreate && <Btn onClick={() => setParams({ nuevo: '1' })}>+ Nueva cotización (Plantilla Excel)</Btn>}
          </div>
        }
      />

      {sc.cotizaciones.length === 0 ? (
        <Empty>No hay cotizaciones registradas.</Empty>
      ) : (
        <Table head={['Nro. Cotización', 'Cliente / Cartera & Correo', 'Parque', 'Subtotal Normal', 'Ahorro / Dcto.', 'Total Final', 'Estado', 'Planificación OT', '']}>
          {[...sc.cotizaciones].reverse().map((c) => {
            const emp = db.empresas.find((e) => e.id === c.empresaId)
            const cli = db.usuarios.find((u) => u.id === c.usuarioId)
            const tec = db.usuarios.find((u) => u.id === c.planTecnicoId)
            return (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className={`${td} font-semibold`}>
                  <Link to={`/app/cotizaciones/${c.id}`} className="text-emerald-700 hover:underline">{c.numero}</Link>
                  {c.motivoDescuento && <div className="text-[11px] font-normal text-amber-700">★ {c.motivoDescuento}</div>}
                </td>
                <td className={td}>
                  <div className="font-semibold text-slate-900">{emp?.razonSocial ?? cli?.nombre}</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span>✉ {c.emailDestino ?? cli?.email ?? '—'}</span>
                    {(emp?.rut ?? cli?.rut) && <span className="text-slate-400">· RUT {emp?.rut ?? cli?.rut}</span>}
                  </div>
                </td>
                <td className={td}>{c.cantEquipos} eq.</td>
                <td className={`${td} text-slate-500 line-through`}>{fmtCLP(c.subtotalNormal)}</td>
                <td className={`${td} font-medium text-emerald-700`}>-{fmtCLP(c.descuentoMonto)}</td>
                <td className={`${td} font-semibold text-slate-900`}>{fmtCLP(c.total)}</td>
                <td className={td}><Badge tone={cotTone[c.estado]}>{c.estado}</Badge></td>
                <td className={`${td} text-xs text-slate-600`}>
                  {c.planInicio ? (
                    <div>
                      <div>{fmtFecha(c.planInicio)} → {fmtFecha(c.planFin)}</div>
                      <div className="text-slate-400">{tec?.nombre ?? 'Sin técnico'}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400">Por agendar</span>
                  )}
                </td>
                <td className={`${td} text-right`}>
                  <Link to={`/app/cotizaciones/${c.id}`} className="text-xs font-medium text-pcg-green hover:underline">Abrir / Planificar →</Link>
                </td>
              </tr>
            )
          })}
        </Table>
      )}

      {openNew && canCreate && (
        <NuevaCotModal
          ticketId={ticketId}
          initialClienteId={clienteIdParam}
          onClose={() => setParams({}, { replace: true })}
          onCreate={(payload) => {
            let cid = 0
            mutate((d) => {
              const res = resolverORegistrarCliente(d, payload.clienteForm)
              const c = emitirCotizacion(d, {
                ...payload,
                usuarioId: res.usuarioId,
                empresaId: res.empresaId,
                emailDestino: res.email,
                emitidaPor: user!.id,
              })
              cid = c.id
            })
            setParams({}, { replace: true })
            nav(`/app/cotizaciones/${cid}`)
          }}
        />
      )}
    </>
  )
}

function NuevaCotModal({
  ticketId,
  initialClienteId,
  onClose,
  onCreate,
}: {
  ticketId?: number
  initialClienteId?: number
  onClose: () => void
  onCreate: (d: {
    ticketId?: number
    clienteForm: DatosClienteForm
    enviarAlCrear?: boolean
    paqueteId?: number
    modo: Cotizacion['modo']
    descuentoCriterioPct?: number
    descuentoCriterioMonto?: number
    motivoDescuento?: string
    planInicio?: string
    planFin?: string
    planTecnicoId?: number
    crearOtInmediata?: boolean
    items: ItemCot[]
    cantEquipos: number
  }) => void
}) {
  const { db, user } = useStore()
  const tck = db.tickets.find((t) => t.id === ticketId)
  const clientes = db.usuarios.filter((u) => u.rol === 'CLIENTE_EMPRESA' || u.rol === 'CLIENTE_PERSONA')
  const defaultUid = initialClienteId ?? tck?.usuarioId ?? clientes[0]?.id ?? 5
  const defaultCli = clientes.find((c) => c.id === defaultUid) ?? clientes[0]
  const defaultEmp = db.empresas.find((e) => e.id === defaultCli?.empresaId)

  const [clienteForm, setClienteForm] = useState<DatosClienteForm>(() => ({
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
  }))

  const [enviarAlCrear, setEnviarAlCrear] = useState<boolean>(true)
  const [cant, setCant] = useState(tck?.cantEquipos ?? 9)
  const [paqueteId, setPaqueteId] = useState<number>(1)
  const [modo, setModo] = useState<Cotizacion['modo']>('CONVENIO')

  // Descuento a criterio (manual)
  const [dctoPct, setDctoPct] = useState<number>(0)
  const [dctoMonto, setDctoMonto] = useState<number>(0)
  const [motivo, setMotivo] = useState<string>('')

  // Planificación de OT en calendario
  const [mostrarCalendario, setMostrarCalendario] = useState(true)
  const [crearOtInmediata, setCrearOtInmediata] = useState(false)
  const [plan, setPlan] = useState<OTScheduleValue>({
    inicio: addDays(today(), 1),
    fin: addDays(today(), 4),
    tecnicoId: 3,
  })

  const buildFromPack = (pid: number, n: number): ItemCot[] => {
    const p = db.paquetes.find((x) => x.id === pid)
    if (!p) return []
    return p.servicioIds.map((sid) => {
      const s = db.servicios.find((x) => x.id === sid)!
      return {
        servicioId: s.id,
        descripcion: `${s.nombre}\n(${s.descripcion})`,
        cantidad: n,
        normal: s.normal,
        convenio: s.convenio,
      }
    })
  }

  const [items, setItems] = useState<ItemCot[]>(() => buildFromPack(1, tck?.cantEquipos ?? 9))

  const applyPack = (pid: number, n: number) => {
    setPaqueteId(pid)
    setItems(buildFromPack(pid, n))
  }

  const updateCant = (n: number) => {
    const val = Math.max(1, n)
    setCant(val)
    setItems((prev) => prev.map((it) => ({ ...it, cantidad: val })))
  }

  const totals = calcCot(db, items, cant, modo, { pct: dctoPct, monto: dctoMonto })
  const pct = totals.subtotalNormal > 0 ? ((totals.descuentoMonto / totals.subtotalNormal) * 100).toFixed(1) : '0'
  const costoInterno = items.reduce((s, i) => {
    const srv = db.servicios.find((x) => x.id === i.servicioId)
    return s + (srv?.costo ?? 0) * i.cantidad
  }, 0)

  return (
    <Modal open onClose={onClose} title="Generador de Cotización + Cartera de Clientes + Calendario OT" wide>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onCreate({
            ticketId,
            clienteForm,
            enviarAlCrear,
            paqueteId,
            modo,
            descuentoCriterioPct: dctoPct || undefined,
            descuentoCriterioMonto: dctoMonto || undefined,
            motivoDescuento: motivo.trim() || undefined,
            planInicio: plan.inicio,
            planFin: plan.fin,
            planTecnicoId: plan.tecnicoId,
            crearOtInmediata,
            items,
            cantEquipos: cant,
          })
        }}
      >
        {/* Selector de Cartera de Clientes + Validación y Auto-registro en BD */}
        <SelectorCarteraCliente
          value={clienteForm}
          onChange={setClienteForm}
          showEmailToggle
          enviarAlCrear={enviarAlCrear}
          onToggleEnviar={setEnviarAlCrear}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Plantilla / Hoja de Cotización_Formal_PCG_SPA.xlsx">
            <select className={inputCls} value={paqueteId} onChange={(e) => applyPack(Number(e.target.value), cant)}>
              {db.paquetes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.sufijo})</option>
              ))}
            </select>
          </Field>
          <Field label="Parque objetivo (cantidad de equipos)">
            <input type="number" min={1} className={inputCls} value={cant} onChange={(e) => updateCant(Number(e.target.value))} />
          </Field>
        </div>

        {/* Selector de modalidad + Descuento a criterio */}
        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/60 p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-800">1. Modalidad base:</span>
            <label className="flex items-center gap-1.5 font-medium">
              <input type="radio" checked={modo === 'CONVENIO'} onChange={() => setModo('CONVENIO')} />
              Tarifa Convenio Corporativo (Excel)
            </label>
            <label className="flex items-center gap-1.5 font-medium">
              <input type="radio" checked={modo === 'VOLUMEN'} onChange={() => setModo('VOLUMEN')} />
              Regla automática por volumen ({reglaDescuento(db, cant)}%)
            </label>
            <label className="flex items-center gap-1.5 font-medium">
              <input type="radio" checked={modo === 'CRITERIO'} onChange={() => setModo('CRITERIO')} />
              Solo descuento manual a criterio (sobre Tarifa Normal)
            </label>
          </div>

          <div className="mt-3 border-t border-amber-200/60 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-950">
                ★ 2. Otorgar descuento a criterio (puedes combinar % y/o monto fijo en $ CLP):
              </span>
              <div className="flex flex-wrap gap-1">
                {[0, 5, 10, 15, 20, 25, 35, 50].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDctoPct(p)}
                    className={`rounded-lg px-2 py-0.5 text-xs font-semibold transition ${
                      dctoPct === p
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-amber-100'
                    }`}
                  >
                    {p === 0 ? 'Sin % extra' : `-${p}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
              <Field label="Descuento a criterio (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  className={inputCls}
                  value={dctoPct}
                  onChange={(e) => setDctoPct(Number(e.target.value))}
                />
              </Field>
              <Field label="Rebaja adicional en pesos ($ CLP)">
                <input
                  type="number"
                  min={0}
                  step={5000}
                  className={inputCls}
                  value={dctoMonto}
                  onChange={(e) => setDctoMonto(Number(e.target.value))}
                  placeholder="Ej: 45000"
                />
              </Field>
              <Field label="Motivo / Glosa del descuento (opcional)">
                <input
                  className={inputCls}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Atención comercial gerencia"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Selector de servicios individuales + Tabla de ítems */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">📋 Detalle de Servicios e Ítems ({items.length}):</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={`${inputCls} !text-xs !py-1 !w-auto bg-white`}
                value=""
                onChange={(e) => {
                  const sid = Number(e.target.value)
                  if (!sid) return
                  const s = db.servicios.find((x) => x.id === sid)
                  if (s) {
                    const isSingle = s.codigo.startsWith('DIS-') || s.codigo.startsWith('WEB-') || s.codigo.startsWith('SOFT-')
                    setItems((prev) => [
                      ...prev,
                      {
                        servicioId: s.id,
                        descripcion: `${s.nombre}\n(${s.descripcion})`,
                        cantidad: isSingle ? 1 : cant,
                        normal: s.normal,
                        convenio: s.convenio,
                      },
                    ])
                  }
                }}
              >
                <option value="">+ Agregar servicio del catálogo PCG...</option>
                {db.servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({fmtCLP(s.convenio)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setItems((prev) => [
                    ...prev,
                    {
                      descripcion: 'Repuesto o Servicio personalizado adicional',
                      cantidad: 1,
                      normal: 45000,
                      convenio: 38000,
                    },
                  ])
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                + Ítem libre
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5">Servicio / Especificación</th>
                  <th className="p-2.5 w-16">Cant.</th>
                  <th className="p-2.5 w-28">Normal unit.</th>
                  <th className="p-2.5 w-28">Convenio unit.</th>
                  <th className="p-2.5 w-28">Subtotal base</th>
                  <th className="p-2.5 w-10 text-center">✕</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <textarea
                        className={`${inputCls} !text-xs`}
                        rows={2}
                        value={it.descripcion}
                        onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, descripcion: e.target.value } : x)))}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        className={`${inputCls} !text-xs !py-1 !w-16`}
                        value={it.cantidad}
                        onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, cantidad: Math.max(1, Number(e.target.value)) } : x)))}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className={`${inputCls} !text-xs`}
                        value={it.normal}
                        onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, normal: Number(e.target.value) } : x)))}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className={`${inputCls} !text-xs`}
                        value={it.convenio}
                        onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, convenio: Number(e.target.value) } : x)))}
                      />
                    </td>
                    <td className="p-2 font-semibold">{fmtCLP((modo === 'CONVENIO' ? it.convenio : it.normal) * it.cantidad)}</td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Eliminar este ítem"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-xs text-slate-400">
                      No hay ítems en la cotización. Elige un paquete o agrega un servicio del catálogo arriba.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">Subtotal Tarifa Normal</div>
            <div className="font-medium text-slate-600 line-through">{fmtCLP(totals.subtotalNormal)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Ahorro Consolidado ({pct}%)</div>
            <div className="font-semibold text-emerald-700">-{fmtCLP(totals.descuentoMonto)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Final a Cobrar ({cant} eq.)</div>
            <div className="text-xl font-extrabold text-slate-900">{fmtCLP(totals.total)}</div>
          </div>
          {user!.rol === 'ADMIN' && costoInterno > 0 && (
            <div className="col-span-full border-t border-emerald-200/70 pt-2 text-xs text-slate-600">
              🔒 <b>Vista exclusiva CEO (oculta al cliente):</b> Costo interno licencias/insumos: {fmtCLP(costoInterno)} · Utilidad neta proyectada: <b>{fmtCLP(totals.total - costoInterno)}</b>
            </div>
          )}
        </div>

        {/* Calendario de planificación de tiempos y técnico */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMostrarCalendario(!mostrarCalendario)}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              {mostrarCalendario ? '▼ Ocultar calendario de planificación' : '▶ Mostrar calendario para seleccionar fecha de OT y asignar trabajador'}
            </button>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={crearOtInmediata}
                onChange={(e) => setCrearOtInmediata(e.target.checked)}
              />
              Crear y dejar agendada la OT inmediatamente al emitir
            </label>
          </div>

          {mostrarCalendario && (
            <OTSchedulerCalendar value={plan} onChange={setPlan} />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">{crearOtInmediata ? 'Emitir cotización y agendar OT' : 'Emitir cotización'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

export function CotizacionDetailPage() {
  const { id } = useParams()
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const nav = useNavigate()

  const cot = sc.cotizaciones.find((c) => c.id === Number(id))
  const [planOpen, setPlanOpen] = useState(false)
  const [dctoOpen, setDctoOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  if (!cot) return <Empty>Cotización no encontrada.</Empty>

  const emp = db.empresas.find((e) => e.id === cot.empresaId)
  const cli = db.usuarios.find((u) => u.id === cot.usuarioId)
  const tecPlan = db.usuarios.find((u) => u.id === cot.planTecnicoId)
  const pct = cot.subtotalNormal > 0 ? ((cot.descuentoMonto / cot.subtotalNormal) * 100).toFixed(1) : '0'
  const canManage = user!.rol === 'ADMIN' || user!.rol === 'DOC_PROCESS'
  const correoDestino = cot.emailDestino || cli?.email || ''

  return (
    <>
      <PageHeader
        title={`Cotización ${cot.numero}`}
        subtitle={`Emitida el ${fmtFecha(cot.fecha)} · Válida hasta ${fmtFecha(cot.validaHasta)}`}
        actions={
          <>
            <Btn variant="secondary" onClick={() => downloadCotizacionXlsx(db, cot)}>
              Descargar Excel (.xlsx)
            </Btn>
            <Btn variant="secondary" onClick={() => window.print()}>
              Imprimir / Guardar PDF
            </Btn>
            {canManage && (
              <Btn variant="secondary" onClick={() => setDctoOpen(true)}>
                ％ Descuento a criterio
              </Btn>
            )}
            {canManage && (
              <Btn variant="secondary" onClick={() => setEmailModalOpen(true)}>
                ✉ {cot.estado === 'BORRADOR' ? 'Enviar por correo PCG SPA' : 'Reenviar / Cambiar correo'}
              </Btn>
            )}
            <Btn onClick={() => setPlanOpen(true)}>
              📅 {cot.otId ? 'Reprogramar fecha / técnico de OT' : 'Aceptar cotización y agendar OT en calendario'}
            </Btn>
            {cot.otId && (
              <Btn variant="secondary" onClick={() => nav(`/app/ot?ot=${cot.otId}`)}>
                Ver OT generada →
              </Btn>
            )}
          </>
        }
      />

      {toastMsg && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-5 py-3.5 text-white shadow-lg print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg">✓</span>
            <div>
              <div className="text-sm font-extrabold">{toastMsg}</div>
              <div className="text-xs text-emerald-100">
                Despachado desde <b>{db.config.email}</b> · Quedó respaldado en la Bandeja de Correos de PCG SPA.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/correos"
              className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/30"
            >
              Ver correo enviado →
            </Link>
            <button onClick={() => setToastMsg(null)} className="text-xs text-white/80 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Barra informativa del correo destino y remitente PCG SPA */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50/90 via-white to-indigo-50/60 px-5 py-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-slate-700">
          <span className="rounded-lg bg-sky-600 px-2 py-0.5 font-bold text-white">✉ CORREO COTIZACIÓN</span>
          <span>
            Sale desde: <strong className="font-mono text-slate-900">{db.config.email}</strong>
          </span>
          <span>→</span>
          <span>
            Destinatario: <strong className="font-mono text-emerald-700">{correoDestino || 'Sin correo asignado'}</strong>
          </span>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="font-bold text-sky-700 hover:underline"
          >
            Cambiar destinatario o reenviar →
          </button>
        )}
      </div>

      {cot.planInicio && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-sky-50 px-5 py-3 text-sm print:hidden">
          <div>
            <span className="font-bold text-emerald-950">📅 Planificación de OT:</span>{' '}
            <span className="text-slate-700">
              {fmtFecha(cot.planInicio)} al {fmtFecha(cot.planFin)} · Técnico asignado:{' '}
              <b>{tecPlan?.nombre ?? 'Por asignar'}</b>
            </span>
          </div>
          <button onClick={() => setPlanOpen(true)} className="text-xs font-bold text-emerald-700 hover:underline">
            Abrir calendario de tiempos →
          </button>
        </div>
      )}

      {/* Hoja formal estilo Cotizacion_Formal_PCG_SPA.xlsx */}
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-4">
            <img src="/img/logo-pcg.png" alt="PCG SPA" className="h-14" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">{db.config.razonSocial}</h2>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{db.config.giro}</p>
              <p className="mt-1 text-xs text-slate-500">
                RUT: {db.config.rut} · {db.config.email} · {db.config.telefono}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge tone={cotTone[cot.estado]}>{cot.estado}</Badge>
            <div className="mt-1 text-lg font-bold text-slate-900">{cot.numero}</div>
            <div className="text-xs text-slate-500">Emisión: {fmtFecha(cot.fecha)}</div>
            <div className="text-xs text-slate-500">Validez: {fmtFecha(cot.validaHasta)}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Datos del Cliente / Receptor</div>
            <div className="mt-1 font-semibold text-slate-900">{emp?.razonSocial ?? cli?.nombre}</div>
            <div className="text-xs text-slate-600">RUT: {emp?.rut ?? cli?.rut ?? '—'}</div>
            <div className="text-xs text-slate-600">Contacto: {cli?.nombre} ({cli?.email})</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Alcance de la Propuesta</div>
            <div className="mt-1 font-semibold text-slate-900">Parque Objetivo: {cot.cantEquipos} Equipo(s) Informático(s)</div>
            <div className="text-xs text-slate-600">Dirección / Ciudad: {emp ? `${emp.direccion}, ${emp.ciudad}` : '—'}</div>
            <div className="text-xs text-slate-600">
              Modalidad:{' '}
              {cot.modo === 'CONVENIO'
                ? 'Convenio Corporativo'
                : cot.modo === 'VOLUMEN'
                  ? 'Descuento por Volumen'
                  : 'Descuento a Criterio'}
            </div>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-white">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Servicio / Especificaciones Técnicas</th>
              <th className="px-3 py-2.5 text-center">Parque</th>
              <th className="px-3 py-2.5 text-right">Tarifa Normal</th>
              <th className="px-3 py-2.5 text-right">Tarifa Aplicada</th>
              <th className="px-3 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cot.items.map((it, i) => {
              const unit = cot.modo === 'CONVENIO' ? it.convenio : Math.round((it.normal * cot.total) / Math.max(1, cot.subtotalNormal))
              const [head, ...rest] = it.descripcion.split('\n')
              return (
                <tr key={i}>
                  <td className="px-3 py-3 font-medium text-slate-500">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">{head}</div>
                    {rest.length > 0 && <div className="text-xs text-slate-500">{rest.join(' ')}</div>}
                  </td>
                  <td className="px-3 py-3 text-center">{it.cantidad} Eq.</td>
                  <td className="px-3 py-3 text-right text-slate-500 line-through">{fmtCLP(it.normal)}</td>
                  <td className="px-3 py-3 text-right font-medium text-emerald-700">
                    {unit === 0 ? '100% BONIFICADO' : fmtCLP(unit)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{fmtCLP(unit * it.cantidad)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">
              Ahorro Total Consolidado (-{pct}%)
            </div>
            <div className="text-sm text-emerald-900">
              Ahorro directo de <b>{fmtCLP(cot.descuentoMonto)}</b> respecto a tarifa normal ({fmtCLP(cot.subtotalNormal)}).
            </div>
            {(cot.descuentoCriterioPct || cot.descuentoCriterioMonto || cot.motivoDescuento) && (
              <div className="mt-1 text-xs font-medium text-amber-900">
                ★ Incluye descuento a criterio
                {cot.descuentoCriterioPct ? ` (${cot.descuentoCriterioPct}%)` : ''}
                {cot.descuentoCriterioMonto ? ` (-${fmtCLP(cot.descuentoCriterioMonto)})` : ''}
                {cot.motivoDescuento ? ` — ${cot.motivoDescuento}` : ''}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">TOTAL FINAL ({cot.cantEquipos} EQUIPOS)</div>
            <div className="text-2xl font-bold text-slate-900">{fmtCLP(cot.total)}</div>
            <div className="text-xs text-emerald-800">
              Equivalente a {fmtCLP(Math.round(cot.total / Math.max(1, cot.cantEquipos)))} por equipo
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-200 pt-4 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <div className="font-semibold text-slate-800">Diferenciadores Técnicos PCG SPA</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Atención directa por profesionales e ingenieros titulados.</li>
              <li>Insumos térmicos certificados de alta conductividad.</li>
              <li>Trazabilidad completa en hoja de vida digital por equipo.</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-800">Condiciones Comerciales</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Forma de pago: {db.config.condPago}.</li>
              <li>Plazo de ejecución: {db.config.condPlazo}.</li>
              <li>Garantía técnica: {db.config.condGarantiaDias} días continuos post-entrega.</li>
            </ul>
          </div>
        </div>
      </div>

      {planOpen && (
        <PlanificarOTModal
          cot={cot}
          onClose={() => setPlanOpen(false)}
          onConfirm={(plan, prio) => {
            let otId = cot.otId
            mutate((d) => {
              const ot = aceptarCotizacion(d, cot.id, user!.id, { ...plan, prioridad: prio })
              otId = ot?.id
            })
            setPlanOpen(false)
            if (otId) nav(`/app/ot?ot=${otId}`)
          }}
        />
      )}

      {dctoOpen && (
        <EditarDescuentoModal
          cot={cot}
          onClose={() => setDctoOpen(false)}
          onSave={(patch) => {
            mutate((d) => {
              const c = d.cotizaciones.find((x) => x.id === cot.id)!
              c.modo = patch.modo
              c.descuentoCriterioPct = patch.pct || undefined
              c.descuentoCriterioMonto = patch.monto || undefined
              c.motivoDescuento = patch.motivo || undefined
              const res = calcCot(d, c.items, c.cantEquipos, c.modo, { pct: patch.pct, monto: patch.monto })
              c.subtotalNormal = res.subtotalNormal
              c.descuentoMonto = res.descuentoMonto
              c.total = res.total
            })
            setDctoOpen(false)
          }}
        />
      )}

      {emailModalOpen && (
        <EnviarCorreoCotModal
          cot={cot}
          defaultEmail={correoDestino}
          onClose={() => setEmailModalOpen(false)}
          onSend={(nextEmail) => {
            mutate((d) => enviarCotizacion(d, cot.id, nextEmail))
            setEmailModalOpen(false)
            setToastMsg(`Cotización ${cot.numero} enviada exitosamente a ${nextEmail}`)
          }}
        />
      )}
    </>
  )
}

function EnviarCorreoCotModal({
  cot,
  defaultEmail,
  onClose,
  onSend,
}: {
  cot: Cotizacion
  defaultEmail: string
  onClose: () => void
  onSend: (email: string) => void
}) {
  const { db } = useStore()
  const [email, setEmail] = useState(defaultEmail)
  const cli = db.usuarios.find((u) => u.id === cot.usuarioId)
  const emp = db.empresas.find((e) => e.id === cot.empresaId)

  const mailtoHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    `Cotización Oficial ${cot.numero} — ${db.config.razonSocial}`,
  )}&body=${encodeURIComponent(
    `Estimado(a) ${cli?.nombre ?? 'Cliente'}${emp ? ` (${emp.razonSocial})` : ''},\n\nAdjuntamos la cotización formal ${cot.numero} para ${cot.cantEquipos} equipo(s) por un total de ${fmtCLP(cot.total)}.\n\nAtentamente,\n${db.config.razonSocial}\n${db.config.email} · ${db.config.telefono}`,
  )}`

  return (
    <Modal open onClose={onClose} title={`✉ Enviar Cotización ${cot.numero} por Correo`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!email.trim()) return
          onSend(email.trim())
        }}
      >
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 text-xs">
          <div className="font-bold text-emerald-950">Cuenta remitente oficial de la empresa:</div>
          <div className="mt-1 font-mono text-sm font-extrabold text-emerald-700">
            {db.config.razonSocial} &lt;{db.config.email}&gt;
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            Al vincular tu SMTP / Gmail en producción, el correo saldrá automáticamente desde esta dirección.
          </div>
        </div>

        <Field label="Correo(s) electrónico(s) del destinatario (a quién se envía)">
          <input
            type="text"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@empresa.cl"
            required
          />
        </Field>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="font-semibold text-slate-800">
            Asunto: Cotización Oficial {cot.numero} — {emp?.razonSocial ?? cli?.nombre} | {db.config.razonSocial}
          </div>
          <div className="mt-1">
            Monto total: <strong>{fmtCLP(cot.total)}</strong> ({cot.cantEquipos} equipos) · Válida hasta {fmtFecha(cot.validaHasta)}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            ↗ Abrir también en mi cliente de correo / Gmail
          </a>
          <div className="flex gap-2">
            <Btn type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Btn>
            <Btn type="submit">✉ Enviar desde {db.config.email}</Btn>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function PlanificarOTModal({
  cot,
  onClose,
  onConfirm,
}: {
  cot: Cotizacion
  onClose: () => void
  onConfirm: (plan: OTScheduleValue, prioridad: Prioridad) => void
}) {
  const [plan, setPlan] = useState<OTScheduleValue>({
    inicio: cot.planInicio ?? addDays(today(), 1),
    fin: cot.planFin ?? addDays(today(), 4),
    tecnicoId: cot.planTecnicoId ?? 3,
  })
  const [prioridad, setPrioridad] = useState<Prioridad>('ALTA')

  return (
    <Modal open onClose={onClose} title={`Planificar OT en calendario · ${cot.numero}`} wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
          <span>
            Parque a intervenir: <b>{cot.cantEquipos} equipo(s)</b> · Total cotizado: <b>{fmtCLP(cot.total)}</b>
          </span>
          <label className="flex items-center gap-2 font-semibold">
            Prioridad de la OT:
            <select
              className={`${inputCls} !w-32 !py-1 !text-xs`}
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Prioridad)}
            >
              {['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>

        <OTSchedulerCalendar value={plan} onChange={setPlan} excludeOtId={cot.otId} />

        <div className="flex justify-end gap-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={() => onConfirm(plan, prioridad)}>
            ✓ Confirmar fechas, asignar técnico y {cot.otId ? 'actualizar OT' : 'generar OT'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

function EditarDescuentoModal({
  cot,
  onClose,
  onSave,
}: {
  cot: Cotizacion
  onClose: () => void
  onSave: (d: { modo: Cotizacion['modo']; pct: number; monto: number; motivo: string }) => void
}) {
  const { db } = useStore()
  const [modo, setModo] = useState<Cotizacion['modo']>(cot.modo)
  const [pct, setPct] = useState<number>(cot.descuentoCriterioPct ?? 0)
  const [monto, setMonto] = useState<number>(cot.descuentoCriterioMonto ?? 0)
  const [motivo, setMotivo] = useState<string>(cot.motivoDescuento ?? '')

  const preview = calcCot(db, cot.items, cot.cantEquipos, modo, { pct, monto })

  return (
    <Modal open onClose={onClose} title={`Otorgar descuento a criterio · ${cot.numero}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ modo, pct, monto, motivo })
        }}
      >
        <Field label="Base de cálculo">
          <select className={inputCls} value={modo} onChange={(e) => setModo(e.target.value as Cotizacion['modo'])}>
            <option value="CONVENIO">Tarifa Convenio Corporativo + descuento a criterio</option>
            <option value="VOLUMEN">Regla de volumen + descuento a criterio</option>
            <option value="CRITERIO">Solo descuento a criterio sobre Tarifa Normal</option>
          </select>
        </Field>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Botones rápidos de porcentaje (%)</span>
          <div className="flex flex-wrap gap-1.5">
            {[0, 5, 10, 15, 20, 25, 30, 40, 50].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPct(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  pct === p ? 'bg-pcg-green text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Porcentaje a criterio (%)">
            <input type="number" min={0} max={100} step="0.5" className={inputCls} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
          </Field>
          <Field label="Rebaja directa en pesos ($ CLP)">
            <input type="number" min={0} step={5000} className={inputCls} value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Motivo o glosa en la cotización">
          <input className={inputCls} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Atención comercial cierre inmediato" />
        </Field>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal normal:</span>
            <span className="line-through">{fmtCLP(preview.subtotalNormal)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-emerald-700">
            <span>Ahorro total aplicado:</span>
            <span>-{fmtCLP(preview.descuentoMonto)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-emerald-200 pt-1 text-base font-extrabold text-slate-900">
            <span>Nuevo Total Final:</span>
            <span>{fmtCLP(preview.total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Aplicar descuento</Btn>
        </div>
      </form>
    </Modal>
  )
}
