'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWebSocketAutoInvalidate } from '@/hooks/useWebSocket'
import { socketService } from '@/lib/socket'

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

const navigation = [
  { name: 'Tareas', href: '/tasks', icon: ClipboardIcon, module: 'tasks' },
  { name: 'Plantillas', href: '/tasks/templates', icon: TemplateIcon, indent: true, module: 'tasks' },
  { name: 'Checklists', href: '/checklists', icon: ChecklistNavIcon, module: 'checklists' },
  { name: 'Auditorias', href: '/store-audits', icon: AuditNavIcon, module: 'audits' },
  { name: 'Acciones Correctivas', href: '/corrective-actions', icon: CAPANavIcon, indent: true, module: 'corrective_actions' },
  { name: 'Planogramas', href: '/planograms', icon: PlanogramNavIcon, module: 'planograms' },
  { name: 'Campañas', href: '/campaigns', icon: CampaignNavIcon, module: 'campaigns' },
  { name: 'Entrenamiento', href: '/training', icon: TrainingNavIcon, module: 'training' },
  { name: 'Recepciones', href: '/receiving', icon: TruckIcon, module: 'receiving' },
  { name: 'Incidencias', href: '/issues', icon: AlertIcon, module: 'issues' },
  { name: 'Verificaciones', href: '/verification', icon: VerificationIcon, module: 'verification' },
  { name: 'Comunicaciones', href: '/communications', icon: MegaphoneIcon, module: 'communications' },
  { name: 'Gamificacion', href: '/gamification', icon: TrophyNavIcon, module: 'gamification' },
  { name: 'Reportes', href: '/reports', icon: ChartIcon, module: 'reports' },
  { name: 'Tiendas', href: '/stores', icon: StoreIcon, module: 'stores' },
  { name: 'Usuarios', href: '/users', icon: UsersIcon, module: 'users' },
  { name: 'Permisos', href: '/settings/permissions', icon: SettingsIcon, module: '_admin' },
  { name: 'Roles', href: '/settings/roles', icon: RolesNavIcon, module: '_admin' },
]

// Map pathname prefixes to module keys for route protection
const routeModuleMap: Record<string, string> = {
  '/tasks': 'tasks',
  '/checklists': 'checklists',
  '/store-audits': 'audits',
  '/corrective-actions': 'corrective_actions',
  '/planograms': 'planograms',
  '/campaigns': 'campaigns',
  '/training': 'training',
  '/receiving': 'receiving',
  '/issues': 'issues',
  '/verification': 'verification',
  '/communications': 'communications',
  '/gamification': 'gamification',
  '/reports': 'reports',
  '/stores': 'stores',
  '/users': 'users',
  '/settings/permissions': '_admin',
  '/settings/roles': '_admin',
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m0-5H8m4-7V3m0 4v6" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  )
}

function ChecklistNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function AuditNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function VerificationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CAPANavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  )
}

function PlanogramNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function CampaignNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function RolesNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function TrainingNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function TrophyNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14M5 3v4a7 7 0 007 7m-7-7H3m16 0h-2m2 0v4a7 7 0 01-7 7m0 0v3m0-3h-4m4 0h4m-8 3h8" />
    </svg>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  // Initialize WebSocket with auto-invalidate
  useWebSocketAutoInvalidate(token)

  // Check WebSocket connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setWsConnected(socketService.isConnected())
    }, 2000)
    return () => clearInterval(checkConnection)
  }, [])

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')
    if (!storedUser || !accessToken) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(storedUser))
    setToken(accessToken)
  }, [router])

  // Route protection — redirect if user lacks module access
  useEffect(() => {
    if (!user) return
    const moduleAccess: string[] = user.moduleAccess || []
    const isSuperAdmin = user.isSuperAdmin === true

    // Super admins can access everything
    if (isSuperAdmin) return

    // Find which module this route belongs to
    const matchedPrefix = Object.keys(routeModuleMap).find(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    )
    if (!matchedPrefix) return

    const requiredModule = routeModuleMap[matchedPrefix]

    // _admin routes require superAdmin
    if (requiredModule === '_admin') {
      router.push('/tasks')
      return
    }

    if (!moduleAccess.includes(requiredModule)) {
      router.push('/tasks')
    }
  }, [pathname, user, router])

  const handleLogout = () => {
    socketService.disconnect()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Filter navigation by module access
  const moduleAccess: string[] = user?.moduleAccess || []
  const isSuperAdmin = user?.isSuperAdmin === true
  const filteredNav = navigation.filter((item) =>
    item.module === '_admin' ? isSuperAdmin : (isSuperAdmin || moduleAccess.includes(item.module))
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-primary-900 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Image
              src="/logo-white.svg"
              alt={process.env.NEXT_PUBLIC_APP_NAME || "Plexo"}
              width={160}
              height={44}
              priority
            />
            <span
              className={`ml-2 inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                wsConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
              title={wsConnected ? 'Conectado en tiempo real' : 'Desconectado'}
            />
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/tasks' && pathname.startsWith(item.href))
                const isIndented = 'indent' in item && item.indent
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center py-2 text-sm font-medium rounded-md ${
                      isIndented ? 'pl-9 pr-2' : 'px-2'
                    } ${
                      isActive
                        ? 'bg-primary-800 text-white'
                        : 'text-primary-100 hover:bg-primary-800'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 ${isIndented ? 'h-5 w-5' : 'h-6 w-6'} ${
                        isActive ? 'text-white' : 'text-primary-300'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-medium text-primary-200 hover:text-white"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
