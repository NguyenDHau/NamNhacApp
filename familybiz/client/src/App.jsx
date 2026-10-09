import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient.js'
import AuthScreen from './features/auth/AuthScreen.jsx'
import FamilyBizApp from './features/FamilyBizApp.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (mounted) setSession(data?.session ?? null)
      } catch (error) {
        console.error('Không kiểm tra được phiên đăng nhập:', error)
        if (mounted) setSession(null)
      } finally {
        if (mounted) setCheckingSession(false)
      }
    }

    checkSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (checkingSession) {
    return <div className="loading">Đang kiểm tra đăng nhập…</div>
  }

  return session
    ? <FamilyBizApp key={session.user.id} />
    : <AuthScreen />
}