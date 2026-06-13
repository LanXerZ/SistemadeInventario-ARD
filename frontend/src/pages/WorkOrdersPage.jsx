import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { workOrderApi } from '../services/workOrderApi'
import { useAuth } from '../context/AuthContext'
import { downloadBlob } from '../utils/download'

const statusColors = {
  received: 'bg-gray-100 text-gray-800',
  in_diagnosis: 'bg-yellow-100 text-yellow-800',
  waiting_parts: 'bg-orange-100 text-orange-800',
  in_repair: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-purple-100 text-purple-800',
  dismissed: 'bg-red-100 text-red-800',
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await workOrderApi.getWorkOrders(params)
      setWorkOrders(data.results || data)
    } catch (error) {
      toast.error('Error al cargar órdenes de trabajo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta orden de trabajo?')) return
    try {
      await workOrderApi.deleteWorkOrder(id)
      toast.success('Orden de trabajo eliminada')
      fetchWorkOrders()
    } catch (error) {
      toast.error('Error al eliminar la orden de trabajo')
    }
  }

  const handleDownloadReport = async (format) => {
    try {
      const response = await workOrderApi.downloadWorkOrdersReport(format)
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(response, `ordenes_trabajo_${new Date().toISOString().slice(0, 10)}.${extension}`)
    } catch (error) {
      toast.error('Error al generar el reporte')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h2>
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
                to="/workorders/new"
                className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                <PlusIcon className="h-4 w-4" />
                Nueva OT
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
            placeholder="Buscar por OT, unidad, marca, modelo, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWorkOrders()}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        >
          <option value="">Todos los estados</option>
          <option value="received">Recibido</option>
          <option value="in_diagnosis">En diagnóstico</option>
          <option value="waiting_parts">Esperando repuestos</option>
          <option value="in_repair">En reparación</option>
          <option value="ready">Listo para entregar</option>
          <option value="delivered">Entregado</option>
        </select>
        <button
          onClick={fetchWorkOrders}
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
                  OT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unidad origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Técnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/workorders/${wo.id}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {wo.ot_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{wo.origin_unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {wo.equipment_brand} {wo.equipment_model}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{wo.technician_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[wo.status] || 'bg-gray-100 text-gray-800'}`}>
                      {wo.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(wo.received_at).toLocaleDateString('es-DO')}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        to={`/workorders/${wo.id}/edit`}
                        className="text-brand-700 hover:text-brand-900"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(wo.id)}
                        className="ml-4 text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={canEdit ? 7 : 6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No se encontraron órdenes de trabajo.
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
