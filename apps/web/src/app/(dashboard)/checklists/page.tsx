'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ChecklistTemplate {
  id: string
  title: string
  description?: string
  frequency: string
  scope: string
  isActive: boolean
  items?: { id: string }[]
  createdBy?: { name: string }
  createdAt: string
}

interface DashboardData {
  totalTemplates: number
  overallCompletionRate: number
  completionByStore: { storeId: string; storeName: string; completionRate: number; completed: number; total: number }[]
  completionByChecklist: { templateId: string; templateTitle: string; completionRate: number; completed: number; total: number }[]
}

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  ONE_TIME: 'Una vez',
}

export default function ChecklistsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const headers = { Authorization: `Bearer ${token}` }

      const [templatesRes, dashboardRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/checklists`, { headers }),
        fetch(`${baseUrl}/api/v1/checklists/dashboard`, { headers }),
      ])

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      }

      if (dashboardRes.ok) {
        setDashboard(await dashboardRes.json())
      }
    } catch (err) {
      console.error('Error loading checklists:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklists / SOPs</h1>
          <p className="mt-1 text-sm text-gray-500">Gestione listas de verificacion y procedimientos</p>
        </div>
        <div className="mt-4 flex gap-2 md:mt-0">
          <button
            onClick={() => router.push('/checklists/submissions')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Ver Submissions
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Nuevo Checklist
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Plantillas Activas</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.totalTemplates}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Tasa de Cumplimiento (7 dias)</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.overallCompletionRate}%</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Tiendas con Datos</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.completionByStore.length}</p>
          </div>
        </div>
      )}

      {/* Completion by Store */}
      {dashboard && dashboard.completionByStore.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Cumplimiento por Tienda</h2>
          <div className="space-y-3">
            {dashboard.completionByStore.map((s) => (
              <div key={s.storeId} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-32 truncate">{s.storeName}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${s.completionRate >= 80 ? 'bg-green-500' : s.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${s.completionRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-20 text-right">
                  {s.completed}/{s.total} ({s.completionRate}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Plantillas de Checklists</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-1/4" />
                <div className="h-6 bg-gray-200 rounded w-1/6" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No hay checklists creados</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Crear primer checklist
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titulo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frecuencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alcance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/checklists/${t.id}`)}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{t.title}</div>
                    {t.description && <div className="text-sm text-gray-500 truncate max-w-xs">{t.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {frequencyLabels[t.frequency] || t.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.items?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.scope === 'ALL' ? 'Todas' : t.scope}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/checklists/${t.id}`); }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateChecklistModal onClose={() => setShowCreateForm(false)} onCreated={() => { setShowCreateForm(false); loadData(); }} />
      )}
    </div>
  )
}

function CreateChecklistModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('DAILY')
  const [items, setItems] = useState([{ order: 0, title: '', requiresPhoto: false, requiresNote: false }])
  const [submitting, setSubmitting] = useState(false)

  const addItem = () => {
    setItems([...items, { order: items.length, title: '', requiresPhoto: false, requiresNote: false }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const handleSubmit = async () => {
    if (!title || items.some((i) => !i.title)) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/checklists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          frequency,
          scope: 'ALL',
          items,
        }),
      })
      if (res.ok) onCreated()
      else alert('Error al crear checklist')
    } catch (err) {
      console.error(err)
      alert('Error al crear checklist')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Nuevo Checklist</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Titulo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Apertura de Tienda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripcion</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Frecuencia</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="DAILY">Diario</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensual</option>
                <option value="ONE_TIME">Una vez</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Items del Checklist</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Agregar item
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-400 w-6">{i + 1}.</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(i, 'title', e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Descripcion del item"
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={item.requiresPhoto}
                        onChange={(e) => updateItem(i, 'requiresPhoto', e.target.checked)}
                      />
                      Foto
                    </label>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(i)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !title}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear Checklist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
