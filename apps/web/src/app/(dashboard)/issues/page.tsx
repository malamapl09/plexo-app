'use client'

import { useState, useEffect } from 'react'
import { IssueStatsCards } from './components/IssueStatsCards'
import { IssuesTable } from './components/IssuesTable'
import { CategoryStatsCards } from './components/CategoryStatsCards'
import { AssignIssueModal } from './components/AssignIssueModal'
import { IssueDetailModal } from './components/IssueDetailModal'
import { RecategorizeIssueModal } from './components/RecategorizeIssueModal'

type IssueCategory = 'MAINTENANCE' | 'CLEANING' | 'SECURITY' | 'IT_SYSTEMS' | 'PERSONNEL' | 'INVENTORY'
type IssueStatus = 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface IssueStats {
  total: number
  reported: number
  assigned: number
  inProgress: number
  resolved: number
  escalated: number
  avgResolutionTimeHours: number
}

interface CategoryStats {
  category: IssueCategory
  categoryLabel: string
  total: number
  open: number
  resolved: number
  escalated: number
}

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
  isEscalated: boolean
  createdAt: string
  resolvedAt?: string
}

export default function IssuesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'escalated' | 'categories'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<IssueStats>({
    total: 0,
    reported: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0,
    avgResolutionTimeHours: 0,
  })
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string>('')
  const [selectedIssueTitle, setSelectedIssueTitle] = useState<string>('')
  const [selectedIssueCategory, setSelectedIssueCategory] = useState<string>('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [recategorizeModalOpen, setRecategorizeModalOpen] = useState(false)
  const [recategorizeIssueId, setRecategorizeIssueId] = useState<string>('')
  const [recategorizeIssueTitle, setRecategorizeIssueTitle] = useState<string>('')
  const [recategorizeCurrentCategory, setRecategorizeCurrentCategory] = useState<IssueCategory>('MAINTENANCE')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      // Fetch issues from API
      const response = await fetch(`${baseUrl}/api/v1/issues`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const issueList: Issue[] = Array.isArray(data) ? data : (data.data || data.issues || [])

        // Map API response to Issue interface
        const mappedIssues: Issue[] = issueList.map((issue: any) => ({
          id: issue.id,
          storeId: issue.storeId,
          store: issue.store || { id: issue.storeId, name: 'Tienda', code: 'N/A' },
          category: issue.category,
          priority: issue.priority,
          title: issue.title,
          description: issue.description,
          status: issue.status,
          reportedBy: issue.reportedBy || { id: issue.reportedById, name: 'Usuario' },
          assignedTo: issue.assignedTo,
          isEscalated: issue.isEscalated || issue.escalatedAt != null,
          createdAt: issue.createdAt,
          resolvedAt: issue.resolvedAt,
        }))

        setIssues(mappedIssues)

        // Calculate stats from real data
        const total = mappedIssues.length
        const reported = mappedIssues.filter((i) => i.status === 'REPORTED').length
        const assigned = mappedIssues.filter((i) => i.status === 'ASSIGNED').length
        const inProgress = mappedIssues.filter((i) => i.status === 'IN_PROGRESS').length
        const resolved = mappedIssues.filter((i) => i.status === 'RESOLVED').length
        const escalated = mappedIssues.filter((i) => i.isEscalated && i.status !== 'RESOLVED').length

        // Calculate average resolution time
        const resolvedIssues = mappedIssues.filter((i) => i.resolvedAt)
        let avgResolutionTimeHours = 0
        if (resolvedIssues.length > 0) {
          const totalHours = resolvedIssues.reduce((sum, issue) => {
            const created = new Date(issue.createdAt).getTime()
            const resolved = new Date(issue.resolvedAt!).getTime()
            return sum + (resolved - created) / (1000 * 60 * 60)
          }, 0)
          avgResolutionTimeHours = Math.round((totalHours / resolvedIssues.length) * 10) / 10
        }

        setStats({
          total,
          reported,
          assigned,
          inProgress,
          resolved,
          escalated,
          avgResolutionTimeHours,
        })

        // Calculate category stats from real data
        const categoryLabels: Record<IssueCategory, string> = {
          MAINTENANCE: 'Mantenimiento',
          CLEANING: 'Limpieza',
          SECURITY: 'Seguridad',
          IT_SYSTEMS: 'Sistemas/IT',
          PERSONNEL: 'Personal',
          INVENTORY: 'Inventario',
        }

        const categories: IssueCategory[] = ['MAINTENANCE', 'CLEANING', 'SECURITY', 'IT_SYSTEMS', 'PERSONNEL', 'INVENTORY']
        const categoryStatsData: CategoryStats[] = categories.map((category) => {
          const categoryIssues = mappedIssues.filter((i) => i.category === category)
          return {
            category,
            categoryLabel: categoryLabels[category],
            total: categoryIssues.length,
            open: categoryIssues.filter((i) => i.status !== 'RESOLVED').length,
            resolved: categoryIssues.filter((i) => i.status === 'RESOLVED').length,
            escalated: categoryIssues.filter((i) => i.isEscalated && i.status !== 'RESOLVED').length,
          }
        })

        setCategoryStats(categoryStatsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId)
    if (issue) {
      setSelectedIssueId(issueId)
      setSelectedIssueTitle(issue.title)
      setSelectedIssueCategory(issue.category)
      setAssignModalOpen(true)
    }
  }

  const handleAssignConfirm = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/issues/${selectedIssueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedToId: userId, status: 'ASSIGNED' }),
      })

      if (response.ok) {
        // Update local state
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === selectedIssueId
              ? { ...issue, status: 'ASSIGNED' as IssueStatus, assignedTo: { id: userId, name: 'Usuario Asignado' } }
              : issue
          )
        )
        setAssignModalOpen(false)
      } else {
        console.error('Failed to assign issue')
      }
    } catch (error) {
      console.error('Error assigning issue:', error)
    }
  }

  const handleViewDetails = (issue: Issue) => {
    setSelectedIssue(issue)
    setDetailModalOpen(true)
  }

  const handleRecategorize = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId)
    if (issue) {
      setRecategorizeIssueId(issueId)
      setRecategorizeIssueTitle(issue.title)
      setRecategorizeCurrentCategory(issue.category)
      setRecategorizeModalOpen(true)
    }
  }

  const handleRecategorizeConfirm = async (category: IssueCategory) => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/issues/${recategorizeIssueId}/recategorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category }),
      })

      if (response.ok) {
        setRecategorizeModalOpen(false)
        loadData()
      } else {
        console.error('Failed to recategorize issue')
      }
    } catch (error) {
      console.error('Error recategorizing issue:', error)
    }
  }

  const getFilteredIssues = () => {
    if (activeTab === 'escalated') {
      return issues.filter((i) => i.isEscalated && i.status !== 'RESOLVED')
    }
    return issues
  }

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Incidencias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Reporte y seguimiento de problemas en tiendas
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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

      {/* Stats Cards */}
      <IssueStatsCards stats={stats} isLoading={isLoading} />

      {/* Category Stats */}
      <div className="mt-8 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Por Categoría</h2>
        <CategoryStatsCards categories={categoryStats} isLoading={isLoading} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Todas las Incidencias
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {issues.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('escalated')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'escalated'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Escaladas
            {stats.escalated > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {stats.escalated}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      <IssuesTable
        issues={getFilteredIssues()}
        isLoading={isLoading}
        onAssign={handleAssign}
        onViewDetails={handleViewDetails}
      />

      {/* Assign Modal */}
      <AssignIssueModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssignConfirm}
        issueTitle={selectedIssueTitle}
        issueCategory={selectedIssueCategory}
      />

      {/* Issue Detail Modal */}
      <IssueDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        issue={selectedIssue}
        onAssign={handleAssign}
        onRecategorize={handleRecategorize}
      />

      {/* Recategorize Modal */}
      <RecategorizeIssueModal
        isOpen={recategorizeModalOpen}
        onClose={() => setRecategorizeModalOpen(false)}
        onConfirm={handleRecategorizeConfirm}
        issueTitle={recategorizeIssueTitle}
        currentCategory={recategorizeCurrentCategory}
      />
    </div>
  )
}
