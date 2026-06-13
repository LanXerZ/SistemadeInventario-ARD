import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { inventoryApi, getMediaUrl } from '../services/inventoryApi'

const documentTypes = [
  { value: 'oficio', label: 'Oficio' },
  { value: 'conduce', label: 'Conduce' },
  { value: 'factura', label: 'Factura' },
  { value: 'directo', label: 'Directo' },
]

export default function ItemFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEditing)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    part_number: '',
    category: '',
    description: '',
    application: '',
    location: '',
    minimum_stock: 0,
    unit: 'unidad',
    is_active: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [initialStock, setInitialStock] = useState({
    quantity: 0,
    document_type: 'directo',
    document_number: '',
    notes: '',
  })

  useEffect(() => {
    fetchCategories()
    if (isEditing) {
      fetchItem()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const { data } = await inventoryApi.getCategories()
      setCategories(data.results || data)
    } catch (error) {
      toast.error('Error al cargar categorías')
    }
  }

  const fetchItem = async () => {
    try {
      const { data } = await inventoryApi.getItem(id)
      setFormData({
        name: data.name,
        sku: data.sku || '',
        part_number: data.part_number || '',
        category: data.category,
        description: data.description || '',
        application: data.application || '',
        location: data.location,
        minimum_stock: data.minimum_stock,
        unit: data.unit,
        is_active: data.is_active,
      })
      if (data.image_url) {
        setImagePreview(getMediaUrl(data.image_url))
      }
    } catch (error) {
      toast.error('Error al cargar el artículo')
      navigate('/inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 2MB')
        e.target.value = ''
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleStockChange = (e) => {
    const { name, value } = e.target
    setInitialStock((prev) => ({ ...prev, [name]: value }))
  }

  const buildFormData = () => {
    const data = new FormData()
    data.append('name', formData.name)
    data.append('sku', formData.sku || '')
    data.append('part_number', formData.part_number || '')
    data.append('category', formData.category)
    data.append('description', formData.description || '')
    data.append('application', formData.application || '')
    data.append('location', formData.location)
    data.append('minimum_stock', Number(formData.minimum_stock))
    data.append('unit', formData.unit)
    data.append('is_active', formData.is_active)
    if (imageFile) {
      data.append('image', imageFile)
    }
    return data
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = buildFormData()

      let itemId = id
      if (isEditing) {
        await inventoryApi.updateItem(id, payload)
        toast.success('Artículo actualizado')
      } else {
        const { data } = await inventoryApi.createItem(payload)
        itemId = data.id
        toast.success('Artículo creado')

        if (Number(initialStock.quantity) > 0) {
          await inventoryApi.createStockMovement({
            item: itemId,
            movement_type: 'entry',
            quantity: Number(initialStock.quantity),
            document_type: initialStock.document_type,
            document_number: initialStock.document_number,
            notes: initialStock.notes,
          })
        }
      }

      navigate('/inventory')
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).flat().join(', ') ||
        'Error al guardar el artículo'
      toast.error(message)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Editar artículo' : 'Nuevo artículo'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SKU</label>
            <input
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Número de parte</label>
            <input
              name="part_number"
              value={formData.part_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            >
              <option value="">Seleccione...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Ej: E-01-A-03"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unidad</label>
            <input
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock mínimo</label>
            <input
              name="minimum_stock"
              type="number"
              min="0"
              value={formData.minimum_stock}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div className="flex items-center h-full pt-6">
            <label className="flex items-center gap-2">
              <input
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-700"
              />
              <span className="text-sm text-gray-700">Activo</span>
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Aplicación</label>
            <input
              name="application"
              value={formData.application}
              onChange={handleChange}
              placeholder="Equipo o sistema donde se aplica"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Foto del activo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-900"
            />
            <p className="mt-1 text-xs text-gray-500">Máximo 2MB. JPG, PNG, GIF.</p>
            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="h-40 w-40 rounded-lg object-cover border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Entrada inicial de stock</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={initialStock.quantity}
                  onChange={handleStockChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de documento</label>
                <select
                  name="document_type"
                  value={initialStock.document_type}
                  onChange={handleStockChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de documento</label>
                <input
                  name="document_number"
                  value={initialStock.document_number}
                  onChange={handleStockChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <input
                  name="notes"
                  value={initialStock.notes}
                  onChange={handleStockChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            {isEditing ? 'Guardar cambios' : 'Crear artículo'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
