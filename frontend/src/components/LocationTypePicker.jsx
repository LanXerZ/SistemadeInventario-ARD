import { useState, useEffect, useRef } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { inventoryApi } from '../services/inventoryApi'

export default function LocationTypePicker({ value, onChange, disabled = false }) {
  const [types, setTypes] = useState([])
  const [query, setQuery] = useState('')
  const [showList, setShowList] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (value && typeof value === 'object') {
      setQuery(value.name)
    } else if (value && typeof value === 'string') {
      setQuery(value)
    } else if (!value) {
      setQuery('')
    }
  }, [value])

  useEffect(() => {
    if (showList && query.length >= 1) {
      inventoryApi.getLocationTypes({ search: query }).then((r) => setTypes(r.data || []))
    } else if (showList) {
      inventoryApi.getLocationTypes({}).then((r) => setTypes(r.data || []))
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

  const handleSelect = (t) => {
    onChange(t.id)
    setQuery(t.name)
    setShowList(false)
  }

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Código y nombre son obligatorios')
      return
    }
    setSaving(true)
    try {
      const { data } = await inventoryApi.createLocationType(form)
      toast.success('Tipo de ubicación creado')
      setShowModal(false)
      setForm({ code: '', name: '', description: '' })
      handleSelect(data)
    } catch (err) {
      const msg = err.response?.data
      const detail = typeof msg === 'object' ? JSON.stringify(msg) : String(msg)
      toast.error(`Error: ${detail}`)
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
            placeholder="Buscar tipo de ubicación..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
          />
          {showList && types.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {types.map((t) => (
                <li
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-brand-50"
                >
                  <span className="font-medium">{t.name}</span>
                  {t.code && <span className="ml-2 text-xs text-gray-500">({t.code})</span>}
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
              <h3 className="text-lg font-semibold text-gray-900">Nuevo tipo de ubicación</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Código *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="Ej: buque, patrullera, fragata"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Identificador interno único, sin espacios.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Buque, Patrullera, Fragata"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
