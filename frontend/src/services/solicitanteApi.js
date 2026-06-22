import api from './api'

export const solicitanteApi = {
  list: (params = {}) => api.get('/work-orders/solicitantes/', { params }),
  get: (id) => api.get(`/work-orders/solicitantes/${id}/`),
  create: (data) => api.post('/work-orders/solicitantes/', data),
  update: (id, data) => api.put(`/work-orders/solicitantes/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/work-orders/solicitantes/${id}/`, data),
  delete: (id) => api.delete(`/work-orders/solicitantes/${id}/`),
  search: (query) => api.get('/work-orders/solicitantes/', { params: { search: query } }),
}
