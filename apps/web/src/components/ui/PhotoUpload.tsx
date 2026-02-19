'use client'

import { useState, useRef, useCallback } from 'react'

interface PhotoUploadProps {
  onPhotosUploaded: (urls: string[]) => void
  existingPhotos?: string[]
  maxPhotos?: number
  label?: string
}

export function PhotoUpload({
  onPhotosUploaded,
  existingPhotos = [],
  maxPhotos = 5,
  label = 'Fotos',
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingPhotos)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const token = localStorage.getItem('accessToken')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${baseUrl}/api/v1/uploads/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()
      return data.url
    } catch (e) {
      console.error('Upload error:', e)
      return null
    }
  }, [])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remaining = maxPhotos - uploadedUrls.length
    if (remaining <= 0) {
      setError(`Maximo ${maxPhotos} fotos`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    setError(null)

    const newUrls: string[] = []
    for (const file of filesToUpload) {
      const url = await uploadFile(file)
      if (url) {
        newUrls.push(url)
      }
    }

    if (newUrls.length > 0) {
      const allUrls = [...uploadedUrls, ...newUrls]
      setUploadedUrls(allUrls)
      onPhotosUploaded(allUrls)
    } else if (filesToUpload.length > 0) {
      setError('Error al subir fotos')
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadedUrls, maxPhotos, uploadFile, onPhotosUploaded])

  const removePhoto = useCallback((index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index)
    setUploadedUrls(newUrls)
    onPhotosUploaded(newUrls)
  }, [uploadedUrls, onPhotosUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} ({uploadedUrls.length}/{maxPhotos})
      </label>

      {/* Thumbnails */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-2">
          {uploadedUrls.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {uploadedUrls.length < maxPhotos && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Subiendo...
            </div>
          ) : (
            <>
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm text-gray-500 mt-1">
                Arrastra fotos o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP. Max 10MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
