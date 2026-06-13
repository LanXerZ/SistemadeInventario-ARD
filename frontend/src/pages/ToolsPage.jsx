import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { toolApi } from '../services/toolApi'
import { useAuth } from '../context/AuthContext'
import { downloadBlob } from '../utils/download'

const statusColors = {
  available: 'bg-green-100 text-green-800',
  loaned: 'bg-blue-100 text-blue-800',
  disposed: 'bg-gray-100 text-gray-800',
}

const statusLabels = {
  available: 'Disponible',
  loaned: 'Prestado',
  disposed: 'Dado de baja',
}

export default function ToolsPage() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await toolApi.getTools(params)
      setTools(data.results || data)
    } catch (error) {
      toast.error('Error al cargar herramientas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta herramienta?')) return
    try {
      await toolApi.deleteTool(id)
      toast.success('Herramienta eliminada')
      fetchTools()
    } catch (error) {
      toast.error('Error al eliminar la herramienta')
    }
  }

  const handleDownloadReport = async (format) => {
    try {
      const response = await toolApi.downloadToolsReport(format)
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(response, `herramientas_${new Date().toISOString().slice(0, 10)}.${extension}`)
    } catch (error) {
      toast.error('Error al generar el reporte')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Herramientas</h2>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => handleDownloadReport('pdf')}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                PDF
              </button>
              <button
                onClick={() => handleDownloadReport('excel')}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Excel
              </button>
              <Link
                to="/tools/new"
                className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                <PlusIcon className="h-4 w-4" />
                Nueva herramienta
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, marca, modelo, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTools()}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        >
          <option value="">Todos los estados</option>
          <option value="available">Disponible</option>
          <option value="loaned">Prestado</option>
          <option value="disposed">Dado de baja</option>
        </select>
        <button
          onClick={fetchTools}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Filtrar
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Marca/Modelo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/tools/${tool.id}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {tool.code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tool.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tool.tool_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tool.brand} {tool.model}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tool.status]}`}>
                      {tool.is_overdue && (
                        <ExclamationTriangleIcon className="h-3 w-3" />
                      )}
                      {statusLabels[tool.status]}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        to={`/tools/${tool.id}/edit`}
                        className="text-brand-700 hover:text-brand-900"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="ml-4 text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {tools.length === 0 && (
                <tr>
                  <td
                    colSpan={canEdit ? 6 : 5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No se encontraron herramientas.
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
