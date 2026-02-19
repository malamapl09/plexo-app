'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Role {
  id: string
  key: string
  label: string
  description: string | null
  color: string
  level: number
  isActive: boolean
  sortOrder: number
  userCount: number
}

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Azul', classes: 'bg-blue-100 text-blue-800' },
  { value: 'purple', label: 'Morado', classes: 'bg-purple-100 text-purple-800' },
  { value: 'green', label: 'Verde', classes: 'bg-green-100 text-green-800' },
  { value: 'orange', label: 'Naranja', classes: 'bg-orange-100 text-orange-800' },
  { value: 'gray', label: 'Gris', classes: 'bg-gray-100 text-gray-800' },
  { value: 'red', label: 'Rojo', classes: 'bg-red-100 text-red-800' },
  { value: 'indigo', label: 'Indigo', classes: 'bg-indigo-100 text-indigo-800' },
  { value: 'yellow', label: 'Amarillo', classes: 'bg-yellow-100 text-yellow-800' },
  { value: 'pink', label: 'Rosa', classes: 'bg-pink-100 text-pink-800' },
  { value: 'cyan', label: 'Cian', classes: 'bg-cyan-100 text-cyan-800' },
  { value: 'teal', label: 'Teal', classes: 'bg-teal-100 text-teal-800' },
]

const colorMap: Record<string, string> = {}
for (const c of COLOR_OPTIONS) {
  colorMap[c.value] = c.classes
}

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    key: '',
    label: '',
    description: '',
    color: 'gray',
    level: 10,
    sortOrder: 0,
  })

  // Edit modal
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    label: '',
    description: '',
    color: 'gray',
    level: 10,
    sortOrder: 0,
    isActive: true,
  })

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
    loadRoles()
  }, [user])

  async function loadRoles() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${baseUrl}/api/v1/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load roles', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!createForm.key || !createForm.label) return

    setCreating(true)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${baseUrl}/api/v1/roles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: createForm.key.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
          label: createForm.label,
          description: createForm.description || undefined,
          color: createForm.color,
          level: createForm.level,
          sortOrder: createForm.sortOrder,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Error creando rol')
      }

      await loadRoles()
      setIsCreateOpen(false)
      setCreateForm({ key: '', label: '', description: '', color: 'gray', level: 10, sortOrder: 0 })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear rol')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(role: Role) {
    setEditingRole(role)
    setEditForm({
      label: role.label,
      description: role.description || '',
      color: role.color,
      level: role.level,
      sortOrder: role.sortOrder,
      isActive: role.isActive,
    })
    setIsEditOpen(true)
  }

  async function handleEditSave() {
    if (!editingRole) return

    setSaving(true)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${baseUrl}/api/v1/roles/${editingRole.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: editForm.label,
          description: editForm.description || undefined,
          color: editForm.color,
          level: editForm.level,
          sortOrder: editForm.sortOrder,
          isActive: editForm.isActive,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Error actualizando rol')
      }

      await loadRoles()
      setIsEditOpen(false)
      setEditingRole(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar rol')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(role: Role) {
    if (!confirm(`Desactivar el rol "${role.label}"? Los usuarios asignados no podran iniciar sesion con este rol.`)) return

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${baseUrl}/api/v1/roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Error desactivando rol')
      }

      await loadRoles()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al desactivar rol')
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
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los roles del sistema. Cada rol tiene un nivel de jerarquia para verificaciones.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            + Nuevo Rol
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clave</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etiqueta</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nivel</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Color</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Orden</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Usuarios</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{role.key}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{role.label}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">{role.level}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorMap[role.color] || 'bg-gray-100 text-gray-800'}`}>
                    {role.color}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">{role.sortOrder}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">{role.userCount}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {role.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                  <button onClick={() => openEdit(role)} className="text-blue-600 hover:text-blue-900">
                    Editar
                  </button>
                  {role.isActive && (
                    <button onClick={() => handleDeactivate(role)} className="text-red-600 hover:text-red-900">
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsCreateOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl sm:max-w-lg sm:w-full">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Rol</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Clave (UPPER_SNAKE_CASE) *</label>
                    <input
                      type="text"
                      value={createForm.key}
                      onChange={(e) => setCreateForm({ ...createForm, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                      placeholder="NUEVO_ROL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etiqueta *</label>
                    <input
                      type="text"
                      value={createForm.label}
                      onChange={(e) => setCreateForm({ ...createForm, label: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Nombre visible del rol"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripcion</label>
                    <input
                      type="text"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nivel *</label>
                      <input
                        type="number"
                        value={createForm.level}
                        onChange={(e) => setCreateForm({ ...createForm, level: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        min={1}
                      />
                      <p className="text-xs text-gray-500 mt-1">Mayor nivel = mas autoridad</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Orden</label>
                      <input
                        type="number"
                        value={createForm.sortOrder}
                        onChange={(e) => setCreateForm({ ...createForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Color</label>
                      <select
                        value={createForm.color}
                        onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {COLOR_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createForm.key || !createForm.label}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear Rol'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editingRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsEditOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl sm:max-w-lg sm:w-full">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Editar Rol: <span className="font-mono">{editingRole.key}</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etiqueta *</label>
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripcion</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nivel</label>
                      <input
                        type="number"
                        value={editForm.level}
                        onChange={(e) => setEditForm({ ...editForm, level: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Orden</label>
                      <input
                        type="number"
                        value={editForm.sortOrder}
                        onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Color</label>
                      <select
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {COLOR_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-active"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-active" className="ml-2 text-sm text-gray-700">
                      Rol activo
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={saving || !editForm.label}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
