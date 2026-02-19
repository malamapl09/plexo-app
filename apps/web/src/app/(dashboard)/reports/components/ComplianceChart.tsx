'use client'

interface TasksData {
  total: number
  completed: number
  pending: number
  overdue: number
  complianceRate: number
}

interface ComplianceChartProps {
  data?: TasksData
  isLoading: boolean
}

export function ComplianceChart({ data, isLoading }: ComplianceChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
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

  const total = data.total || 1 // Avoid division by zero
  const completedPercent = (data.completed / total) * 100
  const pendingPercent = (data.pending / total) * 100
  const overduePercent = (data.overdue / total) * 100

  return (
    <div>
      {/* Progress Bar Visualization */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Distribución de Tareas</h4>
          <span className="text-sm text-gray-500">{data.total} tareas totales</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden">
          <div
            className="bg-green-500 h-8 flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
            style={{ width: `${completedPercent}%` }}
          >
            {completedPercent > 10 && `${data.completed}`}
          </div>
          <div
            className="bg-yellow-500 h-8 flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
            style={{ width: `${pendingPercent}%` }}
          >
            {pendingPercent > 10 && `${data.pending}`}
          </div>
          <div
            className="bg-red-500 h-8 flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
            style={{ width: `${overduePercent}%` }}
          >
            {overduePercent > 10 && `${data.overdue}`}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <span className="text-gray-600">Completadas ({data.completed})</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
            <span className="text-gray-600">Pendientes ({data.pending})</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            <span className="text-gray-600">Atrasadas ({data.overdue})</span>
          </div>
        </div>
      </div>

      {/* Compliance Rate Gauge */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
              strokeDasharray="282.7"
              strokeDashoffset="70.7"
              transform="rotate(135 50 50)"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={data.complianceRate >= 90 ? '#22c55e' : data.complianceRate >= 70 ? '#eab308' : '#ef4444'}
              strokeWidth="10"
              strokeDasharray="282.7"
              strokeDashoffset={282.7 - (data.complianceRate / 100) * 212}
              strokeLinecap="round"
              transform="rotate(135 50 50)"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">{data.complianceRate}%</span>
            <span className="text-sm text-gray-500">Cumplimiento</span>
          </div>
        </div>
        <div className="ml-8 space-y-3">
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <span className="text-gray-600">Excelente (90%+)</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <span className="text-gray-600">Aceptable (70-89%)</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <span className="text-gray-600">Necesita Mejora (&lt;70%)</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-4 gap-4">
        <StatBox label="Total" value={data.total} color="blue" />
        <StatBox label="Completadas" value={data.completed} color="green" />
        <StatBox label="Pendientes" value={data.pending} color="yellow" />
        <StatBox label="Atrasadas" value={data.overdue} color="red" />
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} text-center`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
    </div>
  )
}
