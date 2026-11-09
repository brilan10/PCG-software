import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from '@/pages/Landing'
import AuthPage from '@/pages/AuthPage'
import EstadoPublico from '@/pages/EstadoPublico'
import AppLayout from '@/components/AppLayout'
import AccessGuard from '@/components/AccessGuard'
import Dashboard from '@/pages/app/Dashboard'
import OTPage from '@/pages/app/Planner'
import { EquiposPage, EquipoDetailPage } from '@/pages/app/Equipos'
import { TicketsPage, TicketDetailPage } from '@/pages/app/Tickets'
import { CotizacionesPage, CotizacionDetailPage } from '@/pages/app/Cotizaciones'
import AlertasPage from '@/pages/app/Alertas'
import { InformesPage, InformeDetailPage } from '@/pages/app/Informes'
import FinanzasPage from '@/pages/app/Finanzas'
import InventarioPage from '@/pages/app/Inventario'
import ProyectosPage from '@/pages/app/Proyectos'
import TeamCards from '@/components/TeamCards'
import {
  EmpresasPage,
  PersonalPage,
  CatalogoPage,
  CorreosPage,
  MisTareasPage,
} from '@/pages/app/AdminPages'

export default function App() {
  return (
    <Routes>
      {/* Portal Público */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/registro" element={<AuthPage mode="registro" />} />
      <Route path="/estado" element={<EstadoPublico />} />
      <Route path="/tickets/nuevo" element={<Navigate to="/app/tickets?nuevo=1" replace />} />

      {/* Portal Privado con Control de Accesos por Rol (RBAC) */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />

        {/* Proyectos Web & Branding (Diseñadores, Desarrolladores y Admins) */}
        <Route
          path="proyectos"
          element={
            <AccessGuard modulo="PROYECTOS">
              <ProyectosPage />
            </AccessGuard>
          }
        />

        {/* Finanzas (Estrictamente ADMIN y Jefa de Finanzas DOC_PROCESS) */}
        <Route
          path="finanzas"
          element={
            <AccessGuard modulo="FINANZAS">
              <FinanzasPage />
            </AccessGuard>
          }
        />

        {/* Inventario de herramientas y repuestos (Técnicos y Admins) */}
        <Route
          path="inventario"
          element={
            <AccessGuard modulo="INVENTARIO">
              <InventarioPage />
            </AccessGuard>
          }
        />

        {/* Planner de Órdenes de Trabajo */}
        <Route
          path="ot"
          element={
            <AccessGuard modulo="OT">
              <OTPage />
            </AccessGuard>
          }
        />

        {/* Equipos de Hardware (Técnicos, Admins y Clientes) */}
        <Route
          path="equipos"
          element={
            <AccessGuard modulo="EQUIPOS">
              <EquiposPage />
            </AccessGuard>
          }
        />
        <Route
          path="equipos/:id"
          element={
            <AccessGuard modulo="EQUIPOS">
              <EquipoDetailPage />
            </AccessGuard>
          }
        />

        {/* Tickets (Técnicos, Admins y Clientes) */}
        <Route
          path="tickets"
          element={
            <AccessGuard modulo="TICKETS">
              <TicketsPage />
            </AccessGuard>
          }
        />
        <Route
          path="tickets/:id"
          element={
            <AccessGuard modulo="TICKETS">
              <TicketDetailPage />
            </AccessGuard>
          }
        />

        {/* Cotizaciones (Admins y Finanzas) */}
        <Route
          path="cotizaciones"
          element={
            <AccessGuard modulo="COTIZACIONES">
              <CotizacionesPage />
            </AccessGuard>
          }
        />
        <Route
          path="cotizaciones/:id"
          element={
            <AccessGuard modulo="COTIZACIONES">
              <CotizacionDetailPage />
            </AccessGuard>
          }
        />

        {/* Alertas preventivas (Técnicos y Admins) */}
        <Route
          path="alertas"
          element={
            <AccessGuard modulo="ALERTAS">
              <AlertasPage />
            </AccessGuard>
          }
        />

        {/* Informes Técnicos (Técnicos, Admins y Clientes) */}
        <Route
          path="informes"
          element={
            <AccessGuard modulo="INFORMES">
              <InformesPage />
            </AccessGuard>
          }
        />
        <Route
          path="informes/:id"
          element={
            <AccessGuard modulo="INFORMES">
              <InformeDetailPage />
            </AccessGuard>
          }
        />

        {/* Cartera de Empresas B2B (Admins y Finanzas) */}
        <Route
          path="empresas"
          element={
            <AccessGuard modulo="EMPRESAS">
              <EmpresasPage />
            </AccessGuard>
          }
        />

        {/* Gestión de Personal (Exclusivo ADMIN - CEO) */}
        <Route
          path="personal"
          element={
            <AccessGuard modulo="PERSONAL">
              <PersonalPage />
            </AccessGuard>
          }
        />

        {/* Catálogo de Precios y Tarifas (Admins y Finanzas) */}
        <Route
          path="catalogo"
          element={
            <AccessGuard modulo="CATALOGO">
              <CatalogoPage />
            </AccessGuard>
          }
        />

        {/* Historial de Correos (Admins y Finanzas) */}
        <Route
          path="correos"
          element={
            <AccessGuard modulo="CORREOS">
              <CorreosPage />
            </AccessGuard>
          }
        />

        {/* Mis Tareas asignadas */}
        <Route
          path="tareas"
          element={
            <AccessGuard modulo="TAREAS">
              <MisTareasPage />
            </AccessGuard>
          }
        />

        {/* Tarjetas de Equipo PCG */}
        <Route
          path="equipo"
          element={
            <AccessGuard modulo="EQUIPO">
              <div className="overflow-hidden rounded-3xl shadow-xl">
                <TeamCards />
              </div>
            </AccessGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
