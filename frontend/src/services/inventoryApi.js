import api from './api'

export const inventoryApi = {
  // Categories
  getCategories: () => api.get('/inventory/categories/'),
  createCategory: (data) => api.post('/inventory/categories/', data),

  // Items
  getItems: (params = {}) => api.get('/inventory/items/', { params }),
  getItem: (id) => api.get(`/inventory/items/${id}/`),
  createItem: (data) => api.post('/inventory/items/', data),
  updateItem: (id, data) => api.put(`/inventory/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/inventory/items/${id}/`),
  getCriticalItems: () => api.get('/inventory/items/critical/'),

  // Stock movements
  getStockMovements: (params = {}) => api.get('/inventory/stock-movements/', { params }),
  createStockMovement: (data) => api.post('/inventory/stock-movements/', data),
}
