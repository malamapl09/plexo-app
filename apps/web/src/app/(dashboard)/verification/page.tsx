'use client'

import { useState, useEffect } from 'react'
import { VerificationCard } from './components/VerificationCard'
import { VerifyModal } from './components/VerifyModal'
import { RejectModal } from './components/RejectModal'

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

interface PendingVerifications {
  tasks: PendingVerificationItem[]
  issues: PendingVerificationItem[]
  totalCount: number
}

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'issues'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<PendingVerifications>({
    tasks: [],
    issues: [],
    totalCount: 0,
  })
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PendingVerificationItem | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchPendingVerifications = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${baseUrl}/api/v1/verification/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching pending verifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingVerifications()
  }, [])

  const handleVerify = async (notes?: string) => {
    if (!selectedItem) return
    setIsProcessing(true)

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const endpoint =
        selectedItem.entityType === 'TASK_ASSIGNMENT'
          ? `${baseUrl}/api/v1/verification/tasks/${selectedItem.entityId}/verify`
          : `${baseUrl}/api/v1/verification/issues/${selectedItem.entityId}/verify`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })

      if (response.ok) {
        setVerifyModalOpen(false)
        setSelectedItem(null)
        fetchPendingVerifications()
      }
    } catch (error) {
      console.error('Error verifying item:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (rejectionReason: string) => {
    if (!selectedItem) return
    setIsProcessing(true)

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const endpoint =
        selectedItem.entityType === 'TASK_ASSIGNMENT'
          ? `${baseUrl}/api/v1/verification/tasks/${selectedItem.entityId}/reject`
          : `${baseUrl}/api/v1/verification/issues/${selectedItem.entityId}/reject`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason }),
      })

      if (response.ok) {
        setRejectModalOpen(false)
        setSelectedItem(null)
        fetchPendingVerifications()
      }
    } catch (error) {
      console.error('Error rejecting item:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const openVerifyModal = (item: PendingVerificationItem) => {
    setSelectedItem(item)
    setVerifyModalOpen(true)
  }

  const openRejectModal = (item: PendingVerificationItem) => {
    setSelectedItem(item)
    setRejectModalOpen(true)
  }

  const getFilteredItems = (): PendingVerificationItem[] => {
    switch (activeTab) {
      case 'tasks':
        return data.tasks
      case 'issues':
        return data.issues
      default:
        return [...data.tasks, ...data.issues]
    }
  }

  const getRoleLabel = (role?: string): string => {
    switch (role) {
      case 'DEPT_SUPERVISOR':
        return 'Supervisor de Depto.'
      case 'STORE_MANAGER':
        return 'Gerente de Tienda'
      case 'REGIONAL_SUPERVISOR':
        return 'Supervisor Regional'
      case 'HQ_TEAM':
        return 'Equipo Central'
      case 'OPERATIONS_MANAGER':
        return 'Gerente de Operaciones'
      default:
        return role || 'Empleado'
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificaciones Pendientes</h1>
          <p className="text-gray-600 mt-1">
            {data.totalCount} items pendientes de verificación
          </p>
        </div>
        <button
          onClick={fetchPendingVerifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Todos ({data.totalCount})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tareas ({data.tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issues'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Incidencias ({data.issues.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : getFilteredItems().length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No hay verificaciones pendientes
          </h3>
          <p className="mt-2 text-gray-500">
            Todas las tareas e incidencias han sido verificadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredItems().map((item) => (
            <VerificationCard
              key={`${item.entityType}-${item.entityId}`}
              item={item}
              getRoleLabel={getRoleLabel}
              onVerify={() => openVerifyModal(item)}
              onReject={() => openRejectModal(item)}
            />
          ))}
        </div>
      )}

      {/* Verify Modal */}
      <VerifyModal
        isOpen={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false)
          setSelectedItem(null)
        }}
        onConfirm={handleVerify}
        item={selectedItem}
        isProcessing={isProcessing}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false)
          setSelectedItem(null)
        }}
        onConfirm={handleReject}
        item={selectedItem}
        isProcessing={isProcessing}
      />
    </div>
  )
}
