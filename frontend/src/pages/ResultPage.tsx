import { useEffect, useState } from 'react'
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
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const r = await apiFetch('/exam/result')
        const s = await apiFetch('/exam/state')
        setResult(r)
        setState(s)
      } catch (e: any) {
        setError('Результаты еще не готовы')
      }
    }
    load()
  }, [])

  if (error) return <div className="result-page">{error}</div>
  if (!result || !state) return <div className="result-page">Загрузка...</div>

  return (
    <div className="result-page">
      <h2>Результаты</h2>
      <div className="summary">
        <div>Общий балл: {result.score_total}</div>
        <div>Информатика: {result.score_blocks.prog || 0}</div>
        <div>Математика: {result.score_blocks.math || 0}</div>
        <div>Русский: {result.score_blocks.ru || 0}</div>
      </div>

      <div className="section">
        <h3>Информатика</h3>
        {state.prog_tasks.map((t: any) => (
          <div key={t.id} className={result.per_task[t.id] ? 'ok' : 'wa'}>
            {t.title}: {result.per_task[t.id] ? 'верно' : 'неверно'}
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Математика</h3>
        {state.math_questions.map((q: any, i: number) => (
          <div key={q.id} className={result.per_question[q.id] ? 'ok' : 'wa'}>
            Вопрос {i + 1}: {result.per_question[q.id] ? 'верно' : 'неверно'}
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Русский</h3>
        {state.ru_questions.map((q: any, i: number) => (
          <div key={q.id} className={result.per_question[q.id] ? 'ok' : 'wa'}>
            Вопрос {i + 1}: {result.per_question[q.id] ? 'верно' : 'неверно'}
          </div>
        ))}
      </div>
    </div>
  )
}
