import { useEffect, useState } from 'react'
import client from '../../api/client'
import { formatAmount, formatInt } from '../../utils/formatNumber.js'

const empty = {
  item_name: '',
  stock_machan: 0,
  stock_shop: 0,
  price_from: '',
  price_to: '',
}

export default function Items() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/api/items')
      setItems(data.success ? data.data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(empty)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      item_name: row.item_name,
      stock_machan: row.stock_machan,
      stock_shop: row.stock_shop,
      price_from: row.price_from,
      price_to: row.price_to,
    })
    setError('')
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    const payload = {
      item_name: form.item_name.trim(),
      stock_machan: Number(form.stock_machan) || 0,
      stock_shop: Number(form.stock_shop) || 0,
      price_from: Number(form.price_from),
      price_to: Number(form.price_to),
    }
    try {
      if (editingId) {
        await client.put(`/api/items/${editingId}`, payload)
        setSuccess('Item updated')
      } else {
        await client.post('/api/items', payload)
        setSuccess('Item created')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-0 text-light">Stock / Items</h1>
          <p className="text-secondary small mb-0 d-none d-sm-block">Add, edit, and track inventory</p>
        </div>
        <button type="button" className="btn btn-primary px-3" onClick={openCreate}>
          Add item
        </button>
      </div>
      {success ? (
        <div className="alert alert-success py-2" role="alert">
          {success}
        </div>
      ) : null}

      <div className="stat-card overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-end">Machan</th>
                  <th className="text-end">Shop</th>
                  <th className="text-end">Price from</th>
                  <th className="text-end">Price to</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-info" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No items yet.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <small className="text-muted">#{row.id}</small>
                        <br />
                        {row.item_name}
                      </td>
                      <td className="text-end">{formatInt(row.stock_machan)}</td>
                      <td className="text-end">{formatInt(row.stock_shop)}</td>
                      <td className="text-end">{formatAmount(row.price_from)}</td>
                      <td className="text-end">{formatAmount(row.price_to)}</td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-outline-info" onClick={() => openEdit(row)}>
                          Edit
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

      {modalOpen ? (
        <div className="modal fade show d-block modal-backdrop-custom" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-secondary bg-dark bg-opacity-50">
                <h2 className="modal-title h5 text-light mb-0">{editingId ? 'Edit item' : 'Add item'}</h2>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setModalOpen(false)} />
              </div>
              <form onSubmit={save}>
                <div className="modal-body">
                  {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                  <div className="mb-3">
                    <label className="form-label">Item name (comma-separated names allowed)</label>
                    <input className="form-control" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required />
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label">Stock machan</label>
                      <input type="number" min={0} className="form-control" value={form.stock_machan} onChange={(e) => setForm({ ...form, stock_machan: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Stock shop</label>
                      <input type="number" min={0} className="form-control" value={form.stock_shop} onChange={(e) => setForm({ ...form, stock_shop: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Price from (PKR)</label>
                      <input type="number" min={0} step="0.01" className="form-control" value={form.price_from} onChange={(e) => setForm({ ...form, price_from: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Price to (PKR)</label>
                      <input type="number" min={0} step="0.01" className="form-control" value={form.price_to} onChange={(e) => setForm({ ...form, price_to: e.target.value })} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" /> Save
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
