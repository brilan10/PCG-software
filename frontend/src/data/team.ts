export interface TeamMember {
  id: string
  name: string
  titles: string[]
  /** Ruta en /public. Si falta, la tarjeta muestra iniciales. */
  photo?: string
  initials: string
  rotate: number
  x: number
  y: number
}

// Fuente de verdad futura: tabla equipo_miembros (backend/schema.sql).
export const team: TeamMember[] = [
  {
    id: 'brilan',
    name: 'Brilan Bugueño',
    titles: [
      'CEO / Fundador & Administrador General PCG SPA',
      'Ingeniero Informático · Licenciado en Ciencias de la Ingeniería Informática',
      'Dirección de Ingeniería TI, Servidores e Infraestructura',
    ],
    initials: 'BB',
    rotate: -5,
    x: 0,
    y: 10,
  },
  {
    id: 'yovylin',
    name: 'Yovylin Bugueño',
    titles: [
      'Jefa de Sucursal & Encargada de Finanzas',
      'Ingeniera Civil Industrial · Licenciatura',
      'Control de Caja, Facturación, Cotizaciones y Gestión Comercial',
    ],
    photo: '/img/yovylin.jpeg',
    initials: 'YB',
    rotate: -2,
    x: 0,
    y: 0,
  },
  {
    id: 'johan',
    name: 'Johan Carrasco',
    titles: [
      'Ingeniero en Seguridad Privada',
      'Prevencionista de Riesgos con Mención Penal',
      'Seguridad Operativa, Auditoría y Soporte en Terreno',
    ],
    initials: 'JC',
    rotate: 3,
    x: 0,
    y: 15,
  },
  {
    id: 'javier',
    name: 'Javier Vergara',
    titles: [
      'Diseñador Gráfico Corporativo (Logos & Tarjetas de Presentación)',
      'Identidad Visual, Branding, Papelería Ejecutiva y QR Digital',
      'Staff Técnico de Laboratorio y Mantención de Equipos',
    ],
    initials: 'JV',
    rotate: 6,
    x: 0,
    y: 20,
  },
]
