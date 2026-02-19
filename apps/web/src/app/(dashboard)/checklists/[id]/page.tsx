'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diario', WEEKLY: 'Semanal', MONTHLY: 'Mensual', ONE_TIME: 'Una vez',
}

export default function ChecklistDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [template, setTemplate] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items')

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const headers = { Authorization: `Bearer ${token}` }

      const [templateRes, subsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/checklists/${id}`, { headers }),
        fetch(`${baseUrl}/api/v1/checklists/submissions?templateId=${id}&limit=50`, { headers }),
      ])

      if (templateRes.ok) setTemplate(await templateRes.json())
      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubmissions(data.submissions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-64 bg-gray-200 rounded" /></div>
  if (!template) return <div className="text-center py-12"><p className="text-gray-500">Checklist no encontrado</p></div>

  return (
    <div>
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/checklists" className="hover:text-gray-700">Checklists</a></li>
          <li><svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></li>
          <li className="text-gray-900 font-medium">{template.title}</li>
        </ol>
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
          {template.description && <p className="mt-1 text-sm text-gray-500">{template.description}</p>}
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {frequencyLabels[template.frequency]}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {template.items?.length || 0} items
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {template.scope === 'ALL' ? 'Todas las tiendas' : template.scope}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('items')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Items ({template.items?.length || 0})
          </button>
          <button onClick={() => setActiveTab('history')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Historial ({submissions.length})
          </button>
        </nav>
      </div>

      {activeTab === 'items' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {template.items?.map((item: any, i: number) => (
              <li key={item.id} className="px-6 py-4 flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                  <div className="flex gap-2 mt-1">
                    {item.requiresPhoto && (
                      <span className="inline-flex items-center text-xs text-orange-600">Requiere foto</span>
                    )}
                    {item.requiresNote && (
                      <span className="inline-flex items-center text-xs text-purple-600">Requiere nota</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No hay submissions todavia</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{s.storeName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.date).toLocaleDateString('es-DO')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        s.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        s.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {s.status === 'COMPLETED' ? 'Completado' : s.status === 'IN_PROGRESS' ? 'En progreso' : s.status === 'EXPIRED' ? 'Vencido' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.completedItems}/{s.totalItems}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.score != null ? `${s.score}%` : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/checklists/submissions/${s.id}`)}
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
      )}
    </div>
  )
}
