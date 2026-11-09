import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

const links = [
  { href: '#equipo', label: 'Nuestro Personal' },
  { href: '#accesos', label: 'Solicitar Ticket / Servicios' },
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#proceso', label: 'Cómo trabajamos' },
]

export default function Navbar() {
  const { user } = useStore()
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-900/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2.5">
          <img
            src="/img/logo-pcg.png"
            alt="PC-G"
            className="h-9 rounded-md bg-white px-2"
          />
          <span className="hidden text-xs font-semibold tracking-wider text-slate-300 sm:inline">
            INGENIERÍA & SERVICIOS TI
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-white">
              {l.label}
            </a>
          ))}
          <Link to="/estado" className="text-emerald-400 transition hover:text-emerald-300">
            Estado de equipo
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button
              className="bg-pcg-green text-white hover:bg-pcg-green/90"
              render={<Link to="/app" />}
            >
              Ir a mi portal ({user.nombre.split(' ')[0]}) →
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-slate-200 hover:bg-white/10"
                render={<Link to="/registro" />}
              >
                Registrarse
              </Button>
              <Button
                className="bg-pcg-green text-white hover:bg-pcg-green/90"
                render={<Link to="/login" />}
              >
                Iniciar sesión
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
