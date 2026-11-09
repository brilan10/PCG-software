import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { isAptoDesarrollador, isAptoTecnico } from '@/lib/types'
import type {
  CategoriaInventario,
  EstadoHerramienta,
  EstadoProyectoWeb,
  ItemInventario,
  MetodoPago,
  ProyectoWebSoftware,
  TipoLicenciaSoftware,
  TipoProyectoWeb,
} from '@/lib/types'
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

import { CATEGORIA_INV_META, ESTADO_PROYECTO_WEB_META, TIPO_PROYECTO_WEB_META, getCategoriaMeta } from '@/lib/inventarioMeta'


const ESTADO_HERRAMIENTA_LABEL: Record<
  EstadoHerramienta,
  { label: string; tone: 'green' | 'blue' | 'amber' | 'red' }
> = {
  OPERATIVO: { label: '✓ Operativo en Taller', tone: 'green' },
  EN_TERRENO: { label: '🚗 En Terreno / Maletín', tone: 'blue' },
  MANTENCION: { label: '🔧 En Calibración / Rep.', tone: 'amber' },
  BAJA: { label: '✕ De Baja / Dañado', tone: 'red' },
}

const TIPO_LICENCIA_LABEL: Record<TipoLicenciaSoftware, string> = {
  VOLUMEN_CORPORATIVO: 'Volumen Corporativo (Múltiples Equipos)',
  SUSCRIPCION_ANUAL: 'Suscripción Anual / Cloud Renovación',
  OEM_RETAIL: 'Clave OEM / Retail Individual',
  PERPETUA: 'Licencia Perpetua Vitalicia',
}


export default function InventarioPage() {
  const { db, mutate } = useStore()
  const items = db.inventario ?? []
  const proyectosWeb = db.proyectosWeb ?? []
  const staff = useMemo(
    () => db.usuarios.filter((u) => ['ADMIN', 'DOC_PROCESS', 'WORKER'].includes(u.rol)),
    [db.usuarios],
  )

  const [tabCat, setTabCat] = useState<'TODOS' | 'PROYECTOS_WEB' | CategoriaInventario>('TODOS')
  const [filtroAlerta, setFiltroAlerta] = useState<'TODOS' | 'STOCK_BAJO' | 'LIC_POR_VENCER' | 'EN_TERRENO'>('TODOS')
  const [filtroResponsable, setFiltroResponsable] = useState<string>('TODOS')
  const [q, setQ] = useState('')

  // Visibilidad de claves de licencia y feedback de copiado
  const [clavesVisibles, setClavesVisibles] = useState<Record<number, boolean>>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Modales
  const [modalForm, setModalForm] = useState<{
    item?: ItemInventario
    categoriaInicial?: CategoriaInventario
  } | null>(null)
  const [modalReponer, setModalReponer] = useState<ItemInventario | null>(null)
  const [modalAsignarLic, setModalAsignarLic] = useState<ItemInventario | null>(null)
  const [modalProyectoWeb, setModalProyectoWeb] = useState<{
    proyecto?: ProyectoWebSoftware
    empresaIdInicial?: number
  } | null>(null)

  const hoy = today()

  // KPIs de inventario
  const kpis = useMemo(() => {
    const valorTotalCosto = items.reduce((acc, it) => acc + it.stockActual * it.costoUnitario, 0)
    const herramientas = items.filter((it) => it.categoria === 'HERRAMIENTA')
    const totalUnidadesHerramientas = herramientas.reduce((a, b) => a + b.stockActual, 0)

    const licencias = items.filter((it) => it.categoria === 'LICENCIA_SOFTWARE' || it.categoria === 'LICENCIA')
    const cuposTotalesLic = licencias.reduce((a, b) => a + b.stockActual, 0)
    const cuposUsadosLic = licencias.reduce((a, b) => a + (b.enUso ?? 0), 0)
    const cuposLibresLic = Math.max(0, cuposTotalesLic - cuposUsadosLic)

    const stockBajoCount = items.filter((it) => {
      if (it.categoria === 'LICENCIA_SOFTWARE' || it.categoria === 'LICENCIA') {
        const libres = Math.max(0, it.stockActual - (it.enUso ?? 0))
        return libres <= it.stockMinimo
      }
      return it.stockActual <= it.stockMinimo
    }).length

    const licPorVencerCount = licencias.filter((it) => {
      if (!it.fechaVencimientoLicencia) return false
      const dias = diffDays(it.fechaVencimientoLicencia, hoy)
      return dias <= 30
    }).length

    const proyectosConMantencion = proyectosWeb.filter((p) => p.incluyeMantencionWeb).length
    const ingresoRecurrenteWeb = proyectosWeb
      .filter((p) => p.incluyeMantencionWeb && p.estado !== 'PAUSADO')
      .reduce((acc, p) => acc + p.valorMantencion, 0)

    return {
      valorTotalCosto,
      herramientasCount: herramientas.length,
      totalUnidadesHerramientas,
      licenciasCount: licencias.length,
      cuposTotalesLic,
      cuposUsadosLic,
      cuposLibresLic,
      stockBajoCount,
      licPorVencerCount,
      proyectosWebCount: proyectosWeb.length,
      proyectosConMantencion,
      ingresoRecurrenteWeb,
    }
  }, [items, proyectosWeb, hoy])

  const proyectosWebFiltrados = useMemo(() => {
    return proyectosWeb.filter((p) => {
      if (filtroResponsable !== 'TODOS' && String(p.responsableId) !== filtroResponsable) return false
      if (q.trim()) {
        const term = q.toLowerCase()
        const hay = `${p.codigo} ${p.clienteNombre} ${p.nombreProyecto} ${p.urlDominio} ${p.stackTecnologico} ${p.hostingProveedor} ${p.notas ?? ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [proyectosWeb, filtroResponsable, q])

  // Filtrado de ítems
  const itemsFiltrados = useMemo(() => {
    if (tabCat === 'PROYECTOS_WEB') return []
    return items.filter((it) => {
      if (tabCat !== 'TODOS' && it.categoria !== tabCat) return false
      if (filtroResponsable !== 'TODOS' && String(it.responsableId ?? '') !== filtroResponsable) return false

      if (filtroAlerta === 'STOCK_BAJO') {
        const esLic = it.categoria === 'LICENCIA_SOFTWARE' || it.categoria === 'LICENCIA'
        const disponible = esLic
          ? Math.max(0, it.stockActual - (it.enUso ?? 0))
          : it.stockActual
        if (disponible > it.stockMinimo) return false
      }
      if (filtroAlerta === 'LIC_POR_VENCER') {
        const esLic = it.categoria === 'LICENCIA_SOFTWARE' || it.categoria === 'LICENCIA'
        if (!esLic || !it.fechaVencimientoLicencia) return false
        if (diffDays(it.fechaVencimientoLicencia, hoy) > 30) return false
      }
      if (filtroAlerta === 'EN_TERRENO') {
        if (it.estadoFisico !== 'EN_TERRENO' && (it.enUso ?? 0) === 0) return false
      }

      if (q.trim()) {
        const term = q.toLowerCase()
        const resp = db.usuarios.find((u) => u.id === it.responsableId)?.nombre ?? ''
        const hay = `${it.codigo} ${it.nombre} ${it.marcaModelo} ${it.descripcion ?? ''} ${it.proveedor} ${it.ubicacion} ${it.claveLicencia ?? ''} ${it.cuentaAsociada ?? ''} ${(it.asignadoAClientes ?? []).join(' ')} ${resp}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [items, tabCat, filtroResponsable, filtroAlerta, q, hoy, db.usuarios])

  const licenciasVisibles = useMemo(
    () => itemsFiltrados.filter((it) => it.categoria === 'LICENCIA_SOFTWARE' || it.categoria === 'LICENCIA'),
    [itemsFiltrados],
  )

  const handleCopyKey = (item: ItemInventario) => {
    if (!item.claveLicencia) return
    navigator.clipboard?.writeText(item.claveLicencia)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId((prev) => (prev === item.id ? null : prev)), 2000)
  }

  const adjustStockOrUse = (id: number, field: 'stockActual' | 'enUso', delta: number) => {
    mutate((d) => {
      const target = d.inventario?.find((x) => x.id === id)
      if (!target) return
      if (field === 'stockActual') {
        target.stockActual = Math.max(0, target.stockActual + delta)
        if ((target.enUso ?? 0) > target.stockActual) {
          target.enUso = target.stockActual
        }
      } else {
        const currentUse = target.enUso ?? 0
        target.enUso = Math.min(target.stockActual, Math.max(0, currentUse + delta))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* =====================================================================
          HEADER ANIMADO CON RESUMEN EJECUTIVO DE INVENTARIO & LICENCIAS
         ===================================================================== */}
      <BackgroundBeamsHeader
        badge="📦 INVENTARIO, HERRAMIENTAS, LICENCIAS & PROYECTOS DE PÁGINAS WEB / SOFTWARE"
        title="Control de Inventario, Licencias de Software & Páginas Web con Clientes"
        subtitle="Controla destornilladores y herramientas, claves/cupos de licencias (Office, Windows, Antivirus, Adobe), y qué clientes tienen Páginas Web, Mantención Web o Software contratado con PCG SPA."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MovingBorderBtn
              onClick={() => setModalProyectoWeb({})}
            >
              🌐 + Venta Página Web / Software / Mantención
            </MovingBorderBtn>
            <Btn
              variant="primary"
              onClick={() => setModalForm({ categoriaInicial: 'HERRAMIENTA' })}
            >
              🛠️ + Herramienta / Destornillador
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => setModalForm({ categoriaInicial: 'LICENCIA_SOFTWARE' })}
            >
              💿 + Licencia Software
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => setModalForm({ categoriaInicial: 'REPUESTO' })}
            >
              🔩 + Repuesto / Insumo
            </Btn>
          </div>
        }
      />

      {/* =====================================================================
          TARJETAS KPI INTERACTIVAS (SPOTLIGHT)
         ===================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-emerald-700 uppercase">
              🌐 Web & Software PCG
            </span>
            <Badge tone="green">{kpis.proyectosConMantencion} con mantención</Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.proyectosWebCount} suffix=" proyectos" />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Páginas web, E-Commerce y Software a medida · Recurrente:{' '}
            <strong className="text-emerald-700">{fmtCLP(kpis.ingresoRecurrenteWeb)}</strong>
          </div>
          <button
            type="button"
            onClick={() => setTabCat(tabCat === 'PROYECTOS_WEB' ? 'TODOS' : 'PROYECTOS_WEB')}
            className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
          >
            {tabCat === 'PROYECTOS_WEB' ? 'Ver todo el inventario →' : 'Ver clientes con Web/Software →'}
          </button>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.18)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-violet-700 uppercase">
              🛠️ Herramientas y Taller
            </span>
            <Badge tone="violet">{kpis.herramientasCount} tipos</Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.totalUnidadesHerramientas} suffix=" unid." />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Destornilladores precisión, soldadura SMD, testers y sopladores
          </div>
          <button
            type="button"
            onClick={() => setTabCat(tabCat === 'HERRAMIENTA' ? 'TODOS' : 'HERRAMIENTA')}
            className="mt-3 text-xs font-bold text-violet-700 hover:underline"
          >
            {tabCat === 'HERRAMIENTA' ? 'Ver todo el inventario →' : 'Filtrar solo herramientas →'}
          </button>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(14, 165, 233, 0.18)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-sky-700 uppercase">
              💿 Licencias de Software
            </span>
            <Badge tone="blue">{kpis.licenciasCount} bolsas/claves</Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.cuposLibresLic} suffix=" libres" />
            <span className="ml-1.5 text-sm font-semibold text-slate-400">
              / {kpis.cuposTotalesLic} cupos
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {kpis.cuposUsadosLic} activadas (Office, Windows 11, Avast, Adobe CC, ESET)
          </div>
          <button
            type="button"
            onClick={() => setTabCat(tabCat === 'LICENCIA_SOFTWARE' ? 'TODOS' : 'LICENCIA_SOFTWARE')}
            className="mt-3 text-xs font-bold text-sky-700 hover:underline"
          >
            {tabCat === 'LICENCIA_SOFTWARE' ? 'Ver todo el inventario →' : 'Abrir bóveda de licencias →'}
          </button>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.18)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-emerald-700 uppercase">
              💰 Valorizado en Bodega
            </span>
            <Badge tone="green">{items.length} ítems</Badge>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <AnimatedNumber value={kpis.valorTotalCosto} formatCLP />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Capital invertido en herramientas, licencias, repuestos e insumos
          </div>
          <Link to="/app/finanzas" className="mt-3 inline-block text-xs font-bold text-emerald-700 hover:underline">
            Ver compras en Finanzas →
          </Link>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-amber-700 uppercase">
              ⚠️ Alertas de Reposición
            </span>
            <Badge tone={kpis.stockBajoCount + kpis.licPorVencerCount > 0 ? 'amber' : 'green'}>
              {kpis.stockBajoCount + kpis.licPorVencerCount} alertas
            </Badge>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-black text-amber-600">{kpis.stockBajoCount}</span>
              <span className="ml-1 text-xs font-semibold text-slate-500">stock bajo</span>
            </div>
            <div>
              <span className="text-2xl font-black text-rose-600">{kpis.licPorVencerCount}</span>
              <span className="ml-1 text-xs font-semibold text-slate-500">lic. por vencer</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroAlerta(filtroAlerta === 'STOCK_BAJO' ? 'TODOS' : 'STOCK_BAJO')}
              className={cx(
                'rounded-lg px-2 py-1 text-[11px] font-bold transition',
                filtroAlerta === 'STOCK_BAJO'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100',
              )}
            >
              ⚠️ Ver stock bajo ({kpis.stockBajoCount})
            </button>
            <button
              type="button"
              onClick={() => setFiltroAlerta(filtroAlerta === 'LIC_POR_VENCER' ? 'TODOS' : 'LIC_POR_VENCER')}
              className={cx(
                'rounded-lg px-2 py-1 text-[11px] font-bold transition',
                filtroAlerta === 'LIC_POR_VENCER'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100',
              )}
            >
              ⏳ Licencias por vencer ({kpis.licPorVencerCount})
            </button>
          </div>
        </SpotlightCard>
      </div>

      {/* =====================================================================
          PESTAÑAS POR CATEGORÍA + FILTROS RÁPIDOS DE ANÁLISIS
         ===================================================================== */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AnimatedPillTabs
            layoutId="inventario-tabs"
            tabs={[
              { id: 'TODOS', label: '📦 Todo', badge: items.length + proyectosWeb.length },
              {
                id: 'PROYECTOS_WEB',
                label: '🌐 Páginas Web y Software con Clientes',
                badge: proyectosWeb.length,
              },
              {
                id: 'HERRAMIENTA',
                label: '🛠️ Herramientas y Destornilladores',
                badge: items.filter((i) => i.categoria === 'HERRAMIENTA').length,
              },
              {
                id: 'LICENCIA_SOFTWARE',
                label: '💿 Licencias de Software',
                badge: items.filter((i) => i.categoria === 'LICENCIA_SOFTWARE').length,
              },
              {
                id: 'REPUESTO',
                label: '🔩 Repuestos (SSD/RAM)',
                badge: items.filter((i) => i.categoria === 'REPUESTO').length,
              },
              {
                id: 'INSUMO',
                label: '🧴 Insumos y Tarjetas',
                badge: items.filter((i) => i.categoria === 'INSUMO').length,
              },
              {
                id: 'EQUIPO_INTERNO',
                label: '💻 Equipos PCG',
                badge: items.filter((i) => i.categoria === 'EQUIPO_INTERNO').length,
              },
            ]}
            active={tabCat}
            onChange={(id) => setTabCat(id)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              className={cx(inputCls, 'w-auto py-1.5 text-xs font-semibold')}
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
            >
              <option value="TODOS">👤 Todos los responsables</option>
              {staff.map((u) => {
                const dev = isAptoDesarrollador(u) ? ' · 💻 Apto Web/Dev' : ''
                const tec = isAptoTecnico(u) ? ' · 🛠️ Técnico' : ''
                return (
                  <option key={u.id} value={String(u.id)}>
                    {u.nombre} ({u.rolEtiqueta ?? u.cargo}){dev}{tec}
                  </option>
                )
              })}
            </select>

            <select
              className={cx(inputCls, 'w-auto py-1.5 text-xs font-semibold')}
              value={filtroAlerta}
              onChange={(e) => setFiltroAlerta(e.target.value as typeof filtroAlerta)}
            >
              <option value="TODOS">🔎 Todos los estados</option>
              <option value="STOCK_BAJO">⚠️ Stock bajo / Pocos cupos</option>
              <option value="LIC_POR_VENCER">⏳ Licencias próximas a vencer</option>
              <option value="EN_TERRENO">🚗 En terreno o en uso activo</option>
            </select>

            <input
              className={cx(inputCls, 'w-64 py-1.5 text-xs')}
              placeholder="Buscar destornillador, licencia, clave, SSD..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* =====================================================================
          SECCIÓN DESTACADA 1: PROYECTOS DE PÁGINAS WEB, MANTENCIÓN WEB Y SOFTWARE CON CLIENTES
         ===================================================================== */}
      {(tabCat === 'PROYECTOS_WEB' || tabCat === 'TODOS') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                🌐 Clientes con Páginas Web, Mantención Web y Software Contratado con PCG SPA
              </h2>
              <p className="text-xs text-slate-500">
                Visualiza de inmediato qué empresas o clientes tienen sitio web, tienda E-Commerce, software a medida o plan de mantención web activo contigo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/app/empresas">
                <Btn variant="secondary">🏢 Ver en Cartera de Clientes</Btn>
              </Link>
              <Btn variant="primary" onClick={() => setModalProyectoWeb({})}>
                🌐 + Registrar Venta de Página Web / Software
              </Btn>
            </div>
          </div>

          {proyectosWebFiltrados.length === 0 ? (
            <Empty>
              No hay proyectos de páginas web o software que coincidan con el filtro actual.
            </Empty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {proyectosWebFiltrados.map((pw) => {
                const tMeta = TIPO_PROYECTO_WEB_META[pw.tipo] ?? {
                  label: pw.tipo,
                  short: pw.tipo,
                  icon: '🌐',
                  tone: 'blue' as const,
                }
                const eMeta = ESTADO_PROYECTO_WEB_META[pw.estado] ?? {
                  label: pw.estado,
                  tone: 'blue' as const,
                }
                const resp = db.usuarios.find((u) => u.id === pw.responsableId)
                const diasMant = pw.proximaMantencionWeb
                  ? diffDays(pw.proximaMantencionWeb, hoy)
                  : null
                const diasHost = pw.vencimientoDominioHosting
                  ? diffDays(pw.vencimientoDominioHosting, hoy)
                  : null

                return (
                  <Tilt3DCard
                    key={pw.id}
                    spotlightColor="rgba(16, 185, 129, 0.16)"
                    className="flex flex-col justify-between p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-700">{pw.codigo}</span>
                            <Badge tone={tMeta.tone}>
                              {tMeta.icon} {tMeta.short}
                            </Badge>
                          </div>
                          <h3 className="mt-1 text-sm font-extrabold text-slate-900">{pw.clienteNombre}</h3>
                          <div className="text-xs font-semibold text-slate-700">{pw.nombreProyecto}</div>
                        </div>
                        <Badge tone={eMeta.tone}>{eMeta.label}</Badge>
                      </div>

                      {/* Dominio / URL y Stack Tecnológico */}
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-950 px-3 py-2 text-white">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                            🌍 Dominio / URL en Producción
                          </span>
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            ✓ Software con PCG
                          </span>
                        </div>
                        <div className="mt-0.5 truncate font-mono text-xs font-bold text-sky-300">
                          {pw.urlDominio}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
                          <span>⚙️ {pw.stackTecnologico}</span>
                          <span>☁️ {pw.hostingProveedor}</span>
                        </div>
                      </div>

                      {/* Estado de Mantención Web y Fechas */}
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Valor Proyecto</div>
                          <div className="font-extrabold text-slate-900">{fmtCLP(pw.valorProyecto)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">
                            Mantención Web ({pw.planMantencion ?? 'SIN PLAN'})
                          </div>
                          <div className="font-extrabold text-emerald-700">
                            {pw.incluyeMantencionWeb ? `${fmtCLP(pw.valorMantencion)} / ciclo` : 'Sin mantención recurrente'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                        {pw.incluyeMantencionWeb && pw.proximaMantencionWeb && (
                          <Badge tone={diasMant !== null && diasMant <= 7 ? 'amber' : 'green'}>
                            🔧 Próx. Mantención Web: {fmtFecha(pw.proximaMantencionWeb)}
                            {diasMant !== null ? ` (${diasMant >= 0 ? `en ${diasMant}d` : `hace ${Math.abs(diasMant)}d`})` : ''}
                          </Badge>
                        )}
                        {pw.vencimientoDominioHosting && (
                          <Badge tone={diasHost !== null && diasHost <= 25 ? 'red' : 'blue'}>
                            🌐 Hosting/Dominio: {fmtFecha(pw.vencimientoDominioHosting)}
                          </Badge>
                        )}
                      </div>

                      {pw.notas && (
                        <div className="mt-2 text-[11px] italic text-slate-500">{pw.notas}</div>
                      )}
                    </div>

                    {/* Acciones rápidas del proyecto Web/Software */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {pw.incluyeMantencionWeb && (
                          <button
                            type="button"
                            onClick={() => {
                              mutate((d) => {
                                const target = d.proyectosWeb?.find((x) => x.id === pw.id)
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
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-500"
                            title="Marcar mantención web realizada hoy y programar el siguiente ciclo"
                          >
                            ✓ Mantención Web al día
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setModalProyectoWeb({ proyecto: pw })}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          ✎ Editar Web/Software
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {resp && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            <Avatar name={resp.nombre} color={resp.color} size={20} />
                            {resp.nombre.split(' ')[0]}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm(`¿Eliminar el proyecto "${pw.nombreProyecto}" de ${pw.clienteNombre}?`)) return
                            mutate((d) => {
                              d.proyectosWeb = (d.proyectosWeb ?? []).filter((x) => x.id !== pw.id)
                            })
                          }}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </Tilt3DCard>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SECCIÓN DESTACADA 2: BÓVEDA DE LICENCIAS DE SOFTWARE (CLAVES Y CUPOS)
         ===================================================================== */}
      {(tabCat === 'LICENCIA_SOFTWARE' || tabCat === 'TODOS') && licenciasVisibles.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                💿 Bóveda de Licencias de Software, Claves Seriales y Cupos de Activación
              </h2>
              <p className="text-xs text-slate-500">
                Controla cuántas activaciones quedan disponibles (Office, Windows, Antivirus Avast/ESET, Adobe CC), copia la clave en 1 clic y asigna cupos a clientes.
              </p>
            </div>
            <Btn
              variant="secondary"
              onClick={() => setModalForm({ categoriaInicial: 'LICENCIA_SOFTWARE' })}
            >
              + Registrar Nueva Licencia / Suscripción
            </Btn>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {licenciasVisibles.map((lic) => {
              const usados = lic.enUso ?? 0
              const libres = Math.max(0, lic.stockActual - usados)
              const pctUso = lic.stockActual > 0 ? Math.min(100, Math.round((usados / lic.stockActual) * 100)) : 0
              const diasVence = lic.fechaVencimientoLicencia
                ? diffDays(lic.fechaVencimientoLicencia, hoy)
                : null
              const porVencer = diasVence !== null && diasVence <= 30
              const resp = db.usuarios.find((u) => u.id === lic.responsableId)
              const showKey = !!clavesVisibles[lic.id]

              return (
                <Tilt3DCard
                  key={lic.id}
                  spotlightColor="rgba(14, 165, 233, 0.14)"
                  className="flex flex-col justify-between p-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-sky-700">{lic.codigo}</span>
                        <h3 className="text-sm font-extrabold text-slate-900">{lic.nombre}</h3>
                        <div className="text-xs text-slate-500">{lic.marcaModelo}</div>
                      </div>
                      <Badge tone={libres <= lic.stockMinimo ? 'amber' : 'blue'}>
                        {libres} libre(s) / {lic.stockActual}
                      </Badge>
                    </div>

                    {/* Clave Serial con botón Mostrar/Ocultar y Copiar */}
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-white">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                          🔑 Clave / Serial de Activación
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setClavesVisibles((prev) => ({ ...prev, [lic.id]: !prev[lic.id] }))
                            }
                            className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200 hover:bg-white/20"
                          >
                            {showKey ? '🙈 Ocultar' : '👁️ Ver clave'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(lic)}
                            className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30"
                          >
                            {copiedId === lic.id ? '✓ Copiada' : '📋 Copiar'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold tracking-wider text-slate-100 select-all">
                        {lic.claveLicencia
                          ? showKey
                            ? lic.claveLicencia
                            : `${lic.claveLicencia.slice(0, 6)}•••••-•••••-${lic.claveLicencia.slice(-5)}`
                          : 'Sin clave registrada'}
                      </div>
                      {lic.cuentaAsociada && (
                        <div className="mt-1 text-[11px] text-slate-400">
                          Cuenta portal: <strong className="text-slate-200">{lic.cuentaAsociada}</strong>
                        </div>
                      )}
                    </div>

                    {/* Barra de Cupos / Activaciones */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">
                          Activaciones: <strong>{usados} en uso</strong> ·{' '}
                          <strong className="text-emerald-700">{libres} disponibles</strong>
                        </span>
                        <span className="font-bold text-slate-700">{pctUso}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cx(
                            'h-full rounded-full transition-all',
                            libres === 0
                              ? 'bg-rose-500'
                              : libres <= lic.stockMinimo
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-sky-500 to-emerald-500',
                          )}
                          style={{ width: `${pctUso}%` }}
                        />
                      </div>
                    </div>

                    {/* Vencimiento y tipo */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500">
                        {lic.tipoLicencia && TIPO_LICENCIA_LABEL[lic.tipoLicencia]
                          ? TIPO_LICENCIA_LABEL[lic.tipoLicencia]
                          : (lic.tipoLicencia || 'Licencia Software')}
                      </span>
                      {lic.fechaVencimientoLicencia && (
                        <Badge tone={porVencer ? 'red' : 'green'}>
                          {porVencer
                            ? `⚠️ Renovar en ${diasVence}d (${fmtFecha(lic.fechaVencimientoLicencia)})`
                            : `Vigente hasta ${fmtFecha(lic.fechaVencimientoLicencia)}`}
                        </Badge>
                      )}
                    </div>

                    {/* Clientes / Equipos donde está asignada */}
                    {lic.asignadoAClientes && lic.asignadoAClientes.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {lic.asignadoAClientes.map((cli, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            🏢 {cli}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Controles rápidos de activación y edición */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustStockOrUse(lic.id, 'enUso', 1)}
                        disabled={libres <= 0}
                        className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-sky-500 disabled:opacity-40"
                      >
                        +1 Activar cupo
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustStockOrUse(lic.id, 'enUso', -1)}
                        disabled={usados <= 0}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        -1 Liberar
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalAsignarLic(lic)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        🏢 Asignar Cliente
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {resp && <Avatar name={resp.nombre} color={resp.color} size={22} />}
                      <button
                        type="button"
                        onClick={() => setModalReponer(lic)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        title="Comprar más cupos de esta licencia"
                      >
                        + Cupos
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalForm({ item: lic })}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                </Tilt3DCard>
              )
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TABLA MAESTRA DE INVENTARIO (DESTORNILLADORES, HERRAMIENTAS, LICENCIAS, REPUESTOS)
         ===================================================================== */}
      {tabCat !== 'PROYECTOS_WEB' && (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-slate-900">
            📋 Listado Completo de Inventario ({itemsFiltrados.length} registros)
          </h2>
          <div className="text-xs text-slate-500">
            Usa los botones <strong>- / +</strong> para ajustar stock en vivo o <strong>📥 Reponer / Comprar</strong> para sumar compras y vincularlas con Finanzas.
          </div>
        </div>

        {itemsFiltrados.length === 0 ? (
          <Empty>
            No se encontraron herramientas, licencias ni repuestos con los filtros seleccionados.
          </Empty>
        ) : (
          <Table
            head={[
              'Código / Categoría',
              'Ítem (Destornillador, Herramienta, Licencia, Repuesto)',
              'Stock / Disponibilidad',
              'Costo Unit. / Valor Total',
              'Ubicación y Responsable',
              'Estado / Detalle Licencia',
              'Acciones',
            ]}
          >
            {itemsFiltrados.map((it) => {
              const meta = getCategoriaMeta(it.categoria)
              const resp = db.usuarios.find((u) => u.id === it.responsableId)
              const esLicencia = it.categoria === 'LICENCIA_SOFTWARE' || it.categoria === 'LICENCIA'
              const usados = it.enUso ?? 0
              const libres = Math.max(0, it.stockActual - usados)
              const alertaBajo = esLicencia
                ? libres <= it.stockMinimo
                : it.stockActual <= it.stockMinimo

              return (
                <tr key={it.id} className={alertaBajo ? 'bg-amber-50/40' : undefined}>
                  <td className={td}>
                    <div className="font-mono text-xs font-extrabold text-slate-900">{it.codigo}</div>
                    <div className="mt-1">
                      <Badge tone={meta.tone}>
                        {meta.icon} {meta.short}
                      </Badge>
                    </div>
                  </td>

                  <td className={td}>
                    <div className="font-extrabold text-slate-900">{it.nombre}</div>
                    <div className="text-xs font-medium text-slate-600">{it.marcaModelo}</div>
                    {it.descripcion && (
                      <div className="mt-0.5 max-w-md text-[11px] text-slate-400">{it.descripcion}</div>
                    )}
                    <div className="mt-1 text-[11px] text-slate-500">
                      Proveedor: <strong>{it.proveedor}</strong> · Últ. compra: {fmtFecha(it.fechaUltimaCompra)}
                      {it.nroFacturaCompra ? ` (${it.nroFacturaCompra})` : ''}
                    </div>
                  </td>

                  <td className={td}>
                    {esLicencia ? (
                      <div>
                        <div className="text-sm font-black text-slate-900">
                          {libres} libres{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({usados} activadas de {it.stockActual})
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustStockOrUse(it.id, 'enUso', 1)}
                            disabled={libres <= 0}
                            className="rounded bg-sky-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-sky-500 disabled:opacity-40"
                          >
                            +1 Activar
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStockOrUse(it.id, 'enUso', -1)}
                            disabled={usados <= 0}
                            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                          >
                            -1 Liberar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adjustStockOrUse(it.id, 'stockActual', -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-100"
                            title="Descontar 1 unidad"
                          >
                            −
                          </button>
                          <span className="text-sm font-black text-slate-900">
                            {it.stockActual} {it.unidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustStockOrUse(it.id, 'stockActual', 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-100"
                            title="Sumar 1 unidad"
                          >
                            +
                          </button>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Mínimo sugerido: {it.stockMinimo} {it.unidad}
                          {it.enUso ? ` · ${it.enUso} en uso` : ''}
                        </div>
                      </div>
                    )}
                    {alertaBajo && (
                      <div className="mt-1">
                        <Badge tone="amber">⚠️ Stock bajo / Reponer</Badge>
                      </div>
                    )}
                  </td>

                  <td className={td}>
                    <div className="text-xs text-slate-600">
                      Costo unit.: <strong className="text-slate-900">{fmtCLP(it.costoUnitario)}</strong>
                    </div>
                    <div className="text-sm font-extrabold text-emerald-700">
                      Total: {fmtCLP(it.stockActual * it.costoUnitario)}
                    </div>
                    {it.precioVentaSugerido && (
                      <div className="text-[11px] text-slate-500">
                        PVP sugerido: <strong>{fmtCLP(it.precioVentaSugerido)}</strong>
                      </div>
                    )}
                  </td>

                  <td className={td}>
                    <div className="text-xs font-semibold text-slate-800">📍 {it.ubicacion}</div>
                    {resp ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Avatar name={resp.nombre} color={resp.color} size={22} />
                        <div>
                          <div className="text-xs font-bold text-slate-800">{resp.nombre}</div>
                          <div className="text-[10px] text-slate-500">{resp.rolEtiqueta ?? resp.cargo}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-400">Sin asignar (Taller general)</div>
                    )}
                  </td>

                  <td className={td}>
                    {esLicencia ? (
                      <div className="space-y-1">
                        {it.claveLicencia && (
                          <div className="flex items-center gap-1">
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800">
                              {clavesVisibles[it.id]
                                ? it.claveLicencia
                                : `${it.claveLicencia.slice(0, 6)}••••`}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(it)}
                              className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-slate-700"
                            >
                              {copiedId === it.id ? '✓' : 'Copiar'}
                            </button>
                          </div>
                        )}
                        {it.fechaVencimientoLicencia && (
                          <div className="text-[11px] text-slate-600">
                            Vence: <strong>{fmtFecha(it.fechaVencimientoLicencia)}</strong>
                          </div>
                        )}
                      </div>
                    ) : it.estadoFisico && ESTADO_HERRAMIENTA_LABEL[it.estadoFisico] ? (
                      <Badge tone={ESTADO_HERRAMIENTA_LABEL[it.estadoFisico].tone}>
                        {ESTADO_HERRAMIENTA_LABEL[it.estadoFisico].label}
                      </Badge>
                    ) : (
                      <Badge tone="green">✓ En Bodega</Badge>
                    )}
                  </td>

                  <td className={`${td} text-right`}>
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModalReponer(it)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                        title="Registrar compra adicional de este ítem"
                      >
                        📥 + Comprar
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalForm({ item: it })}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        ✎ Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`¿Eliminar "${it.nombre}" del inventario?`)) return
                          mutate((d) => {
                            d.inventario = (d.inventario ?? []).filter((x) => x.id !== it.id)
                          })
                        }}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        title="Eliminar del inventario"
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
      </div>
      )}

      {/* =====================================================================
          MODAL 1: CREAR O EDITAR ÍTEM DE INVENTARIO (DESTORNILLADOR, LICENCIA, ETC.)
         ===================================================================== */}
      {modalForm && (
        <ModalItemInventario
          item={modalForm.item}
          categoriaInicial={modalForm.categoriaInicial}
          onClose={() => setModalForm(null)}
        />
      )}

      {/* =====================================================================
          MODAL 2: REPONER STOCK / COMPRAR MÁS UNIDADES (CONECTADO A FINANZAS)
         ===================================================================== */}
      {modalReponer && (
        <ModalReponerStock
          item={modalReponer}
          onClose={() => setModalReponer(null)}
        />
      )}

      {/* =====================================================================
          MODAL 3: ASIGNAR ACTIVACIÓN DE LICENCIA A CLIENTE / EMPRESA
         ===================================================================== */}
      {modalAsignarLic && (
        <ModalAsignarLicenciaCliente
          item={modalAsignarLic}
          onClose={() => setModalAsignarLic(null)}
        />
      )}

      {/* =====================================================================
          MODAL 4: CREAR O EDITAR PROYECTO DE PÁGINA WEB / SOFTWARE / MANTENCIÓN WEB
         ===================================================================== */}
      {modalProyectoWeb && (
        <ModalProyectoWebSoftware
          proyecto={modalProyectoWeb.proyecto}
          empresaIdInicial={modalProyectoWeb.empresaIdInicial}
          onClose={() => setModalProyectoWeb(null)}
        />
      )}
    </div>
  )
}

/* ============================================================================
   MODAL CREAR / EDITAR ÍTEM DE INVENTARIO (CON PLANTILLAS 1-CLIC)
   ============================================================================ */
function ModalItemInventario({
  item,
  categoriaInicial = 'HERRAMIENTA',
  onClose,
}: {
  item?: ItemInventario
  categoriaInicial?: CategoriaInventario
  onClose: () => void
}) {
  const { db, mutate } = useStore()
  const isEdit = !!item
  const staff = db.usuarios.filter((u) => ['ADMIN', 'DOC_PROCESS', 'WORKER'].includes(u.rol))

  const [categoria, setCategoria] = useState<CategoriaInventario>(item?.categoria ?? categoriaInicial)
  const [codigo, setCodigo] = useState(
    item?.codigo ??
      `${getCategoriaMeta(item?.categoria ?? categoriaInicial).prefix}-${String((db.inventario?.length ?? 0) + 1).padStart(3, '0')}`,
  )
  const [nombre, setNombre] = useState(item?.nombre ?? '')
  const [marcaModelo, setMarcaModelo] = useState(item?.marcaModelo ?? '')
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? '')
  const [stockActual, setStockActual] = useState(item?.stockActual ?? 1)
  const [enUso, setEnUso] = useState(item?.enUso ?? 0)
  const [stockMinimo, setStockMinimo] = useState(item?.stockMinimo ?? 1)
  const [unidad, setUnidad] = useState(
    item?.unidad ?? (categoriaInicial === 'LICENCIA_SOFTWARE' ? 'activaciones' : 'unidades'),
  )
  const [costoUnitario, setCostoUnitario] = useState(item?.costoUnitario ?? 25000)
  const [precioVentaSugerido, setPrecioVentaSugerido] = useState(item?.precioVentaSugerido ?? 0)
  const [proveedor, setProveedor] = useState(item?.proveedor ?? 'PC Factory S.A.')
  const [fechaUltimaCompra, setFechaUltimaCompra] = useState(item?.fechaUltimaCompra ?? today())
  const [nroFacturaCompra, setNroFacturaCompra] = useState(item?.nroFacturaCompra ?? '')
  const [ubicacion, setUbicacion] = useState(
    item?.ubicacion ??
      (categoriaInicial === 'LICENCIA_SOFTWARE'
        ? 'Bóveda Digital PCG'
        : 'Banco de Trabajo 1 · Laboratorio PCG'),
  )
  const [responsableId, setResponsableId] = useState<string>(
    item?.responsableId ? String(item.responsableId) : '4',
  )
  const [estadoFisico, setEstadoFisico] = useState<EstadoHerramienta>(item?.estadoFisico ?? 'OPERATIVO')

  // Campos de Licencia de Software
  const [tipoLicencia, setTipoLicencia] = useState<TipoLicenciaSoftware>(
    item?.tipoLicencia ?? 'VOLUMEN_CORPORATIVO',
  )
  const [claveLicencia, setClaveLicencia] = useState(item?.claveLicencia ?? '')
  const [cuentaAsociada, setCuentaAsociada] = useState(item?.cuentaAsociada ?? 'serviciotecnicopcg@gmail.com')
  const [fechaVencimientoLicencia, setFechaVencimientoLicencia] = useState(
    item?.fechaVencimientoLicencia ?? addDays(today(), 365),
  )

  // Opción de registrar egreso en Finanzas al crear un ítem comprado
  const [registrarEnFinanzas, setRegistrarEnFinanzas] = useState(!isEdit)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TRANSFERENCIA')

  const handleChangeCategoria = (cat: CategoriaInventario) => {
    setCategoria(cat)
    if (!isEdit) {
      setCodigo(`${getCategoriaMeta(cat).prefix}-${String((db.inventario?.length ?? 0) + 1).padStart(3, '0')}`)
      if (cat === 'LICENCIA_SOFTWARE') {
        setUnidad('activaciones')
        setUbicacion('Bóveda Digital PCG (Nube)')
      } else if (cat === 'HERRAMIENTA') {
        setUnidad('unidades')
        setUbicacion('Banco de Trabajo 1 · Laboratorio PCG')
      } else if (cat === 'REPUESTO') {
        setUnidad('unidades')
        setUbicacion('Estante Repuestos A1 · Bodega Sucursal')
      } else if (cat === 'INSUMO') {
        setUnidad('unidades')
        setUbicacion('Gaveta Insumos · Taller PCG')
      }
    }
  }

  const applyPreset = (preset: {
    cat: CategoriaInventario
    nombre: string
    marca: string
    desc: string
    stock: number
    unidad: string
    costo: number
    pvp?: number
    ubicacion: string
    clave?: string
    tipoLic?: TipoLicenciaSoftware
  }) => {
    handleChangeCategoria(preset.cat)
    setNombre(preset.nombre)
    setMarcaModelo(preset.marca)
    setDescripcion(preset.desc)
    setStockActual(preset.stock)
    setUnidad(preset.unidad)
    setCostoUnitario(preset.costo)
    setPrecioVentaSugerido(preset.pvp ?? 0)
    setUbicacion(preset.ubicacion)
    if (preset.clave) setClaveLicencia(preset.clave)
    if (preset.tipoLic) setTipoLicencia(preset.tipoLic)
  }

  const totalCompra = Math.max(0, Number(stockActual) * Number(costoUnitario))

  return (
    <Modal
      open
      onClose={onClose}
      title={
        isEdit
          ? `✎ Editar Inventario: ${item.nombre}`
          : '📦 Registrar Herramienta, Destornillador, Licencia de Software o Repuesto'
      }
      wide
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          mutate((d) => {
            if (!d.inventario) d.inventario = []
            const payload: ItemInventario = {
              id: item?.id ?? nextId(d.inventario),
              codigo: codigo.trim() || `INV-${nextId(d.inventario)}`,
              categoria,
              nombre: nombre.trim(),
              marcaModelo: marcaModelo.trim(),
              descripcion: descripcion.trim() || undefined,
              stockActual: Number(stockActual) || 0,
              enUso: Number(enUso) || 0,
              stockMinimo: Number(stockMinimo) || 0,
              unidad: unidad.trim() || 'unidades',
              costoUnitario: Number(costoUnitario) || 0,
              precioVentaSugerido: Number(precioVentaSugerido) > 0 ? Number(precioVentaSugerido) : undefined,
              proveedor: proveedor.trim() || 'Proveedor General',
              fechaUltimaCompra,
              nroFacturaCompra: nroFacturaCompra.trim() || undefined,
              ubicacion: ubicacion.trim() || 'Taller PCG',
              responsableId: responsableId ? Number(responsableId) : undefined,
              estadoFisico: categoria === 'LICENCIA_SOFTWARE' ? undefined : estadoFisico,
              tipoLicencia: categoria === 'LICENCIA_SOFTWARE' ? tipoLicencia : undefined,
              claveLicencia: categoria === 'LICENCIA_SOFTWARE' ? claveLicencia.trim() : undefined,
              cuentaAsociada: categoria === 'LICENCIA_SOFTWARE' ? cuentaAsociada.trim() : undefined,
              fechaVencimientoLicencia:
                categoria === 'LICENCIA_SOFTWARE' ? fechaVencimientoLicencia : undefined,
              asignadoAClientes: item?.asignadoAClientes ?? [],
            }

            if (isEdit) {
              const idx = d.inventario.findIndex((x) => x.id === item.id)
              if (idx >= 0) d.inventario[idx] = payload
            } else {
              d.inventario.unshift(payload)
              if (registrarEnFinanzas && totalCompra > 0) {
                const meta = getCategoriaMeta(categoria)
                d.movimientos.push({
                  id: nextId(d.movimientos),
                  fecha: fechaUltimaCompra,
                  tipo: 'EGRESO',
                  rubro: meta.rubroCaja,
                  categoria: meta.label,
                  itemComprado: payload.nombre,
                  cantidad: payload.stockActual,
                  concepto: `Compra para Inventario (${payload.codigo}): ${payload.stockActual} ${payload.unidad} de ${payload.nombre}`,
                  contraparte: payload.proveedor,
                  monto: totalCompra,
                  metodo: metodoPago,
                  nroDocumento: payload.nroFacturaCompra,
                  conciliadoBanco: metodoPago !== 'EFECTIVO',
                })
              }
            }
          })
          onClose()
        }}
      >
        {/* Plantillas de 1 clic */}
        {!isEdit && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="mb-2 text-[11px] font-extrabold tracking-wider text-emerald-900 uppercase">
              ⚡ Plantillas rápidas de 1 clic (Autorrellenar ejemplo)
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cat: 'HERRAMIENTA',
                    nombre: 'Set Destornilladores de Precisión Magnéticos (64 Puntas)',
                    marca: 'iFixit / Xiaomi Wiha Pro Tech',
                    desc: 'Puntas Torx, Phillips, Pentalobe y Hex para notebooks y PCs.',
                    stock: 2,
                    unidad: 'sets',
                    costo: 39990,
                    ubicacion: 'Banco de Trabajo 1 · Laboratorio PCG',
                  })
                }
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-bold text-violet-800 hover:bg-violet-50"
              >
                🪛 Destornilladores Precisión
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cat: 'HERRAMIENTA',
                    nombre: 'Destornillador Eléctrico Inalámbrico USB-C',
                    marca: 'Xiaomi Mijia / Hoto Precision',
                    desc: 'Motorizado con luz LED y control de torque para desarme rápido.',
                    stock: 1,
                    unidad: 'unidades',
                    costo: 34990,
                    ubicacion: 'Maletín Terreno Corporativo',
                  })
                }
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-bold text-violet-800 hover:bg-violet-50"
              >
                ⚡ Destornillador Eléctrico
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cat: 'LICENCIA_SOFTWARE',
                    nombre: 'Licencia Microsoft Office 2024 Pro Plus LTSC',
                    marca: 'Microsoft Corp · Word, Excel, PowerPoint, Outlook',
                    desc: 'Bolsa de activaciones corporativas para clientes de mantención.',
                    stock: 10,
                    unidad: 'activaciones',
                    costo: 14900,
                    pvp: 25000,
                    ubicacion: 'Bóveda Digital PCG',
                    clave: 'OFF24-9K8M2-V7X4P-3Q2W1-PCG26',
                    tipoLic: 'VOLUMEN_CORPORATIVO',
                  })
                }
                className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-50"
              >
                💿 Licencia Office Pro Plus
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cat: 'LICENCIA_SOFTWARE',
                    nombre: 'Licencias Antivirus Avast Business ProPlus (1 Año)',
                    marca: 'Avast Business Cloud Security',
                    desc: 'Protección Endpoint y Ransomware para equipos de clientes.',
                    stock: 15,
                    unidad: 'licencias',
                    costo: 8900,
                    pvp: 18000,
                    ubicacion: 'Consola Avast Cloud',
                    clave: 'AVAST-PRO-2026-K91M-PCG88',
                    tipoLic: 'SUSCRIPCION_ANUAL',
                  })
                }
                className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-50"
              >
                🛡️ Licencia Antivirus
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cat: 'LICENCIA_SOFTWARE',
                    nombre: 'Licencia Windows 11 Pro 64-bit OEM / Retail',
                    marca: 'Microsoft Windows 11 Professional',
                    desc: 'Claves originales para formateo e instalación limpia.',
                    stock: 10,
                    unidad: 'claves',
                    costo: 12000,
                    pvp: 25000,
                    ubicacion: 'Bóveda Digital PCG',
                    clave: 'WIN11-PRO88-77K2M-X9V4P-PCG01',
                    tipoLic: 'OEM_RETAIL',
                  })
                }
                className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-50"
              >
                🪟 Licencia Windows 11 Pro
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cat: 'REPUESTO',
                    nombre: 'Disco SSD NVMe M.2 1TB PCIe 4.0',
                    marca: 'Kingston NV2 / WD Blue SN580',
                    desc: 'Almacenamiento ultrarrápido para upgrades de notebooks y PCs.',
                    stock: 5,
                    unidad: 'unidades',
                    costo: 56000,
                    pvp: 79990,
                    ubicacion: 'Estante Repuestos A1 · Bodega',
                  })
                }
                className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-50"
              >
                💾 SSD NVMe 1TB
              </button>
            </div>
          </div>
        )}

        {/* Selector de Categoría */}
        <div>
          <div className="mb-1.5 text-xs font-bold text-slate-700">Categoría de Inventario</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(CATEGORIA_INV_META) as CategoriaInventario[])
              .filter((cat) => cat !== 'LICENCIA')
              .map((cat) => {
              const m = CATEGORIA_INV_META[cat]
              const active = categoria === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleChangeCategoria(cat)}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white',
                  )}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="truncate">{m.short}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Código SKU">
            <input className={inputCls} value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          </Field>
          <div className="sm:col-span-3">
            <Field
              label={
                categoria === 'HERRAMIENTA'
                  ? 'Nombre de la Herramienta (Ej: Destornillador precisión iFixit)'
                  : categoria === 'LICENCIA_SOFTWARE'
                    ? 'Nombre del Software / Licencia (Ej: Microsoft Office 2021 Pro Plus)'
                    : 'Nombre del Repuesto o Insumo'
              }
            >
              <input
                className={inputCls}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Kit Destornilladores Precisión 64 puntas / Licencia Office Pro Plus"
                required
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Marca / Modelo / Especificación">
            <input
              className={inputCls}
              value={marcaModelo}
              onChange={(e) => setMarcaModelo(e.target.value)}
              placeholder="Ej: iFixit Pro Tech / Microsoft Corp / Kingston NV2"
              required
            />
          </Field>
          <Field label="Descripción o uso en PCG SPA">
            <input
              className={inputCls}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Apertura de notebooks de clientes / Licencias para convenios"
            />
          </Field>
        </div>

        {/* Bloque exclusivo si es LICENCIA_SOFTWARE */}
        {categoria === 'LICENCIA_SOFTWARE' && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 space-y-3">
            <div className="text-xs font-extrabold tracking-wider text-sky-900 uppercase">
              💿 Datos de la Licencia de Software (Clave Serial, Cuenta y Vencimiento)
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tipo de Licencia">
                <select
                  className={inputCls}
                  value={tipoLicencia}
                  onChange={(e) => setTipoLicencia(e.target.value as TipoLicenciaSoftware)}
                >
                  <option value="VOLUMEN_CORPORATIVO">Volumen Corporativo (Múltiples cupos)</option>
                  <option value="SUSCRIPCION_ANUAL">Suscripción Anual / Cloud</option>
                  <option value="OEM_RETAIL">Clave OEM / Retail</option>
                  <option value="PERPETUA">Licencia Perpetua</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Clave de Producto / Serial Key (XXXX-XXXX-XXXX)">
                  <input
                    className={cx(inputCls, 'font-mono font-bold')}
                    value={claveLicencia}
                    onChange={(e) => setClaveLicencia(e.target.value)}
                    placeholder="Ej: XM2V9-8N7K4-P3Q2W-9R6T5-PCG21"
                  />
                </Field>
              </div>
              <Field label="Correo / Cuenta Administradora">
                <input
                  className={inputCls}
                  value={cuentaAsociada}
                  onChange={(e) => setCuentaAsociada(e.target.value)}
                  placeholder="serviciotecnicopcg@gmail.com"
                />
              </Field>
              <Field label="Fecha de Vencimiento / Renovación">
                <input
                  type="date"
                  className={inputCls}
                  value={fechaVencimientoLicencia}
                  onChange={(e) => setFechaVencimientoLicencia(e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Cantidades, Stock y Costos */}
        <div className="grid gap-3 sm:grid-cols-5">
          <Field label={categoria === 'LICENCIA_SOFTWARE' ? 'Cupos Totales Comprados' : 'Cantidad / Stock Actual'}>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={stockActual}
              onChange={(e) => setStockActual(Number(e.target.value))}
              required
            />
          </Field>
          <Field label={categoria === 'LICENCIA_SOFTWARE' ? 'Cupos Ya Activados' : 'Unidades en Uso'}>
            <input
              type="number"
              min={0}
              max={stockActual}
              className={inputCls}
              value={enUso}
              onChange={(e) => setEnUso(Number(e.target.value))}
            />
          </Field>
          <Field label="Alerta Stock Mínimo">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={stockMinimo}
              onChange={(e) => setStockMinimo(Number(e.target.value))}
            />
          </Field>
          <Field label="Unidad de medida">
            <input
              className={inputCls}
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              placeholder="unidades, kits, activaciones..."
            />
          </Field>
          <Field label="Costo Unitario ($ CLP)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={costoUnitario}
              onChange={(e) => setCostoUnitario(Number(e.target.value))}
              required
            />
          </Field>
        </div>

        {/* Ubicación, Responsable y Proveedor */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Ubicación física o digital">
            <input
              className={inputCls}
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej: Banco de Trabajo 1 / Maletín Terreno"
            />
          </Field>
          <Field label="Trabajador Responsable / Asignado">
            <select
              className={inputCls}
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
            >
              <option value="">— Taller General PCG —</option>
              {staff.map((u) => {
                const dev = isAptoDesarrollador(u) ? ' · 💻 Apto Web/Dev' : ''
                const tec = isAptoTecnico(u) ? ' · 🛠️ Técnico' : ''
                return (
                  <option key={u.id} value={String(u.id)}>
                    {u.nombre} ({u.rolEtiqueta ?? u.cargo}){dev}{tec}
                  </option>
                )
              })}
            </select>
          </Field>
          {categoria !== 'LICENCIA_SOFTWARE' ? (
            <Field label="Estado Físico">
              <select
                className={inputCls}
                value={estadoFisico}
                onChange={(e) => setEstadoFisico(e.target.value as EstadoHerramienta)}
              >
                <option value="OPERATIVO">✓ Operativo en Taller</option>
                <option value="EN_TERRENO">🚗 En Terreno / Maletín</option>
                <option value="MANTENCION">🔧 En Calibración / Mantención</option>
                <option value="BAJA">✕ De Baja</option>
              </select>
            </Field>
          ) : (
            <Field label="Precio Venta Sugerido ($ CLP)">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={precioVentaSugerido}
                onChange={(e) => setPrecioVentaSugerido(Number(e.target.value))}
              />
            </Field>
          )}
          <Field label="Proveedor / Tienda">
            <input
              className={inputCls}
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Ej: PC Factory / Sodimac / Tecnoglobal"
            />
          </Field>
        </div>

        {/* Conexión automática con Finanzas al registrar compra nueva */}
        {!isEdit && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-slate-800">
                <input
                  type="checkbox"
                  checked={registrarEnFinanzas}
                  onChange={(e) => setRegistrarEnFinanzas(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                <span>
                  💸 Registrar también esta compra en Finanzas / Libro de Caja (-{fmtCLP(totalCompra)})
                </span>
              </label>
              {registrarEnFinanzas && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={cx(inputCls, 'w-36 py-1 text-xs')}
                    placeholder="Nº Factura/Boleta"
                    value={nroFacturaCompra}
                    onChange={(e) => setNroFacturaCompra(e.target.value)}
                  />
                  <select
                    className={cx(inputCls, 'w-40 py-1 text-xs')}
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  >
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="EFECTIVO">Efectivo</option>
                  </select>
                  <input
                    type="date"
                    className={cx(inputCls, 'w-36 py-1 text-xs')}
                    value={fechaUltimaCompra}
                    onChange={(e) => setFechaUltimaCompra(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant="primary">
            {isEdit ? 'Guardar Cambios en Inventario' : 'Guardar en Inventario'}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

/* ============================================================================
   MODAL REPONER STOCK / COMPRAR MÁS UNIDADES (CONECTADO CON FINANZAS)
   ============================================================================ */
function ModalReponerStock({
  item,
  onClose,
}: {
  item: ItemInventario
  onClose: () => void
}) {
  const { mutate } = useStore()
  const [cantidadSumar, setCantidadSumar] = useState(2)
  const [costoUnitario, setCostoUnitario] = useState(item.costoUnitario)
  const [proveedor, setProveedor] = useState(item.proveedor)
  const [nroDocumento, setNroDocumento] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('TRANSFERENCIA')
  const [registrarCaja, setRegistrarCaja] = useState(true)

  const totalCompra = Math.max(0, Number(cantidadSumar) * Number(costoUnitario))

  return (
    <Modal
      open
      onClose={onClose}
      title={`📥 Comprar / Reponer Stock: ${item.nombre}`}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          mutate((d) => {
            const target = d.inventario?.find((x) => x.id === item.id)
            if (!target) return
            target.stockActual += Number(cantidadSumar) || 0
            target.costoUnitario = Number(costoUnitario) || target.costoUnitario
            target.proveedor = proveedor.trim() || target.proveedor
            target.fechaUltimaCompra = today()
            if (nroDocumento.trim()) target.nroFacturaCompra = nroDocumento.trim()

            if (registrarCaja && totalCompra > 0) {
              const meta = getCategoriaMeta(target.categoria)
              d.movimientos.push({
                id: nextId(d.movimientos),
                fecha: today(),
                tipo: 'EGRESO',
                rubro: meta.rubroCaja,
                categoria: meta.label,
                itemComprado: target.nombre,
                cantidad: Number(cantidadSumar) || 1,
                concepto: `Reposición Inventario (${target.codigo}): +${cantidadSumar} ${target.unidad} de ${target.nombre}`,
                contraparte: target.proveedor,
                monto: totalCompra,
                metodo,
                nroDocumento: nroDocumento.trim() || undefined,
                conciliadoBanco: metodo !== 'EFECTIVO',
              })
            }
          })
          onClose()
        }}
      >
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          Stock actual: <strong className="text-slate-900">{item.stockActual} {item.unidad}</strong> · Luego de esta compra quedará en{' '}
          <strong className="text-emerald-700">{item.stockActual + Number(cantidadSumar)} {item.unidad}</strong>.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Cantidad a sumar (${item.unidad})`}>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={cantidadSumar}
              onChange={(e) => setCantidadSumar(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Costo Unitario de Compra ($ CLP)">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={costoUnitario}
              onChange={(e) => setCostoUnitario(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Proveedor">
            <input
              className={inputCls}
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              required
            />
          </Field>
          <Field label="Nº Factura / Boleta">
            <input
              className={inputCls}
              value={nroDocumento}
              onChange={(e) => setNroDocumento(e.target.value)}
              placeholder="Ej: FAC-90211"
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800">
          <input
            type="checkbox"
            checked={registrarCaja}
            onChange={(e) => setRegistrarCaja(e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-600"
          />
          <span>
            Descontar de Caja en Finanzas (-{fmtCLP(totalCompra)}) como {getCategoriaMeta(item.categoria).short}
          </span>
        </label>

        {registrarCaja && (
          <Field label="Método de Pago">
            <select
              className={inputCls}
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago)}
            >
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="TARJETA">Tarjeta Débito / Crédito</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant="primary">
            Sumar +{cantidadSumar} {item.unidad} ({fmtCLP(totalCompra)})
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

/* ============================================================================
   MODAL ASIGNAR ACTIVACIÓN DE LICENCIA A CLIENTE / EQUIPO
   ============================================================================ */
function ModalAsignarLicenciaCliente({
  item,
  onClose,
}: {
  item: ItemInventario
  onClose: () => void
}) {
  const { db, mutate } = useStore()
  const [clienteTexto, setClienteTexto] = useState('')
  const [cuposAsignar, setCuposAsignar] = useState(1)

  const libres = Math.max(0, item.stockActual - (item.enUso ?? 0))

  return (
    <Modal
      open
      onClose={onClose}
      title={`💿 Asignar Licencia a Cliente / Equipo: ${item.nombre}`}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!clienteTexto.trim()) return
          mutate((d) => {
            const target = d.inventario?.find((x) => x.id === item.id)
            if (!target) return
            const n = Math.max(1, Number(cuposAsignar) || 1)
            target.enUso = Math.min(target.stockActual, (target.enUso ?? 0) + n)
            if (!target.asignadoAClientes) target.asignadoAClientes = []
            target.asignadoAClientes.push(`${clienteTexto.trim()} (${n} eq.)`)
          })
          onClose()
        }}
      >
        <div className="rounded-xl bg-sky-50 p-3 text-xs text-sky-900">
          Clave: <strong className="font-mono">{item.claveLicencia ?? 'S/N'}</strong> · Disponibles:{' '}
          <strong>{libres} activación(es)</strong>.
        </div>

        <Field label="Seleccionar rápido de Cartera o escribir Cliente / Equipo">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {db.empresas.slice(0, 5).map((em) => (
              <button
                key={em.id}
                type="button"
                onClick={() => setClienteTexto(em.razonSocial)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                🏢 {em.razonSocial}
              </button>
            ))}
          </div>
          <input
            className={inputCls}
            value={clienteTexto}
            onChange={(e) => setClienteTexto(e.target.value)}
            placeholder="Ej: Constructora Andes SpA — Notebook Contabilidad CAN-003"
            required
          />
        </Field>

        <Field label="Cantidad de activaciones / equipos a ocupar">
          <input
            type="number"
            min={1}
            max={Math.max(1, libres)}
            className={inputCls}
            value={cuposAsignar}
            onChange={(e) => setCuposAsignar(Number(e.target.value))}
            required
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant="primary" disabled={libres <= 0}>
            Registrar Activación
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

/* ============================================================================
   MODAL CREAR / EDITAR PROYECTO DE PÁGINA WEB, MANTENCIÓN WEB O SOFTWARE A MEDIDA
   ============================================================================ */
export function ModalProyectoWebSoftware({
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
    proyecto?.nombreProyecto ?? 'Sitio Web Corporativo + Formulario y SEO',
  )
  const [urlDominio, setUrlDominio] = useState(
    proyecto?.urlDominio ?? 'https://www.cliente.cl',
  )
  const [stackTecnologico, setStackTecnologico] = useState(
    proyecto?.stackTecnologico ?? 'React + Next.js + Tailwind + SSL',
  )
  const [hostingProveedor, setHostingProveedor] = useState(
    proyecto?.hostingProveedor ?? 'Hosting Cloud PCG / NIC Chile (.cl)',
  )
  const [incluyeMantencionWeb, setIncluyeMantencionWeb] = useState(
    proyecto?.incluyeMantencionWeb ?? true,
  )
  const [planMantencion, setPlanMantencion] = useState<
    'SIN_MENSUALIDAD' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
  >(proyecto?.planMantencion ?? 'MENSUAL')
  const [valorProyecto, setValorProyecto] = useState(proyecto?.valorProyecto ?? 280000)
  const [valorMantencion, setValorMantencion] = useState(proyecto?.valorMantencion ?? 35000)
  const [fechaInicio, setFechaInicio] = useState(proyecto?.fechaInicio ?? today())
  const [proximaMantencionWeb, setProximaMantencionWeb] = useState(
    proyecto?.proximaMantencionWeb ?? addDays(today(), 30),
  )
  const [vencimientoDominioHosting, setVencimientoDominioHosting] = useState(
    proyecto?.vencimientoDominioHosting ?? addDays(today(), 365),
  )
  const [estado, setEstado] = useState<EstadoProyectoWeb>(
    proyecto?.estado ?? 'MANTENCION_ACTIVA',
  )
  const [responsableId, setResponsableId] = useState<string>(
    String(proyecto?.responsableId ?? 1),
  )
  const [notas, setNotas] = useState(proyecto?.notas ?? '')
  const [registrarIngresoCaja, setRegistrarIngresoCaja] = useState(!isEdit)

  const handleSelectEmpresa = (idStr: string) => {
    setEmpresaId(idStr)
    const em = db.empresas.find((x) => String(x.id) === idStr)
    if (em) {
      setClienteNombre(em.razonSocial)
      const slug = em.razonSocial
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 18)
      if (!isEdit) {
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
          ? `🌐 Editar Página Web / Software: ${proyecto.clienteNombre}`
          : '🌐 Registrar Venta de Página Web, Mantención Web o Software con Cliente'
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
                `${tipo === 'SOFTWARE_A_MEDIDA' ? 'SOFT' : 'WEB'}-2026-${String(d.proyectosWeb.length + 1).padStart(3, '0')}`,
              empresaId: emp?.id,
              usuarioId: emp?.contactoId,
              clienteNombre: clienteNombre.trim() || emp?.razonSocial || 'Cliente',
              tipo,
              nombreProyecto: nombreProyecto.trim(),
              urlDominio: urlDominio.trim(),
              stackTecnologico: stackTecnologico.trim(),
              hostingProveedor: hostingProveedor.trim(),
              incluyeMantencionWeb: planMantencion !== 'SIN_MENSUALIDAD' && incluyeMantencionWeb,
              planMantencion: planMantencion,
              valorProyecto: Number(valorProyecto) || 0,
              valorMantencion:
                planMantencion === 'SIN_MENSUALIDAD' || !incluyeMantencionWeb
                  ? 0
                  : Number(valorMantencion) || 0,
              fechaInicio,
              proximaMantencionWeb: incluyeMantencionWeb ? proximaMantencionWeb : undefined,
              vencimientoDominioHosting,
              estado,
              responsableId: Number(responsableId) || 1,
              participantesIds: proyecto?.participantesIds ?? [Number(responsableId) || 1],
              modalidadEjecucion: proyecto?.modalidadEjecucion ?? 'SOLO_PCG',
              empresaExterna: proyecto?.empresaExterna,
              notas: notas.trim() || undefined,
            }

            if (isEdit) {
              const idx = d.proyectosWeb.findIndex((x) => x.id === proyecto.id)
              if (idx >= 0) d.proyectosWeb[idx] = payload
            } else {
              d.proyectosWeb.unshift(payload)
              if (registrarIngresoCaja && payload.valorProyecto > 0) {
                d.movimientos.push({
                  id: nextId(d.movimientos),
                  fecha: fechaInicio,
                  tipo: 'INGRESO',
                  rubro: 'INGRESO_OT',
                  categoria: 'Desarrollo Web & Software',
                  concepto: `Venta ${TIPO_PROYECTO_WEB_META[tipo].short} (${payload.codigo}): ${payload.nombreProyecto}`,
                  contraparte: payload.clienteNombre,
                  monto: payload.valorProyecto,
                  metodo: 'TRANSFERENCIA',
                  conciliadoBanco: true,
                })
              }
            }
          })
          onClose()
        }}
      >
        {/* Plantillas de 1 clic para Proyectos Web / Software */}
        {!isEdit && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="mb-1.5 text-[11px] font-extrabold tracking-wider text-emerald-900 uppercase">
              ⚡ Plantillas rápidas de Proyectos Web y Software
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTipo('PAGINA_WEB_CORPORATIVA')
                  setNombreProyecto('Sitio Web Corporativo + Correo Empresas + SEO Google')
                  setStackTecnologico('React + Next.js + Tailwind + SSL')
                  setValorProyecto(280000)
                  setIncluyeMantencionWeb(true)
                  setValorMantencion(35000)
                }}
                className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                🌐 Página Web Corporativa + Mantención ($280k + $35k/mes)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('TIENDA_ECOMMERCE')
                  setNombreProyecto('Tienda E-Commerce / Catálogo Online + Pasarela Webpay')
                  setStackTecnologico('Next.js / WooCommerce + Webpay Plus + SSL')
                  setValorProyecto(450000)
                  setIncluyeMantencionWeb(true)
                  setValorMantencion(45000)
                }}
                className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-50"
              >
                🛒 Tienda E-Commerce + Mantención ($450k + $45k/mes)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('MANTENCION_WEB')
                  setNombreProyecto('Plan Mantención Mensual de Página Web, Hosting y Backups')
                  setStackTecnologico('Actualizaciones, Seguridad SSL, Respaldo Cloud y Uptime')
                  setValorProyecto(45000)
                  setIncluyeMantencionWeb(true)
                  setValorMantencion(35000)
                }}
                className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-50"
              >
                🔧 Solo Plan Mantención de Página Web ($35k/mes)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('SOFTWARE_A_MEDIDA')
                  setNombreProyecto('Sistema / Software Web a Medida (Gestión / Intranet / Portal)')
                  setStackTecnologico('React + TypeScript + Node.js + PostgreSQL')
                  setValorProyecto(750000)
                  setIncluyeMantencionWeb(true)
                  setPlanMantencion('SEMESTRAL')
                  setValorMantencion(120000)
                }}
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-bold text-violet-800 hover:bg-violet-50"
              >
                💻 Software / Sistema a Medida ($750k)
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Vincular a Empresa de tu Cartera (opcional)">
            <select
              className={inputCls}
              value={empresaId}
              onChange={(e) => handleSelectEmpresa(e.target.value)}
            >
              <option value="">— Cliente Particular / Escribir abajo —</option>
              {db.empresas.map((em) => (
                <option key={em.id} value={String(em.id)}>
                  {em.razonSocial} ({em.rut})
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nombre del Cliente o Empresa">
              <input
                className={inputCls}
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej: Constructora Andes SpA o Cliente Particular"
                required
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tipo de Servicio Web / Software">
            <select
              className={inputCls}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoProyectoWeb)}
            >
              <option value="PAGINA_WEB_CORPORATIVA">🌐 Página Web Corporativa</option>
              <option value="TIENDA_ECOMMERCE">🛒 Tienda E-Commerce / Catálogo</option>
              <option value="LANDING_PAGE">🚀 Landing Page Comercial</option>
              <option value="MANTENCION_WEB">🔧 Mantención de Página Web</option>
              <option value="SOFTWARE_A_MEDIDA">💻 Software / Sistema a Medida</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nombre del Proyecto / Sitio Web / Sistema">
              <input
                className={inputCls}
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                required
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Dominio / URL del Sitio o Sistema">
            <input
              className={cx(inputCls, 'font-mono')}
              value={urlDominio}
              onChange={(e) => setUrlDominio(e.target.value)}
              placeholder="https://www.cliente.cl"
              required
            />
          </Field>
          <Field label="Stack Tecnológico / Plataforma">
            <input
              className={inputCls}
              value={stackTecnologico}
              onChange={(e) => setStackTecnologico(e.target.value)}
              placeholder="React, Next.js, WordPress, Node.js..."
            />
          </Field>
          <Field label="Hosting y Proveedor de Dominio">
            <input
              className={inputCls}
              value={hostingProveedor}
              onChange={(e) => setHostingProveedor(e.target.value)}
              placeholder="VPS PCG / NIC Chile (.cl)"
            />
          </Field>
        </div>

        {/* Plan de Mantención Web */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5 space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-sky-950">
            <input
              type="checkbox"
              checked={incluyeMantencionWeb}
              onChange={(e) => setIncluyeMantencionWeb(e.target.checked)}
              className="h-4 w-4 rounded accent-sky-600"
            />
            <span>🔧 Este cliente tiene contratada Mantención de Página Web / Soporte de Software con PCG SPA</span>
          </label>

          {incluyeMantencionWeb && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Periodicidad Mantención Web">
                <select
                  className={inputCls}
                  value={planMantencion}
                  onChange={(e) => {
                    const val = e.target.value as 'SIN_MENSUALIDAD' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
                    setPlanMantencion(val)
                    if (val === 'SIN_MENSUALIDAD') {
                      setIncluyeMantencionWeb(false)
                      setValorMantencion(0)
                    } else {
                      setIncluyeMantencionWeb(true)
                      if (!valorMantencion) setValorMantencion(35000)
                    }
                  }}
                >
                  <option value="SIN_MENSUALIDAD">📦 Solo venta del sistema (Sin mensualidad)</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </Field>
              <Field label="Valor Mantención Web ($ CLP)">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={valorMantencion}
                  onChange={(e) => setValorMantencion(Number(e.target.value))}
                />
              </Field>
              <Field label="Fecha Próxima Mantención Web">
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

        <div className="grid gap-3 sm:grid-cols-5">
          <Field label="Fecha de inicio / venta">
            <input
              type="date"
              className={inputCls}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </Field>
          <Field label="Valor Venta Proyecto ($ CLP)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={valorProyecto}
              onChange={(e) => setValorProyecto(Number(e.target.value))}
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
          <Field label="Estado Actual">
            <select
              className={inputCls}
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoProyectoWeb)}
            >
              <option value="EN_DESARROLLO">🛠️ En Desarrollo / QA</option>
              <option value="PRODUCCION_ACTIVO">🚀 En Producción (Online)</option>
              <option value="MANTENCION_ACTIVA">⚡ Con Mantención Web Activa</option>
              <option value="PENDIENTE_RENOVACION">⚠️ Pendiente Renovación</option>
              <option value="PAUSADO">⏸️ Pausado</option>
            </select>
          </Field>
          <Field label="Responsable PCG">
            <select
              className={inputCls}
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
            >
              {staff.map((u) => {
                const dev = isAptoDesarrollador(u) ? ' · 💻 Apto Web/Dev' : ''
                const tec = isAptoTecnico(u) ? ' · 🛠️ Técnico' : ''
                return (
                  <option key={u.id} value={String(u.id)}>
                    {u.nombre} ({u.rolEtiqueta ?? u.cargo}){dev}{tec}
                  </option>
                )
              })}
            </select>
          </Field>
        </div>

        <Field label="Notas técnicas ( Accesos, CMS, Requerimientos de mantención )">
          <input
            className={inputCls}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Incluye actualización de catálogo mensual, renovación NIC.cl y respaldos semanales"
          />
        </Field>

        {!isEdit && (
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={registrarIngresoCaja}
              onChange={(e) => setRegistrarIngresoCaja(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600"
            />
            <span>
              💰 Registrar cobro del proyecto en Finanzas / Libro de Caja (+{fmtCLP(valorProyecto)})
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant="primary">
            {isEdit ? 'Guardar Cambios del Proyecto Web' : 'Guardar Proyecto Web / Software'}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
