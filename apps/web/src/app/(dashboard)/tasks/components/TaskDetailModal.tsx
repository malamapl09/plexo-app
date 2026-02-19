'use client'

import { Fragment } from 'react'
import { PhotoGallery } from '@/components/ui/PhotoGallery'

interface TaskAssignment {
  id: string
  status: string
  notes?: string
  photoUrls: string[]
  store?: {
    id: string
    name: string
    code: string
  }
  completedAt?: string
}

interface Task {
  id: string
  title: string
  description?: string
  department?: {
    id: string
    name: string
  }
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  scheduledTime?: string
  dueTime?: string
  assignmentCount: number
  completedCount: number
  completionRate: number
  createdAt: string
  assignments?: TaskAssignment[]
}

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  if (!isOpen || !task) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'Alta'
      case 'MEDIUM':
        return 'Media'
      case 'LOW':
        return 'Baja'
      default:
        return priority
    }
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Detalle de Tarea</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {/* Title and badges */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  {task.department && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {task.department.name}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{task.title}</h3>
              </div>

              {/* Description */}
              {task.description && (
                <div className="mb-6">
                  <p className="text-gray-600">{task.description}</p>
                </div>
              )}

              {/* Progress */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso de Cumplimiento</span>
                  <span className={`text-2xl font-bold ${getCompletionColor(task.completionRate)}`}>
                    {task.completionRate.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      task.completionRate >= 80
                        ? 'bg-green-500'
                        : task.completionRate >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${task.completionRate}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {task.completedCount} de {task.assignmentCount} tiendas han completado esta tarea
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                {task.scheduledTime && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">Hora Programada</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{task.scheduledTime}</p>
                  </div>
                )}

                {task.dueTime && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      <span className="text-sm">Hora Límite</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{task.dueTime}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm">Tiendas Asignadas</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{task.assignmentCount}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Fecha de Creación</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(task.createdAt).toLocaleDateString('es-DO')}
                  </p>
                </div>
              </div>

              {/* Store Assignments Detail */}
              {task.assignments && task.assignments.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalle por Tienda</h4>
                  <div className="space-y-4">
                    {task.assignments.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium text-gray-900">
                              {assignment.store ? `${assignment.store.name} (${assignment.store.code})` : 'Tienda'}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            assignment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : assignment.status === 'IN_PROGRESS'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status === 'COMPLETED' ? 'Completada' : assignment.status === 'IN_PROGRESS' ? 'En Progreso' : 'Pendiente'}
                          </span>
                        </div>

                        {assignment.completedAt && (
                          <p className="text-sm text-gray-500 mb-2">
                            Completada: {new Date(assignment.completedAt).toLocaleString('es-DO')}
                          </p>
                        )}

                        {assignment.notes && (
                          <p className="text-sm text-gray-600 mb-2">{assignment.notes}</p>
                        )}

                        {assignment.photoUrls.length > 0 && (
                          <PhotoGallery photos={assignment.photoUrls} title="Fotos de completitud" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
