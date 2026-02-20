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
  answers: Record<string, string | null>
  drafts: Record<string, { language: string, code: string }>
}

export default function ExamPage() {
  const [state, setState] = useState<ExamState | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [block, setBlock] = useState<'prog' | 'math' | 'ru'>('prog')
  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')
  const [autosave, setAutosave] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const saveTimers = useRef<Record<string, any>>({})

  const requireAuth = (message = 'Требуется вход') => {
    setError(message)
    navigate('/login')
  }

  async function loadState() {
    try {
      const data = await apiFetch('/exam/state')
      setState(data)
    } catch (e: any) {
      setState(null)
      requireAuth()
    }
  }

  useEffect(() => {
    loadState()
    apiFetch('/auth/me')
      .then(setProfile)
      .catch(() => requireAuth())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (state && state.status !== 'in_progress') {
      navigate('/result')
    }
  }, [state, navigate])

  async function startExam() {
    try {
      const data = await apiFetch('/exam/start', { method: 'POST' })
      setState(data)
    } catch (_e) {
      requireAuth()
    }
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

  function saveAnswer(questionId: number, answerText: string) {
    if (!state) return
    setState({
      ...state,
      answers: { ...state.answers, [questionId]: answerText }
    })
    scheduleSave(`q_${questionId}`, async () => {
      await apiFetch(`/exam/answer/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify({ answer_text: answerText })
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
    const fio = [profile?.last_name, profile?.first_name, profile?.middle_name].filter(Boolean).join(' ')
    return (
      <div className="prestart-page">
        <div className="prestart-header">
          <div className="fio">{fio || 'Комплексное тестирование'}</div>
        </div>
        <div className="prestart-card">
          <h2>Перед началом экзамена</h2>
          <p>Сначала ознакомьтесь с инструкцией по всем блокам.</p>
          {!showInstructions && (
            <button className="primary-btn" onClick={() => setShowInstructions(true)}>
              Полная инструкция по каждому блоку
            </button>
          )}
          {showInstructions && (
            <div className="instructions">
              <div className="inst-header">Перед началом экзамена ознакомьтесь с правилами.</div>
              <div className="inst-grid">
                <div className="inst-card">
                  <div className="inst-title">Информатика · 5 задач</div>
                  <p>Пишите решения на Python / C++ / JavaScript. Проверка проходит после сдачи по всем тестам.</p>
                </div>
                <div className="inst-card">
                  <div className="inst-title">Математика · 5 вопросов</div>
                  <p>В каждом вопросе введите короткий ответ в поле. Без пробелов, регистр не важен.</p>
                </div>
                <div className="inst-card">
                  <div className="inst-title">Русский язык · 5 вопросов</div>
                  <p>В каждом вопросе введите короткий ответ в поле. Без пробелов, регистр не важен.</p>
                </div>
              </div>
              <div className="inst-footer">
                <div className="time-note">Время: 60 минут. После сдачи редактирование запрещено.</div>
                <button className="primary-btn" onClick={startExam}>Начать тестирование</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (state.status !== 'in_progress') return null

  const items = block === 'prog' ? state.prog_tasks : block === 'math' ? state.math_questions : state.ru_questions
  const current = items[index]

  const answerCountFor = (ids: number[]) => ids.filter(id => (state.answers[id] || '').trim().length > 0).length
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
        <main className="main">
          <div className="task-switcher">
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
          </div>

          <div className="numbers top-numbers">
            {items.map((it: any, i: number) => {
              const done = block === 'prog'
                ? !!state.drafts[it.id]?.code
                : (state.answers[it.id] || '').trim().length > 0
              return (
                <button key={it.id} className={done ? 'done' : ''} onClick={() => setIndex(i)}>{i + 1}</button>
              )
            })}
            <div className="progress">Отвечено: {block === 'prog' ? progAnswered : block === 'math' ? mathAnswered : ruAnswered}/5</div>
          </div>

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
              <label className="field-label">Ваш ответ</label>
              <input
                type="text"
                className="short-answer-input"
                placeholder="Введите ответ без пробелов"
                value={state.answers[current.id] || ''}
                onChange={(e) => saveAnswer(current.id, e.target.value)}
              />
              <div className="hint-box">Проверка в конце экзамена. Допустим только краткий ответ без пробелов.</div>
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
