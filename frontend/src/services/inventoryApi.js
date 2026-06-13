import api from './api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1'

export const inventoryApi = {
  // Reports
  downloadInventoryReport: (format = 'pdf') => api.get(`/items/report/?format=${format}`, {
    responseType: 'blob',
  }),

  // Categories
  getCategories: () => api.get('/inventory/categories/'),
  createCategory: (data) => api.post('/inventory/categories/', data),

  // Items
  getItems: (params = {}) => api.get('/inventory/items/', { params }),
  getItem: (id) => api.get(`/inventory/items/${id}/`),
  createItem: (formData) => api.post('/inventory/items/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateItem: (id, formData) => api.put(`/inventory/items/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteItem: (id) => api.delete(`/inventory/items/${id}/`),
  getCriticalItems: () => api.get('/inventory/items/critical/'),

  // Stock movements
  getStockMovements: (params = {}) => api.get('/inventory/stock-movements/', { params }),
  createStockMovement: (data) => api.post('/inventory/stock-movements/', data),
}

export const getMediaUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_URL.replace('/api/v1', '')}${path}`
}
