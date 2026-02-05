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
      <Route path="/" element={<Navigate to={token ? '/exam' : '/login'} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/exam" element={token ? <ExamPage /> : <Navigate to="/login" />} />
      <Route path="/result" element={token ? <ResultPage /> : <Navigate to="/login" />} />
      <Route path="/admin" element={token ? <AdminPage /> : <Navigate to="/login" />} />
    </Routes>
  )
}
