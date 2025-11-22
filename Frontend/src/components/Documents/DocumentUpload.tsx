import React, { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { api } from '../../services/api'

interface DocumentUploadProps {
  onSuccess: () => void
  onError: (error: string) => void
}

export function DocumentUpload({ onSuccess, onError }: DocumentUploadProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')
    const isTxt = selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')

    if (!isPdf && !isTxt) {
      setMessage({
        type: 'error',
        text: 'File type not supported. Only PDF and TXT files allowed.',
      })
      setFile(null)
      return
    }

    setFile(selectedFile)
    setMessage(null)
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage({
        type: 'error',
        text: 'Please select a file first.',
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await api.documents.upload(file)
      setMessage({
        type: 'success',
        text: `✓ "${response.data.title}" uploaded successfully.`,
      })
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onSuccess()
    } catch (error: any) {
      const errorText = error.response?.data?.detail || error.message || 'Error uploading file'
      setMessage({
        type: 'error',
        text: `Error: ${errorText}`,
      })
      onError(errorText)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Upload size={20} className="text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Upload Document</h3>
      </div>

      <p className="text-sm text-gray-300">Select a PDF or TXT file to upload and embed.</p>

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileSelect}
          className="flex-1 px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600/40 file:text-blue-300 hover:file:bg-blue-600/60"
        />
      </div>

      {file && (
        <div className="text-sm text-cyan-300 bg-cyan-900/20 p-2 rounded border border-cyan-700/30">
          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader size={18} className="animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={18} />
            Upload
          </>
        )}
      </button>

      {message && (
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-900/20 border-green-700/30 text-green-300'
              : 'bg-red-900/20 border-red-700/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload
