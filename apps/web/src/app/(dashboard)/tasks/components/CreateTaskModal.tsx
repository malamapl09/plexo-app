'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface Store {
  id: string
  name: string
  code: string
}

interface Region {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

interface Template {
  id: string
  name: string
  description?: string
  departmentId?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  defaultScheduledTime?: string
  defaultDueTime?: string
  distributionType: 'ALL_STORES' | 'BY_REGION' | 'SPECIFIC_STORES'
  defaultRegionIds?: string[]
  defaultStoreIds?: string[]
  isRecurring: boolean
  recurringRule?: Record<string, any>
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: TaskFormData) => Promise<void>
  preselectedTemplateId?: string
}

interface TaskFormData {
  title: string
  description?: string
  templateId?: string
  departmentId?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  scheduledTime?: string
  dueTime?: string
  distributionType: 'ALL_STORES' | 'BY_REGION' | 'SPECIFIC_STORES'
  regionIds?: string[]
  storeIds?: string[]
  isRecurring: boolean
  recurringRule?: string
}

const defaultFormData: TaskFormData = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  distributionType: 'ALL_STORES',
  isRecurring: false,
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, preselectedTemplateId }: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(preselectedTemplateId)

  const [formData, setFormData] = useState<TaskFormData>(defaultFormData)

  useEffect(() => {
    if (isOpen) {
      loadFormData()
      if (preselectedTemplateId) {
        setSelectedTemplateId(preselectedTemplateId)
      }
    } else {
      // Reset form when modal closes
      setFormData(defaultFormData)
      setSelectedTemplateId(undefined)
    }
  }, [isOpen, preselectedTemplateId])

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        applyTemplate(template)
      }
    }
  }, [selectedTemplateId, templates])

  const applyTemplate = (template: Template) => {
    setFormData({
      title: template.name,
      description: template.description || '',
      templateId: template.id,
      departmentId: template.departmentId,
      priority: template.priority,
      scheduledTime: template.defaultScheduledTime,
      dueTime: template.defaultDueTime,
      distributionType: template.distributionType,
      regionIds: template.defaultRegionIds,
      storeIds: template.defaultStoreIds,
      isRecurring: template.isRecurring,
      recurringRule: template.recurringRule?.freq ? `FREQ=${template.recurringRule.freq}` : undefined,
    })
  }

  const loadFormData = async () => {
    const token = localStorage.getItem('accessToken')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

    try {
      // Load templates
      const templatesRes = await fetch(`${baseUrl}/api/v1/task-templates?isActive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || data || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      // Mock data fallback
      setTemplates([
        {
          id: '1',
          name: 'Verificacion de precios diaria',
          description: 'Verificar que los precios en gondola coincidan con el sistema',
          priority: 'HIGH',
          distributionType: 'ALL_STORES',
          isRecurring: true,
          recurringRule: { freq: 'DAILY' },
        },
        {
          id: '2',
          name: 'Limpieza de area de electrodomesticos',
          departmentId: '1',
          priority: 'MEDIUM',
          distributionType: 'ALL_STORES',
          isRecurring: true,
          recurringRule: { freq: 'WEEKLY' },
        },
      ])
    }

    // Load stores, regions, departments
    try {
      const storesRes = await fetch(`${baseUrl}/api/v1/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (storesRes.ok) {
        const data = await storesRes.json()
        setStores(data.stores || data || [])
      }
    } catch {
      setStores([
        { id: '1', name: 'Tienda Centro', code: 'STR-001' },
        { id: '2', name: 'Tienda Norte', code: 'STR-002' },
        { id: '3', name: 'Tienda Sur', code: 'STR-003' },
      ])
    }

    try {
      const regionsRes = await fetch(`${baseUrl}/api/v1/stores/regions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (regionsRes.ok) {
        const data = await regionsRes.json()
        setRegions(data.regions || data || [])
      }
    } catch {
      setRegions([
        { id: '1', name: 'Santo Domingo' },
        { id: '2', name: 'Santiago' },
        { id: '3', name: 'Punta Cana' },
      ])
    }

    try {
      const deptsRes = await fetch(`${baseUrl}/api/v1/stores/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (deptsRes.ok) {
        const data = await deptsRes.json()
        setDepartments(data.departments || data || [])
      }
    } catch {
      setDepartments([
        { id: '1', name: 'Electrodomésticos' },
        { id: '2', name: 'Supermercado' },
        { id: '3', name: 'Hogar' },
        { id: '4', name: 'Electrónica' },
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        distributionType: 'ALL_STORES',
        isRecurring: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900 mb-6">
            Nueva Tarea
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selector */}
            {templates.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label htmlFor="template" className="block text-sm font-medium text-blue-800 mb-2">
                  Usar plantilla (opcional)
                </label>
                <div className="flex items-center gap-3">
                  <select
                    id="template"
                    value={selectedTemplateId || ''}
                    onChange={(e) => {
                      const value = e.target.value || undefined
                      setSelectedTemplateId(value)
                      if (!value) {
                        setFormData(defaultFormData)
                      }
                    }}
                    className="flex-1 rounded-md border border-blue-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Crear desde cero</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <a
                    href="/tasks/templates"
                    className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                  >
                    Gestionar plantillas
                  </a>
                </div>
                {selectedTemplateId && (
                  <p className="mt-2 text-xs text-blue-600">
                    Los campos han sido rellenados con los valores de la plantilla. Puede modificarlos antes de crear la tarea.
                  </p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Ej: Verificar precios de exhibición"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Instrucciones adicionales..."
              />
            </div>

            {/* Department and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Departamento
                </label>
                <select
                  id="department"
                  value={formData.departmentId || ''}
                  onChange={(e) => handleChange('departmentId', e.target.value || undefined)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos los departamentos</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Prioridad *
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700">
                  Hora programada
                </label>
                <input
                  type="time"
                  id="scheduledTime"
                  value={formData.scheduledTime || ''}
                  onChange={(e) => handleChange('scheduledTime', e.target.value || undefined)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700">
                  Hora límite
                </label>
                <input
                  type="time"
                  id="dueTime"
                  value={formData.dueTime || ''}
                  onChange={(e) => handleChange('dueTime', e.target.value || undefined)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Distribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribución *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ALL_STORES"
                    checked={formData.distributionType === 'ALL_STORES'}
                    onChange={(e) => handleChange('distributionType', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Todas las tiendas</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="BY_REGION"
                    checked={formData.distributionType === 'BY_REGION'}
                    onChange={(e) => handleChange('distributionType', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Por región</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="SPECIFIC_STORES"
                    checked={formData.distributionType === 'SPECIFIC_STORES'}
                    onChange={(e) => handleChange('distributionType', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tiendas específicas</span>
                </label>
              </div>
            </div>

            {/* Region Selection */}
            {formData.distributionType === 'BY_REGION' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar regiones
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {regions.map((region) => (
                    <label key={region.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.regionIds?.includes(region.id) || false}
                        onChange={(e) => {
                          const current = formData.regionIds || []
                          if (e.target.checked) {
                            handleChange('regionIds', [...current, region.id])
                          } else {
                            handleChange('regionIds', current.filter((id) => id !== region.id))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{region.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Store Selection */}
            {formData.distributionType === 'SPECIFIC_STORES' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar tiendas
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {stores.map((store) => (
                    <label key={store.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        checked={formData.storeIds?.includes(store.id) || false}
                        onChange={(e) => {
                          const current = formData.storeIds || []
                          if (e.target.checked) {
                            handleChange('storeIds', [...current, store.id])
                          } else {
                            handleChange('storeIds', current.filter((id) => id !== store.id))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {store.code} - {store.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => handleChange('isRecurring', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Tarea recurrente</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label htmlFor="recurringRule" className="block text-sm font-medium text-gray-700">
                  Frecuencia
                </label>
                <select
                  id="recurringRule"
                  value={formData.recurringRule || ''}
                  onChange={(e) => handleChange('recurringRule', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar frecuencia</option>
                  <option value="FREQ=DAILY">Diario</option>
                  <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">Lunes a Viernes</option>
                  <option value="FREQ=WEEKLY">Semanal</option>
                  <option value="FREQ=MONTHLY">Mensual</option>
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Crear Tarea'}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
