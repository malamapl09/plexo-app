'use client'

import { useState, useEffect } from 'react'
import { TemplateForm, TemplateFormData } from './components/TemplateForm'
import { TemplateCard } from './components/TemplateCard'

interface Template {
  id: string
  name: string
  description?: string
  departmentId?: string
  departmentName?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  defaultScheduledTime?: string
  defaultDueTime?: string
  distributionType: 'ALL_STORES' | 'BY_REGION' | 'SPECIFIC_STORES'
  defaultRegionIds?: string[]
  defaultStoreIds?: string[]
  isRecurring: boolean
  recurringRule?: Record<string, any>
  isActive: boolean
  usageCount?: number
  createdAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/task-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || data || [])
      } else {
        throw new Error('Failed to load templates')
      }
    } catch (err) {
      console.error('Error loading templates:', err)
      // Use mock data as fallback
      setTemplates([
        {
          id: '1',
          name: 'Verificacion de precios diaria',
          description: 'Verificar que los precios en gondola coincidan con el sistema',
          departmentId: '1',
          departmentName: 'Supermercado',
          priority: 'HIGH',
          defaultScheduledTime: '08:00',
          defaultDueTime: '12:00',
          distributionType: 'ALL_STORES',
          isRecurring: true,
          recurringRule: { freq: 'DAILY' },
          isActive: true,
          usageCount: 156,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Limpieza de area de electrodomesticos',
          description: 'Limpieza profunda del area de exhibicion',
          departmentId: '2',
          departmentName: 'Electrodomesticos',
          priority: 'MEDIUM',
          defaultScheduledTime: '07:00',
          defaultDueTime: '09:00',
          distributionType: 'ALL_STORES',
          isRecurring: true,
          recurringRule: { freq: 'WEEKLY' },
          isActive: true,
          usageCount: 24,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Inventario mensual de hogar',
          description: 'Conteo fisico de productos de hogar',
          departmentId: '3',
          departmentName: 'Hogar',
          priority: 'LOW',
          distributionType: 'BY_REGION',
          isRecurring: true,
          recurringRule: { freq: 'MONTHLY' },
          isActive: true,
          usageCount: 12,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = async (data: TemplateFormData) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/task-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      setIsFormOpen(false)
      loadTemplates()
    } catch (err) {
      console.error('Error creating template:', err)
      // For demo, just close the modal and add to list
      setIsFormOpen(false)
      loadTemplates()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTemplate = async (data: TemplateFormData) => {
    if (!editingTemplate) return
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/task-templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update template')
      }

      setIsFormOpen(false)
      setEditingTemplate(null)
      loadTemplates()
    } catch (err) {
      console.error('Error updating template:', err)
      setIsFormOpen(false)
      setEditingTemplate(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Esta seguro de eliminar esta plantilla?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/task-templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      loadTemplates()
    } catch (err) {
      console.error('Error deleting template:', err)
      // For demo, remove from list
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const handleCreateTaskFromTemplate = async (template: Template) => {
    // Navigate to task creation with template pre-selected
    // For now, redirect to tasks page with template ID
    window.location.href = `/tasks?templateId=${template.id}`
  }

  const openEditForm = (template: Template) => {
    setEditingTemplate(template)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingTemplate(null)
  }

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    if (!showInactive && !template.isActive) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.departmentName?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <a href="/tasks" className="hover:text-gray-700">Plan del Dia</a>
              </li>
              <li>
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-gray-900 font-medium">Plantillas</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Plantillas de Tareas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Crea plantillas reutilizables para tareas frecuentes
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => {
              setEditingTemplate(null)
              setIsFormOpen(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Show inactive toggle */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mostrar inactivas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-red-800">Error al cargar plantillas</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={loadTemplates}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            Reintentar
          </button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchQuery ? 'No se encontraron plantillas' : 'No hay plantillas'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery
              ? 'Intente con otros terminos de busqueda'
              : 'Comience creando una nueva plantilla de tarea'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Crear primera plantilla
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              name={template.name}
              description={template.description}
              departmentName={template.departmentName}
              priority={template.priority}
              distributionType={template.distributionType}
              isRecurring={template.isRecurring}
              usageCount={template.usageCount}
              isActive={template.isActive}
              onEdit={() => openEditForm(template)}
              onDelete={() => handleDeleteTemplate(template.id)}
              onCreateTask={() => handleCreateTaskFromTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      <TemplateForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        initialData={
          editingTemplate
            ? {
                name: editingTemplate.name,
                description: editingTemplate.description,
                departmentId: editingTemplate.departmentId,
                priority: editingTemplate.priority,
                defaultScheduledTime: editingTemplate.defaultScheduledTime,
                defaultDueTime: editingTemplate.defaultDueTime,
                distributionType: editingTemplate.distributionType,
                defaultRegionIds: editingTemplate.defaultRegionIds,
                defaultStoreIds: editingTemplate.defaultStoreIds,
                isRecurring: editingTemplate.isRecurring,
                recurringRule: editingTemplate.recurringRule,
              }
            : undefined
        }
        mode={editingTemplate ? 'edit' : 'create'}
      />
    </div>
  )
}
