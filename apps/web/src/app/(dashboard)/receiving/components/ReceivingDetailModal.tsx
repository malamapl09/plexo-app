'use client'

import { Fragment } from 'react'
import { PhotoGallery } from '@/components/ui/PhotoGallery'

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

interface ReceivingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  receiving: Receiving | null
}

export function ReceivingDetailModal({ isOpen, onClose, receiving }: ReceivingDetailModalProps) {
  if (!isOpen || !receiving) return null

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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getSupplierTypeBadge = (type: Receiving['supplierType']) => {
    if (type === 'DISTRIBUTION_CENTER') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Centro de Distribución
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Proveedor Externo
      </span>
    )
  }

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Detalle de Recepción</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {/* Title and badges */}
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {getStatusBadge(receiving.status)}
                  {getSupplierTypeBadge(receiving.supplierType)}
                  {receiving.discrepancyCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {receiving.discrepancyCount} incidencia{receiving.discrepancyCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{receiving.supplierName}</h3>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm">Tienda</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{receiving.store.name}</p>
                  <p className="text-sm text-gray-500">{receiving.store.code}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">Conductor</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{receiving.driverName || '-'}</p>
                  {receiving.truckPlate && (
                    <p className="text-sm text-gray-500">Placa: {receiving.truckPlate}</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">Hora Programada</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{receiving.scheduledTime || '-'}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">Hora de Llegada</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{receiving.arrivalTime || '-'}</p>
                </div>

                {receiving.itemCount !== undefined && receiving.itemCount !== null && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-sm">Cantidad de Items</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{receiving.itemCount}</p>
                  </div>
                )}

                {receiving.verifiedBy && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center text-green-600 mb-1">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm">Verificado por</span>
                    </div>
                    <p className="text-lg font-semibold text-green-700">{receiving.verifiedBy.name}</p>
                  </div>
                )}
              </div>

              {/* PO Number */}
              {receiving.poNumber && (
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <span className="text-sm text-gray-500">PO: </span>
                  <span className="font-mono font-semibold text-gray-900">{receiving.poNumber}</span>
                </div>
              )}

              {/* Notes */}
              {receiving.notes && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notas</h4>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{receiving.notes}</p>
                </div>
              )}

              {/* Photos */}
              <PhotoGallery photos={receiving.photoUrls || []} title="Fotos de Recepción" />

              {/* Signature */}
              {receiving.signatureUrl && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Firma Digital
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-2 inline-block">
                    <img
                      src={receiving.signatureUrl}
                      alt="Firma digital"
                      className="max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Discrepancies section */}
              {receiving.discrepancyCount > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Incidencias Reportadas ({receiving.discrepancyCount})
                  </h4>
                  {receiving.discrepancies && receiving.discrepancies.length > 0 ? (
                    <div className="space-y-3 mt-3">
                      {receiving.discrepancies.map((d) => (
                        <div key={d.id} className="bg-white rounded-lg p-3 border border-red-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              {d.type === 'MISSING' ? 'Faltante' : d.type === 'DAMAGED' ? 'Dañado' : 'Producto Erróneo'}
                            </span>
                            {d.quantity && (
                              <span className="text-sm text-gray-600">Cant: {d.quantity}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{d.productInfo}</p>
                          {d.notes && <p className="text-sm text-gray-600 mt-1">{d.notes}</p>}
                          {d.photoUrls && d.photoUrls.length > 0 && (
                            <div className="mt-2">
                              <PhotoGallery photos={d.photoUrls} title="Evidencia" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-700">
                      Esta recepción tiene {receiving.discrepancyCount} incidencia{receiving.discrepancyCount > 1 ? 's' : ''} reportada{receiving.discrepancyCount > 1 ? 's' : ''}.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
