import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setToken } from '../api/client'
import '../styles/login.css'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit() {
    setError('')
    try {
      const path = isRegister ? '/auth/register' : '/auth/login'
      const data = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      setToken(data.access_token)
      navigate('/exam')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Вступительный экзамен</h1>
        <p className="lead">Чтобы начать тестирование, пройдите регистрацию или войдите в аккаунт.</p>
        <p className="mode">{isRegister ? 'Регистрация' : 'Вход'}</p>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button onClick={submit}>{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
        <button className="link" onClick={() => setIsRegister(v => !v)}>
          {isRegister ? 'Уже есть аккаунт' : 'Создать аккаунт'}
        </button>
      </div>
    </div>
  )
}
