'use client'

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

interface StoreComplianceTableProps {
  stores: StoreStats[]
  isLoading: boolean
}

export function StoreComplianceTable({ stores, isLoading }: StoreComplianceTableProps) {
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusBadge = (rate: number) => {
    if (rate >= 90) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Excelente
        </span>
      )
    }
    if (rate >= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Bien
        </span>
      )
    }
    if (rate >= 50) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Regular
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Atención
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sort stores by completion rate (ascending to show worst performers first)
  const sortedStores = [...stores].sort((a, b) => a.stats.completionRate - b.stats.completionRate)

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Cumplimiento por Tienda</h3>
        <p className="mt-1 text-sm text-gray-500">
          Estado de cumplimiento de tareas por cada tienda
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                Completadas
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Pendientes
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Atrasadas
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Progreso
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStores.map((store) => (
              <tr key={store.storeId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-blue-600"
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
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{store.storeName}</div>
                      <div className="text-sm text-gray-500">{store.storeCode}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-green-600">{store.stats.completed}</span>
                  <span className="text-sm text-gray-500"> / {store.stats.total}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-yellow-600">{store.stats.pending}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {store.stats.overdue > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {store.stats.overdue}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">0</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 mr-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressBarColor(
                            store.stats.completionRate
                          )}`}
                          style={{ width: `${store.stats.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${getCompletionColor(
                        store.stats.completionRate
                      )}`}
                    >
                      {store.stats.completionRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatusBadge(store.stats.completionRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stores.length === 0 && (
        <div className="p-6 text-center text-gray-500">No hay datos de tiendas disponibles</div>
      )}

      {/* Summary Footer */}
      {stores.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-gray-500">Total tiendas:</span>
                <span className="ml-2 font-medium text-gray-900">{stores.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Cumplimiento promedio:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {(
                    stores.reduce((acc, s) => acc + s.stats.completionRate, 0) / stores.length
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="h-3 w-3 bg-green-500 rounded-full mr-1.5" />
                <span className="text-gray-500">
                  {stores.filter((s) => s.stats.completionRate >= 80).length} Excelente
                </span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 bg-yellow-500 rounded-full mr-1.5" />
                <span className="text-gray-500">
                  {
                    stores.filter(
                      (s) => s.stats.completionRate >= 50 && s.stats.completionRate < 80
                    ).length
                  }{' '}
                  Regular
                </span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 bg-red-500 rounded-full mr-1.5" />
                <span className="text-gray-500">
                  {stores.filter((s) => s.stats.completionRate < 50).length} Atención
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
