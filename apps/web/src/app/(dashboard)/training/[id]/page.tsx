'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Check, X } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  passingScore: number;
  isMandatory: boolean;
  estimatedDurationMinutes: number | null;
  certificationValidDays: number | null;
  scope: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  lessons: Lesson[];
  enrollments: Enrollment[];
  _count: {
    lessons: number;
    enrollments: number;
  };
  completedEnrollments: number;
  completionRate: number;
}

interface Lesson {
  id: string;
  sortOrder: number;
  title: string;
  type: string;
  content: string | null;
  fileUrl: string | null;
  estimatedMinutes: number | null;
  isRequired: boolean;
  questions: Question[];
}

interface Question {
  id: string;
  sortOrder: number;
  questionText: string;
  type: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string | null;
}

interface Enrollment {
  id: string;
  status: string;
  score: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    store: { id: string; name: string } | null;
  };
  createdAt: string;
  completedAt: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  store: { id: string; name: string } | null;
}

interface ComplianceData {
  courseId: string;
  courseTitle: string;
  complianceByStore: {
    storeId: string;
    storeName: string;
    totalUsers: number;
    enrolled: number;
    completed: number;
    completionRate: number;
  }[];
}

type Tab = 'lessons' | 'enrollments' | 'compliance';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

const categoryColors: Record<string, string> = {
  OPERATIONS: 'bg-blue-100 text-blue-800',
  CASH_MANAGEMENT: 'bg-green-100 text-green-800',
  CUSTOMER_SERVICE: 'bg-purple-100 text-purple-800',
  INVENTORY: 'bg-orange-100 text-orange-800',
  COMPLIANCE: 'bg-red-100 text-red-800',
  SAFETY: 'bg-yellow-100 text-yellow-800',
};

const categoryLabels: Record<string, string> = {
  OPERATIONS: 'Operaciones',
  CASH_MANAGEMENT: 'Manejo de Caja',
  CUSTOMER_SERVICE: 'Servicio al Cliente',
  INVENTORY: 'Inventario',
  COMPLIANCE: 'Cumplimiento',
  SAFETY: 'Seguridad',
};

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  EXPIRED: 'Vencido',
};

const lessonTypeIcons: Record<string, string> = {
  TEXT: '📄',
  PDF: '📎',
  VIDEO: '🎬',
  QUIZ: '❓',
};

const lessonTypeLabels: Record<string, string> = {
  TEXT: 'Texto',
  PDF: 'PDF',
  VIDEO: 'Video',
  QUIZ: 'Cuestionario',
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('lessons');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    loadCourse();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'compliance' && !compliance) {
      loadCompliance();
    }
  }, [activeTab]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/training/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        console.error('Failed to load course');
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompliance = async () => {
    try {
      setComplianceLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/training/courses/${id}/compliance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompliance(data);
      } else {
        console.error('Failed to load compliance data');
      }
    } catch (error) {
      console.error('Error loading compliance:', error);
    } finally {
      setComplianceLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleEnrollClick = () => {
    setShowEnrollModal(true);
    loadUsers();
  };

  const handleEnroll = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      setEnrolling(true);
      setEnrollError(null);
      const response = await fetch(`${baseUrl}/api/v1/training/courses/${id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });

      if (response.ok) {
        setShowEnrollModal(false);
        setSelectedUserIds([]);
        setEnrollError(null);
        loadCourse();
      } else {
        const errorData = await response.json().catch(() => null);
        setEnrollError(errorData?.message || 'Error al inscribir usuarios');
      }
    } catch (error) {
      setEnrollError('Error de conexión al inscribir usuarios');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Curso no encontrado</div>
      </div>
    );
  }

  const sortedLessons = [...course.lessons].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/training')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[course.category] || 'bg-gray-100 text-gray-800'}`}>
                  {categoryLabels[course.category] || course.category}
                </span>
                {course.isMandatory && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Obligatorio
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {course.description && (
          <p className="text-gray-600 mb-4">{course.description}</p>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-gray-500">Puntuación Mínima</div>
            <div className="text-lg font-semibold text-gray-900">{course.passingScore}%</div>
          </div>
          {course.estimatedDurationMinutes && (
            <div>
              <div className="text-xs text-gray-500">Duración Estimada</div>
              <div className="text-lg font-semibold text-gray-900">{course.estimatedDurationMinutes} min</div>
            </div>
          )}
          {course.certificationValidDays && (
            <div>
              <div className="text-xs text-gray-500">Validez Certificado</div>
              <div className="text-lg font-semibold text-gray-900">{course.certificationValidDays} días</div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500">Alcance</div>
            <div className="text-lg font-semibold text-gray-900">
              {course.scope === 'ALL' ? 'Todas' : course.scope === 'SINGLE_STORE' ? 'Tienda' : 'Múltiples'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Lecciones</div>
            <div className="text-lg font-semibold text-gray-900">{course._count.lessons}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Creado por</div>
            <div className="text-sm font-medium text-gray-900">{course.createdBy.name}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'lessons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lecciones
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'enrollments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inscripciones ({course._count.enrollments})
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'compliance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cumplimiento
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Lecciones Tab */}
          {activeTab === 'lessons' && (
            <div className="space-y-3">
              {sortedLessons.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay lecciones en este curso
                </div>
              ) : (
                sortedLessons.map((lesson, index) => (
                  <div key={lesson.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="text-2xl">{lessonTypeIcons[lesson.type]}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {index + 1}. {lesson.title}
                            </span>
                            {lesson.isRequired && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Requerido
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span>{lessonTypeLabels[lesson.type]}</span>
                            {lesson.estimatedMinutes && (
                              <span>{lesson.estimatedMinutes} min</span>
                            )}
                            {lesson.type === 'QUIZ' && lesson.questions.length > 0 && (
                              <span>{lesson.questions.length} preguntas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Inscripciones Tab */}
          {activeTab === 'enrollments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                  {course.completedEnrollments} de {course._count.enrollments} completados ({course.completionRate.toFixed(1)}%)
                </div>
                <button
                  onClick={handleEnrollClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Inscribir Usuarios</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tienda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puntuación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Inscripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Completado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {course.enrollments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No hay inscripciones
                        </td>
                      </tr>
                    ) : (
                      course.enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{enrollment.user.name}</div>
                            <div className="text-sm text-gray-500">{enrollment.user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.user.role}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.user.store?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[enrollment.status]}`}>
                              {statusLabels[enrollment.status] || enrollment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.score !== null ? `${enrollment.score}%` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(enrollment.createdAt).toLocaleDateString('es-DO')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString('es-DO') : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cumplimiento Tab */}
          {activeTab === 'compliance' && (
            <div>
              {complianceLoading ? (
                <div className="text-center py-12 text-gray-500">Cargando datos de cumplimiento...</div>
              ) : !compliance ? (
                <div className="text-center py-12 text-gray-500">No hay datos de cumplimiento disponibles</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tienda
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Usuarios
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inscritos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completados
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cumplimiento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {compliance.complianceByStore.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            No hay datos de cumplimiento
                          </td>
                        </tr>
                      ) : (
                        compliance.complianceByStore.map((store) => (
                          <tr key={store.storeId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {store.storeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {store.totalUsers}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {store.enrolled}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {store.completed}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${store.completionRate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
                                  {store.completionRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Inscribir Usuarios</h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {enrollError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                  {enrollError}
                </div>
              )}
              <div className="space-y-2">
                {users.map((user) => {
                  const isEnrolled = course.enrollments.some(e => e.user.id === user.id);
                  const isSelected = selectedUserIds.includes(user.id);

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        isEnrolled
                          ? 'bg-gray-50 opacity-50'
                          : isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !isEnrolled && toggleUserSelection(user.id)}
                          disabled={isEnrolled}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.email} • {user.role} {user.store && `• ${user.store.name}`}
                          </div>
                        </div>
                      </div>
                      {isEnrolled && (
                        <span className="text-xs text-gray-500">Ya inscrito</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedUserIds.length} usuario{selectedUserIds.length !== 1 ? 's' : ''} seleccionado{selectedUserIds.length !== 1 ? 's' : ''}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEnrollModal(false);
                    setSelectedUserIds([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={enrolling}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnroll}
                  disabled={selectedUserIds.length === 0 || enrolling}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Inscribiendo...' : 'Inscribir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
