import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setResetLink('')
    setLoading(true)
    try {
      const { data } = await client.post('/api/auth/forgot-password', { email })
      setMessage(data.message || 'Check your instructions.')
      if (data.reset_link) {
        setResetLink(data.reset_link)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="auth-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          <h1 className="h5 mb-2 auth-brand fw-bold">Forgot password</h1>
          <p className="text-muted small">Enter your email. If an account exists, you can reset your password using the link (shown in development).</p>
          {error ? <div className="alert alert-danger py-2">{error}</div> : null}
          {message ? <div className="alert alert-success py-2">{message}</div> : null}
          {resetLink ? (
            <div className="mb-3">
              <label className="form-label small">Reset link (dev)</label>
              <input className="form-control form-control-sm" readOnly value={resetLink} onFocus={(e) => e.target.select()} />
            </div>
          ) : null}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : 'Send reset'}
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
