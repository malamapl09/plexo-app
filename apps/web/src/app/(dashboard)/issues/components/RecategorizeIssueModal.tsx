'use client'

import { Fragment, useState } from 'react'

type IssueCategory = 'MAINTENANCE' | 'CLEANING' | 'SECURITY' | 'IT_SYSTEMS' | 'PERSONNEL' | 'INVENTORY'

const CATEGORIES: { value: IssueCategory; label: string; icon: string }[] = [
  { value: 'MAINTENANCE', label: 'Mantenimiento', icon: '🔧' },
  { value: 'CLEANING', label: 'Limpieza', icon: '🧹' },
  { value: 'SECURITY', label: 'Seguridad', icon: '🔒' },
  { value: 'IT_SYSTEMS', label: 'Sistemas/IT', icon: '💻' },
  { value: 'PERSONNEL', label: 'Personal', icon: '👥' },
  { value: 'INVENTORY', label: 'Inventario', icon: '📦' },
]

interface RecategorizeIssueModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (category: IssueCategory) => void
  issueTitle: string
  currentCategory: IssueCategory
}

export function RecategorizeIssueModal({
  isOpen,
  onClose,
  onConfirm,
  issueTitle,
  currentCategory,
}: RecategorizeIssueModalProps) {
  const [selected, setSelected] = useState<IssueCategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!selected) return
    setIsSubmitting(true)
    await onConfirm(selected)
    setIsSubmitting(false)
    setSelected(null)
  }

  const handleClose = () => {
    setSelected(null)
    onClose()
  }

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Recategorizar Incidencia</h2>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona la nueva categoria. La incidencia sera reasignada automaticamente.
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700 mb-4 font-medium truncate">{issueTitle}</p>

              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.filter((c) => c.value !== currentCategory).map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelected(cat.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      selected === cat.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selected || isSubmitting}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Recategorizando...' : 'Recategorizar y Reasignar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
