'use client'

import { useState, useEffect } from 'react'
import { ReceivingDetailModal } from './ReceivingDetailModal'

interface Receiving {
  id: string
  supplierName: string
  supplierType: 'DISTRIBUTION_CENTER' | 'THIRD_PARTY'
  store: {
    name: string
    code: string
  }
  scheduledTime?: string
  arrivalTime?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'WITH_ISSUE' | 'DID_NOT_ARRIVE'
  driverName?: string
  truckPlate?: string
  itemCount?: number
  discrepancyCount: number
  photoUrls?: string[]
  signatureUrl?: string
  notes?: string
  poNumber?: string
  verifiedBy?: {
    name: string
  }
  discrepancies?: Array<{
    id: string
    type: string
    productInfo: string
    quantity?: number
    notes?: string
    photoUrls?: string[]
  }>
}

interface ReceivingTableProps {
  isLoading: boolean
}

export function ReceivingTable({ isLoading }: ReceivingTableProps) {
  const [receivings, setReceivings] = useState<Receiving[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [selectedReceiving, setSelectedReceiving] = useState<Receiving | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleReceivingClick = (receiving: Receiving) => {
    setSelectedReceiving(receiving)
    setIsDetailModalOpen(true)
  }

  useEffect(() => {
    loadReceivings()
  }, [])

  const loadReceivings = async () => {
    setIsLoadingData(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/receiving`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const receivingList = Array.isArray(data) ? data : (data.data || data.receivings || [])

        // Map API response to Receiving interface
        const mappedReceivings: Receiving[] = receivingList.map((r: any) => {
          // Extract time from scheduledTime/arrivalTime if they are full ISO strings
          const formatTime = (dateStr: string | null) => {
            if (!dateStr) return undefined
            const date = new Date(dateStr)
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          }

          return {
            id: r.id,
            supplierName: r.supplierName,
            supplierType: r.supplierType,
            store: r.store || { name: 'Tienda', code: 'N/A' },
            scheduledTime: formatTime(r.scheduledTime),
            arrivalTime: formatTime(r.arrivalTime),
            status: r.status,
            driverName: r.driverName || undefined,
            truckPlate: r.truckPlate || undefined,
            itemCount: r.itemCount || undefined,
            discrepancyCount: r.discrepancies?.length || 0,
            verifiedBy: r.verifiedBy,
          }
        })

        setReceivings(mappedReceivings)
      }
    } catch (error) {
      console.error('Error loading receivings:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const filteredReceivings = receivings.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'pending') return r.status === 'PENDING'
    if (filter === 'inProgress') return r.status === 'IN_PROGRESS'
    if (filter === 'completed') return r.status === 'COMPLETED' || r.status === 'WITH_ISSUE'
    return true
  })

  const getStatusBadge = (status: Receiving['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      WITH_ISSUE: 'bg-red-100 text-red-800',
      DID_NOT_ARRIVE: 'bg-gray-100 text-gray-800',
    }

    const labels = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Proceso',
      COMPLETED: 'Completada',
      WITH_ISSUE: 'Con Incidencias',
      DID_NOT_ARRIVE: 'No Llegó',
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    )
  }

  const getSupplierTypeBadge = (type: Receiving['supplierType']) => {
    if (type === 'DISTRIBUTION_CENTER') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
          CD
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        Externo
      </span>
    )
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Filters */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              filter === 'all' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todas ({receivings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pendientes ({receivings.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('inProgress')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              filter === 'inProgress'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            En Proceso ({receivings.filter((r) => r.status === 'IN_PROGRESS').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              filter === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completadas (
            {
              receivings.filter((r) => r.status === 'COMPLETED' || r.status === 'WITH_ISSUE')
                .length
            }
            )
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Proveedor
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tienda
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Programado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Llegada
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Items
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Incidencias
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReceivings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No hay recepciones que mostrar
                </td>
              </tr>
            ) : (
              filteredReceivings.map((receiving) => (
                <tr key={receiving.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleReceivingClick(receiving)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-teal-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {receiving.supplierName}
                          </div>
                          {getSupplierTypeBadge(receiving.supplierType)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {receiving.driverName} - {receiving.truckPlate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{receiving.store.code}</div>
                    <div className="text-sm text-gray-500">{receiving.store.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{receiving.scheduledTime || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{receiving.arrivalTime || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {receiving.itemCount || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(receiving.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {receiving.discrepancyCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {receiving.discrepancyCount}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receiving Detail Modal */}
      <ReceivingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        receiving={selectedReceiving}
      />
    </div>
  )
}
