import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { ROL_LABEL } from '@/lib/types'
import { nextId } from '@/lib/util'
import { Button } from '@/components/ui/button'

const field =
  'w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-pcg-green focus:outline-none'

export default function AuthPage({ mode }: { mode: 'login' | 'registro' }) {
  const { db, login, loginAs, mutate } = useStore()
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

  const go = (uid: number) => {
    loginAs(uid)
    nav(next)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setErr('')
            if (isLogin) {
              const u = await login(email, password)
              if (!u) {
                setErr('Credenciales inválidas. Usa uno de los accesos rápidos demo de la derecha o contraseña pcg123.')
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
          }}
          className="space-y-4 rounded-2xl border border-white/10 bg-slate-950 p-8"
        >
          <Link to="/" className="block">
            <img src="/img/logo-pcg.png" alt="PC-G" className="mx-auto h-12 rounded bg-white px-2" />
          </Link>
          <h1 className="text-center text-xl font-semibold text-white">
            {isLogin ? 'Iniciar sesión en PCG' : 'Crear cuenta de cliente'}
          </h1>
          {params.get('next') && (
            <p className="rounded-lg bg-emerald-500/10 p-2 text-center text-xs text-emerald-300">
              Inicia sesión o regístrate para continuar a tu solicitud.
            </p>
          )}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTipoCliente('EMPRESA')}
                className={`rounded-md py-1.5 font-medium ${tipoCliente === 'EMPRESA' ? 'bg-pcg-green text-white' : 'text-slate-400'}`}
              >
                Cliente Empresa (B2B)
              </button>
              <button
                type="button"
                onClick={() => setTipoCliente('PERSONA')}
                className={`rounded-md py-1.5 font-medium ${tipoCliente === 'PERSONA' ? 'bg-pcg-green text-white' : 'text-slate-400'}`}
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
            <input className={field} placeholder="RUT (ej. 76.123.456-7)" value={rut} onChange={(e) => setRut(e.target.value)} required />
          )}
          {!isLogin && tipoCliente === 'EMPRESA' && (
            <div className="grid grid-cols-2 gap-2">
              <input className={field} placeholder="Giro" value={giro} onChange={(e) => setGiro(e.target.value)} required />
              <input className={field} placeholder="Ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
            </div>
          )}
          <input className={field} type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={field} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <p className="rounded-lg bg-red-500/15 p-2.5 text-xs text-red-300">{err}</p>}
          <Button type="submit" className="w-full bg-pcg-green text-white hover:bg-pcg-green/90">
            {isLogin ? 'Entrar al portal' : 'Registrarme y continuar'}
          </Button>
          <p className="text-center text-sm text-slate-400">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <Link
              className="text-pcg-green hover:underline"
              to={`${isLogin ? '/registro' : '/login'}${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`}
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </Link>
          </p>
        </form>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 text-slate-200">
          <h2 className="text-base font-semibold text-white">Acceso rápido local (1 clic por rol)</h2>
          <p className="mt-1 text-xs text-slate-400">
            Prueba cada vista del sistema sin escribir contraseña (todas las cuentas usan <code className="text-pcg-green">pcg123</code>):
          </p>
          <div className="mt-4 space-y-2">
            {db.usuarios.filter((u) => u.activo).map((u) => {
              const emp = db.empresas.find((e) => e.id === u.empresaId)
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => go(u.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-left text-sm transition hover:border-pcg-green hover:bg-slate-800"
                >
                  <div>
                    <div className="font-medium text-white">{u.nombre} {emp && <span className="text-xs text-emerald-400">· {emp.razonSocial}</span>}</div>
                    <div className="text-xs text-slate-400">{ROL_LABEL[u.rol]} · {u.email}</div>
                  </div>
                  <span className="text-xs font-semibold text-pcg-green">Entrar →</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
