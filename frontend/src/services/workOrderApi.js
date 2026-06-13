import api from './api'

export const workOrderApi = {
  // Work orders
  getWorkOrders: (params = {}) => api.get('/work-orders/work-orders/', { params }),
  getWorkOrder: (id) => api.get(`/work-orders/work-orders/${id}/`),
  createWorkOrder: (data) => api.post('/work-orders/work-orders/', data),
  updateWorkOrder: (id, data) => api.put(`/work-orders/work-orders/${id}/`, data),
  deleteWorkOrder: (id) => api.delete(`/work-orders/work-orders/${id}/`),

  // Actions
  requestPart: (id, data) => api.post(`/work-orders/work-orders/${id}/request_part/`, data),
  approvePart: (id, data) => api.post(`/work-orders/work-orders/${id}/approve_part/`, data),
  rejectPart: (id, data) => api.post(`/work-orders/work-orders/${id}/reject_part/`, data),
  usePart: (id, data) => api.post(`/work-orders/work-orders/${id}/use_part/`, data),
  closeWorkOrder: (id, data) => api.post(`/work-orders/work-orders/${id}/close/`, data),
  deliverWorkOrder: (id) => api.post(`/work-orders/work-orders/${id}/deliver/`),

  // Notifications
  getPendingPartsCount: () => api.get('/work-orders/work-orders/pending_parts/'),

  // Reports
  downloadWorkOrdersReport: (format = 'pdf') => api.get(`/work-orders/report/?format=${format}`, {
    responseType: 'blob',
  }),

  // Technicians
  getTechnicians: () => api.get('/work-orders/technicians/'),
}
