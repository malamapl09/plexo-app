'use client'

interface ReceivingStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  withIssue: number
  didNotArrive: number
  totalDiscrepancies: number
}

interface ReceivingStatsCardsProps {
  stats: ReceivingStats
  isLoading: boolean
}

export function ReceivingStatsCards({ stats, isLoading }: ReceivingStatsCardsProps) {
  const processed = stats.completed + stats.withIssue
  const completionRate = stats.total > 0 ? (processed / stats.total) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium opacity-90">Recepciones del Día</h3>
            <p className="text-sm opacity-70">
              {processed} de {stats.total} procesadas
            </p>
          </div>
          {isLoading ? (
            <div className="h-12 w-20 bg-white/20 rounded animate-pulse" />
          ) : (
            <div className="text-right">
              <span className="text-4xl font-bold">{completionRate.toFixed(0)}%</span>
            </div>
          )}
        </div>
        <div className="w-full bg-white/30 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<TruckIcon />}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={<ClockIcon />}
          color="yellow"
          isLoading={isLoading}
        />
        <StatCard
          title="En Proceso"
          value={stats.inProgress}
          icon={<SyncIcon />}
          color="indigo"
          isLoading={isLoading}
        />
        <StatCard
          title="Completadas"
          value={stats.completed}
          icon={<CheckIcon />}
          color="green"
          isLoading={isLoading}
        />
        <StatCard
          title="Con Incidencias"
          value={stats.withIssue}
          icon={<WarningIcon />}
          color="red"
          isLoading={isLoading}
        />
        <StatCard
          title="No Llegaron"
          value={stats.didNotArrive}
          icon={<CancelIcon />}
          color="gray"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
  isLoading,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'yellow' | 'indigo' | 'green' | 'red' | 'gray'
  isLoading: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  const valueColors = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    indigo: 'text-indigo-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div className="ml-3">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          {isLoading ? (
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className={`text-xl font-bold ${valueColors[color]}`}>{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Icons
function TruckIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function SyncIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function CancelIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
