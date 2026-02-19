'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  totalTemplates: number;
  totalSubmissions: number;
  overallComplianceRate: number;
  complianceByStore: StoreCompliance[];
  complianceByTemplate: TemplateCompliance[];
  recentSubmissions: Submission[];
}

interface StoreCompliance {
  storeId: string;
  storeName: string;
  approvedSubmissions: number;
  totalTemplates: number;
  complianceRate: number;
}

interface TemplateCompliance {
  templateId: string;
  templateName: string;
  approvedSubmissions: number;
  totalTargetStores: number;
  complianceRate: number;
}

interface Submission {
  id: string;
  templateName: string;
  storeName: string;
  status: string;
  submittedAt: string;
  photoUrls: string[];
}

export default function PlanogramsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'revision'>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'revision') {
      fetchPendingSubmissions();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/api/v1/planograms/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError('Error al cargar los datos');
        return;
      }
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSubmissions = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/planograms/submissions?status=PENDING_REVIEW`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
      NEEDS_REVISION: 'bg-red-100 text-red-800',
      RESUBMITTED: 'bg-blue-100 text-blue-800',
      NOT_SUBMITTED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      APPROVED: 'Aprobado',
      PENDING_REVIEW: 'Pendiente',
      NEEDS_REVISION: 'Requiere Revision',
      RESUBMITTED: 'Reenviado',
      NOT_SUBMITTED: 'No Enviado',
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Planogramas</h1>
        <a
          href="/planograms/templates"
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700"
        >
          Ver Plantillas
        </a>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total de Plantillas</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.totalTemplates || 0}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total de Envios</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.totalSubmissions || 0}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Tasa de Cumplimiento</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.overallComplianceRate || 0}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Por Tienda
            </button>
            <button
              onClick={() => setActiveTab('revision')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'revision'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pendientes de Revision
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tienda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprobados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Plantillas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumplimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dashboard?.complianceByStore || []).map((item) => (
                    <tr key={item.storeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.storeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.approvedSubmissions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.totalTemplates}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${item.complianceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.complianceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(dashboard?.complianceByStore || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revision Tab */}
        {activeTab === 'revision' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {submission.photoUrls && submission.photoUrls.length > 0 && (
                    <img
                      src={submission.photoUrls[0]}
                      alt="Planogram"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900">{submission.templateName}</h3>
                    <p className="text-sm text-gray-500 mt-1">{submission.storeName}</p>
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(submission.status)}`}>
                        {getStatusLabel(submission.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(submission.submittedAt).toLocaleDateString('es-DO')}
                    </p>
                    <a
                      href={`/planograms/submissions/${submission.id}`}
                      className="mt-4 block w-full text-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700"
                    >
                      Revisar
                    </a>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="col-span-3 text-center text-sm text-gray-500 py-8">
                  No hay envios pendientes de revision
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
