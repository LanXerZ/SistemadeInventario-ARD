import React, { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { inventoryApi } from '../services/inventoryApi'
import { useAuth } from '../context/AuthContext'

const LOCATION_TYPES = [
  { value: 'taller', label: 'Taller de Electrónica' },
  { value: 'base_naval', label: 'Base Naval' },
  { value: 'unidad_naval', label: 'Unidad Naval' },
  { value: 'comandancia', label: 'Comandancia / Capitanía' },
  { value: 'destacamento', label: 'Destacamento / Puesto' },
]

const PARENT_TYPE_MAP = {
  base_naval: null,
  unidad_naval: 'base_naval',
  comandancia: null,
  destacamento: 'comandancia',
  taller: null,
}

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

function LocationNode({ node, level = 0, onEdit, onDelete, onAddChild, canEdit }) {
  const [open, setOpen] = useState(level < 2)
  const hasChildren = node.children && node.children.length > 0
  return (
    <div>
      <div
        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md border-l-4 border-transparent hover:border-brand-500"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="text-gray-400 hover:text-gray-700"
            >
              {open ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
          {node.codigo && (
            <span className="text-xs font-mono text-gray-500">({node.codigo})</span>
          )}
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass(node.location_type)}`}>
            {typeLabel(node.location_type)}
          </span>
          {node.items_count > 0 && (
            <span className="text-xs text-gray-500">
              · {node.items_count} artículo{node.items_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {PARENT_TYPE_MAP[node.location_type] && (
              <button
                type="button"
                onClick={() => onAddChild(node)}
                className="text-xs text-brand-700 hover:text-brand-900"
                title="Agregar sub-ubicación"
              >
                <PlusIcon className="h-4 w-4 inline" /> Sub
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="text-gray-500 hover:text-brand-700"
              title="Editar"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(node)}
              className="text-gray-500 hover:text-red-600"
              title="Eliminar"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <LocationNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function LocationsPage() {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [parentForNew, setParentForNew] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    codigo: '',
    location_type: 'base_naval',
    parent: '',
  })
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'almacenista'

  useEffect(() => {
    fetchTree()
  }, [])

  const fetchTree = async () => {
    setLoading(true)
    try {
      const { data } = await inventoryApi.getLocationTree()
      setTree(data)
    } catch (err) {
      toast.error('Error al cargar ubicaciones')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = (presetParent = null) => {
    setEditingLocation(null)
    setParentForNew(presetParent)
    setFormData({
      name: '',
      codigo: '',
      location_type: presetParent ? 'unidad_naval' : 'taller',
      parent: presetParent ? presetParent.id : '',
    })
    setModalOpen(true)
  }

  const openEditModal = (location) => {
    setEditingLocation(location)
    setParentForNew(null)
    setFormData({
      name: location.name,
      codigo: location.codigo || '',
      location_type: location.location_type,
      parent: location.parent || '',
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
      if (formData.parent) {
        payload.parent = formData.parent
      } else {
        payload.parent = null
      }
      if (editingLocation) {
        await inventoryApi.updateLocation(editingLocation.id, payload)
        toast.success('Ubicación actualizada')
      } else {
        await inventoryApi.createLocation(payload)
        toast.success('Ubicación creada')
      }
      setModalOpen(false)
      fetchTree()
    } catch (err) {
      const msg = err.response?.data?.parent?.[0]
        || err.response?.data?.name?.[0]
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
      fetchTree()
    } catch (err) {
      const msg = err.response?.data?.detail
        || 'No se puede eliminar: la ubicación tiene artículos o sub-ubicaciones asociadas.'
      toast.error(msg)
    }
  }

  const parentOptions = useMemo(() => {
    if (!formData.location_type) return []
    const requiredType = PARENT_TYPE_MAP[formData.location_type]
    if (!requiredType) return []
    return tree
      .filter(n => n.location_type === requiredType)
      .flatMap(n => [n, ...(n.children || [])])
      .filter(n => n.location_type === requiredType)
  }, [formData.location_type, tree])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ubicaciones</h2>
          <p className="mt-1 text-sm text-gray-600">
            Jerarquía institucional: Taller → Bases Navales → Unidades / Comandancias → Destacamentos
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => openCreateModal(null)}
            className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva ubicación
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : tree.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No hay ubicaciones registradas.</p>
          {canEdit && (
            <button
              onClick={() => openCreateModal(null)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
            >
              <PlusIcon className="h-4 w-4" />
              Crear primera ubicación
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center justify-between" style={{ paddingLeft: '12px' }}>
              <span>Ubicación</span>
              <span>Acciones</span>
            </div>
          </div>
          <div className="p-2">
            {tree.map((node) => (
              <LocationNode
                key={node.id}
                node={node}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onAddChild={(parent) => openCreateModal(parent)}
                canEdit={canEdit}
              />
            ))}
          </div>
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
                  onChange={(e) => setFormData({
                    ...formData,
                    location_type: e.target.value,
                    parent: '',
                  })}
                  disabled={Boolean(editingLocation)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700 disabled:bg-gray-100"
                >
                  {LOCATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {editingLocation && (
                  <p className="mt-1 text-xs text-gray-500">El tipo no se puede modificar.</p>
                )}
              </div>
              {PARENT_TYPE_MAP[formData.location_type] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {typeLabel(PARENT_TYPE_MAP[formData.location_type])} superior <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
                  >
                    <option value="">Seleccione {typeLabel(PARENT_TYPE_MAP[formData.location_type])}...</option>
                    {parentOptions.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}
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
