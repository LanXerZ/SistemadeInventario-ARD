import api from './api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1'

export const inventoryApi = {
  downloadInventoryReport: (format = 'pdf', filters = {}) => api.get(`/inventory/items/report/`, {
    params: { type: format, ...filters },
    responseType: 'blob',
  }),

  getCategories: () => api.get('/inventory/categories/'),
  getCategory: (id) => api.get(`/inventory/categories/${id}/`),
  createCategory: (data) => api.post('/inventory/categories/', data),
  updateCategory: (id, data) => api.put(`/inventory/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/inventory/categories/${id}/`),

  getLocationTypes: (params = {}) => api.get('/inventory/location-types/', { params }),
  getLocationType: (id) => api.get(`/inventory/location-types/${id}/`),
  createLocationType: (data) => api.post('/inventory/location-types/', data),
  updateLocationType: (id, data) => api.put(`/inventory/location-types/${id}/`, data),
  deleteLocationType: (id) => api.delete(`/inventory/location-types/${id}/`),

  getLocations: (params = {}) => api.get('/inventory/locations/', { params }),
  getLocation: (id) => api.get(`/inventory/locations/${id}/`),
  createLocation: (data) => api.post('/inventory/locations/', data),
  updateLocation: (id, data) => api.put(`/inventory/locations/${id}/`, data),
  deleteLocation: (id) => api.delete(`/inventory/locations/${id}/`),

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
  addItemUnit: (id, data) => api.post(`/inventory/items/${id}/add_unit/`, data),

  getItemUnits: (params = {}) => api.get('/inventory/item-units/', { params }),
  getItemUnit: (id) => api.get(`/inventory/item-units/${id}/`),
  getOverdueUnits: () => api.get('/inventory/item-units/?overdue=true'),
  setUnitStatus: (id, data) => api.post(`/inventory/item-units/${id}/set_status/`, data),
  receiveUnit: (id, data) => api.post(`/inventory/item-units/${id}/receive/`, data),

  getItemLoans: (params = {}) => api.get('/inventory/item-loans/', { params }),
  getItemLoan: (id) => api.get(`/inventory/item-loans/${id}/`),
  createItemLoan: (data) => api.post('/inventory/item-loans/', data),
  returnItemLoan: (id) => api.post(`/inventory/item-loans/${id}/return_unit/`, {}),
  extendItemLoan: (id, days) => api.post(`/inventory/item-loans/${id}/extend/`, { days }),
  downloadLoansReport: (params = {}) => api.get('/inventory/item-loans/report/', {
    params,
    responseType: 'blob',
  }),

  getItemLoans: (params = {}) => api.get('/inventory/item-loans/', { params }),
  createItemLoan: (data) => api.post('/inventory/item-loans/', data),
  returnItemLoan: (id) => api.post(`/inventory/item-loans/${id}/return_unit/`, {}),

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
