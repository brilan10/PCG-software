import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { team } from '@/data/team'

const cardThemes: Record<string, { grad: string; badge: string; glow: string; role: string }> = {
  brilan: {
    grad: 'from-sky-500 via-indigo-600 to-violet-700',
    badge: 'bg-sky-500/20 text-sky-300 ring-sky-400/40',
    glow: 'group-hover:shadow-sky-500/30',
    role: '👑 CEO & Ingeniería Informática',
  },
  yovylin: {
    grad: 'from-emerald-500 via-teal-600 to-cyan-700',
    badge: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/40',
    glow: 'group-hover:shadow-emerald-500/30',
    role: '💼 Jefa de Sucursal & Finanzas',
  },
  johan: {
    grad: 'from-amber-500 via-orange-600 to-rose-700',
    badge: 'bg-amber-500/20 text-amber-300 ring-amber-400/40',
    glow: 'group-hover:shadow-amber-500/30',
    role: '🛡️ Ing. Seguridad / Prevencionista Penal',
  },
  javier: {
    grad: 'from-fuchsia-500 via-purple-600 to-indigo-700',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 ring-fuchsia-400/40',
    glow: 'group-hover:shadow-fuchsia-500/30',
    role: '🎨 Diseñador (Logos y Tarjetas) & Técnico',
  },
}

const PHOTO_KEY = 'pcg-team-photos-v1'

export default function TeamCards() {
  const area = useRef<HTMLDivElement>(null)
  const [resetKey, setResetKey] = useState(0)
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}')
    } catch {
      return {}
    }
  })

  const onPhotoUpload = (id: string, file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const next = { ...customPhotos, [id]: String(reader.result) }
      setCustomPhotos(next)
      localStorage.setItem(PHOTO_KEY, JSON.stringify(next))
    }
    reader.readAsDataURL(file)
  }

  return (
    <section
      id="equipo"
      className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-20"
    >
      <div className="pointer-events-none absolute left-1/4 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            ★ Nuestro Equipo Directivo y Profesional
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Profesionales titulados detrás de cada servicio
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Arrastra libremente las cartas por la pantalla o haz clic en el ícono de cámara para cargar una foto local.
          </p>
          <button
            type="button"
            onClick={() => setResetKey((k) => k + 1)}
            className="mt-4 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            ↺ Ordenar cartas
          </button>
        </div>

        <div
          key={resetKey}
          ref={area}
          className="relative mx-auto flex min-h-[580px] max-w-5xl flex-col items-center justify-center gap-6 md:min-h-[500px] md:flex-row md:gap-2"
        >
          {team.map((m, i) => {
            const th = cardThemes[m.id] ?? cardThemes.brilan
            const photoSrc = customPhotos[m.id] ?? m.photo
            return (
              <motion.article
                key={m.id}
                drag
                dragConstraints={area}
                dragElastic={0.18}
                whileHover={{ scale: 1.04, rotate: 0, zIndex: 30 }}
                whileDrag={{ scale: 1.08, zIndex: 40, cursor: 'grabbing' }}
                initial={{ opacity: 0, y: 40, rotate: m.rotate }}
                whileInView={{ opacity: 1, y: m.y, rotate: m.rotate }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 180, damping: 18 }}
                viewport={{ once: true }}
                className={`group relative w-76 cursor-grab select-none overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-3 shadow-2xl backdrop-blur transition-shadow duration-300 md:-mx-3 ${th.glow}`}
              >
                <div className="relative aspect-[4/4.6] overflow-hidden rounded-2xl bg-slate-800">
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={m.name}
                      draggable={false}
                      className="h-full w-full scale-110 object-cover object-top transition duration-500 group-hover:scale-115"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${th.grad} p-6 text-center text-white`}
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 text-4xl font-extrabold shadow-lg backdrop-blur">
                        {m.initials}
                      </div>
                      <span className="mt-3 text-xs font-medium text-white/80">PCG SPA</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                  <label
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute right-2.5 top-2.5 cursor-pointer rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-white/90 opacity-0 ring-1 ring-white/20 backdrop-blur transition group-hover:opacity-100 hover:bg-emerald-600"
                    title="Cambiar foto local"
                  >
                    📷 Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPhotoUpload(m.id, e.target.files?.[0])}
                    />
                  </label>

                  <span
                    className={`absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 backdrop-blur ${th.badge}`}
                  >
                    {th.role}
                  </span>
                </div>

                <div className="px-2 pb-2 pt-4">
                  <h3 className="text-lg font-bold text-white">{m.name}</h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                    {m.titles.map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-pcg-green" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            )
          })}
        </div>

        {/* Destacado de Diseño Gráfico: Tarjetas de Presentación y Logos Corporativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-10 max-w-4xl rounded-3xl border border-fuchsia-400/25 bg-gradient-to-r from-slate-900/90 via-purple-950/50 to-slate-900/90 p-5 text-white shadow-xl backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-2xl shadow-lg">
                🎨
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight text-white">
                    Área de Diseño & Branding PCG SPA: Logos y Tarjetas de Presentación
                  </span>
                  <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-300 ring-1 ring-fuchsia-400/40">
                    Javier Vergara · Diseñador
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Además de soporte TI y mantención de equipos, diseñamos <b>Logos Corporativos</b>, <b>Tarjetas de Presentación Ejecutivas (frente/dorso listas para imprenta + QR digital)</b> e identidad visual para empresas y profesionales.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
