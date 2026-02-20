import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import '../styles/admin.css'

type SubjectTab = 'math' | 'ru' | 'prog'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [testcases, setTestcases] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<SubjectTab>('math')

  const [qForm, setQForm] = useState({ subject: 'math', question: '', options: '', correct_index: 0, points: 1, published: true })
  const [tForm, setTForm] = useState({ title: '', statement: '', points: 1, published: true })
  const [tcForm, setTcForm] = useState({ task_id: 0, input_data: '', output_data: '', is_hidden: false })
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0)

  const statusLabel: Record<string, string> = {
    in_progress: 'В процессе',
    submitted: 'Сдано',
    timed_out: 'Время вышло'
  }

  const mathQuestions = useMemo(() => questions.filter(q => q.subject === 'math'), [questions])
  const ruQuestions = useMemo(() => questions.filter(q => q.subject === 'ru'), [questions])
  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId])
  const selectedTaskCases = useMemo(
    () => (selectedTaskId ? testcases.filter(tc => tc.task_id === selectedTaskId) : []),
    [testcases, selectedTaskId]
  )

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

  async function createQuestion(subject: 'math' | 'ru') {
    const options = qForm.options.split('\n').map(s => s.trim()).filter(Boolean)
    await apiFetch('/admin/questions', {
      method: 'POST',
      body: JSON.stringify({ ...qForm, subject, options })
    })
    setQForm({ subject, question: '', options: '', correct_index: 0, points: 1, published: true })
    load()
  }

  async function createTask() {
    const task = await apiFetch('/admin/prog_tasks', { method: 'POST', body: JSON.stringify(tForm) })
    setTForm({ title: '', statement: '', points: 1, published: true })
    setSelectedTaskId(task.id)
    setTcForm(prev => ({ ...prev, task_id: task.id }))
    load()
  }

  async function createTestcase() {
    await apiFetch('/admin/prog_testcases', { method: 'POST', body: JSON.stringify(tcForm) })
    setTcForm(prev => ({ ...prev, input_data: '', output_data: '', is_hidden: false }))
    load()
  }

  async function togglePublish(entity: string, id: number) {
    await apiFetch(`/admin/publish/${entity}/${id}`, { method: 'POST' })
    load()
  }

  if (error) return <div className="admin-wrapper"><div className="admin-page"><div className="admin-error">{error}</div></div></div>

  const currentQuestions = activeTab === 'math' ? mathQuestions : ruQuestions
  const currentSubjectLabel = activeTab === 'math' ? 'Математика' : 'Русский язык'

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

        <div className="tabs-row">
          <button className={`tab-btn ${activeTab === 'math' ? 'active' : ''}`} onClick={() => setActiveTab('math')}>Математика</button>
          <button className={`tab-btn ${activeTab === 'ru' ? 'active' : ''}`} onClick={() => setActiveTab('ru')}>Русский язык</button>
          <button className={`tab-btn ${activeTab === 'prog' ? 'active' : ''}`} onClick={() => setActiveTab('prog')}>Информатика</button>
        </div>

        {(activeTab === 'math' || activeTab === 'ru') && (
          <>
            <div className="section">
              <h3>Добавить вопрос: {currentSubjectLabel}</h3>
              <label className="field-label">Формулировка</label>
              <textarea placeholder="Текст вопроса" value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })} />
              <label className="field-label">Варианты (каждый с новой строки)</label>
              <textarea placeholder={'Например:\nВариант 1\nВариант 2'} value={qForm.options} onChange={e => setQForm({ ...qForm, options: e.target.value })} />
              <label className="field-label">Номер правильного варианта (0..n-1)</label>
              <input type="number" value={qForm.correct_index} onChange={e => setQForm({ ...qForm, correct_index: Number(e.target.value) })} />
              <button className="primary" onClick={() => createQuestion(activeTab)}>Сохранить вопрос</button>
            </div>

            <div className="section">
              <h3>Список вопросов: {currentSubjectLabel}</h3>
              {currentQuestions.length === 0 && <div className="empty">Нет вопросов</div>}
              {currentQuestions.map(q => (
                <div key={q.id} className="row">
                  <div className="row-main">
                    <span className="tag">{activeTab === 'math' ? 'MATH' : 'RU'}</span>
                    <span>#{q.id} {q.question}</span>
                  </div>
                  <button onClick={() => togglePublish('questions', q.id)}>{q.published ? 'Снять публикацию' : 'Опубликовать'}</button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'prog' && (
          <>
            <div className="forms-grid">
              <div className="section">
                <h3>Новая задача</h3>
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
                <select
                  value={tcForm.task_id || selectedTaskId}
                  onChange={e => {
                    const id = Number(e.target.value)
                    setSelectedTaskId(id)
                    setTcForm({ ...tcForm, task_id: id })
                  }}
                >
                  <option value={0}>Выберите задачу</option>
                  {tasks.map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}
                </select>
                {selectedTask && <div className="hint-box">Выбрана: <b>#{selectedTask.id} {selectedTask.title}</b></div>}
                <label className="field-label">Входные данные</label>
                <textarea placeholder="Пример: 2 3" value={tcForm.input_data} onChange={e => setTcForm({ ...tcForm, input_data: e.target.value })} />
                <label className="field-label">Ожидаемый вывод</label>
                <textarea placeholder="Пример: 5" value={tcForm.output_data} onChange={e => setTcForm({ ...tcForm, output_data: e.target.value })} />
                <div className="mini-actions">
                  <button type="button" onClick={() => setTcForm({ ...tcForm, input_data: '2 3\\n', output_data: '5\\n' })}>Шаблон 2+3</button>
                  <button type="button" onClick={() => setTcForm({ ...tcForm, input_data: '', output_data: '', is_hidden: false })}>Очистить</button>
                </div>
                <label className="checkbox-row">
                  <input type="checkbox" checked={tcForm.is_hidden} onChange={e => setTcForm({ ...tcForm, is_hidden: e.target.checked })} />
                  Скрытый тесткейс
                </label>
                <button className="primary" disabled={!tcForm.task_id} onClick={createTestcase}>Сохранить тесткейс</button>
              </div>
            </div>

            <div className="section">
              <h3>Список задач</h3>
              {tasks.length === 0 && <div className="empty">Нет задач</div>}
              {tasks.map(t => (
                <div key={t.id} className="row">
                  <div className="row-main">
                    <span className="tag">INF</span>
                    <span>#{t.id} {t.title}</span>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => { setSelectedTaskId(t.id); setTcForm(prev => ({ ...prev, task_id: t.id })) }}>Выбрать</button>
                    <button onClick={() => togglePublish('prog_tasks', t.id)}>{t.published ? 'Снять публикацию' : 'Опубликовать'}</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="section">
              <h3>Тесткейсы {selectedTask ? `для #${selectedTask.id}` : ''}</h3>
              {!selectedTask && <div className="empty">Сначала выберите задачу выше, чтобы работать с её тесткейсами.</div>}
              {selectedTask && selectedTaskCases.length === 0 && <div className="empty">Для выбранной задачи тесткейсов пока нет.</div>}
              {selectedTaskCases.map(tc => (
                <div key={tc.id} className="row">
                  <div className="row-main">
                    <span className={`badge ${tc.is_hidden ? 'hidden' : 'visible'}`}>{tc.is_hidden ? 'Скрыт' : 'Публичен'}</span>
                    <span>#{tc.id} · задача {tc.task_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section attempts-section">
          <h3>Попытки и результаты пользователей</h3>
          {attempts.length === 0 && <div className="empty">Пока нет попыток</div>}
          {attempts.map(a => (
            <div key={a.attempt_id} className="row">
              <div className="row-main">
                <span className={`badge ${a.status === 'timed_out' ? 'hidden' : 'visible'}`}>{statusLabel[a.status] || a.status}</span>
                <span>#{a.attempt_id} · {a.full_name || a.email}{a.faculty ? ` (${a.faculty})` : ''}</span>
              </div>
              <span>Баллы: {a.score_total ?? '-'} · мат: {a.score_blocks?.math ?? 0}, рус: {a.score_blocks?.ru ?? 0}, инф: {a.score_blocks?.prog ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
