import { useEffect } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { cx } from './kit'

/**
 * 1. Aceternity SpotlightCard:
 * Rastrea el cursor con useMotionValue + useMotionTemplate para proyectar un halo radial
 * luminoso sobre el fondo y el borde de la tarjeta.
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(16, 185, 129, 0.16)',
  onClick,
}: {
  children: ReactNode
  className?: string
  spotlightColor?: string
  onClick?: () => void
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cx(
        'group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-xl',
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(380px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

/**
 * 2. Aceternity 3D Card Effect (Tilt3DCard):
 * Inclinación 3D interactiva con física de resortes (useSpring + useTransform) al mover el mouse.
 */
export function Tilt3DCard({
  children,
  className,
  spotlightColor = 'rgba(56, 189, 248, 0.18)',
  intensity = 10,
}: {
  children: ReactNode
  className?: string
  spotlightColor?: string
  intensity?: number
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 260, damping: 22 })
  const springY = useSpring(y, { stiffness: 260, damping: 22 })

  const rotateX = useTransform(springY, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`])
  const rotateY = useTransform(springX, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`])

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
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

  return (
    <div style={{ perspective: '1100px' }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={cx(
          'group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:border-emerald-300/90 hover:shadow-2xl',
          className,
        )}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 75%)`,
          }}
        />
        <div className="relative z-10" style={{ transform: 'translateZ(18px)' }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}

/**
 * 3. Motion Spring Number Counter:
 * Anima cualquier número (enteros o montos en $ CLP) con física de resorte suave.
 */
export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  formatCLP = false,
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  formatCLP?: boolean
  className?: string
}) {
  const spring = useSpring(0, { stiffness: 75, damping: 18 })
  const display = useTransform(spring, (latest) => {
    const rounded = Math.round(latest)
    if (formatCLP) {
      return `$${rounded.toLocaleString('es-CL')}`
    }
    return `${prefix}${rounded.toLocaleString('es-CL')}${suffix}`
  })

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return <motion.span className={className}>{display}</motion.span>
}

/**
 * 4. Aceternity Background Beams & Aurora Grid:
 * Fondo animado con haces de luz (beams) y orbes flotantes para cabeceras de Admin y Empresas.
 */
export function BackgroundBeamsHeader({
  badge,
  title,
  subtitle,
  actions,
  children,
  variant = 'emerald',
}: {
  badge: string
  title: ReactNode
  subtitle: ReactNode
  actions?: ReactNode
  children?: ReactNode
  variant?: 'emerald' | 'indigo' | 'cyan'
}) {
  const gradMap = {
    emerald: 'from-slate-950 via-emerald-950 to-indigo-950',
    indigo: 'from-slate-950 via-indigo-950 to-teal-950',
    cyan: 'from-slate-950 via-sky-950 to-emerald-950',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cx(
        'relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r p-6 text-white shadow-2xl ring-1 ring-white/10',
        gradMap[variant],
      )}
    >
      {/* Grid futurista sutil estilo Aceternity */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Haces de luz animados (Background Beams) */}
      <motion.div
        animate={{
          x: ['-20%', '120%'],
          opacity: [0, 0.55, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-10 h-64 w-32 rotate-12 bg-gradient-to-b from-emerald-400/30 via-cyan-400/15 to-transparent blur-2xl"
      />
      <motion.div
        animate={{
          x: ['110%', '-20%'],
          opacity: [0, 0.4, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="pointer-events-none absolute -bottom-10 h-64 w-40 -rotate-12 bg-gradient-to-t from-indigo-400/30 via-sky-400/15 to-transparent blur-2xl"
      />

      {/* Orbes flotantes */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.22, 0.36, 0.22] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-12 -top-16 h-60 w-60 rounded-full bg-emerald-500/30 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.3, 0.18] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="pointer-events-none absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-sky-500/25 blur-3xl"
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-white/15 backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {badge}
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>

      {children && <div className="relative z-10 mt-5">{children}</div>}
    </motion.div>
  )
}

/**
 * 5. Aceternity Moving Border Button:
 * Botón con borde luminoso giratorio continuo para acciones clave del Admin.
 */
export function MovingBorderBtn({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cx(
        'relative inline-flex overflow-hidden rounded-xl p-[1.5px] shadow-lg focus:outline-none',
        className,
      )}
    >
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#34d399_0%,#38bdf8_50%,#10b981_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-slate-950/90 px-4 py-2 text-xs font-extrabold text-white backdrop-blur-3xl transition hover:bg-slate-900/80">
        {children}
      </span>
    </motion.button>
  )
}

/**
 * 6. Aceternity Infinite Moving Activity Ticker:
 * Cinta continua con pulso en tiempo real de la operación de PCG SPA.
 */
export function LiveActivityTicker({ items }: { items: { icon: string; label: string; tag: string; tone?: string }[] }) {
  const doubled = [...items, ...items]
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 py-2 shadow-2xs backdrop-blur-md">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="flex w-max items-center gap-4 px-4"
      >
        {doubled.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-1 text-xs shadow-2xs"
          >
            <span>{it.icon}</span>
            <span className="font-semibold text-slate-700">{it.label}</span>
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
              {it.tag}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/**
 * 7. Motion Sliding Pill Tabs (con layoutId):
 * Pestañas donde el indicador activo se desliza suavemente con física de resorte.
 */
export function AnimatedPillTabs<T extends string>({
  tabs,
  active,
  onChange,
  layoutId,
}: {
  tabs: { id: T; label: ReactNode; badge?: number | string }[]
  active: T
  onChange: (id: T) => void
  layoutId: string
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/90 bg-white/90 p-1.5 shadow-xs backdrop-blur-md">
      {tabs.map((t) => {
        const isAct = active === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cx(
              'relative rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-colors',
              isAct ? 'text-white' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {isAct && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 shadow-md"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {t.label}
              {t.badge !== undefined && (
                <span
                  className={cx(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-black',
                    isAct ? 'bg-emerald-400/25 text-emerald-200' : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {t.badge}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

