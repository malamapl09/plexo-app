'use client'

interface IssueStats {
  total: number
  reported: number
  assigned: number
  inProgress: number
  resolved: number
  escalated: number
  avgResolutionTimeHours: number
}

interface IssueStatsCardsProps {
  stats: IssueStats
  isLoading: boolean
}

export function IssueStatsCards({ stats, isLoading }: IssueStatsCardsProps) {
  const openCount = stats.reported + stats.assigned + stats.inProgress
  const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0

  const statCards = [
    {
      name: 'Total de Incidencias',
      value: stats.total,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: 'bg-gray-100 text-gray-800',
      iconColor: 'text-gray-600',
    },
    {
      name: 'Abiertas',
      value: openCount,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-orange-100 text-orange-800',
      iconColor: 'text-orange-600',
    },
    {
      name: 'Escaladas',
      value: stats.escalated,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: 'bg-red-100 text-red-800',
      iconColor: 'text-red-600',
    },
    {
      name: 'Resueltas',
      value: stats.resolved,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'bg-green-100 text-green-800',
      iconColor: 'text-green-600',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="bg-white shadow rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Tasa de Resolución</span>
          <span className="text-sm font-semibold text-gray-900">{resolutionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${resolutionRate}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Tiempo promedio: {stats.avgResolutionTimeHours.toFixed(1)} horas</span>
          <span>{stats.resolved} de {stats.total} resueltas</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                  <div className={stat.iconColor}>{stat.icon}</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-orange-400 mr-2"></div>
            <span className="text-sm text-gray-600">Reportadas</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.reported}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-400 mr-2"></div>
            <span className="text-sm text-gray-600">Asignadas</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.assigned}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-indigo-400 mr-2"></div>
            <span className="text-sm text-gray-600">En Proceso</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-400 mr-2"></div>
            <span className="text-sm text-gray-600">Resueltas</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.resolved}</p>
        </div>
      </div>
    </div>
  )
}
