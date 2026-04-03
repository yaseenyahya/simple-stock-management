import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext.jsx'
import { formatAmount, formatInt } from '../utils/formatNumber.js'

const DEBOUNCE_MS = 400

function formatPriceFromTo(row) {
  const from = Number(row.price_from)
  const to = Number(row.price_to)
  const pf = Number.isFinite(from) ? from : Number(row.average_price)
  const pt = Number.isFinite(to) ? to : Number(row.average_price)
  return `${formatAmount(pf)} - ${formatAmount(pt)}`
}

export default function StockManagerDashboard() {
  const { logout, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({ company_name: 'Company' })
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [modalRows, setModalRows] = useState([])
  const [modalTotalValue, setModalTotalValue] = useState(0)
  const [modalLoading, setModalLoading] = useState(false)
  const [stockBreakdownId, setStockBreakdownId] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await client.get('/api/settings')
        if (!cancelled && data.success && data.data?.company_name) {
          setSettings({ company_name: data.data.company_name })
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const fetchInventory = useCallback(async (q) => {
    setLoading(true)
    try {
      const { data } = await client.get('/api/inventory', { params: { query: q } })
      if (data.success) {
        setRows(data.data || [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  useEffect(() => {
    fetchInventory(debounced)
  }, [debounced, fetchInventory])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const openInventoryModal = useCallback(async () => {
    setInventoryModalOpen(true)
    setModalLoading(true)
    try {
      const { data } = await client.get('/api/inventory')
      if (data.success) {
        setModalRows(data.data || [])
        setModalTotalValue(data.total_inventory_value ?? 0)
      } else {
        setModalRows([])
        setModalTotalValue(0)
      }
    } catch {
      setModalRows([])
      setModalTotalValue(0)
    } finally {
      setModalLoading(false)
    }
  }, [])

  const closeInventoryModal = () => {
    setInventoryModalOpen(false)
  }

  const modalTotalQuantity = modalRows.reduce((sum, r) => sum + (Number(r.remaining_stock) || 0), 0)

  useEffect(() => {
    if (!inventoryModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [inventoryModalOpen])

  return (
    <div className="min-vh-100 app-main">
      <nav className="navbar navbar-expand navbar-dark app-navbar shadow-sm mb-3">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h5 text-light">{settings.company_name}</span>
          <div className="ms-auto d-flex align-items-center gap-2 flex-wrap justify-content-end">
            {isAdmin ? (
              <Link to="/admin/dashboard" className="btn btn-outline-light btn-sm border-secondary">
                Admin panel
              </Link>
            ) : null}
            <span className="text-secondary small d-none d-sm-inline">{user?.name}</span>
            <button type="button" className="btn btn-outline-light btn-sm border-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-3 pb-4">
        <div className="mb-4">
        
            <button type="button" className="btn btn-info btn-lg px-4 fw-semibold" onClick={openInventoryModal}>
              View full inventory
            </button>
        
        </div>

        <div className="mb-3">
          <label className="form-label visually-hidden">Search items</label>
          <input
            type="search"
            className="form-control form-control-lg border-secondary"
            placeholder="Search by item name (comma parts)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="stat-card overflow-hidden">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-end">
                      Machan + shop
                      <span className="d-block fw-normal text-muted small stock-th-hint">Click for Machan / Shop</span>
                    </th>
                    <th className="text-end">Price from – to (PKR)</th>
                    <th>Last sold</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        <span className="spinner-border text-info" />
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No items match.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <small className="text-muted">#{r.id}</small>
                          <br />
                          {r.item_name}
                        </td>
                        <td className="text-end align-top">
                          <button
                            type="button"
                            className="btn btn-link text-info text-decoration-none p-0 fw-semibold stock-on-hand-toggle"
                            aria-expanded={stockBreakdownId === r.id}
                            aria-label={`On hand ${formatInt(r.total_stock)}, show Machan and Shop remaining`}
                            onClick={() => setStockBreakdownId((id) => (id === r.id ? null : r.id))}
                          >
                            {formatInt(r.total_stock)}
                          </button>
                          {stockBreakdownId === r.id ? (
                            <div className="stock-location-split small text-secondary mt-2 text-start text-md-end" role="note">
                              <div>
                                <span className="text-muted">Machan remaining:</span> {formatInt(r.stock_machan)}
                              </div>
                              <div>
                                <span className="text-muted">Shop remaining:</span> {formatInt(r.stock_shop)}
                              </div>
                            </div>
                          ) : null}
                        </td>
                        <td className="text-end text-nowrap">{formatPriceFromTo(r)}</td>
                        <td className="small">
                          {r.last_sold ? (
                            <>
                              {r.last_sold.customer_name}
                              <br />
                              Qty {formatInt(r.last_sold.quantity)} @ {formatAmount(r.last_sold.price)} — {r.last_sold.date}
                              <br />
                              <span className="text-muted">
                                Shop {formatInt(r.last_sold.qty_from_shop ?? 0)} · Machan{' '}
                                {formatInt(r.last_sold.qty_from_machan ?? 0)}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {inventoryModalOpen ? (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            aria-hidden={false}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
          >
            <div className="modal-dialog modal-fullscreen modal-inventory-fullscreen">
              <div className="modal-content">
                <div className="modal-header flex-wrap gap-2 py-3">
                  <h2 id="inventory-modal-title" className="modal-title h5 mb-0">
                    Complete inventory{' '}
                    <span className="text-muted-theme d-block d-sm-inline fw-normal">· quantities and values (PKR)</span>
                  </h2>
                  <button type="button" className="btn-close btn-close-white" onClick={closeInventoryModal} aria-label="Close" />
                </div>
                <div className="modal-body overflow-auto pt-2 px-3 pb-4">
                  <div className="row g-3 mb-4">
                    <div className="col-6 col-lg-4">
                      <div className="inventory-stat-tile p-3 h-100">
                        <div className="inventory-stat-label mb-2">Total quantity (units)</div>
                        <div className="inventory-stat-value fs-4">{modalLoading ? '—' : formatInt(modalTotalQuantity)}</div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-4">
                      <div className="inventory-stat-tile p-3 h-100">
                        <div className="inventory-stat-label mb-2">Total value (PKR)</div>
                        <div className="inventory-stat-value fs-4">{modalLoading ? '—' : formatAmount(modalTotalValue)}</div>
                      </div>
                    </div>
                  </div>

                  {modalLoading ? (
                    <div className="text-center py-5">
                      <span className="spinner-border text-info" role="status" />
                    </div>
                  ) : (
                    <div className="stat-card overflow-hidden">
                      <div className="table-responsive">
                        <table className="table table-hover table-striped mb-0 align-middle">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th className="text-end">Machan</th>
                              <th className="text-end">Shop</th>
                              <th className="text-end">Remaining qty</th>
                              <th className="text-end">Price from – to (PKR)</th>
                              <th className="text-end">Value (PKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalRows.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center text-muted py-4">
                                  No items in inventory.
                                </td>
                              </tr>
                            ) : (
                              modalRows.map((r) => (
                                <tr key={r.id}>
                                  <td>
                                    <small className="text-muted">#{r.id}</small>
                                    <br />
                                    {r.item_name}
                                  </td>
                                  <td className="text-end">{formatInt(r.stock_machan)}</td>
                                  <td className="text-end">{formatInt(r.stock_shop)}</td>
                                  <td className="text-end fw-semibold">{formatInt(r.remaining_stock)}</td>
                                  <td className="text-end text-nowrap">{formatPriceFromTo(r)}</td>
                                  <td className="text-end fw-semibold">{formatAmount(r.value)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show modal-backdrop-custom" aria-hidden="true" onClick={closeInventoryModal} />
        </>
      ) : null}
    </div>
  )
}
