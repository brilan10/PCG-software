import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useScope } from '@/lib/scope'
import { crearInforme, enviarCorreo } from '@/lib/actions'
import { TIPO_HW_META } from '@/lib/types'
import type { Informe } from '@/lib/types'
import { fmtFecha } from '@/lib/util'
import { Badge, Btn, Empty, Field, Modal, PageHeader, Table, cx, inputCls, td } from '@/components/kit'

export function InformesPage() {
  const { user, mutate } = useStore()
  const sc = useScope()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Informes técnicos"
        subtitle="Reportes detallados de qué se le hizo a cada PC, orden de trabajo o parque completo"
        actions={sc.staff && <Btn onClick={() => setOpen(true)}>+ Generar nuevo informe</Btn>}
      />

      {sc.informes.length === 0 ? (
        <Empty>No hay informes disponibles todavía.</Empty>
      ) : (
        <Table head={['Código', 'Tipo', 'Título', 'Fecha', 'Visibilidad cliente', '']}>
          {[...sc.informes].reverse().map((inf) => (
            <tr key={inf.id} className="hover:bg-slate-50">
              <td className={`${td} font-semibold`}>
                <Link to={`/app/informes/${inf.id}`} className="text-emerald-700 hover:underline">{inf.codigo}</Link>
              </td>
              <td className={td}><Badge tone="blue">{inf.tipo.replace('_', ' ')}</Badge></td>
              <td className={td}>{inf.titulo}</td>
              <td className={td}>{fmtFecha(inf.fecha)}</td>
              <td className={td}>
                <Badge tone={inf.visibleCliente ? 'green' : 'slate'}>
                  {inf.visibleCliente ? 'Visible en portal cliente' : 'Solo interno'}
                </Badge>
              </td>
              <td className={`${td} text-right`}>
                <Link to={`/app/informes/${inf.id}`} className="text-xs font-medium text-pcg-green hover:underline">Abrir / Imprimir →</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {open && (
        <NuevoInformeModal
          onClose={() => setOpen(false)}
          onCreate={(data) => {
            let id = 0
            mutate((d) => {
              const inf = crearInforme(d, { ...data, generadoPor: user!.id })
              id = inf.id
            })
            setOpen(false)
            nav(`/app/informes/${id}`)
          }}
        />
      )}
    </>
  )
}

function NuevoInformeModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (d: Omit<Informe, 'id' | 'codigo' | 'fecha' | 'generadoPor'>) => void
}) {
  const { db } = useStore()
  const [tipo, setTipo] = useState<Informe['tipo']>('EQUIPO')
  const [equipoId, setEquipoId] = useState(db.equipos[0]?.id ?? 1)
  const [otId, setOtId] = useState(db.ots[0]?.id ?? 1)
  const [empresaId, setEmpresaId] = useState(db.empresas[0]?.id ?? 1)

  // Buscadores escribibles para encontrar rápido PC/Equipo, OT o Empresa
  const [qEquipo, setQEquipo] = useState('')
  const [openListaEquipo, setOpenListaEquipo] = useState(false)
  const [qOt, setQOt] = useState('')
  const [openListaOt, setOpenListaOt] = useState(false)
  const [qEmpresa, setQEmpresa] = useState('')
  const [openListaEmpresa, setOpenListaEmpresa] = useState(false)

  const [titulo, setTitulo] = useState(
    db.equipos[0]
      ? `Informe técnico ${db.equipos[0].codigo} · ${db.equipos[0].marca} ${db.equipos[0].modelo}`
      : 'Informe técnico de intervención de hardware',
  )
  const [resumen, setResumen] = useState(
    'El equipo fue intervenido siguiendo el protocolo estándar de PCG SPA, registrando mejoras térmicas y estabilidad operativa.',
  )
  const [visible, setVisible] = useState(true)

  const equipoSeleccionado = db.equipos.find((x) => x.id === equipoId)
  const otSeleccionada = db.ots.find((x) => x.id === otId)
  const empresaSeleccionada = db.empresas.find((x) => x.id === empresaId)

  const equiposFiltrados = useMemo(() => {
    const q = qEquipo.trim().toLowerCase()
    if (!q) return db.equipos
    return db.equipos.filter((eq) => {
      const emp = db.empresas.find((e) => e.id === eq.empresaId)
      const usr = db.usuarios.find((u) => u.id === eq.usuarioId)
      const meta = TIPO_HW_META[eq.tipo]
      const hay = `${eq.codigo} ${eq.marca} ${eq.modelo} ${eq.serie} ${eq.area} ${meta?.label ?? ''} ${emp?.razonSocial ?? ''} ${usr?.nombre ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [db.equipos, db.empresas, db.usuarios, qEquipo])

  const otsFiltradas = useMemo(() => {
    const q = qOt.trim().toLowerCase()
    if (!q) return db.ots
    return db.ots.filter((o) => {
      const emp = db.empresas.find((e) => e.id === o.empresaId)
      const usr = db.usuarios.find((u) => u.id === o.usuarioId)
      const hay = `${o.codigo} ${o.titulo} ${emp?.razonSocial ?? ''} ${usr?.nombre ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [db.ots, db.empresas, db.usuarios, qOt])

  const empresasFiltradas = useMemo(() => {
    const q = qEmpresa.trim().toLowerCase()
    if (!q) return db.empresas
    return db.empresas.filter((em) =>
      `${em.razonSocial} ${em.rut} ${em.ciudad} ${em.giro}`.toLowerCase().includes(q),
    )
  }, [db.empresas, qEmpresa])

  const handlePickEquipo = (id: number) => {
    setEquipoId(id)
    setOpenListaEquipo(false)
    setQEquipo('')
    const eq = db.equipos.find((x) => x.id === id)
    if (eq) {
      setTitulo(`Informe técnico ${eq.codigo} · ${eq.marca} ${eq.modelo} (${eq.area})`)
    }
  }

  const handlePickOt = (id: number) => {
    setOtId(id)
    setOpenListaOt(false)
    setQOt('')
    const o = db.ots.find((x) => x.id === id)
    if (o) {
      setTitulo(`Informe cierre de OT ${o.codigo} — ${o.titulo}`)
    }
  }

  const handlePickEmpresa = (id: number) => {
    setEmpresaId(id)
    setOpenListaEmpresa(false)
    setQEmpresa('')
    const em = db.empresas.find((x) => x.id === id)
    if (em) {
      setTitulo(`Auditoría preventiva Parque TI — ${em.razonSocial}`)
    }
  }

  return (
    <Modal open onClose={onClose} title="Generador de informes técnicos" wide>
      <form
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          const eq = db.equipos.find((x) => x.id === equipoId)
          const ot = db.ots.find((x) => x.id === otId)
          onCreate({
            tipo,
            equipoId: tipo === 'EQUIPO' ? equipoId : undefined,
            otId: tipo === 'OT' ? otId : undefined,
            empresaId: tipo === 'PARQUE_EMPRESA' ? empresaId : tipo === 'EQUIPO' ? eq?.empresaId : ot?.empresaId,
            titulo,
            resumen,
            visibleCliente: visible,
          })
        }}
      >
        <Field label="Tipo de informe">
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as Informe['tipo'])}>
            <option value="EQUIPO">Por equipo individual ("¿Qué se le hizo a este PC?")</option>
            <option value="OT">Por Orden de Trabajo (OT)</option>
            <option value="PARQUE_EMPRESA">Estado del parque completo de una empresa</option>
          </select>
        </Field>

        {tipo === 'EQUIPO' && (
          <div className="relative">
            <Field label="Seleccionar PC / Equipo (Escribe código, marca, modelo, área o cliente para buscar rápido)">
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} pr-24`}
                  value={
                    openListaEquipo
                      ? qEquipo
                      : equipoSeleccionado
                        ? `${equipoSeleccionado.codigo} · ${equipoSeleccionado.marca} ${equipoSeleccionado.modelo} (${equipoSeleccionado.area})`
                        : qEquipo
                  }
                  onFocus={() => {
                    setQEquipo('')
                    setOpenListaEquipo(true)
                  }}
                  onChange={(e) => {
                    setQEquipo(e.target.value)
                    setOpenListaEquipo(true)
                  }}
                  placeholder="Escribe ej: CAN-003, ThinkPad, Servidor, Impresora, Constructora, Pedro..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!openListaEquipo) setQEquipo('')
                    setOpenListaEquipo(!openListaEquipo)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  {openListaEquipo ? 'Cerrar ✕' : '🔎 Buscar PC'}
                </button>
              </div>
            </Field>

            {openListaEquipo && (
              <div className="mt-1 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                <div className="mb-1 flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400">
                  <span>Resultados en inventario ({equiposFiltrados.length} equipos)</span>
                  <span>Haz clic para seleccionar</span>
                </div>
                {equiposFiltrados.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No se encontraron equipos que coincidan con &ldquo;{qEquipo}&rdquo;.
                  </div>
                ) : (
                  equiposFiltrados.map((eq) => {
                    const meta = TIPO_HW_META[eq.tipo]
                    const emp = db.empresas.find((e) => e.id === eq.empresaId)
                    const usr = db.usuarios.find((u) => u.id === eq.usuarioId)
                    const isSel = eq.id === equipoId
                    return (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handlePickEquipo(eq.id)}
                        className={cx(
                          'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition',
                          isSel
                            ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-300'
                            : 'hover:bg-slate-50',
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                            <span>{meta?.icon ?? '💻'}</span>
                            <span className="font-mono text-emerald-700">{eq.codigo}</span>
                            <span>·</span>
                            <span className="truncate">
                              {eq.marca} {eq.modelo}
                            </span>
                            <Badge tone={meta?.tone ?? 'slate'}>{meta?.short ?? eq.tipo}</Badge>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-500">
                            Área: <b>{eq.area}</b> · Cliente:{' '}
                            <b>{emp ? `🏢 ${emp.razonSocial}` : usr ? `👤 ${usr.nombre}` : 'Particular'}</b> · Serie: {eq.serie}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
                          Elegir
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {equipoSeleccionado && !openListaEquipo && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs">
                <div>
                  <span className="font-extrabold text-emerald-900">
                    ✓ Equipo seleccionado: {TIPO_HW_META[equipoSeleccionado.tipo]?.icon} {equipoSeleccionado.codigo}
                  </span>{' '}
                  · {equipoSeleccionado.marca} {equipoSeleccionado.modelo} ({equipoSeleccionado.area}) · CPU: {equipoSeleccionado.cpu} · RAM: {equipoSeleccionado.ramGb}GB
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQEquipo('')
                    setOpenListaEquipo(true)
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Cambiar equipo
                </button>
              </div>
            )}
          </div>
        )}

        {tipo === 'OT' && (
          <div className="relative">
            <Field label="Seleccionar Orden de Trabajo (Escribe código de OT, título o cliente para buscar)">
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} pr-24`}
                  value={
                    openListaOt
                      ? qOt
                      : otSeleccionada
                        ? `${otSeleccionada.codigo} · ${otSeleccionada.titulo}`
                        : qOt
                  }
                  onFocus={() => {
                    setQOt('')
                    setOpenListaOt(true)
                  }}
                  onChange={(e) => {
                    setQOt(e.target.value)
                    setOpenListaOt(true)
                  }}
                  placeholder="Escribe ej: PCG-2026, Mantención, Constructora, Pedro..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!openListaOt) setQOt('')
                    setOpenListaOt(!openListaOt)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  {openListaOt ? 'Cerrar ✕' : '🔎 Buscar OT'}
                </button>
              </div>
            </Field>
            {openListaOt && (
              <div className="mt-1 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                {otsFiltradas.map((o) => {
                  const emp = db.empresas.find((e) => e.id === o.empresaId)
                  const usr = db.usuarios.find((u) => u.id === o.usuarioId)
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => handlePickOt(o.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-50"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          <span className="font-mono text-emerald-700">{o.codigo}</span> · {o.titulo}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cliente: {emp?.razonSocial ?? usr?.nombre ?? 'Particular'} · Estado: {o.estado}
                        </div>
                      </div>
                      <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">Elegir</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tipo === 'PARQUE_EMPRESA' && (
          <div className="relative">
            <Field label="Seleccionar Empresa (Escribe nombre o RUT para buscar)">
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} pr-24`}
                  value={
                    openListaEmpresa
                      ? qEmpresa
                      : empresaSeleccionada
                        ? `${empresaSeleccionada.razonSocial} (${empresaSeleccionada.rut})`
                        : qEmpresa
                  }
                  onFocus={() => {
                    setQEmpresa('')
                    setOpenListaEmpresa(true)
                  }}
                  onChange={(e) => {
                    setQEmpresa(e.target.value)
                    setOpenListaEmpresa(true)
                  }}
                  placeholder="Escribe razón social, RUT o ciudad..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!openListaEmpresa) setQEmpresa('')
                    setOpenListaEmpresa(!openListaEmpresa)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  {openListaEmpresa ? 'Cerrar ✕' : '🔎 Buscar'}
                </button>
              </div>
            </Field>
            {openListaEmpresa && (
              <div className="mt-1 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                {empresasFiltradas.map((em) => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => handlePickEmpresa(em.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900">🏢 {em.razonSocial}</div>
                      <div className="text-[11px] text-slate-500">
                        RUT {em.rut} · {em.giro} · {em.ciudad}
                      </div>
                    </div>
                    <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">Elegir</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Field label="Título del informe">
          <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </Field>
        <Field label="Resumen ejecutivo y conclusiones técnicas">
          <textarea className={inputCls} rows={3} value={resumen} onChange={(e) => setResumen(e.target.value)} required />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          Publicar en el portal del cliente
        </label>
        <div className="flex justify-end gap-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Emitir informe</Btn>
        </div>
      </form>
    </Modal>
  )
}

export function InformeDetailPage() {
  const { id } = useParams()
  const { db, mutate } = useStore()
  const sc = useScope()
  const [enviado, setEnviado] = useState(false)

  const inf = sc.informes.find((i) => i.id === Number(id))
  if (!inf) return <Empty>Informe no encontrado.</Empty>

  const eq = db.equipos.find((e) => e.id === inf.equipoId)
  const ot = db.ots.find((o) => o.id === inf.otId)
  const emp = db.empresas.find((e) => e.id === (inf.empresaId ?? eq?.empresaId ?? ot?.empresaId))
  const autor = db.usuarios.find((u) => u.id === inf.generadoPor)

  const equiposIncluidos =
    inf.tipo === 'EQUIPO' && eq
      ? [eq]
      : inf.tipo === 'OT' && ot
        ? db.equipos.filter((e) => ot.equipoIds.includes(e.id))
        : db.equipos.filter((e) => e.empresaId === inf.empresaId)

  const intervs = db.intervenciones.filter((i) =>
    equiposIncluidos.some((e) => e.id === i.equipoId),
  )

  return (
    <>
      <PageHeader
        title={`${inf.codigo} · ${inf.titulo}`}
        subtitle={`Emitido el ${fmtFecha(inf.fecha)} por ${autor?.nombre ?? 'PCG SPA'}`}
        actions={
          <>
            <Btn variant="secondary" onClick={() => window.print()}>
              Imprimir / Guardar PDF
            </Btn>
            {sc.staff && (
              <>
                <Btn
                  variant="secondary"
                  onClick={() => mutate((d) => { const x = d.informes.find((i) => i.id === inf.id)!; x.visibleCliente = !x.visibleCliente })}
                >
                  {inf.visibleCliente ? 'Ocultar al cliente' : 'Hacer visible al cliente'}
                </Btn>
                <Btn
                  onClick={() => {
                    const contacto = db.usuarios.find((u) => u.id === emp?.contactoId)
                    mutate((d) =>
                      enviarCorreo(d, {
                        tipo: 'INFORME',
                        para: contacto?.email ?? d.config.email,
                        asunto: `Informe Técnico ${inf.codigo} — ${inf.titulo}`,
                        cuerpo: `Estimados ${emp?.razonSocial ?? 'Cliente'}:\n\nSe encuentra disponible en su portal el informe técnico ${inf.codigo} (${inf.titulo}).\n\nResumen: ${inf.resumen}\n\nAtentamente,\n${d.config.razonSocial}`,
                      }),
                    )
                    setEnviado(true)
                  }}
                >
                  Enviar por correo al cliente
                </Btn>
              </>
            )}
          </>
        }
      />

      {enviado && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 print:hidden">
          ✓ Informe despachado a la bandeja de correos simulados.
        </div>
      )}

      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-4">
            <img src="/img/logo-pcg.png" alt="PCG SPA" className="h-12" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">INFORME TÉCNICO DE SERVICIO</h2>
              <p className="text-xs text-slate-500">{db.config.razonSocial} · {db.config.giro}</p>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-base font-bold text-slate-900">{inf.codigo}</div>
            <div>Fecha: {fmtFecha(inf.fecha)}</div>
            <div>Cliente: {emp?.razonSocial ?? 'Particular'}</div>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Resumen Ejecutivo</div>
          <p className="mt-1 text-sm text-slate-800">{inf.resumen}</p>
        </div>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-700">
          1. Equipos analizados ({equiposIncluidos.length})
        </h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {equiposIncluidos.map((e) => (
            <div key={e.id} className="rounded-lg border border-slate-200 p-3 text-xs">
              <div className="font-semibold text-slate-900">{e.codigo} · {e.marca} {e.modelo} ({e.area})</div>
              <div className="mt-1 text-slate-600">CPU: {e.cpu} · RAM: {e.ramGb} GB · Disipación: {e.disipacion} · GPU: {e.gpu}</div>
              <div className="mt-0.5 text-slate-500">Últ. mantención: {fmtFecha(e.ultimaMantencion)} · Próxima: {fmtFecha(e.proximaMantencion)}</div>
            </div>
          ))}
        </div>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-700">
          2. Detalle de lo realizado por equipo ({intervs.length} registro(s))
        </h3>
        <div className="mt-2 space-y-3">
          {intervs.map((i) => {
            const e = db.equipos.find((x) => x.id === i.equipoId)
            const tec = db.usuarios.find((u) => u.id === i.tecnicoId)
            return (
              <div key={i.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
                  <span><b>{e?.codigo}</b> · {i.tipo} · {i.titulo}</span>
                  <span>{fmtFecha(i.fecha)} · Ing./Téc. {tec?.nombre}</span>
                </div>
                <p className="mt-1.5 text-slate-800">{i.detalle}</p>
                {i.tempAntes !== undefined && i.tempDespues !== undefined && (
                  <div className="mt-2 text-xs font-medium text-emerald-700">
                    Resultado térmico: {i.tempAntes} °C antes → {i.tempDespues} °C después (-{i.tempAntes - i.tempDespues} °C)
                  </div>
                )}
                {i.checklist.length > 0 && (
                  <div className="mt-2 text-xs text-slate-600">
                    <b>Protocolo cumplido:</b> {i.checklist.join(' · ')}
                  </div>
                )}
                <div className="mt-1 text-xs text-slate-500">
                  Insumos: {i.insumos} · Garantía: {i.garantiaDias} días
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          Documento emitido digitalmente por {db.config.razonSocial} · Garantía técnica de {db.config.condGarantiaDias} días sobre los trabajos descritos.
        </div>
      </div>
    </>
  )
}
