'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const TIMEZONES = [
  'America/Santo_Domingo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Sao_Paulo',
  'Europe/Madrid',
  'Europe/London',
  'UTC',
]

const PLANS = ['free', 'starter', 'pro', 'enterprise']

interface OrgDetail {
  id: string
  name: string
  slug: string
  domain?: string
  logoUrl?: string
  primaryColor?: string
  timezone: string
  locale: string
  isActive: boolean
  plan: string
  settings?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  _count: {
    users: number
    stores: number
  }
}

function CountBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
      </div>
    </div>
  )
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '',
    domain: '',
    logoUrl: '',
    primaryColor: '#4F46E5',
    timezone: 'America/Santo_Domingo',
    locale: 'es',
    isActive: true,
    plan: 'free',
    settings: '{}',
  })

  useEffect(() => {
    loadOrg()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadOrg = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const res = await fetch(`${baseUrl}/api/v1/platform/organizations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 404) {
          setLoadError('Organizacion no encontrada.')
        } else {
          setLoadError(`Error al cargar la organizacion (${res.status}).`)
        }
        return
      }

      const data: OrgDetail = await res.json()
      setOrg(data)
      setForm({
        name: data.name,
        domain: data.domain || '',
        logoUrl: data.logoUrl || '',
        primaryColor: data.primaryColor || '#4F46E5',
        timezone: data.timezone,
        locale: data.locale,
        isActive: data.isActive,
        plan: data.plan,
        settings: data.settings ? JSON.stringify(data.settings, null, 2) : '{}',
      })
    } catch (err) {
      setLoadError('Error de conexion. Verifica que la API este activa.')
      console.error('Error loading organization:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setSaveError(null)
    setSaveSuccess(false)
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    // Validate settings JSON
    let parsedSettings: Record<string, unknown> = {}
    try {
      parsedSettings = JSON.parse(form.settings)
    } catch {
      setSaveError('El campo "Settings" no es un JSON valido.')
      setIsSaving(false)
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const payload: Record<string, unknown> = {
        name: form.name,
        primaryColor: form.primaryColor,
        timezone: form.timezone,
        locale: form.locale,
        isActive: form.isActive,
        plan: form.plan,
        settings: parsedSettings,
      }
      if (form.domain.trim()) payload.domain = form.domain.trim()
      if (form.logoUrl.trim()) payload.logoUrl = form.logoUrl.trim()

      const res = await fetch(`${baseUrl}/api/v1/platform/organizations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setSaveError(data?.message || `Error al actualizar (${res.status}).`)
        return
      }

      setOrg(data)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError('Error de conexion. Verifica que la API este activa.')
      console.error('Error saving organization:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const planBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'platform': return 'bg-gray-900 text-white'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-4" />
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
        <div className="bg-white shadow rounded-lg p-6 animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div>
        <Link
          href="/platform/organizations"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a organizaciones
        </Link>
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!org) return null

  return (
    <div>
      {/* Back link */}
      <Link
        href="/platform/organizations"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a organizaciones
      </Link>

      {/* Header */}
      <div className="md:flex md:items-start md:justify-between mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg font-bold shadow"
            style={{ backgroundColor: org.primaryColor || '#4F46E5' }}
          >
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{org.name}</h1>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${planBadgeColor(org.plan)}`}>
                {org.plan}
              </span>
              {org.isActive ? (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Activa
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Inactiva
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{org.slug}</code>
              {org.domain && (
                <span className="text-xs text-gray-500">{org.domain}</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 md:mt-0 md:ml-4 flex-shrink-0">
          <Link
            href={`/platform/organizations/${id}/activity`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Ver Actividad
          </Link>
          <Link
            href={`/platform/organizations/${id}/audit-logs`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ver Audit Logs
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <CountBadge label="Usuarios" value={org._count.users} />
        <CountBadge label="Tiendas" value={org._count.stores} />
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Creada</dt>
            <dd className="mt-1 text-sm font-medium text-gray-700">{formatDate(org.createdAt)}</dd>
            <dd className="mt-1 text-xs text-gray-400">Ultima actualizacion: {formatDate(org.updatedAt)}</dd>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {saveError && (
        <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{saveError}</p>
          </div>
        </div>
      )}
      {saveSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-green-700">Organizacion actualizada correctamente.</p>
          </div>
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Informacion General</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Slug (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug
              </label>
              <input
                type="text"
                readOnly
                value={org.slug}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm sm:text-sm font-mono text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">El slug no se puede modificar</p>
            </div>

            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dominio
              </label>
              <input
                type="text"
                value={form.domain}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="acme.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Logo URL */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                URL del Logo
              </label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Color principal
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="h-9 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  placeholder="#4F46E5"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                />
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plan
              </label>
              <select
                value={form.plan}
                onChange={(e) => handleChange('plan', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Zona horaria
              </label>
              <select
                value={form.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {/* Locale */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Idioma
              </label>
              <select
                value={form.locale}
                onChange={(e) => handleChange('locale', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
                <option value="pt">Portugues</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Estado</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Organizacion activa</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Las organizaciones inactivas no pueden iniciar sesion ni acceder a la plataforma
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => handleChange('isActive', !form.isActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                form.isActive ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Settings JSON */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Settings (JSON)</h2>
          <p className="text-xs text-gray-500 mb-3">
            Configuracion avanzada en formato JSON. Modificar con cuidado.
          </p>
          <textarea
            value={form.settings}
            onChange={(e) => handleChange('settings', e.target.value)}
            rows={8}
            spellCheck={false}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link
            href="/platform/organizations"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
