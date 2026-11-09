import { useState } from 'react'
import { useStore } from '@/lib/store'
import { calcAlertas, diffDays, fmtFecha, isoDate, today } from '@/lib/util'
import { Avatar, Badge, Btn, Field, cx, inputCls } from './kit'

export interface OTScheduleValue {
  inicio: string
  fin: string
  tecnicoId?: number
}

export default function OTSchedulerCalendar({
  value,
  onChange,
  horasNuevas = 5.75,
  excludeOtId,
}: {
  value: OTScheduleValue
  onChange: (next: OTScheduleValue) => void
  horasNuevas?: number
  excludeOtId?: number
}) {
  const { db } = useStore()
  const [cursor, setCursor] = useState(() => {
    const [y, m] = (value.inicio || today()).split('-').map(Number)
    return new Date(y, m - 1, 1)
  })
  const [clickStep, setClickStep] = useState<'inicio' | 'fin'>('inicio')

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset)
  const days = Array.from({ length: 35 }, (_, i) =>
    isoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)),
  )

  const hoy = today()
  const alertas = calcAlertas(db)
  const workers = db.usuarios.filter((u) => u.rol === 'WORKER' && u.activo)
  const activeOts = db.ots.filter((o) => o.estado !== 'ENTREGADO' && o.id !== excludeOtId)
  const duracionDias = Math.max(1, diffDays(value.fin, value.inicio) + 1)

  const onDayClick = (d: string) => {
    if (clickStep === 'inicio' || d < value.inicio) {
      onChange({ ...value, inicio: d, fin: d > value.fin ? d : value.fin })
      setClickStep('fin')
    } else {
      onChange({ ...value, fin: d })
      setClickStep('inicio')
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-sky-50/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            📅 Calendario de administración de tiempos y asignación de trabajador
          </h3>
          <p className="text-xs text-slate-500">
            Haz clic en los días del calendario para marcar el rango ({clickStep === 'inicio' ? '1° clic: Inicio' : '2° clic: Término'}) y elige el técnico viendo su disponibilidad real.
          </p>
        </div>
        <Badge tone="green">
          Duración: {duracionDias} día{duracionDias > 1 ? 's' : ''} ({fmtFecha(value.inicio)} → {fmtFecha(value.fin)})
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Columna izquierda: Calendario interactivo */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs lg:col-span-7">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Field label="Fecha de inicio OT">
              <input
                type="date"
                className={`${inputCls} !py-1.5 !text-xs`}
                value={value.inicio}
                onChange={(e) =>
                  onChange({
                    ...value,
                    inicio: e.target.value,
                    fin: e.target.value > value.fin ? e.target.value : value.fin,
                  })
                }
              />
            </Field>
            <Field label="Fecha de término / entrega">
              <input
                type="date"
                className={`${inputCls} !py-1.5 !text-xs`}
                min={value.inicio}
                value={value.fin}
                onChange={(e) => onChange({ ...value, fin: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between border-y border-slate-100 py-1.5">
            <span className="text-xs font-bold capitalize text-slate-800">
              {new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(cursor)}
            </span>
            <div className="flex gap-1">
              <Btn
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                ‹
              </Btn>
              <Btn
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
              >
                Mes actual
              </Btn>
              <Btn
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                ›
              </Btn>
            </div>
          </div>

          <div className="mt-1 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const inMonth = Number(d.slice(5, 7)) - 1 === cursor.getMonth()
              const isStart = d === value.inicio
              const isEnd = d === value.fin
              const inRange = d >= value.inicio && d <= value.fin
              const otsDia = activeOts.filter((o) => o.inicio <= d && d <= o.fin)
              const alDia = alertas.filter((a) => a.programada === d)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDayClick(d)}
                  className={cx(
                    'flex min-h-14 flex-col items-start rounded-lg border p-1 text-left transition',
                    isStart || isEnd
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : inRange
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                        : inMonth
                          ? 'border-slate-100 bg-white hover:border-emerald-300 hover:bg-slate-50'
                          : 'border-transparent bg-slate-50/50 text-slate-300',
                  )}
                >
                  <div className="flex w-full items-center justify-between text-[11px] font-bold">
                    <span className={cx(d === hoy && !isStart && !isEnd && 'text-emerald-600 underline')}>
                      {Number(d.slice(8))}
                    </span>
                    {alDia.length > 0 && (
                      <span
                        className="rounded bg-amber-400/90 px-1 text-[9px] font-bold text-slate-950"
                        title={`${alDia.length} mantención(es) preventiva(s)`}
                      >
                        ◔{alDia.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 w-full space-y-0.5 overflow-hidden">
                    {otsDia.slice(0, 2).map((o) => {
                      const tec = db.usuarios.find((u) => u.id === o.tecnicoId)
                      return (
                        <div
                          key={o.id}
                          className="flex items-center gap-1 truncate rounded bg-slate-900/80 px-1 py-0.2 text-[9px] font-medium text-white"
                          title={`${o.codigo} · ${o.titulo} (${tec?.nombre ?? 'Sin técnico'})`}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: tec?.color ?? '#94a3b8' }}
                          />
                          <span className="truncate">{o.codigo.slice(-4)}</span>
                        </div>
                      )
                    })}
                    {otsDia.length > 2 && (
                      <div className="text-[9px] font-semibold opacity-75">+{otsDia.length - 2} OT</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Columna derecha: Disponibilidad y carga de trabajadores */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Asignar trabajador / técnico
              </span>
              <span className="text-[11px] text-slate-400">+{horasNuevas} h estimadas</span>
            </div>

            <div className="mt-2.5 space-y-2">
              {workers.map((w) => {
                const selected = value.tecnicoId === w.id
                const tareasAbiertas = db.tareas.filter((t) => t.asignadoId === w.id && t.estado !== 'HECHA')
                const horasActuales = tareasAbiertas.reduce((s, t) => s + t.hEst, 0)
                const cap = w.horasSemanales ?? 40
                const pctActual = Math.min(100, Math.round((horasActuales / cap) * 100))
                const pctNueva = Math.min(100 - pctActual, Math.round((horasNuevas / cap) * 100))
                const traslapes = activeOts.filter(
                  (o) => o.tecnicoId === w.id && o.inicio <= value.fin && o.fin >= value.inicio,
                )

                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onChange({ ...value, tecnicoId: w.id })}
                    className={cx(
                      'w-full rounded-xl border p-3 text-left transition',
                      selected
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={w.nombre} color={w.color} size={32} />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{w.nombre}</div>
                          <div className="text-[11px] text-slate-500">{w.cargo}</div>
                        </div>
                      </div>
                      <Badge tone={traslapes.length === 0 ? 'green' : 'amber'}>
                        {traslapes.length === 0
                          ? '✓ Libre en fechas'
                          : `${traslapes.length} OT en rango`}
                      </Badge>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>
                          Carga: <b>{horasActuales.toFixed(1)} h</b>
                          {selected && <b className="text-emerald-700"> + {horasNuevas} h</b>} / {cap} h sem.
                        </span>
                        <span>{Math.round(((horasActuales + (selected ? horasNuevas : 0)) / cap) * 100)}%</span>
                      </div>
                      <div className="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-sky-500 transition-all" style={{ width: `${pctActual}%` }} />
                        {selected && (
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pctNueva}%` }} />
                        )}
                      </div>
                    </div>

                    {traslapes.length > 0 && (
                      <div className="mt-1.5 text-[11px] text-amber-800">
                        Coincide con: {traslapes.map((o) => `${o.codigo} (${fmtFecha(o.inicio)}–${fmtFecha(o.fin)})`).join(', ')}
                      </div>
                    )}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => onChange({ ...value, tecnicoId: undefined })}
                className={cx(
                  'w-full rounded-xl border p-2 text-center text-xs font-medium transition',
                  value.tecnicoId === undefined
                    ? 'border-slate-400 bg-slate-100 text-slate-800'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                )}
              >
                Dejar sin técnico asignado por ahora
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600">
            💡 <b>Tip:</b> Los bloques oscuros dentro del calendario muestran las OT ya agendadas y el punto de color indica qué técnico la tiene asignada.
          </div>
        </div>
      </div>
    </div>
  )
}

