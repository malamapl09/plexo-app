'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => { loadSubmissions() }, [])

  const loadSubmissions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const params = new URLSearchParams({ limit: '50' })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`${baseUrl}/api/v1/checklists/submissions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadSubmissions() }, [statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions de Checklists</h1>
          <p className="mt-1 text-sm text-gray-500">Historial de completamiento de checklists por tienda</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="IN_PROGRESS">En progreso</option>
          <option value="COMPLETED">Completado</option>
          <option value="EXPIRED">Vencido</option>
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay submissions</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checklist</th>
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
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.templateTitle || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{s.storeName || '-'}</td>
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
                  <td className="px-6 py-4 text-sm font-medium">{s.score != null ? `${s.score}%` : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => router.push(`/checklists/submissions/${s.id}`)} className="text-blue-600 hover:text-blue-800 text-sm">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
