'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  sourceType: string;
  sourceId: string | null;
  storeId: string;
  assignedToId: string;
  status: string;
  priority: string;
  dueDate: string;
  completedAt: string | null;
  verifiedAt: string | null;
  completionNotes: string | null;
  completionPhotoUrls: string[];
  store: {
    name: string;
  };
  assignedTo: {
    name: string;
  };
  createdAt: string;
}

export default function CorrectiveActionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [action, setAction] = useState<CorrectiveAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (id) {
      fetchAction();
    }
  }, [id]);

  const fetchAction = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/corrective-actions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAction(data);
      setCompletionNotes(data.completionNotes || '');
    } catch (error) {
      console.error('Error fetching action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${baseUrl}/api/v1/corrective-actions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, completionNotes }),
      });

      if (response.ok) {
        fetchAction();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      VERIFIED: 'bg-purple-100 text-purple-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      VERIFIED: 'Verificado',
      OVERDUE: 'Vencido',
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      HIGH: 'Alta',
      MEDIUM: 'Media',
      LOW: 'Baja',
    };
    return labels[priority] || priority;
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      AUDIT_FINDING: 'Auditoría',
      CHECKLIST_FAILURE: 'Checklist',
      ISSUE: 'Incidencia',
      MANUAL: 'Manual',
    };
    return labels[sourceType] || sourceType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Acción correctiva no encontrada</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <a href="/corrective-actions" className="text-primary-600 hover:text-primary-900 text-sm">
          ← Volver a Acciones Correctivas
        </a>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{action.title}</h1>
          <p className="text-gray-500 mt-1">{action.store.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityBadge(action.priority)}`}>
            {getPriorityLabel(action.priority)}
          </span>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(action.status)}`}>
            {getStatusLabel(action.status)}
          </span>
        </div>
      </div>

      {/* Action Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Información</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
            <dd className="mt-1 text-sm text-gray-900">{action.description}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Asignado a</dt>
            <dd className="mt-1 text-sm text-gray-900">{action.assignedTo.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Origen</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {getSourceTypeLabel(action.sourceType)}
              {action.sourceId && ` #${action.sourceId}`}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha Límite</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(action.dueDate).toLocaleDateString('es-DO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cronología</h2>
        <div className="flow-root">
          <ul className="-mb-8">
            <li className="relative pb-8">
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-900 font-medium">Creada</div>
                  <div className="text-sm text-gray-500">
                    {new Date(action.createdAt).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </li>

            {action.status !== 'PENDING' && (
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      action.status === 'IN_PROGRESS' || action.status === 'COMPLETED' || action.status === 'VERIFIED'
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}>
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900 font-medium">En Progreso</div>
                  </div>
                </div>
              </li>
            )}

            {action.completedAt && (
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      action.status === 'COMPLETED' || action.status === 'VERIFIED'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}>
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900 font-medium">Completada</div>
                    <div className="text-sm text-gray-500">
                      {new Date(action.completedAt).toLocaleDateString('es-DO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </li>
            )}

            {action.verifiedAt && (
              <li className="relative">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900 font-medium">Verificada</div>
                    <div className="text-sm text-gray-500">
                      {new Date(action.verifiedAt).toLocaleDateString('es-DO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Completion Evidence */}
      {(action.completionNotes || (action.completionPhotoUrls && action.completionPhotoUrls.length > 0)) && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Evidencia de Cumplimiento</h2>
          {action.completionNotes && (
            <div className="mb-4">
              <dt className="text-sm font-medium text-gray-500">Notas</dt>
              <dd className="mt-1 text-sm text-gray-900">{action.completionNotes}</dd>
            </div>
          )}
          {action.completionPhotoUrls && action.completionPhotoUrls.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Fotos</dt>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {action.completionPhotoUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Evidencia ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones</h2>
        <div className="space-y-4">
          {action.status === 'PENDING' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={submitting}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Iniciar Trabajo
            </button>
          )}

          {action.status === 'IN_PROGRESS' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de Cumplimiento
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Describe las acciones tomadas..."
                />
              </div>
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={submitting}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50"
              >
                Marcar como Completada
              </button>
            </>
          )}

          {action.status === 'COMPLETED' && (
            <button
              onClick={() => handleStatusChange('VERIFIED')}
              disabled={submitting}
              className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Verificar Cumplimiento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
