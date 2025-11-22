import React, { useState } from 'react'
import { FileText } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import DocumentUpload from '../../components/Documents/DocumentUpload'
import DocumentSearch from '../../components/Documents/DocumentSearch'

export default function DocumentsPage() {
  const roles = useAuthStore((s) => s.roles)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  if (!roles.includes('admin')) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">Access Denied</p>
          <p className="text-gray-400 text-sm mt-2">You must be an admin to access this page.</p>
        </div>
      </div>
    )
  }

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-slate-900/40">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Document Management</h1>
            <p className="text-sm text-gray-400">Upload, search, and manage your documents</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload Section */}
          <DocumentUpload onSuccess={handleUploadSuccess} onError={handleUploadError} />

          {/* Search Section */}
          <DocumentSearch refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
