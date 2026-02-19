'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnnouncementForm, AnnouncementFormData } from '../components/AnnouncementForm'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: AnnouncementFormData) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create announcement')
      }

      const result = await response.json()
      router.push(`/communications/${result.id}`)
    } catch (error) {
      console.error('Error creating announcement:', error)
      // For demo, just redirect to list
      router.push('/communications')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href="/communications" className="hover:text-gray-700">
                Comunicaciones
              </a>
            </li>
            <li>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li className="text-gray-900 font-medium">Nuevo Anuncio</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Anuncio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete el formulario para crear un nuevo anuncio. El anuncio se guardara como borrador hasta que lo publique.
        </p>
      </div>

      {/* Form */}
      <AnnouncementForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/communications')}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
