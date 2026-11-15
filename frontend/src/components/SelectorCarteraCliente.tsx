import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { resolverORegistrarCliente, type DatosClienteForm } from '@/lib/actions'
import { Badge, Field, cx, inputCls } from './kit'

const normRut = (r: string) => r.replace(/[^0-9kK]/g, '').toLowerCase()
const normEmail = (e: string) => e.split(',')[0].trim().toLowerCase()

export interface ClienteCarteraItem {
  key: string
  usuarioId?: number
  empresaId?: number
  tipoCliente: 'EMPRESA' | 'PERSONA'
  nombreMostrar: string
  nombreContacto: string
  rut: string
  email: string
  telefono: string
  giro: string
  ciudad: string
  direccion: string
  cantEquipos: number
  cantOts: number
  cantCotizaciones: number
}

export default function SelectorCarteraCliente({
  value,
  onChange,
  showEmailToggle,
  enviarAlCrear,
  onToggleEnviar,
}: {
  value: DatosClienteForm
  onChange: (next: DatosClienteForm) => void
  showEmailToggle?: boolean
  enviarAlCrear?: boolean
  onToggleEnviar?: (next: boolean) => void
}) {
  const { db, mutate } = useStore()
  const [busquedaCartera, setBusquedaCartera] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'EMPRESA' | 'PERSONA'>('TODOS')
  const [avisoGuardado, setAvisoGuardado] = useState<string | null>(null)

  const clientesCartera: ClienteCarteraItem[] = useMemo(() => {
    const items: ClienteCarteraItem[] = []
    const empresasCubiertas = new Set<number>()

    // 1. Todos los clientes registrados en Usuarios (Empresas B2B y Personas Naturales)
    db.usuarios
      .filter((u) => u.rol === 'CLIENTE_EMPRESA' || u.rol === 'CLIENTE_PERSONA')
      .forEach((u) => {
        const emp = db.empresas.find(
          (e) => (u.empresaId !== undefined && e.id === u.empresaId) || e.contactoId === u.id,
        )
        if (emp) empresasCubiertas.add(emp.id)

        const esEmpresa = Boolean(emp) || u.rol === 'CLIENTE_EMPRESA'
        const cantEquipos = (db.equipos ?? []).filter((eq) =>
          emp ? eq.empresaId === emp.id || eq.usuarioId === u.id : eq.usuarioId === u.id,
        ).length
        const cantOts = (db.ots ?? []).filter((ot) =>
          emp ? ot.empresaId === emp.id || ot.usuarioId === u.id : ot.usuarioId === u.id,
        ).length
        const cantCotizaciones = (db.cotizaciones ?? []).filter((cot) =>
          emp ? cot.empresaId === emp.id || cot.usuarioId === u.id : cot.usuarioId === u.id,
        ).length

        items.push({
          key: `U-${u.id}`,
          usuarioId: u.id,
          empresaId: emp?.id ?? u.empresaId,
          tipoCliente: esEmpresa ? 'EMPRESA' : 'PERSONA',
          nombreMostrar: emp ? emp.razonSocial : u.nombre,
          nombreContacto: u.nombre,
          rut: emp?.rut ?? u.rut ?? '',
          email: u.email,
          telefono: u.telefono ?? '+56 9 3029 0082',
          giro: emp?.giro ?? (esEmpresa ? 'Servicios TI' : 'Particular'),
          ciudad: emp?.ciudad ?? u.ciudad ?? 'Santiago',
          direccion: emp?.direccion ?? u.direccion ?? '',
          cantEquipos,
          cantOts,
          cantCotizaciones,
        })
      })

    // 2. Empresas B2B que aún no tienen un usuario contacto enlazado
    db.empresas.forEach((emp) => {
      if (empresasCubiertas.has(emp.id)) return
      const cantEquipos = (db.equipos ?? []).filter((eq) => eq.empresaId === emp.id).length
      const cantOts = (db.ots ?? []).filter((ot) => ot.empresaId === emp.id).length
      const cantCotizaciones = (db.cotizaciones ?? []).filter((cot) => cot.empresaId === emp.id).length

      items.push({
        key: `E-${emp.id}`,
        usuarioId: emp.contactoId || undefined,
        empresaId: emp.id,
        tipoCliente: 'EMPRESA',
        nombreMostrar: emp.razonSocial,
        nombreContacto: emp.razonSocial,
        rut: emp.rut,
        email: '',
        telefono: '+56 9 3029 0082',
        giro: emp.giro ?? 'Servicios TI',
        ciudad: emp.ciudad ?? 'Santiago',
        direccion: emp.direccion ?? '',
        cantEquipos,
        cantOts,
        cantCotizaciones,
      })
    })

    return items
  }, [db.usuarios, db.empresas, db.equipos, db.ots, db.cotizaciones])

  const conteosTipo = useMemo(() => {
    const empresas = clientesCartera.filter((c) => c.tipoCliente === 'EMPRESA').length
    const personas = clientesCartera.filter((c) => c.tipoCliente === 'PERSONA').length
    return { total: clientesCartera.length, empresas, personas }
  }, [clientesCartera])

  const clienteSeleccionado = useMemo(() => {
    if (value.usuarioId) {
      const byUid = clientesCartera.find((c) => c.usuarioId === value.usuarioId)
      if (byUid) return byUid
    }
    const cleanRut = normRut(value.rut ?? '')
    const cleanEmail = normEmail(value.email ?? '')
    return clientesCartera.find(
      (c) =>
        (cleanRut.length >= 6 && normRut(c.rut) === cleanRut) ||
        (cleanEmail.length >= 4 && normEmail(c.email) === cleanEmail),
    )
  }, [clientesCartera, value.usuarioId, value.rut, value.email])

  // Filtrado rápido combinado: Tipo de Cliente (Todos / Empresa B2B / Persona Natural) + Búsqueda en vivo
  const clientesFiltradosBusqueda = useMemo(() => {
    const byTipo =
      filtroTipo === 'TODOS'
        ? clientesCartera
        : clientesCartera.filter((c) => c.tipoCliente === filtroTipo)

    const q = busquedaCartera.trim().toLowerCase()
    if (!q) return byTipo

    const qRut = normRut(q)
    return byTipo.filter((c) => {
      const hay =
        `${c.nombreMostrar} ${c.nombreContacto} ${c.rut} ${c.email} ${c.telefono} ${c.ciudad} ${c.giro}`.toLowerCase()
      return hay.includes(q) || (qRut.length >= 2 && normRut(c.rut).includes(qRut))
    })
  }, [clientesCartera, filtroTipo, busquedaCartera])

  // Sugerencias en tiempo real mientras escribe en formulario de Nuevo Cliente
  const sugerenciasAlEscribir = useMemo(() => {
    const qRazon = (value.razonSocial ?? '').trim().toLowerCase()
    const qNombre = (value.nombreContacto ?? '').trim().toLowerCase()
    const qRut = normRut(value.rut ?? '')
    const qEmail = normEmail(value.email ?? '')

    if (qRazon.length < 2 && qNombre.length < 2 && qRut.length < 2 && qEmail.length < 2) {
      return []
    }

    return clientesCartera.filter((c) => {
      if (value.usuarioId && value.usuarioId === c.usuarioId) return false
      const matchRazon =
        qRazon.length >= 2 &&
        (c.nombreMostrar.toLowerCase().includes(qRazon) || c.nombreContacto.toLowerCase().includes(qRazon))
      const matchNombre =
        qNombre.length >= 2 &&
        (c.nombreContacto.toLowerCase().includes(qNombre) || c.nombreMostrar.toLowerCase().includes(qNombre))
      const matchRut = qRut.length >= 2 && normRut(c.rut).includes(qRut)
      const matchEmail = qEmail.length >= 2 && normEmail(c.email).includes(qEmail)
      return matchRazon || matchNombre || matchRut || matchEmail
    })
  }, [clientesCartera, value.razonSocial, value.nombreContacto, value.rut, value.email, value.usuarioId])

  // Coincidencia exacta en BD
  const coincidenciaExactaBD = useMemo(() => {
    if (value.usuarioId) {
      return clientesCartera.find((c) => c.usuarioId === value.usuarioId)
    }
    const cleanEmail = normEmail(value.email)
    const cleanRut = normRut(value.rut)
    const cleanRazon = (value.razonSocial ?? '').trim().toLowerCase()

    return clientesCartera.find(
      (c) =>
        (cleanEmail && normEmail(c.email) === cleanEmail) ||
        (cleanRut && cleanRut.length >= 6 && normRut(c.rut) === cleanRut) ||
        (cleanRazon && cleanRazon.length >= 4 && c.nombreMostrar.toLowerCase() === cleanRazon),
    )
  }, [clientesCartera, value.email, value.rut, value.razonSocial, value.usuarioId])

  // Seleccionar y autorellenar todos los campos con un cliente registrado
  const handleAutorellenarCliente = (found: ClienteCarteraItem, mantenerFormularioAbierto = false) => {
    setAvisoGuardado(null)
    onChange({
      modo: mantenerFormularioAbierto ? 'VALIDAR_O_NUEVO' : 'CARTERA',
      usuarioId: found.usuarioId,
      tipoCliente: found.tipoCliente,
      nombreContacto: found.nombreContacto,
      email: found.email,
      telefono: found.telefono,
      rut: found.rut,
      razonSocial: found.nombreMostrar,
      giro: found.giro,
      ciudad: found.ciudad,
      direccion: found.direccion,
      inscribirAlertas: true,
    })
  }

  // Guardar cliente nuevo o editado directamente en la Cartera (BD + MySQL) y dejarlo seleccionado
  const handleGuardarEnCarteraYSeleccionar = () => {
    if (value.tipoCliente === 'EMPRESA' && !(value.razonSocial ?? '').trim()) {
      alert('Ingresa la Razón Social de la empresa para guardarla en la Cartera.')
      return
    }
    if (!value.nombreContacto.trim()) {
      alert('Ingresa el nombre del cliente o contacto para guardarlo en la Cartera.')
      return
    }
    if (!value.rut.trim()) {
      alert('Ingresa el RUT del cliente para guardarlo en la Cartera.')
      return
    }
    if (!value.email.trim()) {
      alert('Ingresa el correo electrónico del cliente para guardarlo en la Cartera.')
      return
    }

    let resultado: { usuarioId: number; email: string; esNuevo: boolean; nombreMostrar: string } | null = null
    mutate((d) => {
      resultado = resolverORegistrarCliente(d, { ...value, modo: 'VALIDAR_O_NUEVO' })
    })

    if (resultado) {
      const r = resultado as { usuarioId: number; email: string; esNuevo: boolean; nombreMostrar: string }
      onChange({
        ...value,
        modo: 'CARTERA',
        usuarioId: r.usuarioId,
        email: r.email,
      })
      setFiltroTipo(value.tipoCliente === 'EMPRESA' ? 'EMPRESA' : 'PERSONA')
      setBusquedaCartera('')
      setAvisoGuardado(
        r.esNuevo
          ? `✓ "${r.nombreMostrar}" guardado en la Cartera de Clientes y seleccionado.`
          : `✓ Datos de "${r.nombreMostrar}" actualizados en la Cartera.`,
      )
    }
  }

  return (
    <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-r from-sky-50/90 via-white to-emerald-50/60 p-4 shadow-2xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-xs">
            👥
          </span>
          <div>
            <div className="text-xs font-extrabold text-slate-900">
              Cartera de Clientes (Empresas y Personas) &amp; Autocompletado
            </div>
            <div className="text-[11px] text-slate-500">
              Filtra rápido por Empresa B2B o Persona Natural, busca por nombre/RUT/correo o registra un nuevo cliente directo en BD.
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setAvisoGuardado(null)
              if (!value.usuarioId) {
                const current = clientesCartera[0]
                if (current) {
                  handleAutorellenarCliente(current, false)
                  return
                }
              }
              onChange({ ...value, modo: 'CARTERA' })
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              value.modo === 'CARTERA'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔎 Buscar en Cartera ({conteosTipo.total})
          </button>
          <button
            type="button"
            onClick={() => {
              setAvisoGuardado(null)
              setBusquedaCartera('')
              onChange({
                ...value,
                modo: 'VALIDAR_O_NUEVO',
                usuarioId: undefined,
                razonSocial: '',
                nombreContacto: '',
                rut: '',
                email: '',
                telefono: '+56 9 ',
                direccion: '',
                ciudad: 'Santiago',
              })
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              value.modo === 'VALIDAR_O_NUEVO'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✍️ Nuevo / Editar Cliente
          </button>
        </div>
      </div>

      {avisoGuardado && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
          <span>{avisoGuardado}</span>
          <button
            type="button"
            onClick={() => setAvisoGuardado(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            ✕
          </button>
        </div>
      )}

      {value.modo === 'CARTERA' ? (
        <div className="space-y-3">
          {/* Barra de filtro rápido por tipo + buscador en tiempo real */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Filtrar:
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('TODOS')}
                  className={cx(
                    'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                    filtroTipo === 'TODOS'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  👥 Todos ({conteosTipo.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('EMPRESA')}
                  className={cx(
                    'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                    filtroTipo === 'EMPRESA'
                      ? 'bg-violet-700 text-white shadow-2xs'
                      : 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80 hover:bg-violet-100',
                  )}
                >
                  🏢 Empresas B2B ({conteosTipo.empresas})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('PERSONA')}
                  className={cx(
                    'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                    filtroTipo === 'PERSONA'
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80 hover:bg-sky-100',
                  )}
                >
                  👤 Personas Naturales ({conteosTipo.personas})
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-400">
                Mostrando {clientesFiltradosBusqueda.length} de {conteosTipo.total}
              </span>
            </div>

            {/* Buscador instantáneo */}
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                🔎
              </span>
              <input
                type="text"
                className={`${inputCls} !pl-9 !pr-20`}
                value={busquedaCartera}
                onChange={(e) => setBusquedaCartera(e.target.value)}
                placeholder="Buscar rápido por nombre, empresa, RUT (con o sin puntos), correo, teléfono o ciudad..."
              />
              {busquedaCartera.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => setBusquedaCartera('')}
                  className="absolute inset-y-1.5 right-2 rounded-lg bg-slate-100 px-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>

            {/* Lista interactiva directa para elegir en 1 clic */}
            <div className="mt-2.5 max-h-52 space-y-1.5 overflow-y-auto pr-1">
              {clientesFiltradosBusqueda.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-600">
                  <div>No hay coincidencias para &ldquo;{busquedaCartera}&rdquo; en esta categoría.</div>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        ...value,
                        modo: 'VALIDAR_O_NUEVO',
                        usuarioId: undefined,
                        tipoCliente: filtroTipo === 'PERSONA' ? 'PERSONA' : 'EMPRESA',
                        razonSocial: filtroTipo === 'PERSONA' ? '' : busquedaCartera,
                        nombreContacto: busquedaCartera,
                        rut: '',
                        email: '',
                        telefono: '+56 9 ',
                      })
                    }}
                    className="mt-2 inline-flex items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    + Registrar &ldquo;{busquedaCartera || 'Nuevo Cliente'}&rdquo; en Cartera →
                  </button>
                </div>
              ) : (
                clientesFiltradosBusqueda.map((c) => {
                  const isSel =
                    (c.usuarioId !== undefined && value.usuarioId === c.usuarioId) ||
                    (clienteSeleccionado?.key === c.key)
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleAutorellenarCliente(c, false)}
                      className={cx(
                        'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition',
                        isSel
                          ? 'border-emerald-400 bg-emerald-50/90 text-emerald-950 shadow-2xs ring-1 ring-emerald-300'
                          : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-slate-50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 font-extrabold text-slate-900">
                          <span>{c.tipoCliente === 'EMPRESA' ? '🏢' : '👤'}</span>
                          <span className="truncate">{c.nombreMostrar}</span>
                          <Badge tone={c.tipoCliente === 'EMPRESA' ? 'violet' : 'blue'}>
                            {c.tipoCliente === 'EMPRESA' ? 'Empresa B2B' : 'Persona Natural'}
                          </Badge>
                          <span className="font-mono text-[11px] font-semibold text-slate-600">
                            · {c.rut || 'Sin RUT'}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                          {c.tipoCliente === 'EMPRESA' && (
                            <span>
                              Contacto: <b className="text-slate-700">{c.nombreContacto}</b>
                            </span>
                          )}
                          <span>✉ {c.email || 'Sin correo'}</span>
                          <span>📞 {c.telefono}</span>
                          <span className="text-slate-400">
                            ({c.cantEquipos} eq · {c.cantOts} OT · {c.cantCotizaciones} cotiz.)
                          </span>
                        </div>
                      </div>
                      <span
                        className={cx(
                          'shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-extrabold',
                          isSel
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
                        )}
                      >
                        {isSel ? '✓ Seleccionado' : 'Seleccionar'}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Ficha de cliente seleccionado + correo destino */}
          <div className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 sm:grid-cols-3">
            <div className="sm:col-span-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-emerald-900">✓ Cliente Seleccionado:</span>
                <Badge tone={value.tipoCliente === 'EMPRESA' ? 'violet' : 'blue'}>
                  {value.tipoCliente === 'EMPRESA' ? '🏢 EMPRESA B2B' : '👤 PERSONA NATURAL'}
                </Badge>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, modo: 'VALIDAR_O_NUEVO' })}
                  className="ml-auto rounded-lg border border-emerald-300 bg-white px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  ✎ Editar datos completos
                </button>
              </div>
              <div className="mt-1.5 font-bold text-slate-900">
                {value.razonSocial || value.nombreContacto || 'Selecciona un cliente arriba'}
              </div>
              <div className="mt-0.5 text-slate-700">
                Contacto: <b>{value.nombreContacto || '—'}</b> · RUT:{' '}
                <span className="font-mono font-semibold">{value.rut || 'S/R'}</span> · Tel:{' '}
                {value.telefono || '—'}
                {value.direccion ? ` · 📍 ${value.direccion}` : ''}
                {value.ciudad ? `, ${value.ciudad}` : ''}
              </div>
            </div>

            <Field label="Correo electrónico destino">
              <input
                type="text"
                className={`${inputCls} bg-white`}
                value={value.email}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
                placeholder="cliente@empresa.cl"
                required
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Banner superior: indica si ya se autorellenó un cliente existente o si es uno nuevo */}
          {coincidenciaExactaBD ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-950">
              <div>
                <strong>✓ Cliente vinculado con Cartera:</strong>{' '}
                <b>{coincidenciaExactaBD.nombreMostrar}</b> (RUT {coincidenciaExactaBD.rut || 'S/R'} ·{' '}
                {coincidenciaExactaBD.email}). Puedes editar sus campos y guardar directo en Cartera.
              </div>
              <div className="flex gap-1.5">
                {value.usuarioId !== coincidenciaExactaBD.usuarioId && (
                  <button
                    type="button"
                    onClick={() => handleAutorellenarCliente(coincidenciaExactaBD, true)}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700"
                  >
                    ⚡ Autorellenar todos los campos →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      usuarioId: undefined,
                      razonSocial: '',
                      nombreContacto: '',
                      rut: '',
                      email: '',
                      telefono: '+56 9 ',
                      direccion: '',
                    })
                  }
                  className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  Limpiar campos
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-950">
              <div>
                <strong>★ Registrar Cliente en Cartera:</strong> Elige Empresa B2B o Persona Particular. Al guardar o emitir, quedará conectado en la base de datos.
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...value, tipoCliente: 'EMPRESA' })}
                  className={`rounded-lg px-2.5 py-1 font-bold ${
                    value.tipoCliente === 'EMPRESA'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                >
                  🏢 Empresa B2B
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, tipoCliente: 'PERSONA' })}
                  className={`rounded-lg px-2.5 py-1 font-bold ${
                    value.tipoCliente === 'PERSONA'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                >
                  👤 Persona Natural
                </button>
              </div>
            </div>
          )}

          {/* SUGERENCIAS EN VIVO MIENTRAS ESCRIBE */}
          {sugerenciasAlEscribir.length > 0 && (
            <div className="rounded-2xl border border-emerald-300 bg-white p-2.5 shadow-md">
              <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-extrabold text-emerald-800">
                <span>💡 Clientes en Cartera que coinciden con lo que escribes (Clic para usar):</span>
                <span className="text-slate-400">{sugerenciasAlEscribir.length} coincidencia(s)</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {sugerenciasAlEscribir.slice(0, 4).map((sug) => (
                  <button
                    key={sug.key}
                    type="button"
                    onClick={() => handleAutorellenarCliente(sug, false)}
                    className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-left text-xs transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-extrabold text-slate-900">
                        {sug.tipoCliente === 'EMPRESA' ? '🏢 ' : '👤 '}
                        {sug.nombreMostrar}
                      </div>
                      <div className="truncate text-[11px] text-slate-600">
                        {sug.nombreContacto} · RUT {sug.rut || 'S/R'} · {sug.email}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-2xs">
                      ⚡ Seleccionar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {value.tipoCliente === 'EMPRESA' && (
              <Field label="Razón Social de la Empresa *">
                <input
                  className={inputCls}
                  value={value.razonSocial ?? ''}
                  onChange={(e) => onChange({ ...value, usuarioId: undefined, razonSocial: e.target.value })}
                  placeholder="Ej: Constructora Andes SpA"
                  required
                />
              </Field>
            )}
            <Field label={value.tipoCliente === 'EMPRESA' ? 'Nombre del Contacto *' : 'Nombre Completo (Persona Natural) *'}>
              <input
                className={inputCls}
                value={value.nombreContacto}
                onChange={(e) => onChange({ ...value, usuarioId: undefined, nombreContacto: e.target.value })}
                placeholder="Ej: Pedro Muñoz / Carolina Reyes..."
                required
              />
            </Field>
            <Field label="RUT (Empresa o Persona) *">
              <input
                className={inputCls}
                value={value.rut}
                onChange={(e) => onChange({ ...value, usuarioId: undefined, rut: e.target.value })}
                placeholder="76.543.210-K o 18.234.567-8"
                required
              />
            </Field>
            <Field label="Correo electrónico *">
              <input
                type="email"
                className={inputCls}
                value={value.email}
                onChange={(e) => onChange({ ...value, usuarioId: undefined, email: e.target.value })}
                placeholder="contacto@cliente.cl"
                required
              />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input
                className={inputCls}
                value={value.telefono ?? ''}
                onChange={(e) => onChange({ ...value, telefono: e.target.value })}
                placeholder="+56 9 3029 0082"
              />
            </Field>
            <Field label="Ciudad">
              <input
                className={inputCls}
                value={value.ciudad ?? ''}
                onChange={(e) => onChange({ ...value, ciudad: e.target.value })}
                placeholder="Santiago"
              />
            </Field>
            <div className={value.tipoCliente === 'EMPRESA' ? 'sm:col-span-2' : 'sm:col-span-3'}>
              <Field label={value.tipoCliente === 'EMPRESA' ? 'Dirección comercial' : 'Dirección particular'}>
                <input
                  className={inputCls}
                  value={value.direccion ?? ''}
                  onChange={(e) => onChange({ ...value, direccion: e.target.value })}
                  placeholder="Av. Providencia 1234, Of. 601"
                />
              </Field>
            </div>
            {value.tipoCliente === 'EMPRESA' && (
              <Field label="Giro comercial">
                <input
                  className={inputCls}
                  value={value.giro ?? ''}
                  onChange={(e) => onChange({ ...value, giro: e.target.value })}
                  placeholder="Ingeniería / Comercio / Salud"
                />
              </Field>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleGuardarEnCarteraYSeleccionar}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-500"
            >
              💾 Guardar en Cartera y Seleccionar
            </button>
          </div>
        </div>
      )}

      {showEmailToggle && onToggleEnviar && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sky-200/60 pt-2.5 text-xs">
          <span className="text-slate-600">
            Remitente oficial: <strong className="font-mono text-emerald-700">{db.config.email}</strong>
          </span>
          <label className="flex cursor-pointer items-center gap-2 font-bold text-emerald-900">
            <input
              type="checkbox"
              checked={enviarAlCrear}
              onChange={(e) => onToggleEnviar(e.target.checked)}
            />
            Enviar automáticamente la cotización al correo indicado al guardar
          </label>
        </div>
      )}
    </div>
  )
}
