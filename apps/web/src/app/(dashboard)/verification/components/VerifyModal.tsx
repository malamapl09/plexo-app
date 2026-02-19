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

interface VerifyModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (notes?: string) => void
  item: PendingVerificationItem | null
  isProcessing: boolean
}

export function VerifyModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  isProcessing,
}: VerifyModalProps) {
  const [notes, setNotes] = useState('')

  if (!isOpen || !item) return null

  const isTask = item.entityType === 'TASK_ASSIGNMENT'

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
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-green-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Verificar {isTask ? 'Tarea' : 'Incidencia'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  ¿Confirmar que "{item.title}" ha sido completado correctamente?
                </p>
                <div className="mt-4">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notas (opcional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Agregar comentarios..."
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                onConfirm(notes || undefined)
                setNotes('')
              }}
              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                setNotes('')
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
