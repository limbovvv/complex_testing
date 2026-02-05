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
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit() {
    setError('')
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
        : { phone }
      const data = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(payload)
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
          <input placeholder="Номер телефона" value={phone} onChange={e => setPhone(e.target.value)} />
        )}
        {error && <div className="error">{error}</div>}
        <button onClick={submit}>{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
        <button className="link" onClick={() => setIsRegister(v => !v)}>
          {isRegister ? 'Уже есть аккаунт' : 'Создать аккаунт'}
        </button>
      </div>
    </div>
  )
}
