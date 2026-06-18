import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { inventoryApi } from '../services/inventoryApi'
import { useAuth } from '../context/AuthContext'

const LOCATION_TYPES = [
  { value: 'taller', label: 'Taller de Electrónica' },
  { value: 'base_naval', label: 'Base Naval' },
  { value: 'unidad_naval', label: 'Unidad Naval' },
  { value: 'comandancia', label: 'Comandancia / Capitanía' },
  { value: 'destacamento', label: 'Destacamento / Puesto' },
]

const typeLabel = (value) => LOCATION_TYPES.find(t => t.value === value)?.label || value
const typeBadgeClass = (value) => {
  const map = {
    taller: 'bg-indigo-100 text-indigo-800',
    base_naval: 'bg-blue-100 text-blue-800',
    unidad_naval: 'bg-cyan-100 text-cyan-800',
    comandancia: 'bg-purple-100 text-purple-800',
    destacamento: 'bg-amber-100 text-amber-800',
  }
  return map[value] || 'bg-gray-100 text-gray-800'
}

export default function LocationsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    codigo: '',
    location_type: 'taller',
  })
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const { data } = await inventoryApi.getLocations()
      setLocations(data.results || data)
    } catch (err) {
      toast.error('Error al cargar ubicaciones')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingLocation(null)
    setFormData({ name: '', codigo: '', location_type: 'taller' })
    setModalOpen(true)
  }

  const openEditModal = (location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      codigo: location.codigo || '',
      location_type: location.location_type,
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        codigo: formData.codigo || '',
        location_type: formData.location_type,
      }
      if (editingLocation) {
        await inventoryApi.updateLocation(editingLocation.id, payload)
        toast.success('Ubicación actualizada')
      } else {
        await inventoryApi.createLocation(payload)
        toast.success('Ubicación creada')
      }
      setModalOpen(false)
      fetchLocations()
    } catch (err) {
      const msg = err.response?.data?.name?.[0]
        || err.response?.data?.detail
        || 'Error al guardar la ubicación'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (location) => {
    if (!confirm(`¿Eliminar la ubicación "${location.name}"?`)) return
    try {
      await inventoryApi.deleteLocation(location.id)
      toast.success('Ubicación eliminada')
      fetchLocations()
    } catch (err) {
      const msg = err.response?.data?.detail
        || 'No se puede eliminar: la ubicación tiene artículos asociados.'
      toast.error(msg)
    }
  }

  const filteredLocations = locations.filter(loc => {
    if (typeFilter && loc.location_type !== typeFilter) return false
    if (search && !loc.name.toLowerCase().includes(search.toLowerCase()) &&
        !(loc.codigo || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ubicaciones</h2>
          <p className="mt-1 text-sm text-gray-600">
            Lugares donde se almacenan suministros, herramientas y equipos.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva ubicación
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        >
          <option value="">Todos los tipos</option>
          {LOCATION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : filteredLocations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            {locations.length === 0
              ? 'No hay ubicaciones registradas.'
              : 'No hay ubicaciones que coincidan con los filtros.'}
          </p>
          {canEdit && locations.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
            >
              <PlusIcon className="h-4 w-4" />
              Crear primera ubicación
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{loc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {loc.codigo || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass(loc.location_type)}`}>
                      {typeLabel(loc.location_type)}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="text-brand-700 hover:text-brand-900"
                      >
                        <PencilIcon className="h-4 w-4 inline" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(loc)}
                        className="ml-4 text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4 inline" /> Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingLocation ? 'Editar ubicación' : 'Nueva ubicación'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
                >
                  {LOCATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  placeholder="Ej: Base Naval 27 de Febrero"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código interno
                </label>
                <input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Opcional, ej: BN-27F"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700 font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
