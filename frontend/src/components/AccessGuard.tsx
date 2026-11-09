import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { canAccessModule, MODULOS_CONFIG } from '@/lib/permissions'
import type { ModuloKey } from '@/lib/permissions'
import { ESPECIALIDAD_WORKER_META, getWorkerEspecialidad, ROL_LABEL } from '@/lib/types'

interface AccessGuardProps {
  modulo: ModuloKey
  children: React.ReactNode
}

export default function AccessGuard({ modulo, children }: AccessGuardProps) {
  const { user } = useStore()

  if (!user) {
    return null
  }

  const allowed = canAccessModule(user, modulo)

  if (!allowed) {
    const config = MODULOS_CONFIG[modulo]
    const workerEsp = user.rol === 'WORKER' ? getWorkerEspecialidad(user) : null
    const espMeta = workerEsp ? ESPECIALIDAD_WORKER_META[workerEsp] : null

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-lg rounded-3xl border border-rose-200/80 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-md"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-3xl ring-1 ring-rose-500/30">
            🔒
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
            Módulo Restringido por Rol
          </span>

          <h2 className="mt-3 text-2xl font-black text-slate-900">
            Acceso no autorizado a {config?.label ?? 'esta sección'}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {config?.motivoBloqueo ??
              'Tu perfil o especialidad actual no cuenta con los permisos necesarios para interactuar con este módulo.'}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left text-xs">
            <div className="font-bold text-slate-700">Tu sesión actual:</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">Usuario:</span>
              <span className="font-semibold text-slate-900">{user.nombre}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-slate-500">Rol asignado:</span>
              <span className="font-semibold text-emerald-700">
                {user.rolEtiqueta ?? ROL_LABEL[user.rol]}
              </span>
            </div>
            {workerEsp && espMeta && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-500">Especialidad laboral:</span>
                <span className="font-semibold text-violet-700">
                  {espMeta.icon} {espMeta.label}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800"
            >
              ← Ir a mi Panel Principal
            </Link>
            {workerEsp === 'DISENADOR' && (
              <Link
                to="/app/proyectos"
                className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-xs font-bold text-violet-800 transition hover:bg-violet-100"
              >
                🎨 Mis Proyectos y Logos
              </Link>
            )}
            {workerEsp === 'TECNICO' && (
              <Link
                to="/app/tareas"
                className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
              >
                🛠️ Mis Tareas Técnicas
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

