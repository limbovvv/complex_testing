import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { apiFetch } from '../api/client'
import '../styles/exam.css'

type ExamState = {
  attempt_id: number
  status: string
  started_at: string
  ends_at: string
  math_questions: any[]
  ru_questions: any[]
  prog_tasks: any[]
  answers: Record<string, number | null>
  drafts: Record<string, { language: string, code: string }>
}

export default function ExamPage() {
  const [state, setState] = useState<ExamState | null>(null)
  const [block, setBlock] = useState<'prog' | 'math' | 'ru'>('prog')
  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')
  const [autosave, setAutosave] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const saveTimers = useRef<Record<string, any>>({})

  async function loadState() {
    try {
      const data = await apiFetch('/exam/state')
      setState(data)
    } catch (e: any) {
      setState(null)
    }
  }

  useEffect(() => {
    loadState()
  }, [])

  useEffect(() => {
    if (!state) return
    const interval = setInterval(() => {
      const now = Date.now()
      const end = new Date(state.ends_at).getTime()
      const diff = Math.max(0, end - now)
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
      if (diff === 0 && state.status === 'in_progress') {
        setError('Время вышло. Результаты формируются...')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [state])

  async function startExam() {
    const data = await apiFetch('/exam/start', { method: 'POST' })
    setState(data)
  }

  function scheduleSave(key: string, fn: () => Promise<void>) {
    setAutosave('Сохранение...')
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await fn()
        setAutosave('Сохранено')
      } catch (e: any) {
        setAutosave('Ошибка сохранения')
      }
    }, 1200)
  }

  function saveAnswer(questionId: number, selectedIndex: number | null) {
    if (!state) return
    setState({
      ...state,
      answers: { ...state.answers, [questionId]: selectedIndex }
    })
    scheduleSave(`q_${questionId}`, async () => {
      await apiFetch(`/exam/answer/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify({ selected_index: selectedIndex })
      })
    })
  }

  function saveDraft(taskId: number, language: string, code: string) {
    if (!state) return
    setState({
      ...state,
      drafts: { ...state.drafts, [taskId]: { language, code } }
    })
    scheduleSave(`t_${taskId}`, async () => {
      await apiFetch(`/exam/draft/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ language, code })
      })
    })
  }

  async function submitExam() {
    await apiFetch('/exam/submit', { method: 'POST' })
    navigate('/result')
  }

  if (!state) {
    return (
      <div className="exam-empty">
        <h2>Экзамен</h2>
        <p>У вас нет попытки. Нажмите «Начать экзамен».</p>
        <button onClick={startExam}>Начать экзамен</button>
      </div>
    )
  }

  if (state.status !== 'in_progress') {
    return (
      <div className="exam-empty">
        <h2>Экзамен завершен</h2>
        <button onClick={() => navigate('/result')}>Перейти к результатам</button>
      </div>
    )
  }

  const items = block === 'prog' ? state.prog_tasks : block === 'math' ? state.math_questions : state.ru_questions
  const current = items[index]

  const answerCountFor = (ids: number[]) => ids.filter(id => state.answers[id] !== undefined).length
  const progAnswered = Object.keys(state.drafts).length
  const mathAnswered = answerCountFor(state.math_questions.map(q => q.id))
  const ruAnswered = answerCountFor(state.ru_questions.map(q => q.id))

  return (
    <div className="exam-layout">
      <div className="topbar">
        <div className="timer">Осталось: {timeLeft}</div>
        <div className="autosave">{autosave}</div>
        <button className="submit" onClick={submitExam}>Сдать</button>
      </div>

      <div className="content">
        <aside className="sidebar">
          <div className={`block ${block === 'prog' ? 'active' : ''}`} onClick={() => { setBlock('prog'); setIndex(0) }}>
            Информатика
            <span>{progAnswered}/5</span>
          </div>
          <div className={`block ${block === 'math' ? 'active' : ''}`} onClick={() => { setBlock('math'); setIndex(0) }}>
            Математика
            <span>{mathAnswered}/5</span>
          </div>
          <div className={`block ${block === 'ru' ? 'active' : ''}`} onClick={() => { setBlock('ru'); setIndex(0) }}>
            Русский
            <span>{ruAnswered}/5</span>
          </div>
          <div className="numbers">
            {items.map((it: any, i: number) => {
              const done = block === 'prog'
                ? !!state.drafts[it.id]?.code
                : state.answers[it.id] !== undefined
              return (
                <button key={it.id} className={done ? 'done' : ''} onClick={() => setIndex(i)}>{i + 1}</button>
              )
            })}
          </div>
          <div className="progress">Отвечено: {block === 'prog' ? progAnswered : block === 'math' ? mathAnswered : ruAnswered}/5</div>
        </aside>

        <main className="main">
          <div className="question">
            <h3>{block === 'prog' ? current.title : `Вопрос ${index + 1}`}</h3>
            <p>{block === 'prog' ? current.statement : current.question}</p>
          </div>

          {block === 'prog' ? (
            <div className="prog-panel">
              <label>Язык</label>
              <select
                value={state.drafts[current.id]?.language || 'python'}
                onChange={e => saveDraft(current.id, e.target.value, state.drafts[current.id]?.code || '')}
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="node">JavaScript</option>
              </select>
              <Editor
                height="320px"
                language={state.drafts[current.id]?.language === 'cpp' ? 'cpp' : state.drafts[current.id]?.language === 'node' ? 'javascript' : 'python'}
                value={state.drafts[current.id]?.code || ''}
                onChange={(v) => saveDraft(current.id, state.drafts[current.id]?.language || 'python', v || '')}
              />
            </div>
          ) : (
            <div className="options">
              {current.options.map((opt: string, idx: number) => (
                <label key={idx}>
                  <input
                    type="radio"
                    checked={state.answers[current.id] === idx}
                    onChange={() => saveAnswer(current.id, idx)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          <div className="nav">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>Назад</button>
            <button disabled={index === items.length - 1} onClick={() => setIndex(index + 1)}>Далее</button>
          </div>
          {error && <div className="error">{error}</div>}
        </main>
      </div>
    </div>
  )
}
