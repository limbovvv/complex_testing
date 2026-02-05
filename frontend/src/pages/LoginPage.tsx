import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setToken } from '../api/client'
import '../styles/login.css'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(true)
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [phone, setPhone] = useState('')
  const [faculty, setFaculty] = useState('Факультет связи и автоматизированное управление войсками')
  const [login, setLogin] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit() {
    setError('')
    setLoading(true)
    try {
      const path = isRegister ? '/auth/register' : '/auth/login'
      const payload = isRegister
        ? {
            last_name: lastName,
            first_name: firstName,
            middle_name: middleName || null,
            phone,
            faculty
          }
        : (phone ? { phone } : { login, password })
      const data = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      setToken(data.access_token)
      const me = await apiFetch('/auth/me')
      if (me?.is_admin) {
        navigate('/admin')
        return
      }
      if (isRegister) {
        try {
          await apiFetch('/exam/start', { method: 'POST' })
        } catch (_) {
          // Ignore: if attempt already exists, user will still open /exam.
        }
      }
      navigate('/exam')
    } catch (e: any) {
      let message = e.message || 'Ошибка'
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
        <h1>Вступительный экзамен</h1>
        <p className="lead">Чтобы начать тестирование, пройдите регистрацию или войдите в аккаунт.</p>
        <p className="mode">{isRegister ? 'Регистрация' : 'Вход'}</p>
        {isRegister && (
          <>
            <input placeholder="Фамилия" value={lastName} onChange={e => setLastName(e.target.value)} />
            <input placeholder="Имя" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input placeholder="Отчество (если есть)" value={middleName} onChange={e => setMiddleName(e.target.value)} />
            <input placeholder="Номер телефона" value={phone} onChange={e => setPhone(e.target.value)} />
            <select value={faculty} onChange={e => setFaculty(e.target.value)}>
              <option value="Факультет связи и автоматизированное управление войсками">
                Факультет связи и автоматизированное управление войсками
              </option>
            </select>
          </>
        )}
        {!isRegister && (
          <>
            <input placeholder="Номер телефона (для пользователя)" value={phone} onChange={e => setPhone(e.target.value)} />
            <div className="admin-hint">Для администратора: логин <b>admin</b>, пароль <b>admin</b></div>
            <input placeholder="Логин администратора" value={login} onChange={e => setLogin(e.target.value)} />
            <input placeholder="Пароль администратора" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </>
        )}
        {error && <div className="error">{error}</div>}
        <button onClick={submit} disabled={loading}>{loading ? 'Подождите...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}</button>
        <button className="link" onClick={() => setIsRegister(v => !v)} disabled={loading}>
          {isRegister ? 'Уже есть аккаунт' : 'Создать аккаунт'}
        </button>
      </div>
    </div>
  )
}
