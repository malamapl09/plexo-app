'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Alert {
  type: string
  severity: string
  orgId: string
  orgName: string
  message: string
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
  warning: {
    border: 'border-yellow-300',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800',
    badgeText: 'Advertencia',
  },
  info: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    badgeText: 'Info',
  },
}

const TYPE_LABELS: Record<string, string> = {
  inactive: 'Inactiva',
  low_adoption: 'Baja adopcion',
  plan_opportunity: 'Oportunidad de plan',
}

export default function PlatformAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const res = await fetch(`${baseUrl}/api/v1/platform/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar las alertas.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} activa{alerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadAlerts}
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-72" />
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-gray-500">No hay alertas activas. Todo esta en orden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, idx) => {
            const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
            return (
              <div
                key={`${alert.orgId}-${alert.type}-${idx}`}
                className={`rounded-lg border-l-4 ${styles.border} ${styles.bg} p-4 shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/platform/organizations/${alert.orgId}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                      >
                        {alert.orgName}
                      </Link>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles.badge}`}>
                        {TYPE_LABELS[alert.type] || alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                  </div>
                  <Link
                    href={`/platform/organizations/${alert.orgId}`}
                    className="ml-4 flex-shrink-0 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Ver org
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
