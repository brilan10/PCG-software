import { motion } from 'framer-motion'

const steps = [
  ['Recibido', 'Registramos tu equipo con fotos del estado físico.'],
  ['Revisión', 'Diagnóstico y temperaturas iniciales.'],
  ['Reparación', 'Mantención, upgrade o desarrollo según corresponda.'],
  ['QA', 'Pruebas y temperaturas finales.'],
  ['Listo', 'Informe técnico y entrega con 30 días de garantía.'],
]

export default function Timeline() {
  return (
    <section id="proceso" className="bg-slate-900 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-semibold text-white">Cómo trabajamos</h2>
        <ol className="mt-10 space-y-6 border-l border-white/15 pl-6">
          {steps.map(([title, text], i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pcg-green ring-4 ring-slate-900" />
              <h3 className="font-medium text-white">{title}</h3>
              <p className="text-sm text-slate-400">{text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

