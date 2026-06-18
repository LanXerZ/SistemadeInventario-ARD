import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  WrenchIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  TagIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import { workOrderApi } from '../services/workOrderApi'
import SessionTimeout from './SessionTimeout'
import GlobalSearch from './GlobalSearch'

const navigation = [
  { name: 'Inicio', href: '/', icon: HomeIcon },
  { name: 'Inventario', href: '/inventory', icon: CubeIcon },
  { name: 'Ubicaciones', href: '/locations', icon: MapPinIcon },
  { name: 'Categorías', href: '/categories', icon: TagIcon },
  { name: 'Órdenes', href: '/workorders', icon: ClipboardDocumentListIcon, notify: true },
  { name: 'Herramientas', href: '/tools', icon: WrenchIcon },
  { name: 'Auditoría', href: '/audit', icon: ShieldCheckIcon, adminOnly: true },
  { name: 'Usuarios', href: '/users', icon: UsersIcon, adminOnly: true },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pendingParts, setPendingParts] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchPendingParts = async () => {
      try {
        const { data } = await workOrderApi.getPendingPartsCount()
        setPendingParts(data.count)
      } catch (error) {
        console.error('Failed to fetch pending parts count', error)
      }
    }

    fetchPendingParts()
    const interval = setInterval(fetchPendingParts, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen flex">
      <SessionTimeout />
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-6 border-b border-brand-800">
          <h1 className="text-lg font-bold">Taller Electrónica</h1>
          <p className="text-xs text-gray-400">Armada RD</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            if (item.adminOnly && !isAdmin) return null
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.name}
                </div>
                {item.notify && pendingParts > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {pendingParts}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-brand-800">
          <div className="mb-3 text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <GlobalSearch />
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <main className="flex-1 p-8 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
