'use client'

interface TemplateCardProps {
  id: string
  name: string
  description?: string
  departmentName?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  distributionType: 'ALL_STORES' | 'BY_REGION' | 'SPECIFIC_STORES'
  isRecurring: boolean
  usageCount?: number
  isActive: boolean
  onEdit: () => void
  onDelete: () => void
  onCreateTask: () => void
}

const priorityStyles = {
  LOW: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Baja' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Media' },
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: 'Alta' },
}

const distributionLabels = {
  ALL_STORES: 'Todas las tiendas',
  BY_REGION: 'Por region',
  SPECIFIC_STORES: 'Tiendas especificas',
}

export function TemplateCard({
  name,
  description,
  departmentName,
  priority,
  distributionType,
  isRecurring,
  usageCount,
  isActive,
  onEdit,
  onDelete,
  onCreateTask,
}: TemplateCardProps) {
  const priorityStyle = priorityStyles[priority]

  return (
    <div
      className={`bg-white rounded-lg shadow border ${
        isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
              {!isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Inactiva
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
            )}
          </div>

          {/* Actions dropdown */}
          <div className="ml-4 flex-shrink-0">
            <div className="relative group">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="py-1">
                  <button
                    onClick={onEdit}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={onDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Priority */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
          >
            {priorityStyle.label}
          </span>

          {/* Department */}
          {departmentName && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {departmentName}
            </span>
          )}

          {/* Distribution */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            {distributionLabels[distributionType]}
          </span>

          {/* Recurring */}
          {isRecurring && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recurrente
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {usageCount !== undefined && (
              <span>{usageCount} tareas creadas</span>
            )}
          </div>
          <button
            onClick={onCreateTask}
            disabled={!isActive}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Tarea
          </button>
        </div>
      </div>
    </div>
  )
}
