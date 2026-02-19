'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function SubmissionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [submission, setSubmission] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadSubmission() }, [id])

  const loadSubmission = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/checklists/submissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setSubmission(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-64 bg-gray-200 rounded" /></div>
  if (!submission) return <div className="text-center py-12 text-gray-500">Submission no encontrada</div>

  return (
    <div>
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/checklists" className="hover:text-gray-700">Checklists</a></li>
          <li><svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></li>
          <li><a href="/checklists/submissions" className="hover:text-gray-700">Submissions</a></li>
          <li><svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></li>
          <li className="text-gray-900 font-medium">Detalle</li>
        </ol>
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{submission.templateTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {submission.storeName} - {new Date(submission.date).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="flex gap-2 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              submission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              submission.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              submission.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {submission.status === 'COMPLETED' ? 'Completado' : submission.status === 'IN_PROGRESS' ? 'En progreso' : submission.status === 'EXPIRED' ? 'Vencido' : 'Pendiente'}
            </span>
            {submission.score != null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Score: {submission.score}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Completados</p>
          <p className="text-2xl font-bold text-gray-900">{submission.completedItems}/{submission.totalItems}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Score</p>
          <p className="text-2xl font-bold text-gray-900">{submission.score != null ? `${submission.score}%` : '-'}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Enviado por</p>
          <p className="text-lg font-medium text-gray-900">{submission.submittedBy?.name || '-'}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Items del Checklist</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {submission.responses?.map((r: any, i: number) => (
            <li key={r.id} className="px-6 py-4">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${r.isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {r.isCompleted ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${r.isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                    {r.itemTitle || `Item ${i + 1}`}
                  </p>
                  {r.completedBy && (
                    <p className="text-xs text-gray-400 mt-1">
                      Completado por {r.completedBy.name} el {r.completedAt ? new Date(r.completedAt).toLocaleString('es-DO') : ''}
                    </p>
                  )}
                  {r.notes && <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{r.notes}</p>}
                  {r.photoUrls?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.photoUrls.map((url: string, j: number) => (
                        <img key={j} src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
