'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface Department {
  id: string
  name: string
}

interface Region {
  id: string
  name: string
}

interface Store {
  id: string
  name: string
  code: string
}

export interface TemplateFormData {
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

interface TemplateFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TemplateFormData) => Promise<void>
  initialData?: TemplateFormData
  mode: 'create' | 'edit'
}

const defaultFormData: TemplateFormData = {
  name: '',
  description: '',
  priority: 'MEDIUM',
  distributionType: 'ALL_STORES',
  isRecurring: false,
}

export function TemplateForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: TemplateFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [formData, setFormData] = useState<TemplateFormData>(
    initialData || defaultFormData
  )

  useEffect(() => {
    if (isOpen) {
      loadFormData()
      if (initialData) {
        setFormData(initialData)
      } else {
        setFormData(defaultFormData)
      }
    }
  }, [isOpen, initialData])

  const loadFormData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      // Load departments
      const deptRes = await fetch(`${baseUrl}/api/v1/stores/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (deptRes.ok) {
        const data = await deptRes.json()
        setDepartments(data.departments || data || [])
      }

      // Load regions
      const regRes = await fetch(`${baseUrl}/api/v1/stores/regions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (regRes.ok) {
        const data = await regRes.json()
        setRegions(data.regions || data || [])
      }

      // Load stores
      const storeRes = await fetch(`${baseUrl}/api/v1/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (storeRes.ok) {
        const data = await storeRes.json()
        setStores(data.stores || data || [])
      }
    } catch (error) {
      console.error('Error loading form data:', error)
      // Use mock data as fallback
      setDepartments([
        { id: '1', name: 'Electrodomesticos' },
        { id: '2', name: 'Supermercado' },
        { id: '3', name: 'Hogar' },
      ])
      setRegions([
        { id: '1', name: 'Santo Domingo' },
        { id: '2', name: 'Santiago' },
      ])
      setStores([
        { id: '1', name: 'Tienda Centro', code: 'STR-001' },
        { id: '2', name: 'Tienda Norte', code: 'STR-002' },
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      setFormData(defaultFormData)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof TemplateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900 mb-6">
            {mode === 'create' ? 'Nueva Plantilla de Tarea' : 'Editar Plantilla'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre de la Plantilla *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Ej: Verificacion de precios diaria"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripcion
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Instrucciones por defecto..."
              />
            </div>

            {/* Department and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Departamento por Defecto
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
                  Prioridad por Defecto *
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

            {/* Default Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="defaultScheduledTime" className="block text-sm font-medium text-gray-700">
                  Hora Programada por Defecto
                </label>
                <input
                  type="time"
                  id="defaultScheduledTime"
                  value={formData.defaultScheduledTime || ''}
                  onChange={(e) => handleChange('defaultScheduledTime', e.target.value || undefined)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="defaultDueTime" className="block text-sm font-medium text-gray-700">
                  Hora Limite por Defecto
                </label>
                <input
                  type="time"
                  id="defaultDueTime"
                  value={formData.defaultDueTime || ''}
                  onChange={(e) => handleChange('defaultDueTime', e.target.value || undefined)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Distribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribucion por Defecto
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
                  <span className="ml-2 text-sm text-gray-700">Por region</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="SPECIFIC_STORES"
                    checked={formData.distributionType === 'SPECIFIC_STORES'}
                    onChange={(e) => handleChange('distributionType', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tiendas especificas</span>
                </label>
              </div>
            </div>

            {/* Region Selection */}
            {formData.distributionType === 'BY_REGION' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regiones por Defecto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {regions.map((region) => (
                    <label key={region.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.defaultRegionIds?.includes(region.id) || false}
                        onChange={(e) => {
                          const current = formData.defaultRegionIds || []
                          if (e.target.checked) {
                            handleChange('defaultRegionIds', [...current, region.id])
                          } else {
                            handleChange(
                              'defaultRegionIds',
                              current.filter((id) => id !== region.id)
                            )
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
                  Tiendas por Defecto
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {stores.map((store) => (
                    <label key={store.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        checked={formData.defaultStoreIds?.includes(store.id) || false}
                        onChange={(e) => {
                          const current = formData.defaultStoreIds || []
                          if (e.target.checked) {
                            handleChange('defaultStoreIds', [...current, store.id])
                          } else {
                            handleChange(
                              'defaultStoreIds',
                              current.filter((id) => id !== store.id)
                            )
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
                <span className="ml-2 text-sm text-gray-700">Tarea recurrente por defecto</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label htmlFor="recurringRule" className="block text-sm font-medium text-gray-700">
                  Frecuencia por Defecto
                </label>
                <select
                  id="recurringRule"
                  value={formData.recurringRule?.freq || ''}
                  onChange={(e) =>
                    handleChange('recurringRule', e.target.value ? { freq: e.target.value } : undefined)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar frecuencia</option>
                  <option value="DAILY">Diario</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensual</option>
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
                {isLoading
                  ? mode === 'create'
                    ? 'Creando...'
                    : 'Guardando...'
                  : mode === 'create'
                  ? 'Crear Plantilla'
                  : 'Guardar Cambios'}
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
