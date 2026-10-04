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
  
  // Devices & Ingestion
  uploadDevice: (formData) => api.post('/devices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listDevices: (params) => api.get('/devices', { params }),
  getDevice: (id) => api.get(`/devices/${id}`),
  analyzeDrift: (data) => api.post('/devices/drift', data),

  // Compliance Audits
  createAudit: (data) => api.post('/compliance/audit', data),
  getAudit: (id) => api.get(`/compliance/audit/${id}`),
  listAudits: (params) => api.get('/compliance/audits', { params }),
  complianceQuery: (data) => api.post('/compliance/query', data),

  // Blockchain Evidence Ledger
  listBlockchainBlocks: (params) => api.get('/blockchain/blocks', { params }),
  verifyAuditBlockchain: (auditId) => api.get(`/blockchain/verify/${auditId}`),
  anchorAudit: (auditId) => api.post(`/blockchain/anchor/${auditId}`),
  verifyChain: () => api.get('/blockchain/verify-chain'),

  // Regulatory Frameworks
  listFrameworks: () => api.get('/frameworks'),
  searchFrameworks: (params) => api.get('/frameworks/search', { params }),
};

export default api;
