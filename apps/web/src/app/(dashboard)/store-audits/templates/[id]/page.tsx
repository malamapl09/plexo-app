'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function AuditTemplateDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [template, setTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('accessToken')
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const res = await fetch(`${baseUrl}/api/v1/store-audits/templates/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setTemplate(await res.json())
      } catch (err) { console.error(err) }
      finally { setIsLoading(false) }
    }
    load()
  }, [id])

  if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-64 bg-gray-200 rounded" /></div>
  if (!template) return <div className="text-center py-12 text-gray-500">Plantilla no encontrada</div>

  const questionTypeLabels: Record<string, string> = { SCORE: 'Puntaje', YES_NO: 'Si/No', TEXT: 'Texto' }

  return (
    <div>
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/store-audits" className="hover:text-gray-700">Auditorias</a></li>
          <li><svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></li>
          <li><a href="/store-audits/templates" className="hover:text-gray-700">Plantillas</a></li>
          <li><svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></li>
          <li className="text-gray-900 font-medium">{template.name}</li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
        {template.description && <p className="mt-1 text-sm text-gray-500">{template.description}</p>}
      </div>

      <div className="space-y-6">
        {template.sections?.map((section: any, si: number) => (
          <div key={section.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Seccion {si + 1}: {section.title}</h3>
                {section.description && <p className="text-xs text-gray-500 mt-1">{section.description}</p>}
              </div>
              <span className="text-xs text-gray-400">Peso: {section.weight}</span>
            </div>
            <ul className="divide-y divide-gray-200">
              {section.questions?.map((q: any, qi: number) => (
                <li key={q.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-6">{qi + 1}.</span>
                    <span className="text-sm text-gray-900">{q.text}</span>
                    {q.requiresPhoto && <span className="text-xs text-orange-500">Foto</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      {questionTypeLabels[q.questionType] || q.questionType}
                    </span>
                    {q.questionType === 'SCORE' && (
                      <span className="text-xs text-gray-400">Max: {q.maxScore}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
