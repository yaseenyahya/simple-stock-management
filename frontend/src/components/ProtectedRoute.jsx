import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ role, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  const allowedRoles =
    Array.isArray(roles) && roles.length > 0 ? roles : role ? [role] : null

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 auth-page">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.role === 'stock_manager') {
      return <Navigate to="/stock-manager" replace />
    }
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
