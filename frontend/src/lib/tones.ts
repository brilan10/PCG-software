import type { Tone } from '@/components/kit'
import type { EstadoOT, EstadoTicket, EstadoCot, Tarea } from './types'

export const otTone: Record<EstadoOT, Tone> = {
  RECIBIDO: 'slate',
  EN_REVISION: 'blue',
  EN_DESARROLLO: 'violet',
  EN_QA: 'amber',
  LISTO: 'green',
  ENTREGADO: 'green',
  CANCELADA: 'red',
}

export const ticketTone: Record<EstadoTicket, Tone> = {
  ABIERTO: 'blue',
  EN_COTIZACION: 'amber',
  COTIZADO: 'violet',
  ACEPTADO: 'green',
  CERRADO: 'slate',
  CANCELADO: 'red',
}

export const cotTone: Record<EstadoCot, Tone> = {
  BORRADOR: 'slate',
  ENVIADA: 'violet',
  ACEPTADA: 'green',
  RECHAZADA: 'red',
}

export const tareaTone: Record<Tarea['estado'], Tone> = {
  PENDIENTE: 'slate',
  EN_CURSO: 'blue',
  BLOQUEADA: 'red',
  EN_REVISION: 'amber',
  HECHA: 'green',
}

export const pagoTone = { PENDIENTE: 'amber', VERIFICANDO: 'blue', PAGADO: 'green' } as const

