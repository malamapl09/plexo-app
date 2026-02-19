'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Programada', IN_PROGRESS: 'En progreso', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
}
const severityLabels: Record<string, string> = {
  LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica',
}
const findingStatusLabels: Record<string, string> = {
  OPEN: 'Abierto', ACTION_ASSIGNED: 'Accion asignada', IN_PROGRESS: 'En progreso', RESOLVED: 'Resuelto', VERIFIED: 'Verificado',
}
const caStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completada', VERIFIED: 'Verificada', OVERDUE: 'Vencida',
}

export default function AuditDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [audit, setAudit] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'answers' | 'findings' | 'actions'>('answers')

  useEffect(() => { loadAudit() }, [id])

  const loadAudit = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/store-audits/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setAudit(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-64 bg-gray-200 rounded" /></div>
  if (!audit) return <div className="text-center py-12 text-gray-500">Auditoria no encontrada</div>

  return (
    <div>
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/store-audits" className="hover:text-gray-700">Auditorias</a></li>
          <li><svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></li>
          <li className="text-gray-900 font-medium">Detalle</li>
        </ol>
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{audit.templateName || 'Auditoria'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {audit.store?.name} - {audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </p>
          <div className="flex gap-2 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              audit.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              audit.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {statusLabels[audit.status] || audit.status}
            </span>
            {audit.overallScore != null && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                audit.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                audit.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Puntaje: {audit.overallScore.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        {audit.auditor?.name && (
          <div className="text-sm text-gray-500">Auditor: <span className="font-medium text-gray-900">{audit.auditor.name}</span></div>
        )}
      </div>

      {/* Score Summary */}
      {audit.overallScore != null && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Puntaje General</p>
            <p className={`text-3xl font-bold mt-1 ${audit.overallScore >= 80 ? 'text-green-600' : audit.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {audit.overallScore.toFixed(0)}%
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Puntaje Obtenido</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{audit.actualScore?.toFixed(1) || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Puntaje Maximo</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{audit.maxPossibleScore?.toFixed(1) || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['answers', 'findings', 'actions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'answers' ? 'Respuestas' : tab === 'findings' ? 'Hallazgos' : 'Acciones Correctivas'}
              {tab === 'findings' && audit.findings?.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">{audit.findings.length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'answers' && (
        <div className="space-y-6">
          {audit.template?.sections?.map((section: any) => (
            <div key={section.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-sm font-medium text-gray-900">{section.title}</h3>
                {section.description && <p className="text-xs text-gray-500 mt-1">{section.description}</p>}
              </div>
              <ul className="divide-y divide-gray-200">
                {section.questions?.map((q: any) => {
                  const answer = audit.answers?.find((a: any) => a.questionId === q.id)
                  return (
                    <li key={q.id} className="px-6 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-900">{q.text}</span>
                      <span className="text-sm font-medium">
                        {answer ? (
                          q.questionType === 'YES_NO' ? (answer.booleanValue ? 'Si' : 'No') :
                          q.questionType === 'TEXT' ? (answer.textValue || '-') :
                          `${answer.score || 0}/${q.maxScore}`
                        ) : '-'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="space-y-4">
          {(!audit.findings || audit.findings.length === 0) ? (
            <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">No hay hallazgos reportados</div>
          ) : audit.findings.map((f: any) => (
            <div key={f.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      f.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      f.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      f.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {severityLabels[f.severity] || f.severity}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      f.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      f.status === 'RESOLVED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {findingStatusLabels[f.status] || f.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">{f.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{f.description}</p>
                </div>
              </div>
              {f.photoUrls?.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {f.photoUrls.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'actions' && (() => {
        const correctiveActions = (audit.findings || [])
          .filter((f: any) => f.correctiveAction)
          .map((f: any) => ({ ...f.correctiveAction, findingTitle: f.title }));
        return (
          <div className="space-y-4">
            {correctiveActions.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">No hay acciones correctivas</div>
            ) : correctiveActions.map((a: any) => (
              <div key={a.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                      a.status === 'COMPLETED' || a.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      a.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      a.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {caStatusLabels[a.status] || a.status}
                    </span>
                    <p className="text-sm text-gray-900">{a.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hallazgo: {a.findingTitle} | Asignado a: {a.assignedTo?.name || '-'} | Vence: {a.dueDate ? new Date(a.dueDate).toLocaleDateString('es-DO') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  )
}
