'use client';

import { useEffect, useState } from 'react';

type TabType = 'individual' | 'store' | 'department';

interface IndividualEntry {
  userId: string;
  userName: string;
  role: string;
  storeName: string | null;
  departmentName: string | null;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  rank: number;
}

interface StoreEntry {
  storeId: string;
  storeName: string;
  storeCode: string;
  tier: string | null;
  regionName: string | null;
  weeklyPoints: number;
  monthlyPoints: number;
  totalPoints: number;
  perCapitaScore: number;
  complianceRate: number | null;
  employeeCount: number;
  rank: number;
}

interface DepartmentEntry {
  departmentId: string;
  departmentName: string;
  storeId: string;
  storeName: string;
  weeklyPoints: number;
  monthlyPoints: number;
  totalPoints: number;
  perCapitaScore: number;
  employeeCount: number;
  rank: number;
}

interface RoleOption {
  id: string;
  key: string;
  label: string;
}

export default function GamificationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Filter options
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, period, roleFilter, tierFilter, departmentFilter]);

  const fetchFilterOptions = async () => {
    try {
      const [rolesRes, deptsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/roles/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/stores/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(Array.isArray(data) ? data : data.data || []);
      }
      if (deptsRes.ok) {
        const data = await deptsRes.json();
        setDepartments(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('period', period);

      if (activeTab === 'individual' && roleFilter) {
        params.append('role', roleFilter);
      }
      if (activeTab === 'store' && tierFilter) {
        params.append('tier', tierFilter);
      }
      if (activeTab === 'department' && departmentFilter) {
        params.append('departmentId', departmentFilter);
      }

      const response = await fetch(
        `${baseUrl}/api/v1/gamification/leaderboard/${activeTab}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        setError('Error al cargar los datos');
        return;
      }
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (p: string) => {
    const labels: Record<string, string> = {
      weekly: 'Semanal',
      monthly: 'Mensual',
      allTime: 'Historico',
    };
    return labels[p] || p;
  };

  const getTabLabel = (t: TabType) => {
    const labels: Record<TabType, string> = {
      individual: 'Individual',
      store: 'Tiendas',
      department: 'Departamentos',
    };
    return labels[t];
  };

  const getTierBadge = (tier: string | null) => {
    if (!tier) return null;
    const config: Record<string, { label: string; color: string }> = {
      SMALL: { label: 'Pequena', color: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Mediana', color: 'bg-blue-100 text-blue-800' },
      LARGE: { label: 'Grande', color: 'bg-purple-100 text-purple-800' },
    };
    const c = config[tier];
    if (!c) return null;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>
        {c.label}
      </span>
    );
  };

  const getPointsForPeriod = (entry: any) => {
    if (period === 'weekly') return entry.weeklyPoints;
    if (period === 'monthly') return entry.monthlyPoints;
    return entry.totalPoints;
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-white text-gray-900 border-gray-200';
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '\u{1F947}';
    if (rank === 2) return '\u{1F948}';
    if (rank === 3) return '\u{1F949}';
    return null;
  };

  const getPodiumName = (entry: any) => {
    if (activeTab === 'individual') return entry.userName;
    if (activeTab === 'store') return entry.storeName;
    return `${entry.departmentName} - ${entry.storeName}`;
  };

  const getPodiumSubtext = (entry: any) => {
    if (activeTab === 'individual') return entry.storeName || '';
    if (activeTab === 'store') return entry.regionName || '';
    return '';
  };

  const getPodiumScore = (entry: any) => {
    if (activeTab === 'individual') return getPointsForPeriod(entry);
    return Math.round(entry.perCapitaScore * 10) / 10;
  };

  const getPodiumUnit = () => {
    if (activeTab === 'individual') return 'puntos';
    return 'per capita';
  };

  const topThree = entries.slice(0, 3);
  const restOfEntries = entries.slice(3);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Tabla de Clasificacion</h1>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['individual', 'store', 'department'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setRoleFilter('');
                  setTierFilter('');
                  setDepartmentFilter('');
                }}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Period Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
              <div className="flex space-x-2">
                {(['weekly', 'monthly', 'allTime'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 text-sm font-medium rounded ${
                      period === p
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getPeriodLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab-specific filters */}
            {activeTab === 'individual' && (
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Todos los Roles</option>
                  {roles.map((r) => (
                    <option key={r.key || r.id} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'store' && (
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tamano</label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Todos los Tamanos</option>
                  <option value="SMALL">Pequenas (1-15)</option>
                  <option value="MEDIUM">Medianas (16-40)</option>
                  <option value="LARGE">Grandes (41+)</option>
                </select>
              </div>
            )}

            {activeTab === 'department' && (
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Todos</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-center items-end space-x-4 mb-8">
                {/* Second Place */}
                {topThree[1] && (
                  <div className={`border-2 rounded-lg p-6 w-64 ${getMedalColor(2)}`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{getMedalIcon(2)}</div>
                      <div className="text-2xl font-bold mb-1">2o</div>
                      <div className="font-semibold text-lg">{getPodiumName(topThree[1])}</div>
                      <div className="text-sm mt-1">{getPodiumSubtext(topThree[1])}</div>
                      <div className="text-2xl font-bold mt-3">{getPodiumScore(topThree[1])}</div>
                      <div className="text-sm">{getPodiumUnit()}</div>
                    </div>
                  </div>
                )}

                {/* First Place */}
                {topThree[0] && (
                  <div className={`border-2 rounded-lg p-6 w-64 transform scale-110 ${getMedalColor(1)}`}>
                    <div className="text-center">
                      <div className="text-5xl mb-2">{getMedalIcon(1)}</div>
                      <div className="text-3xl font-bold mb-1">1o</div>
                      <div className="font-semibold text-xl">{getPodiumName(topThree[0])}</div>
                      <div className="text-sm mt-1">{getPodiumSubtext(topThree[0])}</div>
                      <div className="text-3xl font-bold mt-3">{getPodiumScore(topThree[0])}</div>
                      <div className="text-sm">{getPodiumUnit()}</div>
                    </div>
                  </div>
                )}

                {/* Third Place */}
                {topThree[2] && (
                  <div className={`border-2 rounded-lg p-6 w-64 ${getMedalColor(3)}`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{getMedalIcon(3)}</div>
                      <div className="text-2xl font-bold mb-1">3o</div>
                      <div className="font-semibold text-lg">{getPodiumName(topThree[2])}</div>
                      <div className="text-sm mt-1">{getPodiumSubtext(topThree[2])}</div>
                      <div className="text-2xl font-bold mt-3">{getPodiumScore(topThree[2])}</div>
                      <div className="text-sm">{getPodiumUnit()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === 'individual' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posicion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restOfEntries.map((entry: IndividualEntry) => (
                      <tr key={entry.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.rank}o</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.userName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.storeName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.departmentName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">{getPointsForPeriod(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'store' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posicion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamano</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Capita</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumplimiento %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restOfEntries.map((entry: StoreEntry) => (
                      <tr key={entry.storeId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.rank}o</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{entry.storeName}</div>
                          <div className="text-xs text-gray-500">{entry.regionName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getTierBadge(entry.tier)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                          {Math.round(entry.perCapitaScore * 10) / 10}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.complianceRate != null ? (
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    entry.complianceRate >= 80 ? 'bg-green-500' :
                                    entry.complianceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(entry.complianceRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-700">{entry.complianceRate}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.employeeCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getPointsForPeriod(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'department' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posicion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Capita</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restOfEntries.map((entry: DepartmentEntry) => (
                      <tr key={`${entry.storeId}-${entry.departmentId}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.rank}o</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.departmentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.storeName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                          {Math.round(entry.perCapitaScore * 10) / 10}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.employeeCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getPointsForPeriod(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {entries.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-gray-500">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Navigation to Badges */}
      <div className="mt-6 text-center">
        <a
          href="/gamification/badges"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Ver Insignias
        </a>
      </div>
    </div>
  );
}
