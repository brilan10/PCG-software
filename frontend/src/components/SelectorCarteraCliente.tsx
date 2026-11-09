import { useMemo, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import type { DatosClienteForm } from '@/lib/actions'
import { Badge, Field, cx, inputCls } from './kit'

const normRut = (r: string) => r.replace(/[^0-9kK]/g, '').toLowerCase()
const normEmail = (e: string) => e.split(',')[0].trim().toLowerCase()

export interface ClienteCarteraItem {
  usuarioId: number
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
  const { db } = useStore()
  const [busquedaCartera, setBusquedaCartera] = useState('')
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const clientesCartera: ClienteCarteraItem[] = useMemo(
    () =>
      db.usuarios
        .filter((u) => u.rol === 'CLIENTE_EMPRESA' || u.rol === 'CLIENTE_PERSONA')
        .map((u) => {
          const emp = db.empresas.find((e) => e.id === u.empresaId)
          return {
            usuarioId: u.id,
            empresaId: u.empresaId,
            tipoCliente: (emp ? 'EMPRESA' : 'PERSONA') as 'EMPRESA' | 'PERSONA',
            nombreMostrar: emp ? emp.razonSocial : u.nombre,
            nombreContacto: u.nombre,
            rut: emp?.rut ?? u.rut ?? '',
            email: u.email,
            telefono: u.telefono ?? '+56 9 4938 4043',
            giro: emp?.giro ?? (emp ? 'Servicios TI' : 'Particular'),
            ciudad: emp?.ciudad ?? 'Santiago',
            direccion: emp?.direccion ?? '',
          }
        }),
    [db.usuarios, db.empresas],
  )

  const clienteSeleccionado = useMemo(
    () => clientesCartera.find((c) => c.usuarioId === value.usuarioId),
    [clientesCartera, value.usuarioId],
  )

  // Filtrado en vivo para el buscador de Cartera
  const clientesFiltradosBusqueda = useMemo(() => {
    const q = busquedaCartera.trim().toLowerCase()
    if (!q) return clientesCartera
    const qRut = normRut(q)
    return clientesCartera.filter((c) => {
      const hay = `${c.nombreMostrar} ${c.nombreContacto} ${c.rut} ${c.email} ${c.ciudad} ${c.giro}`.toLowerCase()
      return hay.includes(q) || (qRut.length >= 2 && normRut(c.rut).includes(qRut))
    })
  }, [clientesCartera, busquedaCartera])

  // Sugerencias en tiempo real mientras escribe en cualquiera de los campos (Razón Social, Nombre, RUT o Correo)
  const sugerenciasAlEscribir = useMemo(() => {
    const qRazon = (value.razonSocial ?? '').trim().toLowerCase()
    const qNombre = (value.nombreContacto ?? '').trim().toLowerCase()
    const qRut = normRut(value.rut ?? '')
    const qEmail = normEmail(value.email ?? '')

    // Si no ha escrito al menos 2 caracteres en algún campo, no mostrar sugerencias
    if (qRazon.length < 2 && qNombre.length < 2 && qRut.length < 2 && qEmail.length < 2) {
      return []
    }

    return clientesCartera.filter((c) => {
      // Si ya es exactamente el cliente que acaba de autorellenar con su mismo usuarioId, no repetirlo como alerta
      if (value.usuarioId === c.usuarioId) return false
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

  // Autorellenar todos los campos con un cliente registrado
  const handleAutorellenarCliente = (found: ClienteCarteraItem, mantenerFormularioAbierto = false) => {
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
    setBusquedaCartera(`${found.nombreMostrar} (${found.rut || found.email})`)
    setDropdownAbierto(false)
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-sky-200/90 bg-gradient-to-r from-sky-50/90 via-white to-emerald-50/60 p-4 shadow-2xs"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-xs">
            👥
          </span>
          <div>
            <div className="text-xs font-extrabold text-slate-900">
              Cartera de Clientes & Autocompletado Inteligente ({db.config.email})
            </div>
            <div className="text-[11px] text-slate-500">
              Escribe para buscar y autorellenar un cliente registrado (Empresa o Particular), o ingresa uno nuevo.
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              const current =
                clientesCartera.find((c) => c.usuarioId === value.usuarioId) ?? clientesCartera[0]
              if (current) handleAutorellenarCliente(current, false)
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              value.modo === 'CARTERA'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔎 Buscar en Cartera ({clientesCartera.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setBusquedaCartera('')
              onChange({
                ...value,
                modo: 'VALIDAR_O_NUEVO',
                usuarioId: undefined,
                razonSocial: '',
                nombreContacto: '',
                rut: '',
                email: '',
                telefono: '',
              })
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              value.modo === 'VALIDAR_O_NUEVO'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✍️ Escribir / Nuevo Cliente (Con Autorelleno)
          </button>
        </div>
      </div>

      {value.modo === 'CARTERA' ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Buscador escribible con autocompletado de clientes registrados */}
            <div className="relative sm:col-span-2">
              <Field label="Escribir para buscar cliente registrado (Empresa B2B o Persona Natural)">
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputCls} pr-20`}
                    value={
                      dropdownAbierto
                        ? busquedaCartera
                        : clienteSeleccionado
                          ? `${clienteSeleccionado.tipoCliente === 'EMPRESA' ? '🏢' : '👤'} ${clienteSeleccionado.nombreMostrar} — RUT ${clienteSeleccionado.rut || 'S/R'}`
                          : busquedaCartera
                    }
                    onFocus={() => {
                      setBusquedaCartera('')
                      setDropdownAbierto(true)
                    }}
                    onChange={(e) => {
                      setBusquedaCartera(e.target.value)
                      setDropdownAbierto(true)
                    }}
                    placeholder="Escribe nombre, empresa, RUT o correo para filtrar..."
                  />
                  <div className="
                    absolute inset-y-0 right-2 flex items-center gap-1
                  ">
                    {dropdownAbierto ? (
                      <button
                        type="button"
                        onClick={() => setDropdownAbierto(false)}
                        className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                      >
                        Cerrar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setBusquedaCartera('')
                          setDropdownAbierto(true)
                        }}
                        className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        🔎 Buscar
                      </button>
                    )}
                  </div>
                </div>
              </Field>

              {/* Lista desplegable de sugerencias al escribir */}
              {dropdownAbierto && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                  {clientesFiltradosBusqueda.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-600">
                      <div>No se encontró &ldquo;{busquedaCartera}&rdquo; en la Cartera.</div>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownAbierto(false)
                          onChange({
                            ...value,
                            modo: 'VALIDAR_O_NUEVO',
                            usuarioId: undefined,
                            razonSocial: busquedaCartera,
                            nombreContacto: busquedaCartera,
                            rut: '',
                            email: '',
                            telefono: '',
                          })
                        }}
                        className="mt-2 inline-flex items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        + Crear &ldquo;{busquedaCartera}&rdquo; como Nuevo Cliente →
                      </button>
                    </div>
                  ) : (
                    clientesFiltradosBusqueda.map((c) => {
                      const isSel = c.usuarioId === value.usuarioId
                      return (
                        <button
                          key={c.usuarioId}
                          type="button"
                          onClick={() => handleAutorellenarCliente(c, false)}
                          className={cx(
                            'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition',
                            isSel
                              ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-300'
                              : 'hover:bg-slate-50',
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                              <span>{c.tipoCliente === 'EMPRESA' ? '🏢' : '👤'}</span>
                              <span className="truncate">{c.nombreMostrar}</span>
                              <Badge tone={c.tipoCliente === 'EMPRESA' ? 'violet' : 'blue'}>
                                {c.tipoCliente === 'EMPRESA' ? 'Empresa B2B' : 'Particular'}
                              </Badge>
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-slate-500">
                              Contacto: <b>{c.nombreContacto}</b> · RUT: <span className="font-mono">{c.rut || 'S/R'}</span> · ✉ {c.email}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                            Autorellenar
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <Field label="Correo electrónico destino (sale desde serviciotecnicopcg@gmail.com)">
              <input
                type="text"
                className={inputCls}
                value={value.email}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
                placeholder="cliente@empresa.cl"
                required
              />
            </Field>
          </div>

          {/* Ficha autorellenada con opción de editar cualquier dato */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-emerald-900">✓ Datos Autorellenados:</span>
              <Badge tone="green">{value.tipoCliente === 'EMPRESA' ? '🏢 EMPRESA B2B' : '👤 PERSONA NATURAL'}</Badge>
              <span className="text-slate-700">
                <b>{value.razonSocial || value.nombreContacto}</b> · Contacto: <b>{value.nombreContacto}</b> · RUT:{' '}
                <span className="font-mono font-semibold">{value.rut || 'S/R'}</span> · Tel: {value.telefono || '—'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...value, modo: 'VALIDAR_O_NUEVO' })}
              className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
            >
              ✎ Ver / Editar campos completos
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Banner superior: indica si ya se autorellenó un cliente existente o si es uno nuevo */}
          {coincidenciaExactaBD ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-950">
              <div>
                <strong>✓ Cliente vinculado y autorellenado desde tu Cartera:</strong>{' '}
                <b>{coincidenciaExactaBD.nombreMostrar}</b> (RUT {coincidenciaExactaBD.rut} · {coincidenciaExactaBD.email}). Puedes revisar o editar cualquier campo abajo.
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
                      telefono: '',
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
                <strong>★ Escribe el nombre, empresa o RUT:</strong> Si ya existe te sugeriremos autorellenarlo abajo; si es nuevo, se registrará automáticamente en tu <b>Cartera de Clientes</b>.
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
                  👤 Persona Particular
                </button>
              </div>
            </div>
          )}

          {/* SUGERENCIAS EN VIVO MIENTRAS ESCRIBE (AUTORELLENAR CON 1 CLIC) */}
          {sugerenciasAlEscribir.length > 0 && (
            <div className="rounded-2xl border border-emerald-300 bg-white p-2.5 shadow-md">
              <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-extrabold text-emerald-800">
                <span>💡 Clientes registrados que coinciden con lo que estás escribiendo (Haz clic para autorellenar):</span>
                <span className="text-slate-400">{sugerenciasAlEscribir.length} sugerencia(s)</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {sugerenciasAlEscribir.slice(0, 4).map((sug) => (
                  <button
                    key={sug.usuarioId}
                    type="button"
                    onClick={() => handleAutorellenarCliente(sug, true)}
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
                      ⚡ Autorellenar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {value.tipoCliente === 'EMPRESA' && (
              <Field label="Razón Social de la Empresa * (Escribe para buscar)">
                <input
                  className={inputCls}
                  value={value.razonSocial ?? ''}
                  onChange={(e) => onChange({ ...value, usuarioId: undefined, razonSocial: e.target.value })}
                  placeholder="Ej: Constructora Andes / Inversiones..."
                  required
                />
              </Field>
            )}
            <Field label={value.tipoCliente === 'EMPRESA' ? 'Nombre del Contacto * (Escribe para buscar)' : 'Nombre Completo del Cliente * (Escribe para buscar)'}>
              <input
                className={inputCls}
                value={value.nombreContacto}
                onChange={(e) => onChange({ ...value, usuarioId: undefined, nombreContacto: e.target.value })}
                placeholder="Ej: Pedro Muñoz / Carolina Reyes..."
                required
              />
            </Field>
            <Field label="RUT (Empresa o Cliente) *">
              <input
                className={inputCls}
                value={value.rut}
                onChange={(e) => onChange({ ...value, usuarioId: undefined, rut: e.target.value })}
                placeholder="76.543.210-K"
                required
              />
            </Field>
            <Field label="Correo electrónico (donde se enviará la cotización) *">
              <input
                type="email"
                className={inputCls}
                value={value.email}
                onChange={(e) => onChange({ ...value, usuarioId: undefined, email: e.target.value })}
                placeholder="contacto@empresa.cl"
                required
              />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input
                className={inputCls}
                value={value.telefono ?? ''}
                onChange={(e) => onChange({ ...value, telefono: e.target.value })}
                placeholder="+56 9 8888 7777"
              />
            </Field>
            {value.tipoCliente === 'EMPRESA' && (
              <>
                <Field label="Giro comercial">
                  <input
                    className={inputCls}
                    value={value.giro ?? ''}
                    onChange={(e) => onChange({ ...value, giro: e.target.value })}
                    placeholder="Ingeniería / Comercio / Salud"
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
                <div className="sm:col-span-2">
                  <Field label="Dirección comercial">
                    <input
                      className={inputCls}
                      value={value.direccion ?? ''}
                      onChange={(e) => onChange({ ...value, direccion: e.target.value })}
                      placeholder="Av. Apoquindo 3500, Of. 402"
                    />
                  </Field>
                </div>
              </>
            )}
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
