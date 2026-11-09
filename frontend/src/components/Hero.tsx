import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

/**
 * Sección Cloud Hero con vista previa enmarcada del Dashboard y Planner de PCG SPA
 * (inspirada en @aceternity/cloud-shader-hero-demo y la imagen de referencia).
 */
export default function Hero() {
  return (
    <section
      id="plataforma"
      className="relative overflow-hidden bg-gradient-to-b from-sky-500 via-sky-300 to-slate-950 py-20"
    >
      {[
        { top: '8%', size: 460, dur: 55, delay: 0, opacity: 0.6 },
        { top: '28%', size: 560, dur: 75, delay: -20, opacity: 0.45 },
        { top: '50%', size: 390, dur: 65, delay: -35, opacity: 0.5 },
      ].map((c, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-white blur-3xl"
          style={{ top: c.top, width: c.size, height: c.size / 2.4, opacity: c.opacity }}
          initial={{ x: '-30vw' }}
          animate={{ x: '110vw' }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border border-white/50 bg-white/40 px-4 py-1 text-xs font-semibold tracking-wide text-slate-900 backdrop-blur">
            PCG SPA · Plataforma de Ingeniería, Mantención y Trazabilidad TI
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Control total del parque informático, cotizaciones y órdenes de trabajo
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-800 sm:text-base">
            Historial térmico y técnico por PC, alertas preventivas automáticas 1 semana antes, generador de informes y Planner de OT en un solo lugar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-pcg-green text-white hover:bg-pcg-green/90"
              render={<Link to="/app/tickets?nuevo=1" />}
            >
              Solicitar ticket / cotización
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-900/30 bg-white/75 text-slate-900 hover:bg-white"
              render={<Link to="/login" />}
            >
              Entrar al Dashboard Demo
            </Button>
          </div>
        </div>

        {/* Ventana estilo Cloud Hero (cristal esmerilado con vista previa de la plataforma) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 rounded-3xl border border-white/60 bg-white/35 p-3 shadow-2xl backdrop-blur-xl sm:p-5"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <img src="/img/logo-pcg.png" alt="PC-G" className="h-7" />
                <span className="text-xs font-semibold text-slate-400">Analytics / Pipeline & Planner OT</span>
              </div>
              <Link to="/login" className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                Probar interactivo →
              </Link>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-4">
              {[
                ['Equipos en parque B2B', '13 PCs', 'Trazabilidad e historial activo', 'bg-blue-500'],
                ['Reducción térmica media', '-37 °C', '85 °C → 48 °C con pasta premium', 'bg-emerald-500'],
                ['Aviso preventivo', '7 días antes', 'Correo automático por empresa', 'bg-amber-500'],
                ['Ahorro Convenio 9 Eq.', '-34.6%', 'Plantillas Excel + PDF directo', 'bg-violet-500'],
              ].map(([label, val, hint, dot]) => (
                <div key={label} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    {label}
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{val}</div>
                  <div className="text-[11px] text-slate-400">{hint}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
