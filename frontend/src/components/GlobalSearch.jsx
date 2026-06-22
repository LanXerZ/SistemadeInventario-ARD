import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { inventoryApi } from '../services/inventoryApi'
import { despachoApi } from '../services/workOrderApi'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ items: [], despachos: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch()
      } else {
        setResults({ items: [], despachos: [] })
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  const performSearch = async () => {
    setLoading(true)
    try {
      const [itemsRes, despachosRes] = await Promise.all([
        inventoryApi.getItems({ search: query, page_size: 5 }),
        despachoApi.getDespachos({ search: query, page_size: 5 }),
      ])

      setResults({
        items: itemsRes.data.results || itemsRes.data,
        despachos: despachosRes.data.results || despachosRes.data,
      })
      setIsOpen(true)
    } catch (error) {
      console.error('Search failed', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (path) => {
    navigate(path)
    setQuery('')
    setIsOpen(false)
  }

  const hasResults = results.items.length > 0 || results.despachos.length > 0

  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Buscar... (Ctrl+K)"
          className="w-64 rounded-md border border-gray-300 bg-white pl-9 pr-8 py-1.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-brand-700"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults({ items: [], despachos: [] })
              inputRef.current?.blur()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 w-96 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-3">
            {loading ? (
              <p className="text-sm text-gray-500">Buscando...</p>
            ) : !hasResults ? (
              <p className="text-sm text-gray-500">No se encontraron resultados.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {results.items.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Inventario</h4>
                    {results.items.map((item) => (
                      <button
                        key={`item-${item.id}`}
                        onClick={() => handleNavigate(`/inventory/${item.id}`)}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{item.sku || item.part_number}</span>
                      </button>
                    ))}
                  </div>
                )}

                {results.despachos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Despachos</h4>
                    {results.despachos.map((d) => (
                      <button
                        key={`d-${d.id}`}
                        onClick={() => handleNavigate(`/despachos/${d.id}`)}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="font-medium text-gray-900">{d.ot_number}</span>
                        <span className="text-gray-500 text-xs ml-2">{d.solicitante_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
