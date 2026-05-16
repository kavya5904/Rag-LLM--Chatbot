import { useState, useEffect, useCallback } from 'react'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import * as api from './lib/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setChecking(false)
      return
    }
    try {
      const me = await api.getMe()
      setUser(me)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage onAuth={loadUser} />
  }

  return <Home user={user} onLogout={handleLogout} />
}
