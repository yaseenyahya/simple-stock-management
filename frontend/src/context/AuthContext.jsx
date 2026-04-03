import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'sms_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await client.get('/api/auth/me')
      if (data.success && data.user) {
        setUser(data.user)
      } else {
        logout()
      }
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password })
    if (!data.success || !data.token) {
      throw new Error(data.message || 'Login failed')
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      loadMe,
      isAdmin: user?.role === 'admin',
      isStockManager: user?.role === 'stock_manager',
    }),
    [user, loading, login, logout, loadMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
