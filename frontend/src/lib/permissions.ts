import { getWorkerEspecialidad, isAptoDesarrollador, isAptoTecnico } from './types'
import type { EspecialidadWorker, Rol, Usuario } from './types'

export type ModuloKey =
  | 'DASHBOARD'
  | 'PROYECTOS'
  | 'FINANZAS'
  | 'INVENTARIO'
  | 'OT'
  | 'EQUIPOS'
  | 'TICKETS'
  | 'COTIZACIONES'
  | 'ALERTAS'
  | 'INFORMES'
  | 'EMPRESAS'
  | 'PERSONAL'
  | 'CATALOGO'
  | 'CORREOS'
  | 'TAREAS'
  | 'EQUIPO'

export interface ModuloInfo {
  key: ModuloKey
  label: string
  icon: string
  rolesPermitidos: Rol[]
  especialidadesWorkerPermitidas?: EspecialidadWorker[]
  motivoBloqueo?: string
}

export const MODULOS_CONFIG: Record<ModuloKey, ModuloInfo> = {
  DASHBOARD: {
    key: 'DASHBOARD',
    label: 'Dashboard / Inicio',
    icon: '▦',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
  },
  PROYECTOS: {
    key: 'PROYECTOS',
    label: 'Proyectos y Portafolio Web / Software / Branding',
    icon: '🚀',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
    especialidadesWorkerPermitidas: ['DISENADOR', 'DESARROLLADOR'],
    motivoBloqueo: 'Este módulo está reservado para Dirección y el Área Creativa / Desarrollo (Diseñadores de logos, marcas y desarrolladores web).',
  },
  FINANZAS: {
    key: 'FINANZAS',
    label: 'Finanzas, Facturación y Flujo de Caja',
    icon: '◈',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS'],
    motivoBloqueo: 'Acceso estrictamente restringido a Dirección General y Jefatura de Finanzas. Los colaboradores y personal operativo no tienen acceso a información bancaria ni facturación de la empresa.',
  },
  INVENTARIO: {
    key: 'INVENTARIO',
    label: 'Inventario de Herramientas y Repuestos',
    icon: '📦',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER'],
    especialidadesWorkerPermitidas: ['TECNICO', 'SOPORTE_GENERAL'],
    motivoBloqueo: 'Módulo de herramientas de taller y componentes de hardware, reservado para el personal técnico y administración.',
  },
  OT: {
    key: 'OT',
    label: 'Planner de Órdenes de Trabajo (OT)',
    icon: '▤',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
  },
  EQUIPOS: {
    key: 'EQUIPOS',
    label: 'Equipos y Bitácora Técnica de Hardware',
    icon: '▣',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
    especialidadesWorkerPermitidas: ['TECNICO', 'SOPORTE_GENERAL'],
    motivoBloqueo: 'Gestión física de computadores, pastas térmicas y bitácora técnica de hardware, reservada para el equipo técnico y soporte.',
  },
  TICKETS: {
    key: 'TICKETS',
    label: 'Mesa de Ayuda y Tickets',
    icon: '✉',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
    especialidadesWorkerPermitidas: ['TECNICO', 'SOPORTE_GENERAL'],
    motivoBloqueo: 'La mesa de tickets de soporte técnico de hardware está asignada al equipo técnico.',
  },
  COTIZACIONES: {
    key: 'COTIZACIONES',
    label: 'Cotizaciones Comerciales',
    icon: '$',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
    motivoBloqueo: 'La emisión y negociación de tarifas comerciales está reservada para Gerencia y Jefatura de Finanzas.',
  },
  ALERTAS: {
    key: 'ALERTAS',
    label: 'Alertas y Mantención Preventiva',
    icon: '◔',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA'],
    especialidadesWorkerPermitidas: ['TECNICO', 'SOPORTE_GENERAL'],
    motivoBloqueo: 'Calendario y alertas preventivas reservado para técnicos de mantenimiento y administración.',
  },
  INFORMES: {
    key: 'INFORMES',
    label: 'Informes Técnicos',
    icon: '▥',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
    especialidadesWorkerPermitidas: ['TECNICO', 'SOPORTE_GENERAL'],
    motivoBloqueo: 'Emisión de informes técnicos periciales de hardware, reservada para técnicos y gerencia.',
  },
  EMPRESAS: {
    key: 'EMPRESAS',
    label: 'Cartera de Clientes & CRM',
    icon: '⌂',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS'],
    motivoBloqueo: 'La base de datos comercial y cartera corporativa está reservada para la administración general.',
  },
  PERSONAL: {
    key: 'PERSONAL',
    label: 'Administración de Personal y Roles',
    icon: '☺',
    rolesPermitidos: ['ADMIN'],
    motivoBloqueo: 'La gestión de usuarios internos, sueldos, horas y permisos es facultad exclusiva del Administrador General (CEO).',
  },
  CATALOGO: {
    key: 'CATALOGO',
    label: 'Catálogo de Precios y Tarifas',
    icon: '≡',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS'],
    motivoBloqueo: 'La configuración de costos y precios de servicios está restringida para el personal directivo.',
  },
  CORREOS: {
    key: 'CORREOS',
    label: 'Historial de Correos Corporativos',
    icon: '✓',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS'],
    motivoBloqueo: 'El buzón de auditoría de correos está reservado para la administración de la sucursal.',
  },
  TAREAS: {
    key: 'TAREAS',
    label: 'Mis Tareas Asignadas',
    icon: '✔',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER'],
  },
  EQUIPO: {
    key: 'EQUIPO',
    label: 'Nuestro Equipo PCG',
    icon: '★',
    rolesPermitidos: ['ADMIN', 'DOC_PROCESS', 'WORKER', 'CLIENTE_EMPRESA', 'CLIENTE_PERSONA'],
  },
}

/**
 * Evalúa si un usuario tiene autorización para acceder a un módulo específico según su rol y especialidad.
 */
export function canAccessModule(user: Usuario | null, moduloKey: ModuloKey): boolean {
  if (!user || !user.activo) return false

  // El Administrador (CEO) siempre tiene acceso ilimitado
  if (user.rol === 'ADMIN') return true

  const config = MODULOS_CONFIG[moduloKey]
  if (!config) return false

  // Verificar si su rol está en los permitidos
  if (!config.rolesPermitidos.includes(user.rol)) {
    return false
  }

  // Si es un trabajador (WORKER), validar casillas directas de aptitud laboral
  if (user.rol === 'WORKER') {
    if (moduloKey === 'PROYECTOS') {
      return isAptoDesarrollador(user)
    }
    if (['EQUIPOS', 'INVENTARIO', 'ALERTAS', 'INFORMES', 'TICKETS'].includes(moduloKey)) {
      return isAptoTecnico(user)
    }
    if (config.especialidadesWorkerPermitidas) {
      const esp = getWorkerEspecialidad(user)
      return config.especialidadesWorkerPermitidas.includes(esp)
    }
  }

  return true
}

