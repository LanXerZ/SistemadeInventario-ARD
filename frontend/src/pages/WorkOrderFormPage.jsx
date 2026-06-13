import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { workOrderApi } from '../services/workOrderApi'

const statusChoices = [
  { value: 'received', label: 'Recibido' },
  { value: 'in_diagnosis', label: 'En diagnóstico' },
  { value: 'waiting_parts', label: 'Esperando repuestos' },
  { value: 'in_repair', label: 'En reparación' },
  { value: 'ready', label: 'Listo para entregar' },
  { value: 'delivered', label: 'Entregado' },
]

export default function WorkOrderFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(isEditing)
  const [formData, setFormData] = useState({
    origin_unit: '',
    delivery_officer_name: '',
    delivery_officer_rank: '',
    equipment_brand: '',
    equipment_model: '',
    equipment_serial: '',
    equipment_description: '',
    reported_failure: '',
    diagnosis: '',
    replaced_parts_note: '',
    technician: '',
    status: 'received',
  })

  useEffect(() => {
    fetchTechnicians()
    if (isEditing) {
      fetchWorkOrder()
    }
  }, [id])

  const fetchTechnicians = async () => {
    try {
      const { data } = await workOrderApi.getTechnicians()
      setTechnicians(data.results || data)
    } catch (error) {
      console.error('Failed to fetch technicians', error)
    }
  }

  const fetchWorkOrder = async () => {
    try {
      const { data } = await workOrderApi.getWorkOrder(id)
      setFormData({
        origin_unit: data.origin_unit,
        delivery_officer_name: data.delivery_officer_name,
        delivery_officer_rank: data.delivery_officer_rank || '',
        equipment_brand: data.equipment_brand || '',
        equipment_model: data.equipment_model || '',
        equipment_serial: data.equipment_serial || '',
        equipment_description: data.equipment_description,
        reported_failure: data.reported_failure || '',
        diagnosis: data.diagnosis || '',
        replaced_parts_note: data.replaced_parts_note || '',
        technician: data.technician,
        status: data.status,
      })
    } catch (error) {
      toast.error('Error al cargar la orden de trabajo')
      navigate('/workorders')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        technician: Number(formData.technician),
      }

      if (isEditing) {
        await workOrderApi.updateWorkOrder(id, payload)
        toast.success('Orden de trabajo actualizada')
      } else {
        await workOrderApi.createWorkOrder(payload)
        toast.success('Orden de trabajo creada')
      }

      navigate('/workorders')
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).flat().join(', ') ||
        'Error al guardar la orden de trabajo'
      toast.error(message)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Editar orden de trabajo' : 'Nueva orden de trabajo'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Unidad de origen</label>
            <input
              name="origin_unit"
              value={formData.origin_unit}
              onChange={handleChange}
              required
              placeholder="Ej: BA-1101"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Oficial que entrega</label>
            <input
              name="delivery_officer_name"
              value={formData.delivery_officer_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Grado del oficial</label>
            <input
              name="delivery_officer_rank"
              value={formData.delivery_officer_rank}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Técnico asignado</label>
            <select
              name="technician"
              value={formData.technician}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
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
            <label className="block text-sm font-medium text-gray-700">Marca</label>
            <input
              name="equipment_brand"
              value={formData.equipment_brand}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Modelo</label>
            <input
              name="equipment_model"
              value={formData.equipment_model}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Serial</label>
            <input
              name="equipment_serial"
              value={formData.equipment_serial}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            >
              {statusChoices.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción del equipo</label>
            <textarea
              name="equipment_description"
              value={formData.equipment_description}
              onChange={handleChange}
              required
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Fallo reportado</label>
            <textarea
              name="reported_failure"
              value={formData.reported_failure}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Repuestos reemplazados</label>
            <textarea
              name="replaced_parts_note"
              value={formData.replaced_parts_note}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-700 focus:outline-none focus:ring-brand-700"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            {isEditing ? 'Guardar cambios' : 'Crear orden de trabajo'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/workorders')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
