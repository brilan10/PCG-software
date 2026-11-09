import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useStore } from '@/lib/store'
import { agendarHoraMantencion, crearTicket, resolverORegistrarCliente } from '@/lib/actions'
import { TIPO_HW_META } from '@/lib/types'
import type { TipoHw } from '@/lib/types'
import { addDays, fmtCLP, fmtFecha, today } from '@/lib/util'
import { cx } from '@/components/kit'

const BLOQUES_HORARIOS = ['09:00', '10:30', '12:00', '15:00', '16:30', '18:00']

export default function QuickAccess() {
  const { db, user, loginAs, mutate } = useStore()
  const nav = useNavigate()
  const [modalMode, setModalMode] = useState<null | 'HORA_NATURAL' | 'TICKET_PUBLICO'>(null)

  // Datos del cliente (Persona Natural o Empresa)
  const [tipoCliente, setTipoCliente] = useState<'PERSONA' | 'EMPRESA'>('PERSONA')
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('+56 9 ')
  const [razonSocial, setRazonSocial] = useState('')
  const ciudad = 'Santiago'

  // Datos de la mantención / equipo
  const [planSel, setPlanSel] = useState('mant-prev')
  const [fechaCita, setFechaCita] = useState(addDays(today(), 1))
  const [horaCita, setHoraCita] = useState('10:30')
  const [modalidad, setModalidad] = useState<'LABORATORIO' | 'DOMICILIO'>('LABORATORIO')
  const [tipoHw, setTipoHw] = useState<TipoHw>('LAPTOP')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [comentarios, setComentarios] = useState('')

  const planes = [
    { id: 'mant-prev', titulo: 'Mantención Preventiva Completa + Pasta Térmica', precio: 45000 },
    { id: 'mant-soft', titulo: 'Formateo + Windows + Office + Optimización', precio: 50000 },
    { id: 'pack-full', titulo: 'Pack Full Persona Natural (Mantención + Formateo)', precio: 80000 },
    { id: 'diag-rep', titulo: 'Diagnóstico Técnico / Reparación de Falla', precio: 25000 },
  ]
  const planActual = planes.find((p) => p.id === planSel) ?? planes[0]
  const proximosDias = Array.from({ length: 7 }, (_, i) => addDays(today(), i + 1))

  return (
    <section id="accesos" className="bg-slate-950 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-pcg-green">
            Atención a Personas Naturales y Empresas B2B
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">¿Qué necesitas gestionar hoy?</h2>
          <p className="mt-2 text-sm text-slate-400">
            Tanto <strong className="text-emerald-400">Personas Naturales (Particulares)</strong> como{' '}
            <strong className="text-sky-400">Empresas</strong> pueden agendar hora de mantención, solicitar cotización o consultar el estado de su equipo.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Persona Natural / Agendar Hora directa */}
          <QuickAccessCard
            glowColor="rgba(16, 185, 129, 0.28)"
            borderColor="rgba(52, 211, 153, 0.85)"
            shadowClass="hover:shadow-[0_25px_60px_-10px_rgba(16,185,129,0.45)] hover:border-emerald-400/80"
            delay={0}
          >
            <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              👤 Personas Naturales y Particulares
            </div>
            <h3 className="text-lg font-semibold text-white">Agendar Hora de Mantención</h3>
            <p className="mt-2 flex-1 text-sm text-slate-300">
              ¿Necesitas mantención preventiva, cambio de pasta térmica o formateo para tu Notebook o PC? Reserva día y hora directamente y genera tu OT al instante.
            </p>
            <p className="mt-3 text-xs font-semibold text-emerald-400">
              ✓ Sin trámites: te registra automáticamente en nuestra cartera y genera tu hora
            </p>
            <button
              type="button"
              onClick={() => {
                if (user) {
                  nav('/app/ot?agendar=1')
                } else {
                  setTipoCliente('PERSONA')
                  setModalMode('HORA_NATURAL')
                }
              }}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 group/btn"
            >
              <span>📅 Generar Hora de Mantención</span>
              <span className="inline-block transition-transform duration-200 group-hover/btn:translate-x-1.5">→</span>
            </button>
          </QuickAccessCard>

          {/* Card 2: Solicitar ticket o cotización (Personas Naturales y Empresas) */}
          <QuickAccessCard
            glowColor="rgba(14, 165, 233, 0.26)"
            borderColor="rgba(56, 189, 248, 0.85)"
            shadowClass="hover:shadow-[0_25px_60px_-10px_rgba(14,165,233,0.38)] hover:border-sky-400/80"
            delay={0.08}
          >
            <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
              👤 Personas Naturales · 🏢 Empresas
            </div>
            <h3 className="text-lg font-semibold text-white">Solicitar ticket o cotización</h3>
            <p className="mt-2 flex-1 text-sm text-slate-400">
              Abre un ticket para 1 o más equipos (particular o empresa) y recibe tu cotización formal basada en nuestras plantillas Excel y PDF.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    nav('/app/tickets?nuevo=1')
                  } else {
                    setModalMode('TICKET_PUBLICO')
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/50 bg-sky-500/15 px-3.5 py-2 text-xs font-bold text-sky-300 transition hover:bg-sky-500/25 group/btn"
              >
                <span>⚡ Solicitar directo (Persona Natural o Empresa)</span>
                <span className="inline-block transition-transform duration-200 group-hover/btn:translate-x-1.5">→</span>
              </button>
              <Link
                to="/login?next=/app/tickets%3Fnuevo%3D1"
                className="text-center text-xs font-medium text-slate-400 hover:text-pcg-green hover:underline"
              >
                O iniciar sesión en mi cuenta →
              </Link>
            </div>
          </QuickAccessCard>

          {/* Card 3: Consultar estado de un equipo */}
          <QuickAccessCard
            glowColor="rgba(139, 92, 246, 0.28)"
            borderColor="rgba(168, 85, 247, 0.85)"
            shadowClass="hover:shadow-[0_25px_60px_-10px_rgba(139,92,246,0.38)] hover:border-violet-400/80"
            delay={0.16}
          >
            <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
              🔍 Seguimiento en Vivo
            </div>
            <h3 className="text-lg font-semibold text-white">Consultar estado de un equipo</h3>
            <p className="mt-2 flex-1 text-sm text-slate-400">
              Ingresa tu código único de Orden de Trabajo (ej. PCG-2026-8922 o PCG-2026-8929) y revisa el avance y técnico asignado en vivo.
            </p>
            <p className="mt-3 text-xs text-emerald-400/90">✓ Consulta pública inmediata sin clave</p>
            <Link
              to="/estado"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-pcg-green hover:underline group/link"
            >
              <span>Consultar estado ahora</span>
              <span className="inline-block transition-transform duration-200 group-hover/link:translate-x-1.5">→</span>
            </Link>
          </QuickAccessCard>

          {/* Card 4: Alertas preventivas */}
          <QuickAccessCard
            glowColor="rgba(245, 158, 11, 0.28)"
            borderColor="rgba(251, 191, 36, 0.85)"
            shadowClass="hover:shadow-[0_25px_60px_-10px_rgba(245,158,11,0.38)] hover:border-amber-400/80"
            delay={0.24}
          >
            <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
              ◔ Avisos Preventivos (-7d)
            </div>
            <h3 className="text-lg font-semibold text-white">Alertas y Convenios Preventivos</h3>
            <p className="mt-2 flex-1 text-sm text-slate-400">
              Recibe avisos automáticos por correo 1 semana antes de que corresponda la mantención de tus equipos personales o parque corporativo.
            </p>
            <Link
              to="/app/alertas"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-400 hover:text-amber-300 hover:underline group/link"
            >
              <span>Acceder al Portal de Mantenciones</span>
              <span className="inline-block transition-transform duration-200 group-hover/link:translate-x-1.5">→</span>
            </Link>
          </QuickAccessCard>
        </div>
      </div>

      {/* Modal directo para Personas Naturales / Empresas sin obligar a tener cuenta previa */}
      {modalMode && (
        <div
          onClick={() => setModalMode(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 text-white shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  {modalMode === 'HORA_NATURAL' ? '📅 Reserva Directa de Hora · PCG SPA' : '✉ Solicitud Directa de Ticket / Cotización'}
                </span>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {modalMode === 'HORA_NATURAL'
                    ? 'Agendar Hora de Mantención (Persona Natural o Empresa)'
                    : 'Solicitar Ticket o Cotización Formal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-sm text-slate-300 hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                let targetUid = 0
                let createdOtId = 0
                mutate((d) => {
                  const res = resolverORegistrarCliente(d, {
                    modo: 'VALIDAR_O_NUEVO',
                    tipoCliente,
                    nombreContacto: nombre.trim(),
                    email: email.trim(),
                    telefono: telefono.trim(),
                    rut: rut.trim(),
                    razonSocial: tipoCliente === 'EMPRESA' ? razonSocial.trim() || nombre.trim() : undefined,
                    giro: tipoCliente === 'EMPRESA' ? 'Servicios / Empresa' : undefined,
                    ciudad,
                    direccion: ciudad,
                    inscribirAlertas: true,
                  })
                  targetUid = res.usuarioId

                  if (modalMode === 'HORA_NATURAL') {
                    const r = agendarHoraMantencion(d, {
                      usuarioId: res.usuarioId,
                      empresaId: res.empresaId,
                      fechaCita,
                      horaCita,
                      modalidadAtencion: modalidad,
                      tituloServicio: planActual.titulo,
                      montoEstimado: planActual.precio,
                      nuevoEquipo: {
                        tipo: tipoHw,
                        marca: marca.trim() || 'Notebook / PC',
                        modelo: modelo.trim() || 'Personal',
                      },
                      sintomasOComentarios: comentarios.trim() || undefined,
                      creadoPor: res.usuarioId,
                    })
                    createdOtId = r.ot.id
                  } else {
                    const cliObj = d.usuarios.find((u) => u.id === res.usuarioId)!
                    crearTicket(d, cliObj, {
                      tipo: 'COTIZACION',
                      asunto: `Solicitud de ${ planActual.titulo } (${TIPO_HW_META[tipoHw].short})`,
                      descripcion: `${comentarios.trim() || 'Solicitud ingresada desde portal web.'}\nEquipo indicado: ${TIPO_HW_META[tipoHw].label} ${marca} ${modelo}.`,
                      equipoIds: [],
                      cantEquipos: 1,
                    })
                  }
                })
                setModalMode(null)
                if (targetUid) {
                  loginAs(targetUid)
                  nav(createdOtId ? `/app/ot?ot=${createdOtId}` : '/app/tickets')
                }
              }}
            >
              {/* Selector Persona Natural vs Empresa */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTipoCliente('PERSONA')}
                  className={`rounded-lg py-2 font-bold transition ${
                    tipoCliente === 'PERSONA' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👤 Soy Persona Natural (Particular)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCliente('EMPRESA')}
                  className={`rounded-lg py-2 font-bold transition ${
                    tipoCliente === 'EMPRESA' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏢 Soy Empresa / Institución (B2B)
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    {tipoCliente === 'PERSONA' ? 'Tu nombre completo *' : 'Nombre de contacto *'}
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Matías Soto"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    {tipoCliente === 'PERSONA' ? 'RUT Persona Natural *' : 'RUT Empresa *'}
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="Ej: 19.442.810-3"
                    required
                  />
                </div>
                {tipoCliente === 'EMPRESA' && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-300">Razón Social de la Empresa *</label>
                    <input
                      className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Ej: Comercial Los Andes SpA"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Correo electrónico (recibirás confirmación) *
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@gmail.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Teléfono / WhatsApp *</label>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    required
                  />
                </div>
              </div>

              {/* Selección de servicio */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Servicio requerido
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {planes.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanSel(p.id)}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                        planSel === p.id
                          ? 'border-emerald-400 bg-emerald-500/20 text-white'
                          : 'border-white/10 bg-slate-800/70 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="font-semibold pr-2">{p.titulo}</span>
                      <span className="shrink-0 rounded-md bg-emerald-600 px-2 py-0.5 font-extrabold text-white">
                        {fmtCLP(p.precio)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Si es Agendar Hora, mostrar día, bloque horario y modalidad */}
              {modalMode === 'HORA_NATURAL' && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3.5 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-emerald-300">
                      Selecciona Día y Bloque Horario:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {proximosDias.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFechaCita(d)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            fechaCita === d
                              ? 'border-emerald-400 bg-emerald-600 text-white'
                              : 'border-white/10 bg-slate-800 text-slate-300'
                          }`}
                        >
                          {fmtFecha(d)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {BLOQUES_HORARIOS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHoraCita(h)}
                        className={`rounded-xl border py-1.5 text-center text-xs font-extrabold ${
                          horaCita === h
                            ? 'border-emerald-400 bg-emerald-600 text-white'
                            : 'border-white/10 bg-slate-800 text-slate-300 hover:border-emerald-500/50'
                        }`}
                      >
                        🕒 {h}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalidad('LABORATORIO')}
                      className={`rounded-xl border py-2 text-xs font-bold ${
                        modalidad === 'LABORATORIO'
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                          : 'border-white/10 bg-slate-800 text-slate-400'
                      }`}
                    >
                      🏢 Llevo mi equipo al Laboratorio PCG
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalidad('DOMICILIO')}
                      className={`rounded-xl border py-2 text-xs font-bold ${
                        modalidad === 'DOMICILIO'
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                          : 'border-white/10 bg-slate-800 text-slate-400'
                      }`}
                    >
                      🚗 Solicitar Retiro / Domicilio
                    </button>
                  </div>
                </div>
              )}

              {/* Datos del equipo */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Tipo de equipo</label>
                  <select
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={tipoHw}
                    onChange={(e) => setTipoHw(e.target.value as TipoHw)}
                  >
                    {(['LAPTOP', 'DESKTOP', 'IMPRESORA', 'TARJETA_GRAFICA', 'SERVIDOR', 'CAMARA', 'OTRO'] as TipoHw[]).map((t) => (
                      <option key={t} value={t}>
                        {TIPO_HW_META[t].icon} {TIPO_HW_META[t].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Marca</label>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ej: Asus, Lenovo, HP…"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Modelo</label>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ej: VivoBook / Gamer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Síntomas o comentarios adicionales
                </label>
                <input
                  className="w-full rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white"
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Ej: Se calienta, hace ruido el ventilador, necesito mantener mis archivos…"
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs text-slate-400">
                  Quedarás registrado en la Cartera de Clientes de {db.config.razonSocial}.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500"
                  >
                    {modalMode === 'HORA_NATURAL' ? '✓ Confirmar Hora y Generar OT' : '✓ Enviar Solicitud'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * Tarjeta interactiva con física 3D Tilt, spotlight luminoso que persigue el cursor
 * y resplandor en los bordes conforme se desplaza el mouse con respuesta instantánea.
 */
function QuickAccessCard({
  children,
  className,
  glowColor = 'rgba(16, 185, 129, 0.28)',
  borderColor = 'rgba(52, 211, 153, 0.85)',
  shadowClass = 'hover:shadow-[0_25px_60px_-10px_rgba(16,185,129,0.45)] hover:border-emerald-400/80',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  glowColor?: string
  borderColor?: string
  shadowClass?: string
  delay?: number
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Resortes ultra-reactivos para respuesta inmediata sin lag ni desfase
  const springX = useSpring(x, { stiffness: 450, damping: 26 })
  const springY = useSpring(y, { stiffness: 450, damping: 26 })

  const rotateX = useTransform(springY, [-0.5, 0.5], ['7deg', '-7deg'])
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-7deg', '7deg'])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    mouseX.set(px)
    mouseY.set(py)
    x.set(px / rect.width - 0.5)
    y.set(py / rect.height - 0.5)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  const spotlightBg = useMotionTemplate`radial-gradient(380px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 80%)`
  const borderHighlight = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, ${borderColor}, transparent 70%)`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      style={{ perspective: '1100px' }}
      className="h-full"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          y: -8,
          scale: 1.03,
          transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.6 },
        }}
        className={cx(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-6 transition-shadow duration-200',
          shadowClass,
          className,
        )}
      >
        {/* Borde dinámico reactivo al cursor sin retraso */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ background: borderHighlight }}
        />

        {/* Fondo interior para crear grosor de borde elegante */}
        <div className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950" />

        {/* Halo de luz que persigue el cursor */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ background: spotlightBg }}
        />

        {/* Contenido en relieve */}
        <div className="relative z-10 flex h-full flex-col">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
