import { useMemo } from 'react'
import { useStore } from './store'
import type { Equipo, Informe } from './types'

/** Datos visibles según el rol de la sesión. */
export function useScope() {
  const { db, user } = useStore()
  return useMemo(() => {
    const u = user!
    const staff = u.rol === 'ADMIN' || u.rol === 'DOC_PROCESS' || u.rol === 'WORKER'
    const mine = <T extends { empresaId?: number; usuarioId: number }>(x: T) =>
      u.rol === 'CLIENTE_EMPRESA' ? x.empresaId === u.empresaId : x.usuarioId === u.id

    const equipos: Equipo[] = staff ? db.equipos : db.equipos.filter(mine)
    const equipoIds = new Set(equipos.map((e) => e.id))
    const ots = staff ? db.ots : db.ots.filter(mine)
    const informes: Informe[] = staff
      ? db.informes
      : db.informes.filter(
          (i) =>
            i.visibleCliente &&
            ((i.equipoId && equipoIds.has(i.equipoId)) ||
              (i.otId && ots.some((o) => o.id === i.otId)) ||
              (i.empresaId && i.empresaId === u.empresaId)),
        )
    return {
      staff,
      isClient: !staff,
      equipos,
      ots,
      tickets: staff ? db.tickets : db.tickets.filter(mine),
      cotizaciones: staff ? db.cotizaciones : db.cotizaciones.filter(mine).filter((c) => c.estado !== 'BORRADOR'),
      informes,
      intervenciones: db.intervenciones.filter((i) => equipoIds.has(i.equipoId) && (staff || i.visibleCliente)),
    }
  }, [db, user])
}

export const userName = (db: { usuarios: { id: number; nombre: string }[] }, id?: number) =>
  db.usuarios.find((u) => u.id === id)?.nombre ?? '—'

