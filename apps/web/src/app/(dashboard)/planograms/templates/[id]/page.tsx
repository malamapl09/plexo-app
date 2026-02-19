'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string;
  referencePhotoUrls: string[];
  targetStoreIds: string[];
  dueDate: string | null;
  isActive: boolean;
  submissions: Submission[];
}

interface Submission {
  id: string;
  storeId: string;
  store: {
    id: string;
    name: string;
  };
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function PlanogramTemplateDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/planograms/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
      NEEDS_REVISION: 'bg-red-100 text-red-800',
      RESUBMITTED: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      APPROVED: 'Aprobado',
      PENDING_REVIEW: 'Pendiente',
      NEEDS_REVISION: 'Requiere Revision',
      RESUBMITTED: 'Reenviado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Plantilla no encontrada</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <a href="/planograms/templates" className="text-primary-600 hover:text-primary-900 text-sm">
          &larr; Volver a Plantillas
        </a>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{template.name}</h1>

      {/* Template Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informacion</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Descripcion</dt>
                <dd className="mt-1 text-sm text-gray-900">{template.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tiendas Objetivo</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {template.targetStoreIds.length || 'Todas'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha Limite</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {template.dueDate ? new Date(template.dueDate).toLocaleDateString('es-DO') : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      template.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Fotos de Referencia</h2>
            <div className="grid grid-cols-2 gap-4">
              {template.referencePhotoUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Referencia ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
              ))}
              {template.referencePhotoUrls.length === 0 && (
                <div className="col-span-2 text-sm text-gray-500">No hay fotos de referencia</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Envios por Tienda</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tienda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Envio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {template.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.store.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(submission.status)}`}>
                      {getStatusLabel(submission.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.reviewedBy?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={`/planograms/submissions/${submission.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Ver Detalles
                    </a>
                  </td>
                </tr>
              ))}
              {template.submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay envios disponibles
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
