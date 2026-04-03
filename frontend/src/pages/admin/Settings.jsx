import { useEffect, useState } from 'react'
import client from '../../api/client'

export default function Settings() {
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [cur, setCur] = useState('')
  const [np, setNp] = useState('')
  const [npc, setNpc] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await client.get('/api/settings')
        if (!cancelled && data.success && data.data) {
          setCompanyName(data.data.company_name || '')
          setLogoUrl(data.data.logo_url || '')
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const saveCompany = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await client.put('/api/settings', {
        company_name: companyName.trim(),
        logo_url: logoUrl.trim() || null,
      })
      setMessage('Settings saved')
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwErr('')
    setPwMsg('')
    setPwLoading(true)
    try {
      await client.post('/api/auth/change-password', {
        current_password: cur,
        new_password: np,
        new_password_confirm: npc,
      })
      setPwMsg('Password updated')
      setCur('')
      setNp('')
      setNpc('')
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Could not update password')
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status" />
      </div>
    )
  }

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-6">
        <div className="stat-card h-100">
          <div className="card-body p-4">
            <h1 className="h5 mb-2 text-light">Company</h1>
            <p className="text-muted small">Company name is required. Logo URL is optional (image URL).</p>
            {error ? <div className="alert alert-danger py-2">{error}</div> : null}
            {message ? <div className="alert alert-success py-2">{message}</div> : null}
            <form onSubmit={saveCompany}>
              <div className="mb-3">
                <label className="form-label">Company name</label>
                <input className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Logo URL (optional)</label>
                <input type="url" className="form-control" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm" /> : 'Save'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-12 col-lg-6">
        <div className="stat-card h-100">
          <div className="card-body p-4">
            <h1 className="h5 mb-3 text-light">Change password (admin)</h1>
            {pwErr ? <div className="alert alert-danger py-2">{pwErr}</div> : null}
            {pwMsg ? <div className="alert alert-success py-2">{pwMsg}</div> : null}
            <form onSubmit={changePassword}>
              <div className="mb-2">
                <label className="form-label">Current password</label>
                <input type="password" className="form-control" value={cur} onChange={(e) => setCur(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="mb-2">
                <label className="form-label">New password</label>
                <input type="password" className="form-control" value={np} onChange={(e) => setNp(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm new password</label>
                <input type="password" className="form-control" value={npc} onChange={(e) => setNpc(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <button type="submit" className="btn btn-outline-primary" disabled={pwLoading}>
                {pwLoading ? <span className="spinner-border spinner-border-sm" /> : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
