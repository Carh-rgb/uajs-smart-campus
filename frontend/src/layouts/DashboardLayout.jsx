import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import RouteLoader from '../components/RouteLoader.jsx'
import BackendStatusBanner from '../components/BackendStatusBanner.jsx'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="main-panel">
        <BackendStatusBanner />
        <Topbar onToggleMobileMenu={() => setMobileOpen((v) => !v)} />
        <div className="main-panel__content">
          <RouteLoader />
          <Outlet />
        </div>
      </div>
    </div>
  )
}
