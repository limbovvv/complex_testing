import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import '../styles/admin.css'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [testcases, setTestcases] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [error, setError] = useState('')

  const [qForm, setQForm] = useState({ subject: 'math', question: '', options: '', correct_index: 0, points: 1, published: true })
  const [tForm, setTForm] = useState({ title: '', statement: '', points: 1, published: true })
  const [tcForm, setTcForm] = useState({ task_id: 0, input_data: '', output_data: '', is_hidden: false })

  async function load() {
    try {
      const s = await apiFetch('/admin/stats')
      const q = await apiFetch('/admin/questions')
      const t = await apiFetch('/admin/prog_tasks')
      const tc = await apiFetch('/admin/prog_testcases')
      const a = await apiFetch('/admin/attempts')
      setStats(s)
      setQuestions(q)
      setTasks(t)
      setTestcases(tc)
      setAttempts(a)
    } catch (e: any) {
      setError('Доступ запрещен или ошибка')
    }
  }

  useEffect(() => { load() }, [])

  async function createQuestion() {
    const options = qForm.options.split('\n').map(s => s.trim()).filter(Boolean)
    await apiFetch('/admin/questions', { method: 'POST', body: JSON.stringify({ ...qForm, options }) })
    setQForm({ subject: 'math', question: '', options: '', correct_index: 0, points: 1, published: true })
    load()
  }

  async function createTask() {
    await apiFetch('/admin/prog_tasks', { method: 'POST', body: JSON.stringify(tForm) })
    setTForm({ title: '', statement: '', points: 1, published: true })
    load()
  }

  async function createTestcase() {
    await apiFetch('/admin/prog_testcases', { method: 'POST', body: JSON.stringify(tcForm) })
    setTcForm({ task_id: 0, input_data: '', output_data: '', is_hidden: false })
    load()
  }

  async function togglePublish(entity: string, id: number) {
    await apiFetch(`/admin/publish/${entity}/${id}`, { method: 'POST' })
    load()
  }

  if (error) return <div className="admin-page">{error}</div>

  return (
    <div className="admin-page">
      <h2>Админка</h2>
      {stats && (
        <div className="stats">
          <div>Всего попыток: {stats.total_attempts}</div>
          <div>Сдали: {stats.submitted}</div>
          <div>Не успели: {stats.timed_out}</div>
          <div>Средний балл: {stats.avg_score.toFixed(2)}</div>
          <div>Решаемость задач: {(stats.task_solve_rate * 100).toFixed(1)}%</div>
        </div>
      )}

      <div className="section">
        <h3>Новый вопрос</h3>
        <select value={qForm.subject} onChange={e => setQForm({ ...qForm, subject: e.target.value })}>
          <option value="math">Математика</option>
          <option value="ru">Русский</option>
        </select>
        <textarea placeholder="Вопрос" value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })} />
        <textarea placeholder="Варианты (по одному в строке)" value={qForm.options} onChange={e => setQForm({ ...qForm, options: e.target.value })} />
        <input type="number" placeholder="Индекс правильного" value={qForm.correct_index} onChange={e => setQForm({ ...qForm, correct_index: Number(e.target.value) })} />
        <button onClick={createQuestion}>Создать</button>
      </div>

      <div className="section">
        <h3>Новый кодовый таск</h3>
        <input placeholder="Название" value={tForm.title} onChange={e => setTForm({ ...tForm, title: e.target.value })} />
        <textarea placeholder="Условие" value={tForm.statement} onChange={e => setTForm({ ...tForm, statement: e.target.value })} />
        <button onClick={createTask}>Создать</button>
      </div>

      <div className="section">
        <h3>Новый тесткейс</h3>
        <select value={tcForm.task_id} onChange={e => setTcForm({ ...tcForm, task_id: Number(e.target.value) })}>
          <option value={0}>Выберите задачу</option>
          {tasks.map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}
        </select>
        <textarea placeholder="Input" value={tcForm.input_data} onChange={e => setTcForm({ ...tcForm, input_data: e.target.value })} />
        <textarea placeholder="Output" value={tcForm.output_data} onChange={e => setTcForm({ ...tcForm, output_data: e.target.value })} />
        <label>
          <input type="checkbox" checked={tcForm.is_hidden} onChange={e => setTcForm({ ...tcForm, is_hidden: e.target.checked })} />
          hidden
        </label>
        <button onClick={createTestcase}>Создать</button>
      </div>

      <div className="section">
        <h3>Вопросы</h3>
        {questions.map(q => (
          <div key={q.id} className="row">
            <span>{q.subject.toUpperCase()} #{q.id} {q.question}</span>
            <button onClick={() => togglePublish('questions', q.id)}>{q.published ? 'Снять' : 'Опубликовать'}</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Задачи</h3>
        {tasks.map(t => (
          <div key={t.id} className="row">
            <span>#{t.id} {t.title}</span>
            <button onClick={() => togglePublish('prog_tasks', t.id)}>{t.published ? 'Снять' : 'Опубликовать'}</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Тесткейсы</h3>
        {testcases.map(tc => (
          <div key={tc.id} className="row">
            <span>#{tc.id} Task {tc.task_id} {tc.is_hidden ? '(hidden)' : '(visible)'}</span>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Попытки и результаты пользователей</h3>
        {attempts.length === 0 && <div>Пока нет попыток</div>}
        {attempts.map(a => (
          <div key={a.attempt_id} className="row">
            <span>
              #{a.attempt_id} | {a.email} | {a.status} | балл: {a.score_total ?? '-'} |
              мат: {a.score_blocks?.math ?? 0}, рус: {a.score_blocks?.ru ?? 0}, инф: {a.score_blocks?.prog ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
