import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { ESTADOS_OT, ESTADO_OT_LABEL } from '@/lib/types'
import { fmtFecha, fmtFechaHora } from '@/lib/util'
import { Badge, Btn, cx, inputCls } from '@/components/kit'
import { otTone } from '@/lib/tones'

export default function EstadoPublico() {
  const { db } = useStore()
  const [codigo, setCodigo] = useState(db.ots[0]?.codigo ?? '')
  const clean = codigo.trim().toLowerCase()
  const ot = db.ots.find((o) => {
    if (o.codigo.toLowerCase() === clean) return true
    return o.equipoIds.some((eqId) => {
      const e = db.equipos.find((x) => x.id === eqId)
      return e?.serie && e.serie.trim().toLowerCase() === clean
    })
  })
  const idx = ot ? ESTADOS_OT.indexOf(ot.estado) : -1

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link to="/">
            <img src="/img/logo-pcg.png" alt="PC-G" className="h-10 rounded-md bg-white px-2" />
          </Link>
          <Link to="/" className="text-sm text-pcg-green hover:underline">← Volver al inicio</Link>
        </div>

        <h1 className="mt-8 text-3xl font-semibold text-white">Seguimiento de equipo en línea</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ingresa tu código único de Orden de Trabajo (ej. {db.ots.slice(0, 3).map((o) => o.codigo).join(', ')}) o el <strong className="text-emerald-400">Número de Serie (S/N)</strong> de tu equipo.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <input
            className={`${inputCls} min-w-[300px] !bg-slate-800 !text-white !border-white/15`}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código OT (ej. PCG-2026-8921) o N° Serie (ej. SN10037)"
          />
          {db.ots.slice(0, 3).map((o) => (
            <Btn key={o.id} size="sm" variant="secondary" onClick={() => setCodigo(o.codigo)}>
              Probar {o.codigo}
            </Btn>
          ))}
          {db.equipos.filter((e) => e.serie).slice(0, 2).map((e) => (
            <Btn key={e.id} size="sm" variant="secondary" onClick={() => setCodigo(e.serie)}>
              Probar S/N {e.serie}
            </Btn>
          ))}
        </div>

        {!ot ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950 p-6 text-sm text-slate-400">
            No encontramos una orden de trabajo con el código o número de serie ingresado. Prueba con uno de los botones de arriba o verifica la etiqueta de tu equipo.
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white p-6 text-slate-900 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-semibold text-slate-400">{ot.codigo}</div>
                <h2 className="text-lg font-bold">{ot.titulo}</h2>
              </div>
              <Badge tone={otTone[ot.estado]}>{ESTADO_OT_LABEL[ot.estado]}</Badge>
            </div>

            <div className="mt-6 flex items-center">
              {ESTADOS_OT.slice(0, 5).map((s, i) => (
                <div key={s} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cx(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        i <= idx ? 'bg-pcg-green text-white' : 'bg-slate-200 text-slate-500',
                      )}
                    >
                      {i <= idx ? '✓' : i + 1}
                    </div>
                    <div className="mt-1.5 w-24 text-center text-[11px] font-medium text-slate-600">{ESTADO_OT_LABEL[s]}</div>
                  </div>
                  {i < 4 && <div className={cx('mb-5 h-1 flex-1', i < idx ? 'bg-pcg-green' : 'bg-slate-200')} />}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-400">Equipos en intervención</div>
                <div className="font-medium">
                  {ot.equipoIds
                    .map((id) => {
                      const e = db.equipos.find((x) => x.id === id)
                      return e ? `${e.codigo} · ${e.marca} ${e.modelo} (S/N: ${e.serie || 'Sin número'})` : ''
                    })
                    .filter(Boolean)
                    .join(', ') || 'Sin equipos físicos asociados'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Entrega estimada</div>
                <div className="font-medium">{fmtFecha(ot.fin)}</div>
              </div>
            </div>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Bitácora de avance</h3>
            <ul className="mt-2 space-y-2 text-xs text-slate-600">
              {ot.historial.slice().reverse().map((h, i) => (
                <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                  <span><b>{ESTADO_OT_LABEL[h.estado]}</b> — {h.nota}</span>
                  <span className="text-slate-400">{fmtFechaHora(h.fecha)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

