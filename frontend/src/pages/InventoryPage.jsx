import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { inventoryApi, getMediaUrl } from '../services/inventoryApi'
import { downloadBlob } from '../utils/download'
import { useAuth } from '../context/AuthContext'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data } = await inventoryApi.getCategories()
      setCategories(data.results || data)
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      const { data } = await inventoryApi.getItems(params)
      setItems(data.results || data)
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

  const handleDownloadReport = async (format) => {
    try {
      const response = await inventoryApi.downloadInventoryReport(format)
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(response, `inventario_${new Date().toISOString().slice(0, 10)}.${extension}`)
    } catch (error) {
      toast.error('Error al generar el reporte')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
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
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stock
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
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
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
                    <p className="text-sm text-gray-500">
                      {item.sku || item.part_number || 'Sin código'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.category_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.location}
                  </td>
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
                      <Link
                        to={`/inventory/${item.id}/edit`}
                        className="text-brand-700 hover:text-brand-900"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="ml-4 text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={canEdit ? 7 : 6}
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
