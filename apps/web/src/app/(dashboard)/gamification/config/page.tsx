'use client';

import { useEffect, useState } from 'react';

interface PointConfig {
  actionType: string;
  points: number;
  description?: string;
  isActive: boolean;
}

export default function GamificationConfigPage() {
  const [configs, setConfigs] = useState<PointConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/gamification/point-configs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (actionType: string, currentPoints: number) => {
    setEditingAction(actionType);
    setEditPoints(currentPoints);
  };

  const handleSave = async (actionType: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/gamification/point-configs/${actionType}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: editPoints }),
      });

      if (response.ok) {
        setEditingAction(null);
        fetchConfigs();
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      TASK_COMPLETED: 'Tarea Completada',
      CHECKLIST_COMPLETED: 'Checklist Completado',
      AUDIT_COMPLETED: 'Auditoria Completada',
      ISSUE_RESOLVED: 'Incidencia Resuelta',
      ISSUE_REPORTED: 'Incidencia Reportada',
      CAPA_COMPLETED: 'Accion Correctiva Completada',
      CAPA_VERIFIED: 'Accion Correctiva Verificada',
      PLANOGRAM_APPROVED: 'Planograma Aprobado',
      ON_TIME_COMPLETION: 'Entrega a Tiempo',
      PERFECT_AUDIT_SCORE: 'Auditoria Perfecta',
    };
    return labels[actionType] || actionType;
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
      <div className="mb-6">
        <a href="/gamification" className="text-primary-600 hover:text-primary-900 text-sm">
          &larr; Volver a Clasificacion
        </a>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Configuracion de Puntos
      </h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Accion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripcion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {configs.map((config) => (
                <tr key={config.actionType}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getActionTypeLabel(config.actionType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingAction === config.actionType ? (
                      <input
                        type="number"
                        value={editPoints}
                        onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                        className="w-20 border border-gray-300 rounded px-2 py-1"
                        min="0"
                      />
                    ) : (
                      <span className="font-semibold text-primary-600">
                        {config.points} pts
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {config.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      config.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {config.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingAction === config.actionType ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(config.actionType)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingAction(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(config.actionType, config.points)}
                        className="text-primary-600 hover:text-primary-900 font-medium"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {configs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay configuraciones disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Informacion sobre la Configuracion
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Los puntos se otorgan automaticamente cuando los usuarios completan acciones</li>
                <li>Los cambios se aplicaran inmediatamente a futuras acciones</li>
                <li>Los puntos ya otorgados no se veran afectados por los cambios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
