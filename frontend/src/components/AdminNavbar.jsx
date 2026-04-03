import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminNavbar({ companyName, logoUrl }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark app-navbar shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="" height="32" className="rounded border border-secondary" />
            ) : null}
            <span className="navbar-brand mb-0 h5 text-light">{companyName || 'Company'}</span>
          </div>
          <div className="ms-auto d-flex align-items-center gap-2 gap-sm-3 flex-wrap justify-content-end">
            <Link
              to="/stock-manager"
              className="btn btn-info btn-sm fw-semibold"
              title="Open stock manager inventory view (same login)"
            >
              Stock manager
            </Link>
            <span className="text-secondary small d-none d-sm-inline">{user?.name}</span>
            <button type="button" className="btn btn-outline-light btn-sm border-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="d-md-none app-nav-mobile px-2 py-2">
        <div className="d-flex flex-wrap gap-1 small">
          <Link className="btn btn-sm btn-outline-info" to="/admin/dashboard">
            Dashboard
          </Link>
          <Link className="btn btn-sm btn-outline-info" to="/admin/items">
            Items
          </Link>
          <Link className="btn btn-sm btn-outline-info" to="/admin/sales">
            Sales
          </Link>
          <Link className="btn btn-sm btn-outline-info" to="/admin/settings">
            Settings
          </Link>
          <Link className="btn btn-sm btn-info fw-semibold" to="/stock-manager">
            Stock manager
          </Link>
        </div>
      </div>
    </>
  )
}
