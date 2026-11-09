import { useEffect } from 'react'
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ---------- Botones ----------
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-emerald-500 via-emerald-600 to-pcg-green text-white shadow-md shadow-emerald-600/25 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-600/35',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-xs hover:border-emerald-400 hover:bg-emerald-50/40 hover:text-emerald-800',
  danger: 'bg-gradient-to-r from-red-500 to-pcg-red text-white shadow-md shadow-red-600/25 hover:opacity-95',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

export function Btn({
  variant = 'primary',
  size = 'md',
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variants[variant],
        className,
      )}
    />
  )
}

// ---------- Contenedores con Spotlight interactivo estilo Aceternity UI ----------
export function Card({
  children,
  className,
  title,
  action,
  accent = 'emerald',
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
  accent?: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose'
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const topBar = {
    emerald: 'from-emerald-500 via-teal-500 to-sky-500',
    blue: 'from-sky-500 via-blue-500 to-indigo-500',
    violet: 'from-violet-500 via-purple-500 to-fuchsia-500',
    amber: 'from-amber-400 via-orange-500 to-rose-500',
    rose: 'from-rose-500 via-red-500 to-orange-500',
  }[accent]

  const spotColor = {
    emerald: 'rgba(16, 185, 129, 0.11)',
    blue: 'rgba(56, 189, 248, 0.11)',
    violet: 'rgba(139, 92, 246, 0.11)',
    amber: 'rgba(245, 158, 11, 0.11)',
    rose: 'rgba(244, 63, 94, 0.11)',
  }[accent]

  function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent<HTMLElement>) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <motion.section
      onMouseMove={onMouseMove}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={cx(
        'group relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/95 shadow-sm backdrop-blur transition-all duration-300 hover:border-slate-300/90 hover:shadow-xl',
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(460px circle at ${mouseX}px ${mouseY}px, ${spotColor}, transparent 80%)`,
        }}
      />
      <div className={cx('relative z-10 h-1 w-full bg-gradient-to-r', topBar)} />
      {(title || action) && (
        <header className="relative z-10 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-3.5">
          <h2 className="text-sm font-bold tracking-tight text-slate-800">{title}</h2>
          {action}
        </header>
      )}
      <div className="relative z-10 p-5">{children}</div>
    </motion.section>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="mb-6 flex flex-wrap items-start justify-between gap-3 print:hidden"
    >
      <div>
        <h1 className="bg-gradient-to-r from-slate-950 via-emerald-900 to-teal-700 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </motion.div>
  )
}

// ---------- KPI con Spotlight, resorte y contador numérico animado ----------
export type Tone = 'slate' | 'green' | 'red' | 'amber' | 'blue' | 'violet'

const kpiStyles: Record<Tone, { bg: string; border: string; pill: string; text: string; bar: string; spot: string }> = {
  blue: {
    bg: 'from-sky-500/12 via-blue-500/5 to-white',
    border: 'border-sky-200/90 hover:border-sky-400',
    pill: 'bg-sky-500 text-white shadow-sm shadow-sky-500/40',
    text: 'text-sky-950',
    bar: 'from-sky-400 to-blue-600',
    spot: 'rgba(14, 165, 233, 0.18)',
  },
  violet: {
    bg: 'from-violet-500/12 via-fuchsia-500/5 to-white',
    border: 'border-violet-200/90 hover:border-violet-400',
    pill: 'bg-violet-600 text-white shadow-sm shadow-violet-500/40',
    text: 'text-violet-950',
    bar: 'from-violet-500 to-fuchsia-600',
    spot: 'rgba(139, 92, 246, 0.18)',
  },
  green: {
    bg: 'from-emerald-500/12 via-teal-500/5 to-white',
    border: 'border-emerald-200/90 hover:border-emerald-400',
    pill: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40',
    text: 'text-emerald-950',
    bar: 'from-emerald-400 to-teal-600',
    spot: 'rgba(16, 185, 129, 0.18)',
  },
  amber: {
    bg: 'from-amber-500/15 via-orange-500/5 to-white',
    border: 'border-amber-200/90 hover:border-amber-400',
    pill: 'bg-amber-500 text-white shadow-sm shadow-amber-500/40',
    text: 'text-amber-950',
    bar: 'from-amber-400 to-orange-500',
    spot: 'rgba(245, 158, 11, 0.18)',
  },
  red: {
    bg: 'from-rose-500/15 via-red-500/5 to-white',
    border: 'border-rose-200/90 hover:border-rose-400',
    pill: 'bg-rose-600 text-white shadow-sm shadow-rose-500/40',
    text: 'text-rose-950',
    bar: 'from-rose-500 to-red-600',
    spot: 'rgba(244, 63, 94, 0.18)',
  },
  slate: {
    bg: 'from-slate-200/50 via-slate-100/20 to-white',
    border: 'border-slate-200 hover:border-slate-300',
    pill: 'bg-slate-700 text-white',
    text: 'text-slate-900',
    bar: 'from-slate-400 to-slate-600',
    spot: 'rgba(100, 116, 139, 0.15)',
  },
}

function SpringCounter({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 75, damping: 18 })
  const display = useTransform(spring, (latest) => Math.round(latest).toLocaleString('es-CL'))
  useEffect(() => {
    spring.set(value)
  }, [value, spring])
  return <motion.span>{display}</motion.span>
}

export function Kpi({ label, value, hint, tone = 'slate' }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  const st = kpiStyles[tone]
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={cx(
        'group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-xl',
        st.bg,
        st.border,
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, ${st.spot}, transparent 80%)`,
        }}
      />
      <div className={cx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', st.bar)} />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="relative flex h-2.5 w-2.5">
          <span className={cx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', st.pill)} />
          <span className={cx('relative inline-flex h-2.5 w-2.5 rounded-full', st.pill)} />
        </span>
      </div>
      <div className={cx('relative z-10 mt-2 text-3xl font-extrabold tracking-tight', st.text)}>
        {typeof value === 'number' ? <SpringCounter value={value} /> : value}
      </div>
      {hint && <div className="relative z-10 mt-1 text-xs font-medium text-slate-500">{hint}</div>}
    </motion.div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

// ---------- Badges ----------
const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  green: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/70',
  red: 'bg-rose-100 text-rose-800 ring-1 ring-rose-300/70',
  amber: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300/70',
  blue: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300/70',
  violet: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/70',
}

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>
      {children}
    </span>
  )
}

export const prioTone = { BAJA: 'slate', MEDIA: 'blue', ALTA: 'amber', URGENTE: 'red' } as const

// ---------- Formularios ----------
export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pcg-green focus:outline-none focus:ring-2 focus:ring-pcg-green/20'

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

// ---------- Modal ----------
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm print:hidden"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cx('my-8 w-full overflow-hidden rounded-2xl bg-white shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500" />
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  )
}

export function Avatar({ name, color = '#64748b', size = 28 }: { name: string; color?: string; size?: number }) {
  const ini = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-xs ring-2 ring-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {ini}
    </span>
  )
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      <table className="w-full text-left text-sm">
        <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-xs uppercase tracking-wider text-slate-100">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </motion.div>
  )
}

export const td = 'px-4 py-3.5 align-middle'
