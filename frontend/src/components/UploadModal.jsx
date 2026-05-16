import { useState, useRef } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import * as api from '../lib/api'

export default function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null) // { success: bool, message: string }
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const acceptFile = (f) => {
    if (!f) return
    const lowerName = f.name.toLowerCase()
    const supported = ['.pdf', '.docx', '.ppt', '.pptx']
    if (!supported.some((ext) => lowerName.endsWith(ext))) {
      setResult({ success: false, message: 'Only PDF, DOCX, PPT, and PPTX files are supported.' })
      return
    }
    setFile(f)
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    acceptFile(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setResult(null)
    try {
      const data = await api.uploadPDF(file)
      setResult({
        success: true,
        message: `"${data.filename}" uploaded — ${data.chunks_indexed} chunks indexed.`,
      })
      onUploaded?.(data.filename)
      setFile(null)
    } catch (e) {
      const msg =
        e.response?.data?.detail || 'Upload failed. Please check the file and try again.'
      setResult({ success: false, message: msg })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Upload size={17} className="text-indigo-400" />
            <h2 className="text-white font-semibold text-sm">Upload Document</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-indigo-400 bg-indigo-950/30'
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-750'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-indigo-400">
                <FileText size={22} />
                <span className="text-sm font-medium truncate max-w-[220px]">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload size={30} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm font-medium">
                  Drag & drop a document here
                </p>
                <p className="text-gray-600 text-xs mt-1">PDF, DOCX, PPT, PPTX</p>
              </>
            )}
          </div>

          {/* Result banner */}
          {result && (
            <div
              className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm border ${
                result.success
                  ? 'bg-green-950/40 text-green-400 border-green-800/60'
                  : 'bg-red-950/40 text-red-400 border-red-800/60'
              }`}
            >
              {result.success ? (
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {result?.success ? 'Close' : 'Cancel'}
          </button>
          {!result?.success && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
