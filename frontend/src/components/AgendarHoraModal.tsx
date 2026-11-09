import { useState } from 'react'
import { useStore } from '@/lib/store'
import { agendarHoraMantencion, resolverORegistrarCliente } from '@/lib/actions'
import type { DatosClienteForm } from '@/lib/actions'
import { TIPO_HW_META } from '@/lib/types'
import type { TipoHw } from '@/lib/types'
import { addDays, fmtCLP, fmtFecha, today } from '@/lib/util'
import SelectorCarteraCliente from './SelectorCarteraCliente'
import { Badge, Btn, Field, Modal, cx, inputCls } from './kit'

const BLOQUES_HORARIOS = [
  { hora: '09:00', label: '09:00 hrs', turno: 'Mañana' },
  { hora: '10:30', label: '10:30 hrs', turno: 'Mañana' },
  { hora: '12:00', label: '12:00 hrs', turno: 'Mediodía' },
  { hora: '15:00', label: '15:00 hrs', turno: 'Tarde' },
  { hora: '16:30', label: '16:30 hrs', turno: 'Tarde' },
  { hora: '18:00', label: '18:00 hrs', turno: 'Tarde' },
]

const TIPOS_EQUIPO_NATURAL: TipoHw[] = ['LAPTOP', 'DESKTOP', 'IMPRESORA', 'TARJETA_GRAFICA', 'PLACA_MADRE', 'CAMARA', 'OTRO']

export default function AgendarHoraModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess?: (otId: number) => void
}) {
  const { db, user, mutate } = useStore()
  const isStaff = user!.rol === 'ADMIN' || user!.rol === 'DOC_PROCESS' || user!.rol === 'WORKER'

  // Si lo abre el Admin, por defecto apunta al primer cliente natural (ej. Matías Soto) o permite registrar uno nuevo
  const clientes = db.usuarios.filter((u) => u.rol === 'CLIENTE_PERSONA' || u.rol === 'CLIENTE_EMPRESA')
  const defaultPersona = clientes.find((u) => u.rol === 'CLIENTE_PERSONA') ?? clientes[0]
  const defaultEmp = db.empresas.find((e) => e.id === defaultPersona?.empresaId)

  const [clienteForm, setClienteForm] = useState<DatosClienteForm>(() => ({
    modo: 'CARTERA',
    usuarioId: isStaff ? defaultPersona?.id : user!.id,
    tipoCliente: isStaff
      ? defaultPersona?.rol === 'CLIENTE_EMPRESA'
        ? 'EMPRESA'
        : 'PERSONA'
      : user!.rol === 'CLIENTE_EMPRESA'
        ? 'EMPRESA'
        : 'PERSONA',
    razonSocial: defaultEmp?.razonSocial ?? (isStaff ? defaultPersona?.nombre : user!.nombre) ?? '',
    rut: defaultEmp?.rut ?? (isStaff ? defaultPersona?.rut : user!.rut) ?? '',
    giro: defaultEmp?.giro ?? 'Particular',
    ciudad: defaultEmp?.ciudad ?? 'Santiago',
    direccion: defaultEmp?.direccion ?? '',
    nombreContacto: (isStaff ? defaultPersona?.nombre : user!.nombre) ?? '',
    email: (isStaff ? defaultPersona?.email : user!.email) ?? '',
    telefono: (isStaff ? defaultPersona?.telefono : user!.telefono) ?? '+56 9 ',
    inscribirAlertas: false,
  }))

  const activeUid = isStaff ? clienteForm.usuarioId : user!.id
  const activeCli = db.usuarios.find((u) => u.id === activeUid)
  const equiposDelCliente =
    (!isStaff || clienteForm.modo === 'CARTERA') && activeUid
      ? db.equipos.filter((e) =>
          activeCli?.empresaId ? e.empresaId === activeCli.empresaId : e.usuarioId === activeUid,
        )
      : []

  const [modoEquipo, setModoEquipo] = useState<'EXISTENTE' | 'NUEVO'>(
    equiposDelCliente.length > 0 ? 'EXISTENTE' : 'NUEVO',
  )
  const [equipoExistenteId, setEquipoExistenteId] = useState<number | undefined>(equiposDelCliente[0]?.id)
  const [tipoHw, setTipoHw] = useState<TipoHw>('LAPTOP')
  const [marca, setMarca] = useState('Lenovo / HP / Asus')
  const [modelo, setModelo] = useState('Notebook Personal')
  const [serie, setSerie] = useState('')

  // Selección de plan de mantención
  const planesMantencion = [
    {
      id: 'mant-prev',
      titulo: 'Mantención Preventiva Completa + Pasta Térmica Premium',
      desc: 'Limpieza ultrasónica/aire, lubricación de coolers, cambio de pasta térmica y test de temperaturas.',
      precio: 45000,
    },
    {
      id: 'mant-soft',
      titulo: 'Formateo Profesional + Windows + Office + Optimización',
      desc: 'Instalación limpia, drivers oficiales, suite ofimática y optimización de arranque.',
      precio: 50000,
    },
    {
      id: 'pack-full',
      titulo: 'Pack Full Cliente Natural (Mantención Hardware + Formateo Completo)',
      desc: 'Mantención física integral + sistema operativo optimizado con descuento pack.',
      precio: 80000,
    },
    {
      id: 'diag-rep',
      titulo: 'Diagnóstico Técnico / Reparación de Falla o Sobrecalentamiento',
      desc: 'Revisión electrónica, chequeo de fuente/placa/GPU y presupuesto de reparación.',
      precio: 25000,
    },
  ]
  const [planSel, setPlanSel] = useState(planesMantencion[0].id)
  const planActual = planesMantencion.find((p) => p.id === planSel) ?? planesMantencion[0]

  // Fecha, bloque horario y modalidad
  const proximosDias = Array.from({ length: 10 }, (_, i) => addDays(today(), i + 1))
  const [fechaCita, setFechaCita] = useState(proximosDias[0])
  const [horaCita, setHoraCita] = useState('10:30')
  const [modalidad, setModalidad] = useState<'LABORATORIO' | 'DOMICILIO'>('LABORATORIO')
  const [direccionRetiro, setDireccionRetiro] = useState(defaultEmp?.direccion || '')
  const [comunaRetiro, setComunaRetiro] = useState(defaultEmp?.ciudad || 'Santiago')
  const [referenciaRetiro, setReferenciaRetiro] = useState('')
  const [tecnicoId, setTecnicoId] = useState<number>(3)
  const [comentarios, setComentarios] = useState('')

  const workers = db.usuarios.filter((u) => u.rol === 'WORKER' && u.activo)
  const ocupadasEnFecha = db.ots
    .filter((o) => o.inicio === fechaCita && o.estado !== 'CANCELADA' && o.horaCita)
    .map((o) => o.horaCita!)

  return (
    <Modal open onClose={onClose} title="📅 Agendar Hora de Mantención (Reserva de Hora y Creación de OT)" wide>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (modalidad === 'DOMICILIO' && !direccionRetiro.trim()) {
            alert('Por favor indica la dirección para el retiro a domicilio.')
            return
          }
          let createdOtId = 0
          mutate((d) => {
            const resolved = isStaff
              ? resolverORegistrarCliente(d, clienteForm)
              : { usuarioId: user!.id, empresaId: user!.empresaId }

            const dirTexto =
              modalidad === 'DOMICILIO' && direccionRetiro.trim()
                ? `${direccionRetiro.trim()}, ${comunaRetiro.trim() || 'Santiago'}${referenciaRetiro.trim() ? ` (Ref: ${referenciaRetiro.trim()})` : ''}`
                : undefined

            const res = agendarHoraMantencion(d, {
              usuarioId: resolved.usuarioId,
              empresaId: resolved.empresaId,
              fechaCita,
              horaCita,
              modalidadAtencion: modalidad,
              direccionRetiro: dirTexto,
              tituloServicio: planActual.titulo,
              montoEstimado: planActual.precio,
              equipoExistenteId: modoEquipo === 'EXISTENTE' ? equipoExistenteId : undefined,
              nuevoEquipo:
                modoEquipo === 'NUEVO'
                  ? {
                      tipo: tipoHw,
                      marca,
                      modelo,
                      serie,
                    }
                  : undefined,
              sintomasOComentarios: comentarios.trim() || undefined,
              tecnicoId,
              creadoPor: user!.id,
            })
            createdOtId = res.ot.id
          })
          onClose()
          if (onSuccess && createdOtId) onSuccess(createdOtId)
        }}
      >
        {/* Banner explicativo */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-sky-50/70 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-xs">
                📅
              </span>
              <div>
                <div className="text-xs font-extrabold text-slate-900">
                  Reserva de Hora Directa para Mantención · Clientes Naturales y Empresas
                </div>
                <div className="text-[11px] text-slate-600">
                  Al confirmar la hora se genera automáticamente tu <b>Orden de Trabajo (OT)</b> en el calendario de PCG SPA y recibes confirmación por correo.
                </div>
              </div>
            </div>
            <Badge tone="green">Confirmación inmediata</Badge>
          </div>
        </div>

        {/* 1. Si es Admin/Staff, selector o registro de Cliente (Natural o Empresa) */}
        {isStaff && (
          <SelectorCarteraCliente
            value={clienteForm}
            onChange={(next) => {
              setClienteForm(next)
              const eqs = dEquiposFor(db, next.usuarioId)
              if (eqs.length > 0 && next.modo === 'CARTERA') {
                setModoEquipo('EXISTENTE')
                setEquipoExistenteId(eqs[0].id)
              } else {
                setModoEquipo('NUEVO')
              }
            }}
          />
        )}

        {/* 2. Selección del Servicio / Mantención */}
        <div>
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
            1. ¿Qué mantención o servicio necesitas agendar?
          </span>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {planesMantencion.map((p) => {
              const active = planSel === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanSel(p.id)}
                  className={cx(
                    'flex flex-col justify-between rounded-2xl border p-3 text-left transition',
                    active
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60',
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{p.titulo}</span>
                      <span className="shrink-0 rounded-lg bg-emerald-600 px-2 py-0.5 text-xs font-extrabold text-white">
                        {fmtCLP(p.precio)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{p.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Selección de Fecha y Bloque Horario */}
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 p-4">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-indigo-950">
            2. Selecciona Día y Hora de Atención
          </span>

          {/* Días rápidos */}
          <div className="mb-3">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Día disponible:</span>
            <div className="flex flex-wrap gap-1.5">
              {proximosDias.map((d) => {
                const active = fechaCita === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFechaCita(d)}
                    className={cx(
                      'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300',
                    )}
                  >
                    {fmtFecha(d)}
                  </button>
                )
              })}
              <input
                type="date"
                min={today()}
                value={fechaCita}
                onChange={(e) => setFechaCita(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
              />
            </div>
          </div>

          {/* Bloques horarios */}
          <div className="mb-3">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Bloque horario para el <b>{fmtFecha(fechaCita)}</b>:
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {BLOQUES_HORARIOS.map((b) => {
                const ocupado = ocupadasEnFecha.includes(b.hora)
                const active = horaCita === b.hora
                return (
                  <button
                    key={b.hora}
                    type="button"
                    onClick={() => setHoraCita(b.hora)}
                    className={cx(
                      'flex flex-col items-center rounded-xl border px-2.5 py-2 text-center transition',
                      active
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : ocupado
                          ? 'border-amber-200 bg-amber-50/70 text-amber-800 hover:border-amber-300'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-400',
                    )}
                  >
                    <span className="text-sm font-extrabold">🕒 {b.hora}</span>
                    <span className={cx('text-[10px] font-semibold', active ? 'text-emerald-100' : ocupado ? 'text-amber-700' : 'text-emerald-600')}>
                      {ocupado ? 'Con sobrecupo' : '● Disponible'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modalidad + Técnico */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Modalidad de entrega / atención">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalidad('LABORATORIO')}
                  className={cx(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition',
                    modalidad === 'LABORATORIO'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  🏢 En Laboratorio PCG SPA
                </button>
                <button
                  type="button"
                  onClick={() => setModalidad('DOMICILIO')}
                  className={cx(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition',
                    modalidad === 'DOMICILIO'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  🚗 Retiro / Domicilio
                </button>
              </div>
            </Field>

            <Field label="Técnico especialista preferido">
              <select
                className={inputCls}
                value={tecnicoId}
                onChange={(e) => setTecnicoId(Number(e.target.value))}
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nombre} — {w.cargo}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {modalidad === 'DOMICILIO' && (
            <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                  📍 Dirección para Retiro a Domicilio
                </span>
                <span className="rounded bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                  Requerido
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="Dirección (Calle, Número, Depto/Oficina) *">
                    <input
                      className={inputCls}
                      value={direccionRetiro}
                      onChange={(e) => setDireccionRetiro(e.target.value)}
                      placeholder="Ej: Av. Providencia 1234, Depto 502"
                      required={modalidad === 'DOMICILIO'}
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Comuna / Ciudad *">
                    <input
                      className={inputCls}
                      value={comunaRetiro}
                      onChange={(e) => setComunaRetiro(e.target.value)}
                      placeholder="Ej: Providencia, Santiago…"
                      required={modalidad === 'DOMICILIO'}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Referencia de retiro / acceso (Opcional)">
                    <input
                      className={inputCls}
                      value={referenciaRetiro}
                      onChange={(e) => setReferenciaRetiro(e.target.value)}
                      placeholder="Ej: Portón negro, llamar antes de pasar, conserjería autorizada"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Datos del Equipo a Mantener */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              3. Equipo que ingresará a mantención
            </span>
            {equiposDelCliente.length > 0 && (
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setModoEquipo('EXISTENTE')}
                  className={cx(
                    'rounded-md px-2.5 py-1 font-bold',
                    modoEquipo === 'EXISTENTE' ? 'bg-slate-900 text-white' : 'text-slate-600',
                  )}
                >
                  Mis equipos registrados ({equiposDelCliente.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModoEquipo('NUEVO')}
                  className={cx(
                    'rounded-md px-2.5 py-1 font-bold',
                    modoEquipo === 'NUEVO' ? 'bg-slate-900 text-white' : 'text-slate-600',
                  )}
                >
                  + Otro equipo nuevo
                </button>
              </div>
            )}
          </div>

          {modoEquipo === 'EXISTENTE' && equiposDelCliente.length > 0 ? (
            <div>
              <Field label="Selecciona tu equipo">
                <select
                  className={inputCls}
                  value={equipoExistenteId}
                  onChange={(e) => setEquipoExistenteId(Number(e.target.value))}
                >
                  {equiposDelCliente.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {TIPO_HW_META[eq.tipo]?.icon} {eq.codigo} · {eq.marca} {eq.modelo} {eq.serie ? `· S/N: ${eq.serie}` : ''} ({eq.area})
                    </option>
                  ))}
                </select>
              </Field>
              {(() => {
                const eqSel = equiposDelCliente.find((x) => x.id === equipoExistenteId)
                if (!eqSel) return null
                return (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-2xs">
                    <div>
                      <span className="font-extrabold text-slate-800">{eqSel.codigo} — {eqSel.marca} {eqSel.modelo}</span>
                      <span className="ml-2 text-slate-500">Ubicación: {eqSel.area}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded ring-1 ring-emerald-200">
                      <span>🔢 S/N:</span> {eqSel.serie || 'Sin serie registrada'}
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Categoría de equipo">
                <select
                  className={inputCls}
                  value={tipoHw}
                  onChange={(e) => setTipoHw(e.target.value as TipoHw)}
                >
                  {TIPOS_EQUIPO_NATURAL.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_HW_META[t].icon} {TIPO_HW_META[t].label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marca">
                <input
                  className={inputCls}
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  required
                  placeholder="Ej: Asus, Lenovo, HP, Dell…"
                />
              </Field>
              <Field label="Modelo">
                <input
                  className={inputCls}
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  required
                  placeholder="Ej: TUF Gaming F15 / IdeaPad 3"
                />
              </Field>
              <Field label="Número de serie (S/N)">
                <input
                  className={inputCls}
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  placeholder="Ej: 5CD1234XYZ o S/N bajo el equipo"
                />
              </Field>
            </div>
          )}

          <div className="mt-3">
            <Field label="Síntomas, observaciones o dirección (si elegiste domicilio)">
              <input
                className={inputCls}
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Ej: Se calienta al jugar, ventilador suena fuerte, necesito respaldo de fotos…"
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <div className="text-xs text-slate-600">
            Resumen: <b>{fmtFecha(fechaCita)}</b> a las <b className="text-emerald-700">{horaCita} hrs</b> · Total estimado:{' '}
            <b className="text-slate-900">{fmtCLP(planActual.precio)}</b>
          </div>
          <div className="flex gap-2">
            <Btn type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Btn>
            <Btn type="submit">✓ Confirmar Hora y Generar OT</Btn>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function dEquiposFor(db: ReturnType<typeof useStore>['db'], uid?: number) {
  if (!uid) return []
  const u = db.usuarios.find((x) => x.id === uid)
  if (!u) return []
  return db.equipos.filter((e) => (u.empresaId ? e.empresaId === u.empresaId : e.usuarioId === u.id))
}
