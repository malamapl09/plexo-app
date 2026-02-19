'use client'

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

interface SupplierMetricsTableProps {
  suppliers: SupplierMetrics[]
  isLoading: boolean
}

export function SupplierMetricsTable({ suppliers, isLoading }: SupplierMetricsTableProps) {
  const getOnTimeRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDiscrepancyRateColor = (rate: number) => {
    if (rate <= 5) return 'text-green-600'
    if (rate <= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500'
    if (rate >= 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Métricas de Proveedores</h3>
        <p className="mt-1 text-sm text-gray-500">
          Rendimiento de proveedores basado en puntualidad y discrepancias
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
                Proveedor
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Puntualidad
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Discrepancias
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Detalle Discrepancias
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay datos de proveedores disponibles
                </td>
              </tr>
            ) : (
              suppliers.map((supplier, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                          supplier.supplierType === 'DISTRIBUTION_CENTER'
                            ? 'bg-indigo-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <svg
                          className={`h-5 w-5 ${
                            supplier.supplierType === 'DISTRIBUTION_CENTER'
                              ? 'text-indigo-600'
                              : 'text-gray-600'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {supplier.supplierType === 'DISTRIBUTION_CENTER' ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          )}
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.supplierName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {supplier.supplierType === 'DISTRIBUTION_CENTER'
                            ? 'Centro de Distribución'
                            : 'Proveedor Externo'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-semibold text-gray-900">
                      {supplier.totalReceivings}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-semibold ${getOnTimeRateColor(
                              supplier.onTimeRate
                            )}`}
                          >
                            {supplier.onTimeRate.toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {supplier.completedOnTime}/{supplier.totalReceivings}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressBarColor(supplier.onTimeRate)}`}
                            style={{ width: `${supplier.onTimeRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <span
                          className={`text-lg font-semibold ${getDiscrepancyRateColor(
                            supplier.discrepancyRate
                          )}`}
                        >
                          {supplier.discrepancyRate.toFixed(1)}%
                        </span>
                        <p className="text-xs text-gray-500">
                          {supplier.withDiscrepancies} con incidencias
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="text-center">
                        <span className="text-sm font-medium text-red-600">
                          {supplier.discrepanciesByType.MISSING}
                        </span>
                        <p className="text-xs text-gray-500">Faltantes</p>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-orange-600">
                          {supplier.discrepanciesByType.DAMAGED}
                        </span>
                        <p className="text-xs text-gray-500">Dañados</p>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-yellow-600">
                          {supplier.discrepanciesByType.WRONG_PRODUCT}
                        </span>
                        <p className="text-xs text-gray-500">Incorrectos</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {suppliers.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-gray-500">Total proveedores:</span>
                <span className="ml-2 font-medium text-gray-900">{suppliers.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Total recepciones:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {suppliers.reduce((acc, s) => acc + s.totalReceivings, 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total discrepancias:</span>
                <span className="ml-2 font-medium text-red-600">
                  {suppliers.reduce((acc, s) => acc + s.totalDiscrepancies, 0)}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Puntualidad promedio:</span>
              <span className="ml-2 font-medium text-gray-900">
                {(
                  suppliers.reduce((acc, s) => acc + s.onTimeRate, 0) / suppliers.length
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
