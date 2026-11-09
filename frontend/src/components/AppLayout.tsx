import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { ESPECIALIDAD_WORKER_META, getWorkerEspecialidad, isAptoDesarrollador, isAptoTecnico, ROL_LABEL } from '@/lib/types'
import type { Usuario } from '@/lib/types'
import { Avatar, cx } from './kit'

interface NavItem {
  to: string
  label: string
  icon: string
  color: string
  end?: boolean
}

function getNavigationForUser(user: Usuario): NavItem[] {
  if (user.rol === 'ADMIN') {
    return [
      { to: '/app', label: 'Dashboard General', icon: '▦', color: 'from-emerald-400 to-teal-500', end: true },
      { to: '/app/proyectos', label: 'Proyectos y Portafolio', icon: '🚀', color: 'from-emerald-400 to-cyan-500' },
      { to: '/app/finanzas', label: 'Finanzas y Facturas', icon: '◈', color: 'from-emerald-500 to-lime-500' },
      { to: '/app/inventario', label: 'Inventario y Licencias', icon: '📦', color: 'from-violet-500 to-fuchsia-500' },
      { to: '/app/ot', label: 'Órdenes de trabajo', icon: '▤', color: 'from-violet-400 to-indigo-500' },
      { to: '/app/tickets', label: 'Tickets de Soporte', icon: '✉', color: 'from-sky-400 to-blue-500' },
      { to: '/app/cotizaciones', label: 'Cotizaciones', icon: '$', color: 'from-amber-400 to-orange-500' },
      { to: '/app/empresas', label: 'Cartera / Empresas B2B', icon: '⌂', color: 'from-cyan-400 to-sky-500' },
      { to: '/app/equipos', label: 'Parque de Equipos', icon: '▣', color: 'from-blue-400 to-indigo-500' },
      { to: '/app/alertas', label: 'Alertas preventivas', icon: '◔', color: 'from-rose-400 to-orange-500' },
      { to: '/app/informes', label: 'Informes Técnicos', icon: '▥', color: 'from-teal-400 to-emerald-500' },
      { to: '/app/personal', label: 'Personal & Roles', icon: '☺', color: 'from-fuchsia-400 to-pink-500' },
      { to: '/app/catalogo', label: 'Catálogo y Precios', icon: '≡', color: 'from-lime-400 to-emerald-500' },
      { to: '/app/correos', label: 'Auditoría Correos', icon: '✓', color: 'from-indigo-400 to-violet-500' },
      { to: '/app/equipo', label: 'Nuestro Equipo PCG', icon: '★', color: 'from-emerald-400 to-cyan-500' },
    ]
  }

  if (user.rol === 'DOC_PROCESS') {
    return [
      { to: '/app', label: 'Dashboard Sucursal', icon: '▦', color: 'from-emerald-400 to-teal-500', end: true },
      { to: '/app/finanzas', label: 'Finanzas y Facturas', icon: '◈', color: 'from-emerald-500 to-lime-500' },
      { to: '/app/cotizaciones', label: 'Cotizaciones', icon: '$', color: 'from-amber-400 to-orange-500' },
      { to: '/app/ot', label: 'Órdenes de Trabajo', icon: '▤', color: 'from-violet-400 to-indigo-500' },
      { to: '/app/tickets', label: 'Mesa de Tickets', icon: '✉', color: 'from-sky-400 to-blue-500' },
      { to: '/app/empresas', label: 'Cartera Clientes B2B', icon: '⌂', color: 'from-cyan-400 to-sky-500' },
      { to: '/app/inventario', label: 'Inventario / Repuestos', icon: '📦', color: 'from-violet-500 to-fuchsia-500' },
      { to: '/app/equipos', label: 'Equipos Registrados', icon: '▣', color: 'from-blue-400 to-indigo-500' },
      { to: '/app/informes', label: 'Informes', icon: '▥', color: 'from-teal-400 to-emerald-500' },
      { to: '/app/catalogo', label: 'Catálogo y Tarifas', icon: '≡', color: 'from-lime-400 to-emerald-500' },
      { to: '/app/correos', label: 'Historial Correos', icon: '✓', color: 'from-indigo-400 to-violet-500' },
      { to: '/app/equipo', label: 'Nuestro Equipo PCG', icon: '★', color: 'from-emerald-400 to-cyan-500' },
    ]
  }

  if (user.rol === 'WORKER') {
    const aptoTec = isAptoTecnico(user)
    const aptoDev = isAptoDesarrollador(user)
    const esp = getWorkerEspecialidad(user)
    const espMeta = ESPECIALIDAD_WORKER_META[esp]

    const items: NavItem[] = [
      {
        to: '/app',
        label: aptoDev && !aptoTec ? 'Panel Creativo' : 'Panel Técnico Operativo',
        icon: espMeta.icon,
        color: 'from-emerald-400 to-teal-500',
        end: true,
      },
    ]

    if (aptoDev) {
      items.push({
        to: '/app/proyectos',
        label: 'Proyectos, Logos & Web',
        icon: '🚀',
        color: 'from-emerald-400 to-cyan-500',
      })
    }

    items.push({
      to: '/app/tareas',
      label: 'Mis Tareas',
      icon: '✔',
      color: 'from-sky-400 to-blue-500',
    })

    items.push({
      to: '/app/ot',
      label: 'Planner de OT',
      icon: '▤',
      color: 'from-violet-400 to-indigo-500',
    })

    if (aptoTec) {
      items.push(
        { to: '/app/equipos', label: 'Equipos y Bitácora', icon: '▣', color: 'from-amber-400 to-orange-500' },
        { to: '/app/inventario', label: 'Herramientas de Taller', icon: '📦', color: 'from-violet-500 to-fuchsia-500' },
        { to: '/app/tickets', label: 'Tickets Asignados', icon: '✉', color: 'from-sky-400 to-blue-500' },
        { to: '/app/alertas', label: 'Alertas Preventivas', icon: '◔', color: 'from-rose-400 to-orange-500' },
        { to: '/app/informes', label: 'Informes Técnicos', icon: '▥', color: 'from-teal-400 to-emerald-500' },
      )
    }

    items.push({
      to: '/app/equipo',
      label: 'Nuestro Equipo PCG',
      icon: '★',
      color: 'from-emerald-400 to-cyan-500',
    })

    return items
  }

  if (user.rol === 'CLIENTE_EMPRESA') {
    return [
      { to: '/app', label: 'Resumen Empresa', icon: '▦', color: 'from-emerald-400 to-teal-500', end: true },
      { to: '/app/proyectos', label: 'Mis Proyectos Web/TI', icon: '🚀', color: 'from-emerald-400 to-cyan-500' },
      { to: '/app/equipos', label: 'Mis equipos', icon: '▣', color: 'from-sky-400 to-blue-500' },
      { to: '/app/tickets', label: 'Mis tickets', icon: '✉', color: 'from-violet-400 to-indigo-500' },
      { to: '/app/cotizaciones', label: 'Cotizaciones', icon: '$', color: 'from-amber-400 to-orange-500' },
      { to: '/app/ot', label: 'Mis trabajos', icon: '▤', color: 'from-cyan-400 to-sky-500' },
      { to: '/app/finanzas', label: 'Mis Facturas', icon: '◈', color: 'from-emerald-500 to-lime-500' },
      { to: '/app/alertas', label: 'Próximas mantenciones', icon: '◔', color: 'from-rose-400 to-orange-500' },
      { to: '/app/informes', label: 'Informes', icon: '▥', color: 'from-teal-400 to-emerald-500' },
      { to: '/app/equipo', label: 'Nuestro Equipo PCG', icon: '★', color: 'from-emerald-400 to-cyan-500' },
    ]
  }

  // CLIENTE_PERSONA
  return [
    { to: '/app', label: 'Inicio', icon: '▦', color: 'from-emerald-400 to-teal-500', end: true },
    { to: '/app/proyectos', label: 'Mis Proyectos Web', icon: '🚀', color: 'from-emerald-400 to-cyan-500' },
    { to: '/app/equipos', label: 'Mis equipos', icon: '▣', color: 'from-sky-400 to-blue-500' },
    { to: '/app/tickets', label: 'Mis tickets', icon: '✉', color: 'from-violet-400 to-indigo-500' },
    { to: '/app/cotizaciones', label: 'Cotizaciones', icon: '$', color: 'from-amber-400 to-orange-500' },
    { to: '/app/ot', label: 'Mis trabajos', icon: '▤', color: 'from-cyan-400 to-sky-500' },
    { to: '/app/finanzas', label: 'Mis Boletas / Pagos', icon: '◈', color: 'from-emerald-500 to-lime-500' },
    { to: '/app/informes', label: 'Informes', icon: '▥', color: 'from-teal-400 to-emerald-500' },
    { to: '/app/equipo', label: 'Nuestro Equipo PCG', icon: '★', color: 'from-emerald-400 to-cyan-500' },
  ]
}

export default function AppLayout() {
  const { db, user, backendStatus, syncWithMySQL, loginAs, logout, reset, exportBackup, importBackup } = useStore()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />

  const nav = getNavigationForUser(user)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/35 to-sky-100/45 text-slate-900">
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 shadow-2xl transition-transform print:hidden lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Link to="/" className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <img src="/img/logo-pcg.png" alt="PC-G" className="h-9 rounded-lg bg-white px-2 py-0.5 shadow" />
          <div>
            <div className="text-xs font-bold tracking-wider text-white">PCG SPA</div>
            <div className="text-[10px] font-medium text-emerald-400">PORTAL INTELIGENTE</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cx(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/25 via-emerald-500/10 to-sky-500/10 shadow-xs ring-1 ring-emerald-400/40"
                    >
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-emerald-400 to-cyan-400 shadow-[0_0_10px_#34d399]" />
                    </motion.span>
                  )}
                  <span
                    className={cx(
                      'relative z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3',
                      n.color,
                    )}
                  >
                    {n.icon}
                  </span>
                  <span className="relative z-10">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 bg-slate-950/60 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
            <Avatar name={user.nombre} color={user.color ?? '#1fb04a'} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{user.nombre}</div>
              <div className="truncate text-xs text-emerald-400">{user.rolEtiqueta ?? ROL_LABEL[user.rol]}</div>
              {user.rol === 'WORKER' && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                  {ESPECIALIDAD_WORKER_META[getWorkerEspecialidad(user)].icon} {ESPECIALIDAD_WORKER_META[getWorkerEspecialidad(user)].label}
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            <button
              onClick={logout}
              className="flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-200"
            >
              Cerrar sesión
            </button>
            {user.rol === 'ADMIN' && (
              <>
                <button
                  onClick={exportBackup}
                  className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-emerald-500/20 hover:text-emerald-300"
                  title="Descargar respaldo completo (JSON)"
                >
                  💾
                </button>
                <label
                  className="cursor-pointer rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300"
                  title="Restaurar base de datos desde respaldo JSON"
                >
                  📥
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const content = ev.target?.result as string
                        if (content && importBackup(content)) {
                          alert('✓ Respaldo restaurado con éxito')
                        } else {
                          alert('✕ Error: el archivo no es un respaldo válido de PCG SPA')
                        }
                      }
                      reader.readAsText(file)
                      e.target.value = ''
                    }}
                  />
                </label>
                <button
                  onClick={() => confirm('¿Restablecer todos los datos demo?') && reset()}
                  className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                  title="Restablecer datos demo"
                >
                  ↺
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md print:hidden sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menú">
              ☰
            </button>
            {backendStatus === 'connected' && (
              <span
                onClick={() => syncWithMySQL()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25"
                title="Conectado a MySQL en XAMPP (Haz clic para refrescar)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span>MySQL (XAMPP) Conectado</span>
                <span className="hidden text-[10px] text-emerald-700 md:inline">· BD en vivo</span>
              </span>
            )}
            {backendStatus === 'syncing' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-500/30">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                <span>Sincronizando con MySQL...</span>
              </span>
            )}
            {backendStatus === 'offline' && (
              <span
                onClick={() => syncWithMySQL()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/30 transition hover:bg-amber-500/25"
                title="Modo local activo (Haz clic para reintentar conectar a MySQL)"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Modo Local / Caché</span>
                <span className="hidden text-[10px] text-amber-700 md:inline">· Clic para conectar XAMPP</span>
              </span>
            )}
            {backendStatus === 'error' && (
              <span
                onClick={() => syncWithMySQL()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-500/30 transition hover:bg-rose-500/25"
                title="Error al sincronizar (Haz clic para reintentar)"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Error MySQL</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden text-slate-500 sm:inline">Cambiar vista de rol:</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none"
              value={user.id}
              onChange={(e) => loginAs(Number(e.target.value))}
            >
              {db.usuarios.filter((u) => u.activo).map((u) => {
                const esp = u.rol === 'WORKER' ? getWorkerEspecialidad(u) : null
                const espLabel = esp ? ` · ${ESPECIALIDAD_WORKER_META[esp].icon} ${ESPECIALIDAD_WORKER_META[esp].label}` : ''
                return (
                  <option key={u.id} value={u.id}>
                    {u.nombre} — {u.rolEtiqueta ?? ROL_LABEL[u.rol]}{espLabel}
                  </option>
                )
              })}
            </select>
          </div>
        </header>

        <motion.main
          key={loc.pathname + String(user.id)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 sm:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
