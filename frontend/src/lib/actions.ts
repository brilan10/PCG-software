import type {
  DB, Cotizacion, EstadoOT, Intervencion, ItemCot, OT, Tarea, Ticket, Informe, Usuario, Prioridad,
} from './types'
import {
  addDays, addMonths, calcAlertas, calcCot, nextCode, nextId, today,
  TAREAS_MANTENCION, TAREAS_PROYECTO_WEB, TAREAS_SOFTWARE_MEDIDA, TAREAS_DISENO_BRANDING, fmtFecha,
} from './util'

const ahora = () => new Date().toISOString()

export function enviarCorreo(
  db: DB,
  c: { tipo: DB['correos'][number]['tipo']; de?: string; para: string; cc?: string; asunto: string; cuerpo: string },
) {
  db.correos.unshift({
    id: nextId(db.correos),
    fecha: ahora(),
    de: c.de ?? `${db.config.razonSocial} <${db.config.email}>`,
    ...c,
  })
}

export interface DatosClienteForm {
  modo: 'CARTERA' | 'VALIDAR_O_NUEVO'
  usuarioId?: number
  tipoCliente: 'EMPRESA' | 'PERSONA'
  nombreContacto: string
  email: string
  telefono?: string
  rut: string
  razonSocial?: string
  giro?: string
  ciudad?: string
  direccion?: string
  inscribirAlertas?: boolean
}

const normRut = (r: string) => r.replace(/[^0-9kK]/g, '').toLowerCase()
const normEmail = (e: string) => e.split(',')[0].trim().toLowerCase()

/**
 * Valida si el cliente ya existe en la Cartera de Clientes (por ID, correo o RUT).
 * Si NO existe en la base de datos, lo registra automáticamente (Empresa B2B o Persona Particular).
 */
export function resolverORegistrarCliente(
  db: DB,
  d: DatosClienteForm,
): { usuarioId: number; empresaId?: number; email: string; esNuevo: boolean; nombreMostrar: string } {
  const cleanEmail = normEmail(d.email)
  const cleanRut = normRut(d.rut)

  // 1. Si viene seleccionado desde la cartera por usuarioId y no cambió de identidad
  if (d.modo === 'CARTERA' && d.usuarioId) {
    const existing = db.usuarios.find((u) => u.id === d.usuarioId)
    if (existing) {
      if (d.email.trim()) existing.email = cleanEmail || existing.email
      if (d.telefono?.trim()) existing.telefono = d.telefono.trim()
      const emp = db.empresas.find((e) => e.id === existing.empresaId)
      return {
        usuarioId: existing.id,
        empresaId: existing.empresaId,
        email: d.email.trim() || existing.email,
        esNuevo: false,
        nombreMostrar: emp?.razonSocial ?? existing.nombre,
      }
    }
  }

  // 2. Validar en la BD si ya existe por RUT de empresa, Razón Social, RUT de persona o Correo electrónico
  const empExistente = db.empresas.find(
    (e) =>
      (cleanRut && normRut(e.rut) === cleanRut) ||
      (d.razonSocial?.trim() && e.razonSocial.trim().toLowerCase() === d.razonSocial.trim().toLowerCase()),
  )
  if (empExistente) {
    const contacto = db.usuarios.find((u) => u.id === empExistente.contactoId)
    if (contacto) {
      if (cleanEmail) contacto.email = cleanEmail
      if (d.telefono?.trim()) contacto.telefono = d.telefono.trim()
      if (d.direccion?.trim()) empExistente.direccion = d.direccion.trim()
      if (d.ciudad?.trim()) empExistente.ciudad = d.ciudad.trim()
      return {
        usuarioId: contacto.id,
        empresaId: empExistente.id,
        email: d.email.trim() || contacto.email,
        esNuevo: false,
        nombreMostrar: empExistente.razonSocial,
      }
    }
  }

  const usuExistente = db.usuarios.find(
    (u) =>
      (u.rol === 'CLIENTE_EMPRESA' || u.rol === 'CLIENTE_PERSONA') &&
      ((cleanEmail && u.email.trim().toLowerCase() === cleanEmail) ||
        (cleanRut && u.rut && normRut(u.rut) === cleanRut)),
  )
  if (usuExistente) {
    if (d.telefono?.trim()) usuExistente.telefono = d.telefono.trim()
    if (d.direccion?.trim()) usuExistente.direccion = d.direccion.trim()
    if (d.ciudad?.trim()) usuExistente.ciudad = d.ciudad.trim()
    const emp = db.empresas.find((e) => e.id === usuExistente.empresaId)
    if (emp && d.direccion?.trim()) emp.direccion = d.direccion.trim()
    return {
      usuarioId: usuExistente.id,
      empresaId: usuExistente.empresaId,
      email: d.email.trim() || usuExistente.email,
      esNuevo: false,
      nombreMostrar: emp?.razonSocial ?? usuExistente.nombre,
    }
  }

  // 3. NO está en la base de datos → Registrarlo automáticamente en la Cartera de Clientes
  const nuevoUid = nextId(db.usuarios)
  if (d.tipoCliente === 'EMPRESA') {
    const nuevoEmpId = nextId(db.empresas)
    const razon = d.razonSocial?.trim() || d.nombreContacto.trim() || 'Nueva Empresa Cliente'
    db.usuarios.push({
      id: nuevoUid,
      nombre: d.nombreContacto.trim() || razon,
      email: cleanEmail || 'contacto@empresa.cl',
      password: 'pcg123',
      rol: 'CLIENTE_EMPRESA',
      activo: true,
      empresaId: nuevoEmpId,
      cargo: 'Contacto Comercial',
      telefono: d.telefono?.trim() || undefined,
    })
    db.empresas.push({
      id: nuevoEmpId,
      razonSocial: razon,
      rut: d.rut.trim() || '76.000.000-0',
      giro: d.giro?.trim() || 'Servicios / Corporativo',
      ciudad: d.ciudad?.trim() || 'Santiago',
      direccion: d.direccion?.trim() || 'Dirección comercial por confirmar',
      contactoId: nuevoUid,
    })
    if (d.inscribirAlertas !== false) {
      db.programas.push({
        empresaId: nuevoEmpId,
        activo: true,
        periodicidadMeses: 6,
        diasAviso: 7,
        emails: d.email.trim() || cleanEmail,
        ccInterno: true,
      })
    }
    return {
      usuarioId: nuevoUid,
      empresaId: nuevoEmpId,
      email: d.email.trim() || cleanEmail,
      esNuevo: true,
      nombreMostrar: razon,
    }
  } else {
    const nombre = d.nombreContacto.trim() || d.razonSocial?.trim() || 'Cliente Particular'
    db.usuarios.push({
      id: nuevoUid,
      nombre,
      email: cleanEmail || 'cliente@correo.cl',
      password: 'pcg123',
      rol: 'CLIENTE_PERSONA',
      activo: true,
      rut: d.rut.trim() || '15.000.000-0',
      telefono: d.telefono?.trim() || undefined,
      direccion: d.direccion?.trim() || undefined,
      ciudad: d.ciudad?.trim() || undefined,
    })
    return {
      usuarioId: nuevoUid,
      empresaId: undefined,
      email: d.email.trim() || cleanEmail,
      esNuevo: true,
      nombreMostrar: nombre,
    }
  }
}

export function crearTicket(
  db: DB,
  u: Usuario,
  d: { tipo: Ticket['tipo']; asunto: string; descripcion: string; equipoIds: number[]; cantEquipos: number },
) {
  const t: Ticket = {
    id: nextId(db.tickets),
    codigo: nextCode(db, 'TCK'),
    usuarioId: u.id,
    empresaId: u.empresaId,
    ...d,
    estado: 'ABIERTO',
    mensajes: [],
    creado: ahora(),
  }
  db.tickets.push(t)
  return t
}

export function emitirCotizacion(
  db: DB,
  d: {
    ticketId?: number
    usuarioId: number
    empresaId?: number
    emailDestino?: string
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
    emitidaPor: number
  },
) {
  const { crearOtInmediata, enviarAlCrear, ...rest } = d
  const year = new Date().getFullYear()
  const key = `COT-${year}`
  db.seq[key] = (db.seq[key] ?? 0) + 1
  const sufijo = db.paquetes.find((p) => p.id === d.paqueteId)?.sufijo ?? 'GEN'
  const cli = db.usuarios.find((u) => u.id === d.usuarioId)
  const c: Cotizacion = {
    id: nextId(db.cotizaciones),
    numero: `COT-${year}-${String(db.seq[key]).padStart(3, '0')}-${sufijo}`,
    ...rest,
    emailDestino: d.emailDestino?.trim() || cli?.email,
    ...calcCot(db, d.items, d.cantEquipos, d.modo, {
      pct: d.descuentoCriterioPct,
      monto: d.descuentoCriterioMonto,
    }),
    estado: 'BORRADOR',
    fecha: today(),
    validaHasta: addDays(today(), db.config.condValidezDias),
  }
  db.cotizaciones.push(c)
  const t = db.tickets.find((x) => x.id === d.ticketId)
  if (t) t.estado = 'EN_COTIZACION'
  if (enviarAlCrear !== false) {
    enviarCotizacion(db, c.id, c.emailDestino)
  }
  if (crearOtInmediata) {
    aceptarCotizacion(db, c.id, d.emitidaPor, {
      inicio: d.planInicio ?? today(),
      fin: d.planFin ?? addDays(today(), 4),
      tecnicoId: d.planTecnicoId,
    })
  }
  return c
}

export function enviarCotizacion(db: DB, cotId: number, emailOverride?: string) {
  const c = db.cotizaciones.find((x) => x.id === cotId)
  if (!c) return
  const cli = db.usuarios.find((u) => u.id === c.usuarioId)
  const emp = db.empresas.find((e) => e.id === c.empresaId)
  if (emailOverride?.trim()) c.emailDestino = emailOverride.trim()
  const destino = c.emailDestino || cli?.email || ''
  if (c.estado === 'BORRADOR') c.estado = 'ENVIADA'
  const t = db.tickets.find((x) => x.id === c.ticketId)
  if (t && t.estado !== 'ACEPTADO') t.estado = 'COTIZADO'
  enviarCorreo(db, {
    tipo: 'COTIZACION',
    de: `${db.config.razonSocial} <${db.config.email}>`,
    para: destino,
    cc: db.config.email,
    asunto: `Cotización Oficial ${c.numero} — ${emp?.razonSocial ?? cli?.nombre ?? 'Cliente'} | ${db.config.razonSocial}`,
    cuerpo: `Estimado(a) ${cli?.nombre ?? 'Cliente'}${emp ? ` (${emp.razonSocial})` : ''},\n\nDesde el correo oficial de ${db.config.razonSocial} (${db.config.email}), adjuntamos la cotización formal ${c.numero} para ${c.cantEquipos} equipo(s) por un total final de $${c.total.toLocaleString('es-CL')} (ahorro aplicado de $${c.descuentoMonto.toLocaleString('es-CL')}, válida hasta ${fmtFecha(c.validaHasta)}).\n\n${c.planInicio ? `📅 Fecha sugerida de ejecución en calendario: ${fmtFecha(c.planInicio)} al ${fmtFecha(c.planFin)}.\n\n` : ''}Puedes revisar el detalle completo, descargar la planilla Excel (.xlsx) o aprobarla en línea desde tu portal PCG.\n\nAtentamente,\n${db.config.razonSocial}\n${db.config.giro}\nContacto: ${db.config.email} · ${db.config.telefono}`,
  })
}

export function crearTareasPlantilla(
  db: DB,
  otId: number,
  tecnicoId: number | undefined,
  inicio: string,
  tipo: OT['tipo'] = 'MANTENIMIENTO',
  equipoId?: number,
) {
  let templateList = TAREAS_MANTENCION
  if (tipo === 'WEB_SOFTWARE') {
    templateList = TAREAS_PROYECTO_WEB
  } else if (tipo === 'DESARROLLO') {
    templateList = TAREAS_SOFTWARE_MEDIDA
  } else if (tipo === 'DISENO_BRANDING') {
    templateList = TAREAS_DISENO_BRANDING
  }

  let prev: number | undefined
  templateList.forEach((t, i) => {
    const id = nextId(db.tareas)
    db.tareas.push({
      id,
      otId,
      titulo: t.titulo,
      asignadoId: tecnicoId,
      estado: 'PENDIENTE',
      prioridad: 'MEDIA',
      hEst: t.horas,
      inicio: addDays(inicio, Math.floor(i / 2)),
      limite: addDays(inicio, Math.floor(i / 2) + 2),
      equipoId,
      dependeDe: prev,
    })
    prev = id
  })
}

export function crearOT(
  db: DB,
  d: {
    titulo: string
    descripcion: string
    tipo: OT['tipo']
    prioridad: OT['prioridad']
    usuarioId: number
    empresaId?: number
    proyectoId?: number
    equipoIds: number[]
    tecnicoId?: number
    inicio: string
    fin: string
    horaCita?: string
    modalidadAtencion?: 'LABORATORIO' | 'DOMICILIO'
    origen: OT['origen']
    ticketId?: number
    cotizacionId?: number
    total?: number
    plantilla: boolean
    creadoPor: number
    tareasPersonalizadas?: {
      titulo: string
      asignadoId?: number
      hEst?: number
      dias?: number
      prioridad?: Prioridad
      estado?: Tarea['estado']
    }[]
  },
) {
  const { plantilla, creadoPor, total, tareasPersonalizadas, ...rest } = d
  const notaHora = d.horaCita
    ? ` · Hora agendada: ${d.horaCita} hrs (${d.modalidadAtencion === 'DOMICILIO' ? 'Domicilio / Terreno' : 'Laboratorio PCG SPA'})`
    : ''
  const notaProyecto = d.proyectoId
    ? ` · Vinculada a Proyecto #${d.proyectoId}`
    : ''
  const ot: OT = {
    id: nextId(db.ots),
    codigo: nextCode(db, 'PCG'),
    ...rest,
    estado: 'RECIBIDO',
    total: total ?? 0,
    estadoPago: 'PENDIENTE',
    historial: [{ estado: 'RECIBIDO', fecha: ahora(), nota: `OT creada${notaHora}${notaProyecto}` }],
    comentarios: [],
    creado: ahora(),
  }
  void creadoPor
  db.ots.push(ot)

  if (tareasPersonalizadas && tareasPersonalizadas.length > 0) {
    let prevId: number | undefined
    tareasPersonalizadas.forEach((t, i) => {
      const tid = nextId(db.tareas)
      db.tareas.push({
        id: tid,
        otId: ot.id,
        titulo: t.titulo,
        asignadoId: t.asignadoId ?? d.tecnicoId,
        estado: t.estado ?? 'PENDIENTE',
        prioridad: t.prioridad ?? d.prioridad ?? 'MEDIA',
        hEst: t.hEst ?? 2,
        inicio: addDays(d.inicio, Math.floor(i / 2)),
        limite: addDays(d.inicio, Math.floor(i / 2) + (t.dias ?? 2)),
        equipoId: d.equipoIds[0],
        dependeDe: prevId,
      })
      prevId = tid
    })
  } else if (plantilla) {
    crearTareasPlantilla(db, ot.id, d.tecnicoId, d.inicio, d.tipo, d.equipoIds[0])
  }

  return ot
}

export function agendarHoraMantencion(
  db: DB,
  d: {
    usuarioId: number
    empresaId?: number
    fechaCita: string
    horaCita: string
    modalidadAtencion: 'LABORATORIO' | 'DOMICILIO'
    direccionRetiro?: string
    servicioId?: number
    tituloServicio: string
    montoEstimado: number
    equipoExistenteId?: number
    nuevoEquipo?: {
      tipo: DB['equipos'][number]['tipo']
      marca: string
      modelo: string
      serie?: string
    }
    sintomasOComentarios?: string
    tecnicoId?: number
    creadoPor: number
  },
) {
  const cli = db.usuarios.find((u) => u.id === d.usuarioId)
  const emp = db.empresas.find((e) => e.id === d.empresaId)

  let equipoId = d.equipoExistenteId
  if (!equipoId && d.nuevoEquipo && d.nuevoEquipo.marca.trim()) {
    const nuevoId = nextId(db.equipos)
    const pref = emp
      ? emp.razonSocial
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 3)
      : 'PRT'
    const eq = {
      id: nuevoId,
      empresaId: d.empresaId,
      usuarioId: d.usuarioId,
      codigo: `${pref}-${String(nuevoId).padStart(3, '0')}`,
      area: emp ? 'General' : 'Personal / Particular',
      tipo: d.nuevoEquipo.tipo,
      marca: d.nuevoEquipo.marca.trim(),
      modelo: d.nuevoEquipo.modelo.trim() || 'Estándar',
      serie: d.nuevoEquipo.serie?.trim() || `SN-${nuevoId}00`,
      cpu: 'Por diagnosticar en taller',
      ramGb: 8,
      disipacion: 'STOCK' as const,
      gpu: 'Integrada / Estándar',
      ubicacion: 'EN_PODER_CLIENTE' as const,
    }
    db.equipos.push(eq)
    equipoId = eq.id
  }

  // Asignar técnico con menor carga o el indicado
  const workers = db.usuarios.filter((u) => u.rol === 'WORKER' && u.activo)
  const tecId = d.tecnicoId ?? workers[0]?.id ?? 3
  const tec = db.usuarios.find((u) => u.id === tecId)

  const modLabel = d.modalidadAtencion === 'DOMICILIO'
    ? `Retiro / Atención a Domicilio${d.direccionRetiro ? ` (Dirección: ${d.direccionRetiro})` : ''}`
    : 'Ingreso en Laboratorio PCG SPA'
  const eqObj = db.equipos.find((e) => e.id === equipoId)
  const eqDesc = eqObj ? `${eqObj.codigo} (${eqObj.marca} ${eqObj.modelo})` : '1 equipo'

  if (d.direccionRetiro) {
    if (cli) cli.direccion = d.direccionRetiro
    if (emp) emp.direccion = d.direccionRetiro
  }

  const ticket: Ticket = {
    id: nextId(db.tickets),
    codigo: nextCode(db, 'TCK'),
    usuarioId: d.usuarioId,
    empresaId: d.empresaId,
    tipo: 'MANTENCION',
    asunto: `Hora agendada (${d.horaCita} hrs): ${d.tituloServicio} — ${eqDesc}`,
    descripcion: `Reserva de hora de mantención para el ${fmtFecha(d.fechaCita)} a las ${d.horaCita} hrs (${modLabel}).${d.direccionRetiro ? `\n📍 Dirección de Retiro: ${d.direccionRetiro}` : ''}${d.sintomasOComentarios ? `\nIndicaciones del cliente: ${d.sintomasOComentarios}` : ''}`,
    equipoIds: equipoId ? [equipoId] : [],
    cantEquipos: 1,
    fechaCita: d.fechaCita,
    horaCita: d.horaCita,
    modalidadAtencion: d.modalidadAtencion,
    direccionRetiro: d.direccionRetiro,
    estado: 'ACEPTADO',
    mensajes: [
      {
        usuarioId: d.creadoPor,
        texto: `✅ Hora confirmada para el ${fmtFecha(d.fechaCita)} a las ${d.horaCita} hrs (${modLabel}). Técnico asignado: ${tec?.nombre ?? 'Por asignar'}.${d.direccionRetiro ? ` Retiro en: ${d.direccionRetiro}.` : ''}`,
        interno: false,
        fecha: ahora(),
      },
    ],
    creado: ahora(),
  }
  db.tickets.push(ticket)

  const ot = crearOT(db, {
    titulo: `${d.tituloServicio} (${d.horaCita} hrs) — ${eqObj ? `${eqObj.marca} ${eqObj.modelo}` : cli?.nombre ?? 'Cliente'}`,
    descripcion: `Hora agendada por ${emp?.razonSocial ?? cli?.nombre ?? 'Cliente Natural'} para el ${fmtFecha(d.fechaCita)} a las ${d.horaCita} hrs · Modalidad: ${modLabel}.${d.direccionRetiro ? `\n📍 Dirección de Retiro: ${d.direccionRetiro}` : ''}${d.sintomasOComentarios ? `\nNotas: ${d.sintomasOComentarios}` : ''}`,
    tipo: 'MANTENIMIENTO',
    prioridad: 'MEDIA',
    usuarioId: d.usuarioId,
    empresaId: d.empresaId,
    equipoIds: equipoId ? [equipoId] : [],
    tecnicoId: tecId,
    inicio: d.fechaCita,
    fin: addDays(d.fechaCita, 1),
    horaCita: d.horaCita,
    modalidadAtencion: d.modalidadAtencion,
    origen: 'TICKET',
    ticketId: ticket.id,
    total: d.montoEstimado,
    plantilla: true,
    creadoPor: d.creadoPor,
  })
  ot.direccionRetiro = d.direccionRetiro
  ticket.otId = ot.id

  if (cli?.email) {
    enviarCorreo(db, {
      tipo: 'ESTADO_OT',
      de: `${db.config.razonSocial} <${db.config.email}>`,
      para: cli.email,
      cc: db.config.email,
      asunto: `Confirmación de Hora Agendada (${fmtFecha(d.fechaCita)} · ${d.horaCita} hrs) — ${ot.codigo} | ${db.config.razonSocial}`,
      cuerpo: `Hola ${cli.nombre},\n\nTu hora de mantención en ${db.config.razonSocial} ha quedado confirmada:\n\n• Orden de Trabajo: ${ot.codigo}\n• Servicio: ${d.tituloServicio}\n• Fecha reservada: ${fmtFecha(d.fechaCita)}\n• Bloque horario: ${d.horaCita} hrs\n• Modalidad: ${modLabel}${d.direccionRetiro ? `\n• Dirección de Retiro / Domicilio: ${d.direccionRetiro}` : ''}\n• Equipo: ${eqDesc}\n• Técnico responsable: ${tec?.nombre ?? 'Equipo Técnico PCG SPA'}\n• Valor estimado: $${d.montoEstimado.toLocaleString('es-CL')}\n\nContacto Laboratorio PCG SPA: ${db.config.email} · WhatsApp: ${db.config.telefono}.\n\n¡Te esperamos!\n${db.config.razonSocial}`,
    })
  }

  return { ot, ticket }
}

export function aceptarCotizacion(
  db: DB,
  cotId: number,
  porUsuarioId: number,
  plan?: { inicio?: string; fin?: string; tecnicoId?: number; prioridad?: OT['prioridad'] },
) {
  const c = db.cotizaciones.find((x) => x.id === cotId)
  if (!c) return
  c.estado = 'ACEPTADA'
  const t = db.tickets.find((x) => x.id === c.ticketId)
  if (t) t.estado = 'ACEPTADO'
  const inicio = plan?.inicio ?? c.planInicio ?? addDays(today(), 1)
  const fin = plan?.fin ?? c.planFin ?? addDays(inicio, 4)
  const tecnicoId = plan?.tecnicoId !== undefined ? plan.tecnicoId : c.planTecnicoId

  if (c.otId) {
    const existing = db.ots.find((o) => o.id === c.otId)
    if (existing) {
      existing.inicio = inicio
      existing.fin = fin
      existing.tecnicoId = tecnicoId
      if (plan?.prioridad) existing.prioridad = plan.prioridad
      for (const tarea of db.tareas.filter((x) => x.otId === existing.id)) {
        tarea.asignadoId = tecnicoId
      }
      return existing
    }
  }

  const eqEmpresa = c.empresaId ? db.equipos.filter((e) => e.empresaId === c.empresaId).map((e) => e.id) : []
  const ot = crearOT(db, {
    titulo: t ? t.asunto : `Servicio según ${c.numero}`,
    descripcion: `Generada desde la cotización ${c.numero}${c.motivoDescuento ? ` · Descuento aplicado: ${c.motivoDescuento}` : ''}`,
    tipo: 'MANTENIMIENTO',
    prioridad: plan?.prioridad ?? 'MEDIA',
    usuarioId: c.usuarioId,
    empresaId: c.empresaId,
    equipoIds: t?.equipoIds.length ? t.equipoIds : eqEmpresa.slice(0, c.cantEquipos),
    tecnicoId,
    inicio,
    fin,
    origen: 'TICKET',
    ticketId: c.ticketId,
    cotizacionId: c.id,
    total: c.total,
    plantilla: true,
    creadoPor: porUsuarioId,
  })
  c.otId = ot.id
  c.planInicio = inicio
  c.planFin = fin
  c.planTecnicoId = tecnicoId
  enviarCorreo(db, {
    tipo: 'ESTADO_OT',
    para: db.config.email,
    asunto: `Cotización ${c.numero} aceptada → OT ${ot.codigo}`,
    cuerpo: `Se programó la OT ${ot.codigo} del ${fmtFecha(inicio)} al ${fmtFecha(fin)}.`,
  })
  return ot
}

export function cambiarEstadoOT(db: DB, otId: number, estado: EstadoOT, nota = '') {
  const ot = db.ots.find((x) => x.id === otId)
  if (!ot || ot.estado === estado) return
  ot.estado = estado
  const defaultNota =
    estado === 'ENTREGADO'
      ? 'OT marcada como Terminada / Entregada'
      : estado === 'CANCELADA'
        ? 'OT marcada como Cancelada por administración'
        : 'Cambio de estado'
  ot.historial.push({ estado, fecha: ahora(), nota: nota || defaultNota })
  if (estado === 'ENTREGADO') {
    for (const t of db.tareas.filter((x) => x.otId === ot.id)) {
      if (t.estado !== 'HECHA') {
        t.estado = 'HECHA'
        t.hReal = t.hReal ?? t.hEst
      }
    }
  }
}

export function registrarIntervencion(db: DB, d: Omit<Intervencion, 'id' | 'fecha'>) {
  const i: Intervencion = { ...d, id: nextId(db.intervenciones), fecha: today() }
  db.intervenciones.push(i)
  const e = db.equipos.find((x) => x.id === d.equipoId)
  if (e && d.tipo === 'PREVENTIVO') {
    e.ultimaMantencion = i.fecha
    const prog = db.programas.find((p) => p.empresaId === e.empresaId && p.activo)
    e.proximaMantencion = addMonths(i.fecha, prog?.periodicidadMeses ?? 6)
  }
  return i
}

export function crearInforme(
  db: DB,
  d: Omit<Informe, 'id' | 'codigo' | 'fecha'>,
) {
  const inf: Informe = { ...d, id: nextId(db.informes), codigo: nextCode(db, 'INF'), fecha: today() }
  db.informes.push(inf)
  return inf
}

/** Simula el cron diario de cPanel: un correo por empresa con los equipos por vencer. */
export function procesarCron(db: DB) {
  const pend = calcAlertas(db).filter((a) => a.estado === 'PENDIENTE' && a.debeAvisar)
  const porEmpresa = new Map<number, typeof pend>()
  for (const a of pend) porEmpresa.set(a.empresaId, [...(porEmpresa.get(a.empresaId) ?? []), a])
  for (const [empresaId, lista] of porEmpresa) {
    const emp = db.empresas.find((e) => e.id === empresaId)
    const prog = db.programas.find((p) => p.empresaId === empresaId)
    const lineas = lista.map((a) => {
      const e = db.equipos.find((x) => x.id === a.equipoId)!
      return `• ${e.codigo} — ${e.marca} ${e.modelo} (${e.area}) · mantención sugerida: ${fmtFecha(a.programada)}`
    })
    enviarCorreo(db, {
      tipo: 'ALERTA_PREVENTIVA',
      para: prog?.emails || db.usuarios.find((u) => u.id === emp?.contactoId)?.email || '',
      cc: prog?.ccInterno ? db.config.email : undefined,
      asunto: `Aviso preventivo: ${lista.length} equipo(s) de ${emp?.razonSocial} requieren mantención`,
      cuerpo: `Estimados ${emp?.razonSocial}:\n\nLos siguientes equipos se acercan a su fecha de mantención preventiva:\n\n${lineas.join('\n')}\n\nPuedes agendar la mantención desde tu portal PCG con el botón "Agendar mantención".\n\n${db.config.razonSocial}`,
    })
    for (const a of lista) db.alertasEnviadas[a.key] = 'ENVIADA'
  }
  return pend.length
}

export function agendarMantencion(db: DB, u: Usuario, equipoIds: number[]) {
  const t = crearTicket(db, u, {
    tipo: 'MANTENCION',
    asunto: `Agendar mantención preventiva (${equipoIds.length} equipo${equipoIds.length > 1 ? 's' : ''})`,
    descripcion: 'Ticket creado desde un aviso preventivo.',
    equipoIds,
    cantEquipos: equipoIds.length,
  })
  for (const a of calcAlertas(db)) if (equipoIds.includes(a.equipoId)) db.alertasEnviadas[a.key] = 'AGENDADA'
  return t
}

export function tareaToggle(t: Tarea, estado: Tarea['estado']) {
  t.estado = estado
}

