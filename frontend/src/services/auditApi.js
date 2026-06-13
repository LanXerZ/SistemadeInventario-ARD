import api from './api'

export const auditApi = {
  getLogs: (params = {}) => api.get('/audit/logs/', { params }),
}
