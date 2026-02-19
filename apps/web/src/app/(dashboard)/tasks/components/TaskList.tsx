'use client'

import { useState, useEffect } from 'react'
import { TaskDetailModal } from './TaskDetailModal'

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
}

interface TaskListProps {
  isLoading: boolean
}

export function TaskList({ isLoading }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setIsLoadingTasks(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const taskList = Array.isArray(data) ? data : (data.tasks || [])

        // Map API response to Task interface
        const mappedTasks: Task[] = taskList.map((t: any) => {
          // Extract time from ISO string
          const formatTime = (dateStr: string | null) => {
            if (!dateStr) return undefined
            const date = new Date(dateStr)
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          }

          // Calculate assignment stats
          const assignments = t.assignments || []
          const assignmentCount = assignments.length || 1
          const completedCount = assignments.filter((a: any) => a.status === 'COMPLETED').length
          const completionRate = assignmentCount > 0 ? (completedCount / assignmentCount) * 100 : 0

          return {
            id: t.id,
            title: t.title,
            description: t.description,
            department: t.department,
            priority: t.priority,
            scheduledTime: formatTime(t.scheduledTime),
            dueTime: formatTime(t.dueTime),
            assignmentCount,
            completedCount,
            completionRate: Math.round(completionRate * 10) / 10,
            createdAt: t.createdAt,
            assignments: assignments.map((a: any) => ({
              id: a.id,
              status: a.status,
              notes: a.notes,
              photoUrls: a.photoUrls || [],
              store: a.store,
              completedAt: a.completedAt,
            })),
          }
        })

        setTasks(mappedTasks)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return task.completionRate < 100
    if (filter === 'completed') return task.completionRate === 100
    return true
  })

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

  if (isLoading || isLoadingTasks) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Filters */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              En Progreso ({tasks.filter((t) => t.completionRate < 100).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Completadas ({tasks.filter((t) => t.completionRate === 100).length})
            </button>
          </div>
          <button
            onClick={loadTasks}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-200">
        {filteredTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay tareas que mostrar
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => handleTaskClick(task)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-medium text-gray-900">{task.title}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                    {task.department && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {task.department.name}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {task.scheduledTime && (
                      <span className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {task.scheduledTime}
                      </span>
                    )}
                    {task.dueTime && (
                      <span className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                          />
                        </svg>
                        Hasta {task.dueTime}
                      </span>
                    )}
                    <span className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {task.assignmentCount} tiendas
                    </span>
                  </div>
                </div>

                {/* Completion Progress */}
                <div className="ml-6 flex flex-col items-end">
                  <span className={`text-2xl font-bold ${getCompletionColor(task.completionRate)}`}>
                    {task.completionRate.toFixed(0)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {task.completedCount}/{task.assignmentCount}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        task.completionRate >= 80
                          ? 'bg-green-500'
                          : task.completionRate >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${task.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        task={selectedTask}
      />
    </div>
  )
}
