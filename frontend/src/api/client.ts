const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function setIsAdmin(isAdmin: boolean) {
  localStorage.setItem('is_admin', isAdmin ? '1' : '0')
}

export function getIsAdmin() {
  return localStorage.getItem('is_admin') === '1'
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('is_admin')
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return null
  return res.json()
}
