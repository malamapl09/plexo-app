'use client'

import { useState, useEffect } from 'react'
import { ReportFilters } from './components/ReportFilters'
import { DashboardSummary } from './components/DashboardSummary'
import { ComplianceChart } from './components/ComplianceChart'
import { ReceivingSummary } from './components/ReceivingSummary'
import { IssueSummary } from './components/IssueSummary'

type ReportPeriod = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'

interface FilterState {
  period: ReportPeriod
  startDate?: string
  endDate?: string
  storeId?: string
}

interface DashboardData {
  reportDate: string
  periodStart: string
  periodEnd: string
  tasks: {
    total: number
    completed: number
    pending: number
    overdue: number
    complianceRate: number
  }
  receiving: {
    total: number
    completed: number
    withIssues: number
    pending: number
    discrepancies: number
  }
  issues: {
    total: number
    open: number
    resolved: number
    escalated: number
    resolutionRate: number
  }
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<FilterState>({ period: 'today' })
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [filters])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const params = new URLSearchParams()
      params.set('period', filters.period)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.storeId) params.set('storeId', filters.storeId)

      const response = await fetch(
        `${baseUrl}/api/v1/reports/dashboard?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Error cargando datos')

      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Fall back to fetching data from individual endpoints
      await loadFromIndividualEndpoints()
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromIndividualEndpoints = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const [tasksRes, receivingRes, issuesRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/v1/receiving`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/v1/issues`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      let tasksData = { total: 0, completed: 0, pending: 0, overdue: 0, complianceRate: 0 }
      let receivingData = { total: 0, completed: 0, withIssues: 0, pending: 0, discrepancies: 0 }
      let issuesData = { total: 0, open: 0, resolved: 0, escalated: 0, resolutionRate: 0 }

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        const tasks = Array.isArray(data) ? data : (data.data || data.tasks || [])
        const completed = tasks.filter((t: any) => t.assignments?.some((a: any) => a.status === 'COMPLETED') || t.status === 'COMPLETED').length
        const pending = tasks.filter((t: any) => t.assignments?.some((a: any) => a.status === 'PENDING') || t.status === 'PENDING').length
        const overdue = tasks.filter((t: any) => t.assignments?.some((a: any) => a.status === 'OVERDUE') || t.status === 'OVERDUE').length
        tasksData = {
          total: tasks.length,
          completed,
          pending,
          overdue,
          complianceRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        }
      }

      if (receivingRes.ok) {
        const data = await receivingRes.json()
        const receivings = Array.isArray(data) ? data : (data.data || data.receivings || [])
        receivingData = {
          total: receivings.length,
          completed: receivings.filter((r: any) => r.status === 'COMPLETED').length,
          withIssues: receivings.filter((r: any) => r.status === 'WITH_ISSUE').length,
          pending: receivings.filter((r: any) => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length,
          discrepancies: receivings.reduce((sum: number, r: any) => sum + (r.discrepancies?.length || 0), 0),
        }
      }

      if (issuesRes.ok) {
        const data = await issuesRes.json()
        const issues = Array.isArray(data) ? data : (data.data || data.issues || [])
        const resolved = issues.filter((i: any) => i.status === 'RESOLVED').length
        const escalated = issues.filter((i: any) => i.isEscalated || i.escalatedAt).length
        issuesData = {
          total: issues.length,
          open: issues.filter((i: any) => i.status !== 'RESOLVED').length,
          resolved,
          escalated,
          resolutionRate: issues.length > 0 ? Math.round((resolved / issues.length) * 100) : 0,
        }
      }

      setDashboardData({
        reportDate: new Date().toISOString(),
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        tasks: tasksData,
        receiving: receivingData,
        issues: issuesData,
      })
    } catch (error) {
      console.error('Error loading from individual endpoints:', error)
      // Set empty data if all fails
      setDashboardData({
        reportDate: new Date().toISOString(),
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        tasks: { total: 0, completed: 0, pending: 0, overdue: 0, complianceRate: 0 },
        receiving: { total: 0, completed: 0, withIssues: 0, pending: 0, discrepancies: 0 },
        issues: { total: 0, open: 0, resolved: 0, escalated: 0, resolutionRate: 0 },
      })
    }
  }

  const downloadReport = async (reportType: 'compliance' | 'receiving' | 'issues') => {
    setIsExporting(reportType)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const params = new URLSearchParams()
      params.set('period', filters.period)
      params.set('format', 'excel')
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.storeId) params.set('storeId', filters.storeId)

      const response = await fetch(
        `${baseUrl}/api/v1/reports/${reportType}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Error exportando reporte')

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `reporte_${reportType}.xlsx`

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Error al descargar el reporte. Por favor intente de nuevo.')
    } finally {
      setIsExporting(null)
    }
  }

  const reportTypeLabels: Record<string, string> = {
    compliance: 'Cumplimiento',
    receiving: 'Recepciones',
    issues: 'Incidencias',
  }

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Reportes y métricas de operaciones
          </p>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Dashboard Summary Cards */}
      <DashboardSummary data={dashboardData} isLoading={isLoading} />

      {/* Report Sections */}
      <div className="space-y-8 mt-8">
        {/* Compliance Report */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center justify-between border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Reporte de Cumplimiento
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tasa de cumplimiento de tareas por tienda y departamento
              </p>
            </div>
            <button
              onClick={() => downloadReport('compliance')}
              disabled={isExporting !== null}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isExporting === 'compliance' ? (
                <>
                  <LoadingSpinner />
                  Exportando...
                </>
              ) : (
                <>
                  <ExcelIcon className="-ml-1 mr-2 h-5 w-5" />
                  Descargar Excel
                </>
              )}
            </button>
          </div>
          <div className="p-6">
            <ComplianceChart data={dashboardData?.tasks} isLoading={isLoading} />
          </div>
        </div>

        {/* Receiving Report */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center justify-between border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Reporte de Recepciones
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Métricas de recepciones y discrepancias por proveedor
              </p>
            </div>
            <button
              onClick={() => downloadReport('receiving')}
              disabled={isExporting !== null}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isExporting === 'receiving' ? (
                <>
                  <LoadingSpinner />
                  Exportando...
                </>
              ) : (
                <>
                  <ExcelIcon className="-ml-1 mr-2 h-5 w-5" />
                  Descargar Excel
                </>
              )}
            </button>
          </div>
          <div className="p-6">
            <ReceivingSummary data={dashboardData?.receiving} isLoading={isLoading} />
          </div>
        </div>

        {/* Issues Report */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center justify-between border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Reporte de Incidencias
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Métricas de incidencias por categoría y prioridad
              </p>
            </div>
            <button
              onClick={() => downloadReport('issues')}
              disabled={isExporting !== null}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isExporting === 'issues' ? (
                <>
                  <LoadingSpinner />
                  Exportando...
                </>
              ) : (
                <>
                  <ExcelIcon className="-ml-1 mr-2 h-5 w-5" />
                  Descargar Excel
                </>
              )}
            </button>
          </div>
          <div className="p-6">
            <IssueSummary data={dashboardData?.issues} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 12H10l1.5 3 1.5-3h1.5l-2.25 4 2.25 4H13l-1.5-3-1.5 3H8.5l2.25-4-2.25-4z" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
