import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useScope } from '@/lib/scope'
import { crearTicket, emitirCotizacion } from '@/lib/actions'
import type { EstadoTicket, ItemCot, Ticket } from '@/lib/types'
import { addDays, calcCot, fmtCLP, fmtFecha, fmtFechaHora, reglaDescuento, today } from '@/lib/util'
import { cotTone, ticketTone } from '@/lib/tones'
import { downloadCotizacionXlsx } from '@/lib/xlsx'
import AgendarHoraModal from '@/components/AgendarHoraModal'
import { Badge, Btn, Card, Empty, Field, Modal, PageHeader, Table, inputCls, td } from '@/components/kit'

export function TicketsPage() {
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [agendarHora, setAgendarHora] = useState(false)
  const preEq = (params.get('equipos') ?? '').split(',').map(Number).filter(Boolean)
  const openNew = params.get('nuevo') === '1'
  const closeNew = () => setParams({}, { replace: true })

  return (
    <>
      <PageHeader
        title={sc.isClient ? 'Mis tickets y reservas' : 'Tickets de clientes'}
        subtitle="Solicitudes de cotización, reserva de hora para mantención y soporte técnico"
        actions={
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" onClick={() => setAgendarHora(true)}>
              📅 Agendar Hora de Mantención
            </Btn>
            <Btn onClick={() => setParams({ nuevo: '1' })}>+ Nuevo ticket</Btn>
          </div>
        }
      />

      {sc.tickets.length === 0 ? (
        <Empty>No hay tickets registrados todavía.</Empty>
      ) : (
        <Table head={['Código', 'Asunto y Hora Reservada', 'Tipo', 'Cliente / Empresa', 'Equipos', 'Estado', 'Creado', '']}>
          {[...sc.tickets].reverse().map((t) => {
            const emp = db.empresas.find((e) => e.id === t.empresaId)
            const cli = db.usuarios.find((u) => u.id === t.usuarioId)
            return (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className={`${td} font-semibold`}>
                  <Link to={`/app/tickets/${t.id}`} className="text-emerald-700 hover:underline">{t.codigo}</Link>
                </td>
                <td className={td}>
                  <div className="font-medium text-slate-900">{t.asunto}</div>
                  {t.fechaCita && t.horaCita && (
                    <div className="text-[11px] font-bold text-emerald-700">
                      🕒 Hora reservada: {fmtFecha(t.fechaCita)} a las {t.horaCita} hrs
                    </div>
                  )}
                </td>
                <td className={td}><Badge>{t.tipo}</Badge></td>
                <td className={td}>
                  <div>{emp?.razonSocial ?? cli?.nombre}</div>
                  <div className="text-[11px] text-slate-400">{emp ? '🏢 Empresa B2B' : '👤 Cliente Natural'}</div>
                </td>
                <td className={td}>{t.cantEquipos} eq.</td>
                <td className={td}><Badge tone={ticketTone[t.estado]}>{t.estado.replace('_', ' ')}</Badge></td>
                <td className={`${td} text-xs text-slate-500`}>{fmtFechaHora(t.creado)}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {t.otId && (
                      <Link to={`/app/ot?ot=${t.otId}`} className="text-xs font-bold text-indigo-700 hover:underline">
                        Ver OT →
                      </Link>
                    )}
                    <Link to={`/app/tickets/${t.id}`} className="text-xs font-medium text-pcg-green hover:underline">Abrir →</Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      )}

      {agendarHora && (
        <AgendarHoraModal
          onClose={() => setAgendarHora(false)}
          onSuccess={(newOtId) => nav(`/app/ot?ot=${newOtId}`)}
        />
      )}

      {openNew && (
        <NuevoTicketModal
          preselected={preEq}
          onClose={closeNew}
          onCreate={(data) => {
            let tid = 0
            mutate((d) => {
              const t = crearTicket(d, user!, data)
              tid = t.id
            })
            closeNew()
            nav(`/app/tickets/${tid}`)
          }}
        />
      )}
    </>
  )
}

function NuevoTicketModal({
  preselected,
  onClose,
  onCreate,
}: {
  preselected: number[]
  onClose: () => void
  onCreate: (d: { tipo: Ticket['tipo']; asunto: string; descripcion: string; equipoIds: number[]; cantEquipos: number }) => void
}) {
  const { db } = useStore()
  const [tipo, setTipo] = useState<Ticket['tipo']>('COTIZACION')
  const [asunto, setAsunto] = useState(preselected.length ? `Cotización mantención (${preselected.length} equipo(s))` : '')
  const [descripcion, setDescripcion] = useState('')
  const [cantManual, setCantManual] = useState(preselected.length || 1)
  const [tiposRef, setTiposRef] = useState<string[]>(['PC Torre / Escritorio', 'Laptop / Notebook'])

  const cant = Math.max(1, cantManual)
  const dcto = reglaDescuento(db, cant)

  const CATEGORIAS_TICKET = [
    '🖥️ PC Torre / Escritorio',
    '💻 Laptop / Notebook',
    '🗄️ Servidor',
    '🖨️ Impresora',
    '📹 Cámara CCTV',
    '📡 Red / Switch',
    '🔋 UPS',
  ]

  const toggleCat = (c: string) =>
    setTiposRef((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  return (
    <Modal open onClose={onClose} title="Solicitar nuevo ticket / cotización" wide>
      <form
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          const detalleCategorias =
            tiposRef.length > 0 ? `\n\nTipos de equipo indicados: ${tiposRef.join(', ')}.` : ''
          onCreate({
            tipo,
            asunto,
            descripcion: `${descripcion.trim()}${detalleCategorias}`,
            equipoIds: [],
            cantEquipos: cant,
          })
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo de solicitud">
            <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as Ticket['tipo'])}>
              <option value="COTIZACION">Solicitar cotización</option>
              <option value="MANTENCION">Agendar mantención</option>
              <option value="SOPORTE">Soporte / falla técnica</option>
              <option value="CONSULTA">Consulta general</option>
            </select>
          </Field>
          <Field label="Cantidad de equipos">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={cant}
              onChange={(e) => setCantManual(Number(e.target.value))}
            />
          </Field>
        </div>

        {dcto > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
            ✓ Por incluir <b>{cant} equipos</b> calificas automáticamente a un <b>{dcto}% de descuento por volumen</b> o tarifa de Convenio Corporativo.
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            ¿Qué tipo de equipos necesitas atender o cotizar? (opcional)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS_TICKET.map((cat) => {
              const active = tiposRef.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Asunto">
          <input
            className={inputCls}
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            required
            placeholder="Ej: Cotización convenio mantención parque informático"
          />
        </Field>
        <Field label="Descripción o requerimiento">
          <textarea
            className={inputCls}
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            placeholder="Indica qué necesitas realizar, síntomas de los equipos, horario preferido o si requieres paquete con Windows / Office / Avast…"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Enviar ticket</Btn>
        </div>
      </form>
    </Modal>
  )
}

export function TicketDetailPage() {
  const { id } = useParams()
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const [texto, setTexto] = useState('')
  const [interno, setInterno] = useState(false)
  const [modalCotizar, setModalCotizar] = useState(false)
  const [modalAsociar, setModalAsociar] = useState(false)

  const t = sc.tickets.find((x) => x.id === Number(id))
  if (!t) return <Empty>Ticket no encontrado.</Empty>

  const emp = db.empresas.find((e) => e.id === t.empresaId)
  const cli = db.usuarios.find((u) => u.id === t.usuarioId)
  const cots = db.cotizaciones.filter((c) => c.ticketId === t.id && (sc.staff || c.estado !== 'BORRADOR'))
  const canQuote = user!.rol === 'ADMIN' || user!.rol === 'DOC_PROCESS'

  return (
    <>
      <PageHeader
        title={`${t.codigo} · ${t.asunto}`}
        subtitle={`${emp?.razonSocial ?? cli?.nombre} · ${t.cantEquipos} equipo(s)`}
        actions={
          canQuote && (
            <div className="flex flex-wrap items-center gap-2">
              <Btn variant="secondary" onClick={() => setModalAsociar(true)}>
                🔗 Asociar cotización existente
              </Btn>
              <Btn onClick={() => setModalCotizar(true)}>
                + Cotizar Servicios de PCG SPA
              </Btn>
            </div>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Detalle de la solicitud" action={<Badge tone={ticketTone[t.estado]}>{t.estado.replace('_', ' ')}</Badge>}>
            <p className="text-sm text-slate-700">{t.descripcion}</p>
            {t.equipoIds.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-medium text-slate-500">Equipos incluidos en el ticket:</div>
                <div className="flex flex-wrap gap-1.5">
                  {t.equipoIds.map((eid) => {
                    const eq = db.equipos.find((x) => x.id === eid)
                    return eq ? (
                      <Link key={eid} to={`/app/equipos/${eid}`} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs hover:bg-slate-100">
                        <b>{eq.codigo}</b> · {eq.marca} {eq.modelo}
                      </Link>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card title="Conversación del ticket">
            <ul className="space-y-3">
              {t.mensajes.filter((m) => sc.staff || !m.interno).map((m, i) => {
                const autor = db.usuarios.find((u) => u.id === m.usuarioId)
                return (
                  <li key={i} className={`rounded-lg p-3 text-sm ${m.interno ? 'border border-amber-200 bg-amber-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span><b>{autor?.nombre}</b> {m.interno && <Badge tone="amber">Nota interna (solo staff)</Badge>}</span>
                      <span>{fmtFechaHora(m.fecha)}</span>
                    </div>
                    <p className="mt-1 text-slate-800">{m.texto}</p>
                  </li>
                )
              })}
              {t.mensajes.length === 0 && <li className="text-sm text-slate-400">Aún no hay mensajes en este ticket.</li>}
            </ul>

            <form
              className="mt-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!texto.trim()) return
                mutate((d) => {
                  d.tickets.find((x) => x.id === t.id)!.mensajes.push({
                    usuarioId: user!.id,
                    texto: texto.trim(),
                    interno: sc.staff ? interno : false,
                    fecha: new Date().toISOString(),
                  })
                })
                setTexto('')
              }}
            >
              <textarea className={inputCls} rows={2} placeholder="Escribir respuesta…" value={texto} onChange={(e) => setTexto(e.target.value)} />
              <div className="flex items-center justify-between">
                {sc.staff ? (
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" checked={interno} onChange={(e) => setInterno(e.target.checked)} />
                    Nota interna (oculta para el cliente)
                  </label>
                ) : <span />}
                <Btn type="submit" size="sm">Enviar mensaje</Btn>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          {canQuote && (
            <Card title="Estado del ticket">
              <select
                className={inputCls}
                value={t.estado}
                onChange={(e) => mutate((d) => { d.tickets.find((x) => x.id === t.id)!.estado = e.target.value as EstadoTicket })}
              >
                {(['ABIERTO', 'EN_COTIZACION', 'COTIZADO', 'ACEPTADO', 'CERRADO', 'CANCELADO'] as EstadoTicket[]).map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </Card>
          )}

          <Card
            title="Cotizaciones asociadas"
            action={
              canQuote ? (
                <div className="flex items-center gap-1.5">
                  <Btn size="sm" onClick={() => setModalCotizar(true)}>
                    + Cotizar
                  </Btn>
                  <Btn size="sm" variant="secondary" onClick={() => setModalAsociar(true)}>
                    🔗 Asociar
                  </Btn>
                </div>
              ) : undefined
            }
          >
            {cots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-300 bg-gradient-to-b from-emerald-50/60 to-white p-4 text-center">
                <div className="mb-1 text-2xl">📑</div>
                <div className="text-xs font-bold text-slate-800">Sin cotizaciones emitidas aún</div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Presupuesta los servicios de PCG SPA (mantención hardware, Windows/Office, Avast, diseño de logos/tarjetas, web o software) directamente vinculados a este ticket.
                </p>
                {canQuote && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Btn size="sm" onClick={() => setModalCotizar(true)}>
                      + Cotizar Servicios de PCG SPA
                    </Btn>
                    <Btn size="sm" variant="secondary" onClick={() => setModalAsociar(true)}>
                      🔗 Vincular Cotización Existente
                    </Btn>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <ul className="space-y-2.5 text-sm">
                  {cots.map((c) => {
                    const firstItem = c.items[0]?.descripcion?.split('\n')[0] ?? 'Servicios PCG'
                    const extraItemsCount = c.items.length - 1
                    return (
                      <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition hover:border-emerald-300">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link to={`/app/cotizaciones/${c.id}`} className="font-extrabold text-emerald-700 hover:underline">
                              {c.numero}
                            </Link>
                            <div className="mt-0.5 text-[11px] text-slate-600 line-clamp-1">
                              {firstItem} {extraItemsCount > 0 && `(+${extraItemsCount} ítem${extraItemsCount > 1 ? 's' : ''})`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-slate-900">{fmtCLP(c.total)}</div>
                            <Badge tone={cotTone[c.estado]}>{c.estado}</Badge>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                          <span className="text-[11px] text-slate-400">📅 {fmtFecha(c.fecha)}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => downloadCotizacionXlsx(db, c)}
                              className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:underline"
                            >
                              📥 Excel
                            </button>
                            <Link to={`/app/cotizaciones/${c.id}`} className="text-[11px] font-bold text-emerald-700 hover:underline">
                              Ver cotización →
                            </Link>
                            {canQuote && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Desvincular la cotización ${c.numero} de este ticket?`)) {
                                    mutate((d) => {
                                      const found = d.cotizaciones.find((x) => x.id === c.id)
                                      if (found) found.ticketId = undefined
                                    })
                                  }
                                }}
                                className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline"
                              >
                                Desvincular
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {canQuote && (
                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalCotizar(true)}
                      className="flex-1 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100/70 transition"
                    >
                      + Cotizar otro servicio
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalAsociar(true)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      🔗 Vincular otra
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {modalCotizar && (
        <ModalCotizarServiciosTicket
          ticket={t}
          onClose={() => setModalCotizar(false)}
        />
      )}

      {modalAsociar && (
        <ModalAsociarCotizacion
          ticket={t}
          onClose={() => setModalAsociar(false)}
        />
      )}
    </>
  )
}

/** Modal para armar y emitir una cotización de servicios PCG SPA directamente vinculada al ticket */
function ModalCotizarServiciosTicket({
  ticket,
  onClose,
}: {
  ticket: Ticket
  onClose: () => void
}) {
  const { db, user, mutate } = useStore()
  const emp = db.empresas.find((e) => e.id === ticket.empresaId)
  const cli = db.usuarios.find((u) => u.id === ticket.usuarioId)

  const [modo, setModo] = useState<ItemCotModo>('CONVENIO')
  const [cantEquipos, setCantEquipos] = useState<number>(ticket.cantEquipos || 1)
  const [paqueteId, setPaqueteId] = useState<number>(1)
  const [filtroCat, setFiltroCat] = useState<'TODOS' | 'HARDWARE' | 'SEGURIDAD' | 'WEB' | 'DISENO' | 'SOFTWARE'>('TODOS')

  // Descuento a criterio
  const [dctoPct, setDctoPct] = useState<number>(0)
  const [dctoMonto, setDctoMonto] = useState<number>(0)
  const [motivo, setMotivo] = useState<string>('')

  // Planificación técnica
  const [planInicio, setPlanInicio] = useState(today())
  const [planFin, setPlanFin] = useState(addDays(today(), 4))
  const [tecnicoId, setTecnicoId] = useState<number>(3) // Johan Carrasco por defecto
  const [crearOt, setCrearOt] = useState<boolean>(false)

  // Construir ítems a partir de paquete
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

  const [items, setItems] = useState<ItemCot[]>(() => {
    // Si el asunto o descripción menciona logo/tarjetas
    const txt = (ticket.asunto + ' ' + ticket.descripcion).toLowerCase()
    if (txt.includes('logo') || txt.includes('tarjeta') || txt.includes('diseño')) {
      return buildFromPack(5, 1)
    }
    if (txt.includes('web') || txt.includes('hosting') || txt.includes('pagina')) {
      return buildFromPack(6, 1)
    }
    return buildFromPack(1, ticket.cantEquipos || 1)
  })

  const applyPack = (pid: number) => {
    setPaqueteId(pid)
    const n = pid === 5 || pid === 6 ? 1 : cantEquipos
    setItems(buildFromPack(pid, n))
  }

  const addServicio = (s: (typeof db.servicios)[number]) => {
    // Para servicios web, diseño o software, cantidad 1; para hardware, cantidad = cantEquipos
    const isSingle = s.codigo.startsWith('DIS-') || s.codigo.startsWith('WEB-') || s.codigo.startsWith('SOFT-')
    setItems((prev) => [
      ...prev,
      {
        servicioId: s.id,
        descripcion: `${s.nombre}\n(${s.descripcion})`,
        cantidad: isSingle ? 1 : cantEquipos,
        normal: s.normal,
        convenio: s.convenio,
      },
    ])
  }

  const addCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        descripcion: 'Repuesto o Servicio personalizado adicional (ej: Disco SSD 1TB Kingston NVMe)',
        cantidad: 1,
        normal: 45000,
        convenio: 38000,
      },
    ])
  }

  const totals = calcCot(db, items, cantEquipos, modo, { pct: dctoPct, monto: dctoMonto })
  const staffTecnicos = db.usuarios.filter((u) => u.rol === 'WORKER' || u.rol === 'ADMIN' || u.rol === 'DOC_PROCESS')

  const handleCrear = (enviarAlCrear: boolean) => {
    if (items.length === 0) {
      alert('Debes agregar al menos un servicio o ítem a la cotización.')
      return
    }

    let cotNumero = ''

    mutate((d) => {
      const c = emitirCotizacion(d, {
        ticketId: ticket.id,
        usuarioId: ticket.usuarioId,
        empresaId: ticket.empresaId,
        emailDestino: cli?.email,
        enviarAlCrear,
        paqueteId,
        modo,
        descuentoCriterioPct: dctoPct || undefined,
        descuentoCriterioMonto: dctoMonto || undefined,
        motivoDescuento: motivo.trim() || undefined,
        planInicio,
        planFin,
        planTecnicoId: tecnicoId,
        crearOtInmediata: crearOt,
        items,
        cantEquipos,
        emitidaPor: user!.id,
      })
      cotNumero = c.numero

      // Registrar mensaje en el ticket
      const tk = d.tickets.find((x) => x.id === ticket.id)
      if (tk) {
        tk.estado = enviarAlCrear ? 'COTIZADO' : 'EN_COTIZACION'
        tk.mensajes.push({
          usuarioId: user!.id,
          texto: `📋 Cotización ${cotNumero} generada y asociada por un total de $${c.total.toLocaleString('es-CL')} (${c.items.length} ítems presupuestados).`,
          interno: false,
          fecha: new Date().toISOString(),
        })
      }
    })

    onClose()
  }

  // Filtrar catálogo de servicios por categoría
  const serviciosFiltrados = db.servicios.filter((s) => {
    if (filtroCat === 'HARDWARE') return s.codigo.startsWith('MANT-') || s.codigo.startsWith('SO-') || s.codigo.startsWith('DRIVERS')
    if (filtroCat === 'SEGURIDAD') return s.codigo.startsWith('AVAST-') || s.codigo.startsWith('DASH-')
    if (filtroCat === 'WEB') return s.codigo.startsWith('WEB-')
    if (filtroCat === 'DISENO') return s.codigo.startsWith('DIS-')
    if (filtroCat === 'SOFTWARE') return s.codigo.startsWith('SOFT-')
    return true
  })

  return (
    <Modal open onClose={onClose} title={`Cotizar Servicios de PCG SPA · Ticket ${ticket.codigo}`} wide>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Encabezado contextual del ticket y cliente */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-extrabold text-emerald-950">Cliente / Empresa:</span>{' '}
              <span className="font-semibold text-slate-900">{emp?.razonSocial ?? cli?.nombre}</span>
              {emp?.rut && <span className="text-slate-500"> (RUT {emp.rut})</span>}
            </div>
            <Badge tone="blue">Ticket {ticket.codigo} · {ticket.asunto}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/60 pt-2 text-slate-700">
            <div>✉ Correo cliente: <b>{cli?.email ?? 'Sin correo registrado'}</b></div>
            <div className="flex items-center gap-1.5 font-bold">
              <span>Parque de equipos a cotizar:</span>
              <input
                type="number"
                min={1}
                className={`${inputCls} !text-xs !py-0.5 !px-2 !w-16 bg-white`}
                value={cantEquipos}
                onChange={(e) => {
                  const n = Math.max(1, Number(e.target.value))
                  setCantEquipos(n)
                  setItems((prev) =>
                    prev.map((it) =>
                      it.servicioId && it.servicioId <= 6 ? { ...it, cantidad: n } : it
                    )
                  )
                }}
              />
              <span>eq.</span>
            </div>
          </div>
        </div>

        {/* 1. Selector rápido de Paquetes PCG */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-2 text-xs font-bold text-slate-700">
            📦 1. Cargar Paquete o Convenio Oficial en 1 Clic:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {db.paquetes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPack(p.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  paqueteId === p.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Catálogo interactivo de servicios PCG SPA */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="text-xs font-bold text-slate-800">
              🛠️ 2. Catálogo de Servicios que Realizamos (haz clic para sumar al presupuesto):
            </div>
            <div className="flex flex-wrap gap-1">
              {(['TODOS', 'HARDWARE', 'SEGURIDAD', 'WEB', 'DISENO', 'SOFTWARE'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFiltroCat(cat)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                    filtroCat === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'TODOS' ? 'Ver Todos' : cat === 'HARDWARE' ? '🔧 Hardware/SO' : cat === 'SEGURIDAD' ? '🛡️ Antivirus' : cat === 'WEB' ? '🌐 Web/Hosting' : cat === 'DISENO' ? '🎨 Logos/Tarjetas' : '💻 Software'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-56 overflow-y-auto p-1">
            {serviciosFiltrados.map((s) => {
              const yaEsta = items.some((it) => it.servicioId === s.id)
              return (
                <div
                  key={s.id}
                  className={`rounded-lg border p-2.5 text-xs flex flex-col justify-between transition ${
                    yaEsta
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 line-clamp-1">{s.nombre}</span>
                      <span className="text-[10px] font-mono text-slate-400">{s.codigo}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{s.descripcion}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through">{fmtCLP(s.normal)}</span>{' '}
                      <span className="font-bold text-emerald-700">{fmtCLP(s.convenio)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addServicio(s)}
                      className={`rounded px-2 py-0.5 text-[11px] font-bold transition ${
                        yaEsta
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-900 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {yaEsta ? '+ Sumar otro' : '+ Agregar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={addCustomItem}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              + Agregar repuesto o ítem libre (SSD, RAM, etc.)
            </button>
          </div>
        </div>

        {/* 3. Tabla de ítems cotizados */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-3 py-2 text-xs font-bold text-white flex items-center justify-between">
            <span>📋 3. Servicios e Ítems en esta Cotización ({items.length})</span>
            <span className="text-[11px] font-normal text-slate-300">Puedes editar cantidades y valores unitarios</span>
          </div>
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2">Servicio / Descripción</th>
                  <th className="p-2 w-16">Cant.</th>
                  <th className="p-2 w-24">Precio Normal</th>
                  <th className="p-2 w-24">Tarifa Convenio</th>
                  <th className="p-2 w-24">Subtotal</th>
                  <th className="p-2 w-10 text-center">✕</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="p-2">
                      <textarea
                        className={`${inputCls} !text-xs !py-1`}
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
                        step={1000}
                        className={`${inputCls} !text-xs !py-1 !w-24`}
                        value={it.normal}
                        onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, normal: Number(e.target.value) } : x)))}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step={1000}
                        className={`${inputCls} !text-xs !py-1 !w-24`}
                        value={it.convenio}
                        onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, convenio: Number(e.target.value) } : x)))}
                      />
                    </td>
                    <td className="p-2 font-bold text-slate-900">
                      {fmtCLP((modo === 'CONVENIO' ? it.convenio : it.normal) * it.cantidad)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Eliminar ítem"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-xs text-slate-400">
                      No has agregado ningún servicio. Selecciona uno del catálogo arriba.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Modalidad y Descuento a criterio */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-amber-950">4. Modalidad de Precios:</span>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 font-medium text-slate-800">
                <input type="radio" checked={modo === 'CONVENIO'} onChange={() => setModo('CONVENIO')} />
                Tarifa Convenio Corporativo (Excel oficial)
              </label>
              <label className="flex items-center gap-1.5 font-medium text-slate-800">
                <input type="radio" checked={modo === 'CRITERIO'} onChange={() => setModo('CRITERIO')} />
                Tarifa Normal con descuento a criterio
              </label>
            </div>
          </div>

          <div className="border-t border-amber-200/60 pt-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-amber-900">★ Descuento adicional a criterio:</span>
              <div className="flex flex-wrap gap-1">
                {[0, 5, 10, 15, 20, 25, 30].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDctoPct(p)}
                    className={`rounded px-2 py-0.5 text-xs font-semibold transition ${
                      dctoPct === p
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-100'
                    }`}
                  >
                    {p === 0 ? 'Sin %' : `-${p}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600">Descuento porcentual (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  className={inputCls}
                  value={dctoPct}
                  onChange={(e) => setDctoPct(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600">Rebaja adicional fija ($ CLP)</label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  className={inputCls}
                  value={dctoMonto}
                  onChange={(e) => setDctoMonto(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600">Glosa / Motivo descuento</label>
                <input
                  type="text"
                  className={inputCls}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Descuento comercial por ticket"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Asignación técnica y calendario OT */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="text-xs font-bold text-slate-800 mb-2">
            📅 5. Planificación y Asignación de Especialista PCG:
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div>
              <label className="text-[11px] font-medium text-slate-600">Especialista asignado</label>
              <select
                className={inputCls}
                value={tecnicoId}
                onChange={(e) => setTecnicoId(Number(e.target.value))}
              >
                {staffTecnicos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.cargo ?? u.rol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">Fecha sugerida de inicio</label>
              <input
                type="date"
                className={inputCls}
                value={planInicio}
                onChange={(e) => setPlanInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">Fecha sugerida de término</label>
              <input
                type="date"
                className={inputCls}
                value={planFin}
                onChange={(e) => setPlanFin(e.target.value)}
              />
            </div>
          </div>
          <label className="mt-2.5 flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={crearOt}
              onChange={(e) => setCrearOt(e.target.checked)}
            />
            Crear Orden de Trabajo (OT) y Tareas de mantención/diseño en el Planner automáticamente
          </label>
        </div>

        {/* Resumen financiero dinámico */}
        <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-slate-500">Subtotal Tarifa Normal</div>
              <div className="font-semibold text-slate-600 line-through">{fmtCLP(totals.subtotalNormal)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Ahorro / Descuento aplicado</div>
              <div className="font-bold text-emerald-700">-{fmtCLP(totals.descuentoMonto)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold text-slate-800">Total Final a Cobrar</div>
              <div className="text-xl font-black text-slate-900">{fmtCLP(totals.total)}</div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <Btn variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" onClick={() => handleCrear(false)}>
              💾 Guardar como Borrador
            </Btn>
            <Btn onClick={() => handleCrear(true)}>
              🚀 Emitir y Notificar al Cliente
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}

type ItemCotModo = 'CONVENIO' | 'VOLUMEN' | 'CRITERIO'

/** Modal para vincular una cotización ya existente a este ticket */
function ModalAsociarCotizacion({
  ticket,
  onClose,
}: {
  ticket: Ticket
  onClose: () => void
}) {
  const { db, user, mutate } = useStore()
  const [filtro, setFiltro] = useState('')

  // Cotizaciones existentes
  const cotsDeEsteCliente = db.cotizaciones.filter(
    (c) => (c.empresaId === ticket.empresaId || c.usuarioId === ticket.usuarioId)
  )
  const otrasCots = db.cotizaciones.filter(
    (c) => !(c.empresaId === ticket.empresaId || c.usuarioId === ticket.usuarioId)
  )

  const vincular = (cotId: number) => {
    mutate((d) => {
      const c = d.cotizaciones.find((x) => x.id === cotId)
      if (c) c.ticketId = ticket.id
      const tk = d.tickets.find((x) => x.id === ticket.id)
      if (tk) {
        if (tk.estado === 'ABIERTO') tk.estado = 'COTIZADO'
        tk.mensajes.push({
          usuarioId: user!.id,
          texto: `🔗 Se vinculó la cotización existente ${c?.numero} por $${c?.total.toLocaleString('es-CL')} a este ticket.`,
          interno: true,
          fecha: new Date().toISOString(),
        })
      }
    })
    onClose()
  }

  const renderFila = (c: (typeof db.cotizaciones)[number]) => {
    const emp = db.empresas.find((e) => e.id === c.empresaId)
    const cli = db.usuarios.find((u) => u.id === c.usuarioId)
    const estaVinculadaAAca = c.ticketId === ticket.id
    const estaVinculadaAOtro = c.ticketId && c.ticketId !== ticket.id
    const tkOtro = estaVinculadaAOtro ? db.tickets.find((t) => t.id === c.ticketId) : null

    return (
      <li
        key={c.id}
        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-xs transition ${
          estaVinculadaAAca
            ? 'border-emerald-300 bg-emerald-50/60'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">{c.numero}</span>
            <Badge tone={cotTone[c.estado]}>{c.estado}</Badge>
            {estaVinculadaAAca && <Badge tone="green">Ya vinculada a este ticket</Badge>}
            {estaVinculadaAOtro && <Badge tone="amber">Vinculada a {tkOtro?.codigo ?? `Ticket #${c.ticketId}`}</Badge>}
          </div>
          <div className="text-slate-600">
            {emp?.razonSocial ?? cli?.nombre} · {c.items.length} ítems · 📅 {fmtFecha(c.fecha)}
          </div>
          <div className="text-[11px] text-slate-400">
            {c.items.map((i) => i.descripcion.split('\n')[0]).slice(0, 2).join(' + ')}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-extrabold text-slate-900">{fmtCLP(c.total)}</div>
            <div className="text-[10px] text-slate-400">{c.cantEquipos} eq.</div>
          </div>
          {estaVinculadaAAca ? (
            <button
              type="button"
              onClick={() => {
                mutate((d) => {
                  const found = d.cotizaciones.find((x) => x.id === c.id)
                  if (found) found.ticketId = undefined
                })
              }}
              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Desvincular
            </button>
          ) : (
            <Btn size="sm" onClick={() => vincular(c.id)}>
              🔗 Vincular a este ticket
            </Btn>
          )}
        </div>
      </li>
    )
  }

  const query = filtro.trim().toLowerCase()
  const filterList = (arr: typeof db.cotizaciones) => {
    if (!query) return arr
    return arr.filter((c) => {
      const emp = db.empresas.find((e) => e.id === c.empresaId)
      const cli = db.usuarios.find((u) => u.id === c.usuarioId)
      return (
        c.numero.toLowerCase().includes(query) ||
        (emp?.razonSocial ?? '').toLowerCase().includes(query) ||
        (cli?.nombre ?? '').toLowerCase().includes(query) ||
        c.items.some((i) => i.descripcion.toLowerCase().includes(query))
      )
    })
  }

  const clienteCotsFiltradas = filterList(cotsDeEsteCliente)
  const otrasCotsFiltradas = filterList(otrasCots)

  return (
    <Modal open onClose={onClose} title={`Asociar Cotización Existente · Ticket ${ticket.codigo}`}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <input
          type="text"
          className={inputCls}
          placeholder="Buscar por número (ej: COT-2026), cliente o servicio..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        {clienteCotsFiltradas.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-bold text-emerald-900">
              Cotizaciones de este cliente / empresa:
            </div>
            <ul className="space-y-2">
              {clienteCotsFiltradas.map(renderFila)}
            </ul>
          </div>
        )}

        {otrasCotsFiltradas.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="mb-2 text-xs font-bold text-slate-600">
              Otras cotizaciones registradas en el sistema:
            </div>
            <ul className="space-y-2">
              {otrasCotsFiltradas.map(renderFila)}
            </ul>
          </div>
        )}

        {clienteCotsFiltradas.length === 0 && otrasCotsFiltradas.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-400">
            No se encontraron cotizaciones con ese criterio de búsqueda.
          </p>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Btn variant="secondary" onClick={onClose}>
            Cerrar
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

