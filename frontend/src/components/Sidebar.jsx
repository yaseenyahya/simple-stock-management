import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`

export default function Sidebar({ companyName }) {
  return (
    <div className="sidebar p-3 d-flex flex-column">
      <div className="mb-4">
        <h5 className="text-white mb-1 fw-semibold">{companyName || 'Company'}</h5>
        <span className="sidebar-badge">Admin panel</span>
      </div>
      <nav className="nav flex-column gap-1">
        <NavLink to="/admin/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/items" className={linkClass}>
          Stock / Items
        </NavLink>
        <NavLink to="/admin/sales" className={linkClass}>
          Sales
        </NavLink>
        <NavLink to="/admin/settings" className={linkClass}>
          Company settings
        </NavLink>
        <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
          <NavLink to="/stock-manager" className={linkClass}>
            Stock manager view
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
