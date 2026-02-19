'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  startDate: string;
  endDate: string;
  referencePhotoUrls: string[];
  materialsList: string[];
  instructions?: string;
  targetStoreIds: string[];
  createdBy?: { id: string; name: string; email: string };
  submissions: Submission[];
  createdAt: string;
}

interface Submission {
  id: string;
  storeId: string;
  store: { id: string; name: string };
  submittedBy: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string; email: string } | null;
  status: string;
  photoUrls: string[];
  notes?: string;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setChangingStatus(true);
      const response = await fetch(`${baseUrl}/api/v1/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchCampaign();
      }
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setChangingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activa',
      PAUSED: 'Pausada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getSubmissionStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
      NEEDS_REVISION: 'bg-red-100 text-red-800',
      RESUBMITTED: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSubmissionStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      APPROVED: 'Aprobado',
      PENDING_REVIEW: 'Pendiente',
      NEEDS_REVISION: 'Requiere Revision',
      RESUBMITTED: 'Reenviado',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PROMOTION: 'Promocion',
      SEASONAL: 'Temporada',
      PRODUCT_LAUNCH: 'Lanzamiento',
      POS_DISPLAY: 'Exhibicion POS',
      PRICE_CHANGE: 'Cambio de Precio',
      OTHER: 'Otro',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Campaña no encontrada</div>
      </div>
    );
  }

  const statusActions: Record<string, { label: string; status: string; color: string }[]> = {
    DRAFT: [
      { label: 'Activar', status: 'ACTIVE', color: 'bg-green-600 hover:bg-green-700' },
      { label: 'Cancelar', status: 'CANCELLED', color: 'bg-red-600 hover:bg-red-700' },
    ],
    ACTIVE: [
      { label: 'Pausar', status: 'PAUSED', color: 'bg-yellow-600 hover:bg-yellow-700' },
      { label: 'Completar', status: 'COMPLETED', color: 'bg-blue-600 hover:bg-blue-700' },
      { label: 'Cancelar', status: 'CANCELLED', color: 'bg-red-600 hover:bg-red-700' },
    ],
    PAUSED: [
      { label: 'Reactivar', status: 'ACTIVE', color: 'bg-green-600 hover:bg-green-700' },
      { label: 'Cancelar', status: 'CANCELLED', color: 'bg-red-600 hover:bg-red-700' },
    ],
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <a href="/campaigns" className="text-primary-600 hover:text-primary-900 text-sm">
          &larr; Volver a Campañas
        </a>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{campaign.title}</h1>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800`}>
              {getTypeLabel(campaign.type)}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(campaign.status)}`}>
              {getStatusLabel(campaign.status)}
            </span>
            <span className="text-sm text-gray-500">Prioridad: {campaign.priority}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {(statusActions[campaign.status] || []).map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusChange(action.status)}
              disabled={changingStatus}
              className={`px-4 py-2 text-white text-sm font-medium rounded ${action.color} disabled:opacity-50`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Detalles</h2>
          <dl className="space-y-3">
            {campaign.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Descripcion</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.description}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Inicio</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.startDate).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Vencimiento</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.endDate).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </dd>
              </div>
            </div>
            {campaign.createdBy && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Creado por</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.createdBy.name}</dd>
              </div>
            )}
            {campaign.instructions && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Instrucciones</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{campaign.instructions}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-6">
          {/* Materials */}
          {campaign.materialsList.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Materiales</h2>
              <ul className="list-disc list-inside space-y-1">
                {campaign.materialsList.map((item, index) => (
                  <li key={index} className="text-sm text-gray-900">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference Photos */}
          {campaign.referencePhotoUrls.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fotos de Referencia</h2>
              <div className="grid grid-cols-2 gap-4">
                {campaign.referencePhotoUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Referencia ${index + 1}`}
                    className="w-full rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Ejecuciones ({campaign.submissions.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaign.submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sub.store.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sub.submittedBy.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSubmissionStatusBadge(sub.status)}`}>
                      {getSubmissionStatusLabel(sub.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sub.submittedAt).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`/campaigns/submissions/${sub.id}`}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                    >
                      {sub.status === 'PENDING_REVIEW' || sub.status === 'RESUBMITTED' ? 'Revisar' : 'Ver'}
                    </a>
                  </td>
                </tr>
              ))}
              {campaign.submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay ejecuciones enviadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
