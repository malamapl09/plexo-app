'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PlatformStats {
  totalOrgs: number
  activeOrgs: number
  totalUsers: number
  totalStores?: number
  newOrgsThisMonth?: number
  loginsToday?: number
  tasksCompletedToday?: number
}

function StatCard({
  label,
  value,
  description,
  icon,
  colorClass,
}: {
  label: string
  value: number | string
  description?: string
  icon: React.ReactNode
  colorClass: string
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colorClass}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
              </dd>
              {description && (
                <dd className="text-xs text-gray-400 mt-0.5">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [alertsCount, setAlertsCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const headers = { Authorization: `Bearer ${token}` }

      const [statsRes, alertsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/platform/stats`, { headers }),
        fetch(`${baseUrl}/api/v1/platform/alerts`, { headers }),
      ])

      if (!statsRes.ok) {
        throw new Error(`Error ${statsRes.status}`)
      }

      const data = await statsRes.json()
      setStats(data)

      if (alertsRes.ok) {
        const alerts = await alertsRes.json()
        setAlertsCount(Array.isArray(alerts) ? alerts.length : 0)
      }
    } catch (err) {
      setError('No se pudieron cargar las estadisticas.')
      console.error('Error loading platform stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vision general de la plataforma Plexo
          </p>
        </div>
        <div className="mt-4 flex gap-3 md:mt-0 md:ml-4">
          <button
            onClick={loadStats}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          <Link
            href="/platform/organizations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Organizacion
          </Link>
        </div>
      </div>

      {/* Error state */}
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

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-md" />
                  <div className="ml-5 flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-7 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total de Organizaciones"
            value={stats.totalOrgs}
            description="Organizaciones registradas en la plataforma"
            colorClass="bg-indigo-50"
            icon={
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <StatCard
            label="Organizaciones Activas"
            value={stats.activeOrgs}
            description={
              stats.totalOrgs > 0
                ? `${Math.round((stats.activeOrgs / stats.totalOrgs) * 100)}% del total`
                : undefined
            }
            colorClass="bg-green-50"
            icon={
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            label="Total de Usuarios"
            value={stats.totalUsers}
            description="Usuarios en todas las organizaciones"
            colorClass="bg-blue-50"
            icon={
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          {typeof stats.totalStores === 'number' && (
            <StatCard
              label="Total de Tiendas"
              value={stats.totalStores}
              description="Tiendas en todas las organizaciones"
              colorClass="bg-yellow-50"
              icon={
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
          )}

          {typeof stats.newOrgsThisMonth === 'number' && (
            <StatCard
              label="Nuevas este mes"
              value={stats.newOrgsThisMonth}
              description="Organizaciones creadas en los ultimos 30 dias"
              colorClass="bg-purple-50"
              icon={
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          )}

          {typeof stats.loginsToday === 'number' && (
            <StatCard
              label="Logins hoy"
              value={stats.loginsToday}
              description="Inicios de sesion en todas las organizaciones"
              colorClass="bg-teal-50"
              icon={
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              }
            />
          )}

          {typeof stats.tasksCompletedToday === 'number' && (
            <StatCard
              label="Tareas completadas hoy"
              value={stats.tasksCompletedToday}
              description="Tareas finalizadas en todas las organizaciones"
              colorClass="bg-emerald-50"
              icon={
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          )}
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Acciones rapidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/platform/organizations"
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none"
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">Ver Organizaciones</span>
              <p className="text-xs text-gray-500">Administrar todas las organizaciones cliente</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/platform/organizations/new"
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none"
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">Nueva Organizacion</span>
              <p className="text-xs text-gray-500">Crear un nuevo cliente en la plataforma</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/platform/alerts"
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none"
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">
                Alertas{alertsCount != null && alertsCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {alertsCount}
                  </span>
                )}
              </span>
              <p className="text-xs text-gray-500">Organizaciones inactivas, baja adopcion y oportunidades</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/platform/health"
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none"
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">Salud de Organizaciones</span>
              <p className="text-xs text-gray-500">Actividad, adopcion de modulos y metricas por org</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
