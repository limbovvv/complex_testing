import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ExamPage from './pages/ExamPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import AdminLoginPage from './pages/AdminLoginPage'
import { getIsAdmin, getToken } from './api/client'

export default function App() {
  const token = getToken()
  const isAdmin = getIsAdmin()
  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? '/exam' : '/user'} />} />
      <Route path="/user" element={<LoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/exam" element={token ? <ExamPage /> : <Navigate to="/user" />} />
      <Route path="/result" element={token ? <ResultPage /> : <Navigate to="/user" />} />
      <Route path="/admin-panel" element={token && isAdmin ? <AdminPage /> : <Navigate to="/admin-login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
