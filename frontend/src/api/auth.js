import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL

if (!API_BASE) {
  console.error('VITE_API_URL is not defined')
}

export const filmsAPI = {
  getFilm: (id) => axios.get(`${API_BASE}/films/${id}`),
  getUpcomingSessions: (filmId) => axios.get(`${API_BASE}/views/upcoming-sessions/${filmId}`),
}

export const hallsAPI = {
  getHalls: () => axios.get(`${API_BASE}/halls/`),
}

export const authAPI = {
  register: (userData) => axios.post(`${API_BASE}/auth/registration`, userData),
  login: (credentials) =>
    axios.post(`${API_BASE}/auth/login`, credentials, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
}

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default {
  filmsAPI,
  hallsAPI,
  authAPI,
}
