import { useEffect, useState } from 'react'
import client from '../../api/client'
import { formatAmount, formatInt } from '../../utils/formatNumber.js'
import ItemAutocomplete from '../../components/ItemAutocomplete.jsx'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [quantityMachan, setQuantityMachan] = useState('')
  const [quantityShop, setQuantityShop] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedItem, setSelectedItem] = useState(null)
  const [itemInvalid, setItemInvalid] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/api/sales')
      setSales(data.success ? data.data : [])
    } catch {
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onSelectItem = (item) => {
    setSelectedItem(item)
    setItemInvalid(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedItem?.id) {
      setItemInvalid(true)
      return
    }
    const qm = Number(quantityMachan) || 0
    const qs = Number(quantityShop) || 0
    if (qm < 0 || qs < 0) {
      setError('Quantities cannot be negative')
      return
    }
    if (qm + qs < 50) {
      setError('Total quantity must be at least 50')
      return
    }
    setSubmitting(true)
    try {
      await client.post('/api/sales', {
        customer_name: customerName.trim(),
        item_id: selectedItem.id,
        quantity_machan: qm,
        quantity_shop: qs,
        price: Number(price),
        date,
      })
      setSuccess('Sale recorded')
      setCustomerName('')
      setQuantityMachan('')
      setQuantityShop('')
      setPrice('')
      setSelectedItem(null)
      setDate(new Date().toISOString().slice(0, 10))
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save sale')
    } finally {
      setSubmitting(false)
    }
  }

  const removeSale = async (saleId) => {
    if (!window.confirm('Delete this sale? Quantity will be added back to stock (shop / machan per the original sale, or all to shop for older records).')) {
      return
    }
    setError('')
    setDeletingId(saleId)
    try {
      await client.delete(`/api/sales/${saleId}`)
      setSuccess('Sale deleted')
      await load()
    } catch (err) {
      setSuccess('')
      setError(err.response?.data?.message || 'Could not delete sale')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="h4 mb-1 text-light">Sales</h1>
      <p className="text-secondary small mb-4">
        Record a sale — item must be chosen from search. Enter how many units come from the machan and from the shop. Total sold must be at least 50.
      </p>

      <div className="stat-card mb-4">
        <div className="card-body p-4">
          <h2 className="h6 mb-3 text-info">New sale</h2>
          {error ? <div className="alert alert-danger py-2">{error}</div> : null}
          {success ? <div className="alert alert-success py-2">{success}</div> : null}
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Customer name</label>
                <input className="form-control" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Item</label>
                <ItemAutocomplete value={selectedItem} onSelect={onSelectItem} invalid={itemInvalid} />
                {itemInvalid ? <div className="invalid-feedback d-block">Select an item from the list</div> : null}
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label">Quantity machan</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={quantityMachan}
                  onChange={(e) => setQuantityMachan(e.target.value)}
                  aria-label="Quantity from machan"
                />
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label">Quantity shop</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={quantityShop}
                  onChange={(e) => setQuantityShop(e.target.value)}
                  aria-label="Quantity from shop"
                />
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label">Price (PKR)</label>
                <input type="number" min={0} step="0.01" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" /> Saving...
                    </>
                  ) : (
                    'Save sale'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="stat-card overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Shop</th>
                  <th className="text-end">Machan</th>
                  <th className="text-end">Price</th>
                  <th className="text-end" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No sales yet.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id}>
                      <td>{s.date}</td>
                      <td>{s.customer_name}</td>
                      <td>{s.item_name}</td>
                      <td className="text-end">{formatInt(s.quantity)}</td>
                      <td className="text-end">{formatInt(s.qty_from_shop ?? 0)}</td>
                      <td className="text-end">{formatInt(s.qty_from_machan ?? 0)}</td>
                      <td className="text-end">{formatAmount(s.price)}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={deletingId !== null}
                          onClick={() => removeSale(s.id)}
                        >
                          {deletingId === s.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            'Delete'
                          )}
                        </button>
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
  )
}
