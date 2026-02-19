'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
  storeId: string | null
  departmentId: string | null
  isActive: boolean
  createdAt: string
  store: { id: string; name: string } | null
  department: { id: string; name: string } | null
  issueCategories: string[]
}

interface Invitation {
  id: string
  email: string
  role: string
  storeId: string | null
  departmentId: string | null
  expiresAt: string
  createdAt: string
}

const issueCategoryLabels: Record<string, string> = {
  MAINTENANCE: 'Mantenimiento',
  CLEANING: 'Limpieza',
  SECURITY: 'Seguridad',
  IT_SYSTEMS: 'Sistemas IT',
  PERSONNEL: 'Personal',
  INVENTORY: 'Inventario',
}

const issueCategoryColors: Record<string, string> = {
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  CLEANING: 'bg-cyan-100 text-cyan-800',
  SECURITY: 'bg-red-100 text-red-800',
  IT_SYSTEMS: 'bg-blue-100 text-blue-800',
  PERSONNEL: 'bg-pink-100 text-pink-800',
  INVENTORY: 'bg-amber-100 text-amber-800',
}

interface Store {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

interface Role {
  id: string
  key: string
  label: string
  color: string
  level: number
  sortOrder: number
}

const colorToTailwind: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-gray-100 text-gray-800',
  red: 'bg-red-100 text-red-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  pink: 'bg-pink-100 text-pink-800',
  cyan: 'bg-cyan-100 text-cyan-800',
  teal: 'bg-teal-100 text-teal-800',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  // Roles from API
  const [roles, setRoles] = useState<Role[]>([])

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    storeId: '',
    departmentId: '',
    issueCategories: [] as string[],
  })

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    storeId: '',
    departmentId: '',
    issueCategories: [] as string[],
  })

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: '',
    storeId: '',
    departmentId: '',
  })
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Pending invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)
  const [isRevokingId, setIsRevokingId] = useState<string | null>(null)

  // Derived maps from roles
  const roleLabels: Record<string, string> = {}
  const roleColors: Record<string, string> = {}
  for (const r of roles) {
    roleLabels[r.key] = r.label
    roleColors[r.key] = colorToTailwind[r.color] || 'bg-gray-100 text-gray-800'
  }

  useEffect(() => {
    loadUsers()
    loadStoresAndDepartments()
    loadRoles()
    loadInvitations()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error cargando usuarios')
      }

      const data = await response.json()
      setUsers(Array.isArray(data) ? data : (data.data || data.users || []))
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Error al cargar usuarios. Por favor intente de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStoresAndDepartments = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const [storesRes, deptsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/stores/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (storesRes.ok) {
        const storesData = await storesRes.json()
        setStores(Array.isArray(storesData) ? storesData : (storesData.data || []))
      }

      if (deptsRes.ok) {
        const deptsData = await deptsRes.json()
        setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData.data || []))
      }
    } catch (err) {
      console.error('Error loading stores/departments:', err)
    }
  }

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/roles/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const rolesList = Array.isArray(data) ? data : []
        setRoles(rolesList)
        // Set default role for create form if not already set
        if (rolesList.length > 0 && !createForm.role) {
          setCreateForm((prev) => ({ ...prev, role: rolesList[0].key }))
        }
      }
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }

  const loadInvitations = async () => {
    setIsLoadingInvitations(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setInvitations(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error loading invitations:', err)
    } finally {
      setIsLoadingInvitations(false)
    }
  }

  const handleInviteClose = () => {
    setIsInviteModalOpen(false)
    setInviteForm({ email: '', role: roles[0]?.key || '', storeId: '', departmentId: '' })
    setInviteSuccess(null)
    setInviteError(null)
  }

  const handleSendInvite = async () => {
    setInviteError(null)
    setInviteSuccess(null)

    if (!inviteForm.email) {
      setInviteError('El correo es requerido')
      return
    }
    if (!inviteForm.role) {
      setInviteError('El rol es requerido')
      return
    }

    setIsInviting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          storeId: inviteForm.storeId || null,
          departmentId: inviteForm.departmentId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error enviando invitacion')
      }

      setInviteSuccess(`Invitacion enviada a ${inviteForm.email}`)
      await loadInvitations()
      setInviteForm({ email: '', role: roles[0]?.key || '', storeId: '', departmentId: '' })
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error al enviar invitacion')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Revocar esta invitacion?')) return

    setIsRevokingId(invitationId)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Error revocando invitacion')
      }

      await loadInvitations()
    } catch (err) {
      console.error('Error revoking invitation:', err)
      alert('Error al revocar invitacion')
    } finally {
      setIsRevokingId(null)
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId || '',
      departmentId: user.departmentId || '',
      issueCategories: user.issueCategories || [],
    })
    setIsEditModalOpen(true)
  }

  const handleEditClose = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
    setEditForm({ name: '', email: '', role: '', storeId: '', departmentId: '', issueCategories: [] })
  }

  const handleEditSave = async () => {
    if (!editingUser) return

    setIsSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          storeId: editForm.storeId || null,
          departmentId: editForm.departmentId || null,
          issueCategories: editForm.issueCategories,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error actualizando usuario')
      }

      await loadUsers()
      handleEditClose()
    } catch (err) {
      console.error('Error updating user:', err)
      alert(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Error actualizando estado')
      }

      await loadUsers()
    } catch (err) {
      console.error('Error toggling user status:', err)
      alert('Error al cambiar estado del usuario')
    }
  }

  const handleCreateClose = () => {
    setIsCreateModalOpen(false)
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: roles[0]?.key || '',
      storeId: '',
      departmentId: '',
      issueCategories: [],
    })
  }

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    if (createForm.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsCreating(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const response = await fetch(`${baseUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          storeId: createForm.storeId || null,
          departmentId: createForm.departmentId || null,
          issueCategories: createForm.issueCategories,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error creando usuario')
      }

      await loadUsers()
      handleCreateClose()
    } catch (err) {
      console.error('Error creating user:', err)
      alert(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.store?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = !roleFilter || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    byRole: users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de usuarios y roles del sistema
          </p>
        </div>
        <div className="mt-4 flex gap-2 md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => {
              setInviteForm({ email: '', role: roles[0]?.key || '', storeId: '', departmentId: '' })
              setInviteSuccess(null)
              setInviteError(null)
              setIsInviteModalOpen(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Invitar Usuario
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Usuarios</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Activos</div>
        </div>
        {Object.entries(stats.byRole).map(([role, count]) => (
          <div key={role} className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500 truncate">{roleLabels[role] || role}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, email o tienda..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Rol
            </label>
            <select
              id="role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
            <button onClick={loadUsers} className="ml-auto text-sm text-red-600 hover:text-red-500">
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery || roleFilter ? 'No se encontraron usuarios' : 'No hay usuarios'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || roleFilter
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando un nuevo usuario'}
            </p>
          </div>
        ) : (
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
                  Tienda / Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categorías
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.store ? (
                      <div>
                        <div className="font-medium text-gray-900">{user.store.name}</div>
                        {user.department && (
                          <div className="text-gray-500">{user.department.name}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {user.issueCategories && user.issueCategories.length > 0 ? (
                        user.issueCategories.map((cat) => (
                          <span
                            key={cat}
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${issueCategoryColors[cat] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {issueCategoryLabels[cat] || cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                    >
                      {user.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!isLoading && filteredUsers.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </div>
      )}

      {/* Pending Invitations Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invitaciones pendientes</h2>
        {isLoadingInvitations ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center text-sm text-gray-500">
            No hay invitaciones pendientes.
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expira
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[inv.role] || 'bg-gray-100 text-gray-800'}`}>
                        {roleLabels[inv.role] || inv.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inv.expiresAt).toLocaleDateString('es-DO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRevokeInvitation(inv.id)}
                        disabled={isRevokingId === inv.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {isRevokingId === inv.id ? 'Revocando...' : 'Revocar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleEditClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Editar Usuario
                </h3>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
                      Rol
                    </label>
                    <select
                      id="edit-role"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {roles.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Store */}
                  <div>
                    <label htmlFor="edit-store" className="block text-sm font-medium text-gray-700">
                      Tienda
                    </label>
                    <select
                      id="edit-store"
                      value={editForm.storeId}
                      onChange={(e) => setEditForm({ ...editForm, storeId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Sin tienda asignada</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700">
                      Departamento
                    </label>
                    <select
                      id="edit-department"
                      value={editForm.departmentId}
                      onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Sin departamento asignado</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Issue Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categorías de Incidencia
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Selecciona las categorías de incidencias que este usuario puede manejar
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(issueCategoryLabels).map(([value, label]) => (
                        <label
                          key={value}
                          className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${
                            editForm.issueCategories.includes(value)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={editForm.issueCategories.includes(value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm({
                                  ...editForm,
                                  issueCategories: [...editForm.issueCategories, value],
                                })
                              } else {
                                setEditForm({
                                  ...editForm,
                                  issueCategories: editForm.issueCategories.filter((c) => c !== value),
                                })
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className={`ml-2 text-sm ${issueCategoryColors[value]?.split(' ')[1] || 'text-gray-700'}`}>
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={isSaving || !editForm.name || !editForm.email}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={handleEditClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleInviteClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-1">
                  Invitar Usuario
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Se enviara un correo con el enlace de registro.
                </p>

                {inviteSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
                    {inviteSuccess}
                  </div>
                )}

                {inviteError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                    {inviteError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                      Correo electronico *
                    </label>
                    <input
                      type="email"
                      id="invite-email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
                      Rol *
                    </label>
                    <select
                      id="invite-role"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Seleccionar rol...</option>
                      {roles.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Store (optional) */}
                  <div>
                    <label htmlFor="invite-store" className="block text-sm font-medium text-gray-700">
                      Tienda <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <select
                      id="invite-store"
                      value={inviteForm.storeId}
                      onChange={(e) => setInviteForm({ ...inviteForm, storeId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Sin tienda asignada</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department (optional) */}
                  <div>
                    <label htmlFor="invite-department" className="block text-sm font-medium text-gray-700">
                      Departamento <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <select
                      id="invite-department"
                      value={inviteForm.departmentId}
                      onChange={(e) => setInviteForm({ ...inviteForm, departmentId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Sin departamento asignado</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={isInviting || !inviteForm.email || !inviteForm.role}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInviting ? 'Enviando...' : 'Enviar Invitacion'}
                </button>
                <button
                  type="button"
                  onClick={handleInviteClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCreateClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Nuevo Usuario
                </h3>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="create-name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Nombre completo"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="create-email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="create-email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="create-password" className="block text-sm font-medium text-gray-700">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      id="create-password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label htmlFor="create-role" className="block text-sm font-medium text-gray-700">
                      Rol
                    </label>
                    <select
                      id="create-role"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {roles.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Store */}
                  <div>
                    <label htmlFor="create-store" className="block text-sm font-medium text-gray-700">
                      Tienda
                    </label>
                    <select
                      id="create-store"
                      value={createForm.storeId}
                      onChange={(e) => setCreateForm({ ...createForm, storeId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Sin tienda asignada</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="create-department" className="block text-sm font-medium text-gray-700">
                      Departamento
                    </label>
                    <select
                      id="create-department"
                      value={createForm.departmentId}
                      onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Sin departamento asignado</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Issue Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categorías de Incidencia
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Selecciona las categorías de incidencias que este usuario puede manejar
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(issueCategoryLabels).map(([value, label]) => (
                        <label
                          key={value}
                          className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${
                            createForm.issueCategories.includes(value)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={createForm.issueCategories.includes(value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm({
                                  ...createForm,
                                  issueCategories: [...createForm.issueCategories, value],
                                })
                              } else {
                                setCreateForm({
                                  ...createForm,
                                  issueCategories: createForm.issueCategories.filter((c) => c !== value),
                                })
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className={`ml-2 text-sm ${issueCategoryColors[value]?.split(' ')[1] || 'text-gray-700'}`}>
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={isCreating || !createForm.name || !createForm.email || !createForm.password}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={handleCreateClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
