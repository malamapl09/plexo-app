'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  startDate: string;
  endDate: string;
  targetStoreIds: string[];
  _count: { submissions: number };
}

interface DashboardData {
  totalActive: number;
  totalSubmissions: number;
  complianceRate: number;
  expiredCount: number;
  complianceByStore: {
    storeId: string;
    storeName: string;
    approvedSubmissions: number;
    totalCampaigns: number;
    complianceRate: number;
  }[];
  complianceByCampaign: {
    campaignId: string;
    campaignTitle: string;
    campaignType: string;
    approvedSubmissions: number;
    totalTargetStores: number;
    complianceRate: number;
  }[];
  recentSubmissions: any[];
}

interface Store {
  id: string;
  name: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'dashboard'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [creating, setCreating] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchCampaigns();
    fetchStores();
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    }
  }, [activeTab]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const response = await fetch(`${baseUrl}/api/v1/campaigns?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError('Error al cargar los datos');
        return;
      }
      const data = await response.json();
      setCampaigns(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/campaigns/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setStores(data.data || data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      setCreating(true);
      const response = await fetch(`${baseUrl}/api/v1/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description') || undefined,
          type: formData.get('type'),
          priority: formData.get('priority'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          instructions: formData.get('instructions') || undefined,
          materialsList: (formData.get('materialsList') as string)
            ?.split('\n')
            .filter(Boolean) || [],
          targetStoreIds: Array.from(formData.getAll('targetStoreIds')).filter(Boolean),
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setCreating(false);
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

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      PROMOTION: 'bg-purple-100 text-purple-800',
      SEASONAL: 'bg-orange-100 text-orange-800',
      PRODUCT_LAUNCH: 'bg-cyan-100 text-cyan-800',
      POS_DISPLAY: 'bg-pink-100 text-pink-800',
      PRICE_CHANGE: 'bg-amber-100 text-amber-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(total / 20);

  const SkeletonTableRows = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
          <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-20"></div></td>
          <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-16"></div></td>
          <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-16"></div></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
        </tr>
      ))}
    </tbody>
  );

  const SkeletonStatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-28 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Campañas</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700"
        >
          Nueva Campaña
        </button>
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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'campaigns'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campañas
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
        </nav>
      </div>

      {activeTab === 'campaigns' && (
        <>
          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">Activa</option>
              <option value="PAUSED">Pausada</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="PROMOTION">Promocion</option>
              <option value="SEASONAL">Temporada</option>
              <option value="PRODUCT_LAUNCH">Lanzamiento</option>
              <option value="POS_DISPLAY">Exhibicion POS</option>
              <option value="PRICE_CHANGE">Cambio de Precio</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titulo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Envios</th>
                  </tr>
                </thead>
                {loading ? <SkeletonTableRows /> : (
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {campaign.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(campaign.type)}`}>
                          {getTypeLabel(campaign.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(campaign.priority)}`}>
                          {campaign.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(campaign.status)}`}>
                          {getStatusLabel(campaign.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(campaign.startDate).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(campaign.endDate).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign._count?.submissions || 0}
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No hay campañas
                      </td>
                    </tr>
                  )}
                </tbody>
                )}
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Pagina {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'dashboard' && !dashboard && (
        <SkeletonStatCards />
      )}

      {activeTab === 'dashboard' && dashboard && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Activas</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.totalActive}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Ejecuciones Enviadas</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.totalSubmissions}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Tasa de Cumplimiento</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.complianceRate}%</div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Vencidas</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.expiredCount}</div>
            </div>
          </div>

          {/* Compliance by Store */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Cumplimiento por Tienda</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprobados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboard.complianceByStore.map((item) => (
                    <tr key={item.storeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.storeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.approvedSubmissions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalCampaigns}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${item.complianceRate}%` }}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.complianceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dashboard.complianceByStore.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance by Campaign */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Cumplimiento por Campaña</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaña</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprobados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiendas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboard.complianceByCampaign.map((item) => (
                    <tr key={item.campaignId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.campaignTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(item.campaignType)}`}>
                          {getTypeLabel(item.campaignType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.approvedSubmissions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalTargetStores}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${item.complianceRate}%` }}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.complianceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dashboard.complianceByCampaign.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nueva Campaña</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input name="title" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea name="description" rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select name="type" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="PROMOTION">Promocion</option>
                    <option value="SEASONAL">Temporada</option>
                    <option value="PRODUCT_LAUNCH">Lanzamiento</option>
                    <option value="POS_DISPLAY">Exhibicion POS</option>
                    <option value="PRICE_CHANGE">Cambio de Precio</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
                  <select name="priority" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="MEDIUM">Media</option>
                    <option value="LOW">Baja</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
                  <input name="startDate" type="datetime-local" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
                  <input name="endDate" type="datetime-local" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                <textarea name="instructions" rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Pasos para ejecutar la campaña..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lista de Materiales (uno por linea)</label>
                <textarea name="materialsList" rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Banner 2x1m&#10;Etiquetas de precio&#10;..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiendas Objetivo (dejar vacio = todas)</label>
                <select name="targetStoreIds" multiple className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-24">
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:opacity-50">
                  {creating ? 'Creando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
