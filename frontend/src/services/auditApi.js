import api from './api'

export const auditApi = {
  getLogs: (params = {}) => api.get('/audit/logs/', { params }),
  getLogsForObject: (modelName, objectId) =>
    api.get('/audit/logs/', { params: { model_name: modelName, object_id: String(objectId), ordering: '-timestamp' } }),
}
