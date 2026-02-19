'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Submission {
  id: string;
  templateId: string;
  templateName: string;
  templateDescription?: string;
  referencePhotoUrls: string[];
  dueDate?: string | null;
  storeId: string;
  storeName: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  photoUrls: string[];
  notes?: string;
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

export default function PlanogramSubmissionDetailPage() {
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
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/planograms/submissions/${id}`, {
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
      const response = await fetch(`${baseUrl}/api/v1/planograms/submissions/${id}/review`, {
        method: 'POST',
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
        router.push('/planograms');
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
        <div className="text-center text-gray-500">Envio no encontrado</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <a href="/planograms" className="text-primary-600 hover:text-primary-900 text-sm">
          &larr; Volver a Planogramas
        </a>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{submission.templateName}</h1>
          <p className="text-gray-500 mt-1">{submission.storeName}</p>
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
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
          {submission.submittedBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Enviado por</dt>
              <dd className="mt-1 text-sm text-gray-900">{submission.submittedBy.name}</dd>
            </div>
          )}
          {submission.reviewedAt && (
            <>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Revision</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(submission.reviewedAt).toLocaleDateString('es-DO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
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

      {/* Side-by-Side Comparison */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Comparacion</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reference Photos */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fotos de Referencia</h3>
            <div className="space-y-4">
              {submission.referencePhotoUrls && submission.referencePhotoUrls.length > 0 ? (
                submission.referencePhotoUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Referencia ${index + 1}`}
                    className="w-full rounded-lg border border-gray-200"
                  />
                ))
              ) : (
                <div className="text-sm text-gray-500">No hay fotos de referencia</div>
              )}
            </div>
          </div>

          {/* Submitted Photos */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fotos Enviadas</h3>
            <div className="space-y-4">
              {submission.photoUrls && submission.photoUrls.length > 0 ? (
                submission.photoUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Envio ${index + 1}`}
                    className="w-full rounded-lg border border-gray-200"
                  />
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
