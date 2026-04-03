import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import client from '../../api/client'
import Sidebar from '../Sidebar.jsx'
import AdminNavbar from '../AdminNavbar.jsx'

export default function AdminLayout() {
  const [settings, setSettings] = useState({ company_name: null, logo_url: null })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await client.get('/api/settings')
        if (!cancelled && data.success && data.data) {
          setSettings(data.data)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const name = settings.company_name || 'My Company'

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        <div className="col-12 col-md-3 col-lg-2 d-none d-md-block">
          <Sidebar companyName={name} />
        </div>
        <div className="col-12 col-md-9 col-lg-10">
          <AdminNavbar companyName={name} logoUrl={settings.logo_url} />
          <main className="app-main p-3 p-md-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
