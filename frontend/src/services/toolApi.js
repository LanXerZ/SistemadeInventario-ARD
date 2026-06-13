import api from './api'

export const toolApi = {
  // Tools
  getTools: (params = {}) => api.get('/tools/tools/', { params }),
  getTool: (id) => api.get(`/tools/tools/${id}/`),
  createTool: (data) => api.post('/tools/tools/', data),
  updateTool: (id, data) => api.put(`/tools/tools/${id}/`, data),
  deleteTool: (id) => api.delete(`/tools/tools/${id}/`),
  loanTool: (id, data) => api.post(`/tools/tools/${id}/loan/`, data),
  returnTool: (id) => api.post(`/tools/tools/${id}/return_tool/`),
  disposeTool: (id, data) => api.post(`/tools/tools/${id}/dispose/`, data),
  getOverdueTools: () => api.get('/tools/tools/overdue/'),

  // Loans
  getLoans: (params = {}) => api.get('/tools/loans/', { params }),

  // Technicians
  getTechnicians: () => api.get('/tools/technicians/'),
}
