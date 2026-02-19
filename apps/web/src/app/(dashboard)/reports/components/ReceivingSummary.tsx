'use client'

interface ReceivingData {
  total: number
  completed: number
  withIssues: number
  pending: number
  discrepancies: number
}

interface ReceivingSummaryProps {
  data?: ReceivingData
  isLoading: boolean
}

export function ReceivingSummary({ data, isLoading }: ReceivingSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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

  const total = data.total || 1
  const successRate = Math.round((data.completed / total) * 100)
  const issueRate = Math.round((data.withIssues / total) * 100)

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Total Recepciones"
          value={data.total}
          icon={<TruckIcon className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          label="Completadas"
          value={data.completed}
          subValue={`${successRate}%`}
          icon={<CheckIcon className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          label="Con Problemas"
          value={data.withIssues}
          subValue={`${issueRate}%`}
          icon={<AlertIcon className="h-5 w-5" />}
          color="red"
        />
        <MetricCard
          label="Pendientes"
          value={data.pending}
          icon={<ClockIcon className="h-5 w-5" />}
          color="yellow"
        />
        <MetricCard
          label="Discrepancias"
          value={data.discrepancies}
          icon={<ExclamationIcon className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Visual Progress */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Estado de Recepciones</h4>

        {/* Stacked Bar */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Completadas sin problemas</span>
              <span className="font-medium text-green-600">
                {data.completed - data.withIssues} ({Math.round(((data.completed - data.withIssues) / total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${((data.completed - data.withIssues) / total) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Completadas con problemas</span>
              <span className="font-medium text-red-600">
                {data.withIssues} ({issueRate}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${issueRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Pendientes de procesar</span>
              <span className="font-medium text-yellow-600">
                {data.pending} ({Math.round((data.pending / total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(data.pending / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Discrepancy Alert */}
        {data.discrepancies > 0 && (
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationIcon className="h-5 w-5 text-orange-500 mr-2" />
              <span className="text-sm text-orange-800">
                <strong>{data.discrepancies}</strong> discrepancias reportadas requieren atención
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
  color: 'purple' | 'green' | 'red' | 'yellow' | 'orange'
}) {
  const colorClasses = {
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
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
function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
