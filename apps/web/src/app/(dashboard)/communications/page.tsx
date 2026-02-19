'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnnouncementCard } from './components/AnnouncementCard'

type AnnouncementType = 'SYSTEM_ALERT' | 'OPERATIONAL_UPDATE' | 'POLICY_UPDATE' | 'TRAINING' | 'EMERGENCY' | 'GENERAL'
type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface Announcement {
  id: string
  title: string
  summary?: string
  type: AnnouncementType
  priority: Priority
  status: AnnouncementStatus
  scope: string
  requiresAck: boolean
  publishedAt?: string
  viewCount?: number
  ackCount?: number
  totalRecipients?: number
  createdAt: string
}

interface Stats {
  totalPublished: number
  totalDrafts: number
  avgViewRate: number
  avgAckRate: number
}

export default function CommunicationsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalPublished: 0,
    totalDrafts: 0,
    avgViewRate: 0,
    avgAckRate: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const list = data.announcements || []
        setAnnouncements(list)

        // Calculate stats
        const published = list.filter((a: Announcement) => a.status === 'PUBLISHED')
        const drafts = list.filter((a: Announcement) => a.status === 'DRAFT')
        const viewRates = published
          .filter((a: Announcement) => a.totalRecipients && a.totalRecipients > 0)
          .map((a: Announcement) => ((a.viewCount || 0) / a.totalRecipients!) * 100)
        const ackRates = published
          .filter((a: Announcement) => a.requiresAck && a.totalRecipients && a.totalRecipients > 0)
          .map((a: Announcement) => ((a.ackCount || 0) / a.totalRecipients!) * 100)

        setStats({
          totalPublished: published.length,
          totalDrafts: drafts.length,
          avgViewRate: viewRates.length > 0 ? viewRates.reduce((a: number, b: number) => a + b, 0) / viewRates.length : 0,
          avgAckRate: ackRates.length > 0 ? ackRates.reduce((a: number, b: number) => a + b, 0) / ackRates.length : 0,
        })
      } else {
        throw new Error('Failed to load announcements')
      }
    } catch (err) {
      console.error('Error loading announcements:', err)
      setError('Error al cargar anuncios. Por favor intente de nuevo.')
      setAnnouncements([])
      setStats({
        totalPublished: 0,
        totalDrafts: 0,
        avgViewRate: 0,
        avgAckRate: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async (id: string) => {
    if (!confirm('Desea publicar este anuncio? Se enviara a todos los usuarios objetivo.')) return

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/announcements/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to publish')
      }

      loadAnnouncements()
    } catch (err) {
      console.error('Error publishing:', err)
      alert('Error al publicar el anuncio. Por favor intente de nuevo.')
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Desea archivar este anuncio?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/announcements/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to archive')
      }

      loadAnnouncements()
    } catch (err) {
      console.error('Error archiving:', err)
      alert('Error al archivar el anuncio. Por favor intente de nuevo.')
    }
  }

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (statusFilter !== 'ALL' && announcement.status !== statusFilter) return false
    if (typeFilter !== 'ALL' && announcement.type !== typeFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        announcement.title.toLowerCase().includes(query) ||
        announcement.summary?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const typeOptions: { value: AnnouncementType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos los tipos' },
    { value: 'GENERAL', label: 'General' },
    { value: 'OPERATIONAL_UPDATE', label: 'Actualizacion Operativa' },
    { value: 'POLICY_UPDATE', label: 'Actualizacion de Politica' },
    { value: 'TRAINING', label: 'Capacitacion' },
    { value: 'SYSTEM_ALERT', label: 'Alerta del Sistema' },
    { value: 'EMERGENCY', label: 'Emergencia' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Comunicaciones
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestione anuncios y comunicaciones para las tiendas
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => router.push('/communications/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Anuncio
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Publicados"
          value={stats.totalPublished}
          icon={<MegaphoneIcon className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Borradores"
          value={stats.totalDrafts}
          icon={<DraftIcon className="h-6 w-6 text-gray-600" />}
          bgColor="bg-gray-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Tasa de Vistas"
          value={`${stats.avgViewRate.toFixed(0)}%`}
          icon={<EyeIcon className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Tasa de Confirmacion"
          value={`${stats.avgAckRate.toFixed(0)}%`}
          icon={<CheckIcon className="h-6 w-6 text-purple-600" />}
          bgColor="bg-purple-100"
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar anuncios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="ALL">Todos los estados</option>
            <option value="DRAFT">Borradores</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="ARCHIVED">Archivados</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AnnouncementType | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
              <div className="flex gap-2 mb-2">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-5 bg-gray-200 rounded w-20" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-4" />
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error al cargar anuncios</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={loadAnnouncements}
            className="mt-4 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
          >
            Reintentar
          </button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'No se encontraron anuncios'
              : 'No hay anuncios'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Intente con otros filtros'
              : 'Comience creando un nuevo anuncio'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && typeFilter === 'ALL' && (
            <button
              onClick={() => router.push('/communications/new')}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Crear primer anuncio
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              {...announcement}
              onClick={() => router.push(`/communications/${announcement.id}`)}
              onEdit={() => router.push(`/communications/${announcement.id}/edit`)}
              onPublish={() => handlePublish(announcement.id)}
              onArchive={() => handleArchive(announcement.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  bgColor,
  isLoading,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  bgColor: string
  isLoading: boolean
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-md ${bgColor} flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {isLoading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  value
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icons
function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  )
}

function DraftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
