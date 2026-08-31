import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aegis_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  }
);

export const endpoints = {
  health: () => api.get('/health'),
  uploadDevice: (formData) => api.post('/devices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listDevices: () => api.get('/devices'),
  getDevice: (id) => api.get(`/devices/${id}`),
  createAudit: (data) => api.post('/compliance/audit', data),
  getAudit: (id) => api.get(`/compliance/audit/${id}`),
  listAudits: () => api.get('/compliance/audits'),
  complianceQuery: (data) => api.post('/compliance/query', data),
  listFrameworks: () => api.get('/frameworks'),
  searchFrameworks: (params) => api.get('/frameworks/search', { params }),
};

export default api;
