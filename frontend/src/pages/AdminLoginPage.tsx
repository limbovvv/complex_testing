import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setIsAdmin, setToken } from '../api/client'
import '../styles/login.css'

export default function AdminLoginPage() {
  const [login, setLogin] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit() {
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password })
      })
      setToken(data.access_token)
      const me = await apiFetch('/auth/me')
      if (!me?.is_admin) {
        setIsAdmin(false)
        setError('Недостаточно прав администратора')
        return
      }
      setIsAdmin(true)
      navigate('/admin-panel')
    } catch (e: any) {
      let message = e.message || 'Ошибка входа'
      try {
        const parsed = JSON.parse(message)
        message = parsed.detail || message
      } catch (_) {
        // Keep raw message
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Админ-панель</h1>
        <p className="lead">Войдите под учетной записью администратора из базы данных.</p>
        <p className="mode">Вход администратора</p>
        <form onSubmit={(e) => { e.preventDefault(); submit() }}>
          <input placeholder="Логин администратора" value={login} onChange={e => setLogin(e.target.value)} />

          <div className="password-wrap">
            <input
              placeholder="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              👁
            </button>
          </div>

          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Подождите...' : 'Войти в админку'}</button>
        </form>
      </div>
    </div>
  )
}
