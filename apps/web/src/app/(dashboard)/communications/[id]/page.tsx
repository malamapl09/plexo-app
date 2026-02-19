'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type AnnouncementType = 'SYSTEM_ALERT' | 'OPERATIONAL_UPDATE' | 'POLICY_UPDATE' | 'TRAINING' | 'EMERGENCY' | 'GENERAL'
type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface AnalyticsData {
  totalViews: number
  uniqueViews: number
  totalAcks: number
  ackRate: number
  totalRecipients: number
  readRate: number
  pendingAckCount: number
  viewsByStore: { storeId: string; storeName: string; views: number }[]
  acksByStore: { storeId: string; storeName: string; acks: number }[]
}

interface Announcement {
  id: string
  title: string
  content: string
  summary?: string
  type: AnnouncementType
  priority: Priority
  status: AnnouncementStatus
  scope: string
  targetStoreIds: string[]
  targetRegionIds: string[]
  targetRoles: string[]
  requiresAck: boolean
  publishedAt?: string
  scheduledFor?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
  imageUrl?: string
  createdBy: {
    id: string
    name: string
  }
  viewCount: number
  ackCount: number
  totalRecipients: number
}

const typeLabels: Record<AnnouncementType, string> = {
  SYSTEM_ALERT: 'Alerta del Sistema',
  OPERATIONAL_UPDATE: 'Actualizacion Operativa',
  POLICY_UPDATE: 'Actualizacion de Politica',
  TRAINING: 'Capacitacion',
  EMERGENCY: 'Emergencia',
  GENERAL: 'General',
}

const statusLabels: Record<AnnouncementStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

const priorityLabels: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

export default function AnnouncementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'recipients' | 'analytics'>('content')
  const [recipients, setRecipients] = useState<any[]>([])
  const [recipientsTotal, setRecipientsTotal] = useState(0)
  const [recipientsPage, setRecipientsPage] = useState(1)
  const [sendingReminder, setSendingReminder] = useState(false)

  useEffect(() => {
    loadAnnouncement()
  }, [id])

  const loadAnnouncement = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const [announcementRes, analyticsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/announcements/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/announcements/${id}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (announcementRes.ok) {
        const data = await announcementRes.json()
        setAnnouncement(data)
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading announcement:', error)
      // Mock data
      setAnnouncement({
        id,
        title: 'Cambio de horario de operaciones',
        content: `# Nuevo Horario de Operaciones

A partir del **15 de enero de 2025**, el horario de apertura para todas las tiendas sera a las **8:00 AM**.

## Detalles del Cambio

- Hora de apertura: 8:00 AM (antes 9:00 AM)
- Hora de cierre: 9:00 PM (sin cambios)
- Aplica a todas las tiendas

## Acciones Requeridas

1. Actualizar los horarios en el sistema
2. Informar al personal sobre el cambio
3. Ajustar los turnos de personal

Si tiene preguntas, contacte a Recursos Humanos.`,
        summary: 'A partir del 15 de enero, el horario de apertura sera a las 8:00 AM para todas las tiendas.',
        type: 'OPERATIONAL_UPDATE',
        priority: 'HIGH',
        status: 'PUBLISHED',
        scope: 'ALL',
        targetStoreIds: [],
        targetRegionIds: [],
        targetRoles: [],
        requiresAck: true,
        publishedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: { id: '1', name: 'Maria Garcia' },
        viewCount: 180,
        ackCount: 145,
        totalRecipients: 200,
      })
      setAnalytics({
        totalViews: 180, uniqueViews: 180, totalAcks: 145, ackRate: 81,
        totalRecipients: 200, readRate: 90, pendingAckCount: 55,
        viewsByStore: [], acksByStore: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRecipients = async (page = 1) => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/announcements/${id}/recipients?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRecipients(data.recipients || [])
        setRecipientsTotal(data.total || 0)
        setRecipientsPage(page)
      }
    } catch (err) {
      console.error('Error loading recipients:', err)
    }
  }

  const handleSendReminder = async () => {
    if (!confirm('Enviar recordatorio a todos los usuarios que no han leido este anuncio?')) return
    setSendingReminder(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/announcements/${id}/send-reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Recordatorio enviado a ${data.sent} usuario(s)`)
      }
    } catch (err) {
      console.error('Error sending reminder:', err)
      alert('Error al enviar recordatorio')
    } finally {
      setSendingReminder(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Desea publicar este anuncio?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const res = await fetch(`${baseUrl}/api/v1/announcements/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        loadAnnouncement()
      } else {
        alert('Error al publicar el anuncio')
      }
    } catch (error) {
      console.error('Error publishing:', error)
      alert('Error al publicar el anuncio')
    }
  }

  const handleArchive = async () => {
    if (!confirm('Desea archivar este anuncio?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const res = await fetch(`${baseUrl}/api/v1/announcements/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        loadAnnouncement()
      } else {
        alert('Error al archivar el anuncio')
      }
    } catch (error) {
      console.error('Error archiving:', error)
      alert('Error al archivar el anuncio')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">Anuncio no encontrado</h2>
        <button
          onClick={() => router.push('/communications')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  const viewRate = announcement.totalRecipients > 0
    ? Math.round((announcement.viewCount / announcement.totalRecipients) * 100)
    : 0
  const ackRate = announcement.totalRecipients > 0
    ? Math.round((announcement.ackCount / announcement.totalRecipients) * 100)
    : 0

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
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium truncate max-w-xs">
              {announcement.title}
            </li>
          </ol>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${
                announcement.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                announcement.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                'bg-gray-100 text-gray-500'
              }`}>
                {statusLabels[announcement.status]}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-blue-100 text-blue-800">
                {typeLabels[announcement.type]}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${
                announcement.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                announcement.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                Prioridad: {priorityLabels[announcement.priority]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Creado por {announcement.createdBy.name} el {formatDate(announcement.createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            {announcement.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => router.push(`/communications/${id}/edit`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Publicar
                </button>
              </>
            )}
            {announcement.status === 'PUBLISHED' && (
              <button
                onClick={handleArchive}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Archivar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats (for published) */}
      {announcement.status === 'PUBLISHED' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Vistas</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {announcement.viewCount}/{announcement.totalRecipients}
                  </p>
                  <p className="text-xs text-gray-400">{viewRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {announcement.requiresAck && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Confirmaciones</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {announcement.ackCount}/{announcement.totalRecipients}
                    </p>
                    <p className="text-xs text-gray-400">{ackRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Publicado</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(announcement.publishedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contenido
          </button>
          {announcement.status === 'PUBLISHED' && (
            <button
              onClick={() => { setActiveTab('recipients'); loadRecipients(1); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recipients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Destinatarios
            </button>
          )}
          {announcement.status === 'PUBLISHED' && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analiticas
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'content' && (
        <div className="bg-white shadow rounded-lg p-6">
          {announcement.summary && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Resumen</p>
              <p className="mt-1 text-gray-900">{announcement.summary}</p>
            </div>
          )}

          {announcement.imageUrl && (
            <div className="mb-6">
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="w-full max-h-80 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="prose max-w-none">
            {announcement.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-xl font-semibold mt-4 mb-3">{line.slice(3)}</h2>
              }
              if (line.startsWith('- ')) {
                return <li key={i} className="ml-4">{line.slice(2)}</li>
              }
              if (line.match(/^\d+\. /)) {
                return <li key={i} className="ml-4">{line.replace(/^\d+\. /, '')}</li>
              }
              if (line.trim() === '') {
                return <br key={i} />
              }
              const formatted = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
              return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Alcance</dt>
                <dd className="font-medium text-gray-900">
                  {announcement.scope === 'ALL' ? 'Todos los usuarios' :
                   announcement.scope === 'REGIONS' ? 'Regiones seleccionadas' :
                   announcement.scope === 'STORES' ? 'Tiendas seleccionadas' :
                   'Roles seleccionados'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Requiere confirmacion</dt>
                <dd className="font-medium text-gray-900">{announcement.requiresAck ? 'Si' : 'No'}</dd>
              </div>
              {announcement.expiresAt && (
                <div>
                  <dt className="text-gray-500">Expira</dt>
                  <dd className="font-medium text-gray-900">{formatDate(announcement.expiresAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'recipients' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">{recipientsTotal} destinatario(s) total</p>
            <button
              onClick={handleSendReminder}
              disabled={sendingReminder}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {sendingReminder ? 'Enviando...' : 'Enviar Recordatorio'}
            </button>
          </div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tienda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visto</th>
                  {announcement.requiresAck && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmado</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((r: any) => (
                  <tr key={r.userId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{r.userName}</div>
                      <div className="text-sm text-gray-500">{r.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.storeName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'acknowledged' ? 'bg-green-100 text-green-800' :
                        r.status === 'read' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {r.status === 'acknowledged' ? 'Confirmado' : r.status === 'read' ? 'Leido' : 'No leido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {r.viewedAt ? formatDate(r.viewedAt) : '-'}
                    </td>
                    {announcement.requiresAck && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.acknowledgedAt ? formatDate(r.acknowledgedAt) : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {recipientsTotal > 20 && (
              <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                <button
                  onClick={() => loadRecipients(recipientsPage - 1)}
                  disabled={recipientsPage <= 1}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">Pagina {recipientsPage} de {Math.ceil(recipientsTotal / 20)}</span>
                <button
                  onClick={() => loadRecipients(recipientsPage + 1)}
                  disabled={recipientsPage >= Math.ceil(recipientsTotal / 20)}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Destinatarios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalRecipients}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Vistas</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{analytics.totalViews}</p>
              <p className="text-xs text-gray-400">{analytics.readRate}%</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Confirmaciones</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{analytics.totalAcks}</p>
              <p className="text-xs text-gray-400">{analytics.ackRate}%</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{analytics.pendingAckCount}</p>
            </div>
          </div>

          {/* Views by Store */}
          {analytics.viewsByStore.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Vistas por Tienda</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vistas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.viewsByStore.map((s) => (
                    <tr key={s.storeId}>
                      <td className="px-6 py-3 text-sm text-gray-900">{s.storeName}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{s.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Acks by Store */}
          {analytics.acksByStore.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Confirmaciones por Tienda</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.acksByStore.map((s) => (
                    <tr key={s.storeId}>
                      <td className="px-6 py-3 text-sm text-gray-900">{s.storeName}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{s.acks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
