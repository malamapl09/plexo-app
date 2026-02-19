'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const MODULES = [
  { key: 'tasks', label: 'Tareas' },
  { key: 'receiving', label: 'Recepciones' },
  { key: 'issues', label: 'Incidencias' },
  { key: 'verification', label: 'Verificaciones' },
  { key: 'checklists', label: 'Checklists' },
  { key: 'audits', label: 'Auditorias' },
  { key: 'corrective_actions', label: 'Acciones Correctivas' },
  { key: 'planograms', label: 'Planogramas' },
  { key: 'communications', label: 'Comunicaciones' },
  { key: 'gamification', label: 'Gamificacion' },
  { key: 'reports', label: 'Reportes' },
  { key: 'stores', label: 'Tiendas' },
  { key: 'users', label: 'Usuarios' },
]

interface RoleItem {
  key: string
  label: string
  level: number
}

type Grid = Record<string, Record<string, boolean>>

export default function PermissionsPage() {
  const router = useRouter()
  const [grid, setGrid] = useState<Grid>({})
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      if (!parsed.isSuperAdmin) {
        router.push('/tasks')
        return
      }
      setUser(parsed)
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    loadGrid()
    loadRoles()
  }, [user])

  async function loadGrid() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${baseUrl}/api/v1/module-access/grid`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGrid(data)
      }
    } catch (err) {
      console.error('Failed to load permissions grid', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadRoles() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${baseUrl}/api/v1/roles/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load roles', err)
    }
  }

  async function handleToggle(role: string, mod: string) {
    const current = grid[role]?.[mod] ?? false
    const newValue = !current

    // Optimistic update
    setGrid((prev) => ({
      ...prev,
      [role]: { ...prev[role], [mod]: newValue },
    }))

    setSaving(role)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${baseUrl}/api/v1/module-access/${role}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modules: { [mod]: newValue } }),
      })
      if (!res.ok) {
        // Revert on failure
        setGrid((prev) => ({
          ...prev,
          [role]: { ...prev[role], [mod]: current },
        }))
      }
    } catch {
      // Revert on error
      setGrid((prev) => ({
        ...prev,
        [role]: { ...prev[role], [mod]: current },
      }))
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Permisos de Modulos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Controla que modulos puede ver cada rol. Los cambios se aplican inmediatamente.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modulo
              </th>
              {roles.map((role) => (
                <th
                  key={role.key}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {role.label}
                  {role.level >= 100 && (
                    <span className="block text-[10px] text-gray-400 normal-case">
                      (siempre activo)
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {MODULES.map((mod) => (
              <tr key={mod.key} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {mod.label}
                </td>
                {roles.map((role) => {
                  const isTopLevel = role.level >= 100
                  const checked = isTopLevel ? true : (grid[role.key]?.[mod.key] ?? false)
                  return (
                    <td key={role.key} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isTopLevel}
                        onChange={() => handleToggle(role.key, mod.key)}
                        className={`h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                          isTopLevel ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {saving && (
        <div className="mt-3 text-sm text-gray-500">
          Guardando cambios para {roles.find((r) => r.key === saving)?.label}...
        </div>
      )}
    </div>
  )
}
