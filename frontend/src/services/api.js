import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const unwrapCollection = response => ({
  ...response,
  data: Array.isArray(response.data?.data) ? response.data.data : [],
});

// Track if we're already trying to refresh the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

const readAccessToken = () => {
  const adminSessionToken = sessionStorage.getItem('payroll_auth_token_session') || sessionStorage.getItem('payroll_auth_token');
  if (adminSessionToken) return adminSessionToken;
  return localStorage.getItem('payroll_auth_token');
};

// Request interceptor - add token to requests
apiClient.interceptors.request.use(config => {
  const token = readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh and errors
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const isAuthenticationRequest = originalRequest?.url?.includes('/auth/');

    // Handle 401 with token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthenticationRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = sessionStorage.getItem('payroll_refresh_token') || localStorage.getItem('payroll_refresh_token');
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('payroll_auth_token');
        localStorage.removeItem('payroll_auth_user');
        sessionStorage.removeItem('payroll_auth_token');
        sessionStorage.removeItem('payroll_auth_user');
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        
        const adminSession = sessionStorage.getItem('payroll_auth_user_session') || sessionStorage.getItem('payroll_auth_user');
        const shouldPersistSession = !adminSession || JSON.parse(adminSession)?.role !== 'admin';

        if (shouldPersistSession) {
          localStorage.setItem('payroll_auth_token', newToken);
          localStorage.setItem('payroll_refresh_token', newRefreshToken);
        } else {
          sessionStorage.setItem('payroll_auth_token', newToken);
          sessionStorage.setItem('payroll_refresh_token', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Refresh failed, redirect to login
        localStorage.removeItem('payroll_auth_token');
        localStorage.removeItem('payroll_auth_user');
        localStorage.removeItem('payroll_refresh_token');
        sessionStorage.removeItem('payroll_auth_token');
        sessionStorage.removeItem('payroll_auth_user');
        sessionStorage.removeItem('payroll_refresh_token');
        window.location.href = '/';
        
        return Promise.reject(refreshError);
      }
    }

    // For other 401 errors (no refresh possible)
    if (error.response?.status === 401 && !isAuthenticationRequest) {
      localStorage.removeItem('payroll_auth_token');
      localStorage.removeItem('payroll_auth_user');
      localStorage.removeItem('payroll_refresh_token');
      sessionStorage.removeItem('payroll_auth_token');
      sessionStorage.removeItem('payroll_auth_user');
      sessionStorage.removeItem('payroll_refresh_token');
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

// ============ EMPLOYEES ============
export const employeeAPI = {
  getAll: () => apiClient.get('/employees').then(unwrapCollection),
  exportReport: (data) => apiClient.post('/employees/report/pdf', data, { responseType: 'blob' }),
  getById: (id) => apiClient.get(`/employees/${id}`),
  create: (data) => apiClient.post('/employees', data),
  update: (id, data) => apiClient.put(`/employees/${id}`, data),
  delete: (id) => apiClient.delete(`/employees/${id}`),
  getByStatus: (status) => apiClient.get(`/employees/status/${status}`).then(unwrapCollection),
};

// ============ PAYROLL ============
export const payrollAPI = {
  getAll: () => apiClient.get('/payroll').then(unwrapCollection),
  getById: (id) => apiClient.get(`/payroll/${id}`),
  getByPeriod: (period) => apiClient.get(`/payroll/period/${period}`).then(unwrapCollection),
  create: (data) => apiClient.post('/payroll', data),
  update: (id, data) => apiClient.put(`/payroll/${id}`, data),
  delete: (id) => apiClient.delete(`/payroll/${id}`),
  runBatch: (data) => apiClient.post('/payroll/run/batch', data),
};

// ============ HMO ============
export const hmoAPI = {
  plans: {
    getAll: () => apiClient.get('/hmo/plans').then(unwrapCollection),
    create: (data) => apiClient.post('/hmo/plans', data),
    update: (id, data) => apiClient.put(`/hmo/plans/${id}`, data),
    delete: (id) => apiClient.delete(`/hmo/plans/${id}`),
  },
  enrollments: {
    getAll: () => apiClient.get('/hmo/enrollments').then(unwrapCollection),
    getByEmployee: (employeeId) => apiClient.get(`/hmo/enrollments/employee/${employeeId}`).then(unwrapCollection),
    create: (data) => apiClient.post('/hmo/enrollments', data),
    update: (id, data) => apiClient.put(`/hmo/enrollments/${id}`, data),
    delete: (id) => apiClient.delete(`/hmo/enrollments/${id}`),
  },
};

// ============ CLAIMS ============
export const claimsAPI = {
  getAll: () => apiClient.get('/claims').then(unwrapCollection),
  getAvailableEnrollments: () => apiClient.get('/claims/enrollments/available').then(unwrapCollection),
  getById: (id) => apiClient.get(`/claims/${id}`),
  create: (data) => apiClient.post('/claims', data),
  update: (id, data) => apiClient.put(`/claims/${id}`, data),
  approve: (id, data) => apiClient.post(`/claims/${id}/approve`, data),
  reject: (id, data) => apiClient.post(`/claims/${id}/reject`, data),
  getByStatus: (status) => apiClient.get(`/claims/status/${status}`).then(unwrapCollection),
};

// ============ BONUSES ============
export const bonusesAPI = {
  getAll: () => apiClient.get('/bonuses').then(unwrapCollection),
  getById: (id) => apiClient.get(`/bonuses/${id}`),
  create: (data) => apiClient.post('/bonuses', data),
  update: (id, data) => apiClient.put(`/bonuses/${id}`, data),
  delete: (id) => apiClient.delete(`/bonuses/${id}`),
};

export default apiClient;
