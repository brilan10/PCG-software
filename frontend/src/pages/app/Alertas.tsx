import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useScope } from '@/lib/scope'
import { agendarMantencion, enviarCorreo, procesarCron } from '@/lib/actions'
import { TIPO_HW_META } from '@/lib/types'
import { addMonths, calcAlertas, fmtFecha } from '@/lib/util'
import { Badge, Btn, Card, Empty, Field, Kpi, Modal, PageHeader, Table, inputCls, td } from '@/components/kit'

export default function AlertasPage() {
  const { user } = useStore()
  return user!.rol === 'CLIENTE_EMPRESA' ? <ClientAlertas /> : <StaffAlertas />
}

function StaffAlertas() {
  const { db, mutate } = useStore()
  const [toast, setToast] = useState<{ title: string; sub: string; tone: 'emerald' | 'amber' } | null>(null)
  const [previewEmpresaId, setPreviewEmpresaId] = useState<number | null>(null)
  const [manualModal, setManualModal] = useState<{ empresaId: number; equipoIds: number[] } | null>(null)

  // Filtros del semáforo de alertas
  const [fEmpresa, setFEmpresa] = useState<string>('')
  const [fEstado, setFEstado] = useState<'TODAS' | 'LISTAS' | 'VENCIDAS' | 'PROGRAMADAS' | 'ENVIADAS'>('TODAS')

  const alertas = calcAlertas(db)
  const listasParaEnviar = alertas.filter((a) => a.estado === 'PENDIENTE' && a.debeAvisar)
  const vencidas = alertas.filter((a) => a.vencida)
  const enviadasCount = alertas.filter((a) => a.estado === 'ENVIADA' || a.estado === 'AGENDADA').length
  const empresasActivas = db.programas.filter((p) => p.activo).length

  const alertasFiltradas = useMemo(() => {
    return alertas
      .filter((a) => (!fEmpresa ? true : a.empresaId === Number(fEmpresa)))
      .filter((a) => {
        if (fEstado === 'LISTAS') return a.estado === 'PENDIENTE' && a.debeAvisar
        if (fEstado === 'VENCIDAS') return a.vencida
        if (fEstado === 'PROGRAMADAS') return a.estado === 'PENDIENTE' && !a.debeAvisar
        if (fEstado === 'ENVIADAS') return a.estado === 'ENVIADA' || a.estado === 'AGENDADA'
        return true
      })
  }, [alertas, fEmpresa, fEstado])

  const sinFecha = db.equipos.filter(
    (e) => e.empresaId && db.programas.some((p) => p.empresaId === e.empresaId && p.activo) && !e.proximaMantencion,
  )

  const toggleEmpresa = (empresaId: number, on: boolean) => {
    const emp = db.empresas.find((e) => e.id === empresaId)!
    mutate((d) => {
      const contacto = d.usuarios.find((u) => u.id === emp.contactoId)
      let prog = d.programas.find((p) => p.empresaId === empresaId)
      if (!prog) {
        prog = {
          empresaId,
          activo: on,
          periodicidadMeses: 6,
          diasAviso: 7,
          emails: contacto?.email ?? '',
          ccInterno: true,
        }
        d.programas.push(prog)
      } else {
        prog.activo = on
      }
      if (on) {
        for (const eq of d.equipos.filter((x) => x.empresaId === empresaId && !x.proximaMantencion && x.ultimaMantencion)) {
          eq.proximaMantencion = addMonths(eq.ultimaMantencion!, prog.periodicidadMeses)
        }
      }
    })
    setToast({
      title: on
        ? `✓ Programa preventivo activado para ${emp.razonSocial}`
        : `Programa preventivo pausado para ${emp.razonSocial}`,
      sub: on
        ? `Se notificará automáticamente desde ${db.config.email} una semana antes de cada vencimiento.`
        : 'No se despacharán avisos automáticos mientras permanezca inactivo.',
      tone: on ? 'emerald' : 'amber',
    })
  }

  // Envío directo en 1 clic de una fila ("Lista para enviar" o individual)
  const enviarAlertaIndividualRapida = (a: (typeof alertas)[number]) => {
    const emp = db.empresas.find((e) => e.id === a.empresaId)
    const eq = db.equipos.find((e) => e.id === a.equipoId)
    const prog = db.programas.find((p) => p.empresaId === a.empresaId)
    if (!emp || !eq) return
    const destino = prog?.emails || db.usuarios.find((u) => u.id === emp.contactoId)?.email || ''
    const meta = TIPO_HW_META[eq.tipo]

    mutate((d) => {
      enviarCorreo(d, {
        tipo: 'ALERTA_PREVENTIVA',
        de: `${d.config.razonSocial} <${d.config.email}>`,
        para: destino,
        cc: prog?.ccInterno ? d.config.email : undefined,
        asunto: `🔔 Aviso Preventivo de Mantención: ${eq.codigo} (${eq.marca} ${eq.modelo}) — ${emp.razonSocial} | ${d.config.razonSocial}`,
        cuerpo: `Estimados ${emp.razonSocial},\n\nDesde el programa de continuidad operativa de ${d.config.razonSocial} (${d.config.email}), les informamos que el siguiente activo TI requiere su mantención preventiva programada:\n\n• [${meta.short}] ${eq.codigo} — ${eq.marca} ${eq.modelo} (Área: ${eq.area})\n• Fecha sugerida de mantención: ${fmtFecha(a.programada)}\n\nPueden agendar la intervención directamente en su Portal Corporativo PCG o respondiendo este correo.\n\nAtentamente,\n${d.config.razonSocial}\n${d.config.email} · ${d.config.telefono}`,
      })
      d.alertasEnviadas[a.key] = 'ENVIADA'
    })

    setToast({
      title: `✉ Alerta enviada para ${eq.codigo} (${emp.razonSocial})`,
      sub: `Despachada desde ${db.config.email} hacia ${destino}.`,
      tone: 'emerald',
    })
  }

  const enviarAlertaEmpresa = (empresaId: number) => {
    const emp = db.empresas.find((e) => e.id === empresaId)
    const prog = db.programas.find((p) => p.empresaId === empresaId)
    const lista = alertas.filter((a) => a.empresaId === empresaId)
    if (!emp || lista.length === 0) return
    const destino = prog?.emails || db.usuarios.find((u) => u.id === emp.contactoId)?.email || ''

    mutate((d) => {
      const lineas = lista.map((a) => {
        const e = d.equipos.find((x) => x.id === a.equipoId)!
        const m = TIPO_HW_META[e.tipo]
        return `• [${m.short}] ${e.codigo} — ${e.marca} ${e.modelo} (${e.area}) · Mantención sugerida: ${fmtFecha(a.programada)}`
      })
      enviarCorreo(d, {
        tipo: 'ALERTA_PREVENTIVA',
        de: `${d.config.razonSocial} <${d.config.email}>`,
        para: destino,
        cc: prog?.ccInterno ? d.config.email : undefined,
        asunto: `🔔 Aviso Preventivo (-${prog?.diasAviso ?? 7} días): ${lista.length} equipo(s) de ${emp.razonSocial} | ${d.config.razonSocial}`,
        cuerpo: `Estimados ${emp.razonSocial},\n\nDesde el programa de continuidad operativa de ${d.config.razonSocial} (${d.config.email}), les informamos que los siguientes activos TI se encuentran próximos a su mantención preventiva programada:\n\n${lineas.join('\n')}\n\nPueden agendar su jornada de mantención en 1 clic ingresando a su Portal Corporativo PCG.\n\nAtentamente,\n${d.config.razonSocial}\n${d.config.email} · ${d.config.telefono}`,
      })
      for (const a of lista) {
        if (a.debeAvisar) d.alertasEnviadas[a.key] = 'ENVIADA'
      }
    })

    setToast({
      title: `✉ Alerta preventiva enviada a ${emp.razonSocial}`,
      sub: `Despachada desde ${db.config.email} hacia ${destino} (${lista.length} equipos incluidos).`,
      tone: 'emerald',
    })
  }

  return (
    <>
      {/* Hero Banner colorido de Alertas Preventivas */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-rose-950 to-indigo-950 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-rose-500/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-white/15">
              <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
              Motor Automático y Manual de Alertas Preventivas · 7 días antes
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Alertas Preventivas y Avisos por Correo
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Envía alertas automáticas (-7d) o manuales desde{' '}
              <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-300">
                {db.config.email}
              </span>{' '}
              a cualquiera de las empresas registradas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="secondary"
              onClick={() =>
                setManualModal({
                  empresaId: db.empresas[0]?.id ?? 1,
                  equipoIds: db.equipos.filter((e) => e.empresaId === (db.empresas[0]?.id ?? 1)).slice(0, 3).map((e) => e.id),
                })
              }
            >
              ✉ + Enviar Alerta Manual
            </Btn>
            <Btn
              onClick={() => {
                let enviados = 0
                mutate((d) => {
                  enviados = procesarCron(d)
                })
                setToast({
                  title:
                    enviados > 0
                      ? `✓ ¡Se enviaron las ${enviados} alerta(s) que estaban "Listas para enviar"!`
                      : '✓ Todas las alertas en ventana (-7d) ya fueron enviadas',
                  sub:
                    enviados > 0
                      ? `Los correos preventivos salieron desde ${db.config.email} hacia las empresas inscritas.`
                      : 'Puedes usar el botón "✉ Envío manual" en cualquier fila de la tabla para enviar un aviso personalizado.',
                  tone: enviados > 0 ? 'emerald' : 'amber',
                })
              }}
            >
              ⚡ Enviar todas las "Listas para enviar" ({listasParaEnviar.length})
            </Btn>
          </div>
        </div>
      </motion.div>

      {/* Notificación flotante / Alerta bonita animada */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 text-white shadow-lg ${
              toast.tone === 'emerald'
                ? 'border-emerald-300 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600'
                : 'border-amber-300 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl shadow-inner">
                🔔
              </span>
              <div>
                <div className="text-sm font-extrabold">{toast.title}</div>
                <div className="text-xs text-white/90">{toast.sub}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/app/correos"
                className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/30"
              >
                Ver correo en Bandeja de Salida →
              </Link>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg bg-black/15 px-2.5 py-1 text-xs font-bold text-white/90 hover:bg-black/25"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs de Alertas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="🏢 Empresas Inscritas"
          value={`${empresasActivas} / ${db.empresas.length}`}
          hint="Con monitoreo preventivo activo"
          tone="green"
        />
        <Kpi
          label="🔔 Listas para enviar (-7d)"
          value={listasParaEnviar.length}
          hint="En ventana de aviso o vencidas"
          tone="amber"
        />
        <Kpi
          label="🚨 Mantenciones Vencidas"
          value={vencidas.length}
          hint={vencidas.length > 0 ? 'Requieren contacto prioritario' : 'Ninguna vencida'}
          tone={vencidas.length > 0 ? 'red' : 'blue'}
        />
        <Kpi
          label="✉ Alertas Enviadas"
          value={enviadasCount}
          hint={`Salen desde ${db.config.email}`}
          tone="violet"
        />
      </div>

      {/* Tabla visual de alertas por equipo (puesta primero para acción rápida) */}
      <Card
        className="mb-6"
        title="1. Semáforo de equipos monitoreados — Envío en 1 clic o alerta manual"
        accent="amber"
        action={
          <button
            type="button"
            onClick={() =>
              setManualModal({
                empresaId: db.empresas[0]?.id ?? 1,
                equipoIds: [],
              })
            }
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            + Redactar alerta manual personalizada →
          </button>
        }
      >
        {/* Barra de filtros por estado y por empresa */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['TODAS', `Todas (${alertas.length})`],
                ['LISTAS', `🔔 Listas para enviar (${listasParaEnviar.length})`],
                ['VENCIDAS', `🚨 Vencidas (${vencidas.length})`],
                ['PROGRAMADAS', '⏳ Programadas (>7 días)'],
                ['ENVIADAS', `✉ Enviadas (${enviadasCount})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFEstado(k)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  fEstado === k
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            className={`${inputCls} !w-64`}
            value={fEmpresa}
            onChange={(e) => setFEmpresa(e.target.value)}
          >
            <option value="">Todas las empresas ({db.empresas.length})</option>
            {db.empresas.map((em) => (
              <option key={em.id} value={em.id}>
                {em.razonSocial}
              </option>
            ))}
          </select>
        </div>

        <Table
          head={[
            'Empresa',
            'Equipo / Categoría',
            'Área',
            'Fecha aviso (-7d)',
            'Mantención sugerida',
            'Plazo',
            'Estado alerta',
            'Acción / Enviar alerta',
          ]}
        >
          {alertasFiltradas.map((a) => {
            const emp = db.empresas.find((e) => e.id === a.empresaId)
            const eq = db.equipos.find((e) => e.id === a.equipoId)!
            const meta = TIPO_HW_META[eq.tipo]
            const listaParaEnviar = a.estado === 'PENDIENTE' && a.debeAvisar
            return (
              <tr
                key={a.key}
                className={
                  a.vencida
                    ? 'bg-rose-50/45'
                    : listaParaEnviar
                      ? 'bg-amber-50/45'
                      : undefined
                }
              >
                <td className={td}>
                  <div className="font-bold text-slate-900">{emp?.razonSocial}</div>
                  <div className="text-[11px] text-slate-400">{emp?.ciudad}</div>
                </td>
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.icon}</span>
                    <div>
                      <Link to={`/app/equipos/${eq.id}`} className="font-bold text-emerald-700 hover:underline">
                        {eq.codigo}
                      </Link>{' '}
                      <span className="font-medium text-slate-800">
                        · {eq.marca} {eq.modelo}
                      </span>
                      <div className="text-[11px] text-slate-400">{meta.label}</div>
                    </div>
                  </div>
                </td>
                <td className={td}>{eq.area}</td>
                <td className={td}>
                  <span className="font-mono text-xs text-slate-600">{fmtFecha(a.aviso)}</span>
                </td>
                <td className={td}>
                  <span className="font-semibold text-slate-800">{fmtFecha(a.programada)}</span>
                </td>
                <td className={td}>
                  <Badge tone={a.vencida ? 'red' : a.diasRestantes <= 7 ? 'amber' : 'green'}>
                    {a.vencida
                      ? `🚨 Vencida (${Math.abs(a.diasRestantes)}d)`
                      : `En ${a.diasRestantes} días`}
                  </Badge>
                </td>
                <td className={td}>
                  <Badge
                    tone={
                      a.estado === 'AGENDADA'
                        ? 'green'
                        : a.estado === 'ENVIADA'
                          ? 'blue'
                          : listaParaEnviar
                            ? 'amber'
                            : 'slate'
                    }
                  >
                    {listaParaEnviar
                      ? '🔔 Lista para enviar'
                      : a.estado === 'ENVIADA'
                        ? '✓ Correo enviado'
                        : a.estado === 'AGENDADA'
                          ? '📅 Agendada'
                          : 'PENDIENTE'}
                  </Badge>
                </td>
                <td className={`${td} text-right`}>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {listaParaEnviar ? (
                      <>
                        <Btn size="sm" onClick={() => enviarAlertaIndividualRapida(a)}>
                          ✉ Enviar ahora
                        </Btn>
                        <Btn
                          size="sm"
                          variant="secondary"
                          onClick={() => setManualModal({ empresaId: a.empresaId, equipoIds: [a.equipoId] })}
                        >
                          Editar correo
                        </Btn>
                      </>
                    ) : (
                      <Btn
                        size="sm"
                        variant="secondary"
                        onClick={() => setManualModal({ empresaId: a.empresaId, equipoIds: [a.equipoId] })}
                      >
                        {a.estado === 'ENVIADA' ? '↺ Reenviar manual' : '✉ Envío manual'}
                      </Btn>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {/* Tarjetas de configuración por empresa */}
      <Card
        title="2. Empresas B2B inscritas y configuración del programa preventivo"
        accent="emerald"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {db.empresas.map((em) => {
            const prog = db.programas.find((p) => p.empresaId === em.id)
            const activo = prog?.activo ?? false
            const eqs = db.equipos.filter((e) => e.empresaId === em.id)
            const alertasEmp = alertas.filter((a) => a.empresaId === em.id)
            const porAvisarEmp = alertasEmp.filter((a) => a.debeAvisar && a.estado === 'PENDIENTE').length

            return (
              <motion.div
                key={em.id}
                layout
                className={`rounded-2xl border p-5 transition-all ${
                  activo
                    ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-sky-50/40 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">{em.razonSocial}</span>
                      <Badge tone={activo ? 'green' : 'slate'}>
                        {activo ? `● Alerta activa (-${prog?.diasAviso ?? 7}d)` : '○ Inactiva'}
                      </Badge>
                      {porAvisarEmp > 0 && (
                        <Badge tone="amber">🔔 {porAvisarEmp} lista(s) para enviar</Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      RUT {em.rut} · {em.ciudad} · <b>{eqs.length} activos TI</b> registrados
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleEmpresa(em.id, !activo)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition shadow-2xs ${
                      activo
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${activo ? 'bg-white' : 'bg-slate-400'}`} />
                    {activo ? 'Alertas Activas' : 'Activar Alertas'}
                  </button>
                </div>

                {activo && prog && (
                  <>
                    <div className="mt-4 grid gap-3 border-t border-emerald-200/60 pt-3.5 text-xs sm:grid-cols-3">
                      <label className="block">
                        <span className="font-semibold text-slate-600">Ciclo preventivo (meses)</span>
                        <input
                          type="number"
                          min={1}
                          className={`${inputCls} mt-1 !py-1.5 !text-xs`}
                          value={prog.periodicidadMeses}
                          onChange={(e) =>
                            mutate((d) => {
                              d.programas.find((p) => p.empresaId === em.id)!.periodicidadMeses = Number(
                                e.target.value,
                              )
                            })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="font-semibold text-slate-600">Avisar con anticipación (días)</span>
                        <input
                          type="number"
                          min={1}
                          className={`${inputCls} mt-1 !py-1.5 !text-xs`}
                          value={prog.diasAviso}
                          onChange={(e) =>
                            mutate((d) => {
                              d.programas.find((p) => p.empresaId === em.id)!.diasAviso = Number(
                                e.target.value,
                              )
                            })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="font-semibold text-slate-600">Correo(s) destino de la empresa</span>
                        <input
                          className={`${inputCls} mt-1 !py-1.5 !text-xs`}
                          value={prog.emails}
                          placeholder="contacto@empresa.cl"
                          onChange={(e) =>
                            mutate((d) => {
                              d.programas.find((p) => p.empresaId === em.id)!.emails = e.target.value
                            })
                          }
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs ring-1 ring-slate-200/70">
                      <span className="text-slate-500">
                        Sale desde: <strong className="font-mono text-slate-800">{db.config.email}</strong>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewEmpresaId(em.id)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-100"
                        >
                          👁 Vista previa
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setManualModal({
                              empresaId: em.id,
                              equipoIds: eqs.map((x) => x.id),
                            })
                          }
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          ✎ Alerta manual
                        </button>
                        <button
                          type="button"
                          onClick={() => enviarAlertaEmpresa(em.id)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700"
                        >
                          ✉ Enviar consolidado ahora
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </Card>

      {sinFecha.length > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50/60" title="⚠ Equipos de empresas inscritas sin fecha de próxima mantención">
          <ul className="space-y-1 text-xs text-amber-900">
            {sinFecha.map((e) => (
              <li key={e.id}>
                • <Link to={`/app/equipos/${e.id}`} className="font-semibold underline">{e.codigo}</Link> ({e.marca} {e.modelo}) — entra a su ficha para asignarle fecha base.
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Modal de vista previa bonita del correo de alerta */}
      {previewEmpresaId !== null && (
        <PreviewCorreoAlertaModal
          empresaId={previewEmpresaId}
          onClose={() => setPreviewEmpresaId(null)}
          onSend={() => {
            const id = previewEmpresaId
            setPreviewEmpresaId(null)
            enviarAlertaEmpresa(id)
          }}
        />
      )}

      {/* Modal para enviar una alerta de forma manual (cualquier empresa / equipo / correo) */}
      {manualModal !== null && (
        <ModalEnvioManualAlerta
          initialEmpresaId={manualModal.empresaId}
          initialEquipoIds={manualModal.equipoIds}
          onClose={() => setManualModal(null)}
          onSent={(empNombre, emailDestino, cantEq) => {
            setManualModal(null)
            setToast({
              title: `✉ Alerta manual enviada a ${empNombre} (${cantEq} equipo${cantEq > 1 ? 's' : ''})`,
              sub: `Salió desde ${db.config.email} hacia ${emailDestino}.`,
              tone: 'emerald',
            })
          }}
        />
      )}
    </>
  )
}

function ModalEnvioManualAlerta({
  initialEmpresaId,
  initialEquipoIds,
  onClose,
  onSent,
}: {
  initialEmpresaId: number
  initialEquipoIds: number[]
  onClose: () => void
  onSent: (empresaNombre: string, emailDestino: string, cantEquipos: number) => void
}) {
  const { db, mutate } = useStore()
  const [empresaId, setEmpresaId] = useState<number>(initialEmpresaId)
  const emp = db.empresas.find((e) => e.id === empresaId)!
  const prog = db.programas.find((p) => p.empresaId === empresaId)
  const contacto = db.usuarios.find((u) => u.id === emp?.contactoId)
  const equiposEmpresa = db.equipos.filter((e) => e.empresaId === empresaId)

  const [equipoIds, setEquipoIds] = useState<number[]>(
    initialEquipoIds.length > 0 ? initialEquipoIds : equiposEmpresa.map((e) => e.id),
  )
  const [para, setPara] = useState<string>(prog?.emails || contacto?.email || '')
  const [asunto, setAsunto] = useState<string>(
    `🔔 Aviso de Mantención Preventiva — ${emp?.razonSocial ?? ''} | ${db.config.razonSocial}`,
  )
  const [notaExtra, setNotaExtra] = useState<string>(
    'Les recordamos que contamos con disponibilidad prioritaria esta semana para realizar la mantención en sus dependencias o en nuestro laboratorio técnico.',
  )

  const handleChangeEmpresa = (nextEmpId: number) => {
    setEmpresaId(nextEmpId)
    const nextEmp = db.empresas.find((e) => e.id === nextEmpId)
    const nextProg = db.programas.find((p) => p.empresaId === nextEmpId)
    const nextCont = db.usuarios.find((u) => u.id === nextEmp?.contactoId)
    const nextEqs = db.equipos.filter((e) => e.empresaId === nextEmpId)
    setEquipoIds(nextEqs.map((e) => e.id))
    setPara(nextProg?.emails || nextCont?.email || '')
    setAsunto(`🔔 Aviso de Mantención Preventiva — ${nextEmp?.razonSocial ?? ''} | ${db.config.razonSocial}`)
  }

  const toggleEq = (id: number) => {
    setEquipoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <Modal open onClose={onClose} title="✉ Enviar Alerta Preventiva de Forma Manual" wide>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!para.trim() || equipoIds.length === 0) return
          mutate((d) => {
            const seleccionados = d.equipos.filter((x) => equipoIds.includes(x.id))
            const lineas = seleccionados.map((eq) => {
              const m = TIPO_HW_META[eq.tipo]
              return `• [${m.short}] ${eq.codigo} — ${eq.marca} ${eq.modelo} (${eq.area}) · Próxima mantención: ${fmtFecha(eq.proximaMantencion)}`
            })
            enviarCorreo(d, {
              tipo: 'ALERTA_PREVENTIVA',
              de: `${d.config.razonSocial} <${d.config.email}>`,
              para: para.trim(),
              cc: d.config.email,
              asunto: asunto.trim(),
              cuerpo: `Estimados ${emp.razonSocial},\n\nDesde ${d.config.razonSocial} (${d.config.email}), les enviamos este aviso preventivo respecto a los siguientes equipos de su parque tecnológico:\n\n${lineas.join('\n')}\n\n${notaExtra.trim()}\n\nAtentamente,\n${d.config.razonSocial}\n${d.config.email} · ${d.config.telefono}`,
            })
            for (const eq of seleccionados) {
              if (eq.proximaMantencion) {
                d.alertasEnviadas[`${eq.id}|${eq.proximaMantencion}`] = 'ENVIADA'
              }
            }
          })
          onSent(emp.razonSocial, para.trim(), equipoIds.length)
        }}
      >
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-3.5 text-xs">
          <div className="font-bold text-emerald-950">
            Remitente oficial de PCG SPA:{' '}
            <span className="font-mono text-emerald-700">
              {db.config.razonSocial} &lt;{db.config.email}&gt;
            </span>
          </div>
          <div className="mt-0.5 text-slate-600">
            Puedes enviar una alerta preventiva de forma manual en cualquier momento, incluso si el equipo aún no entra en los 7 días previos.
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Seleccionar Empresa B2B">
            <select
              className={inputCls}
              value={empresaId}
              onChange={(e) => handleChangeEmpresa(Number(e.target.value))}
            >
              {db.empresas.map((em) => (
                <option key={em.id} value={em.id}>
                  {em.razonSocial} ({em.ciudad})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Correo(s) destino a donde se enviará la alerta">
            <input
              type="text"
              className={inputCls}
              value={para}
              onChange={(e) => setPara(e.target.value)}
              placeholder="contacto@empresa.cl"
              required
            />
          </Field>
        </div>

        <Field label="Asunto del correo">
          <input className={inputCls} value={asunto} onChange={(e) => setAsunto(e.target.value)} required />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Equipos a incluir en la alerta ({equipoIds.length} seleccionados)</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEquipoIds(equiposEmpresa.map((e) => e.id))}
                className="text-emerald-700 hover:underline"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={() => setEquipoIds([])}
                className="text-slate-500 hover:underline"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:grid-cols-2">
            {equiposEmpresa.map((eq) => {
              const m = TIPO_HW_META[eq.tipo]
              const checked = equipoIds.includes(eq.id)
              return (
                <label
                  key={eq.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                    checked
                      ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleEq(eq.id)} />
                  <span>{m.icon}</span>
                  <span className="truncate">
                    <b>{eq.codigo}</b> · {eq.marca} {eq.modelo} ({fmtFecha(eq.proximaMantencion)})
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <Field label="Mensaje / Observación personalizada">
          <textarea
            rows={2}
            className={inputCls}
            value={notaExtra}
            onChange={(e) => setNotaExtra(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn type="submit" disabled={equipoIds.length === 0}>
            ✉ Enviar Alerta Manual desde {db.config.email}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

function PreviewCorreoAlertaModal({
  empresaId,
  onClose,
  onSend,
}: {
  empresaId: number
  onClose: () => void
  onSend: () => void
}) {
  const { db } = useStore()
  const emp = db.empresas.find((e) => e.id === empresaId)
  const prog = db.programas.find((p) => p.empresaId === empresaId)
  const alertas = calcAlertas(db).filter((a) => a.empresaId === empresaId)
  if (!emp) return null
  const destino = prog?.emails || db.usuarios.find((u) => u.id === emp.contactoId)?.email || ''

  return (
    <Modal open onClose={onClose} title={`Vista Previa de Alerta Preventiva · ${emp.razonSocial}`} wide>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <img src="/img/logo-pcg.png" alt="PCG SPA" className="h-9 rounded-lg bg-white px-2 py-0.5" />
            <div>
              <div className="text-sm font-extrabold">{db.config.razonSocial}</div>
              <div className="text-[11px] text-emerald-400">PROGRAMA DE CONTINUIDAD OPERATIVA & ALERTAS PREVENTIVAS</div>
            </div>
          </div>
          <Badge tone="amber">Aviso Preventivo (-{prog?.diasAviso ?? 7} días)</Badge>
        </div>

        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600">
          <div>
            <b>De:</b> {db.config.razonSocial} &lt;<span className="font-mono text-emerald-700">{db.config.email}</span>&gt;
          </div>
          <div>
            <b>Para:</b> <span className="font-mono text-slate-900">{destino}</span>
          </div>
          <div>
            <b>Asunto:</b> 🔔 Aviso Preventivo (-{prog?.diasAviso ?? 7} días): {alertas.length} equipo(s) de {emp.razonSocial} próximos a mantención
          </div>
        </div>

        <div className="space-y-3 p-5 text-sm text-slate-700">
          <p>
            Estimados <b>{emp.razonSocial}</b>,
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            Junto con saludar, nuestro sistema de monitoreo preventivo detectó que los siguientes equipos de su parque tecnológico se acercan a su fecha sugerida de mantención preventiva:
          </p>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Tipo / Equipo</th>
                  <th className="px-3 py-2">Área</th>
                  <th className="px-3 py-2">Mantención sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alertas.map((a) => {
                  const eq = db.equipos.find((x) => x.id === a.equipoId)!
                  const m = TIPO_HW_META[eq.tipo]
                  return (
                    <tr key={a.key}>
                      <td className="px-3 py-2 font-bold text-emerald-700">{eq.codigo}</td>
                      <td className="px-3 py-2">
                        {m.icon} {eq.marca} {eq.modelo}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{eq.area}</td>
                      <td className="px-3 py-2 font-semibold">{fmtFecha(a.programada)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            ✓ Realizar la mantención preventiva a tiempo evita sobrecalentamiento, caídas de rendimiento y fallas de almacenamiento en horarios críticos.
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Btn variant="secondary" onClick={onClose}>
          Cerrar vista previa
        </Btn>
        <Btn onClick={onSend}>✉ Despachar correo ahora desde {db.config.email}</Btn>
      </div>
    </Modal>
  )
}

function ClientAlertas() {
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const nav = useNavigate()
  const prog = db.programas.find((p) => p.empresaId === user!.empresaId && p.activo)
  const alertas = calcAlertas(db).filter((a) => a.empresaId === user!.empresaId)
  const proximosIds = alertas.filter((a) => a.diasRestantes <= 30 && a.estado !== 'AGENDADA').map((a) => a.equipoId)

  return (
    <>
      <PageHeader
        title="Próximas mantenciones preventivas"
        subtitle={
          prog
            ? `Tu empresa está inscrita en el programa preventivo (aviso automático desde ${db.config.email} ${prog.diasAviso} días antes).`
            : 'Revisa el calendario sugerido de mantención para tus equipos.'
        }
        actions={
          proximosIds.length > 0 && (
            <Btn
              onClick={() => {
                let tid = 0
                mutate((d) => {
                  const t = agendarMantencion(d, user!, proximosIds)
                  tid = t.id
                })
                nav(`/app/tickets/${tid}`)
              }}
            >
              📅 Agendar mantención ({proximosIds.length} equipo{proximosIds.length > 1 ? 's' : ''})
            </Btn>
          )
        }
      />

      {sc.equipos.length === 0 ? (
        <Empty>No tienes equipos registrados.</Empty>
      ) : (
        <Table head={['Equipo', 'Categoría', 'Área', 'Última mantención', 'Próxima mantención sugerida', 'Estado', '']}>
          {sc.equipos.map((e) => {
            const a = alertas.find((x) => x.equipoId === e.id)
            const m = TIPO_HW_META[e.tipo]
            return (
              <tr key={e.id}>
                <td className={`${td} font-semibold`}>
                  <Link to={`/app/equipos/${e.id}`} className="text-emerald-700 hover:underline">{e.codigo}</Link> · {e.marca} {e.modelo}
                </td>
                <td className={td}>
                  <Badge tone={m.tone}>
                    {m.icon} {m.short}
                  </Badge>
                </td>
                <td className={td}>{e.area}</td>
                <td className={td}>{fmtFecha(e.ultimaMantencion)}</td>
                <td className={td}>{fmtFecha(e.proximaMantencion)}</td>
                <td className={td}>
                  {a ? (
                    <Badge tone={a.estado === 'AGENDADA' ? 'green' : a.diasRestantes <= 7 ? 'amber' : 'slate'}>
                      {a.estado === 'AGENDADA' ? '✓ Mantención agendada' : `En ${a.diasRestantes} días`}
                    </Badge>
                  ) : '—'}
                </td>
                <td className={`${td} text-right`}>
                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      let tid = 0
                      mutate((d) => {
                        const t = agendarMantencion(d, user!, [e.id])
                        tid = t.id
                      })
                      nav(`/app/tickets/${tid}`)
                    }}
                  >
                    Agendar este equipo
                  </Btn>
                </td>
              </tr>
            )
          })}
        </Table>
      )}
    </>
  )
}
