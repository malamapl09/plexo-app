'use client'

import { Fragment } from 'react'
import { PhotoGallery } from '@/components/ui/PhotoGallery'

type IssueCategory = 'MAINTENANCE' | 'CLEANING' | 'SECURITY' | 'IT_SYSTEMS' | 'PERSONNEL' | 'INVENTORY'
type IssueStatus = 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface Issue {
  id: string
  storeId: string
  store: {
    id: string
    name: string
    code: string
  }
  category: IssueCategory
  priority: Priority
  title: string
  description: string
  status: IssueStatus
  reportedBy: {
    id: string
    name: string
  }
  assignedTo?: {
    id: string
    name: string
  }
  photoUrls?: string[]
  resolutionNotes?: string
  isEscalated: boolean
  createdAt: string
  resolvedAt?: string
}

interface IssueDetailModalProps {
  isOpen: boolean
  onClose: () => void
  issue: Issue | null
  onAssign: (issueId: string) => void
  onRecategorize: (issueId: string) => void
}

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  MAINTENANCE: 'Mantenimiento',
  CLEANING: 'Limpieza',
  SECURITY: 'Seguridad',
  IT_SYSTEMS: 'Sistemas/IT',
  PERSONNEL: 'Personal',
  INVENTORY: 'Inventario',
}

const STATUS_LABELS: Record<IssueStatus, string> = {
  REPORTED: 'Reportada',
  ASSIGNED: 'Asignada',
  IN_PROGRESS: 'En Proceso',
  RESOLVED: 'Resuelta',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

export function IssueDetailModal({ isOpen, onClose, issue, onAssign, onRecategorize }: IssueDetailModalProps) {
  if (!isOpen || !issue) return null

  const getCategoryColor = (category: IssueCategory) => {
    switch (category) {
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800'
      case 'CLEANING':
        return 'bg-teal-100 text-teal-800'
      case 'SECURITY':
        return 'bg-red-100 text-red-800'
      case 'IT_SYSTEMS':
        return 'bg-blue-100 text-blue-800'
      case 'PERSONNEL':
        return 'bg-purple-100 text-purple-800'
      case 'INVENTORY':
        return 'bg-indigo-100 text-indigo-800'
    }
  }

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'REPORTED':
        return 'bg-orange-100 text-orange-800'
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-indigo-100 text-indigo-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-red-100 text-red-800'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `hace ${diffMins} minutos`
    if (diffHours < 24) return `hace ${diffHours} horas`
    return `hace ${diffDays} días`
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">Detalle de Incidencia</h2>
                {issue.isEscalated && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Escalada
                  </span>
                )}
              </div>
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
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                    {STATUS_LABELS[issue.status]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(issue.category)}`}>
                    {CATEGORY_LABELS[issue.category]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    Prioridad: {PRIORITY_LABELS[issue.priority]}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{issue.title}</h3>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Descripción</h4>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{issue.description}</p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm">Tienda</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{issue.store.name}</p>
                  <p className="text-sm text-gray-500">{issue.store.code}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">Reportado por</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{issue.reportedBy.name}</p>
                  <p className="text-sm text-gray-500">{formatTimeAgo(issue.createdAt)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm">Asignado a</span>
                  </div>
                  {issue.assignedTo ? (
                    <p className="text-lg font-semibold text-gray-900">{issue.assignedTo.name}</p>
                  ) : (
                    <p className="text-lg font-semibold text-orange-600">Sin asignar</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Fecha de Reporte</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(issue.createdAt).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {issue.resolvedAt && (
                  <div className="bg-green-50 rounded-lg p-4 col-span-2">
                    <div className="flex items-center text-green-600 mb-1">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">Resuelta</span>
                    </div>
                    <p className="text-lg font-semibold text-green-700">
                      {new Date(issue.resolvedAt).toLocaleDateString('es-DO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Photos */}
              <PhotoGallery photos={issue.photoUrls || []} title="Evidencia Fotográfica" />

              {/* Resolution notes */}
              {issue.resolutionNotes && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notas de Resolución</h4>
                  <p className="text-gray-700 bg-green-50 rounded-lg p-4">{issue.resolutionNotes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
              <div className="flex gap-2">
                {issue.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      onRecategorize(issue.id)
                      onClose()
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  >
                    Cambiar Categoria
                  </button>
                )}
                {!issue.assignedTo && issue.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      onAssign(issue.id)
                      onClose()
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Asignar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
