'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  passingScore: number;
  isMandatory: boolean;
  estimatedDurationMinutes: number | null;
  isActive: boolean;
  createdBy: { id: string; name: string };
  _count: { lessons: number; enrollments: number };
  completedEnrollments: number;
  completionRate: number;
}

interface DashboardData {
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  mandatoryCourses: number;
  overdueMandatory: number;
}

export default function TrainingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'courses' | 'dashboard'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchCourses();
  }, [page, categoryFilter, search]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    }
  }, [activeTab]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (categoryFilter) params.set('category', categoryFilter);
      if (search) params.set('search', search);

      const response = await fetch(`${baseUrl}/api/v1/training/courses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError('Error al cargar los datos');
        return;
      }
      const data = await response.json();
      setCourses(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/training/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      OPERATIONS: 'Operaciones',
      CASH_MANAGEMENT: 'Manejo de Caja',
      CUSTOMER_SERVICE: 'Servicio al Cliente',
      INVENTORY: 'Inventario',
      COMPLIANCE: 'Cumplimiento',
      SAFETY: 'Seguridad',
    };
    return labels[category] || category;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      OPERATIONS: 'bg-blue-100 text-blue-800',
      CASH_MANAGEMENT: 'bg-green-100 text-green-800',
      CUSTOMER_SERVICE: 'bg-purple-100 text-purple-800',
      INVENTORY: 'bg-orange-100 text-orange-800',
      COMPLIANCE: 'bg-red-100 text-red-800',
      SAFETY: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(total / 20);

  const SkeletonTableRows = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
          <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-20"></div></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
          <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-20"></div></td>
        </tr>
      ))}
    </tbody>
  );

  const SkeletonStatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
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
        <h1 className="text-2xl font-semibold text-gray-900">Entrenamiento</h1>
        <button
          onClick={() => router.push('/training/create')}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700"
        >
          Nuevo Curso
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
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'courses'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cursos
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

      {activeTab === 'courses' && (
        <>
          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Todas las categorias</option>
              <option value="OPERATIONS">Operaciones</option>
              <option value="CASH_MANAGEMENT">Manejo de Caja</option>
              <option value="CUSTOMER_SERVICE">Servicio al Cliente</option>
              <option value="INVENTORY">Inventario</option>
              <option value="COMPLIANCE">Cumplimiento</option>
              <option value="SAFETY">Seguridad</option>
            </select>
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 max-w-xs"
            />
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titulo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duracion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscritos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  </tr>
                </thead>
                {loading ? <SkeletonTableRows /> : (
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/training/${course.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {course.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(course.category)}`}>
                          {getCategoryLabel(course.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.estimatedDurationMinutes ? `${course.estimatedDurationMinutes} min` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course._count.lessons}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course._count.enrollments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${course.completionRate}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-900">{course.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course.isMandatory ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Obligatorio</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Opcional</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No hay cursos de entrenamiento
                      </td>
                    </tr>
                  )}
                </tbody>
                )}
              </table>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">Total Cursos</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.totalCourses}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">Inscripciones</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.totalEnrollments}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">Tasa de Completado</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.completionRate}%</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">Completados</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.completedEnrollments}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">Cursos Obligatorios</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{dashboard.mandatoryCourses}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">Obligatorios Pendientes</div>
            <div className="mt-2 text-3xl font-semibold text-red-600">{dashboard.overdueMandatory}</div>
          </div>
        </div>
      )}
    </div>
  );
}
