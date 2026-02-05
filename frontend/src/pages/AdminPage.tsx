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
      const [s, q, t, tc, a] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/questions'),
        apiFetch('/admin/prog_tasks'),
        apiFetch('/admin/prog_testcases'),
        apiFetch('/admin/attempts')
      ])
      setStats(s)
      setQuestions(q)
      setTasks(t)
      setTestcases(tc)
      setAttempts(a)
      setError('')
    } catch (_e: any) {
      setError('Доступ запрещен или ошибка загрузки данных')
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

  if (error) return <div className="admin-page"><div className="admin-error">{error}</div></div>

  return (
    <div className="admin-page">
      <div className="admin-top">
        <h2>Админ-панель</h2>
        <button className="refresh-btn" onClick={load}>Обновить</button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><span>Всего попыток</span><b>{stats.total_attempts}</b></div>
          <div className="stat-card"><span>Сдали</span><b>{stats.submitted}</b></div>
          <div className="stat-card"><span>Не успели</span><b>{stats.timed_out}</b></div>
          <div className="stat-card"><span>Средний балл</span><b>{stats.avg_score.toFixed(2)}</b></div>
          <div className="stat-card"><span>Решаемость задач</span><b>{(stats.task_solve_rate * 100).toFixed(1)}%</b></div>
        </div>
      )}

      <div className="forms-grid">
        <div className="section">
          <h3>Новый вопрос</h3>
          <select value={qForm.subject} onChange={e => setQForm({ ...qForm, subject: e.target.value })}>
            <option value="math">Математика</option>
            <option value="ru">Русский</option>
          </select>
          <textarea placeholder="Текст вопроса" value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })} />
          <textarea placeholder="Варианты (каждый с новой строки)" value={qForm.options} onChange={e => setQForm({ ...qForm, options: e.target.value })} />
          <input type="number" placeholder="Индекс правильного варианта" value={qForm.correct_index} onChange={e => setQForm({ ...qForm, correct_index: Number(e.target.value) })} />
          <button className="primary" onClick={createQuestion}>Создать вопрос</button>
        </div>

        <div className="section">
          <h3>Новая задача по инфе</h3>
          <input placeholder="Название" value={tForm.title} onChange={e => setTForm({ ...tForm, title: e.target.value })} />
          <textarea placeholder="Условие" value={tForm.statement} onChange={e => setTForm({ ...tForm, statement: e.target.value })} />
          <button className="primary" onClick={createTask}>Создать задачу</button>
        </div>

        <div className="section">
          <h3>Новый тесткейс</h3>
          <select value={tcForm.task_id} onChange={e => setTcForm({ ...tcForm, task_id: Number(e.target.value) })}>
            <option value={0}>Выберите задачу</option>
            {tasks.map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}
          </select>
          <textarea placeholder="Input" value={tcForm.input_data} onChange={e => setTcForm({ ...tcForm, input_data: e.target.value })} />
          <textarea placeholder="Output" value={tcForm.output_data} onChange={e => setTcForm({ ...tcForm, output_data: e.target.value })} />
          <label className="checkbox-row">
            <input type="checkbox" checked={tcForm.is_hidden} onChange={e => setTcForm({ ...tcForm, is_hidden: e.target.checked })} />
            hidden тесткейс
          </label>
          <button className="primary" onClick={createTestcase}>Создать тесткейс</button>
        </div>
      </div>

      <div className="section">
        <h3>Вопросы</h3>
        {questions.length === 0 && <div className="empty">Нет вопросов</div>}
        {questions.map(q => (
          <div key={q.id} className="row">
            <div className="row-main">
              <span className="tag">{q.subject.toUpperCase()}</span>
              <span>#{q.id} {q.question}</span>
            </div>
            <button onClick={() => togglePublish('questions', q.id)}>{q.published ? 'Снять публикацию' : 'Опубликовать'}</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Задачи</h3>
        {tasks.length === 0 && <div className="empty">Нет задач</div>}
        {tasks.map(t => (
          <div key={t.id} className="row">
            <div className="row-main">
              <span className="tag">INF</span>
              <span>#{t.id} {t.title}</span>
            </div>
            <button onClick={() => togglePublish('prog_tasks', t.id)}>{t.published ? 'Снять публикацию' : 'Опубликовать'}</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Тесткейсы</h3>
        {testcases.length === 0 && <div className="empty">Нет тесткейсов</div>}
        {testcases.map(tc => (
          <div key={tc.id} className="row">
            <div className="row-main">
              <span className={`badge ${tc.is_hidden ? 'hidden' : 'visible'}`}>{tc.is_hidden ? 'HIDDEN' : 'VISIBLE'}</span>
              <span>#{tc.id} · Task {tc.task_id}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Попытки и результаты пользователей</h3>
        {attempts.length === 0 && <div className="empty">Пока нет попыток</div>}
        {attempts.map(a => (
          <div key={a.attempt_id} className="row">
            <div className="row-main">
              <span className={`badge ${a.status === 'timed_out' ? 'hidden' : 'visible'}`}>{a.status}</span>
              <span>#{a.attempt_id} · {a.email}</span>
            </div>
            <span>балл: {a.score_total ?? '-'} · мат: {a.score_blocks?.math ?? 0}, рус: {a.score_blocks?.ru ?? 0}, инф: {a.score_blocks?.prog ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
