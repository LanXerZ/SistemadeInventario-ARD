import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, DocumentArrowDownIcon, WrenchScrewdriverIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { inventoryApi, getMediaUrl } from '../services/inventoryApi'
import { downloadBlob } from '../utils/download'
import { useAuth } from '../context/AuthContext'

const unitStateStyle = {
  available: 'bg-green-100 text-green-800 border-green-200',
  asignado: 'bg-amber-100 text-amber-800 border-amber-200',
  maintenance: 'bg-blue-100 text-blue-800 border-blue-200',
  disposed: 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [unitsByItem, setUnitsByItem] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [kindFilter, setKindFilter] = useState(() => new URLSearchParams(window.location.search).get('kind') || '')
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  useEffect(() => {
    fetchCategories()
    fetchLocations()
    fetchItems()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const k = params.get('kind')
    if (k) setKindFilter(k)
  }, [])

  const fetchCategories = async () => {
    try {
      const { data } = await inventoryApi.getCategories()
      setCategories(data.results || data)
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const { data } = await inventoryApi.getLocations()
      setLocations(data.results || data)
    } catch (error) {
      console.error('Failed to fetch locations', error)
    }
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      if (locationFilter) params.location = locationFilter
      if (kindFilter) params.kind = kindFilter
      const { data } = await inventoryApi.getItems(params)
      setItems(data.results || data)

      const toolItems = (data.results || data).filter((i) => i.track_by_serial)
      const unitsMap = {}
      await Promise.all(
        toolItems.map(async (item) => {
          try {
            const r = await inventoryApi.getItemUnits({ item: item.id, page_size: 50 })
            unitsMap[item.id] = r.data.results || r.data
          } catch {
            unitsMap[item.id] = []
          }
        })
      )
      setUnitsByItem(unitsMap)
    } catch (error) {
      toast.error('Error al cargar el inventario')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este artículo?')) return
    try {
      await inventoryApi.deleteItem(id)
      toast.success('Artículo eliminado')
      fetchItems()
    } catch (error) {
      toast.error('Error al eliminar el artículo')
    }
  }

  const handleDownloadReport = async (format, filters = {}, suffix = 'completo') => {
    try {
      const response = await inventoryApi.downloadInventoryReport(format, filters)
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(response, `inventario_${suffix}_${new Date().toISOString().slice(0, 10)}.${extension}`)
    } catch (error) {
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

  const isToolKind = (item) => item.kind === 'herramienta' && item.track_by_serial

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
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
                  <div className="absolute right-0 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg z-10">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                      Inventario completo
                    </div>
                    <button
                      onClick={() => { handleDownloadReport('pdf', {}, 'completo'); setShowReportMenu(false) }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      📄 PDF completo
                    </button>
                    <button
                      onClick={() => { handleDownloadReport('excel', {}, 'completo'); setShowReportMenu(false) }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      📊 Excel completo
                    </button>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-y border-gray-100">
                      Stock crítico
                    </div>
                    <button
                      onClick={() => { handleDownloadReport('pdf', { critical: 'true' }, 'critico'); setShowReportMenu(false) }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700"
                    >
                      ⚠️ PDF stock crítico
                    </button>
                    <button
                      onClick={() => { handleDownloadReport('excel', { critical: 'true' }, 'critico'); setShowReportMenu(false) }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700"
                    >
                      ⚠️ Excel stock crítico
                    </button>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-y border-gray-100">
                      Herramientas / Instrumentos
                    </div>
                    <button
                      onClick={() => { handleDownloadReport('pdf', { kind: 'herramienta' }, 'herramientas'); setShowReportMenu(false) }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      🔧 PDF herramientas
                    </button>
                    <button
                      onClick={() => { handleDownloadReport('excel', { kind: 'herramienta' }, 'herramientas'); setShowReportMenu(false) }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      🔧 Excel herramientas
                    </button>
                  </div>
                )}
              </div>
              <Link
                to="/inventory/new"
                className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                <PlusIcon className="h-4 w-4" />
                Nuevo artículo
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
            placeholder="Buscar por nombre, SKU, número de parte o aplicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
          />
        </div>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        >
          <option value="">Todos los tipos</option>
          <option value="consumible">Consumibles / Repuestos</option>
          <option value="herramienta">Herramientas / Instrumentos</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        >
          <option value="">Todas las ubicaciones</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.breadcrumb || loc.name}
            </option>
          ))}
        </select>
        <button
          onClick={fetchItems}
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
                  Foto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Artículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Marca/Modelo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ubicación
                </th>
                {kindFilter === 'herramienta' ? (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                  </>
                )}
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => {
                const isTool = isToolKind(item)
                if (isTool) {
                  const units = unitsByItem[item.id] || []
                  return (
                    <ToolRow
                      key={item.id}
                      item={item}
                      units={units}
                      canEdit={canEdit}
                      onDelete={handleDelete}
                    />
                  )
                }
                return (
                  <ConsumibleRow
                    key={item.id}
                    item={item}
                    canEdit={canEdit}
                    onDelete={handleDelete}
                  />
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={canEdit ? 9 : 8}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No se encontraron artículos.
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

function ConsumibleRow({ item, canEdit, onDelete }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        {item.image_url ? (
          <img
            src={getMediaUrl(item.image_url)}
            alt={item.name}
            className="h-12 w-12 rounded-md object-cover border border-gray-200"
          />
        ) : (
          <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            Sin foto
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <Link
          to={`/inventory/${item.id}`}
          className="font-medium text-brand-800 hover:underline"
        >
          {item.name}
        </Link>
        <p className="text-sm text-gray-500 font-mono">
          {item.code || '—'}
          {item.sku && <span className="ml-2">| SKU: {item.sku}</span>}
        </p>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">{item.category_name}</td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {item.marca || '—'}
        {item.modelo && <span className="text-gray-500"> / {item.modelo}</span>}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">{item.location_display || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{item.kind_display}</td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {item.quantity} {item.unit}
      </td>
      <td className="px-6 py-4">
        {item.is_critical ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Crítico
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            OK
          </span>
        )}
      </td>
      {canEdit && (
        <td className="px-6 py-4 text-right text-sm font-medium">
          <Link to={`/inventory/${item.id}/edit`} className="text-brand-700 hover:text-brand-900">
            Editar
          </Link>
          <button
            onClick={() => onDelete(item.id)}
            className="ml-4 text-red-600 hover:text-red-900"
          >
            Eliminar
          </button>
        </td>
      )}
    </tr>
  )
}

function ToolRow({ item, units, canEdit, onDelete }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 align-top" rowSpan={Math.max(1, units.length)}>
        {item.image_url ? (
          <img
            src={getMediaUrl(item.image_url)}
            alt={item.name}
            className="h-12 w-12 rounded-md object-cover border border-gray-200"
          />
        ) : (
          <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            <WrenchScrewdriverIcon className="h-5 w-5" />
          </div>
        )}
      </td>
      <td className="px-6 py-4 align-top" rowSpan={Math.max(1, units.length)}>
        <Link
          to={`/inventory/${item.id}`}
          className="font-medium text-brand-800 hover:underline"
        >
          {item.name}
        </Link>
        <p className="text-sm text-gray-500 font-mono">
          {item.code || '—'}
          {item.sku && <span className="ml-2">| SKU: {item.sku}</span>}
        </p>
        <p className="text-xs text-gray-500">{item.marca} {item.modelo}</p>
      </td>
      <td className="px-6 py-4 align-top text-sm text-gray-900" rowSpan={Math.max(1, units.length)}>
        {item.category_name}
      </td>
      <td className="px-6 py-4 align-top text-sm text-gray-900" rowSpan={Math.max(1, units.length)}>
        {item.location_display || '—'}
      </td>
      <td className="px-6 py-4 align-top text-sm text-gray-900" rowSpan={Math.max(1, units.length)}>
        {item.kind_display}
      </td>
      {units.length === 0 ? (
        <td colSpan={canEdit ? 2 : 1} className="px-6 py-4 text-sm text-gray-500 italic">
          Sin unidades registradas
          {canEdit && (
            <Link to={`/inventory/${item.id}`} className="ml-3 text-brand-700 text-sm hover:underline">
              Agregar
            </Link>
          )}
        </td>
      ) : (
        units.map((u, idx) => (
          <td key={u.id} className="px-6 py-2 text-sm border-l border-gray-100">
            {idx === 0 ? null : null}
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-900">{u.serial_number}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${unitStateStyle[u.status] || 'bg-gray-100'}`}>
                {u.status_display}
              </span>
            </div>
            {u.active_loan?.recipient?.name && (
              <p className="text-xs text-gray-500">Asignado a: {u.active_loan.recipient.name}</p>
            )}
          </td>
        ))
      )}
      {canEdit && (
        <td className="px-6 py-4 align-top text-right text-sm font-medium" rowSpan={Math.max(1, units.length)}>
          <Link to={`/inventory/${item.id}/edit`} className="text-brand-700 hover:text-brand-900">
            Editar
          </Link>
          <button
            onClick={() => onDelete(item.id)}
            className="ml-4 text-red-600 hover:text-red-900"
          >
            Eliminar
          </button>
        </td>
      )}
    </tr>
  )
}
