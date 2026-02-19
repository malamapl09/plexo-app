'use client'

interface IssueData {
  total: number
  open: number
  resolved: number
  escalated: number
  resolutionRate: number
}

interface IssueSummaryProps {
  data?: IssueData
  isLoading: boolean
}

export function IssueSummary({ data, isLoading }: IssueSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay datos disponibles para este período
      </div>
    )
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Incidencias"
          value={data.total}
          icon={<AlertIcon className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          label="Abiertas"
          value={data.open}
          icon={<OpenIcon className="h-5 w-5" />}
          color="yellow"
        />
        <MetricCard
          label="Resueltas"
          value={data.resolved}
          subValue={`${data.resolutionRate}%`}
          icon={<CheckIcon className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          label="Escaladas"
          value={data.escalated}
          icon={<EscalateIcon className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* Resolution Rate Gauge */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Tasa de Resolución</h4>

        <div className="flex items-center">
          {/* Circular Progress */}
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={data.resolutionRate >= 80 ? '#22c55e' : data.resolutionRate >= 50 ? '#eab308' : '#ef4444'}
                strokeWidth="12"
                strokeDasharray={`${data.resolutionRate * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{data.resolutionRate}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="ml-8 flex-1 space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-3" />
                <span className="text-sm text-gray-600">Incidencias Abiertas</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{data.open}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                <span className="text-sm text-gray-600">Incidencias Resueltas</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{data.resolved}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-3" />
                <span className="text-sm text-gray-600">Incidencias Escaladas</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{data.escalated}</span>
            </div>
          </div>
        </div>

        {/* Escalation Alert */}
        {data.escalated > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <EscalateIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-800">
                <strong>{data.escalated}</strong> incidencias escaladas requieren atención inmediata
              </span>
            </div>
          </div>
        )}

        {/* Open Issues Alert */}
        {data.open > 5 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <OpenIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-800">
                Hay <strong>{data.open}</strong> incidencias abiertas pendientes de resolución
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subValue,
  icon,
  color,
}: {
  label: string
  value: number
  subValue?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        {subValue && <span className="text-xs font-medium">{subValue}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75 mt-1">{label}</div>
    </div>
  )
}

// Icons
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function OpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function EscalateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}
