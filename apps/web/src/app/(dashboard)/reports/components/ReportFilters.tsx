'use client'

import { useState, useEffect } from 'react'

type ReportPeriod = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'

interface FilterState {
  period: ReportPeriod
  startDate?: string
  endDate?: string
  storeId?: string
}

interface Store {
  id: string
  name: string
  code: string
}

interface ReportFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Esta Semana' },
  { value: 'last_week', label: 'Semana Pasada' },
  { value: 'this_month', label: 'Este Mes' },
  { value: 'last_month', label: 'Mes Pasado' },
  { value: 'custom', label: 'Personalizado' },
]

export function ReportFilters({ filters, onFiltersChange }: ReportFiltersProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoadingStores, setIsLoadingStores] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${baseUrl}/api/v1/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStores(data.data || data)
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    } finally {
      setIsLoadingStores(false)
    }
  }

  const handlePeriodChange = (period: ReportPeriod) => {
    const newFilters: FilterState = { ...filters, period }
    if (period !== 'custom') {
      delete newFilters.startDate
      delete newFilters.endDate
    }
    onFiltersChange(newFilters)
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Period Selector */}
        <div>
          <label htmlFor="period" className="block text-sm font-medium text-gray-700">
            Período
          </label>
          <select
            id="period"
            value={filters.period}
            onChange={(e) => handlePeriodChange(e.target.value as ReportPeriod)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Store Selector */}
        <div>
          <label htmlFor="store" className="block text-sm font-medium text-gray-700">
            Tienda
          </label>
          <select
            id="store"
            value={filters.storeId || ''}
            onChange={(e) => onFiltersChange({ ...filters, storeId: e.target.value || undefined })}
            disabled={isLoadingStores}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:opacity-50"
          >
            <option value="">Todas las tiendas</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.code} - {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range */}
        {filters.period === 'custom' && (
          <>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate || ''}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Fecha Fin
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate || ''}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
