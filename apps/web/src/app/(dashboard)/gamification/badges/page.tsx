'use client';

import { useEffect, useState } from 'react';

interface Badge {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  criteria: Record<string, any>;
  earnedCount: number;
  isEarned?: boolean;
  earnedAt?: string;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/gamification/badges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setBadges(data);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCriteriaLabel = (criteria: Record<string, any>) => {
    if (criteria.type === 'count') {
      const actionLabels: Record<string, string> = {
        TASK_COMPLETED: 'tareas completadas',
        CHECKLIST_COMPLETED: 'checklists completados',
        AUDIT_COMPLETED: 'auditorias completadas',
        ISSUE_RESOLVED: 'incidencias resueltas',
        PERFECT_AUDIT_SCORE: 'auditorias perfectas',
        ON_TIME_COMPLETION: 'entregas a tiempo',
      };
      const label = actionLabels[criteria.actionType] || criteria.actionType;
      return `${criteria.threshold} ${label}`;
    }
    if (criteria.type === 'total_points') {
      return `${criteria.threshold} puntos totales`;
    }
    if (criteria.type === 'streak') {
      return `Racha de ${criteria.threshold} dias`;
    }
    return JSON.stringify(criteria);
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

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Insignias</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-lg p-6 border-2 transition-all ${
              badge.isEarned
                ? 'bg-white border-primary-500 shadow-lg'
                : 'bg-gray-50 border-gray-200 opacity-75'
            }`}
          >
            <div className="text-center">
              {/* Badge Icon */}
              <div
                className={`text-6xl mb-4 ${
                  badge.isEarned ? '' : 'grayscale opacity-50'
                }`}
              >
                {badge.iconUrl ? (
                  <img src={badge.iconUrl} alt={badge.name} className="w-16 h-16 mx-auto" />
                ) : (
                  <svg className="w-16 h-16 mx-auto text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
              </div>

              {/* Badge Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {badge.name}
              </h3>

              {/* Badge Description */}
              <p className="text-sm text-gray-600 mb-4">
                {badge.description || getCriteriaLabel(badge.criteria)}
              </p>

              {/* Criteria */}
              <div className="flex items-center justify-center space-x-2 mb-3">
                <svg
                  className="h-5 w-5 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {getCriteriaLabel(badge.criteria)}
                </span>
              </div>

              {/* Earned Count */}
              <div className="text-xs text-gray-500">
                Obtenida por {badge.earnedCount || 0}{' '}
                {badge.earnedCount === 1 ? 'persona' : 'personas'}
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                {badge.isEarned ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg
                      className="mr-1.5 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Obtenida
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <svg
                      className="mr-1.5 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Bloqueada
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {badges.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No hay insignias disponibles
          </div>
        )}
      </div>
    </div>
  );
}
