import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { auditApi } from '../services/auditApi'
import { inventoryApi } from '../services/inventoryApi'

const actionColors = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
}

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    model_name: '',
    object_id: '',
    timestamp_from: '',
    timestamp_to: '',
  })
  const [articleName, setArticleName] = useState('')
  const [resolvedItem, setResolvedItem] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (filters.object_id && filters.model_name === 'inventory.item') {
      inventoryApi.getItem(filters.object_id)
        .then(({ data }) => setResolvedItem(data))
        .catch(() => setResolvedItem(null))
    } else {
      setResolvedItem(null)
    }
  }, [filters.object_id, filters.model_name])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.action) params.action = filters.action
      if (filters.model_name) params.model_name = filters.model_name
      if (filters.object_id) params.object_id = filters.object_id
      if (filters.timestamp_from) params.timestamp_from = filters.timestamp_from
      if (filters.timestamp_to) params.timestamp_to = filters.timestamp_to
      const { data } = await auditApi.getLogs(params)
      let results = data.results || data
      if (articleName) {
        const lower = articleName.toLowerCase()
        results = results.filter(log =>
          (log.changes?.name?.new && String(log.changes.name.new).toLowerCase().includes(lower)) ||
          (log.changes?.name?.old && String(log.changes.name.old).toLowerCase().includes(lower))
        )
      }
      setLogs(results)
    } catch (error) {
      toast.error('Error al cargar auditoría')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFilters({
      action: '',
      model_name: '',
      object_id: '',
      timestamp_from: '',
      timestamp_to: '',
    })
    setArticleName('')
  }

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return '—'
    return (
      <details className="text-xs">
        <summary className="cursor-pointer text-brand-700">Ver cambios</summary>
        <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-gray-700">
          {JSON.stringify(changes, null, 2)}
        </pre>
      </details>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h2>

      <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Modelo</label>
            <select
              value={filters.model_name}
              onChange={(e) => setFilters({ ...filters, model_name: e.target.value, object_id: '' })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            >
              <option value="">Todos los modelos</option>
              <option value="User">Usuario</option>
              <option value="Item">Artículo</option>
              <option value="Category">Categoría</option>
              <option value="Location">Ubicación</option>
              <option value="Transfer">Traslado</option>
              <option value="StockMovement">Movimiento de stock</option>
              <option value="WorkOrder">Orden de trabajo</option>
              <option value="WorkOrderPart">Repuesto de OT</option>
              <option value="Tool">Herramienta</option>
              <option value="ToolLoan">Préstamo de herramienta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ID del objeto</label>
            <input
              type="text"
              value={filters.object_id}
              onChange={(e) => setFilters({ ...filters, object_id: e.target.value })}
              placeholder="Ej: 42"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700 font-mono"
            />
            {resolvedItem && (
              <p className="mt-1 text-xs text-green-700">
                → {resolvedItem.name} ({resolvedItem.code || 'sin código'})
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del artículo (búsqueda)</label>
            <input
              type="text"
              value={articleName}
              onChange={(e) => setArticleName(e.target.value)}
              placeholder="Buscar en cambios de nombre..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="datetime-local"
              value={filters.timestamp_from}
              onChange={(e) => setFilters({ ...filters, timestamp_from: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="datetime-local"
              value={filters.timestamp_to}
              onChange={(e) => setFilters({ ...filters, timestamp_to: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={fetchLogs}
            className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            Filtrar
          </button>
          <button
            onClick={handleClear}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
          <p className="ml-auto text-xs text-gray-500">
            {logs.length} resultado{logs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Modelo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cambios
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('es-DO')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                      {log.action_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{log.model_name}</div>
                    <div className="text-xs text-gray-500 font-mono">#{log.object_id}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>{log.user_name || 'Sistema'}</div>
                    {log.user_email && <div className="text-xs text-gray-500">{log.user_email}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono text-xs">
                    {log.ip_address || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{renderChanges(log.changes)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay registros de auditoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
