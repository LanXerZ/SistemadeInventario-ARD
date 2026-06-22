import api from './api'

export const despachoApi = {
  getDespachos: (params = {}) => api.get('/work-orders/despachos/', { params }),
  getDespacho: (id) => api.get(`/work-orders/despachos/${id}/`),
  createDespacho: (data) => api.post('/work-orders/despachos/', data),
  cancelDespacho: (id, reason) => api.post(`/work-orders/despachos/${id}/cancel/`, { reason }),
  downloadDespachosReport: (format = 'pdf') => api.get(`/work-orders/despachos/report/?type=${format}`, {
    responseType: 'blob',
  }),
}

export const solicitanteApi = {
  list: (params = {}) => api.get('/work-orders/solicitantes/', { params }),
  get: (id) => api.get(`/work-orders/solicitantes/${id}/`),
  create: (data) => api.post('/work-orders/solicitantes/', data),
  search: (query) => api.get('/work-orders/solicitantes/', { params: { search: query } }),
}

// Mantener workOrderApi como alias por compatibilidad (apunta a despachoApi)
export const workOrderApi = despachoApi
