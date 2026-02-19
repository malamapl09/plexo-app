'use client'

import { useState, useEffect } from 'react'

type AnnouncementType = 'SYSTEM_ALERT' | 'OPERATIONAL_UPDATE' | 'POLICY_UPDATE' | 'TRAINING' | 'EMERGENCY' | 'GENERAL'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
type Scope = 'ALL' | 'STORES' | 'REGIONS' | 'ROLES'

interface Store {
  id: string
  name: string
  code: string
}

interface Region {
  id: string
  name: string
}

export interface AnnouncementFormData {
  title: string
  content: string
  summary?: string
  type: AnnouncementType
  priority: Priority
  scope: Scope
  targetStoreIds: string[]
  targetRegionIds: string[]
  targetRoles: string[]
  requiresAck: boolean
  scheduledFor?: string
  expiresAt?: string
}

interface AnnouncementFormProps {
  initialData?: AnnouncementFormData
  onSubmit: (data: AnnouncementFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  mode: 'create' | 'edit'
}

const defaultFormData: AnnouncementFormData = {
  title: '',
  content: '',
  summary: '',
  type: 'GENERAL',
  priority: 'MEDIUM',
  scope: 'ALL',
  targetStoreIds: [],
  targetRegionIds: [],
  targetRoles: [],
  requiresAck: false,
}

const typeOptions: { value: AnnouncementType; label: string; description: string }[] = [
  { value: 'GENERAL', label: 'General', description: 'Informacion general' },
  { value: 'OPERATIONAL_UPDATE', label: 'Actualizacion Operativa', description: 'Cambios en operaciones' },
  { value: 'POLICY_UPDATE', label: 'Actualizacion de Politica', description: 'Nuevas politicas' },
  { value: 'TRAINING', label: 'Capacitacion', description: 'Sesiones de entrenamiento' },
  { value: 'SYSTEM_ALERT', label: 'Alerta del Sistema', description: 'Alertas tecnicas' },
  { value: 'EMERGENCY', label: 'Emergencia', description: 'Situaciones urgentes' },
]

const roleOptions = [
  { value: 'OPERATIONS_MANAGER', label: 'Gerente de Operaciones' },
  { value: 'HQ_TEAM', label: 'Equipo de Oficina Central' },
  { value: 'REGIONAL_SUPERVISOR', label: 'Supervisor Regional' },
  { value: 'STORE_MANAGER', label: 'Gerente de Tienda' },
  { value: 'DEPT_SUPERVISOR', label: 'Supervisor de Departamento' },
]

export function AnnouncementForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode,
}: AnnouncementFormProps) {
  const [formData, setFormData] = useState<AnnouncementFormData>(initialData || defaultFormData)
  const [stores, setStores] = useState<Store[]>([])
  const [regions, setRegions] = useState<Region[]>([])

  useEffect(() => {
    loadReferenceData()
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const loadReferenceData = async () => {
    const token = localStorage.getItem('accessToken')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

    try {
      const [storesRes, regionsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/stores`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/v1/stores/regions`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (storesRes.ok) {
        const data = await storesRes.json()
        setStores(data.stores || data || [])
      }
      if (regionsRes.ok) {
        const data = await regionsRes.json()
        setRegions(data.regions || data || [])
      }
    } catch (error) {
      console.error('Error loading reference data:', error)
      // Use mock data
      setStores([
        { id: '1', name: 'Tienda Centro', code: 'STR-001' },
        { id: '2', name: 'Tienda Norte', code: 'STR-002' },
        { id: '3', name: 'Tienda Sur', code: 'STR-003' },
      ])
      setRegions([
        { id: '1', name: 'Santo Domingo' },
        { id: '2', name: 'Santiago' },
        { id: '3', name: 'Punta Cana' },
      ])
    }
  }

  const handleChange = (field: keyof AnnouncementFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Informacion Basica</h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Titulo *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Ej: Cambio de horario de operaciones"
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              Resumen (opcional)
            </label>
            <input
              type="text"
              id="summary"
              value={formData.summary || ''}
              onChange={(e) => handleChange('summary', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Breve descripcion para la vista previa"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Contenido *
            </label>
            <textarea
              id="content"
              required
              rows={8}
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Escriba el contenido completo del anuncio..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Soporta Markdown para formato: **negrita**, *italica*, listas, etc.
            </p>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo de Anuncio *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
        </div>
      </div>

      {/* Targeting */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Audiencia Objetivo</h2>

        <div className="space-y-4">
          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alcance *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ALL"
                  checked={formData.scope === 'ALL'}
                  onChange={(e) => handleChange('scope', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Todos los usuarios</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="REGIONS"
                  checked={formData.scope === 'REGIONS'}
                  onChange={(e) => handleChange('scope', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Por region</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="STORES"
                  checked={formData.scope === 'STORES'}
                  onChange={(e) => handleChange('scope', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Tiendas especificas</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ROLES"
                  checked={formData.scope === 'ROLES'}
                  onChange={(e) => handleChange('scope', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Por rol</span>
              </label>
            </div>
          </div>

          {/* Region Selection */}
          {formData.scope === 'REGIONS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar regiones
              </label>
              <div className="grid grid-cols-2 gap-2">
                {regions.map((region) => (
                  <label key={region.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.targetRegionIds.includes(region.id)}
                      onChange={(e) => {
                        const current = formData.targetRegionIds
                        if (e.target.checked) {
                          handleChange('targetRegionIds', [...current, region.id])
                        } else {
                          handleChange('targetRegionIds', current.filter((id) => id !== region.id))
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
          {formData.scope === 'STORES' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar tiendas
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                {stores.map((store) => (
                  <label key={store.id} className="flex items-center py-1">
                    <input
                      type="checkbox"
                      checked={formData.targetStoreIds.includes(store.id)}
                      onChange={(e) => {
                        const current = formData.targetStoreIds
                        if (e.target.checked) {
                          handleChange('targetStoreIds', [...current, store.id])
                        } else {
                          handleChange('targetStoreIds', current.filter((id) => id !== store.id))
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

          {/* Role Selection */}
          {formData.scope === 'ROLES' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar roles
              </label>
              <div className="space-y-2">
                {roleOptions.map((role) => (
                  <label key={role.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes(role.value)}
                      onChange={(e) => {
                        const current = formData.targetRoles
                        if (e.target.checked) {
                          handleChange('targetRoles', [...current, role.value])
                        } else {
                          handleChange('targetRoles', current.filter((r) => r !== role.value))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Opciones</h2>

        <div className="space-y-4">
          {/* Requires Acknowledgment */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requiresAck}
              onChange={(e) => handleChange('requiresAck', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Requiere confirmacion de lectura
            </span>
          </label>
          {formData.requiresAck && (
            <p className="ml-6 text-xs text-gray-500">
              Los usuarios tendran que confirmar que han leido este anuncio.
            </p>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700">
                Programar para (opcional)
              </label>
              <input
                type="datetime-local"
                id="scheduledFor"
                value={formData.scheduledFor || ''}
                onChange={(e) => handleChange('scheduledFor', e.target.value || undefined)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                Fecha de expiracion (opcional)
              </label>
              <input
                type="datetime-local"
                id="expiresAt"
                value={formData.expiresAt || ''}
                onChange={(e) => handleChange('expiresAt', e.target.value || undefined)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Guardando...'
            : mode === 'create'
            ? 'Crear Borrador'
            : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
