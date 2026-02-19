'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuditTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/store-audits/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Auditoria</h1>
          <p className="mt-1 text-sm text-gray-500">Configure las plantillas para inspecciones de tienda</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Nueva Plantilla
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No hay plantillas de auditoria</p>
            <button onClick={() => setShowCreateForm(true)} className="mt-4 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Crear primera plantilla
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secciones</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preguntas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/store-audits/templates/${t.id}`)}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    {t.description && <div className="text-sm text-gray-500 truncate max-w-xs">{t.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.sections?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.totalQuestions || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-DO') : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateForm && (
        <CreateTemplateModal onClose={() => setShowCreateForm(false)} onCreated={() => { setShowCreateForm(false); loadTemplates(); }} />
      )}
    </div>
  )
}

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sections, setSections] = useState([{
    order: 0, title: '', weight: 1.0,
    questions: [{ order: 0, text: '', questionType: 'SCORE', maxScore: 5, requiresPhoto: false }]
  }])
  const [submitting, setSubmitting] = useState(false)

  const addSection = () => {
    setSections([...sections, {
      order: sections.length, title: '', weight: 1.0,
      questions: [{ order: 0, text: '', questionType: 'SCORE', maxScore: 5, requiresPhoto: false }]
    }])
  }

  const addQuestion = (sectionIdx: number) => {
    const updated = [...sections]
    updated[sectionIdx].questions.push({
      order: updated[sectionIdx].questions.length, text: '', questionType: 'SCORE', maxScore: 5, requiresPhoto: false,
    })
    setSections(updated)
  }

  const handleSubmit = async () => {
    if (!name || sections.some((s) => !s.title || s.questions.some((q) => !q.text))) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl}/api/v1/store-audits/templates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || undefined, sections }),
      })
      if (res.ok) onCreated()
      else alert('Error al crear plantilla')
    } catch (err) {
      alert('Error al crear plantilla')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Nueva Plantilla de Auditoria</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Inspeccion General de Tienda" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripcion</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={2} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Secciones</label>
                <button type="button" onClick={addSection} className="text-sm text-blue-600 hover:text-blue-800">+ Agregar seccion</button>
              </div>
              <div className="space-y-4">
                {sections.map((section, si) => (
                  <div key={si} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => { const u = [...sections]; u[si].title = e.target.value; setSections(u); }}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Nombre de la seccion"
                      />
                      <input
                        type="number"
                        value={section.weight}
                        onChange={(e) => { const u = [...sections]; u[si].weight = parseFloat(e.target.value) || 1; setSections(u); }}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                        step="0.1"
                        min="0.1"
                        placeholder="Peso"
                      />
                    </div>
                    <div className="space-y-2">
                      {section.questions.map((q, qi) => (
                        <div key={qi} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) => { const u = [...sections]; u[si].questions[qi].text = e.target.value; setSections(u); }}
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Pregunta"
                          />
                          <select
                            value={q.questionType}
                            onChange={(e) => { const u = [...sections]; u[si].questions[qi].questionType = e.target.value; setSections(u); }}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                          >
                            <option value="SCORE">Puntaje</option>
                            <option value="YES_NO">Si/No</option>
                            <option value="TEXT">Texto</option>
                          </select>
                        </div>
                      ))}
                      <button type="button" onClick={() => addQuestion(si)} className="text-xs text-blue-600 hover:text-blue-800">
                        + Agregar pregunta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSubmit} disabled={submitting || !name} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Creando...' : 'Crear Plantilla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
