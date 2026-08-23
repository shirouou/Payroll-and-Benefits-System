import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('payroll_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Error handling interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('payroll_auth_token');
      localStorage.removeItem('payroll_auth_user');
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============ EMPLOYEES ============
export const employeeAPI = {
  getAll: () => apiClient.get('/employees'),
  getById: (id) => apiClient.get(`/employees/${id}`),
  create: (data) => apiClient.post('/employees', data),
  update: (id, data) => apiClient.put(`/employees/${id}`, data),
  delete: (id) => apiClient.delete(`/employees/${id}`),
  getByStatus: (status) => apiClient.get(`/employees/status/${status}`),
};

// ============ PAYROLL ============
export const payrollAPI = {
  getAll: () => apiClient.get('/payroll'),
  getById: (id) => apiClient.get(`/payroll/${id}`),
  getByPeriod: (period) => apiClient.get(`/payroll/period/${period}`),
  create: (data) => apiClient.post('/payroll', data),
  update: (id, data) => apiClient.put(`/payroll/${id}`, data),
  delete: (id) => apiClient.delete(`/payroll/${id}`),
  runBatch: (data) => apiClient.post('/payroll/run/batch', data),
};

// ============ HMO ============
export const hmoAPI = {
  plans: {
    getAll: () => apiClient.get('/hmo/plans'),
    create: (data) => apiClient.post('/hmo/plans', data),
    update: (id, data) => apiClient.put(`/hmo/plans/${id}`, data),
    delete: (id) => apiClient.delete(`/hmo/plans/${id}`),
  },
  enrollments: {
    getAll: () => apiClient.get('/hmo/enrollments'),
    getByEmployee: (employeeId) => apiClient.get(`/hmo/enrollments/employee/${employeeId}`),
    create: (data) => apiClient.post('/hmo/enrollments', data),
    update: (id, data) => apiClient.put(`/hmo/enrollments/${id}`, data),
    delete: (id) => apiClient.delete(`/hmo/enrollments/${id}`),
  },
};

// ============ CLAIMS ============
export const claimsAPI = {
  getAll: () => apiClient.get('/claims'),
  getById: (id) => apiClient.get(`/claims/${id}`),
  create: (data) => apiClient.post('/claims', data),
  update: (id, data) => apiClient.put(`/claims/${id}`, data),
  approve: (id, data) => apiClient.post(`/claims/${id}/approve`, data),
  reject: (id, data) => apiClient.post(`/claims/${id}/reject`, data),
  getByStatus: (status) => apiClient.get(`/claims/status/${status}`),
};

// ============ BONUSES ============
export const bonusesAPI = {
  getAll: () => apiClient.get('/bonuses'),
  getById: (id) => apiClient.get(`/bonuses/${id}`),
  create: (data) => apiClient.post('/bonuses', data),
  update: (id, data) => apiClient.put(`/bonuses/${id}`, data),
  delete: (id) => apiClient.delete(`/bonuses/${id}`),
};

export default apiClient;
