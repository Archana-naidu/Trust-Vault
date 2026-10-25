import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trustvault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login failure attempts
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('trustvault_token');
        localStorage.removeItem('trustvault_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users')
};

// Document endpoints
export const documentAPI = {
  getDocuments: (params) => api.get('/documents', { params }),
  getDocumentById: (id) => api.get(`/documents/${id}`),
  uploadDocument: (formData, onUploadProgress) => {
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    });
  },
  downloadDocument: async (id, filename) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return response;
  },
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  verifyDocument: (id) => api.post(`/documents/${id}/verify`),
  simulateTamper: (id) => api.post(`/documents/${id}/simulate-tamper`),
  restoreTamper: (id) => api.post(`/documents/${id}/restore-tamper`),
  shareDocument: (id, shareData) => api.post(`/documents/${id}/share`, shareData)
};

// Share management
export const shareAPI = {
  getShares: (params) => api.get('/shares', { params }),
  revokeShare: (id) => api.delete(`/shares/${id}`)
};

// Audit logs
export const auditAPI = {
  getAuditLogs: (params) => api.get('/audit', { params }),
  verifyAuditChain: () => api.post('/audit/verify'),
  simulateTamper: (sequenceNum) => api.post('/audit/simulate-tamper', { sequenceNum }),
  repairTamper: () => api.post('/audit/repair')
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

// User Management (Admin only)
export const userAPI = {
  listUsers: () => api.get('/users'),
  updateRole: (userId, role) => api.patch(`/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/users/${userId}`)
};

// Organizations
export const orgAPI = {
  listOrganizations: () => api.get('/organizations'),
  createOrganization: (data) => api.post('/organizations', data),
  getOrganization: (id) => api.get(`/organizations/${id}`)
};

export default api;
