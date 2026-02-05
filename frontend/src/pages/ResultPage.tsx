import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'
import '../styles/result.css'

type Result = {
  attempt_id: number
  status: string
  score_total: number
  score_blocks: Record<string, number>
  per_question: Record<string, boolean>
  per_task: Record<string, boolean>
}

export default function ResultPage() {
  const [result, setResult] = useState<Result | null>(null)
  const [state, setState] = useState<any>(null)
  const [loadingText, setLoadingText] = useState('Идет проверка решений...')
  const timerRef = useRef<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function loadOnce() {
      try {
        const r = await apiFetch('/exam/result')
        const s = await apiFetch('/exam/state')
        if (!active) return
        setResult(r)
        setState(s)
        setLoadingText('')
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      } catch (_e) {
        if (active) setLoadingText('Идет проверка решений... Обновляем автоматически.')
      }
    }

    loadOnce()
    timerRef.current = window.setInterval(loadOnce, 2000)

    return () => {
      active = false
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  function acknowledge() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (!result || !state) return <div className="result-page"><div className="wait-box">{loadingText}</div></div>

  return (
    <div className="result-page">
      <h2>Результаты экзамена</h2>
      <div className="summary">
        <div className="score-card total">Общий балл: {result.score_total}</div>
        <div className="score-card">Информатика: {result.score_blocks.prog || 0}</div>
        <div className="score-card">Математика: {result.score_blocks.math || 0}</div>
        <div className="score-card">Русский: {result.score_blocks.ru || 0}</div>
      </div>

      <div className="section">
        <h3>Информатика</h3>
        {state.prog_tasks.map((t: any, i: number) => (
          <div key={t.id} className={`row ${result.per_task[t.id] ? 'ok' : 'wa'}`}>
            <span>Задача {i + 1}: {t.title}</span>
            <b>{result.per_task[t.id] ? 'Верно' : 'Неверно'}</b>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Математика</h3>
        {state.math_questions.map((q: any, i: number) => (
          <div key={q.id} className={`row ${result.per_question[q.id] ? 'ok' : 'wa'}`}>
            <span>Вопрос {i + 1}</span>
            <b>{result.per_question[q.id] ? 'Верно' : 'Неверно'}</b>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Русский язык</h3>
        {state.ru_questions.map((q: any, i: number) => (
          <div key={q.id} className={`row ${result.per_question[q.id] ? 'ok' : 'wa'}`}>
            <span>Вопрос {i + 1}</span>
            <b>{result.per_question[q.id] ? 'Верно' : 'Неверно'}</b>
          </div>
        ))}
      </div>

      <button className="done-btn" onClick={acknowledge}>Я ознакомился с результатами</button>
    </div>
  )
}
