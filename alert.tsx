'use client'

import { useEffect, useState, useCallback } from 'react'
import Storefront from '@/components/storefront/Storefront'
import AdminPanel from '@/components/admin/AdminPanel'
import AdminLogin from '@/components/admin/AdminLogin'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getToken, clearSession, saveSession } from '@/lib/session'

export default function Home() {
  const [view, setView] = useState<'store' | 'admin'>('store')
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [verifyingAdmin, setVerifyingAdmin] = useState(false)

  const checkSession = useCallback(async () => {
    try {
      // First check if we have a token in sessionStorage
      const token = getToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/auth/session', { headers })
      const data = await res.json()
      setIsAdmin(!!data.authenticated)
    } catch {
      setIsAdmin(false)
    } finally {
      setAuthChecked(true)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const openAdmin = async () => {
    // Re-verify the session before entering admin (defense in depth)
    setVerifyingAdmin(true)
    try {
      const token = getToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/auth/session', { headers })
      const data = await res.json()
      if (data.authenticated) {
        setIsAdmin(true)
        setView('admin')
      } else {
        setIsAdmin(false)
        setShowLogin(true)
      }
    } catch {
      setShowLogin(true)
    } finally {
      setVerifyingAdmin(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsAdmin(true)
    setShowLogin(false)
    setView('admin')
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearSession()
    setIsAdmin(false)
    setView('store')
  }

  // While in admin view, continuously verify session is still valid.
  useEffect(() => {
    if (view !== 'admin') return
    const interval = setInterval(async () => {
      try {
        const token = getToken()
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch('/api/auth/session', { headers })
        const data = await res.json()
        if (!data.authenticated) {
          clearSession()
          setIsAdmin(false)
          setView('store')
          setShowLogin(true)
        }
      } catch {
        // network error — don't kick out on transient failures
      }
    }, 60000) // check every 60s
    return () => clearInterval(interval)
  }, [view])

  return (
    <div className="min-h-screen flex flex-col bg-background grain-overlay">
      {view === 'store' && <Storefront onOpenAdmin={openAdmin} verifyingAdmin={verifyingAdmin} />}
      {view === 'admin' && authChecked && isAdmin && (
        <AdminPanel onBackToStore={() => setView('store')} onLogout={handleLogout} />
      )}
      {view === 'admin' && (!authChecked || !isAdmin) && (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-foreground/50 text-sm">Verificando acesso...</div>
        </div>
      )}

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Login administrativo</DialogTitle>
          <AdminLogin onSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
