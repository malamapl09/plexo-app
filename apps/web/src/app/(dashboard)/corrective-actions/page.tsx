'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  statusSummary: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    verified: number;
  };
  avgResolutionTime: number;
  totalActions: number;
}

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
  isOverdue: boolean;
  store: {
    name: string;
  };
  assignedTo: {
    name: string;
  };
}

interface Store {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

export default function CorrectiveActionsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    storeId: '',
    sourceType: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedToId: '',
    storeId: '',
    dueDate: '',
    priority: 'MEDIUM',
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchDashboard();
    fetchActions();
    fetchStores();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchActions();
  }, [filters]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/corrective-actions/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.storeId) params.append('storeId', filters.storeId);
      if (filters.sourceType) params.append('sourceType', filters.sourceType);

      const response = await fetch(`${baseUrl}/api/v1/corrective-actions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError('Error al cargar los datos');
        return;
      }
      const data = await response.json();
      setActions(data.items || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/api/v1/corrective-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          sourceType: 'MANUAL',
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({
          title: '',
          description: '',
          assignedToId: '',
          storeId: '',
          dueDate: '',
          priority: 'MEDIUM',
        });
        fetchDashboard();
        fetchActions();
      }
    } catch (error) {
      console.error('Error creating action:', error);
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

  const getSourceTypeBadge = (sourceType: string) => {
    const colors: Record<string, string> = {
      AUDIT_FINDING: 'bg-purple-100 text-purple-800',
      CHECKLIST_FAILURE: 'bg-blue-100 text-blue-800',
      ISSUE: 'bg-orange-100 text-orange-800',
      MANUAL: 'bg-gray-100 text-gray-800',
    };
    return colors[sourceType] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Acciones Correctivas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700"
        >
          Crear Acción
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500">Total</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats?.totalActions || 0}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500">Pendientes</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats?.statusSummary?.pending || 0}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500">En Progreso</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{stats?.statusSummary?.inProgress || 0}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500">Vencidas</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">{stats?.statusSummary?.overdue || 0}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500">Completadas</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats?.statusSummary?.completed || 0}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500">Tiempo Prom.</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats?.avgResolutionTime ? `${stats.avgResolutionTime}h` : '-'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completado</option>
              <option value="VERIFIED">Verificado</option>
              <option value="OVERDUE">Vencido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tienda</label>
            <select
              value={filters.storeId}
              onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Todas</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
            <select
              value={filters.sourceType}
              onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Todos</option>
              <option value="AUDIT_FINDING">Auditoría</option>
              <option value="CHECKLIST_FAILURE">Checklist</option>
              <option value="ISSUE">Incidencia</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignado a
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Límite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {actions.map((action) => (
                  <tr key={action.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {action.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSourceTypeBadge(action.sourceType)}`}>
                        {getSourceTypeLabel(action.sourceType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {action.store?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {action.assignedTo?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(action.status)}`}>
                        {getStatusLabel(action.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(action.priority)}`}>
                        {getPriorityLabel(action.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(action.dueDate).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={`/corrective-actions/${action.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Ver Detalles
                      </a>
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay acciones correctivas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear Acción Correctiva</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asignado a</label>
                  <select
                    required
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tienda</label>
                  <select
                    required
                    value={formData.storeId}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Seleccionar tienda</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Límite</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
