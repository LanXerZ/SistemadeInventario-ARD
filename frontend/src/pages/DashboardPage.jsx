import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { inventoryApi } from '../services/inventoryApi'

export default function DashboardPage() {
  const [criticalItems, setCriticalItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCriticalItems()
  }, [])

  const fetchCriticalItems = async () => {
    try {
      const { data } = await inventoryApi.getCriticalItems()
      setCriticalItems(data)
    } catch (error) {
      console.error('Failed to fetch critical items', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inicio</h2>
        <p className="mt-2 text-gray-600">
          Sistema de Inventario del Taller de Electrónica.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-medium text-gray-900">Alertas de stock crítico</h3>
        </div>

        {loading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : criticalItems.length === 0 ? (
          <p className="text-sm text-gray-500">No hay artículos en stock crítico.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Artículo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Ubicación</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {criticalItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm">
                      <Link
                        to={`/inventory/${item.id}`}
                        className="font-medium text-brand-800 hover:underline"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.location}</td>
                    <td className="px-4 py-2 text-sm text-red-600 font-medium">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.minimum_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
