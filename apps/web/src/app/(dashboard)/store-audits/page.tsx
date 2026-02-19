'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardData {
  averageScore: number
  totalAudits: number
  completedAudits: number
  openFindings: number
  overdueActions: number
  scoresByStore: { storeId: string; storeName: string; averageScore: number; auditCount: number }[]
}

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Programada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export default function StoreAuditsPage() {
  const router = useRouter()
  const [audits, setAudits] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const headers = { Authorization: `Bearer ${token}` }

      const [auditsRes, dashRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/store-audits?limit=50`, { headers }),
        fetch(`${baseUrl}/api/v1/store-audits/dashboard`, { headers }),
      ])

      if (auditsRes.ok) {
        const data = await auditsRes.json()
        setAudits(data.data || [])
      }
      if (dashRes.ok) setDashboard(await dashRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditorias e Inspecciones</h1>
          <p className="mt-1 text-sm text-gray-500">Gestione auditorias de tienda y acciones correctivas</p>
        </div>
        <div className="mt-4 flex gap-2 md:mt-0">
          <button
            onClick={() => router.push('/store-audits/templates')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Plantillas
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Programar Auditoria
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-5 mb-8">
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Puntaje Promedio</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.averageScore?.toFixed(0) || 0}%</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Total Auditorias</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.totalAudits || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Completadas</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{dashboard.completedAudits || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Hallazgos Abiertos</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{dashboard.openFindings || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500">Acciones Vencidas</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{dashboard.overdueActions || 0}</p>
          </div>
        </div>
      )}

      {/* Score by Store */}
      {dashboard?.scoresByStore && dashboard.scoresByStore.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Puntaje por Tienda</h2>
          <div className="space-y-3">
            {dashboard.scoresByStore.map((s) => (
              <div key={s.storeId} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-32 truncate">{s.storeName}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${s.averageScore >= 80 ? 'bg-green-500' : s.averageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${s.averageScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-24 text-right">
                  {s.averageScore.toFixed(0)}% ({s.auditCount})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audits List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Auditorias Recientes</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : audits.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No hay auditorias programadas</p>
            <button onClick={() => setShowScheduleModal(true)} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Programar primera auditoria
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plantilla</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auditor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntaje</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {audits.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/store-audits/${a.id}`)}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.templateName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.store?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString('es-DO') : '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.auditor?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      a.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      a.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabels[a.status] || a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{a.overallScore != null ? `${a.overallScore.toFixed(0)}%` : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showScheduleModal && (
        <ScheduleAuditModal onClose={() => setShowScheduleModal(false)} onScheduled={() => { setShowScheduleModal(false); loadData(); }} />
      )}
    </div>
  )
}

function ScheduleAuditModal({ onClose, onScheduled }: { onClose: () => void; onScheduled: () => void }) {
  const [templates, setTemplates] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [templateId, setTemplateId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${baseUrl}/api/v1/store-audits/templates`, { headers }).then((r) => r.ok ? r.json() : []),
      fetch(`${baseUrl}/api/v1/stores`, { headers }).then((r) => r.ok ? r.json() : []),
    ]).then(([templatesData, storesData]) => {
      setTemplates(Array.isArray(templatesData) ? templatesData : [])
      setStores(Array.isArray(storesData) ? storesData : storesData.stores || [])
    })
  }, [])

  const handleSubmit = async () => {
    if (!templateId || !storeId || !scheduledDate) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/store-audits/schedule`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, storeId, scheduledDate }),
      })
      if (res.ok) onScheduled()
      else alert('Error al programar auditoria')
    } catch (err) {
      alert('Error al programar auditoria')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Programar Auditoria</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Plantilla</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tienda</label>
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSubmit} disabled={submitting || !templateId || !storeId || !scheduledDate} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Programando...' : 'Programar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
