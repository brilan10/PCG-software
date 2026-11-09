import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import {
  isAptoDesarrollador,
  isAptoTecnico,
  ESTADO_OT_LABEL,
} from '@/lib/types'
import { otTone } from '@/lib/tones'
import type {
  EstadoCobroProyecto,
  EstadoProyectoWeb,
  ModalidadEjecucion,
  PersonaExternaParticipante,
  ProyectoWebSoftware,
  TipoProyectoWeb,
} from '@/lib/types'
import {
  ESTADO_COBRO_META,
  ESTADO_PROYECTO_WEB_META,
  MODALIDAD_EJECUCION_META,
  TIPO_PROYECTO_WEB_META,
  recurrenteWeb,
} from '@/lib/inventarioMeta'
import { addDays, diffDays, fmtCLP, fmtFecha, nextId, today } from '@/lib/util'
import { Avatar, Badge, Btn, Card, Empty, Field, Modal, Table, cx, inputCls, td } from '@/components/kit'
import {
  AnimatedNumber,
  AnimatedPillTabs,
  BackgroundBeamsHeader,
  MovingBorderBtn,
  SpotlightCard,
  Tilt3DCard,
} from '@/components/aceternity'

export default function ProyectosPage() {
  const { db, mutate } = useStore()
  const proyectos = db.proyectosWeb ?? []
  const hoy = today()

  const [tabTipo, setTabTipo] = useState<string>('TODOS')
  const [filtroModalidad, setFiltroModalidad] = useState<'TODOS' | ModalidadEjecucion>('TODOS')
  const [filtroParticipante, setFiltroParticipante] = useState<string>('TODOS')
  const [vista, setVista] = useState<'CARDS' | 'TABLA'>('CARDS')
  const [q, setQ] = useState('')

  const [modalForm, setModalForm] = useState<{
    proyecto?: ProyectoWebSoftware
    empresaIdInicial?: number
  } | null>(null)

  const staff = useMemo(
    () => db.usuarios.filter((u) => ['ADMIN', 'DOC_PROCESS', 'WORKER'].includes(u.rol)),
    [db.usuarios],
  )

  // KPIs Financieros y Comerciales de los Proyectos Vendidos
  const kpis = useMemo(() => {
    const totalVendido = proyectos.reduce((acc, p) => acc + (p.valorProyecto || 0), 0)
    const totalCobrado = proyectos.reduce((acc, p) => acc + (p.montoCobrado ?? p.valorProyecto ?? 0), 0)
    const porCobrar = Math.max(0, totalVendido - totalCobrado)

    const conExterna = proyectos.filter(
      (p) => p.modalidadEjecucion === 'CON_EMPRESA_EXTERNA' || p.modalidadEjecucion === 'SUBCONTRATO_EXTERNO',
    ).length
    const soloPCG = proyectos.length - conExterna

    const costoExternoTotal = proyectos.reduce(
      (acc, p) => acc + (p.empresaExterna?.costoPagado || 0),
      0,
    )
    const gananciaNetaProyectos = totalVendido - costoExternoTotal

    const ingresoRecurrente = recurrenteWeb(proyectos)
    const conMantencionCount = proyectos.filter((p) => p.incluyeMantencionWeb).length

    return {
      totalVendido,
      totalCobrado,
      porCobrar,
      soloPCG,
      conExterna,
      costoExternoTotal,
      gananciaNetaProyectos,
      ingresoRecurrente,
      conMantencionCount,
      totalProyectos: proyectos.length,
    }
  }, [proyectos])

  // Colaboradores y Personas Externas únicas registradas en los proyectos
  const personasExternasUnicas = useMemo(() => {
    const map = new Map<string, PersonaExternaParticipante>()
    proyectos.forEach((p) => {
      const list = p.personasExternas ?? p.empresaExterna?.personasParticipantes ?? []
      list.forEach((pe) => {
        if (pe.nombre?.trim()) {
          map.set(pe.nombre.trim().toLowerCase(), pe)
        }
      })
    })
    return Array.from(map.values())
  }, [proyectos])

  // Filtrado de Proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      if (tabTipo !== 'TODOS' && p.tipo !== tabTipo) return false
      if (filtroModalidad !== 'TODOS' && (p.modalidadEjecucion ?? 'SOLO_PCG') !== filtroModalidad) return false
      if (filtroParticipante !== 'TODOS') {
        if (filtroParticipante.startsWith('EXT:')) {
          const nom = filtroParticipante.replace('EXT:', '').toLowerCase().trim()
          const list = p.personasExternas ?? p.empresaExterna?.personasParticipantes ?? []
          if (!list.some((pe) => pe.nombre.toLowerCase().trim() === nom)) return false
        } else {
          const idNum = Number(filtroParticipante)
          const part = p.participantesIds ?? [p.responsableId]
          if (!part.includes(idNum)) return false
        }
      }
      if (q.trim()) {
        const term = q.toLowerCase()
        const emp = p.empresaId ? db.empresas.find((e) => e.id === p.empresaId) : undefined
        const ext = p.empresaExterna?.nombre ?? ''
        const persExt = (p.personasExternas ?? p.empresaExterna?.personasParticipantes ?? [])
          .map((pe) => `${pe.nombre} ${pe.rolOParte} ${pe.empresa ?? ''}`)
          .join(' ')
        const hay = `${p.codigo} ${p.clienteNombre} ${p.nombreProyecto} ${p.descripcion ?? ''} ${p.urlDominio ?? ''} ${p.stackTecnologico ?? ''} ${ext} ${persExt} ${emp?.razonSocial ?? ''} ${emp?.rut ?? ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [proyectos, tabTipo, filtroModalidad, filtroParticipante, q, db.empresas])

  return (
    <div className="space-y-6">
      {/* =====================================================================
          HEADER ANIMADO CON ACETERNITY BEAMS
         ===================================================================== */}
      <BackgroundBeamsHeader
        badge="🚀 PROYECTOS VENDIDOS, DESARROLLOS WEB, SOFTWARE & INFRAESTRUCTURA"
        title="Proyectos Realizados y Portafolio Comercial de PCG SPA"
        subtitle="Registro de proyectos vendidos a empresas y clientes: montos de venta, participación de tu equipo (Brilan, Javier, Johan, Yovylin), alianzas con empresas externas y cobros de mantención web."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MovingBorderBtn onClick={() => setModalForm({})}>
              🚀 + Registrar Proyecto Vendido
            </MovingBorderBtn>
            <Link to="/app/empresas">
              <Btn variant="secondary">🏢 Cartera Clientes</Btn>
            </Link>
            <Link to="/app/finanzas">
              <Btn variant="secondary">💰 Ver en Finanzas</Btn>
            </Link>
          </div>
        }
      />

      {/* =====================================================================
          KPIs SPOTLIGHT CARDS
         ===================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.22)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-emerald-700 uppercase">
              💰 Total Vendido en Proyectos
            </span>
            <Badge tone="green">{kpis.totalProyectos} proyectos</Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.totalVendido} formatCLP />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Cobrado: <strong className="text-emerald-700">{fmtCLP(kpis.totalCobrado)}</strong></span>
            {kpis.porCobrar > 0 && (
              <span className="font-semibold text-amber-700">Pendiente: {fmtCLP(kpis.porCobrar)}</span>
            )}
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(14, 165, 233, 0.2)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-sky-700 uppercase">
              ⚡ Ejecución del Equipo PCG
            </span>
            <Badge tone="blue">{kpis.soloPCG} solo PCG</Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.soloPCG} suffix=" proyectos 100% PCG" />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {kpis.conExterna > 0 ? (
              <span>🤝 {kpis.conExterna} en alianza o subcontratados con empresas externas</span>
            ) : (
              <span>Todos los proyectos ejecutados con staff propio</span>
            )}
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.2)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-violet-700 uppercase">
              🤝 Alianzas y Empresas Externas
            </span>
            <Badge tone={kpis.conExterna > 0 ? 'violet' : 'slate'}>
              {kpis.conExterna} con externa
            </Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.costoExternoTotal} formatCLP />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Costo pagado a partners externos · Ganancia PCG:{' '}
            <strong className="text-emerald-700">{fmtCLP(kpis.gananciaNetaProyectos)}</strong>
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-amber-700 uppercase">
              🔄 Mantenciones Web Recurrentes
            </span>
            <Badge tone="amber">{kpis.conMantencionCount} activas</Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.ingresoRecurrente} formatCLP suffix=" / ciclo" />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Ingreso recurrente por actualización web, hosting, backups y soporte
          </div>
        </SpotlightCard>
      </div>

      {/* =====================================================================
          TABS & FILTROS DE ANÁLISIS
         ===================================================================== */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AnimatedPillTabs
            layoutId="proyectos-nav-tabs"
            active={tabTipo}
            onChange={setTabTipo}
            tabs={[
              { id: 'TODOS', label: '🚀 Todos los Proyectos', badge: proyectos.length },
              {
                id: 'PAGINA_WEB_CORPORATIVA',
                label: '🌐 Páginas Web',
                badge: proyectos.filter((p) => p.tipo === 'PAGINA_WEB_CORPORATIVA').length,
              },
              {
                id: 'TIENDA_ECOMMERCE',
                label: '🛒 E-Commerce',
                badge: proyectos.filter((p) => p.tipo === 'TIENDA_ECOMMERCE').length,
              },
              {
                id: 'SOFTWARE_A_MEDIDA',
                label: '💻 Software a Medida',
                badge: proyectos.filter((p) => p.tipo === 'SOFTWARE_A_MEDIDA').length,
              },
              {
                id: 'INFRAESTRUCTURA_REDES',
                label: '📡 Infraestructura TI',
                badge: proyectos.filter((p) => p.tipo === 'INFRAESTRUCTURA_REDES').length,
              },
              {
                id: 'LANDING_PAGE',
                label: '🚀 Landings',
                badge: proyectos.filter((p) => p.tipo === 'LANDING_PAGE').length,
              },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              className={cx(inputCls, 'w-auto py-1.5 text-xs font-semibold')}
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value as typeof filtroModalidad)}
            >
              <option value="TODOS">🏢 Modalidad: Todas</option>
              <option value="SOLO_PCG">⚡ Solo PCG SPA (100% interno)</option>
              <option value="CON_EMPRESA_EXTERNA">🤝 Alianza con Empresa Externa</option>
              <option value="SUBCONTRATO_EXTERNO">💼 Con Subcontratación Externa</option>
            </select>

            <select
              className={cx(inputCls, 'w-auto py-1.5 text-xs font-semibold')}
              value={filtroParticipante}
              onChange={(e) => setFiltroParticipante(e.target.value)}
            >
              <option value="TODOS">👤 Quién participó: Todos</option>
              <optgroup label="Equipo PCG SPA">
                {staff.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.nombre} ({u.cargo ?? u.rolEtiqueta})
                  </option>
                ))}
              </optgroup>
              {personasExternasUnicas.length > 0 && (
                <optgroup label="Colaboradores y Personas Externas">
                  {personasExternasUnicas.map((pe) => (
                    <option key={pe.nombre} value={`EXT:${pe.nombre.trim().toLowerCase()}`}>
                      🏢 {pe.nombre} ({pe.rolOParte}{pe.empresa ? ` · ${pe.empresa}` : ''})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <input
              className={cx(inputCls, 'w-60 py-1.5 text-xs')}
              placeholder="Buscar proyecto, empresa, stack, externa..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setVista('CARDS')}
                className={cx(
                  'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                  vista === 'CARDS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900',
                )}
                title="Vista Portafolio 3D"
              >
                ▦ Portafolio
              </button>
              <button
                type="button"
                onClick={() => setVista('TABLA')}
                className={cx(
                  'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                  vista === 'TABLA' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900',
                )}
                title="Vista Tabla Detallada"
              >
                ≡ Tabla
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* =====================================================================
          CONTENIDO: VISTA PORTAFOLIO 3D CARDS O TABLA DETALLADA
         ===================================================================== */}
      {proyectosFiltrados.length === 0 ? (
        <Empty>
          No se encontraron proyectos con los filtros seleccionados. Usa el botón superior para registrar uno nuevo.
        </Empty>
      ) : vista === 'CARDS' ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {proyectosFiltrados.map((p) => {
            const tMeta = TIPO_PROYECTO_WEB_META[p.tipo]
            const eMeta = ESTADO_PROYECTO_WEB_META[p.estado]
            const cobroMeta = ESTADO_COBRO_META[p.estadoCobro ?? 'PAGADO']
            const modMeta = MODALIDAD_EJECUCION_META[p.modalidadEjecucion ?? 'SOLO_PCG']

            const participantes = (p.participantesIds ?? [p.responsableId])
              .map((id) => db.usuarios.find((u) => u.id === id))
              .filter(Boolean)

            const diasMant = p.proximaMantencionWeb ? diffDays(p.proximaMantencionWeb, hoy) : null
            const emp = p.empresaId ? db.empresas.find((e) => e.id === p.empresaId) : undefined

            return (
              <Tilt3DCard
                key={p.id}
                spotlightColor="rgba(16, 185, 129, 0.18)"
                className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-emerald-50/25 p-5 shadow-sm transition hover:shadow-xl"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Código, Tipo de Proyecto y Estado */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-700">{p.codigo}</span>
                        <Badge tone={tMeta.tone}>
                          {tMeta.icon} {tMeta.short}
                        </Badge>
                      </div>
                      <h3 className="mt-1 text-base font-extrabold text-slate-900">{p.nombreProyecto}</h3>
                    </div>
                    <Badge tone={eMeta.tone}>{eMeta.label}</Badge>
                  </div>

                  {/* Cliente / Empresa con enlace a Cartera */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Empresa / Cliente Comprador
                      </div>
                      <div className="truncate font-extrabold text-slate-900">{p.clienteNombre}</div>
                      {emp && (
                        <div className="truncate font-mono text-xs text-slate-500">
                          RUT: {emp.rut} · {emp.ciudad}
                        </div>
                      )}
                    </div>
                    {p.empresaId ? (
                      <Link
                        to="/app/empresas"
                        className="rounded-xl border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                      >
                        Ver Cartera →
                      </Link>
                    ) : (
                      <span className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Particular
                      </span>
                    )}
                  </div>

                  {/* Monto de Venta y Cobro */}
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">Monto de Venta</div>
                      <div className="text-lg font-black text-slate-900">{fmtCLP(p.valorProyecto)}</div>
                      <div className="mt-0.5">
                        <Badge tone={cobroMeta.tone}>{cobroMeta.label}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">
                        {p.incluyeMantencionWeb ? `Mantención (${p.planMantencion ?? 'MES'})` : 'Mantención'}
                      </div>
                      <div className="text-lg font-black text-emerald-700">
                        {p.incluyeMantencionWeb ? `${fmtCLP(p.valorMantencion)}` : 'Sin mantención'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {p.fechaInicio ? `Inicio: ${fmtFecha(p.fechaInicio)}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Quiénes participaron del equipo PCG SPA */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>👥 Quiénes participaron (Equipo PCG):</span>
                      <span className="text-slate-400">{participantes.length} miembro(s)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {participantes.map((u) => u && (
                        <div
                          key={u.id}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs"
                        >
                          <Avatar name={u.nombre} color={u.color} size={20} />
                          <div>
                            <span className="font-extrabold text-slate-800">{u.nombre.split(' ')[0]}</span>
                            <span className="ml-1 text-[10px] text-slate-500">
                              ({u.id === 1 ? 'Tech Lead' : u.id === 4 ? 'UI/Diseño' : u.id === 3 ? 'Seguridad/Redes' : 'Procesos'})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Colaboradores o personas externas que trabajaron */}
                    {((p.personasExternas && p.personasExternas.length > 0) || (p.empresaExterna?.personasParticipantes && p.empresaExterna.personasParticipantes.length > 0)) && (
                      <div className="mt-2.5 rounded-xl border border-sky-200 bg-sky-50/70 p-2.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-sky-950 uppercase">
                          <span>🏢 Colaboradores Externos que trabajaron:</span>
                          <span className="text-sky-700 font-bold">{(p.personasExternas ?? p.empresaExterna?.personasParticipantes)?.length} persona(s)</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(p.personasExternas ?? p.empresaExterna?.personasParticipantes ?? []).map((pe, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs shadow-2xs"
                            >
                              <span>👤</span>
                              <div>
                                <span className="font-extrabold text-slate-900">{pe.nombre}</span>
                                <span className="text-[10px] text-slate-500"> · {pe.rolOParte}</span>
                                {pe.empresa && (
                                  <span className="ml-1 text-[10px] font-semibold text-sky-700">({pe.empresa})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modalidad de Ejecución: ¿Solo PCG o participó empresa externa? */}
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                        Modalidad de Ejecución
                      </div>
                      <Badge tone={modMeta.tone}>
                        {modMeta.icon} {modMeta.short}
                      </Badge>
                    </div>

                    {p.modalidadEjecucion !== 'SOLO_PCG' && p.empresaExterna ? (
                      <div className="mt-2 space-y-1.5 rounded-xl bg-white p-2.5 text-xs ring-1 ring-slate-200">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>🏢 {p.empresaExterna.nombre}</span>
                          {p.empresaExterna.costoPagado && (
                            <span className="text-rose-600">Costo: {fmtCLP(p.empresaExterna.costoPagado)}</span>
                          )}
                        </div>
                        <div className="text-slate-600">
                          <span className="font-semibold text-slate-700">Parte realizada:</span>{' '}
                          {p.empresaExterna.rolOParte}
                        </div>
                        {p.empresaExterna.rut && (
                          <div className="font-mono text-[11px] text-slate-400">RUT Externa: {p.empresaExterna.rut}</div>
                        )}
                        {(p.empresaExterna.personasParticipantes ?? p.personasExternas) && (p.empresaExterna.personasParticipantes ?? p.personasExternas)!.length > 0 && (
                          <div className="mt-2 border-t border-slate-100 pt-1.5">
                            <div className="text-[10px] font-extrabold text-slate-600 uppercase">
                              Personas de la empresa externa que trabajaron:
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(p.empresaExterna.personasParticipantes ?? p.personasExternas)!.map((pe, idx) => (
                                <span key={idx} className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200">
                                  👤 {pe.nombre} ({pe.rolOParte})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs font-semibold text-emerald-800">
                        ⚡ 100% desarrollado y ejecutado por el equipo interno de PCG SPA.
                      </div>
                    )}
                  </div>

                  {/* Dominio / URL y Stack Tecnológico (si aplica) */}
                  {p.urlDominio && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-white">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-xs font-bold text-sky-300">{p.urlDominio}</div>
                        <div className="truncate text-[10px] text-slate-400">
                          {p.stackTecnologico ?? 'Web / Software'} · {p.hostingProveedor ?? 'Cloud'}
                        </div>
                      </div>
                      <a
                        href={p.urlDominio.startsWith('http') ? p.urlDominio : `https://${p.urlDominio}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-slate-200 hover:bg-white/20"
                      >
                        Abrir ↗
                      </a>
                    </div>
                  )}

                  {/* Órdenes de Trabajo (OT) y Planificador del Proyecto */}
                  {(() => {
                    const otsVinculadas = (db.ots ?? []).filter((o) => o.proyectoId === p.id)
                    return (
                      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                            <span>📋</span>
                            <span>Órdenes de Trabajo ({otsVinculadas.length})</span>
                          </div>
                          <Link
                            to={`/app/ots?nueva=1&proyectoId=${p.id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700"
                          >
                            + Planificar OT
                          </Link>
                        </div>

                        {otsVinculadas.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-2.5 text-center text-xs text-slate-500">
                            Sin OT asociada. Haz clic en <span className="font-bold text-emerald-700">+ Planificar OT</span> para crear fases de desarrollo.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {otsVinculadas.map((ot) => {
                              const tareas = (db.tareas ?? []).filter((t) => t.otId === ot.id)
                              const hechas = tareas.filter((t) => t.estado === 'HECHA').length
                              const pct = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : (ot.estado === 'ENTREGADO' ? 100 : 0)
                              const tec = db.usuarios.find((u) => u.id === ot.tecnicoId)

                              return (
                                <div key={ot.id} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="font-mono text-xs font-black text-indigo-700">{ot.codigo}</span>
                                    <div className="flex items-center gap-1">
                                      <Badge tone={otTone[ot.estado]}>{ESTADO_OT_LABEL[ot.estado]}</Badge>
                                      <Link
                                        to={`/app/ots?ot=${ot.id}`}
                                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                                      >
                                        Ver OT →
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs font-semibold text-slate-900 truncate">{ot.titulo}</div>
                                  {tareas.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500">Avance de fases</span>
                                        <span className="font-extrabold text-emerald-700">{hechas}/{tareas.length} ({pct}%)</span>
                                      </div>
                                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300" style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  )}
                                  {tec && (
                                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600">
                                      <span>Responsable:</span>
                                      <span className="font-semibold text-slate-800">{tec.nombre}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Próxima Mantención Web (si tiene) */}
                  {p.incluyeMantencionWeb && p.proximaMantencionWeb && (
                    <div className="flex items-center justify-between text-xs">
                      <Badge tone={diasMant !== null && diasMant <= 7 ? 'amber' : 'green'}>
                        🔧 Próx. Mantención Web: {fmtFecha(p.proximaMantencionWeb)}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          mutate((d) => {
                            const target = d.proyectosWeb?.find((x) => x.id === p.id)
                            if (!target) return
                            const stepDays =
                              target.planMantencion === 'MENSUAL'
                                ? 30
                                : target.planMantencion === 'TRIMESTRAL'
                                  ? 90
                                  : target.planMantencion === 'SEMESTRAL'
                                    ? 180
                                    : 365
                            target.proximaMantencionWeb = addDays(today(), stepDays)
                            target.estado = 'MANTENCION_ACTIVA'
                          })
                        }}
                        className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                        title="Marcar ciclo realizado"
                      >
                        ✓ Ciclo Realizado
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Acciones */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalForm({ proyecto: p })}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                    >
                      ✎ Editar Proyecto
                    </button>
                    <Link
                      to="/app/finanzas"
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      $ Factura / Cobro
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`¿Eliminar el proyecto "${p.nombreProyecto}" de ${p.clienteNombre}?`)) return
                      mutate((d) => {
                        d.proyectosWeb = (d.proyectosWeb ?? []).filter((x) => x.id !== p.id)
                      })
                    }}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </Tilt3DCard>
            )
          })}
        </div>
      ) : (
        /* =====================================================================
           VISTA TABLA DETALLADA
           ===================================================================== */
        <Table
          head={[
            'Código / Tipo',
            'Proyecto y Descripción',
            'Empresa / Cliente Comprador',
            'Monto Vendido & Cobro',
            'Participaron (PCG SPA)',
            'Modalidad (¿PCG o Externa?)',
            'OTs & Planner',
            'Mantención Web',
            'Acciones',
          ]}
        >
          {proyectosFiltrados.map((p) => {
            const tMeta = TIPO_PROYECTO_WEB_META[p.tipo]
            const eMeta = ESTADO_PROYECTO_WEB_META[p.estado]
            const cobroMeta = ESTADO_COBRO_META[p.estadoCobro ?? 'PAGADO']
            const modMeta = MODALIDAD_EJECUCION_META[p.modalidadEjecucion ?? 'SOLO_PCG']
            const emp = p.empresaId ? db.empresas.find((e) => e.id === p.empresaId) : undefined
            const participantes = (p.participantesIds ?? [p.responsableId])
              .map((id) => db.usuarios.find((u) => u.id === id))
              .filter(Boolean)

            return (
              <tr key={p.id} className="hover:bg-slate-50/70">
                <td className={td}>
                  <div className="font-mono text-xs font-extrabold text-emerald-700">{p.codigo}</div>
                  <div className="mt-1">
                    <Badge tone={tMeta.tone}>
                      {tMeta.icon} {tMeta.short}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <Badge tone={eMeta.tone}>{eMeta.label}</Badge>
                  </div>
                </td>

                <td className={td}>
                  <div className="font-extrabold text-slate-900">{p.nombreProyecto}</div>
                  {p.descripcion && <div className="max-w-xs text-xs text-slate-500">{p.descripcion}</div>}
                  {p.urlDominio && (
                    <div className="mt-1 font-mono text-[11px] text-sky-700">{p.urlDominio}</div>
                  )}
                </td>

                <td className={td}>
                  <div className="font-bold text-slate-900">{p.clienteNombre}</div>
                  {emp ? (
                    <div className="font-mono text-xs text-slate-500">RUT: {emp.rut}</div>
                  ) : (
                    <div className="text-xs text-slate-400">Cliente Particular</div>
                  )}
                </td>

                <td className={td}>
                  <div className="text-sm font-black text-slate-900">{fmtCLP(p.valorProyecto)}</div>
                  <div className="mt-1">
                    <Badge tone={cobroMeta.tone}>{cobroMeta.label}</Badge>
                  </div>
                  {p.montoCobrado && p.montoCobrado < p.valorProyecto && (
                    <div className="mt-0.5 text-[11px] text-amber-700">
                      Cobrado: {fmtCLP(p.montoCobrado)}
                    </div>
                  )}
                </td>

                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {participantes.map((u) => u && (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800"
                        title={`${u.nombre} (${u.cargo ?? u.rol})`}
                      >
                        <Avatar name={u.nombre} color={u.color} size={16} />
                        {u.nombre.split(' ')[0]}
                      </span>
                    ))}
                    {(p.personasExternas ?? p.empresaExterna?.personasParticipantes ?? []).map((pe, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 ring-1 ring-sky-200"
                        title={`Colaborador externo: ${pe.nombre} (${pe.rolOParte}${pe.empresa ? ` · ${pe.empresa}` : ''})`}
                      >
                        <span>🏢</span>
                        {pe.nombre.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </td>

                <td className={td}>
                  <Badge tone={modMeta.tone}>
                    {modMeta.icon} {modMeta.short}
                  </Badge>
                  {p.empresaExterna && (
                    <div className="mt-1 text-xs">
                      <strong className="text-slate-800">{p.empresaExterna.nombre}</strong>
                      <div className="text-[11px] text-slate-500">{p.empresaExterna.rolOParte}</div>
                      {(p.empresaExterna.personasParticipantes ?? p.personasExternas) && (p.empresaExterna.personasParticipantes ?? p.personasExternas)!.length > 0 && (
                        <div className="mt-0.5 text-[10px] text-sky-700">
                          👥 {(p.empresaExterna.personasParticipantes ?? p.personasExternas)!.map((x) => x.nombre).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </td>

                <td className={td}>
                  {(() => {
                    const otsVinculadas = (db.ots ?? []).filter((o) => o.proyectoId === p.id)
                    return (
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-slate-700">OTs ({otsVinculadas.length})</span>
                          <Link
                            to={`/app/ots?nueva=1&proyectoId=${p.id}`}
                            className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                          >
                            + OT
                          </Link>
                        </div>
                        {otsVinculadas.map((ot) => {
                          const tareas = (db.tareas ?? []).filter((t) => t.otId === ot.id)
                          const hechas = tareas.filter((t) => t.estado === 'HECHA').length
                          const pct = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : (ot.estado === 'ENTREGADO' ? 100 : 0)

                          return (
                            <div key={ot.id} className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs shadow-2xs">
                              <div className="flex items-center justify-between gap-1">
                                <Link to={`/app/ots?ot=${ot.id}`} className="font-mono text-[11px] font-bold text-indigo-700 hover:underline">
                                  {ot.codigo}
                                </Link>
                                <Badge tone={otTone[ot.estado]}>{ESTADO_OT_LABEL[ot.estado]}</Badge>
                              </div>
                              {tareas.length > 0 && (
                                <div className="mt-1">
                                  <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>{hechas}/{tareas.length}</span>
                                    <span className="font-bold text-emerald-700">{pct}%</span>
                                  </div>
                                  <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </td>

                <td className={td}>
                  {p.incluyeMantencionWeb ? (
                    <div>
                      <div className="font-extrabold text-emerald-700">
                        {fmtCLP(p.valorMantencion)} / {p.planMantencion ?? 'MES'}
                      </div>
                      {p.proximaMantencionWeb && (
                        <div className="text-[11px] text-slate-500">
                          Próx: {fmtFecha(p.proximaMantencionWeb)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">— Sin mantención</span>
                  )}
                </td>

                <td className={`${td} text-right`}>
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setModalForm({ proyecto: p })}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`¿Eliminar "${p.nombreProyecto}"?`)) return
                        mutate((d) => {
                          d.proyectosWeb = (d.proyectosWeb ?? []).filter((x) => x.id !== p.id)
                        })
                      }}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      )}

      {/* =====================================================================
          MODAL DE REGISTRO / EDICIÓN DE PROYECTO VENDIDO
         ===================================================================== */}
      {modalForm && (
        <ModalProyectoCompleto
          proyecto={modalForm.proyecto}
          empresaIdInicial={modalForm.empresaIdInicial}
          onClose={() => setModalForm(null)}
        />
      )}
    </div>
  )
}

/* ============================================================================
   MODAL COMPLETO: REGISTRAR PROYECTO VENDIDO CON PARTICIPANTES Y EXTERNA
   ============================================================================ */
function ModalProyectoCompleto({
  proyecto,
  empresaIdInicial,
  onClose,
}: {
  proyecto?: ProyectoWebSoftware
  empresaIdInicial?: number
  onClose: () => void
}) {
  const { db, mutate } = useStore()
  const isEdit = !!proyecto
  const staff = db.usuarios.filter((u) => ['ADMIN', 'DOC_PROCESS', 'WORKER'].includes(u.rol))

  const empInicial = empresaIdInicial
    ? db.empresas.find((e) => e.id === empresaIdInicial)
    : undefined

  const [empresaId, setEmpresaId] = useState<string>(
    proyecto?.empresaId
      ? String(proyecto.empresaId)
      : empresaIdInicial
        ? String(empresaIdInicial)
        : '',
  )
  const [clienteNombre, setClienteNombre] = useState(
    proyecto?.clienteNombre ?? empInicial?.razonSocial ?? '',
  )
  const [tipo, setTipo] = useState<TipoProyectoWeb>(
    proyecto?.tipo ?? 'PAGINA_WEB_CORPORATIVA',
  )
  const [nombreProyecto, setNombreProyecto] = useState(
    proyecto?.nombreProyecto ?? 'Sitio Web Corporativo + Portal Comercial',
  )
  const [descripcion, setDescripcion] = useState(
    proyecto?.descripcion ?? '',
  )
  const [urlDominio, setUrlDominio] = useState(
    proyecto?.urlDominio ?? 'https://www.cliente.cl',
  )
  const [stackTecnologico, setStackTecnologico] = useState(
    proyecto?.stackTecnologico ?? 'React + Next.js + Tailwind + SSL',
  )
  const [hostingProveedor, setHostingProveedor] = useState(
    proyecto?.hostingProveedor ?? 'VPS Cloud PCG / NIC Chile (.cl)',
  )

  // Montos y Cobro
  const [valorProyecto, setValorProyecto] = useState(proyecto?.valorProyecto ?? 320000)
  const [montoCobrado, setMontoCobrado] = useState(
    proyecto?.montoCobrado ?? proyecto?.valorProyecto ?? 320000,
  )
  const [estadoCobro, setEstadoCobro] = useState<EstadoCobroProyecto>(
    proyecto?.estadoCobro ?? 'PAGADO',
  )

  // Participantes del Equipo PCG SPA
  const [participantesIds, setParticipantesIds] = useState<number[]>(
    proyecto?.participantesIds ?? [1, 4], // Por defecto Brilan y Javier
  )
  const [responsableId, setResponsableId] = useState<string>(
    String(proyecto?.responsableId ?? 1),
  )

  // Modalidad: ¿Solo PCG o Empresa Externa?
  const [modalidadEjecucion, setModalidadEjecucion] = useState<ModalidadEjecucion>(
    proyecto?.modalidadEjecucion ?? 'SOLO_PCG',
  )
  const [externaNombre, setExternaNombre] = useState(
    proyecto?.empresaExterna?.nombre ?? '',
  )
  const [externaRut, setExternaRut] = useState(
    proyecto?.empresaExterna?.rut ?? '',
  )
  const [externaRol, setExternaRol] = useState(
    proyecto?.empresaExterna?.rolOParte ?? '',
  )
  const [externaCosto, setExternaCosto] = useState(
    proyecto?.empresaExterna?.costoPagado ?? 0,
  )

  // Colaboradores y personas externas (aunque no sean trabajadores de PCG)
  const [personasExternas, setPersonasExternas] = useState<PersonaExternaParticipante[]>(() => {
    if (proyecto?.personasExternas && proyecto.personasExternas.length > 0) {
      return proyecto.personasExternas
    }
    if (proyecto?.empresaExterna?.personasParticipantes && proyecto.empresaExterna.personasParticipantes.length > 0) {
      return proyecto.empresaExterna.personasParticipantes
    }
    return []
  })

  const handleAddPersonaExterna = (empresaDefecto?: string) => {
    setPersonasExternas((prev) => [
      ...prev,
      {
        nombre: '',
        rolOParte: '',
        empresa: empresaDefecto || (modalidadEjecucion !== 'SOLO_PCG' ? externaNombre.trim() : '') || '',
        contacto: '',
      },
    ])
  }

  const handleUpdatePersonaExterna = (idx: number, patch: Partial<PersonaExternaParticipante>) => {
    setPersonasExternas((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    )
  }

  const handleRemovePersonaExterna = (idx: number) => {
    setPersonasExternas((prev) => prev.filter((_, i) => i !== idx))
  }

  // Mantención Web
  const [incluyeMantencionWeb, setIncluyeMantencionWeb] = useState(
    proyecto?.incluyeMantencionWeb ?? true,
  )
  const [planMantencion, setPlanMantencion] = useState<'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'>(
    proyecto?.planMantencion ?? 'MENSUAL',
  )
  const [valorMantencion, setValorMantencion] = useState(
    proyecto?.valorMantencion ?? 35000,
  )
  const [fechaInicio, setFechaInicio] = useState(proyecto?.fechaInicio ?? today())
  const [fechaEntrega, setFechaEntrega] = useState(proyecto?.fechaEntrega ?? addDays(today(), 15))
  const [proximaMantencionWeb, setProximaMantencionWeb] = useState(
    proyecto?.proximaMantencionWeb ?? addDays(today(), 30),
  )
  const [vencimientoDominioHosting, setVencimientoDominioHosting] = useState(
    proyecto?.vencimientoDominioHosting ?? addDays(today(), 365),
  )
  const [estado, setEstado] = useState<EstadoProyectoWeb>(
    proyecto?.estado ?? 'PRODUCCION_ACTIVO',
  )
  const [notas, setNotas] = useState(proyecto?.notas ?? '')
  const [registrarEnFinanzas, setRegistrarEnFinanzas] = useState(!isEdit)

  const handleToggleParticipante = (id: number) => {
    setParticipantesIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSelectEmpresa = (idStr: string) => {
    setEmpresaId(idStr)
    const em = db.empresas.find((x) => String(x.id) === idStr)
    if (em) {
      setClienteNombre(em.razonSocial)
      if (!isEdit) {
        const slug = em.razonSocial
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 16)
        setUrlDominio(`https://www.${slug}.cl`)
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        isEdit
          ? `✎ Editar Proyecto Vendido: ${proyecto.nombreProyecto}`
          : '🚀 Registrar Proyecto Vendido (Página Web, Software, Infraestructura)'
      }
      wide
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          mutate((d) => {
            if (!d.proyectosWeb) d.proyectosWeb = []
            const emp = empresaId ? d.empresas.find((x) => String(x.id) === empresaId) : undefined
            const payload: ProyectoWebSoftware = {
              id: proyecto?.id ?? nextId(d.proyectosWeb),
              codigo:
                proyecto?.codigo ??
                `${tipo === 'SOFTWARE_A_MEDIDA' ? 'SOFT' : tipo === 'INFRAESTRUCTURA_REDES' ? 'INFRA' : 'WEB'}-2026-${String(d.proyectosWeb.length + 1).padStart(3, '0')}`,
              empresaId: emp?.id,
              usuarioId: emp?.contactoId,
              clienteNombre: clienteNombre.trim() || emp?.razonSocial || 'Cliente',
              tipo,
              nombreProyecto: nombreProyecto.trim(),
              descripcion: descripcion.trim() || undefined,
              urlDominio: urlDominio.trim() || undefined,
              stackTecnologico: stackTecnologico.trim() || undefined,
              hostingProveedor: hostingProveedor.trim() || undefined,
              valorProyecto: Number(valorProyecto) || 0,
              montoCobrado: Number(montoCobrado) || 0,
              estadoCobro,
              incluyeMantencionWeb,
              planMantencion: incluyeMantencionWeb ? planMantencion : undefined,
              valorMantencion: incluyeMantencionWeb ? Number(valorMantencion) || 0 : 0,
              fechaInicio,
              fechaEntrega,
              proximaMantencionWeb: incluyeMantencionWeb ? proximaMantencionWeb : undefined,
              vencimientoDominioHosting,
              estado,
              responsableId: Number(responsableId) || 1,
              participantesIds: participantesIds.length > 0 ? participantesIds : [Number(responsableId) || 1],
              personasExternas: personasExternas.filter((pe) => pe.nombre.trim()).length > 0
                ? personasExternas.filter((pe) => pe.nombre.trim())
                : undefined,
              modalidadEjecucion,
              empresaExterna:
                modalidadEjecucion !== 'SOLO_PCG' && externaNombre.trim()
                  ? {
                      nombre: externaNombre.trim(),
                      rut: externaRut.trim() || undefined,
                      rolOParte: externaRol.trim() || 'Servicios externos especializados',
                      costoPagado: Number(externaCosto) || 0,
                      personasParticipantes: personasExternas.filter((pe) => pe.nombre.trim()).length > 0
                        ? personasExternas.filter((pe) => pe.nombre.trim())
                        : undefined,
                    }
                  : undefined,
              notas: notas.trim() || undefined,
            }

            if (isEdit) {
              const idx = d.proyectosWeb.findIndex((x) => x.id === proyecto.id)
              if (idx >= 0) d.proyectosWeb[idx] = payload
            } else {
              d.proyectosWeb.unshift(payload)
              if (registrarEnFinanzas && payload.montoCobrado && payload.montoCobrado > 0) {
                d.movimientos.push({
                  id: nextId(d.movimientos),
                  fecha: fechaInicio,
                  tipo: 'INGRESO',
                  rubro: 'INGRESO_OT',
                  categoria: 'Desarrollo Web & Proyectos',
                  concepto: `Cobro Venta Proyecto (${payload.codigo}): ${payload.nombreProyecto} — ${payload.clienteNombre}`,
                  contraparte: payload.clienteNombre,
                  monto: payload.montoCobrado,
                  metodo: 'TRANSFERENCIA',
                  conciliadoBanco: true,
                })
              }
            }
          })
          onClose()
        }}
      >
        {/* =====================================================================
            SECCIÓN 1: CLIENTE Y DATOS GENERALES DEL PROYECTO
           ===================================================================== */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Seleccionar Empresa de Cartera (opcional)">
            <select
              className={inputCls}
              value={empresaId}
              onChange={(e) => handleSelectEmpresa(e.target.value)}
            >
              <option value="">— Cliente Particular / Otro —</option>
              {db.empresas.map((em) => (
                <option key={em.id} value={String(em.id)}>
                  {em.razonSocial} ({em.rut})
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Razón Social / Nombre del Cliente">
              <input
                className={inputCls}
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej: Constructora Andes SpA o Particular"
                required
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tipo de Proyecto">
            <select
              className={inputCls}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoProyectoWeb)}
            >
              <option value="PAGINA_WEB_CORPORATIVA">🌐 Página Web Corporativa + SEO</option>
              <option value="TIENDA_ECOMMERCE">🛒 Tienda E-Commerce / Catálogo Online</option>
              <option value="SOFTWARE_A_MEDIDA">💻 Software / Sistema Web a Medida</option>
              <option value="INFRAESTRUCTURA_REDES">📡 Infraestructura TI / Servidores / Redes</option>
              <option value="LANDING_PAGE">🚀 Landing Page Comercial</option>
              <option value="APP_MOVIL">📱 Aplicación Móvil (iOS / Android)</option>
              <option value="CONSULTORIA_SISTEMAS">📑 Consultoría y Auditoría de Sistemas</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nombre del Proyecto Vendido">
              <input
                className={inputCls}
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                placeholder="Ej: Sitio Web Corporativo + Portal de Obras y Licitaciones"
                required
              />
            </Field>
          </div>
        </div>

        <Field label="Descripción de los entregables y alcance acordado">
          <input
            className={inputCls}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Desarrollo full-stack responsive, catálogo de proyectos, integración con correos y pasarela de pago"
          />
        </Field>

        {/* =====================================================================
            SECCIÓN 2: MONTO EN EL CUAL SE VENDIÓ Y ESTADO DE COBRO
           ===================================================================== */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="text-xs font-extrabold tracking-wider text-emerald-950 uppercase">
            💰 Valor de Venta y Estado Financiero del Proyecto
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Monto en que se Vendió ($ CLP)">
              <input
                type="number"
                min={1}
                className={cx(inputCls, 'font-bold text-slate-900')}
                value={valorProyecto}
                onChange={(e) => setValorProyecto(Number(e.target.value))}
                required
              />
            </Field>
            <Field label="Monto Cobrado a la fecha ($ CLP)">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={montoCobrado}
                onChange={(e) => setMontoCobrado(Number(e.target.value))}
              />
            </Field>
            <Field label="Estado de Cobro">
              <select
                className={inputCls}
                value={estadoCobro}
                onChange={(e) => setEstadoCobro(e.target.value as EstadoCobroProyecto)}
              >
                <option value="PAGADO">✓ 100% Pagado</option>
                <option value="ANTICIPO_50">⏳ Anticipo 50% Recibido</option>
                <option value="EN_CUOTAS">📅 Pago en Cuotas</option>
                <option value="PENDIENTE">⚠️ Cobro Pendiente</option>
              </select>
            </Field>
            <Field label="Estado de Ejecución">
              <select
                className={inputCls}
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoProyectoWeb)}
              >
                <option value="PRODUCCION_ACTIVO">🚀 En Producción (Online)</option>
                <option value="EN_DESARROLLO">🛠️ En Desarrollo / QA</option>
                <option value="MANTENCION_ACTIVA">⚡ Con Mantención Activa</option>
                <option value="ENTREGADO">✓ Entregado Conforme</option>
                <option value="PENDIENTE_RENOVACION">⚠️ Pendiente Renovación</option>
                <option value="PAUSADO">⏸️ Pausado</option>
              </select>
            </Field>
          </div>
        </div>

        {/* =====================================================================
            SECCIÓN 3: QUIÉNES PARTICIPARON DEL EQUIPO PCG SPA Y EXTERNOS
           ===================================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
              👥 1. Miembros del Equipo PCG SPA que participaron en el proyecto
            </span>
            <span className="text-xs text-slate-500">Marca las casillas de quienes trabajaron</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {staff.map((u) => {
              const active = participantesIds.includes(u.id)
              const aptoTec = isAptoTecnico(u)
              const aptoDev = isAptoDesarrollador(u)
              return (
                <label
                  key={u.id}
                  className={cx(
                    'flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition',
                    active
                      ? 'border-emerald-500 bg-emerald-50/90 shadow-2xs ring-1 ring-emerald-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => handleToggleParticipante(u.id)}
                    className="mt-1 h-4 w-4 rounded accent-emerald-600"
                  />
                  <Avatar name={u.nombre} color={u.color} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-extrabold text-slate-900">{u.nombre}</div>
                    <div className="truncate text-[10px] text-slate-500">{u.cargo ?? u.rolEtiqueta}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {aptoDev && (
                        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">
                          💻 Apto Web/Dev
                        </span>
                      )}
                      {aptoTec && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          🛠️ Apto Técnico
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Colaboradores o Personas Externas que trabajaron en el proyecto */}
          <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
                  <span>👥</span>
                  <span>2. Personas y Colaboradores Externos ({personasExternas.length})</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Deja constancia de quién trabajó aunque no sean tus trabajadores internos (diseñadores freelance, fotógrafos, redactores, partners).
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAddPersonaExterna()}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-sky-500 transition"
              >
                <span>+</span>
                <span>Añadir persona externa</span>
              </button>
            </div>

            {personasExternas.length > 0 ? (
              <div className="space-y-2">
                {personasExternas.map((pe, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:grid-cols-12 items-center shadow-2xs"
                  >
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-600">Nombre completo</label>
                      <input
                        type="text"
                        className={`${inputCls} !text-xs !py-1`}
                        placeholder="Ej: Carlos Muñoz"
                        value={pe.nombre}
                        onChange={(e) => handleUpdatePersonaExterna(idx, { nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-600">Rol / Especialidad</label>
                      <input
                        type="text"
                        className={`${inputCls} !text-xs !py-1`}
                        placeholder="Ej: Fotógrafo & Drone"
                        value={pe.rolOParte}
                        onChange={(e) => handleUpdatePersonaExterna(idx, { rolOParte: e.target.value })}
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-600">Empresa de procedencia</label>
                      <input
                        type="text"
                        className={`${inputCls} !text-xs !py-1`}
                        placeholder={externaNombre || 'Ej: Freelance / Agencia Externa'}
                        value={pe.empresa ?? ''}
                        onChange={(e) => handleUpdatePersonaExterna(idx, { empresa: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-600">Contacto / Teléfono</label>
                      <input
                        type="text"
                        className={`${inputCls} !text-xs !py-1`}
                        placeholder="+56 9 ... / email"
                        value={pe.contacto ?? ''}
                        onChange={(e) => handleUpdatePersonaExterna(idx, { contacto: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end items-center pt-2 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemovePersonaExterna(idx)}
                        className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Quitar persona"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-sky-200 bg-white/60 p-2 text-center text-xs text-slate-500">
                No hay personas externas añadidas.{' '}
                <button
                  type="button"
                  onClick={() => handleAddPersonaExterna()}
                  className="font-bold text-sky-700 hover:underline"
                >
                  Haz clic aquí en + para registrar colaboradores externos.
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 pt-1">
            <Field label="Líder Técnico Responsable en PCG SPA">
              <select
                className={inputCls}
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
              >
                {staff.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.nombre} — {u.cargo ?? u.rolEtiqueta}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de Inicio">
              <input
                type="date"
                className={inputCls}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </Field>
            <Field label="Fecha de Entrega Estimada / Real">
              <input
                type="date"
                className={inputCls}
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* =====================================================================
            SECCIÓN 4: ¿PARTICIPÓ SOLO PCG SPA O UNA EMPRESA EXTERNA?
           ===================================================================== */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 space-y-3">
          <div className="text-xs font-extrabold tracking-wider text-sky-950 uppercase">
            🏢 Modalidad de Ejecución: ¿Participó solo PCG SPA o una Empresa Externa?
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              ['SOLO_PCG', '⚡ 100% PCG SPA', 'Ejecutado enteramente con nuestro personal interno.'],
              ['CON_EMPRESA_EXTERNA', '🤝 Alianza con Empresa Externa', 'Trabajo conjunto con un partner / agencia.'],
              ['SUBCONTRATO_EXTERNO', '💼 Subcontrato Externo', 'Se tercerizó una parte específica del proyecto.'],
            ].map(([k, label, desc]) => {
              const active = modalidadEjecucion === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setModalidadEjecucion(k as ModalidadEjecucion)}
                  className={cx(
                    'rounded-xl border p-3 text-left transition',
                    active
                      ? 'border-sky-600 bg-sky-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <div className="font-extrabold text-xs">{label}</div>
                  <div className={cx('mt-1 text-[11px]', active ? 'text-sky-100' : 'text-slate-500')}>
                    {desc}
                  </div>
                </button>
              )
            })}
          </div>

          {modalidadEjecucion !== 'SOLO_PCG' && (
            <div className="grid gap-3 rounded-2xl border border-sky-200 bg-white p-3.5 sm:grid-cols-3">
              <Field label="Nombre / Razón Social de la Empresa Externa">
                <input
                  className={inputCls}
                  value={externaNombre}
                  onChange={(e) => setExternaNombre(e.target.value)}
                  placeholder="Ej: Agencia Andes Audiovisual SpA"
                  required
                />
              </Field>
              <Field label="RUT Empresa Externa (opcional)">
                <input
                  className={inputCls}
                  value={externaRut}
                  onChange={(e) => setExternaRut(e.target.value)}
                  placeholder="76.123.456-K"
                />
              </Field>
              <Field label="Costo Pagado a la Externa ($ CLP)">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={externaCosto}
                  onChange={(e) => setExternaCosto(Number(e.target.value))}
                />
              </Field>
              <div className="sm:col-span-3">
                <Field label="¿Qué parte o servicios realizó la empresa externa?">
                  <input
                    className={inputCls}
                    value={externaRol}
                    onChange={(e) => setExternaRol(e.target.value)}
                    placeholder="Ej: Producción de fotografía profesional, video institucional y redacción de copy"
                    required
                  />
                </Field>
              </div>

              {/* Personas de la Empresa Externa que participaron */}
              <div className="sm:col-span-3 border-t border-sky-100 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div>
                    <div className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
                      <span>👥</span>
                      <span>Personas de {externaNombre.trim() || 'la empresa externa'} que trabajaron ({personasExternas.length}):</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Deja constancia de qué personas de la empresa colaboradora trabajaron y su especialidad.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddPersonaExterna(externaNombre)}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-sky-500 transition"
                  >
                    <span>+</span>
                    <span>Añadir persona que trabajó</span>
                  </button>
                </div>

                {personasExternas.length > 0 ? (
                  <div className="space-y-2">
                    {personasExternas.map((pe, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 gap-2 rounded-xl border border-sky-200 bg-sky-50/50 p-2.5 text-xs sm:grid-cols-12 items-center"
                      >
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-600">Nombre completo</label>
                          <input
                            type="text"
                            className={`${inputCls} !text-xs !py-1 bg-white`}
                            placeholder="Ej: Carlos Muñoz"
                            value={pe.nombre}
                            onChange={(e) => handleUpdatePersonaExterna(idx, { nombre: e.target.value })}
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-600">Rol / Especialidad</label>
                          <input
                            type="text"
                            className={`${inputCls} !text-xs !py-1 bg-white`}
                            placeholder="Ej: Fotógrafo & Drone"
                            value={pe.rolOParte}
                            onChange={(e) => handleUpdatePersonaExterna(idx, { rolOParte: e.target.value })}
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-600">Empresa de procedencia</label>
                          <input
                            type="text"
                            className={`${inputCls} !text-xs !py-1 bg-white`}
                            placeholder={externaNombre || 'Nombre de la empresa'}
                            value={pe.empresa ?? ''}
                            onChange={(e) => handleUpdatePersonaExterna(idx, { empresa: e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-600">Contacto / Teléfono</label>
                          <input
                            type="text"
                            className={`${inputCls} !text-xs !py-1 bg-white`}
                            placeholder="+56 9 ... / email"
                            value={pe.contacto ?? ''}
                            onChange={(e) => handleUpdatePersonaExterna(idx, { contacto: e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end items-center pt-2 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemovePersonaExterna(idx)}
                            className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Quitar persona"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-sky-300 bg-sky-50/40 p-3 text-center text-xs text-slate-600">
                    No has registrado personas de {externaNombre.trim() || 'la empresa externa'}.{' '}
                    <button
                      type="button"
                      onClick={() => handleAddPersonaExterna(externaNombre)}
                      className="font-bold text-sky-700 hover:underline"
                    >
                      Haz clic en + Añadir persona que trabajó para dejar constancia.
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            SECCIÓN 5: DOMINIO Y PLAN DE MANTENCIÓN WEB
           ===================================================================== */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="URL / Dominio (si aplica)">
            <input
              className={cx(inputCls, 'font-mono text-xs')}
              value={urlDominio}
              onChange={(e) => setUrlDominio(e.target.value)}
              placeholder="https://www.empresa.cl"
            />
          </Field>
          <Field label="Stack Tecnológico">
            <input
              className={inputCls}
              value={stackTecnologico}
              onChange={(e) => setStackTecnologico(e.target.value)}
              placeholder="React, Next.js, Node, PostgreSQL..."
            />
          </Field>
          <Field label="Hosting y Proveedor">
            <input
              className={inputCls}
              value={hostingProveedor}
              onChange={(e) => setHostingProveedor(e.target.value)}
              placeholder="VPS Cloud PCG / AWS / NIC.cl"
            />
          </Field>
          <Field label="Vencimiento Hosting / Dominio">
            <input
              type="date"
              className={inputCls}
              value={vencimientoDominioHosting}
              onChange={(e) => setVencimientoDominioHosting(e.target.value)}
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-slate-800">
            <input
              type="checkbox"
              checked={incluyeMantencionWeb}
              onChange={(e) => setIncluyeMantencionWeb(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600"
            />
            <span>🔧 Este cliente tiene contratado Plan de Mantención Web / Soporte con PCG SPA</span>
          </label>

          {incluyeMantencionWeb && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Periodicidad">
                <select
                  className={inputCls}
                  value={planMantencion}
                  onChange={(e) =>
                    setPlanMantencion(e.target.value as 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL')
                  }
                >
                  <option value="MENSUAL">Mensual</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </Field>
              <Field label="Monto Mantención ($ CLP)">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={valorMantencion}
                  onChange={(e) => setValorMantencion(Number(e.target.value))}
                />
              </Field>
              <Field label="Próxima Mantención">
                <input
                  type="date"
                  className={inputCls}
                  value={proximaMantencionWeb}
                  onChange={(e) => setProximaMantencionWeb(e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>

        <Field label="Notas internas u observaciones del proyecto">
          <input
            className={inputCls}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Cliente solicitó soporte prioritario y reunión de avance cada 15 días"
          />
        </Field>

        {!isEdit && (
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={registrarEnFinanzas}
              onChange={(e) => setRegistrarEnFinanzas(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600"
            />
            <span>
              💰 Registrar automáticamente este cobro en Finanzas / Libro de Caja (+{fmtCLP(montoCobrado)})
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant="primary">
            {isEdit ? 'Guardar Cambios del Proyecto' : 'Registrar Proyecto Vendido'}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
