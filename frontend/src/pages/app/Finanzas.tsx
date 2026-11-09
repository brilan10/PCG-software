import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import type {
  DireccionFactura,
  FacturaCuenta,
  MetodoPago,
  MovimientoCaja,
  RubroMovimiento,
  TipoDocFactura,
} from '@/lib/types'
import { addDays, diffDays, fmtCLP, fmtFecha, nextId, today } from '@/lib/util'
import { Badge, Btn, Card, Empty, Field, Kpi, Modal, Table, cx, inputCls, td } from '@/components/kit'
import {
  AnimatedNumber,
  AnimatedPillTabs,
  BackgroundBeamsHeader,
  MovingBorderBtn,
  SpotlightCard,
} from '@/components/aceternity'

const daysUntil = (fecha: string) => diffDays(fecha, today())

type TabFinanzas = 'CAJA' | 'COBRAR' | 'PAGAR' | 'SALDOS' | 'BANCO'

const TIPO_DOC_LABEL: Record<TipoDocFactura, string> = {
  FACTURA_AFECTA: 'Factura Afecta (19% IVA)',
  FACTURA_EXENTA: 'Factura Exenta',
  BOLETA: 'Boleta Electrónica',
  NOTA_COBRO: 'Nota de Cobro / OT',
  PROVEEDOR: 'Factura Proveedor',
}

export const RUBRO_META: Record<
  RubroMovimiento,
  { label: string; short: string; icon: string; tone: 'blue' | 'violet' | 'amber' | 'green' | 'red' | 'slate'; colorBar: string }
> = {
  EQUIPOS: {
    label: 'Compra de Equipos / Computadores',
    short: 'Equipos / PC',
    icon: '💻',
    tone: 'blue',
    colorBar: 'bg-sky-500',
  },
  HERRAMIENTAS: {
    label: 'Herramientas de Taller y Laboratorio',
    short: 'Herramientas',
    icon: '🛠️',
    tone: 'violet',
    colorBar: 'bg-violet-500',
  },
  REPUESTOS: {
    label: 'Repuestos y Componentes (SSD, RAM, Fuentes)',
    short: 'Repuestos',
    icon: '🔩',
    tone: 'amber',
    colorBar: 'bg-amber-500',
  },
  INSUMOS: {
    label: 'Insumos (Pasta térmica, Limpieza, Cables)',
    short: 'Insumos',
    icon: '🧴',
    tone: 'blue',
    colorBar: 'bg-teal-500',
  },
  SOFTWARE: {
    label: 'Software y Licencias (Office, Antivirus)',
    short: 'Licencias',
    icon: '💿',
    tone: 'slate',
    colorBar: 'bg-indigo-500',
  },
  OPERACION: {
    label: 'Gastos Operacionales (Internet, Arriendo, Transporte)',
    short: 'Operación',
    icon: '🏢',
    tone: 'red',
    colorBar: 'bg-rose-500',
  },
  INGRESO_OT: {
    label: 'Ingreso por Orden de Trabajo / Taller',
    short: 'Ingreso OT',
    icon: '🔧',
    tone: 'green',
    colorBar: 'bg-emerald-500',
  },
  INGRESO_CONVENIO: {
    label: 'Ingreso Convenio Corporativo B2B',
    short: 'Convenio B2B',
    icon: '🤝',
    tone: 'green',
    colorBar: 'bg-emerald-600',
  },
  CAPITAL: {
    label: 'Capital Operativo / Saldo Inicial',
    short: 'Capital',
    icon: '🏦',
    tone: 'green',
    colorBar: 'bg-teal-600',
  },
}

/** Infiere el rubro si un movimiento antiguo no tenía el campo `rubro` definido */
function resolveRubro(m: MovimientoCaja): RubroMovimiento {
  if (m.rubro) return m.rubro
  const text = `${m.categoria} ${m.concepto} ${m.itemComprado ?? ''}`.toLowerCase()
  if (m.tipo === 'INGRESO') {
    if (text.includes('convenio')) return 'INGRESO_CONVENIO'
    if (text.includes('capital') || text.includes('inicial')) return 'CAPITAL'
    return 'INGRESO_OT'
  }
  if (text.includes('herramienta') || text.includes('soldadura') || text.includes('multímetro') || text.includes('ifixit') || text.includes('soplador')) {
    return 'HERRAMIENTAS'
  }
  if (text.includes('notebook') || text.includes('laptop') || text.includes('monitor') || text.includes('pc ') || text.includes('compra de equipo')) {
    return 'EQUIPOS'
  }
  if (text.includes('pasta') || text.includes('alcohol') || text.includes('insumo') || text.includes('limpieza')) {
    return 'INSUMOS'
  }
  if (text.includes('licencia') || text.includes('office') || text.includes('antivirus') || text.includes('software')) {
    return 'SOFTWARE'
  }
  if (text.includes('ssd') || text.includes('ram') || text.includes('repuesto') || text.includes('fuente') || text.includes('hardware')) {
    return 'REPUESTOS'
  }
  return 'OPERACION'
}

export default function FinanzasPage() {
  const { db, user, mutate } = useStore()
  const isClient = user?.rol === 'CLIENTE_EMPRESA' || user?.rol === 'CLIENTE_PERSONA'

  const [tab, setTab] = useState<TabFinanzas>(isClient ? 'COBRAR' : 'CAJA')
  const [filtroEstado, setFiltroEstado] = useState<'TODAS' | 'CON_DEUDA' | 'VENCIDAS' | 'PAGADAS'>('TODAS')
  const [busqueda, setBusqueda] = useState('')

  // Filtros avanzados para Compras y Libro de Caja
  const [filtroTipoMov, setFiltroTipoMov] = useState<'TODOS' | 'EGRESO' | 'INGRESO'>('TODOS')
  const [filtroRubro, setFiltroRubro] = useState<'TODOS' | RubroMovimiento>('TODOS')
  const [filtroMetodo, setFiltroMetodo] = useState<'TODOS' | MetodoPago>('TODOS')
  const [filtroPeriodo, setFiltroPeriodo] = useState<'TODOS' | '7D' | '15D' | '30D'>('TODOS')
  const [busquedaCaja, setBusquedaCaja] = useState('')

  // Modales
  const [modalNuevaFactura, setModalNuevaFactura] = useState<DireccionFactura | null>(null)
  const [modalAbonoFactura, setModalAbonoFactura] = useState<FacturaCuenta | null>(null)
  const [modalMovimiento, setModalMovimiento] = useState<{ tipoInicial: 'INGRESO' | 'EGRESO'; rubroInicial?: RubroMovimiento } | null>(null)
  const [syncingBank, setSyncingBank] = useState(false)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  // Facturas visibles según rol
  const facturasVisibles = useMemo(() => {
    const list = db.facturas ?? []
    if (user?.rol === 'CLIENTE_EMPRESA') {
      return list.filter((f) => f.direccion === 'POR_COBRAR' && f.empresaId === user.empresaId)
    }
    if (user?.rol === 'CLIENTE_PERSONA') {
      return list.filter((f) => f.direccion === 'POR_COBRAR' && f.usuarioId === user.id)
    }
    return list
  }, [db.facturas, user])

  const movimientos = db.movimientos ?? []

  // Cálculos financieros globales + desglose por rubro de compra
  const kpis = useMemo(() => {
    const totalIngresos = movimientos
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + m.monto, 0)
    const totalEgresos = movimientos
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((acc, m) => acc + m.monto, 0)
    const cajaActual = totalIngresos - totalEgresos

    const gastoEquipos = movimientos
      .filter((m) => m.tipo === 'EGRESO' && resolveRubro(m) === 'EQUIPOS')
      .reduce((acc, m) => acc + m.monto, 0)
    const gastoHerramientas = movimientos
      .filter((m) => m.tipo === 'EGRESO' && resolveRubro(m) === 'HERRAMIENTAS')
      .reduce((acc, m) => acc + m.monto, 0)
    const gastoRepuestos = movimientos
      .filter((m) => m.tipo === 'EGRESO' && resolveRubro(m) === 'REPUESTOS')
      .reduce((acc, m) => acc + m.monto, 0)
    const gastoInsumosOp = movimientos
      .filter((m) => m.tipo === 'EGRESO' && ['INSUMOS', 'SOFTWARE', 'OPERACION'].includes(resolveRubro(m)))
      .reduce((acc, m) => acc + m.monto, 0)

    const porCobrarList = facturasVisibles.filter((f) => f.direccion === 'POR_COBRAR' && f.estado !== 'ANULADA')
    const porPagarList = facturasVisibles.filter((f) => f.direccion === 'POR_PAGAR' && f.estado !== 'ANULADA')

    const meDebenTotal = porCobrarList.reduce((acc, f) => acc + Math.max(0, f.montoTotal - f.montoPagado), 0)
    const deboPagarTotal = porPagarList.reduce((acc, f) => acc + Math.max(0, f.montoTotal - f.montoPagado), 0)

    const facturasPorCobrarAbiertas = porCobrarList.filter((f) => f.montoTotal > f.montoPagado)
    const facturasPorPagarAbiertas = porPagarList.filter((f) => f.montoTotal > f.montoPagado)

    const cobrarVencidas = facturasPorCobrarAbiertas.filter((f) => daysUntil(f.fechaVencimiento) < 0)
    const pagarVencidas = facturasPorPagarAbiertas.filter((f) => daysUntil(f.fechaVencimiento) < 0)

    const proyectado = cajaActual + meDebenTotal - deboPagarTotal

    return {
      totalIngresos,
      totalEgresos,
      cajaActual,
      gastoEquipos,
      gastoHerramientas,
      gastoRepuestos,
      gastoInsumosOp,
      meDebenTotal,
      deboPagarTotal,
      facturasPorCobrarAbiertas: facturasPorCobrarAbiertas.length,
      facturasPorPagarAbiertas: facturasPorPagarAbiertas.length,
      cobrarVencidas: cobrarVencidas.length,
      pagarVencidas: pagarVencidas.length,
      proyectado,
    }
  }, [facturasVisibles, movimientos])

  // Movimientos filtrados según los filtros de análisis
  const movimientosFiltrados = useMemo(() => {
    const hoyStr = today()
    return [...movimientos]
      .filter((m) => {
        if (filtroTipoMov !== 'TODOS' && m.tipo !== filtroTipoMov) return false
        const r = resolveRubro(m)
        if (filtroRubro !== 'TODOS' && r !== filtroRubro) return false
        if (filtroMetodo !== 'TODOS' && m.metodo !== filtroMetodo) return false
        if (filtroPeriodo !== 'TODOS') {
          const diasAtras = Math.abs(diffDays(hoyStr, m.fecha))
          if (filtroPeriodo === '7D' && diasAtras > 7) return false
          if (filtroPeriodo === '15D' && diasAtras > 15) return false
          if (filtroPeriodo === '30D' && diasAtras > 30) return false
        }
        if (busquedaCaja.trim()) {
          const q = busquedaCaja.toLowerCase()
          const hay = `${m.concepto} ${m.itemComprado ?? ''} ${m.categoria} ${m.contraparte} ${m.nroDocumento ?? ''} ${RUBRO_META[r].label}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
  }, [movimientos, filtroTipoMov, filtroRubro, filtroMetodo, filtroPeriodo, busquedaCaja])

  const resumenFiltroCaja = useMemo(() => {
    const ing = movimientosFiltrados.filter((m) => m.tipo === 'INGRESO').reduce((a, m) => a + m.monto, 0)
    const egr = movimientosFiltrados.filter((m) => m.tipo === 'EGRESO').reduce((a, m) => a + m.monto, 0)
    return { ing, egr, neto: ing - egr, count: movimientosFiltrados.length }
  }, [movimientosFiltrados])

  // Agrupación de saldos por cliente y por proveedor
  const saldosPorEntidad = useMemo(() => {
    const clientesMap = new Map<
      string,
      {
        nombre: string
        rut: string
        empresaId?: number
        totalFacturado: number
        totalPagado: number
        deudaPendiente: number
        docsPendientes: number
        vencidas: number
      }
    >()
    const proveedoresMap = new Map<
      string,
      {
        nombre: string
        rut: string
        totalFacturado: number
        totalPagado: number
        deudaPendiente: number
        docsPendientes: number
        vencidas: number
      }
    >()

    for (const f of facturasVisibles) {
      if (f.estado === 'ANULADA') continue
      const saldo = Math.max(0, f.montoTotal - f.montoPagado)
      const vencida = saldo > 0 && daysUntil(f.fechaVencimiento) < 0

      if (f.direccion === 'POR_COBRAR') {
        const key = f.contraparteRut || f.contraparteNombre
        const prev = clientesMap.get(key) ?? {
          nombre: f.contraparteNombre,
          rut: f.contraparteRut,
          empresaId: f.empresaId,
          totalFacturado: 0,
          totalPagado: 0,
          deudaPendiente: 0,
          docsPendientes: 0,
          vencidas: 0,
        }
        prev.totalFacturado += f.montoTotal
        prev.totalPagado += f.montoPagado
        prev.deudaPendiente += saldo
        if (saldo > 0) prev.docsPendientes += 1
        if (vencida) prev.vencidas += 1
        clientesMap.set(key, prev)
      } else {
        const key = f.contraparteRut || f.contraparteNombre
        const prev = proveedoresMap.get(key) ?? {
          nombre: f.contraparteNombre,
          rut: f.contraparteRut,
          totalFacturado: 0,
          totalPagado: 0,
          deudaPendiente: 0,
          docsPendientes: 0,
          vencidas: 0,
        }
        prev.totalFacturado += f.montoTotal
        prev.totalPagado += f.montoPagado
        prev.deudaPendiente += saldo
        if (saldo > 0) prev.docsPendientes += 1
        if (vencida) prev.vencidas += 1
        proveedoresMap.set(key, prev)
      }
    }

    return {
      clientes: Array.from(clientesMap.values()).sort((a, b) => b.deudaPendiente - a.deudaPendiente),
      proveedores: Array.from(proveedoresMap.values()).sort((a, b) => b.deudaPendiente - a.deudaPendiente),
    }
  }, [facturasVisibles])

  // Filtrado de tabla activa (COBRAR o PAGAR)
  const facturasTabla = useMemo(() => {
    const dir: DireccionFactura = tab === 'PAGAR' ? 'POR_PAGAR' : 'POR_COBRAR'
    return facturasVisibles
      .filter((f) => f.direccion === dir)
      .filter((f) => {
        const saldo = Math.max(0, f.montoTotal - f.montoPagado)
        if (filtroEstado === 'CON_DEUDA') return saldo > 0
        if (filtroEstado === 'VENCIDAS') return saldo > 0 && daysUntil(f.fechaVencimiento) < 0
        if (filtroEstado === 'PAGADAS') return saldo === 0
        return true
      })
      .filter((f) => {
        if (!busqueda.trim()) return true
        const q = busqueda.toLowerCase()
        return (
          f.folio.toLowerCase().includes(q) ||
          f.contraparteNombre.toLowerCase().includes(q) ||
          f.contraparteRut.toLowerCase().includes(q) ||
          f.concepto.toLowerCase().includes(q)
        )
      })
  }, [facturasVisibles, tab, filtroEstado, busqueda])

  const banco = db.bancoConexion ?? {
    conectado: true,
    banco: 'BancoEstado Empresas / Cuenta Corriente',
    tipoCuenta: 'Cuenta Corriente Empresa (Solo Lectura)',
    numeroCuenta: '•••• •••• 4829-1',
    titular: 'PCG SPA',
    rutTitular: '77.806.251-8',
    proveedorApi: 'FINTOC_OPEN_BANKING' as const,
    ultimaSincronizacion: today(),
  }

  function handleSyncBank() {
    setSyncingBank(true)
    setSyncNotice(null)
    setTimeout(() => {
      mutate((d) => {
        const hoy = today()
        d.bancoConexion = {
          ...(d.bancoConexion ?? banco),
          conectado: true,
          ultimaSincronizacion: hoy,
        }
        // Si aún no se ha sincronizado este movimiento demo de banco, agregarlo
        const yaExiste = d.movimientos.some((m) => m.nroDocumento === 'SYNC-BNK-9041')
        if (!yaExiste) {
          d.movimientos.push({
            id: nextId(d.movimientos),
            fecha: hoy,
            tipo: 'EGRESO',
            rubro: 'HERRAMIENTAS',
            categoria: 'Herramientas de Taller y Laboratorio',
            itemComprado: 'Pinza Amperimétrica Digital True RMS + Juego Puntas Torx Seguridad',
            cantidad: 2,
            concepto: 'Compra con tarjeta débito empresa sincronizada desde cartola bancaria',
            contraparte: 'Ferretería Técnica / Compra Redcompra',
            monto: 42900,
            metodo: 'TARJETA',
            nroDocumento: 'SYNC-BNK-9041',
            conciliadoBanco: true,
          })
        }
      })
      setSyncingBank(false)
      setSyncNotice('✅ Cartola bancaria sincronizada en Modo Solo Lectura. Se verificó el saldo y se conciliaron los últimos movimientos.')
    }, 650)
  }

  return (
    <>
      {!isClient ? (
        <BackgroundBeamsHeader
          variant="emerald"
          badge={`🏦 ${banco.banco} (${banco.numeroCuenta}) · 🔒 Modo Consulta Solo Lectura Activo`}
          title={
            <>
              Finanzas, Compras de Taller &{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                Conexión Bancaria
              </span>
            </>
          }
          subtitle="Controla el dinero real de PCG SPA, registra qué se compra (Equipos, Herramientas, Repuestos, Insumos) con filtros analíticos y consulta tu cuenta bancaria en modo lectura."
          actions={
            <>
              <MovingBorderBtn onClick={() => setModalMovimiento({ tipoInicial: 'EGRESO', rubroInicial: 'HERRAMIENTAS' })}>
                🛠️ + Registrar Compra (Equipos / Herramientas)
              </MovingBorderBtn>
              <Btn variant="secondary" onClick={() => setModalMovimiento({ tipoInicial: 'INGRESO', rubroInicial: 'INGRESO_OT' })}>
                + Ingreso Caja
              </Btn>
              <Btn variant="secondary" onClick={() => setModalNuevaFactura('POR_PAGAR')}>
                + Factura Proveedor
              </Btn>
              <Btn variant="secondary" onClick={() => setModalNuevaFactura('POR_COBRAR')}>
                + Emitir Factura Cliente
              </Btn>
            </>
          }
        />
      ) : (
        <BackgroundBeamsHeader
          variant="indigo"
          badge="Portal Financiero Clientes · PCG SPA"
          title="Mis Facturas y Estado de Cuenta"
          subtitle="Revisa tus facturas emitidas por PCG SPA, abonos realizados y saldos pendientes por pagar."
        />
      )}

      {syncNotice && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900 shadow-xs">
          <span>{syncNotice}</span>
          <button type="button" onClick={() => setSyncNotice(null)} className="text-emerald-700 hover:underline">
            Cerrar ✕
          </button>
        </div>
      )}

      {/* KPIs principales de Finanzas */}
      {!isClient ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="💰 Saldo Disponible (Caja / Banco)"
            value={fmtCLP(kpis.cajaActual)}
            tone="green"
            hint={`Entradas: ${fmtCLP(kpis.totalIngresos)} · Compras/Salidas: ${fmtCLP(kpis.totalEgresos)}`}
          />
          <Kpi
            label="📥 Me Deben (Cuentas por Cobrar)"
            value={fmtCLP(kpis.meDebenTotal)}
            tone="blue"
            hint={`${kpis.facturasPorCobrarAbiertas} doc(s) por cobrar · ${kpis.cobrarVencidas} vencida(s)`}
          />
          <Kpi
            label="📤 Debo Pagar (Facturas Proveedores)"
            value={fmtCLP(kpis.deboPagarTotal)}
            tone={kpis.pagarVencidas > 0 ? 'red' : 'amber'}
            hint={`${kpis.facturasPorPagarAbiertas} factura(s) por pagar · ${kpis.pagarVencidas} vencida(s)`}
          />
          <Kpi
            label="📈 Balance Neto Proyectado"
            value={fmtCLP(kpis.proyectado)}
            tone="violet"
            hint="Caja actual + Lo que me deben − Lo que debo"
          />
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Kpi
            label="Saldo Pendiente de Pago"
            value={fmtCLP(kpis.meDebenTotal)}
            tone={kpis.meDebenTotal > 0 ? 'amber' : 'green'}
            hint={`${kpis.facturasPorCobrarAbiertas} documento(s) con saldo abierto`}
          />
          <Kpi
            label="Total Abonado / Pagado"
            value={fmtCLP(facturasVisibles.reduce((acc, f) => acc + f.montoPagado, 0))}
            tone="green"
            hint="Pagos recepcionados por PCG SPA"
          />
          <Kpi
            label="Documentos Vencidos"
            value={kpis.cobrarVencidas}
            tone={kpis.cobrarVencidas > 0 ? 'red' : 'blue'}
            hint={kpis.cobrarVencidas > 0 ? 'Requiere regularización' : 'Cuenta al día'}
          />
        </div>
      )}

      {/* Pestañas de navegación de Finanzas con Motion layoutId */}
      {!isClient && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <AnimatedPillTabs
            layoutId="finanzas-main-tabs"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'CAJA', label: '🛠️ Compras, Herramientas y Libro de Caja', badge: movimientos.length },
              { id: 'COBRAR', label: '📥 Me deben (Por Cobrar)', badge: kpis.facturasPorCobrarAbiertas },
              { id: 'PAGAR', label: '📤 Debo pagar (Proveedores)', badge: kpis.facturasPorPagarAbiertas },
              { id: 'SALDOS', label: '👥 ¿Quién me debe / A quién debo?' },
              { id: 'BANCO', label: '🏦 Cuenta Bancaria (Solo Lectura)', badge: 'ONLINE' },
            ]}
          />
        </div>
      )}

      {/* =====================================================================
          VISTA 1: COMPRAS (EQUIPOS, HERRAMIENTAS, REPUESTOS) Y LIBRO DE CAJA
         ===================================================================== */}
      {tab === 'CAJA' && !isClient && (
        <div className="space-y-5">
          {/* Tarjetas Analíticas de En Qué se Gasta / Compra */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <SpotlightCard
              onClick={() => {
                setFiltroTipoMov('EGRESO')
                setFiltroRubro(filtroRubro === 'EQUIPOS' ? 'TODOS' : 'EQUIPOS')
              }}
              spotlightColor="rgba(14, 165, 233, 0.22)"
              className={cx(
                'cursor-pointer p-4 transition',
                filtroRubro === 'EQUIPOS' ? 'ring-2 ring-sky-500 bg-sky-50/40' : '',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-sky-700">💻 Compra de Equipos / PC</span>
                <Badge tone="blue">Clic para filtrar</Badge>
              </div>
              <div className="mt-1.5 text-2xl font-extrabold text-slate-900">
                <AnimatedNumber value={kpis.gastoEquipos} formatCLP />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">Notebooks, PCs, monitores y equipos adquiridos</div>
            </SpotlightCard>

            <SpotlightCard
              onClick={() => {
                setFiltroTipoMov('EGRESO')
                setFiltroRubro(filtroRubro === 'HERRAMIENTAS' ? 'TODOS' : 'HERRAMIENTAS')
              }}
              spotlightColor="rgba(139, 92, 246, 0.22)"
              className={cx(
                'cursor-pointer p-4 transition',
                filtroRubro === 'HERRAMIENTAS' ? 'ring-2 ring-violet-500 bg-violet-50/40' : '',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-violet-700">🛠️ Herramientas de Taller</span>
                <Badge tone="violet">Clic para filtrar</Badge>
              </div>
              <div className="mt-1.5 text-2xl font-extrabold text-slate-900">
                <AnimatedNumber value={kpis.gastoHerramientas} formatCLP />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">Estaciones SMD, multímetros, kits iFixit, testers</div>
            </SpotlightCard>

            <SpotlightCard
              onClick={() => {
                setFiltroTipoMov('EGRESO')
                setFiltroRubro(filtroRubro === 'REPUESTOS' ? 'TODOS' : 'REPUESTOS')
              }}
              spotlightColor="rgba(245, 158, 11, 0.22)"
              className={cx(
                'cursor-pointer p-4 transition',
                filtroRubro === 'REPUESTOS' ? 'ring-2 ring-amber-500 bg-amber-50/40' : '',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-amber-700">🔩 Repuestos (SSD, RAM, PSU)</span>
                <Badge tone="amber">Clic para filtrar</Badge>
              </div>
              <div className="mt-1.5 text-2xl font-extrabold text-slate-900">
                <AnimatedNumber value={kpis.gastoRepuestos} formatCLP />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">Discos SSD, memorias RAM, fuentes y pantallas</div>
            </SpotlightCard>

            <SpotlightCard
              onClick={() => {
                setFiltroTipoMov('EGRESO')
                setFiltroRubro(filtroRubro === 'INSUMOS' ? 'TODOS' : 'INSUMOS')
              }}
              spotlightColor="rgba(20, 184, 166, 0.22)"
              className={cx(
                'cursor-pointer p-4 transition',
                filtroRubro === 'INSUMOS' ? 'ring-2 ring-teal-500 bg-teal-50/40' : '',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-teal-700">🧴 Insumos y Operación</span>
                <Badge tone="blue">Clic para filtrar</Badge>
              </div>
              <div className="mt-1.5 text-2xl font-extrabold text-slate-900">
                <AnimatedNumber value={kpis.gastoInsumosOp} formatCLP />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">Pasta térmica, alcohol isopropílico, fibra y licencias</div>
            </SpotlightCard>
          </div>

          {/* Barra visual de distribución de compras */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">
                📊 Distribución Analítica de Compras e Inversión ({fmtCLP(kpis.totalEgresos)} total egresos)
              </span>
              <div className="flex flex-wrap gap-3 font-semibold">
                <span className="text-sky-700">💻 Equipos: {fmtCLP(kpis.gastoEquipos)}</span>
                <span className="text-violet-700">🛠️ Herramientas: {fmtCLP(kpis.gastoHerramientas)}</span>
                <span className="text-amber-700">🔩 Repuestos: {fmtCLP(kpis.gastoRepuestos)}</span>
                <span className="text-teal-700">🧴 Insumos/Op: {fmtCLP(kpis.gastoInsumosOp)}</span>
              </div>
            </div>
            <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
              {[
                { val: kpis.gastoEquipos, cls: 'bg-sky-500', label: 'Equipos' },
                { val: kpis.gastoHerramientas, cls: 'bg-violet-500', label: 'Herramientas' },
                { val: kpis.gastoRepuestos, cls: 'bg-amber-500', label: 'Repuestos' },
                { val: kpis.gastoInsumosOp, cls: 'bg-teal-500', label: 'Insumos y Operación' },
              ].map((b, i) => {
                const pct = kpis.totalEgresos > 0 ? Math.round((b.val / kpis.totalEgresos) * 100) : 0
                if (pct <= 0) return null
                return (
                  <motion.div
                    key={b.label}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className={cx('h-full first:rounded-l-full last:rounded-r-full', b.cls)}
                    title={`${b.label}: ${fmtCLP(b.val)} (${pct}%)`}
                  />
                )
              })}
            </div>
          </Card>

          {/* Panel de Filtros Avanzados para Analizar Compras y Movimientos */}
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                🔎 Filtros Inteligentes de Análisis (Filtra por Equipos, Herramientas, Repuestos, Método o Fecha)
              </div>
              {(filtroTipoMov !== 'TODOS' ||
                filtroRubro !== 'TODOS' ||
                filtroMetodo !== 'TODOS' ||
                filtroPeriodo !== 'TODOS' ||
                busquedaCaja.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroTipoMov('TODOS')
                    setFiltroRubro('TODOS')
                    setFiltroMetodo('TODOS')
                    setFiltroPeriodo('TODOS')
                    setBusquedaCaja('')
                  }}
                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  ✕ Limpiar todos los filtros
                </button>
              )}
            </div>

            {/* Chips rápidos por Rubro / Qué se compró */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(
                [
                  ['TODOS', '📋 Todos los rubros'],
                  ['EQUIPOS', '💻 Equipos / PC'],
                  ['HERRAMIENTAS', '🛠️ Herramientas Taller'],
                  ['REPUESTOS', '🔩 Repuestos (SSD/RAM)'],
                  ['INSUMOS', '🧴 Insumos (Pasta/Alcohol)'],
                  ['SOFTWARE', '💿 Software / Licencias'],
                  ['OPERACION', '🏢 Gastos Operacionales'],
                  ['INGRESO_OT', '🔧 Ingresos OT'],
                  ['INGRESO_CONVENIO', '🤝 Convenios B2B'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFiltroRubro(key)}
                  className={cx(
                    'rounded-xl px-3 py-1.5 text-xs font-bold transition',
                    filtroRubro === key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Segunda fila de filtros: Tipo (Compras vs Ingresos), Método, Periodo y Buscador */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className={inputCls}
                value={filtroTipoMov}
                onChange={(e) => setFiltroTipoMov(e.target.value as 'TODOS' | 'EGRESO' | 'INGRESO')}
              >
                <option value="TODOS">Flujo: Todos (Ingresos y Compras)</option>
                <option value="EGRESO">▼ Solo Compras / Gastos (Salidas)</option>
                <option value="INGRESO">▲ Solo Ingresos (Entradas)</option>
              </select>

              <select
                className={inputCls}
                value={filtroMetodo}
                onChange={(e) => setResultadoMetodo(e.target.value as 'TODOS' | MetodoPago, setFiltroMetodo)}
              >
                <option value="TODOS">Método: Todos los medios de pago</option>
                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                <option value="TARJETA">💳 Tarjeta Débito / Crédito</option>
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="CHEQUE">📄 Cheque</option>
              </select>

              <select
                className={inputCls}
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value as 'TODOS' | '7D' | '15D' | '30D')}
              >
                <option value="TODOS">Fecha: Todo el historial</option>
                <option value="7D">📅 Últimos 7 días</option>
                <option value="15D">📅 Últimos 15 días</option>
                <option value="30D">📅 Últimos 30 días</option>
              </select>

              <input
                className={inputCls}
                placeholder="Buscar herramienta, equipo, proveedor, factura..."
                value={busquedaCaja}
                onChange={(e) => setBusquedaCaja(e.target.value)}
              />
            </div>

            {/* Barra de totales del filtro activo */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white">
              <div className="font-semibold">
                Mostrando <strong className="text-emerald-300">{resumenFiltroCaja.count}</strong> movimiento(s) según tu filtro:
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  Ingresos filtro: <strong className="text-emerald-400">+{fmtCLP(resumenFiltroCaja.ing)}</strong>
                </span>
                <span>
                  Compras / Gastos filtro: <strong className="text-rose-400">-{fmtCLP(resumenFiltroCaja.egr)}</strong>
                </span>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-extrabold">
                  Neto filtro: {fmtCLP(resumenFiltroCaja.neto)}
                </span>
              </div>
            </div>
          </Card>

          {/* Tabla detallada de Compras, Herramientas, Equipos y Movimientos */}
          {movimientosFiltrados.length === 0 ? (
            <Empty>No hay compras ni movimientos que coincidan con los filtros seleccionados.</Empty>
          ) : (
            <Table
              head={[
                'Fecha / Doc',
                'Flujo',
                'Rubro / Clasificación',
                '¿Qué se compró? / Detalle del Movimiento',
                'Proveedor / Cliente',
                'Método & Banco',
                'Monto',
              ]}
            >
              {movimientosFiltrados.map((m) => {
                const r = resolveRubro(m)
                const meta = RUBRO_META[r]
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className={td}>
                      <div className="font-semibold text-slate-900">{fmtFecha(m.fecha)}</div>
                      {m.nroDocumento && (
                        <div className="font-mono text-[11px] font-bold text-slate-500">Doc: {m.nroDocumento}</div>
                      )}
                    </td>
                    <td className={td}>
                      <Badge tone={m.tipo === 'INGRESO' ? 'green' : 'red'}>
                        {m.tipo === 'INGRESO' ? '▲ INGRESO' : '▼ COMPRA / GASTO'}
                      </Badge>
                    </td>
                    <td className={td}>
                      <Badge tone={meta.tone}>
                        {meta.icon} {meta.short}
                      </Badge>
                      <div className="mt-0.5 text-[11px] text-slate-400">{m.categoria}</div>
                    </td>
                    <td className={td}>
                      {m.itemComprado ? (
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {m.cantidad && m.cantidad > 1 ? `${m.cantidad}x ` : ''}
                            {m.itemComprado}
                          </div>
                          <div className="text-xs text-slate-500">{m.concepto}</div>
                        </div>
                      ) : (
                        <div className="font-medium text-slate-900">{m.concepto}</div>
                      )}
                    </td>
                    <td className={td}>
                      <div className="font-semibold text-slate-800">{m.contraparte}</div>
                    </td>
                    <td className={td}>
                      <div className="text-xs font-bold text-slate-700">{m.metodo}</div>
                      {m.conciliadoBanco && (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          🏦 Conciliado Banco
                        </span>
                      )}
                    </td>
                    <td
                      className={`${td} text-right font-extrabold ${
                        m.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {m.tipo === 'INGRESO' ? `+${fmtCLP(m.monto)}` : `-${fmtCLP(m.monto)}`}
                    </td>
                  </tr>
                )
              })}
            </Table>
          )}
        </div>
      )}

      {/* =====================================================================
          VISTA 2 y 3: TABLA DE FACTURAS POR COBRAR O POR PAGAR
         ===================================================================== */}
      {(tab === 'COBRAR' || tab === 'PAGAR') && (
        <>
          {/* Barra comparativa rápida: ¿Cuánto me deben vs cuánto debo? */}
          {!isClient && (
            <Card className="mb-5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                    Termómetro de Deudas Activas (Clientes vs Proveedores)
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    Los clientes te deben <strong className="text-emerald-700">{fmtCLP(kpis.meDebenTotal)}</strong> y PCG SPA debe pagar{' '}
                    <strong className="text-rose-600">{fmtCLP(kpis.deboPagarTotal)}</strong> en facturas de proveedores.
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-extrabold ${
                      kpis.meDebenTotal >= kpis.deboPagarTotal
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Diferencia a favor por cobrar: {fmtCLP(kpis.meDebenTotal - kpis.deboPagarTotal)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex h-3.5 overflow-hidden rounded-full bg-slate-100">
                {kpis.meDebenTotal + kpis.deboPagarTotal > 0 && (
                  <>
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{
                        width: `${Math.round((kpis.meDebenTotal / (kpis.meDebenTotal + kpis.deboPagarTotal)) * 100)}%`,
                      }}
                    />
                    <div
                      className="bg-gradient-to-r from-rose-500 to-orange-500 transition-all"
                      style={{
                        width: `${Math.round((kpis.deboPagarTotal / (kpis.meDebenTotal + kpis.deboPagarTotal)) * 100)}%`,
                      }}
                    />
                  </>
                )}
              </div>
            </Card>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['TODAS', 'Todas'],
                  ['CON_DEUDA', tab === 'COBRAR' ? 'Pendientes de cobro (Me deben)' : 'Pendientes de pago (Debo)'],
                  ['VENCIDAS', '⚠️ Solo vencidas'],
                  ['PAGADAS', '✅ Pagadas al 100%'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFiltroEstado(k)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    filtroEstado === k
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              className={`${inputCls} max-w-xs`}
              placeholder="Buscar folio, cliente/proveedor, RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {facturasTabla.length === 0 ? (
            <Empty>
              {tab === 'COBRAR'
                ? 'No se encontraron facturas emitidas con el filtro actual.'
                : 'No tienes facturas por pagar con el filtro actual.'}
            </Empty>
          ) : (
            <Table
              head={[
                'Folio / Tipo',
                tab === 'COBRAR' ? 'Cliente (Quién nos debe)' : 'Proveedor (A quién debemos)',
                'Concepto / OT',
                'Emisión y Vencimiento',
                'Total Factura',
                tab === 'COBRAR' ? 'Cobrado / Me deben' : 'Pagado / Debo pagar',
                'Estado',
                '',
              ]}
            >
              {facturasTabla.map((f) => {
                const saldo = Math.max(0, f.montoTotal - f.montoPagado)
                const pct = f.montoTotal > 0 ? Math.min(100, Math.round((f.montoPagado / f.montoTotal) * 100)) : 100
                const dias = daysUntil(f.fechaVencimiento)
                const vencida = saldo > 0 && dias < 0
                const porVencer = saldo > 0 && dias >= 0 && dias <= 5
                const ot = f.otId ? db.ots.find((o) => o.id === f.otId) : undefined

                return (
                  <tr key={f.id} className={vencida ? 'bg-rose-50/40' : undefined}>
                    <td className={td}>
                      <div className="font-mono text-xs font-extrabold text-slate-900">{f.folio}</div>
                      <div className="text-[11px] text-slate-500">{TIPO_DOC_LABEL[f.tipoDoc]}</div>
                    </td>
                    <td className={td}>
                      <div className="font-bold text-slate-900">{f.contraparteNombre}</div>
                      <div className="font-mono text-xs text-slate-500">RUT: {f.contraparteRut}</div>
                    </td>
                    <td className={td}>
                      <div className="max-w-xs text-xs font-medium text-slate-800">{f.concepto}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone="slate">{f.categoria}</Badge>
                        {ot && (
                          <Link to="/app/ot" className="text-[11px] font-bold text-emerald-700 hover:underline">
                            Ver {ot.codigo} →
                          </Link>
                        )}
                      </div>
                      {f.notas && <div className="mt-1 text-[11px] italic text-slate-500">{f.notas}</div>}
                    </td>
                    <td className={td}>
                      <div className="text-xs text-slate-600">Emitida: {fmtFecha(f.fechaEmision)}</div>
                      <div className="text-xs font-semibold text-slate-800">Vence: {fmtFecha(f.fechaVencimiento)}</div>
                      {saldo > 0 && (
                        <div className="mt-1">
                          {vencida ? (
                            <Badge tone="red">⚠️ Vencida hace {Math.abs(dias)} día(s)</Badge>
                          ) : porVencer ? (
                            <Badge tone="amber">⏳ Vence en {dias} día(s)</Badge>
                          ) : (
                            <Badge tone="blue">Al día ({dias}d restantes)</Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={td}>
                      <div className="text-sm font-extrabold text-slate-900">{fmtCLP(f.montoTotal)}</div>
                      <div className="text-[11px] text-slate-400">
                        Neto {fmtCLP(f.montoNeto)} + IVA {fmtCLP(f.montoIva)}
                      </div>
                    </td>
                    <td className={td}>
                      <div className="w-44">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">
                            {tab === 'COBRAR' ? 'Cobrado:' : 'Pagado:'} <strong className="text-slate-700">{fmtCLP(f.montoPagado)}</strong>
                          </span>
                          <span className="font-bold text-slate-600">{pct}%</span>
                        </div>
                        <div className="my-1 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              saldo === 0
                                ? 'bg-emerald-500'
                                : tab === 'COBRAR'
                                  ? 'bg-sky-500'
                                  : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {saldo > 0 ? (
                          <div
                            className={`text-xs font-extrabold ${
                              tab === 'COBRAR' ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {tab === 'COBRAR' ? `Me deben: ${fmtCLP(saldo)}` : `Debo pagar: ${fmtCLP(saldo)}`}
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-emerald-600">
                            ✓ Saldo $0 ({f.fechaUltimoPago ? `pagado ${fmtFecha(f.fechaUltimoPago)}` : 'al día'})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={td}>
                      <Badge
                        tone={
                          saldo === 0
                            ? 'green'
                            : f.montoPagado > 0
                              ? 'amber'
                              : vencida
                                ? 'red'
                                : 'slate'
                        }
                      >
                        {saldo === 0 ? 'PAGADA' : f.montoPagado > 0 ? 'ABONADA PARCIAL' : 'PENDIENTE'}
                      </Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      {!isClient && saldo > 0 && (
                        <Btn
                          size="sm"
                          variant={tab === 'COBRAR' ? 'primary' : 'danger'}
                          onClick={() => setModalAbonoFactura(f)}
                        >
                          {tab === 'COBRAR' ? '💵 Registrar cobro' : '💸 Pagar factura'}
                        </Btn>
                      )}
                    </td>
                  </tr>
                )
              })}
            </Table>
          )}
        </>
      )}

      {/* =====================================================================
          VISTA 4: RESUMEN POR CLIENTE Y PROVEEDOR
         ===================================================================== */}
      {tab === 'SALDOS' && !isClient && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  📥 Clientes — ¿Quién me debe dinero?
                </h3>
                <p className="text-xs text-slate-500">
                  Estado consolidado de deuda por empresa B2B o cliente particular
                </p>
              </div>
              <Badge tone="green">Total por cobrar: {fmtCLP(kpis.meDebenTotal)}</Badge>
            </div>

            <div className="space-y-3">
              {saldosPorEntidad.clientes.map((c) => (
                <div
                  key={c.rut + c.nombre}
                  className={`rounded-2xl border p-4 transition ${
                    c.deudaPendiente > 0
                      ? 'border-emerald-200 bg-emerald-50/35'
                      : 'border-slate-200/80 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{c.nombre}</div>
                      <div className="font-mono text-xs text-slate-500">RUT: {c.rut}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold uppercase text-slate-400">Nos debe</div>
                      <div
                        className={`text-lg font-extrabold ${
                          c.deudaPendiente > 0 ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {fmtCLP(c.deudaPendiente)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 text-xs">
                    <div className="text-slate-600">
                      Facturado: <strong>{fmtCLP(c.totalFacturado)}</strong> · Cobrado:{' '}
                      <strong className="text-emerald-700">{fmtCLP(c.totalPagado)}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.vencidas > 0 && <Badge tone="red">{c.vencidas} vencida(s)</Badge>}
                      <Badge tone={c.deudaPendiente > 0 ? 'amber' : 'green'}>
                        {c.deudaPendiente > 0 ? `${c.docsPendientes} doc(s) por cobrar` : 'Sin deuda'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setBusqueda(c.nombre)
                          setFiltroEstado('TODAS')
                          setTab('COBRAR')
                        }}
                        className="ml-1 text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Ver facturas →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  📤 Proveedores — ¿A quién le debo pagar?
                </h3>
                <p className="text-xs text-slate-500">
                  Facturas de compra de hardware, insumos y servicios por pagar
                </p>
              </div>
              <Badge tone="red">Total por pagar: {fmtCLP(kpis.deboPagarTotal)}</Badge>
            </div>

            <div className="space-y-3">
              {saldosPorEntidad.proveedores.map((p) => (
                <div
                  key={p.rut + p.nombre}
                  className={`rounded-2xl border p-4 transition ${
                    p.deudaPendiente > 0 ? 'border-rose-200 bg-rose-50/35' : 'border-slate-200/80 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{p.nombre}</div>
                      <div className="font-mono text-xs text-slate-500">RUT: {p.rut}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold uppercase text-slate-400">Debemos pagar</div>
                      <div
                        className={`text-lg font-extrabold ${
                          p.deudaPendiente > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        {fmtCLP(p.deudaPendiente)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 text-xs">
                    <div className="text-slate-600">
                      Total compras: <strong>{fmtCLP(p.totalFacturado)}</strong> · Pagado:{' '}
                      <strong>{fmtCLP(p.totalPagado)}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {p.vencidas > 0 && <Badge tone="red">{p.vencidas} vencida(s)</Badge>}
                      <Badge tone={p.deudaPendiente > 0 ? 'amber' : 'green'}>
                        {p.deudaPendiente > 0 ? `${p.docsPendientes} factura(s) por pagar` : 'Al día'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setBusqueda(p.nombre)
                          setFiltroEstado('TODAS')
                          setTab('PAGAR')
                        }}
                        className="ml-1 text-xs font-bold text-rose-600 hover:underline"
                      >
                        Ver facturas →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* =====================================================================
          VISTA 5: VINCULACIÓN DE CUENTA BANCARIA (MODO SOLO LECTURA)
         ===================================================================== */}
      {tab === 'BANCO' && !isClient && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2" accent="emerald" title="🏦 Conexión de Cuenta Bancaria en Modo Consulta (Solo Lectura)">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl text-emerald-400 shadow">
                    🏦
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{banco.banco}</span>
                      <Badge tone="green">🔒 SOLO LECTURA ACTIVO</Badge>
                    </div>
                    <div className="text-xs text-slate-600">
                      Titular: <strong>{banco.titular}</strong> ({banco.rutTitular}) · Cuenta: <span className="font-mono font-bold">{banco.numeroCuenta}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Última sincronización de cartola: <strong>{fmtFecha(banco.ultimaSincronizacion)}</strong> · Saldo conciliado: <strong className="text-emerald-700">{fmtCLP(kpis.cajaActual)}</strong>
                    </div>
                  </div>
                </div>
                <Btn onClick={handleSyncBank} disabled={syncingBank}>
                  {syncingBank ? '🔄 Consultando banco...' : '🔄 Sincronizar Movimientos Ahora'}
                </Btn>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Field label="Banco Chileno Vinculado">
                <select
                  className={inputCls}
                  value={banco.banco}
                  onChange={(e) =>
                    mutate((d) => {
                      d.bancoConexion = { ...(d.bancoConexion ?? banco), banco: e.target.value }
                    })
                  }
                >
                  <option value="BancoEstado Empresas / Cuenta Corriente">BancoEstado Empresas / CuentaRUT Pro</option>
                  <option value="Banco de Chile — Cuenta Corriente Pyme">Banco de Chile — Cuenta Corriente Pyme</option>
                  <option value="Banco Santander — Work/Café Empresas">Banco Santander — Work/Café Empresas</option>
                  <option value="Banco BCI — Empresarios / Mach Empresas">Banco BCI — Empresarios</option>
                  <option value="Scotiabank Chile — Cuenta Corriente">Scotiabank Chile — Cuenta Corriente</option>
                  <option value="Banco Itaú — Cuenta Empresa">Banco Itaú — Cuenta Empresa</option>
                </select>
              </Field>
              <Field label="Método de Lectura">
                <select
                  className={inputCls}
                  value={banco.proveedorApi}
                  onChange={(e) =>
                    mutate((d) => {
                      d.bancoConexion = {
                        ...(d.bancoConexion ?? banco),
                        proveedorApi: e.target.value as typeof banco.proveedorApi,
                      }
                    })
                  }
                >
                  <option value="FINTOC_OPEN_BANKING">API Open Banking (Fintoc Chile · Read-Only)</option>
                  <option value="CORREO_NOTIFICACIONES">Lectura Avisos Correo (serviciotecnicopcg@gmail.com)</option>
                  <option value="CARTOLA_CSV">Importación Cartola Excel / CSV del Banco</option>
                </select>
              </Field>
              <Field label="Nº Cuenta (Enmascarado)">
                <input
                  className={inputCls}
                  value={banco.numeroCuenta}
                  onChange={(e) =>
                    mutate((d) => {
                      d.bancoConexion = { ...(d.bancoConexion ?? banco), numeroCuenta: e.target.value }
                    })
                  }
                />
              </Field>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
              <div className="font-extrabold text-slate-900">
                💡 ¿Cómo funciona técnicamente vincular tu banco solo para ver dinero y movimientos en Chile?
              </div>
              <p>
                <strong>1. Vía API Open Banking en Chile (Fintoc / Clay / Floid):</strong> Se conecta un token de <strong>solo lectura (Read-Only)</strong>. El banco jamás entrega permisos para transferir ni pide Digipass/Clave Dinámica; únicamente permite consultar <code>GET /v1/accounts/balance</code> y <code>GET /v1/movements</code> para que veas tu saldo real y cada compra o pago recibido.
              </p>
              <p>
                <strong>2. Vía Notificaciones de Correo Bancario (100% Gratis):</strong> Como ya usarás el correo de <strong>PCG SPA</strong>, cada vez que tu banco envíe un aviso automático de <em>&ldquo;Transferencia recibida&rdquo;</em> o <em>&ldquo;Compra con tarjeta&rdquo;</em>, el sistema lee el monto y lo agrega automáticamente al Libro de Caja.
              </p>
              <p>
                <strong>3. Vía Cartola Excel/CSV:</strong> Puedes descargar la cartola mensual desde el portal web de tu banco y cargarla para clasificar rápidamente compras de equipos, herramientas o pagos de clientes.
              </p>
            </div>
          </Card>

          <Card className="p-5" accent="blue" title="🔒 Seguridad Modo Consulta">
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Cero permisos de giro:</strong> La vinculación de consulta jamás puede mover dinero ni autorizar transferencias.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Clasificación automática:</strong> Al sincronizar un cargo del banco (ej. compra en PC Factory o Sodimac), puedes etiquetarlo como <strong>💻 Equipos</strong> o <strong>🛠️ Herramientas</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Conciliación con Facturas:</strong> Los abonos recibidos por transferencia se cruzan con las facturas emitidas a tus empresas B2B.</span>
              </li>
            </ul>
          </Card>
        </div>
      )}

      {/* MODAL 1: REGISTRAR ABONO O PAGO DE FACTURA */}
      {modalAbonoFactura && (
        <ModalAbonoFactura
          factura={modalAbonoFactura}
          onClose={() => setModalAbonoFactura(null)}
          onConfirm={(montoAbono, metodo, nota) => {
            mutate((d) => {
              const target = d.facturas.find((x) => x.id === modalAbonoFactura.id)
              if (!target) return
              const hoy = today()
              target.montoPagado = Math.min(target.montoTotal, target.montoPagado + montoAbono)
              target.estado = target.montoPagado >= target.montoTotal ? 'PAGADA' : 'ABONADA'
              target.metodoPago = metodo
              target.fechaUltimoPago = hoy
              if (nota.trim()) target.notas = nota.trim()

              if (target.otId && target.estado === 'PAGADA') {
                const ot = d.ots.find((o) => o.id === target.otId)
                if (ot) {
                  ot.estadoPago = 'PAGADO'
                  ot.numeroFactura = target.folio
                }
              }

              d.movimientos.push({
                id: nextId(d.movimientos),
                fecha: hoy,
                tipo: target.direccion === 'POR_COBRAR' ? 'INGRESO' : 'EGRESO',
                rubro: target.direccion === 'POR_COBRAR' ? 'INGRESO_OT' : 'REPUESTOS',
                categoria: target.categoria,
                concepto: `${
                  target.direccion === 'POR_COBRAR' ? 'Cobro' : 'Pago'
                } ${target.estado === 'PAGADA' ? 'total' : 'parcial'} ${target.folio} — ${target.concepto}`,
                contraparte: target.contraparteNombre,
                monto: montoAbono,
                metodo,
                nroDocumento: target.folio,
                conciliadoBanco: metodo !== 'EFECTIVO',
                facturaId: target.id,
                otId: target.otId,
              })
            })
            setModalAbonoFactura(null)
          }}
        />
      )}

      {/* MODAL 2: EMITIR FACTURA A CLIENTE O REGISTRAR FACTURA DE PROVEEDOR */}
      {modalNuevaFactura && (
        <ModalNuevaFactura
          direccionInicial={modalNuevaFactura}
          onClose={() => setModalNuevaFactura(null)}
        />
      )}

      {/* MODAL 3: REGISTRAR COMPRA (EQUIPOS, HERRAMIENTAS, REPUESTOS) O INGRESO */}
      {modalMovimiento && (
        <ModalNuevoMovimiento
          tipoInicial={modalMovimiento.tipoInicial}
          rubroInicial={modalMovimiento.rubroInicial}
          onClose={() => setModalMovimiento(null)}
        />
      )}
    </>
  )
}

function setResultadoMetodo(val: 'TODOS' | MetodoPago, setter: (v: 'TODOS' | MetodoPago) => void) {
  setter(val)
}

function ModalAbonoFactura({
  factura,
  onClose,
  onConfirm,
}: {
  factura: FacturaCuenta
  onClose: () => void
  onConfirm: (monto: number, metodo: MetodoPago, nota: string) => void
}) {
  const saldoPendiente = Math.max(0, factura.montoTotal - factura.montoPagado)
  const [monto, setMonto] = useState(saldoPendiente)
  const [metodo, setMetodo] = useState<MetodoPago>('TRANSFERENCIA')
  const [nota, setNota] = useState(factura.notas ?? '')

  const esCobro = factura.direccion === 'POR_COBRAR'

  return (
    <Modal
      open
      onClose={onClose}
      title={
        esCobro
          ? `💵 Registrar cobro de ${factura.folio} (${factura.contraparteNombre})`
          : `💸 Registrar pago de ${factura.folio} (${factura.contraparteNombre})`
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (monto <= 0) return
          onConfirm(Math.min(saldoPendiente, Number(monto)), metodo, nota)
        }}
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div className="font-bold text-slate-900">{factura.concepto}</div>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2">
            <div>
              <div className="text-slate-400">Total factura</div>
              <div className="font-bold text-slate-800">{fmtCLP(factura.montoTotal)}</div>
            </div>
            <div>
              <div className="text-slate-400">{esCobro ? 'Ya cobrado' : 'Ya pagado'}</div>
              <div className="font-bold text-emerald-700">{fmtCLP(factura.montoPagado)}</div>
            </div>
            <div>
              <div className="text-slate-400">{esCobro ? 'Saldo que nos deben' : 'Saldo por pagar'}</div>
              <div className="font-extrabold text-rose-600">{fmtCLP(saldoPendiente)}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Btn type="button" size="sm" variant="secondary" onClick={() => setMonto(saldoPendiente)}>
            100% Saldo total ({fmtCLP(saldoPendiente)})
          </Btn>
          <Btn type="button" size="sm" variant="secondary" onClick={() => setMonto(Math.round(saldoPendiente / 2))}>
            50% Abono ({fmtCLP(Math.round(saldoPendiente / 2))})
          </Btn>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={esCobro ? 'Monto a cobrar ahora ($ CLP)' : 'Monto a pagar ahora ($ CLP)'}>
            <input
              type="number"
              min={1}
              max={saldoPendiente}
              className={inputCls}
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Método de pago">
            <select className={inputCls} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
              <option value="TRANSFERENCIA">Transferencia bancaria</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta Débito / Crédito</option>
              <option value="CHEQUE">Cheque / Vale Vista</option>
            </select>
          </Field>
        </div>

        <Field label="Nota / Comprobante de operación">
          <input
            className={inputCls}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: Transferencia Banco BCI operación #948120"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant={esCobro ? 'primary' : 'danger'}>
            {esCobro ? `Confirmar ingreso (+${fmtCLP(monto)})` : `Confirmar pago (-${fmtCLP(monto)})`}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

function ModalNuevaFactura({
  direccionInicial,
  onClose,
}: {
  direccionInicial: DireccionFactura
  onClose: () => void
}) {
  const { db, mutate } = useStore()
  const [direccion, setDireccion] = useState<DireccionFactura>(direccionInicial)
  const esCobro = direccion === 'POR_COBRAR'

  const [folio, setFolio] = useState(
    esCobro ? `FAC-${1043 + (db.facturas?.length ?? 0)}` : `PROV-${20100 + (db.facturas?.length ?? 0)}`,
  )
  const [tipoDoc, setTipoDoc] = useState<TipoDocFactura>(esCobro ? 'FACTURA_AFECTA' : 'PROVEEDOR')
  const [empresaId, setEmpresaId] = useState<string>(esCobro ? '1' : '')
  const [otId, setOtId] = useState<string>('')
  const [contraparteNombre, setContraparteNombre] = useState(
    esCobro ? db.empresas[0]?.razonSocial ?? '' : 'Tecnoglobal S.A.',
  )
  const [contraparteRut, setContraparteRut] = useState(esCobro ? db.empresas[0]?.rut ?? '' : '96.543.210-K')
  const [concepto, setConcepto] = useState('')
  const [categoria, setCategoria] = useState(esCobro ? 'Mantención B2B' : 'Repuestos y Hardware')
  const [fechaEmision, setFechaEmision] = useState(today())
  const [fechaVencimiento, setFechaVencimiento] = useState(addDays(today(), 15))
  const [montoTotal, setMontoTotal] = useState(150000)
  const [montoPagadoInicial, setMontoPagadoInicial] = useState(0)
  const [metodo, setMetodo] = useState<MetodoPago>('TRANSFERENCIA')
  const [notas, setNotas] = useState('')

  const handleSelectEmpresa = (idStr: string) => {
    setEmpresaId(idStr)
    const emp = db.empresas.find((e) => e.id === Number(idStr))
    if (emp) {
      setContraparteNombre(emp.razonSocial)
      setContraparteRut(emp.rut)
    }
  }

  const handleSelectOT = (idStr: string) => {
    setOtId(idStr)
    const ot = db.ots.find((o) => o.id === Number(idStr))
    if (ot) {
      setConcepto(`${ot.titulo} (${ot.codigo})`)
      if (ot.total > 0) setMontoTotal(ot.total)
      if (ot.empresaId) handleSelectEmpresa(String(ot.empresaId))
    }
  }

  const exenta = tipoDoc === 'FACTURA_EXENTA'
  const neto = exenta ? montoTotal : Math.round(montoTotal / 1.19)
  const iva = exenta ? 0 : montoTotal - neto

  return (
    <Modal
      open
      onClose={onClose}
      title={
        esCobro
          ? '📥 Emitir Factura / Documento por Cobrar a Cliente'
          : '📤 Registrar Factura por Pagar a Proveedor'
      }
      wide
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          mutate((d) => {
            const id = nextId(d.facturas)
            const pagado = Math.min(montoTotal, Math.max(0, Number(montoPagadoInicial)))
            const estado = pagado >= montoTotal ? 'PAGADA' : pagado > 0 ? 'ABONADA' : 'PENDIENTE'
            const nueva: FacturaCuenta = {
              id,
              folio,
              direccion,
              tipoDoc,
              empresaId: esCobro && empresaId ? Number(empresaId) : undefined,
              otId: esCobro && otId ? Number(otId) : undefined,
              contraparteNombre,
              contraparteRut,
              concepto,
              categoria,
              fechaEmision,
              fechaVencimiento,
              montoNeto: neto,
              montoIva: iva,
              montoTotal: Number(montoTotal),
              montoPagado: pagado,
              estado,
              metodoPago: pagado > 0 ? metodo : undefined,
              fechaUltimoPago: pagado > 0 ? fechaEmision : undefined,
              notas: notas.trim() || undefined,
            }
            d.facturas.push(nueva)

            if (pagado > 0) {
              d.movimientos.push({
                id: nextId(d.movimientos),
                fecha: fechaEmision,
                tipo: direccion === 'POR_COBRAR' ? 'INGRESO' : 'EGRESO',
                rubro: direccion === 'POR_COBRAR' ? 'INGRESO_OT' : 'REPUESTOS',
                categoria,
                concepto: `${direccion === 'POR_COBRAR' ? 'Cobro' : 'Pago'} inicial ${folio} — ${concepto}`,
                contraparte: contraparteNombre,
                monto: pagado,
                metodo,
                nroDocumento: folio,
                conciliadoBanco: metodo !== 'EFECTIVO',
                facturaId: id,
                otId: nueva.otId,
              })
            }
          })
          onClose()
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setDireccion('POR_COBRAR')
              setFolio(`FAC-${1043 + (db.facturas?.length ?? 0)}`)
              setTipoDoc('FACTURA_AFECTA')
            }}
            className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
              esCobro
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            📥 Me deben (Factura / Boleta emitida a Cliente)
          </button>
          <button
            type="button"
            onClick={() => {
              setDireccion('POR_PAGAR')
              setFolio(`PROV-${20100 + (db.facturas?.length ?? 0)}`)
              setTipoDoc('PROVEEDOR')
              setEmpresaId('')
              setContraparteNombre('Tecnoglobal S.A.')
              setContraparteRut('96.543.210-K')
            }}
            className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
              !esCobro ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            📤 Debo pagar (Factura recibida de Proveedor)
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Folio / Nº Factura">
            <input className={inputCls} value={folio} onChange={(e) => setFolio(e.target.value)} required />
          </Field>
          <Field label="Tipo de documento">
            <select
              className={inputCls}
              value={tipoDoc}
              onChange={(e) => setTipoDoc(e.target.value as TipoDocFactura)}
            >
              <option value="FACTURA_AFECTA">Factura Afecta (19% IVA)</option>
              <option value="FACTURA_EXENTA">Factura Exenta</option>
              <option value="BOLETA">Boleta Electrónica</option>
              <option value="NOTA_COBRO">Nota de Cobro / OT</option>
              <option value="PROVEEDOR">Factura Proveedor</option>
            </select>
          </Field>
          <Field label="Categoría">
            <input className={inputCls} value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
          </Field>

          {esCobro && (
            <>
              <Field label="Autocompletar Empresa B2B (opcional)">
                <select className={inputCls} value={empresaId} onChange={(e) => handleSelectEmpresa(e.target.value)}>
                  <option value="">— Cliente Particular / Otro —</option>
                  {db.empresas.map((em) => (
                    <option key={em.id} value={em.id}>
                      {em.razonSocial} ({em.rut})
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Vincular a Orden de Trabajo OT (opcional)">
                  <select className={inputCls} value={otId} onChange={(e) => handleSelectOT(e.target.value)}>
                    <option value="">— Sin OT vinculada —</option>
                    {db.ots.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.codigo} · {o.titulo} ({fmtCLP(o.total)})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <Field label={esCobro ? 'Razón Social / Nombre del Cliente' : 'Razón Social del Proveedor'}>
              <input
                className={inputCls}
                value={contraparteNombre}
                onChange={(e) => setContraparteNombre(e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="RUT">
            <input
              className={inputCls}
              value={contraparteRut}
              onChange={(e) => setContraparteRut(e.target.value)}
              required
            />
          </Field>

          <div className="sm:col-span-3">
            <Field label="Concepto / Glosa de la factura">
              <input
                className={inputCls}
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder={
                  esCobro
                    ? 'Ej: Mantención preventiva parque 9 equipos según convenio'
                    : 'Ej: Compra de 5 discos SSD NVMe 1TB + Pasta térmica'
                }
                required
              />
            </Field>
          </div>

          <Field label="Fecha de emisión">
            <input
              type="date"
              className={inputCls}
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              required
            />
          </Field>
          <Field label="Fecha de vencimiento">
            <input
              type="date"
              className={inputCls}
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              required
            />
          </Field>
          <Field label="Monto Total Bruto ($ CLP)">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={montoTotal}
              onChange={(e) => setMontoTotal(Number(e.target.value))}
              required
            />
          </Field>

          <Field label={esCobro ? 'Abono recibido hoy ($ CLP)' : 'Monto pagado hoy ($ CLP)'}>
            <input
              type="number"
              min={0}
              max={montoTotal}
              className={inputCls}
              value={montoPagadoInicial}
              onChange={(e) => setMontoPagadoInicial(Number(e.target.value))}
            />
          </Field>
          <Field label="Método de pago (si hubo abono)">
            <select className={inputCls} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </Field>
          <div className="flex flex-col justify-center rounded-xl bg-slate-50 px-3 py-2 text-xs">
            <div className="text-slate-500">
              Neto: <strong>{fmtCLP(neto)}</strong> · IVA: <strong>{fmtCLP(iva)}</strong>
            </div>
            <div className="font-extrabold text-slate-900">
              Saldo pendiente: {fmtCLP(Math.max(0, montoTotal - montoPagadoInicial))}
            </div>
          </div>

          <div className="sm:col-span-3">
            <Field label="Notas / Observaciones">
              <input className={inputCls} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant={esCobro ? 'primary' : 'danger'}>
            {esCobro ? 'Guardar Factura por Cobrar' : 'Guardar Factura por Pagar'}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

function ModalNuevoMovimiento({
  tipoInicial = 'EGRESO',
  rubroInicial = 'HERRAMIENTAS',
  onClose,
}: {
  tipoInicial?: 'INGRESO' | 'EGRESO'
  rubroInicial?: RubroMovimiento
  onClose: () => void
}) {
  const { mutate } = useStore()
  const [tipo, setTipo] = useState<'INGRESO' | 'EGRESO'>(tipoInicial)
  const [rubro, setRubro] = useState<RubroMovimiento>(rubroInicial)
  const [fecha, setFecha] = useState(today())
  const [itemComprado, setItemComprado] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [concepto, setConcepto] = useState('')
  const [contraparte, setContraparte] = useState('')
  const [nroDocumento, setNroDocumento] = useState('')
  const [monto, setMonto] = useState(45000)
  const [metodo, setMetodo] = useState<MetodoPago>('TRANSFERENCIA')
  const [sumarAInventario, setSumarAInventario] = useState(true)
  const [claveLicenciaCompra, setClaveLicenciaCompra] = useState('')
  const [ubicacionCompra, setUbicacionCompra] = useState('Taller / Bodega PCG')

  const rubrosEgreso: RubroMovimiento[] = ['EQUIPOS', 'HERRAMIENTAS', 'REPUESTOS', 'INSUMOS', 'SOFTWARE', 'OPERACION']
  const rubrosIngreso: RubroMovimiento[] = ['INGRESO_OT', 'INGRESO_CONVENIO', 'CAPITAL']

  return (
    <Modal
      open
      onClose={onClose}
      title="🛠️ Registrar Compra (Equipos, Herramientas, Licencias, Repuestos) o Movimiento"
      wide
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          mutate((d) => {
            const meta = RUBRO_META[rubro]
            const qty = Math.max(1, Number(cantidad) || 1)
            const totalMonto = Number(monto) || 0
            d.movimientos.push({
              id: nextId(d.movimientos),
              fecha,
              tipo,
              rubro,
              categoria: meta.label,
              itemComprado: itemComprado.trim() || undefined,
              cantidad: qty,
              concepto: concepto.trim() || itemComprado.trim() || meta.label,
              contraparte,
              monto: totalMonto,
              metodo,
              nroDocumento: nroDocumento.trim() || undefined,
              conciliadoBanco: metodo !== 'EFECTIVO',
            })

            if (tipo === 'EGRESO' && sumarAInventario && rubro !== 'OPERACION' && itemComprado.trim()) {
              if (!d.inventario) d.inventario = []
              const catMap = {
                HERRAMIENTAS: { cat: 'HERRAMIENTA', prefix: 'INV-HER', unidad: 'unidades' },
                SOFTWARE: { cat: 'LICENCIA_SOFTWARE', prefix: 'INV-LIC', unidad: 'activaciones' },
                REPUESTOS: { cat: 'REPUESTO', prefix: 'INV-REP', unidad: 'unidades' },
                INSUMOS: { cat: 'INSUMO', prefix: 'INV-INS', unidad: 'unidades' },
                EQUIPOS: { cat: 'EQUIPO_INTERNO', prefix: 'INV-EQP', unidad: 'unidades' },
              } as const
              const mapped = catMap[rubro as keyof typeof catMap]
              if (mapped) {
                d.inventario.unshift({
                  id: nextId(d.inventario),
                  codigo: `${mapped.prefix}-${String(d.inventario.length + 1).padStart(3, '0')}`,
                  categoria: mapped.cat,
                  nombre: itemComprado.trim(),
                  marcaModelo: contraparte.trim() || 'Compra Directa PCG',
                  descripcion: concepto.trim() || undefined,
                  stockActual: qty,
                  enUso: 0,
                  stockMinimo: 1,
                  unidad: mapped.unidad,
                  costoUnitario: Math.round(totalMonto / qty),
                  proveedor: contraparte.trim() || 'Proveedor',
                  fechaUltimaCompra: fecha,
                  nroFacturaCompra: nroDocumento.trim() || undefined,
                  ubicacion:
                    mapped.cat === 'LICENCIA_SOFTWARE'
                      ? 'Bóveda Digital PCG'
                      : ubicacionCompra.trim() || 'Taller / Bodega PCG',
                  estadoFisico: mapped.cat === 'LICENCIA_SOFTWARE' ? undefined : 'OPERATIVO',
                  tipoLicencia: mapped.cat === 'LICENCIA_SOFTWARE' ? 'VOLUMEN_CORPORATIVO' : undefined,
                  claveLicencia:
                    mapped.cat === 'LICENCIA_SOFTWARE' ? claveLicenciaCompra.trim() || undefined : undefined,
                  fechaVencimientoLicencia:
                    mapped.cat === 'LICENCIA_SOFTWARE' ? addDays(fecha, 365) : undefined,
                })
              }
            }
          })
          onClose()
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTipo('EGRESO')
              setRubro('HERRAMIENTAS')
            }}
            className={`rounded-xl border p-2.5 text-xs font-bold transition ${
              tipo === 'EGRESO'
                ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-2xs'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            🛠️ Compra de Equipos / Herramientas / Gasto (- Caja)
          </button>
          <button
            type="button"
            onClick={() => {
              setTipo('INGRESO')
              setRubro('INGRESO_OT')
            }}
            className={`rounded-xl border p-2.5 text-xs font-bold transition ${
              tipo === 'INGRESO'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            ▲ Ingreso de Dinero / Cobro (+ Caja)
          </button>
        </div>

        {/* Selector visual de Rubro (¿Qué se compró?) */}
        <div>
          <div className="mb-1.5 text-xs font-bold text-slate-700">
            {tipo === 'EGRESO' ? '¿Qué tipo de compra o gasto es? (Para filtrar y analizar)' : 'Tipo de ingreso'}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(tipo === 'EGRESO' ? rubrosEgreso : rubrosIngreso).map((r) => {
              const m = RUBRO_META[r]
              const active = rubro === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRubro(r)}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
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

        {tipo === 'EGRESO' && (
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-3">
              <Field label="¿Qué equipo, herramienta o insumo se compró?">
                <input
                  className={inputCls}
                  value={itemComprado}
                  onChange={(e) => setItemComprado(e.target.value)}
                  placeholder={
                    rubro === 'HERRAMIENTAS'
                      ? 'Ej: Estación de soldadura SMD + Destornillador eléctrico precisión'
                      : rubro === 'EQUIPOS'
                        ? 'Ej: Notebook Lenovo ThinkPad E14 / Monitor LG 27" IPS'
                        : 'Ej: 4x Discos SSD NVMe 1TB / Pasta térmica Arctic MX-6'
                  }
                  required
                />
              </Field>
            </div>
            <Field label="Cantidad (Unid.)">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                required
              />
            </Field>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Detalle o motivo de uso (Taller / OT / Cliente)">
              <input
                className={inputCls}
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Equipamiento para laboratorio de microelectrónica / Compra para OT PCG-8924"
                required={tipo === 'INGRESO'}
              />
            </Field>
          </div>
          <Field label="Nº Boleta / Factura / Op. Banco">
            <input
              className={inputCls}
              value={nroDocumento}
              onChange={(e) => setNroDocumento(e.target.value)}
              placeholder="Ej: FAC-99120 o BOL-4410"
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label={tipo === 'INGRESO' ? 'Pagado por (Cliente)' : 'Proveedor / Tienda'}>
            <input
              className={inputCls}
              value={contraparte}
              onChange={(e) => setContraparte(e.target.value)}
              placeholder={tipo === 'EGRESO' ? 'Ej: PC Factory / Sodimac / Tecnoglobal' : 'Ej: Cliente'}
              required
            />
          </Field>
          <Field label="Monto Total ($ CLP)">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Método de Pago">
            <select className={inputCls} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="TARJETA">Tarjeta Débito / Crédito</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </Field>
          <Field label="Fecha">
            <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </Field>
        </div>

        {tipo === 'EGRESO' && rubro !== 'OPERACION' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-emerald-950">
              <input
                type="checkbox"
                checked={sumarAInventario}
                onChange={(e) => setSumarAInventario(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              <span>
                📦 Agregar automáticamente al Control de Inventario (/app/inventario) con {cantidad} unidad(es) / cupos
              </span>
            </label>
            {sumarAInventario && (
              <div className="grid gap-3 sm:grid-cols-2">
                {rubro === 'SOFTWARE' ? (
                  <Field label="Clave de Licencia / Serial (Opcional para Bóveda)">
                    <input
                      className={cx(inputCls, 'font-mono text-xs')}
                      value={claveLicenciaCompra}
                      onChange={(e) => setClaveLicenciaCompra(e.target.value)}
                      placeholder="Ej: XXXX-XXXX-XXXX-XXXX"
                    />
                  </Field>
                ) : (
                  <Field label="Ubicación en Taller / Bodega">
                    <input
                      className={cx(inputCls, 'text-xs')}
                      value={ubicacionCompra}
                      onChange={(e) => setUbicacionCompra(e.target.value)}
                      placeholder="Ej: Banco de Trabajo 1 · Laboratorio PCG"
                    />
                  </Field>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" variant={tipo === 'INGRESO' ? 'primary' : 'danger'}>
            {tipo === 'EGRESO' ? `Registrar Compra (-${fmtCLP(monto)})` : `Registrar Ingreso (+${fmtCLP(monto)})`}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
