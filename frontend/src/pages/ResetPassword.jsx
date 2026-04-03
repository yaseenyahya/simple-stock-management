import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { data } = await client.post('/api/auth/reset-password', {
        token,
        password,
        password_confirm: confirm,
      })
      setMessage(data.message || 'Password updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="auth-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          <h1 className="h5 mb-3 auth-brand fw-bold">Set new password</h1>
          {!token ? <div className="alert alert-warning">Missing token. Open the link from your email.</div> : null}
          {error ? <div className="alert alert-danger py-2">{error}</div> : null}
          {message ? <div className="alert alert-success py-2">{message}</div> : null}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">New password</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm new password</label>
              <input type="password" className="form-control" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading || !token}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : 'Update password'}
            </button>
          </form>
          <div className="text-center mt-3">
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
