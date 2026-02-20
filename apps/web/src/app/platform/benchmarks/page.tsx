'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BenchmarkOrg {
  orgId: string
  orgName: string
  plan: string
  totalUsers: number
  metrics: {
    taskCompletionRate: number | null
    avgAuditScore: number | null
    trainingCompletionRate: number | null
    gamificationEngagement: number | null
  }
}

type SortKey = 'orgName' | 'totalUsers' | 'taskCompletionRate' | 'avgAuditScore' | 'trainingCompletionRate' | 'gamificationEngagement'

function MetricCell({ value, suffix, thresholds }: { value: number | null; suffix?: string; thresholds?: { green: number; yellow: number } }) {
  if (value === null) return <span className="text-xs text-gray-400">—</span>
  let color = 'text-gray-700'
  if (thresholds) {
    if (value >= thresholds.green) color = 'text-green-600'
    else if (value >= thresholds.yellow) color = 'text-yellow-600'
    else color = 'text-red-600'
  }
  return <span className={`text-sm font-medium ${color}`}>{value}{suffix || ''}</span>
}

const planBadgeColor = (plan: string) => {
  switch (plan) {
    case 'enterprise': return 'bg-purple-100 text-purple-800'
    case 'pro': return 'bg-blue-100 text-blue-800'
    case 'starter': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function PlatformBenchmarksPage() {
  const [data, setData] = useState<BenchmarkOrg[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('orgName')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    loadBenchmarks()
  }, [])

  const loadBenchmarks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const res = await fetch(`${baseUrl}/api/v1/platform/benchmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      const result = await res.json()
      setData(Array.isArray(result) ? result : [])
    } catch {
      setError('No se pudieron cargar las metricas comparativas.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const getValue = (org: BenchmarkOrg, key: SortKey): string | number | null => {
    switch (key) {
      case 'orgName': return org.orgName
      case 'totalUsers': return org.totalUsers
      default: return org.metrics[key]
    }
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = getValue(a, sortKey)
    const bVal = getValue(b, sortKey)
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return 1
    if (bVal === null) return -1
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortAsc ? cmp : -cmp
  })

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === sortKeyName && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
            {sortAsc ? (
              <path d="M6 2l4 5H2l4-5z" />
            ) : (
              <path d="M6 10l4-5H2l4 5z" />
            )}
          </svg>
        )}
      </span>
    </th>
  )

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comparativa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Metricas de rendimiento entre organizaciones
          </p>
        </div>
        <button
          onClick={loadBenchmarks}
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No hay organizaciones activas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader label="Organizacion" sortKeyName="orgName" />
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <SortHeader label="Usuarios" sortKeyName="totalUsers" />
                  <SortHeader label="Tareas %" sortKeyName="taskCompletionRate" />
                  <SortHeader label="Audit Score" sortKeyName="avgAuditScore" />
                  <SortHeader label="Training %" sortKeyName="trainingCompletionRate" />
                  <SortHeader label="Gamificacion %" sortKeyName="gamificationEngagement" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.map((org) => (
                  <tr key={org.orgId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/platform/organizations/${org.orgId}`}
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        {org.orgName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${planBadgeColor(org.plan)}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700 whitespace-nowrap">
                      {org.totalUsers}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <MetricCell value={org.metrics.taskCompletionRate} suffix="%" thresholds={{ green: 70, yellow: 40 }} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <MetricCell value={org.metrics.avgAuditScore} suffix="" thresholds={{ green: 70, yellow: 40 }} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <MetricCell value={org.metrics.trainingCompletionRate} suffix="%" thresholds={{ green: 70, yellow: 40 }} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <MetricCell value={org.metrics.gamificationEngagement} suffix="%" thresholds={{ green: 50, yellow: 20 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
