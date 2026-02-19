'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Submission {
  id: string;
  campaignId: string;
  storeId: string;
  status: string;
  photoUrls: string[];
  notes?: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  submittedBy?: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string; email: string } | null;
  campaign: {
    id: string;
    title: string;
    description?: string;
    type: string;
    priority: string;
    referencePhotoUrls: string[];
    materialsList: string[];
    instructions?: string;
    startDate: string;
    endDate: string;
  };
  store: { id: string; name: string };
}

export default function CampaignSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'NEEDS_REVISION'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (id) fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/campaigns/submissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setSubmission(data);
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`${baseUrl}/api/v1/campaigns/submissions/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          reviewNotes,
        }),
      });

      if (response.ok) {
        router.push(`/campaigns/${submission?.campaignId}`);
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
    } finally {
      setSubmitting(false);
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

  if (!submission) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Ejecucion no encontrada</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <a href={`/campaigns/${submission.campaignId}`} className="text-primary-600 hover:text-primary-900 text-sm">
          &larr; Volver a {submission.campaign.title}
        </a>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{submission.campaign.title}</h1>
          <p className="text-gray-500 mt-1">{submission.store.name}</p>
        </div>
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(submission.status)}`}>
          {getStatusLabel(submission.status)}
        </span>
      </div>

      {/* Submission Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Informacion del Envio</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de Envio</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(submission.submittedAt).toLocaleDateString('es-DO', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </dd>
          </div>
          {submission.submittedBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Enviado por</dt>
              <dd className="mt-1 text-sm text-gray-900">{submission.submittedBy.name}</dd>
            </div>
          )}
          {submission.notes && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notas del Ejecutor</dt>
              <dd className="mt-1 text-sm text-gray-900">{submission.notes}</dd>
            </div>
          )}
          {submission.reviewedAt && (
            <>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Revision</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(submission.reviewedAt).toLocaleDateString('es-DO', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Revisor</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.reviewedBy?.name || '-'}</dd>
              </div>
              {submission.reviewNotes && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notas de Revision</dt>
                  <dd className="mt-1 text-sm text-gray-900">{submission.reviewNotes}</dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>

      {/* Campaign Instructions & Materials */}
      {(submission.campaign.instructions || submission.campaign.materialsList.length > 0) && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Instrucciones de Campaña</h2>
          {submission.campaign.instructions && (
            <div className="mb-4">
              <p className="text-sm text-gray-900 whitespace-pre-line">{submission.campaign.instructions}</p>
            </div>
          )}
          {submission.campaign.materialsList.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Materiales</h3>
              <ul className="list-disc list-inside space-y-1">
                {submission.campaign.materialsList.map((item, index) => (
                  <li key={index} className="text-sm text-gray-900">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Comparison */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Comparacion</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fotos de Referencia</h3>
            <div className="space-y-4">
              {submission.campaign.referencePhotoUrls.length > 0 ? (
                submission.campaign.referencePhotoUrls.map((url, index) => (
                  <img key={index} src={url} alt={`Referencia ${index + 1}`} className="w-full rounded-lg border border-gray-200" />
                ))
              ) : (
                <div className="text-sm text-gray-500">No hay fotos de referencia</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fotos de Ejecucion</h3>
            <div className="space-y-4">
              {submission.photoUrls.length > 0 ? (
                submission.photoUrls.map((url, index) => (
                  <img key={index} src={url} alt={`Ejecucion ${index + 1}`} className="w-full rounded-lg border border-gray-200" />
                ))
              ) : (
                <div className="text-sm text-gray-500">No hay fotos enviadas</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {(submission.status === 'PENDING_REVIEW' || submission.status === 'RESUBMITTED') && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revision</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="APPROVED"
                    checked={reviewStatus === 'APPROVED'}
                    onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'NEEDS_REVISION')}
                    className="mr-2"
                  />
                  <span className="text-sm">Aprobar</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="NEEDS_REVISION"
                    checked={reviewStatus === 'NEEDS_REVISION'}
                    onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'NEEDS_REVISION')}
                    className="mr-2"
                  />
                  <span className="text-sm">Solicitar Revision</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas {reviewStatus === 'NEEDS_REVISION' && '(requeridas)'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                required={reviewStatus === 'NEEDS_REVISION'}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Agregue comentarios o instrucciones..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleReview}
                disabled={submitting || (reviewStatus === 'NEEDS_REVISION' && !reviewNotes.trim())}
                className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : 'Enviar Revision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
