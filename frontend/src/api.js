import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (d) => api.post('/api/auth/register', d),
  login: (d) => api.post('/api/auth/login', d),
  me: () => api.get('/api/auth/me'),
};

export const transactions = {
  list: (page = 1, per_page = 20) => api.get(`/api/transactions/?page=${page}&per_page=${per_page}`),
  create: (d) => api.post('/api/transactions/', d),
  update: (id, d) => api.patch(`/api/transactions/${id}`, d),
  delete: (id) => api.delete(`/api/transactions/${id}`),
  importCsv: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/transactions/import', fd);
  },
  exportCsv: () => api.get('/api/transactions/export', { responseType: 'blob' }),
};

export const budgets = {
  list: (month) => api.get(`/api/budgets/${month ? `?month=${month}` : ''}`),
  upsert: (d) => api.post('/api/budgets/', d),
  delete: (id) => api.delete(`/api/budgets/${id}`),
  categories: () => api.get('/api/budgets/categories'),
};

export const profile = {
  me: () => api.get('/api/auth/me'),
  updateName: (name) => api.patch('/api/auth/me', { name }),
  changePassword: (current_password, new_password) =>
    api.post('/api/auth/change-password', { current_password, new_password }),
};

export const analytics = {
  summary: () => api.get('/api/analytics/summary'),
  byCategory: () => api.get('/api/analytics/by-category'),
  monthlyTrend: () => api.get('/api/analytics/monthly-trend'),
  forecast: () => api.get('/api/analytics/forecast'),
  anomalies: () => api.get('/api/analytics/anomalies'),
};

export const admin = {
  users:       () => api.get('/api/admin/users'),
  toggleUser:  (id) => api.patch(`/api/admin/users/${id}/status`),
  deleteUser:  (id) => api.delete(`/api/admin/users/${id}`),
  auditLogs:   () => api.get('/api/admin/audit-logs'),
  stats:       () => api.get('/api/admin/stats'),
  retrain:     () => api.post('/api/admin/retrain'),
  modelInfo:   () => api.get('/api/admin/model-info'),
};

/* -------- helpers to decode JWT payload (role claim) -------- */
export function getJwtPayload() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch { return null; }
}
export const isAdmin = () => getJwtPayload()?.role === 'admin';

export default api;
