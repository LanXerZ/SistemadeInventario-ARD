import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowDownTrayIcon, ArrowPathIcon, XMarkIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, DocumentArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { inventoryApi } from '../services/inventoryApi'
import { downloadBlob } from '../utils/download'
import { useAuth } from '../context/AuthContext'

const stateStyles = {
  asignado: 'bg-amber-100 text-amber-800 border-amber-200',
  available: 'bg-green-100 text-green-800 border-green-200',
  maintenance: 'bg-blue-100 text-blue-800 border-blue-200',
  disposed: 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function AsignacionesActivasPage() {
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false)
  const [search, setSearch] = useState('')

  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [receivingUnit, setReceivingUnit] = useState(null)
  const [finalStatus, setFinalStatus] = useState('available')
  const [receiveNotes, setReceiveNotes] = useState('')

  const [showExtendModal, setShowExtendModal] = useState(false)
  const [extendingLoan, setExtendingLoan] = useState(null)
  const [extendDays, setExtendDays] = useState(7)

  useEffect(() => {
    if (canEdit) fetchLoans()
  }, [canEdit, showOnlyOverdue])

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const params = { returned_at: 'null' }
      if (showOnlyOverdue) params.overdue = 'true'
      const { data } = await inventoryApi.getItemLoans(params)
      setLoans(data.results || data)
    } catch (err) {
      toast.error('Error al cargar asignaciones')
    } finally {
      setLoading(false)
    }
  }

  const filtered = loans.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.item_unit_detail?.item_name?.toLowerCase().includes(q) ||
      l.item_unit_detail?.serial_number?.toLowerCase().includes(q) ||
      l.loaned_to_name?.toLowerCase().includes(q) ||
      l.loaned_to_user?.name?.toLowerCase().includes(q)
    )
  })

  const openReceiveModal = (loan) => {
    setReceivingUnit(loan.item_unit_detail)
    setFinalStatus('available')
    setReceiveNotes('')
    setShowReceiveModal(true)
  }

  const handleDownloadReport = async (format, statusFilter, overdueOnly) => {
    try {
      const params = { type: format, status: statusFilter }
      if (overdueOnly) params.overdue = 'true'
      const response = await inventoryApi.downloadLoansReport(params)
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      const suffix = statusFilter === 'active' ? (overdueOnly ? 'vencidos' : 'activos') : 'historico'
      downloadBlob(response, `asignaciones_${suffix}_${new Date().toISOString().slice(0, 10)}.${extension}`)
    } catch (err) {
      toast.error('Error al generar el reporte')
    }
  }

  const [showReportMenu, setShowReportMenu] = useState(false)

  useEffect(() => {
    if (!showReportMenu) return
    function handleClick(e) {
      if (e.target.closest('[data-report-menu]')) return
      setShowReportMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showReportMenu])

  const handleReceive = async () => {
    if (!receivingUnit) return
    if (finalStatus !== 'available' && !receiveNotes.trim()) {
      toast.error('Indique el motivo para cambiar el estado final.')
      return
    }
    try {
      await inventoryApi.receiveUnit(receivingUnit.id, {
        final_status: finalStatus,
        notes: receiveNotes,
      })
      toast.success('Devolución registrada. La unidad vuelve al inventario.')
      setShowReceiveModal(false)
      setReceivingUnit(null)
      setFinalStatus('available')
      setReceiveNotes('')
      fetchLoans()
    } catch (err) {
      const detail = err.response?.data?.detail || 'Error al recibir la devolución'
      toast.error(detail)
    }
  }

  const openExtendModal = (loan) => {
    setExtendingLoan(loan)
    setExtendDays(7)
    setShowExtendModal(true)
  }

  const handleExtend = async () => {
    if (!extendingLoan) return
    if (extendDays < 1 || extendDays > 365) {
      toast.error('Días debe estar entre 1 y 365.')
      return
    }
    try {
      await inventoryApi.extendItemLoan(extendingLoan.id, extendDays)
      toast.success(`Préstamo extendido por ${extendDays} días.`)
      setShowExtendModal(false)
      setExtendingLoan(null)
      fetchLoans()
    } catch (err) {
      const detail = err.response?.data?.detail || 'Error al renovar'
      toast.error(detail)
    }
  }

  if (!canEdit) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-700">
          No tiene permisos para acceder a esta página.
        </p>
      </div>
    )
  }

  const overdueCount = loans.filter((l) => l.is_overdue).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asignaciones Activas</h2>
          <p className="mt-1 text-sm text-gray-500">
            {loans.length} unidad(es) física(s) prestada(s){' '}
            {overdueCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {overdueCount} vencida(s)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" data-report-menu>
            <button
              onClick={() => setShowReportMenu((s) => !s)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Reportes
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            {showReportMenu && (
              <div className="absolute right-0 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg z-10">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  Asignaciones activas
                </div>
                <button
                  onClick={() => { handleDownloadReport('pdf', 'active', false); setShowReportMenu(false) }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  📄 PDF — Todas las activas
                </button>
                <button
                  onClick={() => { handleDownloadReport('excel', 'active', false); setShowReportMenu(false) }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  📊 Excel — Todas las activas
                </button>
                <button
                  onClick={() => { handleDownloadReport('pdf', 'active', true); setShowReportMenu(false) }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700"
                >
                  ⚠️ PDF — Solo vencidas
                </button>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-y border-gray-100">
                  Histórico
                </div>
                <button
                  onClick={() => { handleDownloadReport('pdf', 'all', false); setShowReportMenu(false) }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  📄 PDF — Histórico completo
                </button>
                <button
                  onClick={() => { handleDownloadReport('excel', 'all', false); setShowReportMenu(false) }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  📊 Excel — Histórico completo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por item, serial o solicitante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showOnlyOverdue}
            onChange={(e) => setShowOnlyOverdue(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-700"
          />
          Solo vencidos
        </label>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {showOnlyOverdue
              ? 'No hay asignaciones vencidas.'
              : 'No hay asignaciones activas. Todas las unidades están en el inventario.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Serial</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Asignado a</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Préstamo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Devolución esperada</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Días</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((loan) => {
                const unit = loan.item_unit_detail || {}
                const loanedTo = loan.loaned_to_name || (loan.loaned_to_user && loan.loaned_to_user.name) || '—'
                const daysOverdue = loan.is_overdue
                  ? Math.ceil((Date.now() - new Date(loan.expected_return_at)) / 86400000)
                  : null
                const daysRemaining = !loan.is_overdue
                  ? Math.ceil((new Date(loan.expected_return_at) - Date.now()) / 86400000)
                  : null
                return (
                  <tr key={loan.id} className={`hover:bg-gray-50 ${loan.is_overdue ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      {unit.item ? (
                        <Link to={`/inventory/${unit.item}`} className="font-medium text-brand-800 hover:underline">
                          {unit.item_name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{unit.serial_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-medium">{loanedTo}</span>
                      {loan.loaned_by_name && (
                        <p className="text-xs text-gray-500">por {loan.loaned_by_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(loan.loaned_at).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(loan.expected_return_at).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {loan.is_overdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Vence hace {daysOverdue}d
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          {daysRemaining}d restantes
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openReceiveModal(loan)}
                          className="inline-flex items-center gap-1 rounded-md bg-brand-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-900"
                          title="Recibir devolución de la unidad"
                        >
                          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                          Recibir
                        </button>
                        <button
                          onClick={() => openExtendModal(loan)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          title="Renovar el préstamo"
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                          Renovar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showReceiveModal && receivingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recibir devolución: {receivingUnit.serial_number}
              </h3>
              <button onClick={() => { setShowReceiveModal(false); setReceivingUnit(null) }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              La unidad está actualmente asignada a{' '}
              <span className="font-medium text-gray-900">
                {receivingUnit.active_loan?.recipient?.name || '—'}
              </span>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado final de la unidad</label>
              <div className="space-y-2">
                {[
                  { value: 'available', label: 'Disponible (vuelve al inventario)' },
                  { value: 'maintenance', label: 'En Reparación' },
                  { value: 'disposed', label: 'Descargado (baja definitiva)' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="finalStatus"
                      value={opt.value}
                      checked={finalStatus === opt.value}
                      onChange={() => setFinalStatus(opt.value)}
                      className="h-4 w-4 text-brand-800 focus:ring-brand-700"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Motivo {finalStatus !== 'available' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder={
                  finalStatus === 'maintenance'
                    ? 'Ej: Necesita calibración'
                    : finalStatus === 'disposed'
                    ? 'Ej: Daño irreparable, fuera de servicio'
                    : 'Notas opcionales sobre la devolución'
                }
                required={finalStatus !== 'available'}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setShowReceiveModal(false); setReceivingUnit(null) }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReceive}
                className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                Confirmar recepción
              </button>
            </div>
          </div>
        </div>
      )}

      {showExtendModal && extendingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Renovar préstamo</h3>
              <button onClick={() => { setShowExtendModal(false); setExtendingLoan(null) }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              <span className="font-medium">{extendingLoan.item_unit_detail?.item_name}</span>{' '}
              <span className="font-mono text-gray-500">({extendingLoan.item_unit_detail?.serial_number})</span>
            </p>
            <p className="mb-4 text-sm text-gray-600">
              Devolución esperada actual:{' '}
              <span className="font-medium">{new Date(extendingLoan.expected_return_at).toLocaleDateString('es-DO')}</span>
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700">Días a extender</label>
              <input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Nueva fecha esperada:{' '}
                <span className="font-medium">
                  {new Date(new Date(extendingLoan.expected_return_at).getTime() + extendDays * 86400000).toLocaleDateString('es-DO')}
                </span>
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setShowExtendModal(false); setExtendingLoan(null) }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExtend}
                className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                Renovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
