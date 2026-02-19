'use client'

import { useState } from 'react'

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

interface IssuesTableProps {
  issues: Issue[]
  isLoading: boolean
  onAssign: (issueId: string) => void
  onViewDetails: (issue: Issue) => void
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

export function IssuesTable({ issues, isLoading, onAssign, onViewDetails }: IssuesTableProps) {
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'ALL'>('ALL')

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false
    if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false
    return true
  })

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
        return 'text-gray-600'
      case 'MEDIUM':
        return 'text-amber-600'
      case 'HIGH':
        return 'text-red-600'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `hace ${diffMins} min`
    if (diffHours < 24) return `hace ${diffHours}h`
    return `hace ${diffDays}d`
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="animate-pulse p-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 py-4 border-t border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      {/* Filters */}
      <div className="border-b border-gray-200 px-4 py-3 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'ALL')}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
          >
            <option value="ALL">Todos</option>
            <option value="REPORTED">Reportadas</option>
            <option value="ASSIGNED">Asignadas</option>
            <option value="IN_PROGRESS">En Proceso</option>
            <option value="RESOLVED">Resueltas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as IssueCategory | 'ALL')}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
          >
            <option value="ALL">Todas</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="CLEANING">Limpieza</option>
            <option value="SECURITY">Seguridad</option>
            <option value="IT_SYSTEMS">Sistemas/IT</option>
            <option value="PERSONNEL">Personal</option>
            <option value="INVENTORY">Inventario</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Incidencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tienda
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asignado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No hay incidencias que mostrar
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewDetails(issue)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      {issue.isEscalated && (
                        <span className="flex-shrink-0 mr-2">
                          <svg
                            className="h-5 w-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                      <div>
                        <div className="flex items-center">
                          <span className={`font-medium ${getPriorityColor(issue.priority)}`}>
                            {issue.priority === 'HIGH' && '↑ '}
                            {issue.priority === 'LOW' && '↓ '}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{issue.title}</span>
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {issue.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Reportado por: {issue.reportedBy.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{issue.store.name}</div>
                    <div className="text-sm text-gray-500">{issue.store.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(
                        issue.category
                      )}`}
                    >
                      {CATEGORY_LABELS[issue.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {STATUS_LABELS[issue.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {issue.assignedTo ? (
                      issue.assignedTo.name
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAssign(issue.id)
                        }}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Asignar
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeAgo(issue.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(issue)
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
