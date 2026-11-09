# Guía de Testing Integral - Sistema PCG SPA (15 Paneles + Mejoras)

Guía completa de testing para el sistema PCG SPA, disponible tanto en local (`http://localhost:5173/`) como en el servidor de producción de WebHost Chile.

---

## 1. Credenciales Rápidas para Pruebas

Todas las contraseñas por defecto son: `pcg123`. Se puede ingresar indistintamente con Correo o con RUT.

| Perfil / Cargo | Nombre | Correo | RUT | Rol RBAC | Paneles con Acceso |
|---|---|---|---|---|---|
| **CEO / Administrador** | Brilan | `brilan@pcg.cl` | `18.234.567-8` | `ADMIN` | **Todos los 15 paneles** |
| **Jefa Sucursal & Finanzas** | Yovylin | `yovylin@pcg.cl` | `19.876.543-2` | `DOC_PROCESS` | Finanzas, Facturación, Cotizaciones, Cartera B2B, OTs, Informes |
| **Técnico Hardware & Taller** | Johan | `johan@pcg.cl` | `17.654.321-0` | `WORKER` (Técnico) | Planner OTs, Equipos, Bitácora, Inventario Taller, Alertas |
| **Diseñador & Creativo Web** | Javier | `javier@pcg.cl` | `16.543.210-9` | `WORKER` (Diseñador) | Proyectos y Portafolio Web, Tareas Creativas, Branding |
| **Cliente Empresa B2B** | Carolina | `carolina@constructoraandes.cl` | `76.842.150-K` | `CLIENTE_EMPRESA` | Sus propios equipos, OTs, Facturas, Informes Aprobados |
| **Cliente Particular** | Pedro | `pedro@correo.cl` | `15.321.987-4` | `CLIENTE_PERSONA` | Sus equipos, boletas, estado de reparación |

---

## 2. Mejoras Nuevas Implementadas

### A) Solicitar Retiro / Domicilio con Captura de Dirección
- **Ruta:** Landing Page (`/`) -> Modal "Agendar Hora" ó Panel `/app/ot` -> "📅 Agendar Hora de Mantención".
- **Comportamiento:**
  1. Al presionar el botón `[ 🚗 Solicitar Retiro / Domicilio ]`, se despliega de inmediato la sección:
     - **Dirección completa:** Calle, Número, Depto / Oficina / Villa *(Obligatorio)*.
     - **Comuna / Ciudad:** Ej. Providencia, Santiago, Las Condes *(Obligatorio)*.
     - **Referencia de retiro:** Portón, citófono, conserjería *(Opcional)*.
  2. Si el usuario intenta enviar sin ingresar dirección, el sistema bloquea y solicita los datos.
  3. Al confirmar, la dirección se almacena en la Orden de Trabajo (`ot.direccionRetiro`), en el Ticket y en el perfil del cliente.
  4. En el **Planner de OTs** (`/app/ot`), la tarjeta muestra el distintivo:
     `🕒 Hora agendada: 10:30 hrs · 🚗 Domicilio` y la dirección `📍 Av. Providencia 1234, Depto 502`.

### B) Solo Venta del Sistema (Sin Mensualidad / Pago Único)
- **Ruta:** `/app/proyectos` -> "+ Nuevo Proyecto Web / Software".
- **Comportamiento:**
  1. En la sección **Modalidad de Venta y Mantención**, cuenta con:
     - Botón selector rápido: `[ 📦 Solo Venta (Sin mensualidad) ]`.
     - Opción en el desplegable de **Periodicidad**: `📦 Solo venta del sistema (Sin mensualidad)`.
  2. Al seleccionarla:
     - Se desmarca la mantención recurrente.
     - Monto de mantención pasa a `$0`.
     - No obliga a ingresar fecha de próxima mantención periódica.
     - Muestra el aviso informativo: *Cobro único por desarrollo, entrega o licencia. No genera facturación recurrente mensual.*
  3. En la lista y tarjetas de proyectos, se muestra la etiqueta distintiva `📦 Solo venta (Sin mensualidad)` en tono índigo/azul.
  4. Los KPIs superiores contabilizan cuántos proyectos son de **Solo Venta** vs cuántos tienen **Mantenciones Activas Recurrentes**, manteniendo la precisión financiera.

---

## 3. Pruebas por cada uno de los 15 Paneles

1. **Dashboard General (`/app`):** KPIs ejecutivos, accesos directos y gráficos en vivo.
2. **Proyectos y Portafolio (`/app/proyectos`):** Software a medida, webs, e-commerce, logos y opción de Solo Venta vs Mantención.
3. **Finanzas y Facturas (`/app/finanzas`):** Libro de Caja, Ingresos, Gastos, Facturación SII y exportación a Excel.
4. **Inventario y Licencias (`/app/inventario`):** Repuestos de hardware, stock crítico y claves de software.
5. **Órdenes de Trabajo (`/app/ot`):** Tablero Kanban, asignación a Johan/Brilan, checklist de tareas y dirección de retiro visible.
6. **Tickets de Soporte (`/app/tickets`):** Mensajería cliente-taller y conversión directa a OT.
7. **Cotizaciones (`/app/cotizaciones`):** Presupuestos PDF con membrete oficial y conversión a OT al aceptar.
8. **Cartera / Empresas B2B (`/app/empresas`):** Base de datos de clientes corporativos, RUT, comodatos y facturación acumulada.
9. **Parque de Equipos (`/app/equipos`):** Búsqueda por número de serie (S/N) y bitácora técnica de intervenciones.
10. **Alertas Preventivas (`/app/alertas`):** Ciclo preventivo cada 6 meses con botón para notificar por email al cliente.
11. **Informes Técnicos (`/app/informes`):** Ficha técnica con diagnóstico, fotos antes/después y vista imprimible/PDF.
12. **Personal & Roles (`/app/personal`):** Administración de colaboradores, habilitaciones técnicas/creativas y contraseñas.
13. **Catálogo y Precios (`/app/catalogo`):** Tarifas de mano de obra para público general vs clientes con convenio.
14. **Auditoría Correos (`/app/correos`):** Trazabilidad completa de correos automáticos emitidos.
15. **Nuestro Equipo PCG (`/app/equipo`):** Tarjetas interactivas con las especialidades de Brilan, Yovylin, Johan y Javier.
