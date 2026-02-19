'use client'

import { useState } from 'react'

type EntityType = 'TASK_ASSIGNMENT' | 'ISSUE'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface PendingVerificationItem {
  entityType: EntityType
  entityId: string
  title: string
  description?: string
  priority: Priority
  store: {
    id: string
    name: string
    code: string
  }
  submittedBy: {
    id: string
    name: string
    email?: string
    role?: string
  }
  submittedAt?: string
  notes?: string
  photoUrls: string[]
  category?: string
}

interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (rejectionReason: string) => void
  item: PendingVerificationItem | null
  isProcessing: boolean
}

export function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  isProcessing,
}: RejectModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || !item) return null

  const isTask = item.entityType === 'TASK_ASSIGNMENT'

  const handleSubmit = () => {
    if (!rejectionReason.trim()) {
      setError('La razón es requerida')
      return
    }
    setError('')
    onConfirm(rejectionReason.trim())
    setRejectionReason('')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Rechazar {isTask ? 'Tarea' : 'Incidencia'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-red-600 font-medium">
                  ¿Por qué se rechaza "{item.title}"?
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  El item será enviado de vuelta para ser completado nuevamente.
                </p>
                <div className="mt-4">
                  <label
                    htmlFor="rejectionReason"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Razón del rechazo *
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value)
                      if (error) setError('')
                    }}
                    className={`block w-full mt-1 border rounded-md shadow-sm sm:text-sm ${
                      error
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="Explique por qué necesita rehacerse..."
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSubmit}
              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Rechazando...
                </>
              ) : (
                'Rechazar'
              )}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                setRejectionReason('')
                setError('')
                onClose()
              }}
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
