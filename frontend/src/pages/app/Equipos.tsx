import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useScope } from '@/lib/scope'
import { crearInforme, registrarIntervencion } from '@/lib/actions'
import { downloadEquiposXlsx } from '@/lib/xlsx'
import { ES_COMPUTO, TIPO_HW_META } from '@/lib/types'
import type { Equipo, Intervencion, TipoHw } from '@/lib/types'
import { CHECKLIST_MANT, addMonths, fmtFecha, nextId, semaforo } from '@/lib/util'
import { Badge, Btn, Card, Empty, Field, Modal, PageHeader, Table, cx, inputCls, td } from '@/components/kit'

const MAIN_TYPES: TipoHw[] = ['DESKTOP', 'LAPTOP', 'SERVIDOR', 'IMPRESORA', 'CAMARA', 'RED', 'UPS']

export function EquiposPage() {
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [fEmp, setFEmp] = useState(params.get('empresa') ?? '')
  const [fTipo, setFTipo] = useState<string>(params.get('tipo') ?? '')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<number[]>([])
  const [nuevo, setNuevo] = useState(false)

  // Equipos filtrados por empresa (para calcular los contadores por tipo)
  const baseEmpresa = sc.equipos.filter(
    (e) => !fEmp || (fEmp === '0' ? !e.empresaId : e.empresaId === Number(fEmp)),
  )

  const list = baseEmpresa.filter(
    (e) =>
      (!fTipo || e.tipo === fTipo) &&
      (!q || `${e.codigo} ${e.marca} ${e.modelo} ${e.area} ${e.cpu} ${e.gpu} ${e.serie}`.toLowerCase().includes(q.toLowerCase())),
  )

  const toggle = (id: number, on: boolean) => setSel(on ? [...sel, id] : sel.filter((x) => x !== id))

  return (
    <>
      <PageHeader
        title={sc.isClient ? 'Mis equipos y activos TI' : 'Administración y conteo de equipos'}
        subtitle="Control de PC Torre, Laptops, Servidores, Impresoras, Cámaras CCTV, Redes y UPS"
        actions={
          <>
            {sel.length > 0 && (
              <Btn variant="secondary" onClick={() => nav(`/app/tickets?nuevo=1&equipos=${sel.join(',')}`)}>
                Solicitar ticket ({sel.length} seleccionado{sel.length > 1 ? 's' : ''})
              </Btn>
            )}
            <Btn variant="secondary" onClick={() => downloadEquiposXlsx(db, list)}>
              Exportar inventario Excel (.xlsx)
            </Btn>
            <Btn onClick={() => setNuevo(true)}>+ Registrar equipo / activo</Btn>
          </>
        }
      />

      {/* Tarjetas interactivas de conteo por categoría de hardware */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={() => setFTipo('')}
          className={cx(
            'flex flex-col justify-between rounded-2xl border p-3 text-left transition',
            fTipo === ''
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-emerald-300',
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-85">
            <span>Total activos</span>
            <span>▣</span>
          </div>
          <div className="mt-1 text-2xl font-extrabold">{baseEmpresa.length}</div>
          <div className="text-[11px] opacity-75">Ver todos</div>
        </motion.button>

        {MAIN_TYPES.map((t) => {
          const meta = TIPO_HW_META[t]
          const count = baseEmpresa.filter((e) => e.tipo === t).length
          const active = fTipo === t
          return (
            <motion.button
              key={t}
              type="button"
              whileHover={{ y: -2 }}
              onClick={() => setFTipo(active ? '' : t)}
              className={cx(
                'flex flex-col justify-between rounded-2xl border p-3 text-left transition',
                active
                  ? 'border-indigo-500 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md'
                  : 'border-slate-200 bg-white hover:border-indigo-300',
              )}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={active ? 'text-slate-200' : 'text-slate-600'}>{meta.short}</span>
                <span className="text-base">{meta.icon}</span>
              </div>
              <div className={cx('mt-1 text-2xl font-extrabold', active ? 'text-white' : 'text-slate-900')}>
                {count}
              </div>
              <div className={cx('text-[11px]', active ? 'text-emerald-300' : 'text-slate-400')}>
                {active ? 'Filtro activo ✓' : 'Filtrar'}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Barra de filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className={`${inputCls} !w-72`}
          placeholder="🔍 Buscar por N° serie (S/N), código, marca..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {sc.staff && (
          <select
            className={`${inputCls} !w-56`}
            value={fEmp}
            onChange={(e) => {
              setFEmp(e.target.value)
              setParams(e.target.value ? { empresa: e.target.value } : {}, { replace: true })
            }}
          >
            <option value="">Todas las empresas / clientes</option>
            <option value="0">Clientes particulares</option>
            {db.empresas.map((em) => (
              <option key={em.id} value={em.id}>{em.razonSocial}</option>
            ))}
          </select>
        )}
        <select className={`${inputCls} !w-52`} value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
          <option value="">Todas las categorías ({baseEmpresa.length})</option>
          {(Object.keys(TIPO_HW_META) as TipoHw[]).map((t) => (
            <option key={t} value={t}>
              {TIPO_HW_META[t].icon} {TIPO_HW_META[t].label} ({baseEmpresa.filter((x) => x.tipo === t).length})
            </option>
          ))}
        </select>
        {(fEmp || fTipo || q) && (
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => {
              setFEmp('')
              setFTipo('')
              setQ('')
              setParams({}, { replace: true })
            }}
          >
            Limpiar filtros ✕
          </Btn>
        )}
        <span className="ml-auto text-xs font-semibold text-slate-500">Mostrando {list.length} de {baseEmpresa.length} activo(s)</span>
      </div>

      {list.length === 0 ? (
        <Empty>No se encontraron equipos o activos con esos filtros.</Empty>
      ) : (
        <Table head={['', 'Código / Categoría', 'Equipo / Activo', 'Especificaciones Técnicas', 'Área / Empresa', 'Últ. mantención', 'Próxima mantención', '']}>
          {list.map((e) => {
            const s = semaforo(e)
            const meta = TIPO_HW_META[e.tipo] ?? TIPO_HW_META.OTRO
            const emp = db.empresas.find((x) => x.id === e.empresaId)
            const countHist = sc.intervenciones.filter((i) => i.equipoId === e.id).length
            return (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className={td}>
                  <input type="checkbox" checked={sel.includes(e.id)} onChange={(ev) => toggle(e.id, ev.target.checked)} />
                </td>
                <td className={`${td} font-semibold`}>
                  <Link to={`/app/equipos/${e.id}`} className="text-emerald-700 hover:underline">{e.codigo}</Link>
                  <div className="mt-1">
                    <Badge tone={meta.tone}>
                      {meta.icon} {meta.short}
                    </Badge>
                  </div>
                </td>
                <td className={td}>
                  <div className="font-semibold text-slate-900">{e.marca} {e.modelo}</div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 ring-1 ring-slate-200">
                    <span className="text-slate-500">S/N:</span> {e.serie || 'Sin N° de serie'}
                  </div>
                </td>
                <td className={td}>
                  {ES_COMPUTO(e.tipo) ? (
                    <>
                      <div className="text-xs text-slate-800">{e.cpu} · <b>{e.ramGb} GB RAM</b></div>
                      <div className="text-xs text-slate-500">Disipación {e.disipacion.toLowerCase()} · {e.gpu}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-medium text-slate-800">{e.cpu}</div>
                      <div className="text-xs text-slate-500">{e.gpu}</div>
                    </>
                  )}
                </td>
                <td className={td}>
                  <div className="text-sm font-medium">{e.area}</div>
                  {sc.staff && (
                    <div className="text-xs text-slate-500">
                      {emp ? `🏢 ${emp.razonSocial}` : `👤 ${db.usuarios.find((u) => u.id === e.usuarioId)?.nombre ?? 'Particular'} (Persona Natural)`}
                    </div>
                  )}
                </td>
                <td className={td}>{fmtFecha(e.ultimaMantencion)}</td>
                <td className={td}>
                  <Badge tone={s.color === 'slate' ? 'slate' : s.color}>{s.label}</Badge>
                  {e.proximaMantencion && <div className="mt-0.5 text-[11px] text-slate-400">{fmtFecha(e.proximaMantencion)}</div>}
                </td>
                <td className={`${td} text-right`}>
                  <Link to={`/app/equipos/${e.id}`} className="text-xs font-semibold text-pcg-green hover:underline">
                    Hoja de vida ({countHist}) →
                  </Link>
                </td>
              </tr>
            )
          })}
        </Table>
      )}

      {nuevo && (
        <NuevoEquipoModal
          defaultEmpresaId={fEmp && fEmp !== '0' ? Number(fEmp) : undefined}
          defaultTipo={(fTipo as TipoHw) || 'DESKTOP'}
          onClose={() => setNuevo(false)}
          onCreate={(eq) => {
            mutate((d) => {
              const id = nextId(d.equipos)
              const prog = d.programas.find((p) => p.empresaId === eq.empresaId && p.activo)
              const proxima = eq.ultimaMantencion ? addMonths(eq.ultimaMantencion, prog?.periodicidadMeses ?? 6) : undefined
              d.equipos.push({ ...eq, id, proximaMantencion: proxima, usuarioId: eq.usuarioId ?? user!.id })
            })
            setNuevo(false)
          }}
        />
      )}
    </>
  )
}

export function NuevoEquipoModal({
  defaultEmpresaId,
  defaultTipo = 'DESKTOP',
  onClose,
  onCreate,
}: {
  defaultEmpresaId?: number
  defaultTipo?: TipoHw
  onClose: () => void
  onCreate?: (e: Omit<Equipo, 'id' | 'proximaMantencion'>) => void
}) {
  const { db, user, mutate } = useStore()
  const isStaff = user!.rol === 'ADMIN' || user!.rol === 'DOC_PROCESS' || user!.rol === 'WORKER'
  const personasNaturales = db.usuarios.filter((u) => u.rol === 'CLIENTE_PERSONA')
  const [empresaId, setEmpresaId] = useState<string>(
    defaultEmpresaId ? String(defaultEmpresaId) : user!.empresaId ? String(user!.empresaId) : isStaff ? '1' : '',
  )
  const [personaId, setPersonaId] = useState<number>(personasNaturales[0]?.id ?? 6)
  const [tipo, setTipo] = useState<TipoHw>(defaultTipo)
  const [codigo, setCodigo] = useState(`ACT-${String(db.equipos.length + 1).padStart(3, '0')}`)
  const [area, setArea] = useState('Administración')
  const [marca, setMarca] = useState('HP')
  const [modelo, setModelo] = useState('ProDesk 400')
  const [serie, setSerie] = useState(`SN${10500 + db.equipos.length}`)
  const [cpu, setCpu] = useState('Intel Core i5-11400')
  const [ramGb, setRamGb] = useState(16)
  const [disipacion, setDisipacion] = useState<Equipo['disipacion']>('STOCK')
  const [gpu, setGpu] = useState('Integrada')
  const [ultima, setUltima] = useState('')

  const handleTipoChange = (nextTipo: TipoHw) => {
    setTipo(nextTipo)
    if (nextTipo === 'IMPRESORA') {
      setMarca('Brother')
      setModelo('MFC-L8900CDW')
      setCpu('Láser Color Multifuncional')
      setGpu('Red Gigabit / Wi-Fi / Tóner TN-436')
      setRamGb(0)
    } else if (nextTipo === 'CAMARA') {
      setMarca('Hikvision')
      setModelo('Domo IP 4MP PoE / NVR')
      setCpu('Resolución 4MP IR 30m H.265+')
      setGpu('Grabación NVR WD Purple / PoE')
      setRamGb(0)
    } else if (nextTipo === 'SERVIDOR') {
      setMarca('Dell')
      setModelo('PowerEdge T150')
      setCpu('Intel Xeon E-2314')
      setGpu('RAID 1 NVMe 2TB')
      setRamGb(64)
    } else if (nextTipo === 'RED') {
      setMarca('Ubiquiti')
      setModelo('UniFi Switch 24 PoE')
      setCpu('24 Puertos GbE PoE+ / 2 SFP')
      setGpu('VLAN Corporativa')
      setRamGb(0)
    } else if (nextTipo === 'UPS') {
      setMarca('APC')
      setModelo('Smart-UPS 1500VA')
      setCpu('Online 1500VA / 1000W')
      setGpu('Batería sellada AGM')
      setRamGb(0)
    } else {
      setCpu('Intel Core i5-11400')
      setGpu('Integrada')
      setRamGb(16)
    }
  }

  const esPC = ES_COMPUTO(tipo)

  return (
    <Modal open onClose={onClose} title="Registrar nuevo equipo o activo TI" wide>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const empNum = empresaId ? Number(empresaId) : undefined
          const empObj = db.empresas.find((em) => em.id === empNum)
          const ownerUid = isStaff
            ? empObj
              ? empObj.contactoId
              : personaId
            : user!.id
          const payload = {
            empresaId: empNum,
            usuarioId: ownerUid,
            codigo,
            area,
            tipo,
            marca,
            modelo,
            serie,
            cpu,
            ramGb: esPC ? Number(ramGb) : 0,
            disipacion: esPC ? disipacion : 'STOCK',
            gpu,
            ultimaMantencion: ultima || undefined,
            ubicacion: 'EN_PODER_CLIENTE' as const,
          }
          if (onCreate) {
            onCreate(payload)
          } else {
            mutate((d) => {
              const id = nextId(d.equipos)
              const prog = d.programas.find((p) => p.empresaId === payload.empresaId && p.activo)
              const proxima = payload.ultimaMantencion ? addMonths(payload.ultimaMantencion, prog?.periodicidadMeses ?? 6) : undefined
              d.equipos.push({ ...payload, id, proximaMantencion: proxima })
            })
            onClose()
          }
        }}
      >
        {/* Selector rápido visual de categoría */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Categoría de equipo / activo</span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            {(Object.keys(TIPO_HW_META) as TipoHw[]).map((t) => {
              const m = TIPO_HW_META[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTipoChange(t)}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition',
                    tipo === t
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/25'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="truncate">{m.short}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {isStaff && (
            <Field label="Tipo de propietario (Empresa B2B o Persona Natural)">
              <select className={inputCls} value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
                <option value="">👤 Persona Natural / Cliente Particular</option>
                {db.empresas.map((em) => (
                  <option key={em.id} value={em.id}>🏢 {em.razonSocial}</option>
                ))}
              </select>
            </Field>
          )}
          {isStaff && !empresaId && (
            <Field label="Seleccionar Persona Natural (Cartera)">
              <select
                className={inputCls}
                value={personaId}
                onChange={(e) => setPersonaId(Number(e.target.value))}
              >
                {personasNaturales.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.nombre} · {p.email}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Código de activo"><input className={inputCls} value={codigo} onChange={(e) => setCodigo(e.target.value)} required /></Field>
          <Field label="Área o ubicación física"><input className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} required placeholder="Ej: Gerencia, Bodega, Recepción…" /></Field>
          <Field label="Marca"><input className={inputCls} value={marca} onChange={(e) => setMarca(e.target.value)} required /></Field>
          <Field label="Modelo"><input className={inputCls} value={modelo} onChange={(e) => setModelo(e.target.value)} required /></Field>
          <Field label="Número de serie (S/N)" hint="Código del fabricante para búsquedas y garantías">
            <input
              className={inputCls}
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              placeholder="Ej: SN10037, 5CD1234XYZ o Service Tag"
            />
          </Field>

          {esPC ? (
            <>
              <Field label="Procesador (CPU)"><input className={inputCls} value={cpu} onChange={(e) => setCpu(e.target.value)} required /></Field>
              <Field label="Memoria RAM (GB)"><input type="number" className={inputCls} value={ramGb} onChange={(e) => setRamGb(Number(e.target.value))} required /></Field>
              <Field label="Tipo de disipación">
                <select className={inputCls} value={disipacion} onChange={(e) => setDisipacion(e.target.value as Equipo['disipacion'])}>
                  <option value="STOCK">Stock (fábrica)</option>
                  <option value="AIRE">Por aire (torre)</option>
                  <option value="LIQUIDA">Refrigeración líquida</option>
                </select>
              </Field>
              <Field label={tipo === 'SERVIDOR' ? 'Almacenamiento / RAID / GPU' : 'Tarjeta gráfica (GPU)'}>
                <input className={inputCls} value={gpu} onChange={(e) => setGpu(e.target.value)} required />
              </Field>
            </>
          ) : (
            <>
              <Field
                label={
                  tipo === 'IMPRESORA'
                    ? 'Tecnología de impresión (Láser / Tinta / Térmica)'
                    : tipo === 'CAMARA'
                      ? 'Resolución / Tipo de cámara o NVR'
                      : 'Especificación técnica principal'
                }
              >
                <input className={inputCls} value={cpu} onChange={(e) => setCpu(e.target.value)} required />
              </Field>
              <Field
                label={
                  tipo === 'IMPRESORA'
                    ? 'Conexión (Red IP / Wi-Fi) e insumo/tóner'
                    : tipo === 'CAMARA'
                      ? 'Almacenamiento / Canal / PoE'
                      : 'Detalle / Red / Capacidad'
                }
              >
                <input className={inputCls} value={gpu} onChange={(e) => setGpu(e.target.value)} required />
              </Field>
            </>
          )}

          <Field label="Fecha última mantención (opcional)" hint="Si la ingresas, el sistema calcula automáticamente la próxima mantención.">
            <input type="date" className={inputCls} value={ultima} onChange={(e) => setUltima(e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Guardar {TIPO_HW_META[tipo].short}</Btn>
        </div>
      </form>
    </Modal>
  )
}

export function EquipoDetailPage() {
  const { id } = useParams()
  const { db, user, mutate } = useStore()
  const sc = useScope()
  const nav = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const eq = sc.equipos.find((e) => e.id === Number(id))
  if (!eq) return <Empty>Equipo no encontrado o sin acceso.</Empty>

  const meta = TIPO_HW_META[eq.tipo] ?? TIPO_HW_META.OTRO
  const emp = db.empresas.find((e) => e.id === eq.empresaId)
  const hist = sc.intervenciones.filter((i) => i.equipoId === eq.id).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const s = semaforo(eq)

  return (
    <>
      <PageHeader
        title={`${meta.icon} ${eq.codigo} · ${eq.marca} ${eq.modelo}`}
        subtitle={`${meta.label} · ${emp ? emp.razonSocial + ' · ' : ''}${eq.area} · Serie ${eq.serie || 'S/N'}`}
        actions={
          <>
            <Btn variant="secondary" onClick={() => nav(`/app/tickets?nuevo=1&equipos=${eq.id}`)}>
              Solicitar servicio / cotización
            </Btn>
            {sc.staff && (
              <>
                <Btn variant="secondary" onClick={() => setEditOpen(true)}>✏️ Editar activo / S/N</Btn>
                <Btn variant="secondary" onClick={() => setAddOpen(true)}>+ Registrar intervención</Btn>
                <Btn
                  onClick={() => {
                    let infId = 0
                    mutate((d) => {
                      const inf = crearInforme(d, {
                        tipo: 'EQUIPO',
                        equipoId: eq.id,
                        empresaId: eq.empresaId,
                        titulo: `Informe técnico de ${meta.short} ${eq.codigo} (${eq.marca} ${eq.modelo})`,
                        resumen: `Se detallan las especificaciones y las ${hist.length} intervención(es) realizadas al activo ${eq.codigo}. Garantía técnica vigente por ${d.config.condGarantiaDias} días.`,
                        visibleCliente: true,
                        generadoPor: user!.id,
                      })
                      infId = inf.id
                    })
                    nav(`/app/informes/${infId}`)
                  }}
                >
                  Generar informe del equipo
                </Btn>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title={ES_COMPUTO(eq.tipo) ? 'Procesador y memoria' : 'Especificación principal'}>
          <div className="text-sm font-medium">{eq.cpu}</div>
          <div className="mt-1 text-xs text-slate-500">
            {ES_COMPUTO(eq.tipo) ? `${eq.ramGb} GB RAM · ${meta.label}` : meta.label}
          </div>
        </Card>
        <Card title={ES_COMPUTO(eq.tipo) ? 'Disipación y gráficos / discos' : 'Conectividad y detalle'}>
          <div className="text-sm font-medium">
            {ES_COMPUTO(eq.tipo) ? `Disipación ${eq.disipacion}` : eq.gpu}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {ES_COMPUTO(eq.tipo) ? `GPU / Disco: ${eq.gpu}` : `Ubicación: ${eq.area}`}
          </div>
        </Card>
        <Card title="Última mantención">
          <div className="text-sm font-medium">{fmtFecha(eq.ultimaMantencion)}</div>
          <div className="mt-1 text-xs text-slate-500">{hist.length} intervención(es) registradas</div>
        </Card>
        <Card title="Próxima mantención">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{fmtFecha(eq.proximaMantencion)}</span>
            <Badge tone={s.color === 'slate' ? 'slate' : s.color}>{s.label}</Badge>
          </div>
          {sc.staff && (
            <input
              type="date"
              className="mt-2 rounded border border-slate-200 px-2 py-0.5 text-xs"
              value={eq.proximaMantencion ?? ''}
              onChange={(e) => mutate((d) => { d.equipos.find((x) => x.id === eq.id)!.proximaMantencion = e.target.value || undefined })}
            />
          )}
        </Card>
      </div>

      <Card className="mt-6" title="Hoja de vida histórica del activo (Bitácora de intervenciones)">
        {hist.length === 0 ? (
          <Empty>Este equipo aún no registra intervenciones técnicas.</Empty>
        ) : (
          <ol className="space-y-4 border-l-2 border-emerald-500/40 pl-5">
            {hist.map((i) => {
              const tec = db.usuarios.find((u) => u.id === i.tecnicoId)
              const delta = i.tempAntes !== undefined && i.tempDespues !== undefined ? i.tempAntes - i.tempDespues : undefined
              return (
                <li key={i.id} className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="absolute -left-[27px] top-5 h-3 w-3 rounded-full bg-pcg-green ring-4 ring-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="green">{i.tipo}</Badge>
                    <h3 className="font-semibold text-slate-900">{i.titulo}</h3>
                    <span className="ml-auto text-xs text-slate-500">{fmtFecha(i.fecha)} · Ing./Téc. {tec?.nombre ?? 'PCG'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{i.detalle}</p>
                  {delta !== undefined && (
                    <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900">
                      <span>Temp. CPU antes: <b>{i.tempAntes} °C</b></span>
                      <span>→</span>
                      <span>Con mantención PCG: <b>{i.tempDespues} °C</b></span>
                      <Badge tone="green">-{delta} °C de reducción térmica</Badge>
                    </div>
                  )}
                  {i.checklist.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {i.checklist.map((c) => (
                        <li key={c} className="rounded bg-white px-2 py-0.5 text-xs text-slate-600 shadow-xs">✓ {c}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <span>Insumos: {i.insumos || '—'}</span>
                    <span>Garantía técnica: {i.garantiaDias} días</span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Card>

      {addOpen && (
        <QuickIntervModal
          equipoId={eq.id}
          onClose={() => setAddOpen(false)}
          onSave={(data) => {
            mutate((d) => registrarIntervencion(d, data))
            setAddOpen(false)
          }}
        />
      )}

      {editOpen && (
        <EditarEquipoModal
          equipo={eq}
          onClose={() => setEditOpen(false)}
          onSave={(patch) => {
            mutate((d) => {
              const target = d.equipos.find((x) => x.id === eq.id)
              if (target) Object.assign(target, patch)
            })
            setEditOpen(false)
          }}
        />
      )}
    </>
  )
}

function QuickIntervModal({
  equipoId,
  onClose,
  onSave,
}: {
  equipoId: number
  onClose: () => void
  onSave: (d: Omit<Intervencion, 'id' | 'fecha'>) => void
}) {
  const { user, db } = useStore()
  const [tipo, setTipo] = useState<Intervencion['tipo']>('PREVENTIVO')
  const [titulo, setTitulo] = useState('Mantención preventiva de hardware')
  const [detalle, setDetalle] = useState('Desarme completo, limpieza ultrasónica/aire, lubricación de ventiladores y cambio de pasta térmica premium.')
  const [antes, setAntes] = useState('84')
  const [despues, setDespues] = useState('47')
  const [insumos, setInsumos] = useState('Pasta térmica premium certificada')
  const [check, setCheck] = useState<string[]>(CHECKLIST_MANT.slice(0, 5))

  return (
    <Modal open onClose={onClose} title="Registrar intervención en hoja de vida" wide>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            equipoId,
            tecnicoId: user!.id,
            tipo,
            titulo,
            detalle,
            tempAntes: antes ? Number(antes) : undefined,
            tempDespues: despues ? Number(despues) : undefined,
            checklist: check,
            insumos,
            garantiaDias: db.config.condGarantiaDias,
            visibleCliente: true,
          })
        }}
      >
        <Field label="Tipo de intervención">
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as Intervencion['tipo'])}>
            {['PREVENTIVO', 'CORRECTIVO', 'UPGRADE', 'SOFTWARE', 'REPARACION_ELECTRONICA'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Título"><input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></Field>
        <div className="sm:col-span-2"><Field label="Detalle técnico realizado"><textarea className={inputCls} rows={3} value={detalle} onChange={(e) => setDetalle(e.target.value)} required /></Field></div>
        <Field label="Temperatura CPU antes (°C, opcional)"><input type="number" className={inputCls} value={antes} onChange={(e) => setAntes(e.target.value)} /></Field>
        <Field label="Temperatura CPU después (°C, opcional)"><input type="number" className={inputCls} value={despues} onChange={(e) => setDespues(e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Insumos utilizados"><input className={inputCls} value={insumos} onChange={(e) => setInsumos(e.target.value)} /></Field></div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">Checklist ejecutado</span>
          <div className="grid gap-1 sm:grid-cols-2">
            {CHECKLIST_MANT.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={check.includes(c)} onChange={(e) => setCheck(e.target.checked ? [...check, c] : check.filter((x) => x !== c))} />
                {c}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Guardar intervención</Btn>
        </div>
      </form>
    </Modal>
  )
}

function EditarEquipoModal({
  equipo,
  onClose,
  onSave,
}: {
  equipo: Equipo
  onClose: () => void
  onSave: (patch: Partial<Equipo>) => void
}) {
  const [marca, setMarca] = useState(equipo.marca)
  const [modelo, setModelo] = useState(equipo.modelo)
  const [serie, setSerie] = useState(equipo.serie)
  const [area, setArea] = useState(equipo.area)
  const [cpu, setCpu] = useState(equipo.cpu)
  const [ramGb, setRamGb] = useState(equipo.ramGb)
  const [gpu, setGpu] = useState(equipo.gpu)
  const [disipacion, setDisipacion] = useState(equipo.disipacion)
  const esPC = ES_COMPUTO(equipo.tipo)

  return (
    <Modal open title={`Editar Activo TI: ${equipo.codigo}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ marca, modelo, serie: serie.trim(), area, cpu, ramGb, gpu, disipacion })
        }}
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950">
          <span className="font-bold">Identificación oficial:</span> Actualiza el número de serie de fábrica (S/N) para trazabilidad en soporte, garantías y búsqueda de órdenes de trabajo.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Número de serie (S/N)" hint="Fabricante / Service Tag / Serial Number">
            <input
              className={inputCls}
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              placeholder="Ej: SN10037, 5CD1234XYZ o Service Tag"
              required
            />
          </Field>
          <Field label="Área / Ubicación"><input className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} required /></Field>
          <Field label="Marca"><input className={inputCls} value={marca} onChange={(e) => setMarca(e.target.value)} required /></Field>
          <Field label="Modelo"><input className={inputCls} value={modelo} onChange={(e) => setModelo(e.target.value)} required /></Field>

          {esPC ? (
            <>
              <Field label="Procesador (CPU)"><input className={inputCls} value={cpu} onChange={(e) => setCpu(e.target.value)} required /></Field>
              <Field label="Memoria RAM (GB)"><input type="number" className={inputCls} value={ramGb} onChange={(e) => setRamGb(Number(e.target.value))} required /></Field>
              <Field label="Disipación">
                <select className={inputCls} value={disipacion} onChange={(e) => setDisipacion(e.target.value as Equipo['disipacion'])}>
                  <option value="STOCK">Stock (fábrica)</option>
                  <option value="AIRE">Por aire (torre)</option>
                  <option value="LIQUIDA">Refrigeración líquida</option>
                </select>
              </Field>
              <Field label="GPU / Almacenamiento"><input className={inputCls} value={gpu} onChange={(e) => setGpu(e.target.value)} required /></Field>
            </>
          ) : (
            <>
              <Field label="Especificación CPU / Sensor / Motor"><input className={inputCls} value={cpu} onChange={(e) => setCpu(e.target.value)} required /></Field>
              <Field label="Detalle / Conectividad / Discos"><input className={inputCls} value={gpu} onChange={(e) => setGpu(e.target.value)} required /></Field>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Guardar cambios</Btn>
        </div>
      </form>
    </Modal>
  )
}
