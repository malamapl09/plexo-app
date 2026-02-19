'use client'

interface DashboardData {
  reportDate: string
  periodStart: string
  periodEnd: string
  tasks: {
    total: number
    completed: number
    pending: number
    overdue: number
    complianceRate: number
  }
  receiving: {
    total: number
    completed: number
    withIssues: number
    pending: number
    discrepancies: number
  }
  issues: {
    total: number
    open: number
    resolved: number
    escalated: number
    resolutionRate: number
  }
}

interface DashboardSummaryProps {
  data: DashboardData | null
  isLoading: boolean
}

export function DashboardSummary({ data, isLoading }: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Tasks Summary */}
      <SummaryCard
        title="Tareas"
        icon={<ClipboardIcon className="h-6 w-6 text-blue-600" />}
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        isLoading={isLoading}
      >
        {data && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-gray-900">{data.tasks.complianceRate}%</span>
              <span className="text-sm text-gray-500">cumplimiento</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-medium">{data.tasks.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Completadas:</span>
                <span className="font-medium text-green-600">{data.tasks.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pendientes:</span>
                <span className="font-medium text-yellow-600">{data.tasks.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Atrasadas:</span>
                <span className="font-medium text-red-600">{data.tasks.overdue}</span>
              </div>
            </div>
          </>
        )}
      </SummaryCard>

      {/* Receiving Summary */}
      <SummaryCard
        title="Recepciones"
        icon={<TruckIcon className="h-6 w-6 text-purple-600" />}
        bgColor="bg-purple-50"
        borderColor="border-purple-200"
        isLoading={isLoading}
      >
        {data && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-gray-900">{data.receiving.total}</span>
              <span className="text-sm text-gray-500">recepciones</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Completadas:</span>
                <span className="font-medium text-green-600">{data.receiving.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Con problemas:</span>
                <span className="font-medium text-red-600">{data.receiving.withIssues}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pendientes:</span>
                <span className="font-medium text-yellow-600">{data.receiving.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discrepancias:</span>
                <span className="font-medium text-orange-600">{data.receiving.discrepancies}</span>
              </div>
            </div>
          </>
        )}
      </SummaryCard>

      {/* Issues Summary */}
      <SummaryCard
        title="Incidencias"
        icon={<AlertIcon className="h-6 w-6 text-red-600" />}
        bgColor="bg-red-50"
        borderColor="border-red-200"
        isLoading={isLoading}
      >
        {data && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-gray-900">{data.issues.resolutionRate}%</span>
              <span className="text-sm text-gray-500">resolución</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-medium">{data.issues.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Abiertas:</span>
                <span className="font-medium text-yellow-600">{data.issues.open}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Resueltas:</span>
                <span className="font-medium text-green-600">{data.issues.resolved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Escaladas:</span>
                <span className="font-medium text-red-600">{data.issues.escalated}</span>
              </div>
            </div>
          </>
        )}
      </SummaryCard>
    </div>
  )
}

function SummaryCard({
  title,
  icon,
  bgColor,
  borderColor,
  isLoading,
  children,
}: {
  title: string
  icon: React.ReactNode
  bgColor: string
  borderColor: string
  isLoading: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${borderColor}`}>
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-10 w-10 rounded-md ${bgColor} flex items-center justify-center`}>
            {icon}
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">{title}</h3>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
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
