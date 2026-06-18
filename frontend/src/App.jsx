import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import InventoryPage from './pages/InventoryPage'
import ItemFormPage from './pages/ItemFormPage'
import ItemDetailPage from './pages/ItemDetailPage'
import DashboardPage from './pages/DashboardPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import WorkOrderFormPage from './pages/WorkOrderFormPage'
import WorkOrderDetailPage from './pages/WorkOrderDetailPage'
import ToolsPage from './pages/ToolsPage'
import ToolFormPage from './pages/ToolFormPage'
import ToolDetailPage from './pages/ToolDetailPage'
import AuditPage from './pages/AuditPage'
import UsersPage from './pages/UsersPage'
import UserFormPage from './pages/UserFormPage'
import CategoriesPage from './pages/CategoriesPage'
import LocationsPage from './pages/LocationsPage'
import PrintLabelPage from './pages/PrintLabelPage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Layout>{children}</Layout>
}

function Dashboard() {
  return <DashboardPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/new"
        element={
          <ProtectedRoute>
            <ItemFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/:id"
        element={
          <ProtectedRoute>
            <ItemDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/:id/edit"
        element={
          <ProtectedRoute>
            <ItemFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/locations"
        element={
          <ProtectedRoute>
            <LocationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/:id/print-label"
        element={
          <ProtectedRoute>
            <PrintLabelPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workorders"
        element={
          <ProtectedRoute>
            <WorkOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workorders/new"
        element={
          <ProtectedRoute>
            <WorkOrderFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workorders/:id"
        element={
          <ProtectedRoute>
            <WorkOrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workorders/:id/edit"
        element={
          <ProtectedRoute>
            <WorkOrderFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools"
        element={
          <ProtectedRoute>
            <ToolsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/new"
        element={
          <ProtectedRoute>
            <ToolFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/:id"
        element={
          <ProtectedRoute>
            <ToolDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/:id/edit"
        element={
          <ProtectedRoute>
            <ToolFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/new"
        element={
          <ProtectedRoute adminOnly>
            <UserFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedRoute adminOnly>
            <UserFormPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
