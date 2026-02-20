'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const ENTITY_TYPES = [
  'TASK_ASSIGNMENT', 'ISSUE', 'RECEIVING', 'USER', 'STORE', 'TASK',
  'ANNOUNCEMENT', 'CHECKLIST', 'STORE_AUDIT', 'AUDIT_FINDING',
  'CORRECTIVE_ACTION', 'PLANOGRAM_TEMPLATE', 'PLANOGRAM_SUBMISSION',
  'CAMPAIGN', 'CAMPAIGN_SUBMISSION', 'TRAINING_COURSE',
  'TRAINING_ENROLLMENT', 'POINT_TRANSACTION', 'BADGE',
]

const ACTIONS = [
  'CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'COMPLETED', 'RESOLVED',
  'VERIFICATION_SUBMITTED', 'VERIFIED', 'REJECTED', 'UPDATED',
  'ESCALATED', 'DELETED', 'LOGIN', 'LOGOUT', 'APPROVED',
  'REVISION_REQUESTED', 'RESUBMITTED', 'POINTS_AWARDED', 'BADGE_EARNED',
]

interface AuditLogEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  notes?: string
  createdAt: string
  performedBy: { id: string; name: string; email: string; role: string }
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function OrgAuditLogsPage() {
  const params = useParams()
  const orgId = params?.id as string

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, page, entityType, action])

  const loadLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const qs = new URLSearchParams({ page: String(page), limit: '50' })
      if (entityType) qs.set('entityType', entityType)
      if (action) qs.set('action', action)

      const res = await fetch(
        `${baseUrl}/api/v1/platform/organizations/${orgId}/audit-logs?${qs}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (!res.ok) throw new Error(`Error ${res.status}`)

      const data = await res.json()
      setLogs(data.data || [])
      setMeta(data.meta || null)
    } catch {
      setError('No se pudieron cargar los audit logs.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('es-DO', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  return (
    <div>
      <Link
        href={`/platform/organizations/${orgId}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a organizacion
      </Link>

      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {meta ? `${meta.total} registros encontrados` : 'Cargando...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 px-4 py-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Entidad</label>
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
            className="rounded-md border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Todos</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Accion</label>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1) }}
            className="rounded-md border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Todas</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No se encontraron registros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accion</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Entidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <div className="font-medium text-gray-900">{log.performedBy.name}</div>
                      <div className="text-xs text-gray-500">{log.performedBy.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.entityType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="text-xs bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                        {log.entityId.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Pagina {meta.page} de {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
