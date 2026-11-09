import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { nextId } from '@/lib/util'
import { Button } from '@/components/ui/button'

const field =
  'w-full rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-pcg-green focus:outline-none focus:ring-1 focus:ring-pcg-green transition'

export default function AuthPage({ mode }: { mode: 'login' | 'registro' }) {
  const { login, loginAs, mutate } = useStore()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const next = params.get('next') || '/app'
  const isLogin = mode === 'login'

  const [tipoCliente, setTipoCliente] = useState<'EMPRESA' | 'PERSONA'>('EMPRESA')
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [giro, setGiro] = useState('Servicios')
  const [ciudad, setCiudad] = useState('Santiago')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [cargando, setCargando] = useState(false)

  const go = (uid: number) => {
    loginAs(uid)
    nav(next)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setErr('')
            setCargando(true)
            try {
              if (isLogin) {
                const u = await login(email, password)
                if (!u) {
                  setErr('Credenciales inválidas. Verifica tu correo y contraseña.')
                  setCargando(false)
                  return
                }
                nav(next)
              } else {
                let uid = 0
                mutate((d) => {
                  uid = nextId(d.usuarios)
                  if (tipoCliente === 'EMPRESA') {
                    const empId = nextId(d.empresas)
                    d.empresas.push({ id: empId, razonSocial: nombre, rut, giro, ciudad, direccion: ciudad, contactoId: uid })
                    d.usuarios.push({ id: uid, nombre, email, password, rol: 'CLIENTE_EMPRESA', activo: true, empresaId: empId })
                  } else {
                    d.usuarios.push({ id: uid, nombre, email, password, rol: 'CLIENTE_PERSONA', rut, activo: true })
                  }
                })
                go(uid)
              }
            } catch {
              setErr('Ocurrió un error al procesar la solicitud. Intenta nuevamente.')
            } finally {
              setCargando(false)
            }
          }}
          className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-center">
            <Link to="/" className="inline-block transition hover:opacity-90">
              <img src="/img/logo-pcg.png" alt="PC-G" className="mx-auto h-12 rounded-lg bg-white px-2 py-1 shadow-sm" />
            </Link>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
              {isLogin ? 'Iniciar sesión' : 'Crear cuenta de cliente'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {isLogin
                ? 'Ingresa tus credenciales para acceder a la plataforma'
                : 'Completa los datos para registrarte en el portal'}
            </p>
          </div>

          {params.get('next') && (
            <p className="rounded-xl bg-emerald-500/10 p-2.5 text-center text-xs text-emerald-300 ring-1 ring-emerald-500/20">
              Inicia sesión o regístrate para continuar a tu solicitud.
            </p>
          )}

          {!isLogin && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTipoCliente('EMPRESA')}
                className={`rounded-lg py-2 font-medium transition ${tipoCliente === 'EMPRESA' ? 'bg-pcg-green text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Cliente Empresa (B2B)
              </button>
              <button
                type="button"
                onClick={() => setTipoCliente('PERSONA')}
                className={`rounded-lg py-2 font-medium transition ${tipoCliente === 'PERSONA' ? 'bg-pcg-green text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Persona Natural (B2C)
              </button>
            </div>
          )}

          {!isLogin && (
            <input
              className={field}
              placeholder={tipoCliente === 'EMPRESA' ? 'Razón Social de la empresa' : 'Nombre completo'}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          )}

          {!isLogin && (
            <input
              className={field}
              placeholder="RUT (ej. 76.123.456-7)"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
            />
          )}

          {!isLogin && tipoCliente === 'EMPRESA' && (
            <div className="grid grid-cols-2 gap-2">
              <input className={field} placeholder="Giro" value={giro} onChange={(e) => setGiro(e.target.value)} required />
              <input className={field} placeholder="Ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Correo electrónico o RUT</label>
            <input
              className={field}
              type="text"
              placeholder="brilan@pcg.cl o RUT"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Contraseña</label>
            <input
              className={field}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-medium text-red-300">
              {err}
            </div>
          )}

          <Button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-pcg-green py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-pcg-green/90"
          >
            {cargando ? 'Ingresando...' : isLogin ? 'Entrar al portal' : 'Registrarme y continuar'}
          </Button>

          <div className="pt-2 text-center text-xs text-slate-400">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <Link
              className="font-semibold text-pcg-green hover:underline"
              to={`${isLogin ? '/registro' : '/login'}${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`}
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
