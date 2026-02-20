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

  const statusLabel: Record<string, string> = {
    in_progress: 'В процессе',
    submitted: 'Сдано',
    timed_out: 'Время вышло'
  }

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

  if (error) return <div className="admin-wrapper"><div className="admin-page"><div className="admin-error">{error}</div></div></div>

  return (
    <div className="admin-wrapper">
      <div className="admin-page">
      <div className="admin-top">
        <h2>Админ-панель</h2>
        <button className="refresh-btn" onClick={load}>Обновить данные</button>
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
          <h3>Новый вопрос (тест)</h3>
          <label className="field-label">Блок</label>
          <select value={qForm.subject} onChange={e => setQForm({ ...qForm, subject: e.target.value })}>
            <option value="math">Математика</option>
            <option value="ru">Русский язык</option>
          </select>
          <label className="field-label">Формулировка</label>
          <textarea placeholder="Текст вопроса" value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })} />
          <label className="field-label">Варианты (каждый с новой строки)</label>
          <textarea placeholder={'Например:\n2x+5\n10\n11'} value={qForm.options} onChange={e => setQForm({ ...qForm, options: e.target.value })} />
          <label className="field-label">Номер правильного варианта (0..n-1)</label>
          <input type="number" value={qForm.correct_index} onChange={e => setQForm({ ...qForm, correct_index: Number(e.target.value) })} />
          <button className="primary" onClick={createQuestion}>Сохранить вопрос</button>
        </div>

        <div className="section">
          <h3>Новая задача (информатика)</h3>
          <label className="field-label">Название</label>
          <input placeholder="Например: Сумма двух чисел" value={tForm.title} onChange={e => setTForm({ ...tForm, title: e.target.value })} />
          <label className="field-label">Условие</label>
          <textarea placeholder="Опишите вход и выход" value={tForm.statement} onChange={e => setTForm({ ...tForm, statement: e.target.value })} />
          <label className="field-label">Баллы</label>
          <input type="number" value={tForm.points} onChange={e => setTForm({ ...tForm, points: Number(e.target.value) })} />
          <button className="primary" onClick={createTask}>Сохранить задачу</button>
        </div>

        <div className="section">
          <h3>Тесткейс к задаче</h3>
          <label className="field-label">Задача</label>
          <select value={tcForm.task_id} onChange={e => setTcForm({ ...tcForm, task_id: Number(e.target.value) })}>
            <option value={0}>Выберите задачу</option>
            {tasks.map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}
          </select>
          <label className="field-label">Входные данные</label>
          <textarea placeholder="Пример: 2 3" value={tcForm.input_data} onChange={e => setTcForm({ ...tcForm, input_data: e.target.value })} />
          <label className="field-label">Ожидаемый вывод</label>
          <textarea placeholder="Пример: 5" value={tcForm.output_data} onChange={e => setTcForm({ ...tcForm, output_data: e.target.value })} />
          <label className="checkbox-row">
            <input type="checkbox" checked={tcForm.is_hidden} onChange={e => setTcForm({ ...tcForm, is_hidden: e.target.checked })} />
            Скрытый тесткейс (не показывается участникам)
          </label>
          <button className="primary" onClick={createTestcase}>Сохранить тесткейс</button>
        </div>
      </div>

      <div className="section">
        <h3>Математика</h3>
        {questions.filter(q => q.subject === 'math').length === 0 && <div className="empty">Нет вопросов по математике</div>}
        {questions.filter(q => q.subject === 'math').map(q => (
          <div key={q.id} className="row">
            <div className="row-main">
              <span className="tag">MATH</span>
              <span>#{q.id} {q.question}</span>
            </div>
            <button onClick={() => togglePublish('questions', q.id)}>{q.published ? 'Снять публикацию' : 'Опубликовать'}</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Русский язык</h3>
        {questions.filter(q => q.subject === 'ru').length === 0 && <div className="empty">Нет вопросов по русскому</div>}
        {questions.filter(q => q.subject === 'ru').map(q => (
          <div key={q.id} className="row">
            <div className="row-main">
              <span className="tag">RU</span>
              <span>#{q.id} {q.question}</span>
            </div>
            <button onClick={() => togglePublish('questions', q.id)}>{q.published ? 'Снять публикацию' : 'Опубликовать'}</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Информатика</h3>
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

        <div className="sub-section">
          <h4>Тесткейсы</h4>
          {testcases.length === 0 && <div className="empty">Нет тесткейсов</div>}
          {testcases.map(tc => (
            <div key={tc.id} className="row">
              <div className="row-main">
                <span className={`badge ${tc.is_hidden ? 'hidden' : 'visible'}`}>{tc.is_hidden ? 'Скрыт' : 'Публичен'}</span>
                <span>#{tc.id} · задача {tc.task_id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Попытки и результаты пользователей</h3>
        {attempts.length === 0 && <div className="empty">Пока нет попыток</div>}
        {attempts.map(a => (
          <div key={a.attempt_id} className="row">
            <div className="row-main">
              <span className={`badge ${a.status === 'timed_out' ? 'hidden' : 'visible'}`}>{statusLabel[a.status] || a.status}</span>
              <span>#{a.attempt_id} · {a.full_name || a.email}</span>
            </div>
            <span>Баллы: {a.score_total ?? '-'} · мат: {a.score_blocks?.math ?? 0}, рус: {a.score_blocks?.ru ?? 0}, инф: {a.score_blocks?.prog ?? 0}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
