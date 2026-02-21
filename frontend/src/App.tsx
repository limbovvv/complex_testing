import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ExamPage from './pages/ExamPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import { getToken } from './api/client'

export default function App() {
  const token = getToken()
  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? '/exam' : '/user'} />} />
      <Route path="/user" element={<LoginPage />} />
      <Route path="/exam" element={token ? <ExamPage /> : <Navigate to="/user" />} />
      <Route path="/result" element={token ? <ResultPage /> : <Navigate to="/user" />} />
      <Route path="/admin-panel" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
