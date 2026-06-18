import api from './api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const inventoryApi = {
  downloadInventoryReport: (format = 'pdf') => api.get(`/items/report/?format=${format}`, {
    responseType: 'blob',
  }),

  getCategories: () => api.get('/inventory/categories/'),
  getCategory: (id) => api.get(`/inventory/categories/${id}/`),
  createCategory: (data) => api.post('/inventory/categories/', data),
  updateCategory: (id, data) => api.put(`/inventory/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/inventory/categories/${id}/`),

  getLocations: (params = {}) => api.get('/inventory/locations/', { params }),
  getLocation: (id) => api.get(`/inventory/locations/${id}/`),
  createLocation: (data) => api.post('/inventory/locations/', data),
  updateLocation: (id, data) => api.put(`/inventory/locations/${id}/`, data),
  deleteLocation: (id) => api.delete(`/inventory/locations/${id}/`),
  getLocationTree: () => api.get('/inventory/locations/full_tree/'),
  getLocationSubtree: (id) => api.get(`/inventory/locations/${id}/tree/`),

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

  getStockMovements: (params = {}) => api.get('/inventory/stock-movements/', { params }),
  createStockMovement: (data) => api.post('/inventory/stock-movements/', data),

  getTransfers: (params = {}) => api.get('/inventory/transfers/', { params }),
  getTransfer: (id) => api.get(`/inventory/transfers/${id}/`),
  createTransfer: (data) => api.post('/inventory/transfers/', data),
  approveTransfer: (id) => api.post(`/inventory/transfers/${id}/approve/`, {}),
  rejectTransfer: (id) => api.post(`/inventory/transfers/${id}/reject/`, {}),
}

export const getMediaUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_URL.replace('/api/v1', '')}${path}`
}
