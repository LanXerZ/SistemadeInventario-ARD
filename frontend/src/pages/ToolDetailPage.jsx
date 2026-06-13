import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { toolApi } from '../services/toolApi'
import { useAuth } from '../context/AuthContext'
import AuditHistoryTab from '../components/AuditHistoryTab'

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

export default function ToolDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  const [tool, setTool] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [loanForm, setLoanForm] = useState({
    technician: '',
    expected_return_days: 1,
    notes: '',
  })
  const [showDisposeForm, setShowDisposeForm] = useState(false)
  const [activeTab, setActiveTab] = useState('loans')
  const [disposeReason, setDisposeReason] = useState('')

  useEffect(() => {
    fetchTool()
    fetchTechnicians()
  }, [id])

  const fetchTool = async () => {
    try {
      const { data } = await toolApi.getTool(id)
      setTool(data)
    } catch (error) {
      toast.error('Error al cargar la herramienta')
      navigate('/tools')
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const { data } = await toolApi.getTechnicians()
      setTechnicians(data.results || data)
    } catch (error) {
      console.error('Failed to fetch technicians', error)
    }
  }

  const handleLoan = async (e) => {
    e.preventDefault()
    try {
      await toolApi.loanTool(id, {
        technician: Number(loanForm.technician),
        expected_return_days: Number(loanForm.expected_return_days),
        notes: loanForm.notes,
      })
      toast.success('Herramienta prestada')
      setShowLoanForm(false)
      setLoanForm({ technician: '', expected_return_days: 1, notes: '' })
      fetchTool()
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al prestar herramienta'
      toast.error(message)
    }
  }

  const handleReturn = async () => {
    try {
      await toolApi.returnTool(id)
      toast.success('Herramienta devuelta')
      fetchTool()
    } catch (error) {
      toast.error('Error al devolver herramienta')
    }
  }

  const handleDispose = async (e) => {
    e.preventDefault()
    try {
      await toolApi.disposeTool(id, { reason: disposeReason })
      toast.success('Herramienta dada de baja')
      setShowDisposeForm(false)
      fetchTool()
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al dar de baja'
      toast.error(message)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  if (!tool) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/tools"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{tool.name}</h2>
          <p className="text-gray-600 mt-1">{tool.code}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[tool.status]}`}>
          {statusLabels[tool.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                <dd className="mt-1 text-sm text-gray-900">{tool.tool_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Marca</dt>
                <dd className="mt-1 text-sm text-gray-900">{tool.brand || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Modelo</dt>
                <dd className="mt-1 text-sm text-gray-900">{tool.model || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial</dt>
                <dd className="mt-1 text-sm text-gray-900">{tool.serial || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1 text-sm text-gray-900">{tool.description || '—'}</dd>
              </div>
              {tool.status === 'disposed' && (
                <>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Motivo de baja</dt>
                    <dd className="mt-1 text-sm text-gray-900">{tool.disposal_reason || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de baja</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(tool.disposal_date).toLocaleDateString('es-DO')}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('loans')}
                  className={`w-1/2 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'loans'
                      ? 'border-brand-800 text-brand-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Préstamos
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`w-1/2 py-4 px-1 text-center border-b-2 text-sm font-medium ${
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
              {activeTab === 'loans' ? (
                tool.loans.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay préstamos registrados.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Técnico</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Devolución esperada</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Devuelto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tool.loans.map((loan) => (
                        <tr key={loan.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(loan.loaned_at).toLocaleDateString('es-DO')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{loan.technician_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(loan.expected_return_at).toLocaleDateString('es-DO')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {loan.returned_at
                              ? new Date(loan.returned_at).toLocaleDateString('es-DO')
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {loan.is_overdue ? (
                              <span className="text-red-600 font-medium">Vencido</span>
                            ) : loan.returned_at ? (
                              <span className="text-green-600">Devuelto</span>
                            ) : (
                              <span className="text-blue-600">Activo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                <AuditHistoryTab modelName="tools.tool" objectId={tool.id} />
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
              <div className="space-y-3">
                <Link
                  to={`/tools/${tool.id}/edit`}
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Editar herramienta
                </Link>

                {tool.status === 'available' && (
                  <button
                    onClick={() => setShowLoanForm(!showLoanForm)}
                    className="w-full rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
                  >
                    Prestar herramienta
                  </button>
                )}

                {tool.status === 'loaned' && (
                  <button
                    onClick={handleReturn}
                    className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                  >
                    Registrar devolución
                  </button>
                )}

                {tool.status === 'available' && (
                  <button
                    onClick={() => setShowDisposeForm(!showDisposeForm)}
                    className="w-full rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                  >
                    Dar de baja
                  </button>
                )}
              </div>

              {showLoanForm && (
                <form onSubmit={handleLoan} className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Técnico</label>
                    <select
                      value={loanForm.technician}
                      onChange={(e) => setLoanForm({ ...loanForm, technician: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Seleccione...</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Días hasta devolución</label>
                    <input
                      type="number"
                      min="1"
                      value={loanForm.expected_return_days}
                      onChange={(e) => setLoanForm({ ...loanForm, expected_return_days: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                    <input
                      value={loanForm.notes}
                      onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
                  >
                    Guardar préstamo
                  </button>
                </form>
              )}

              {showDisposeForm && (
                <form onSubmit={handleDispose} className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Motivo de baja</label>
                    <textarea
                      value={disposeReason}
                      onChange={(e) => setDisposeReason(e.target.value)}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                  >
                    Confirmar baja
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
