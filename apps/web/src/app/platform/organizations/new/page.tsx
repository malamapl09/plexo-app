'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewOrganizationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    domain: '',
    primaryColor: '#4F46E5',
    timezone: 'America/Santo_Domingo',
    locale: 'es',
    plan: 'free',
    adminEmail: '',
    adminName: '',
  })

  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setForm((prev) => ({ ...prev, name: value, slug }))
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

      const payload: Record<string, string> = {
        name: form.name,
        slug: form.slug,
        primaryColor: form.primaryColor,
        timezone: form.timezone,
        locale: form.locale,
        plan: form.plan,
        adminEmail: form.adminEmail,
        adminName: form.adminName,
      }
      if (form.domain.trim()) payload.domain = form.domain.trim()

      const res = await fetch(`${baseUrl}/api/v1/platform/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.message || 'Error al crear la organizacion')
        return
      }

      setSuccess(
        `Organizacion "${data.name}" creada. Se envio un correo con credenciales temporales a ${form.adminEmail}.`
      )

      setTimeout(() => {
        router.push('/platform/organizations')
      }, 2500)
    } catch (err) {
      setError('Error de conexion. Verifica que la API este activa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/platform/organizations"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a organizaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Organizacion</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crea una nueva organizacion con su primer usuario administrador. Se enviara un correo con contrasena temporal.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Informacion de la Organizacion</h2>

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
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corp"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="acme-corp"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
              />
              <p className="mt-1 text-xs text-gray-400">Identificador unico, solo minusculas y guiones</p>
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

        {/* Admin user */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Usuario Administrador</h2>
          <p className="text-sm text-gray-500 mb-4">
            Se creara un usuario con rol Operations Manager y se enviara la contrasena temporal por correo.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Admin name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={form.adminName}
                onChange={(e) => handleChange('adminName', e.target.value)}
                placeholder="John Admin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Admin email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Correo electronico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.adminEmail}
                onChange={(e) => handleChange('adminEmail', e.target.value)}
                placeholder="admin@acme.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/platform/organizations"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando...
              </>
            ) : (
              'Crear Organizacion'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
