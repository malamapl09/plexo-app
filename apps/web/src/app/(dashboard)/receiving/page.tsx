'use client'

import { useState, useEffect } from 'react'
import { ReceivingStatsCards } from './components/ReceivingStatsCards'
import { ReceivingTable } from './components/ReceivingTable'
import { SupplierMetricsTable } from './components/SupplierMetricsTable'

interface ReceivingStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  withIssue: number
  didNotArrive: number
  totalDiscrepancies: number
}

interface SupplierMetrics {
  supplierName: string
  supplierType: 'DISTRIBUTION_CENTER' | 'THIRD_PARTY'
  totalReceivings: number
  completedOnTime: number
  withDiscrepancies: number
  onTimeRate: number
  discrepancyRate: number
  totalDiscrepancies: number
  discrepanciesByType: {
    MISSING: number
    DAMAGED: number
    WRONG_PRODUCT: number
  }
}

export default function ReceivingPage() {
  const [activeTab, setActiveTab] = useState<'receivings' | 'suppliers'>('receivings')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ReceivingStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    withIssue: 0,
    didNotArrive: 0,
    totalDiscrepancies: 0,
  })
  const [supplierMetrics, setSupplierMetrics] = useState<SupplierMetrics[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      // Fetch receiving records from API
      const response = await fetch(`${baseUrl}/api/v1/receiving`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const receivingList = Array.isArray(data) ? data : (data.data || data.receivings || [])

        // Calculate stats from real data
        const total = receivingList.length
        const pending = receivingList.filter((r: any) => r.status === 'PENDING').length
        const inProgress = receivingList.filter((r: any) => r.status === 'IN_PROGRESS').length
        const completed = receivingList.filter((r: any) => r.status === 'COMPLETED').length
        const withIssue = receivingList.filter((r: any) => r.status === 'WITH_ISSUE').length
        const didNotArrive = receivingList.filter((r: any) => r.status === 'DID_NOT_ARRIVE').length

        // Count total discrepancies
        const totalDiscrepancies = receivingList.reduce((sum: number, r: any) => {
          return sum + (r.discrepancies?.length || 0)
        }, 0)

        setStats({
          total,
          pending,
          inProgress,
          completed,
          withIssue,
          didNotArrive,
          totalDiscrepancies,
        })

        // Calculate supplier metrics from real data
        const supplierMap = new Map<string, any>()
        receivingList.forEach((r: any) => {
          const key = r.supplierName
          if (!supplierMap.has(key)) {
            supplierMap.set(key, {
              supplierName: r.supplierName,
              supplierType: r.supplierType,
              totalReceivings: 0,
              completedOnTime: 0,
              withDiscrepancies: 0,
              totalDiscrepancies: 0,
              discrepanciesByType: { MISSING: 0, DAMAGED: 0, WRONG_PRODUCT: 0 },
            })
          }
          const metrics = supplierMap.get(key)
          metrics.totalReceivings++

          if (r.status === 'COMPLETED') {
            metrics.completedOnTime++
          }

          if (r.discrepancies?.length > 0) {
            metrics.withDiscrepancies++
            metrics.totalDiscrepancies += r.discrepancies.length
            r.discrepancies.forEach((d: any) => {
              if (metrics.discrepanciesByType[d.type] !== undefined) {
                metrics.discrepanciesByType[d.type]++
              }
            })
          }
        })

        const metricsArray: SupplierMetrics[] = Array.from(supplierMap.values()).map((m) => ({
          ...m,
          onTimeRate: m.totalReceivings > 0 ? Math.round((m.completedOnTime / m.totalReceivings) * 1000) / 10 : 0,
          discrepancyRate: m.totalReceivings > 0 ? Math.round((m.withDiscrepancies / m.totalReceivings) * 1000) / 10 : 0,
        }))

        setSupplierMetrics(metricsArray)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Recepciones
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de recepciones y entregas de proveedores
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
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
      <ReceivingStatsCards stats={stats} isLoading={isLoading} />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 mt-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('receivings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'receivings'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recepciones de Hoy
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Métricas de Proveedores
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'receivings' ? (
        <ReceivingTable isLoading={isLoading} />
      ) : (
        <SupplierMetricsTable suppliers={supplierMetrics} isLoading={isLoading} />
      )}
    </div>
  )
}
