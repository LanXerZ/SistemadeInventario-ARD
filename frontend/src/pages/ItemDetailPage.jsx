import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'
import { inventoryApi, getMediaUrl } from '../services/inventoryApi'
import { useAuth } from '../context/AuthContext'
import AuditHistoryTab from '../components/AuditHistoryTab'
import BarcodeDisplay from '../components/BarcodeDisplay'

const documentTypes = [
  { value: 'oficio', label: 'Oficio' },
  { value: 'conduce', label: 'Conduce' },
  { value: 'factura', label: 'Factura' },
  { value: 'directo', label: 'Directo' },
  { value: 'legado', label: 'Legado' },
]

export default function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  const [item, setItem] = useState(null)
  const [movements, setMovements] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [movementForm, setMovementForm] = useState({
    movement_type: 'entry',
    quantity: 1,
    document_type: 'directo',
    document_number: '',
    notes: '',
    document_file: null,
  })

  useEffect(() => {
    fetchItem()
    fetchMovements()
    fetchTransfers()
  }, [id])

  const fetchItem = async () => {
    try {
      const { data } = await inventoryApi.getItem(id)
      setItem(data)
    } catch (error) {
      toast.error('Error al cargar el artículo')
      navigate('/inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchMovements = async () => {
    try {
      const { data } = await inventoryApi.getStockMovements({ item: id })
      setMovements(data.results || data)
    } catch (error) {
      console.error('Failed to fetch movements', error)
    }
  }

  const fetchTransfers = async () => {
    try {
      const { data } = await inventoryApi.getTransfers({ item: id })
      setTransfers(data.results || data)
    } catch (error) {
      console.error('Failed to fetch transfers', error)
    }
  }

  const handleMovementChange = (e) => {
    const { name, value, type } = e.target
    if (type === 'file') {
      const file = e.target.files[0]
      if (file && file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 5MB')
        e.target.value = ''
        return
      }
      setMovementForm((prev) => ({ ...prev, [name]: file }))
    } else {
      setMovementForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleMovementSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      payload.append('item', id)
      payload.append('movement_type', movementForm.movement_type)
      payload.append('quantity', Number(movementForm.quantity))
      payload.append('document_type', movementForm.document_type)
      payload.append('document_number', movementForm.document_number)
      payload.append('notes', movementForm.notes)
      if (movementForm.document_file) {
        payload.append('document_file', movementForm.document_file)
      }
      await inventoryApi.createStockMovement(payload)
      toast.success('Movimiento registrado')
      setShowEntryForm(false)
      setMovementForm({
        movement_type: 'entry',
        quantity: 1,
        document_type: 'directo',
        document_number: '',
        notes: '',
        document_file: null,
      })
      fetchItem()
      fetchMovements()
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).flat().join(', ') ||
        'Error al registrar el movimiento'
      toast.error(message)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  if (!item) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/inventory"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
          <p className="text-gray-600 mt-1 font-mono">
            {item.code && <span className="mr-2">{item.code}</span>}
            {item.sku && <span className="mr-2">| SKU: {item.sku}</span>}
            | {item.category_name}
          </p>
        </div>
        <div className="flex items-start gap-4">
          {item.image_url && (
            <img
              src={getMediaUrl(item.image_url)}
              alt={item.name}
              className="h-24 w-24 rounded-lg object-cover border border-gray-200"
            />
          )}
          {item.is_critical && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Stock crítico
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Código de barras</h3>
          <Link
            to={`/inventory/${item.id}/print-label`}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            target="_blank"
          >
            <PrinterIcon className="h-4 w-4" />
            Imprimir etiqueta
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2 py-4 bg-gray-50 rounded-md">
          <BarcodeDisplay value={item.barcode_value} height={80} width={2.5} fontSize={16} />
          <p className="text-sm text-gray-600">Código: <span className="font-mono font-medium">{item.barcode_value}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.description || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Aplicación</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.application || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Marca</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.marca || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Modelo</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.modelo || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Número de serie</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{item.numero_serie || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ubicación actual</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.location_breadcrumb || item.location_display || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Unidad</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.unit}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Stock mínimo</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.minimum_stock}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {item.is_active ? 'Activo' : 'Inactivo'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('movements')}
                  className={`flex-1 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'movements'
                      ? 'border-brand-800 text-brand-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Movimientos
                </button>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className={`flex-1 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'transfers'
                      ? 'border-brand-800 text-brand-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                    Trazabilidad
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex-1 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'audit'
                      ? 'border-brand-800 text-brand-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Auditoría
                </button>
              </nav>
            </div>
            <div className="p-6">
              {activeTab === 'movements' ? (
                movements.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay movimientos registrados.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Documento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {movements.map((movement) => (
                        <tr key={movement.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(movement.created_at).toLocaleString('es-DO')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {movement.movement_type === 'entry' ? 'Entrada' : 'Salida'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{movement.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {movement.document_type} {movement.document_number}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{movement.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : activeTab === 'transfers' ? (
                transfers.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay traslados registrados para este artículo.</p>
                ) : (
                  <div className="space-y-3">
                    {transfers.map((transfer) => (
                      <div key={transfer.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700">
                                {transfer.origin_location_name || 'Inicial'}
                              </span>
                              <ArrowsRightLeftIcon className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-brand-800">
                                {transfer.destination_location_name}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 space-y-1">
                              <p>
                                Solicitado por <span className="font-medium text-gray-700">{transfer.requested_by_name}</span>
                                {transfer.approved_by_name && (
                                  <> · Aprobado por <span className="font-medium text-gray-700">{transfer.approved_by_name}</span></>
                                )}
                              </p>
                              <p>
                                {new Date(transfer.created_at).toLocaleString('es-DO')}
                                {transfer.completed_at && (
                                  <> · Completado {new Date(transfer.completed_at).toLocaleString('es-DO')}</>
                                )}
                              </p>
                              {transfer.document_number && (
                                <p>Documento: {transfer.document_type} {transfer.document_number}</p>
                              )}
                              {transfer.notes && (
                                <p className="text-gray-600">{transfer.notes}</p>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            transfer.status === 'completada' ? 'bg-green-100 text-green-800' :
                            transfer.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                            transfer.status === 'en_transito' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transfer.status_display}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <AuditHistoryTab modelName="inventory.item" objectId={item.id} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Stock actual</h3>
            <p className="text-3xl font-bold text-brand-800">
              {item.quantity} <span className="text-lg font-normal text-gray-600">{item.unit}</span>
            </p>
          </div>

          {canEdit && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowEntryForm(!showEntryForm)}
                  className="w-full rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
                >
                  Registrar movimiento
                </button>
                <Link
                  to={`/inventory/${item.id}/edit`}
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Editar artículo
                </Link>
              </div>

              {showEntryForm && (
                <form onSubmit={handleMovementSubmit} className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      name="movement_type"
                      value={movementForm.movement_type}
                      onChange={handleMovementChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="entry">Entrada</option>
                      <option value="exit">Salida</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      value={movementForm.quantity}
                      onChange={handleMovementChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Documento</label>
                    <select
                      name="document_type"
                      value={movementForm.document_type}
                      onChange={handleMovementChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número</label>
                    <input
                      name="document_number"
                      value={movementForm.document_number}
                      onChange={handleMovementChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                    <input
                      name="notes"
                      value={movementForm.notes}
                      onChange={handleMovementChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Archivo (opcional)</label>
                    <input
                      type="file"
                      name="document_file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleMovementChange}
                      className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
                  >
                    Guardar movimiento
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
