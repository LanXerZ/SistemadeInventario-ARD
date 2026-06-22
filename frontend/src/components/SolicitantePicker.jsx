import { useState, useEffect, useRef } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { solicitanteApi } from '../services/workOrderApi'
import { inventoryApi } from '../services/inventoryApi'

export default function SolicitantePicker({ value, onChange, disabled = false }) {
  const [solicitantes, setSolicitantes] = useState([])
  const [query, setQuery] = useState('')
  const [showList, setShowList] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({ name: '', rank: '', unit: '', agent_id: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (value && typeof value === 'object') {
      setQuery(value.full_name || value.name)
    } else if (!value) {
      setQuery('')
    }
  }, [value])

  useEffect(() => {
    if (showModal) {
      inventoryApi.getLocations().then((r) => setLocations(r.data.results || r.data))
    }
  }, [showModal])

  useEffect(() => {
    if (showList && query.length >= 1) {
      solicitanteApi.search(query).then((r) => setSolicitantes(r.data || []))
    } else {
      setSolicitantes([])
    }
  }, [query, showList])

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowList(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (sol) => {
    onChange(sol)
    setQuery(sol.full_name || sol.name)
    setShowList(false)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.unit) delete payload.unit
      const { data } = await solicitanteApi.create(payload)
      toast.success('Solicitante creado')
      setShowModal(false)
      setForm({ name: '', rank: '', unit: '', agent_id: '', notes: '' })
      handleSelect(data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al crear el solicitante'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowList(true)
              if (!e.target.value) onChange(null)
            }}
            onFocus={() => setShowList(true)}
            disabled={disabled}
            placeholder="Buscar solicitante por nombre o rango..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
          />
          {showList && solicitantes.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {solicitantes.map((s) => (
                <li
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-brand-50"
                >
                  <span className="font-medium">{s.rank ? `${s.rank} ` : ''}{s.name}</span>
                  {s.unit && <span className="ml-2 text-xs text-gray-500">— {typeof s.unit === 'object' ? s.unit.name : s.unit}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nuevo solicitante</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Rango / Grado</label>
                <input
                  type="text"
                  value={form.rank}
                  onChange={(e) => setForm({ ...form, rank: e.target.value })}
                  placeholder="Ej: Capitán de Navío"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Unidad / Base</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value || '' })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">— Sin unidad —</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.breadcrumb || loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Cédula / ID</label>
                <input
                  type="text"
                  value={form.agent_id}
                  onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
