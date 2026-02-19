'use client'

import { useState, useEffect } from 'react'
import { CreateTaskModal } from './components/CreateTaskModal'
import { TaskList } from './components/TaskList'
import { StoreComplianceTable } from './components/StoreComplianceTable'

interface Stats {
  total: number
  completed: number
  pending: number
  overdue: number
  completionRate: number
}

interface StoreStats {
  storeId: string
  storeName: string
  storeCode: string
  stats: Stats
}

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'compliance'>('tasks')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
  })
  const [storeStats, setStoreStats] = useState<StoreStats[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      // Fetch tasks from API — response is { tasks: [], total, page, limit, totalPages }
      const response = await fetch(`${baseUrl}/api/v1/tasks?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        setError('Error al cargar las tareas')
        return
      }

      const data = await response.json()
      const taskList = data.tasks || []

      // Calculate stats from real data (must match TaskList filter logic)
      const total = taskList.length
      const completed = taskList.filter((t: any) => {
        const assignments = t.assignments || []
        if (assignments.length === 0) return t.status === 'COMPLETED'
        return assignments.every((a: any) => a.status === 'COMPLETED')
      }).length
      const overdue = taskList.filter((t: any) => {
        const assignments = t.assignments || []
        const allDone = assignments.length > 0 && assignments.every((a: any) => a.status === 'COMPLETED')
        if (allDone) return false
        return assignments.some((a: any) => a.status === 'OVERDUE') || t.status === 'OVERDUE'
      }).length
      const pending = total - completed - overdue

      setStats({
        total,
        completed,
        pending,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      })

      // Fetch compliance data (requires today's date)
      const today = new Date().toISOString().split('T')[0]
      const complianceRes = await fetch(`${baseUrl}/api/v1/tasks/compliance?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (complianceRes.ok) {
        const complianceData = await complianceRes.json()
        if (complianceData.byStore) {
          setStoreStats(complianceData.byStore)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Error de conexión al cargar las tareas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async (taskData: any) => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        setIsModalOpen(false)
        loadData()
      } else {
        console.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Plan del Día
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de tareas diarias para todas las tiendas
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Tareas"
          value={stats.total}
          icon={<ClipboardIcon className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Completadas"
          value={stats.completed}
          icon={<CheckIcon className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-100"
          valueColor="text-green-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={<ClockIcon className="h-6 w-6 text-yellow-600" />}
          bgColor="bg-yellow-100"
          valueColor="text-yellow-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Atrasadas"
          value={stats.overdue}
          icon={<AlertIcon className="h-6 w-6 text-red-600" />}
          bgColor="bg-red-100"
          valueColor="text-red-600"
          isLoading={isLoading}
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">Cumplimiento del Día</h3>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          ) : (
            <span className="text-2xl font-bold text-blue-600">{stats.completionRate}%</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{stats.completed} de {stats.total} tareas completadas</span>
          <span>Meta: 90%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lista de Tareas
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compliance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cumplimiento por Tienda
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'tasks' ? (
        <TaskList isLoading={isLoading} />
      ) : (
        <StoreComplianceTable stores={storeStats} isLoading={isLoading} />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  bgColor,
  valueColor = 'text-gray-900',
  isLoading,
}: {
  title: string
  value: number
  icon: React.ReactNode
  bgColor: string
  valueColor?: string
  isLoading: boolean
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-md ${bgColor} flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className={`text-lg font-semibold ${valueColor}`}>
                {isLoading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                ) : (
                  value
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icons
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
