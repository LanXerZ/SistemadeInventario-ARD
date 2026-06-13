import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { workOrderApi } from '../services/workOrderApi'
import { inventoryApi } from '../services/inventoryApi'
import { useAuth } from '../context/AuthContext'

const statusColors = {
  received: 'bg-gray-100 text-gray-800',
  in_diagnosis: 'bg-yellow-100 text-yellow-800',
  waiting_parts: 'bg-orange-100 text-orange-800',
  in_repair: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-purple-100 text-purple-800',
  dismissed: 'bg-red-100 text-red-800',
}

const partStatusLabels = {
  requested: 'Solicitado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  used: 'Usado',
}

export default function WorkOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdminOrAlmacenista = user?.role === 'admin' || user?.role === 'almacenista'
  const isTechnician = user?.role === 'tecnico'

  const [workOrder, setWorkOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    item: '',
    quantity: 1,
    notes: '',
  })

  useEffect(() => {
    fetchWorkOrder()
    fetchItems()
  }, [id])

  const fetchWorkOrder = async () => {
    try {
      const { data } = await workOrderApi.getWorkOrder(id)
      setWorkOrder(data)
    } catch (error) {
      toast.error('Error al cargar la orden de trabajo')
      navigate('/workorders')
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const { data } = await inventoryApi.getItems()
      setItems(data.results || data)
    } catch (error) {
      console.error('Failed to fetch items', error)
    }
  }

  const handleRequestPart = async (e) => {
    e.preventDefault()
    try {
      await workOrderApi.requestPart(id, {
        item: Number(requestForm.item),
        quantity: Number(requestForm.quantity),
        notes: requestForm.notes,
      })
      toast.success('Repuesto solicitado')
      setShowRequestForm(false)
      setRequestForm({ item: '', quantity: 1, notes: '' })
      fetchWorkOrder()
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).flat().join(', ') ||
        'Error al solicitar repuesto'
      toast.error(message)
    }
  }

  const handleApprovePart = async (partId) => {
    try {
      await workOrderApi.approvePart(id, { part_id: partId })
      toast.success('Repuesto aprobado')
      fetchWorkOrder()
    } catch (error) {
      toast.error('Error al aprobar repuesto')
    }
  }

  const handleRejectPart = async (partId) => {
    try {
      await workOrderApi.rejectPart(id, { part_id: partId })
      toast.success('Repuesto rechazado')
      fetchWorkOrder()
    } catch (error) {
      toast.error('Error al rechazar repuesto')
    }
  }

  const handleUsePart = async (partId) => {
    try {
      await workOrderApi.usePart(id, { part_id: partId })
      toast.success('Repuesto marcado como usado')
      fetchWorkOrder()
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al consumir repuesto'
      toast.error(message)
    }
  }

  const handleClose = async () => {
    try {
      await workOrderApi.closeWorkOrder(id, {
        diagnosis: workOrder.diagnosis,
        replaced_parts_note: workOrder.replaced_parts_note,
      })
      toast.success('Orden marcada como lista para entregar')
      fetchWorkOrder()
    } catch (error) {
      toast.error('Error al cerrar la orden')
    }
  }

  const handleDeliver = async () => {
    try {
      await workOrderApi.deliverWorkOrder(id)
      toast.success('Orden marcada como entregada')
      fetchWorkOrder()
    } catch (error) {
      toast.error('Error al marcar como entregada')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  if (!workOrder) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/workorders"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{workOrder.ot_number}</h2>
          <p className="text-gray-600 mt-1">{workOrder.origin_unit}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PrinterIcon className="h-4 w-4" />
            Imprimir
          </button>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[workOrder.status]}`}>
            {workOrder.status_display}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del equipo</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Marca</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.equipment_brand || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Modelo</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.equipment_model || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.equipment_serial || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Técnico asignado</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.technician_name}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.equipment_description}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Fallo reportado</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.reported_failure || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnóstico y reparación</h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Diagnóstico</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.diagnosis || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Repuestos reemplazados</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.replaced_parts_note || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Repuestos</h3>
            {workOrder.parts.length === 0 ? (
              <p className="text-sm text-gray-500">No hay repuestos solicitados.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Artículo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Cantidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workOrder.parts.map((part) => (
                    <tr key={part.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {part.item_name} <span className="text-gray-500">({part.item_sku})</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {part.quantity_approved || part.quantity_requested}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{partStatusLabels[part.status]}</td>
                      <td className="px-4 py-2 text-sm">
                        {part.status === 'requested' && isAdminOrAlmacenista && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprovePart(part.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectPart(part.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                        {part.status === 'approved' && isAdminOrAlmacenista && (
                          <button
                            onClick={() => handleUsePart(part.id)}
                            className="text-brand-700 hover:text-brand-900"
                          >
                            Consumir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {isTechnician && workOrder.status !== 'delivered' && workOrder.status !== 'ready' && (
              <div className="mt-4">
                {!showRequestForm ? (
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
                  >
                    Solicitar repuesto
                  </button>
                ) : (
                  <form onSubmit={handleRequestPart} className="space-y-4 border-t border-gray-200 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Artículo</label>
                      <select
                        value={requestForm.item}
                        onChange={(e) => setRequestForm({ ...requestForm, item: e.target.value })}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="">Seleccione...</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.quantity} disponibles)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={requestForm.quantity}
                        onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notas</label>
                      <input
                        value={requestForm.notes}
                        onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
                      >
                        Solicitar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRequestForm(false)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de entrega</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Oficial que entrega</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workOrder.delivery_officer_rank} {workOrder.delivery_officer_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Recibido</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(workOrder.received_at).toLocaleString('es-DO')}
                </dd>
              </div>
              {workOrder.completed_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completado</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(workOrder.completed_at).toLocaleString('es-DO')}
                  </dd>
                </div>
              )}
              {workOrder.delivered_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Entregado</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(workOrder.delivered_at).toLocaleString('es-DO')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {isAdminOrAlmacenista && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
              <div className="space-y-3">
                <Link
                  to={`/workorders/${workOrder.id}/edit`}
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Editar orden
                </Link>
                {workOrder.status !== 'ready' && workOrder.status !== 'delivered' && (
                  <button
                    onClick={handleClose}
                    className="w-full rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
                  >
                    Marcar lista para entregar
                  </button>
                )}
                {workOrder.status === 'ready' && (
                  <button
                    onClick={handleDeliver}
                    className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                  >
                    Marcar entregado
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable delivery note */}
      <div className="hidden print:block print:p-8">
        <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
          <h1 className="text-2xl font-bold">ARMADA DE REPÚBLICA DOMINICANA</h1>
          <h2 className="text-xl">Taller de Electrónica</h2>
          <p className="text-lg font-bold mt-2">NOTA DE ENTREGA - {workOrder.ot_number}</p>
        </div>
        <div className="space-y-4 text-sm">
          <p><strong>Unidad de origen:</strong> {workOrder.origin_unit}</p>
          <p><strong>Oficial que entrega:</strong> {workOrder.delivery_officer_rank} {workOrder.delivery_officer_name}</p>
          <p><strong>Equipo:</strong> {workOrder.equipment_brand} {workOrder.equipment_model} - Serial: {workOrder.equipment_serial}</p>
          <p><strong>Diagnóstico:</strong> {workOrder.diagnosis}</p>
          <p><strong>Repuestos reemplazados:</strong> {workOrder.replaced_parts_note}</p>
          <p><strong>Fecha de entrega:</strong> {workOrder.delivered_at ? new Date(workOrder.delivered_at).toLocaleDateString('es-DO') : 'Pendiente'}</p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div className="border-t border-gray-900 pt-2">
            <p className="text-sm">Firma técnico</p>
          </div>
          <div className="border-t border-gray-900 pt-2">
            <p className="text-sm">Firma quien recibe</p>
          </div>
        </div>
      </div>
    </div>
  )
}
