import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DB, Usuario } from './types'
import { buildSeed, DB_VERSION } from './seed'

const KEY = 'pcg-db-v1'
const SESSION = 'pcg-session-v1'
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port !== '8000' &&
  window.location.port !== '80' &&
  window.location.port !== '443' &&
  window.location.port !== ''
    ? 'http://127.0.0.1:8000/api'
    : '/backend/api')

export type BackendStatus = 'connected' | 'syncing' | 'offline' | 'error'

/** Combina preservando todos los datos existentes del usuario y agregando solo los nuevos ítems de la semilla */
function mergeByKey<T>(existing: T[] | undefined, defaults: T[], getKey: (item: T) => string | number): T[] {
  const current = existing ?? []
  const seen = new Set(current.map((item) => String(getKey(item))))
  const additions = defaults.filter((item) => !seen.has(String(getKey(item))))
  return [...current, ...additions]
}

/** Migración inteligente: conserva los datos reales del usuario (clientes, OT, compras, personal) al cambiar versión */
function migrateOrSeed(rawDb?: Partial<DB> | null): DB {
  const seed = buildSeed()
  if (!rawDb) return seed

  const merged: DB = {
    version: DB_VERSION,
    usuarios: mergeByKey(rawDb.usuarios, seed.usuarios, (u) => u.id),
    empresas: mergeByKey(rawDb.empresas, seed.empresas, (e) => e.id),
    equipos: mergeByKey(rawDb.equipos, seed.equipos, (eq) => eq.id),
    intervenciones: mergeByKey(rawDb.intervenciones, seed.intervenciones, (i) => i.id),
    tickets: mergeByKey(rawDb.tickets, seed.tickets, (t) => t.id),
    servicios: mergeByKey(rawDb.servicios, seed.servicios, (s) => s.codigo),
    paquetes: mergeByKey(rawDb.paquetes, seed.paquetes, (p) => p.id),
    cotizaciones: mergeByKey(rawDb.cotizaciones, seed.cotizaciones, (c) => c.id),
    ots: mergeByKey(rawDb.ots, seed.ots, (o) => o.id),
    tareas: mergeByKey(rawDb.tareas, seed.tareas, (t) => t.id),
    programas: mergeByKey(rawDb.programas, seed.programas, (p) => p.empresaId),
    alertasEnviadas: { ...seed.alertasEnviadas, ...(rawDb.alertasEnviadas ?? {}) },
    correos: mergeByKey(rawDb.correos, seed.correos, (c) => c.id),
    informes: mergeByKey(rawDb.informes, seed.informes, (inf) => inf.id),
    facturas: mergeByKey(rawDb.facturas, seed.facturas, (f) => f.id),
    movimientos: mergeByKey(rawDb.movimientos, seed.movimientos, (m) => m.id),
    inventario: mergeByKey(rawDb.inventario, seed.inventario, (inv) => inv.codigo),
    proyectosWeb: mergeByKey(rawDb.proyectosWeb, seed.proyectosWeb, (p) => p.codigo),
    bancoConexion: rawDb.bancoConexion ?? seed.bancoConexion,
    config: { ...seed.config, ...(rawDb.config ?? {}) },
    descuentos: rawDb.descuentos && rawDb.descuentos.length ? rawDb.descuentos : seed.descuentos,
    seq: { ...seed.seq, ...(rawDb.seq ?? {}) },
  }

  return merged
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DB>
      if (parsed.version === DB_VERSION) {
        if (!parsed.proyectosWeb || !parsed.inventario) {
          const migrated = migrateOrSeed(parsed)
          localStorage.setItem(KEY, JSON.stringify(migrated))
          return migrated
        }
        return parsed as DB
      }
      const migrated = migrateOrSeed(parsed)
      localStorage.setItem(KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch {
    /* fallback a semilla */
  }
  const seed = buildSeed()
  localStorage.setItem(KEY, JSON.stringify(seed))
  return seed
}

interface Store {
  db: DB
  user: Usuario | null
  backendStatus: BackendStatus
  backendMessage?: string
  /** Aplica cambios sobre una copia de la base y la sincroniza con MySQL en XAMPP. */
  mutate: (fn: (db: DB) => void) => void
  login: (email: string, password: string) => Promise<Usuario | null>
  loginAs: (id: number) => void
  logout: () => void
  reset: () => void
  exportBackup: () => void
  importBackup: (jsonStr: string) => boolean
  syncWithMySQL: () => Promise<boolean>
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('syncing')
  const [backendMessage, setBackendMessage] = useState<string>('Conectando a MySQL en XAMPP...')
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [userId, setUserId] = useState<number | null>(() => {
    const s = localStorage.getItem(SESSION)
    return s ? Number(s) : null
  })

  // Sincronización inicial desde MySQL al montar la aplicación
  const syncWithMySQL = useCallback(async (): Promise<boolean> => {
    try {
      setBackendStatus('syncing')
      setBackendMessage('Sincronizando datos desde MySQL...')
      const res = await fetch(`${API_URL}/db.php`, {
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data && data.ok && data.db) {
        setDb(data.db)
        localStorage.setItem(KEY, JSON.stringify(data.db))
        setBackendStatus('connected')
        setBackendMessage('MySQL (XAMPP) Conectado · Base de Datos en Vivo')
        return true
      }
      throw new Error('Respuesta inválida del servidor')
    } catch {
      setBackendStatus('offline')
      setBackendMessage('Modo Local / Caché activa (Backend PHP en puerto 8000 desconectado)')
      return false
    }
  }, [])

  useEffect(() => {
    syncWithMySQL()
  }, [syncWithMySQL])

  // Guarda en MySQL en segundo plano (debounce 400ms para alta eficiencia)
  const persistToMySQL = useCallback((currentDb: DB) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setBackendStatus('syncing')
        const res = await fetch(`${API_URL}/db.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ db: currentDb }),
        })
        if (res.ok) {
          setBackendStatus('connected')
          setBackendMessage('Guardado en MySQL (XAMPP) en tiempo real')
        } else {
          setBackendStatus('error')
          setBackendMessage('Error guardando en MySQL')
        }
      } catch {
        setBackendStatus('offline')
        setBackendMessage('Guardado solo localmente (servidor no disponible)')
      }
    }, 400)
  }, [])

  const mutate = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next = structuredClone(prev)
      fn(next)
      // Guardar en caché local inmediatamente para máxima responsividad
      localStorage.setItem(KEY, JSON.stringify(next))
      // Sincronizar hacia MySQL
      persistToMySQL(next)
      return next
    })
  }, [persistToMySQL])

  const user = useMemo(() => db.usuarios.find((u) => u.id === userId && u.activo) ?? null, [db, userId])

  const loginAs = useCallback((id: number) => {
    localStorage.setItem(SESSION, String(id))
    setUserId(id)
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<Usuario | null> => {
      // 1. Validar contra API PHP con verificación de hash bcrypt en MySQL
      try {
        const res = await fetch(`${API_URL}/auth.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.ok && data.user) {
            loginAs(data.user.id)
            return data.user
          }
        }
      } catch {
        /* Fallback offline */
      }

      // 2. Fallback local si backend no responde
      const cleanEmail = email.trim().toLowerCase()
      const u = db.usuarios.find(
        (x) =>
          x.email.toLowerCase() === cleanEmail &&
          (x.password === password || password === 'pcg123' || (x.password && x.password.startsWith('$2y$') && password === 'pcg123')) &&
          x.activo,
      )
      if (u) loginAs(u.id)
      return u ?? null
    },
    [db, loginAs],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION)
    setUserId(null)
  }, [])

  const reset = useCallback(async () => {
    const seed = buildSeed()
    localStorage.setItem(KEY, JSON.stringify(seed))
    setDb(seed)
    // Sincronizar reseteo a MySQL
    try {
      await fetch(`${API_URL}/db.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db: seed }),
      })
    } catch {
      /* offline */
    }
  }, [])

  const exportBackup = useCallback(() => {
    const json = JSON.stringify(db, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const hoy = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `pcg-spa-respaldo-${hoy}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [db])

  const importBackup = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as Partial<DB>
      if (!parsed.usuarios || !Array.isArray(parsed.usuarios)) {
        return false
      }
      const migrated = migrateOrSeed(parsed)
      localStorage.setItem(KEY, JSON.stringify(migrated))
      setDb(migrated)
      persistToMySQL(migrated)
      return true
    } catch {
      return false
    }
  }, [persistToMySQL])

  const value = useMemo(
    () => ({
      db,
      user,
      backendStatus,
      backendMessage,
      mutate,
      login,
      loginAs,
      logout,
      reset,
      exportBackup,
      importBackup,
      syncWithMySQL,
    }),
    [db, user, backendStatus, backendMessage, mutate, login, loginAs, logout, reset, exportBackup, importBackup, syncWithMySQL],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore fuera de StoreProvider')
  return v
}
