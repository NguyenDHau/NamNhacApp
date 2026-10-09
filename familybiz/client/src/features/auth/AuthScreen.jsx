
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setBusy(true)

    try {
      const normalizedEmail = email.trim()

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password
        })
        if (error) throw error

        if (data.session) {
          setMessage('Đăng ký thành công!')
        } else {
          setMessage(
            'Đăng ký thành công. Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.'
          )
          setMode('login')
        }
      }
    } catch (error) {
      console.error('Lỗi xác thực:', error)
      setErrorMessage(error?.message || 'Không thể xác thực. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    marginTop: 6,
    border: '1px solid #cbd5e1',
    borderRadius: 8
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 20,
      background: '#f4f7fb',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: 28,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        boxSizing: 'border-box'
      }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>FamilyBiz</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          {mode === 'login'
            ? 'Đăng nhập để quản lý và đồng bộ dữ liệu.'
            : 'Tạo tài khoản FamilyBiz của bạn.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 14 }}>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 18 }}>
            Mật khẩu
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              style={inputStyle}
            />
          </label>

          {errorMessage && (
            <p role="alert" style={{ color: '#dc2626', fontSize: 14 }}>
              {errorMessage}
            </p>
          )}

          {message && (
            <p role="status" style={{ color: '#047857', fontSize: 14 }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              padding: 13,
              border: 0,
              borderRadius: 8,
              background: '#0f766e',
              color: '#fff',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer'
            }}
          >
            {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginBottom: 0, fontSize: 14 }}>
          {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button
            type="button"
            onClick={() => {
              setMode(current => current === 'login' ? 'signup' : 'login')
              setMessage('')
              setErrorMessage('')
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: '#0f766e',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  )
}