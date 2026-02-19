type EntityType = 'TASK_ASSIGNMENT' | 'ISSUE'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface PendingVerificationItem {
  entityType: EntityType
  entityId: string
  title: string
  description?: string
  priority: Priority
  store: {
    id: string
    name: string
    code: string
  }
  submittedBy: {
    id: string
    name: string
    email?: string
    role?: string
  }
  submittedAt?: string
  notes?: string
  photoUrls: string[]
  category?: string
}

interface VerificationCardProps {
  item: PendingVerificationItem
  getRoleLabel: (role?: string) => string
  onVerify: () => void
  onReject: () => void
}

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800'
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800'
    case 'LOW':
      return 'bg-green-100 text-green-800'
  }
}

const getPriorityLabel = (priority: Priority) => {
  switch (priority) {
    case 'HIGH':
      return 'Alta'
    case 'MEDIUM':
      return 'Media'
    case 'LOW':
      return 'Baja'
  }
}

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'MAINTENANCE':
      return 'Mantenimiento'
    case 'CLEANING':
      return 'Limpieza'
    case 'SECURITY':
      return 'Seguridad'
    case 'IT_SYSTEMS':
      return 'Sistemas/IT'
    case 'PERSONNEL':
      return 'Personal'
    case 'INVENTORY':
      return 'Inventario'
    default:
      return category
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VerificationCard({
  item,
  getRoleLabel,
  onVerify,
  onReject,
}: VerificationCardProps) {
  const isTask = item.entityType === 'TASK_ASSIGNMENT'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isTask ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
          }`}
        >
          {isTask ? (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {isTask ? 'Tarea' : 'Incidencia'}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
            item.priority
          )}`}
        >
          {getPriorityLabel(item.priority)}
        </span>
        {item.category && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {getCategoryLabel(item.category)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
        {item.title}
      </h3>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
      )}

      {/* Meta info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          {item.store.name} ({item.store.code})
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="truncate">
            {item.submittedBy.name} ({getRoleLabel(item.submittedBy.role)})
          </span>
        </div>
        {item.submittedAt && (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatDate(item.submittedAt)}
          </div>
        )}
      </div>

      {/* Notes */}
      {item.notes && (
        <div className="bg-gray-50 rounded-md p-2 mb-3">
          <p className="text-sm text-gray-600 line-clamp-2">{item.notes}</p>
        </div>
      )}

      {/* Photos indicator */}
      {item.photoUrls.length > 0 && (
        <div className="flex items-center text-sm text-blue-600 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {item.photoUrls.length} foto(s)
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={onReject}
          className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rechazar
        </button>
        <button
          onClick={onVerify}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Verificar
        </button>
      </div>
    </div>
  )
}
