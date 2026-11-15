import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { Card, PageHeader } from '@/components/kit'

export default function SeguridadPage() {
  const { user, mutate } = useStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!user) return null

  // Determinar si el usuario tiene la clave inicial por defecto pcg123
  const tieneClaveDefault = Boolean(
    user.esClavePorDefecto ??
    (user.password === 'pcg123' ||
      (typeof user.password === 'string' && !user.password.startsWith('$2y$') && user.password === 'pcg123'))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword.trim()) {
      setError('Por favor ingresa tu contraseña actual.')
      return
    }

    if (newPassword.trim().length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden. Por favor verifica que sean idénticas.')
      return
    }

    setLoading(true)

    try {
      // 1. Intentar actualizar a través de la API PHP en MySQL
      try {
        const res = await fetch('http://127.0.0.1:8000/api/change_password.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || 'La contraseña actual ingresada es incorrecta.')
          setLoading(false)
          return
        }
      } catch {
        // Fallback local si el backend no responde
        const matchLocal =
          currentPassword === user.password ||
          (user.password === 'pcg123' && currentPassword === 'pcg123') ||
          (tieneClaveDefault && currentPassword === 'pcg123')
        if (!matchLocal) {
          setError('La contraseña actual ingresada es incorrecta.')
          setLoading(false)
          return
        }
      }

      // 2. Actualizar en el almacén de datos (store)
      mutate((d) => {
        const target = d.usuarios.find((u) => u.id === user.id)
        if (target) {
          target.password = newPassword.trim()
          target.esClavePorDefecto = newPassword.trim() === 'pcg123'
        }
      })

      // Actualizar el objeto user en memoria
      user.password = newPassword.trim()
      user.esClavePorDefecto = newPassword.trim() === 'pcg123'

      setSuccess('¡Contraseña actualizada con éxito! Tu nueva clave está activa.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('Ocurrió un error inesperado al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Seguridad y Cambio de Contraseña"
        subtitle="Administra la clave de acceso de tu cuenta para proteger tus trabajos, boletas y datos en PCG SPA."
      />

      {/* Tarjeta de Estado de Seguridad */}
      {tieneClaveDefault ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 p-5 shadow-xs"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-900">
                Estás utilizando la contraseña inicial por defecto (pcg123)
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Por seguridad de tu cuenta, proyectos y facturas, te recomendamos establecer una contraseña personalizada ahora mismo. Al actualizarla, este recordatorio desaparecerá.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/20 p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🛡️</span>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-950">
                Tu cuenta cuenta con contraseña personalizada
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Tu acceso está protegido y no utilizas la clave genérica inicial. Puedes actualizarla cuando lo estimes conveniente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Cambio de Contraseña */}
      <Card className="border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Modificar Contraseña</h3>
            <p className="text-xs text-slate-500">
              Ingresa tu clave actual para validar tu identidad y define tu nueva contraseña.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
              ✓ {success}
            </div>
          )}

          {/* Contraseña Actual */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Contraseña Actual *</label>
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                {showCurrent ? '🙈 Ocultar' : '👁️ Mostrar'}
              </button>
            </div>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contraseña actual (o pcg123 si nunca la has cambiado)"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
              required
            />
            {tieneClaveDefault && (
              <span className="mt-1 block text-[11px] text-amber-700">
                (Tu contraseña actual es la inicial: <strong>pcg123</strong>)
              </span>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Nueva Contraseña */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Nueva Contraseña *</label>
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  {showNew ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                required
              />
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Confirmar Nueva Contraseña *</label>
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  {showConfirm ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                required
              />
            </div>
          </div>

          {newPassword && confirmPassword && (
            <div className="text-xs font-medium">
              {newPassword === confirmPassword ? (
                <span className="text-emerald-700">✓ Las contraseñas coinciden</span>
              ) : (
                <span className="text-rose-600">✕ Las contraseñas no coinciden</span>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : '✓ Guardar Nueva Contraseña'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
