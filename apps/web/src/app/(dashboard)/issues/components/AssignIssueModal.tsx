'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: { id: string; name: string } | null
  store?: { id: string; name: string } | null
  isActive: boolean
  issueCategories?: string[]
}

interface AssignIssueModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (userId: string) => void
  issueTitle: string
  issueCategory?: string // Category of the issue being assigned
}

const roleLabels: Record<string, string> = {
  OPERATIONS_MANAGER: 'Gerente de Operaciones',
  HQ_TEAM: 'Equipo HQ',
  REGIONAL_SUPERVISOR: 'Supervisor Regional',
  STORE_MANAGER: 'Gerente de Tienda',
  DEPT_SUPERVISOR: 'Supervisor de Departamento',
}

const issueCategoryLabels: Record<string, string> = {
  MAINTENANCE: 'Mantenimiento',
  CLEANING: 'Limpieza',
  SECURITY: 'Seguridad',
  IT_SYSTEMS: 'Sistemas IT',
  PERSONNEL: 'Personal',
  INVENTORY: 'Inventario',
}

export function AssignIssueModal({ isOpen, onClose, onAssign, issueTitle, issueCategory }: AssignIssueModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const userList = Array.isArray(data) ? data : (data.data || data.users || [])
        // Filter only active users
        setUsers(userList.filter((u: User) => u.isActive))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) return

    setIsSubmitting(true)
    try {
      onAssign(selectedUserId)
      onClose()
    } finally {
      setIsSubmitting(false)
      setSelectedUserId('')
      setSearchQuery('')
    }
  }

  const handleClose = () => {
    setSelectedUserId('')
    setSearchQuery('')
    setShowRecommendedOnly(false)
    onClose()
  }

  const getUserDisplayRole = (user: User): string => {
    if (user.department?.name) {
      return user.department.name
    }
    if (user.store?.name) {
      return user.store.name
    }
    return roleLabels[user.role] || user.role
  }

  // Check if user can handle the issue category
  const canHandleCategory = (user: User): boolean => {
    if (!issueCategory) return false
    return user.issueCategories?.includes(issueCategory) || false
  }

  // Count recommended users
  const recommendedCount = users.filter(canHandleCategory).length

  const filteredUsers = users
    .filter((user) => {
      // Filter by recommended only if toggle is on
      if (showRecommendedOnly && !canHandleCategory(user)) {
        return false
      }

      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.department?.name || '').toLowerCase().includes(query) ||
        (roleLabels[user.role] || user.role).toLowerCase().includes(query)
      )
    })
    // Sort: users who can handle category first
    .sort((a, b) => {
      const aCanHandle = canHandleCategory(a)
      const bCanHandle = canHandleCategory(b)
      if (aCanHandle && !bCanHandle) return -1
      if (!aCanHandle && bCanHandle) return 1
      return a.name.localeCompare(b.name)
    })

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            Asignar Incidencia
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500">
            Selecciona un usuario para asignar la incidencia: <strong>{issueTitle}</strong>
            {issueCategory && (
              <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
                {issueCategoryLabels[issueCategory] || issueCategory}
              </span>
            )}
          </Dialog.Description>

          {/* Search and Filter */}
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />

            {/* Recommended filter toggle */}
            {issueCategory && recommendedCount > 0 && (
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRecommendedOnly}
                  onChange={(e) => setShowRecommendedOnly(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Mostrar solo recomendados ({recommendedCount})
                </span>
              </label>
            )}
          </div>

          <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center p-3 border rounded-lg animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUserId === user.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="user"
                    value={user.id}
                    checked={selectedUserId === user.id}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      {canHandleCategory(user) && (
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{getUserDisplayRole(user)}</p>
                  </div>
                  {selectedUserId === user.id && (
                    <svg
                      className="ml-2 h-5 w-5 text-red-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </label>
              ))
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedUserId || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
