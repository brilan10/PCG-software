import ExcelJS from 'exceljs'
import type { Cotizacion, DB, Equipo } from './types'
import { fmtFecha, semaforo } from './util'

/**
 * Genera y descarga un archivo .xlsx con la estructura de Cotizacion_Formal_PCG_SPA.xlsx.
 * Nunca incluye costos internos ni márgenes.
 */
export async function downloadCotizacionXlsx(db: DB, cot: Cotizacion) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Cotización PCG')
  ws.columns = [
    { width: 6 },
    { width: 52 },
    { width: 10 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
  ]

  const emp = db.empresas.find((e) => e.id === cot.empresaId)
  const cli = db.usuarios.find((u) => u.id === cot.usuarioId)

  const title = ws.addRow(['', `${db.config.razonSocial} — COTIZACIÓN`, '', '', '', 'Nro.:', cot.numero])
  title.font = { bold: true, size: 13 }
  ws.addRow(['', db.config.giro, '', '', '', 'Emisión:', fmtFecha(cot.fecha)])
  ws.addRow(['', `RUT: ${db.config.rut} | ${db.config.email} | ${db.config.telefono}`, '', '', '', 'Validez:', fmtFecha(cot.validaHasta)])
  ws.addRow([])
  ws.addRow(['', 'Cliente / Empresa:', emp?.razonSocial ?? cli?.nombre ?? '', '', 'RUT Cliente:', emp?.rut ?? cli?.rut ?? '—'])
  ws.addRow(['', 'Contacto:', cli?.nombre ?? '', '', 'Ciudad:', emp?.ciudad ?? '—'])
  ws.addRow(['', 'Parque objetivo:', `${cot.cantEquipos} equipo(s)`])
  ws.addRow([])

  const head = ws.addRow(['#', 'SERVICIO / ESPECIFICACIONES TÉCNICAS', 'CANT.', 'TARIFA NORMAL', 'TARIFA CONVENIO', 'AHORRO UNIT.', 'TOTAL'])
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  })

  const fmt = '$#,##0'
  cot.items.forEach((it, idx) => {
    const unit = cot.modo === 'CONVENIO' ? it.convenio : Math.round((it.normal * cot.total) / Math.max(1, cot.subtotalNormal))
    const r = ws.addRow([idx + 1, it.descripcion, it.cantidad, it.normal, unit, it.normal - unit, unit * it.cantidad])
    r.getCell(2).alignment = { wrapText: true }
    ;[4, 5, 6, 7].forEach((n) => (r.getCell(n).numFmt = fmt))
  })

  ws.addRow([])
  const addTot = (label: string, val: number, bold = false) => {
    const r = ws.addRow(['', '', '', '', '', label, val])
    r.getCell(7).numFmt = fmt
    if (bold) r.font = { bold: true }
  }
  addTot('Subtotal tarifa normal:', cot.subtotalNormal)
  addTot('Descuento aplicado:', -cot.descuentoMonto)
  addTot('TOTAL FINAL:', cot.total, true)

  ws.addRow([])
  ws.addRow(['', `Condiciones: ${db.config.condPago} · Plazo: ${db.config.condPlazo} · Garantía: ${db.config.condGarantiaDias} días.`])

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${cot.numero}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Descarga en Excel (.xlsx) el inventario técnico y programa de mantención preventiva del parque de equipos.
 */
export async function downloadEquiposXlsx(db: DB, equipos: Equipo[]) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Parque e Historial TI')
  ws.columns = [
    { width: 12 },
    { width: 26 },
    { width: 18 },
    { width: 12 },
    { width: 20 },
    { width: 24 },
    { width: 10 },
    { width: 14 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ]

  const title = ws.addRow([`${db.config.razonSocial} — INVENTARIO TÉCNICO Y PROGRAMA DE MANTENCIÓN`])
  title.font = { bold: true, size: 13 }
  ws.addRow([])

  const head = ws.addRow([
    'CÓDIGO',
    'EMPRESA / CLIENTE',
    'ÁREA',
    'TIPO',
    'MARCA / MODELO',
    'PROCESADOR (CPU)',
    'RAM (GB)',
    'DISIPACIÓN',
    'GPU',
    'ÚLT. MANTENCIÓN',
    'PRÓX. MANTENCIÓN',
    'ESTADO',
  ])
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  })

  equipos.forEach((e) => {
    const emp = db.empresas.find((x) => x.id === e.empresaId)
    ws.addRow([
      e.codigo,
      emp?.razonSocial ?? 'Particular',
      e.area,
      e.tipo,
      `${e.marca} ${e.modelo}`,
      e.cpu,
      e.ramGb,
      e.disipacion,
      e.gpu,
      fmtFecha(e.ultimaMantencion),
      fmtFecha(e.proximaMantencion),
      semaforo(e).label,
    ])
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Inventario_Parque_PCG_SPA.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

