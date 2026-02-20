'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ActivityDay {
  date: string
  count: number
}

interface LoginEntry {
  id: string
  createdAt: string
  performedBy: { id: string; name: string; email: string }
}

interface LogEntry {
  id: string
  action: string
  entityType: string
  createdAt: string
  performedBy: { id: string; name: string; email: string; role: string }
}

interface ActivityData {
  recentLogs: LogEntry[]
  activityByDay: ActivityDay[]
  recentLogins: LoginEntry[]
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export default function OrgActivityPage() {
  const params = useParams()
  const orgId = params?.id as string

  const [data, setData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  const loadActivity = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const res = await fetch(
        `${baseUrl}/api/v1/platform/organizations/${orgId}/activity`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (!res.ok) throw new Error(`Error ${res.status}`)

      setData(await res.json())
    } catch {
      setError('No se pudo cargar la actividad de la organizacion.')
    } finally {
      setIsLoading(false)
    }
  }

  const maxCount = data?.activityByDay?.length
    ? Math.max(...data.activityByDay.map((d) => d.count), 1)
    : 1

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
          <h1 className="text-2xl font-bold text-gray-900">Actividad</h1>
          <p className="mt-1 text-sm text-gray-500">Ultimos 30 dias de actividad</p>
        </div>
        <button
          onClick={loadActivity}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
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

      {isLoading ? (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6 animate-pulse">
            <div className="h-40 bg-gray-100 rounded" />
          </div>
          <div className="bg-white shadow rounded-lg p-6 animate-pulse">
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Activity bar chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Actividad diaria</h2>
            {data.activityByDay.length === 0 ? (
              <p className="text-sm text-gray-500">Sin actividad en los ultimos 30 dias</p>
            ) : (
              <div className="flex items-end gap-1" style={{ height: 160 }}>
                {data.activityByDay.map((day) => {
                  const heightPct = (day.count / maxCount) * 100
                  return (
                    <div
                      key={day.date}
                      className="flex-1 group relative"
                      style={{ height: '100%' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        {day.date}: {day.count}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {data.activityByDay.length > 0 && (
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{data.activityByDay[0]?.date}</span>
                <span>{data.activityByDay[data.activityByDay.length - 1]?.date}</span>
              </div>
            )}
          </div>

          {/* Recent logins */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Logins recientes</h2>
            {data.recentLogins.length === 0 ? (
              <p className="text-sm text-gray-500">Sin logins recientes</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.recentLogins.map((login) => (
                  <li key={login.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{login.performedBy.name}</p>
                      <p className="text-xs text-gray-500">{login.performedBy.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">{relativeTime(login.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent activity log */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Actividad reciente</h2>
            </div>
            {data.recentLogs.length === 0 ? (
              <div className="p-6">
                <p className="text-sm text-gray-500">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accion</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.entityType}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.performedBy.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{relativeTime(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
