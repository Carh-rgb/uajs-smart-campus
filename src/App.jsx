import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { PermissionsProvider } from './context/PermissionsContext.jsx'
import { SolicitudesProvider } from './context/SolicitudesContext.jsx'
import { ReservasProvider } from './context/ReservasContext.jsx'
import { EventosProvider } from './context/EventosContext.jsx'
import { PqrsProvider } from './context/PqrsContext.jsx'
import { UsersProvider } from './context/UsersContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ModuleRoute from './components/ModuleRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Perfil from './pages/Perfil.jsx'
import Solicitudes from './pages/Solicitudes.jsx'
import SolicitudDetalle from './pages/SolicitudDetalle.jsx'
import Reservas from './pages/Reservas.jsx'
import Recursos from './pages/Recursos.jsx'
import Eventos from './pages/Eventos.jsx'
import Notificaciones from './pages/Notificaciones.jsx'
import Pqrs from './pages/Pqrs.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Reportes from './pages/Reportes.jsx'

import './styles/access.css'
import './styles/layout.css'
import './styles/content.css'
import './styles/loading.css'

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <PermissionsProvider>
          <UsersProvider>
            <SolicitudesProvider>
              <ReservasProvider>
                <EventosProvider>
                  <PqrsProvider>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      <Route
                        path="/app"
                        element={
                          <ProtectedRoute>
                            <DashboardLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Dashboard />} />
                        <Route path="perfil" element={<Perfil />} />
                        <Route
                          path="solicitudes"
                          element={
                            <ModuleRoute moduleId="solicitudes">
                              <Solicitudes />
                            </ModuleRoute>
                          }
                        />
                        <Route path="solicitudes/:id" element={<SolicitudDetalle />} />
                        <Route
                          path="reservas"
                          element={
                            <ModuleRoute moduleId="reservas">
                              <Reservas />
                            </ModuleRoute>
                          }
                        />
                        <Route
                          path="recursos"
                          element={
                            <ModuleRoute moduleId="recursos">
                              <Recursos />
                            </ModuleRoute>
                          }
                        />
                        <Route
                          path="eventos"
                          element={
                            <ModuleRoute moduleId="eventos">
                              <Eventos />
                            </ModuleRoute>
                          }
                        />
                        <Route path="notificaciones" element={<Notificaciones />} />
                        <Route
                          path="pqrs"
                          element={
                            <ModuleRoute moduleId="pqrs">
                              <Pqrs />
                            </ModuleRoute>
                          }
                        />
                        <Route
                          path="reportes"
                          element={
                            <ModuleRoute moduleId="reportes">
                              <Reportes />
                            </ModuleRoute>
                          }
                        />
                        <Route path="usuarios" element={<Usuarios />} />
                      </Route>

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </PqrsProvider>
                </EventosProvider>
              </ReservasProvider>
            </SolicitudesProvider>
          </UsersProvider>
        </PermissionsProvider>
      </NotificationsProvider>
    </AuthProvider>
  )
}
