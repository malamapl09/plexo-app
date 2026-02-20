'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface OrgHealth {
  id: string
  name: string
  slug: string
  plan: string
  lastLogin: string | null
  activeUsers7d: number
  activeUsers30d: number
  totalUsers: number
  moduleAdoption: {
    tasks: boolean
    issues: boolean
    checklists: boolean
    audits: boolean
    training: boolean
  }
  taskCompletionRate: number | null
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return 'Nunca'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function isStale(dateStr: string | null): boolean {
  if (!dateStr) return true
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff > 7 * 24 * 60 * 60 * 1000 // > 7 days
}

const planBadgeColor = (plan: string) => {
  switch (plan) {
    case 'enterprise': return 'bg-purple-100 text-purple-800'
    case 'pro': return 'bg-blue-100 text-blue-800'
    case 'starter': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function ModuleDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`inline-block w-3 h-3 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`}
    />
  )
}

function CompletionBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-xs text-gray-400">—</span>
  let color = 'text-red-600'
  if (rate >= 70) color = 'text-green-600'
  else if (rate >= 40) color = 'text-yellow-600'
  return <span className={`text-sm font-medium ${color}`}>{rate}%</span>
}

export default function PlatformHealthPage() {
  const [data, setData] = useState<OrgHealth[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHealth()
  }, [])

  const loadHealth = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const res = await fetch(`${baseUrl}/api/v1/platform/health`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      const result = await res.json()
      setData(Array.isArray(result) ? result : [])
    } catch {
      setError('No se pudieron cargar las metricas de salud.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salud de Organizaciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Metricas de actividad y adopcion por organizacion
          </p>
        </div>
        <button
          onClick={loadHealth}
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
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No hay organizaciones activas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organizacion</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ultimo login</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Activos 7d</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Modulos</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/platform/organizations/${org.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        {org.name}
                      </Link>
                      <p className="text-xs text-gray-500">{org.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${planBadgeColor(org.plan)}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`text-sm ${isStale(org.lastLogin) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {relativeTime(org.lastLogin)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {org.activeUsers7d}/{org.totalUsers}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <ModuleDot active={org.moduleAdoption.tasks} label="Tareas" />
                        <ModuleDot active={org.moduleAdoption.issues} label="Incidencias" />
                        <ModuleDot active={org.moduleAdoption.checklists} label="Checklists" />
                        <ModuleDot active={org.moduleAdoption.audits} label="Auditorias" />
                        <ModuleDot active={org.moduleAdoption.training} label="Capacitacion" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <CompletionBadge rate={org.taskCompletionRate} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/platform/organizations/${org.id}/activity`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Actividad
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span>Modulos:</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> Activo</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300" /> Sin datos</span>
          <span className="ml-4">Orden: Tareas, Incidencias, Checklists, Auditorias, Capacitacion</span>
        </div>
      )}
    </div>
  )
}
