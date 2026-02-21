import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setIsAdmin, setToken } from '../api/client'
import '../styles/login.css'

export default function LoginPage() {
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [phone, setPhone] = useState('')
  const [faculty, setFaculty] = useState('Факультет связи и автоматизированное управление войсками')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function isValidPhone(value: string) {
    const normalized = value.replace(/[^\d+]/g, '')
    return /^\+?\d{10,15}$/.test(normalized)
  }

  async function submit() {
    setError('')
    if (!isValidPhone(phone)) {
      setError('Неправильный номер телефона')
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          last_name: lastName,
          first_name: firstName,
          middle_name: middleName || null,
          phone,
          faculty,
        })
      })
      setToken(data.access_token)
      setIsAdmin(false)
      try {
        await apiFetch('/exam/start', { method: 'POST' })
      } catch (_) {
        // If attempt already exists, just open the exam.
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
        <h1>Комплексное тестирование</h1>
        <p className="lead">Введите данные и начните тестирование.</p>
        <p className="mode">Регистрация участника</p>
        <input placeholder="Фамилия" value={lastName} onChange={e => setLastName(e.target.value)} />
        <input placeholder="Имя" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input placeholder="Отчество (если есть)" value={middleName} onChange={e => setMiddleName(e.target.value)} />
        <input placeholder="Номер телефона" value={phone} onChange={e => setPhone(e.target.value)} />
        <select value={faculty} onChange={e => setFaculty(e.target.value)}>
          <option value="Факультет связи и автоматизированное управление войсками">
            Факультет связи и автоматизированное управление войсками
          </option>
        </select>
        {error && <div className="error">{error}</div>}
        <button onClick={submit} disabled={loading}>{loading ? 'Подождите...' : 'Начать тестирование'}</button>
      </div>
    </div>
  )
}
