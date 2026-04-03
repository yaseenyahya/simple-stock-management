import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import { formatInt } from '../../utils/formatNumber.js'

export default function AdminDashboard() {
  const [items, setItems] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [i, s] = await Promise.all([client.get('/api/items'), client.get('/api/sales')])
        if (!cancelled) {
          setItems(i.data.success ? i.data.data : [])
          setSales(s.data.success ? s.data.data : [])
        }
      } catch {
        if (!cancelled) {
          setItems([])
          setSales([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="h4 mb-1 text-light">Dashboard</h1>
      <p className="text-secondary small mb-4">Overview of your catalog and sales</p>
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="stat-card h-100">
            <div className="card-body p-4">
              <h2 className="h6 text-secondary text-uppercase small fw-semibold mb-2">Items</h2>
              <p className="display-6 mb-2">{formatInt(items.length)}</p>
              <Link to="/admin/items" className="small fw-medium">
                Manage stock →
              </Link>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="stat-card h-100">
            <div className="card-body p-4">
              <h2 className="h6 text-secondary text-uppercase small fw-semibold mb-2">Sales recorded</h2>
              <p className="display-6 mb-2">{formatInt(sales.length)}</p>
              <Link to="/admin/sales" className="small fw-medium">
                New sale →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
