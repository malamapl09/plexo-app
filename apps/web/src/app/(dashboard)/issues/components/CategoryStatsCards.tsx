'use client'

type IssueCategory = 'MAINTENANCE' | 'CLEANING' | 'SECURITY' | 'IT_SYSTEMS' | 'PERSONNEL' | 'INVENTORY'

interface CategoryStats {
  category: IssueCategory
  categoryLabel: string
  total: number
  open: number
  resolved: number
  escalated: number
}

interface CategoryStatsCardsProps {
  categories: CategoryStats[]
  isLoading: boolean
}

const CATEGORY_CONFIG: Record<
  IssueCategory,
  { icon: React.ReactNode; bgColor: string; iconColor: string }
> = {
  MAINTENANCE: {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  CLEANING: {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    ),
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  SECURITY: {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  IT_SYSTEMS: {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  PERSONNEL: {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  INVENTORY: {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
}

export function CategoryStatsCards({ categories, isLoading }: CategoryStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((cat) => {
        const config = CATEGORY_CONFIG[cat.category]
        const resolutionRate = cat.total > 0 ? (cat.resolved / cat.total) * 100 : 0

        return (
          <div
            key={cat.category}
            className={`${config.bgColor} rounded-lg shadow p-4 transition-transform hover:scale-105`}
          >
            <div className={`inline-flex p-2 rounded-lg ${config.iconColor} bg-white`}>
              {config.icon}
            </div>
            <h3 className="mt-3 text-sm font-medium text-gray-900">{cat.categoryLabel}</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-900">{cat.total}</span>
              {cat.escalated > 0 && (
                <span className="ml-2 text-xs font-medium text-red-600">
                  {cat.escalated} escaladas
                </span>
              )}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{cat.open} abiertas</span>
                <span>{resolutionRate.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${resolutionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
