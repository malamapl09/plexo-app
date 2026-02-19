'use client'

interface AnnouncementCardProps {
  id: string
  title: string
  summary?: string
  type: 'SYSTEM_ALERT' | 'OPERATIONAL_UPDATE' | 'POLICY_UPDATE' | 'TRAINING' | 'EMERGENCY' | 'GENERAL'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  scope: string
  requiresAck: boolean
  publishedAt?: string
  viewCount?: number
  ackCount?: number
  totalRecipients?: number
  onClick: () => void
  onEdit: () => void
  onPublish: () => void
  onArchive: () => void
}

const typeStyles = {
  SYSTEM_ALERT: { bg: 'bg-red-100', text: 'text-red-800', label: 'Alerta del Sistema' },
  OPERATIONAL_UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Actualizacion Operativa' },
  POLICY_UPDATE: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Actualizacion de Politica' },
  TRAINING: { bg: 'bg-green-100', text: 'text-green-800', label: 'Capacitacion' },
  EMERGENCY: { bg: 'bg-red-100', text: 'text-red-800', label: 'Emergencia' },
  GENERAL: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'General' },
}

const priorityStyles = {
  LOW: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Baja' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Media' },
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: 'Alta' },
}

const statusStyles = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Borrador' },
  PUBLISHED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Publicado' },
  ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Archivado' },
}

export function AnnouncementCard({
  id,
  title,
  summary,
  type,
  priority,
  status,
  scope,
  requiresAck,
  publishedAt,
  viewCount = 0,
  ackCount = 0,
  totalRecipients = 0,
  onClick,
  onEdit,
  onPublish,
  onArchive,
}: AnnouncementCardProps) {
  const typeStyle = typeStyles[type]
  const priorityStyle = priorityStyles[priority]
  const statusStyle = statusStyles[status]

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getViewPercentage = () => {
    if (totalRecipients === 0) return 0
    return Math.round((viewCount / totalRecipients) * 100)
  }

  const getAckPercentage = () => {
    if (totalRecipients === 0) return 0
    return Math.round((ackCount / totalRecipients) * 100)
  }

  return (
    <div
      className={`bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
        status === 'ARCHIVED' ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                {typeStyle.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            {summary && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{summary}</p>
            )}
          </div>

          {/* Actions dropdown */}
          <div className="ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="relative group">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="py-1">
                  {status === 'DRAFT' && (
                    <>
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
                        onClick={onPublish}
                        className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Publicar
                      </button>
                    </>
                  )}
                  {status === 'PUBLISHED' && (
                    <button
                      onClick={onArchive}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Archivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
            Prioridad: {priorityStyle.label}
          </span>

          {requiresAck && (
            <span className="inline-flex items-center text-xs text-orange-600">
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Requiere confirmacion
            </span>
          )}

          {publishedAt && (
            <span className="text-xs text-gray-400">
              Publicado: {formatDate(publishedAt)}
            </span>
          )}
        </div>

        {/* Analytics (for published) */}
        {status === 'PUBLISHED' && totalRecipients > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Vistas</span>
                  <span className="font-medium">{viewCount}/{totalRecipients}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${getViewPercentage()}%` }}
                  />
                </div>
              </div>
              {requiresAck && (
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Confirmados</span>
                    <span className="font-medium">{ackCount}/{totalRecipients}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${getAckPercentage()}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
