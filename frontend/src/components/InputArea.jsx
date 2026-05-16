import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, FileText, Paperclip, Send, Search, X } from 'lucide-react'

export default function InputArea({
  onSend,
  onUpload,
  documents,
  selectedDocumentName,
  onSelectDocument,
  disabled,
}) {
  const [text, setText] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const textareaRef = useRef(null)
  const pickerRef = useRef(null)

  const filteredDocuments = useMemo(() => {
    const query = filterText.trim().toLowerCase()
    if (!query) return documents
    return documents.filter((doc) => doc.filename.toLowerCase().includes(query))
  }, [documents, filterText])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleInput = (e) => {
    setText(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 mb-3 relative" ref={pickerRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPickerOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-750 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText size={13} className="text-indigo-400" />
            <span>Context</span>
            <ChevronDown size={13} className={`transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {selectedDocumentName && (
            <div className="inline-flex max-w-[320px] items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
              <span className="truncate">{selectedDocumentName}</span>
              <button
                type="button"
                onClick={() => onSelectDocument(null)}
                disabled={disabled}
                className="text-indigo-300 hover:text-white disabled:opacity-50"
                title="Use all uploaded PDFs"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onUpload}
            disabled={disabled}
            className="flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <Paperclip size={13} />
            Upload PDF
          </button>

          {!selectedDocumentName && (
            <span className="text-xs text-gray-500">Using all uploaded PDFs</span>
          )}

          {pickerOpen && (
            <div className="absolute left-0 right-0 sm:right-auto bottom-full mb-2 z-20 w-full sm:w-[360px] max-w-[92vw] rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-gray-700">
                <div className="flex items-center gap-2 rounded-lg border border-gray-700 px-2 py-1.5 bg-gray-900">
                  <Search size={12} className="text-gray-500" />
                  <input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Search uploaded PDFs"
                    className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto p-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectDocument(null)
                    setPickerOpen(false)
                  }}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  <span>All uploaded PDFs</span>
                  {!selectedDocumentName && <Check size={14} className="text-indigo-400" />}
                </button>

                {filteredDocuments.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-500">No matching PDFs found.</p>
                ) : (
                  filteredDocuments.map((document) => {
                    const isActive = selectedDocumentName === document.filename
                    return (
                      <button
                        key={document.filename}
                        type="button"
                        onClick={() => {
                          onSelectDocument(document.filename)
                          setPickerOpen(false)
                        }}
                        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                        title={document.filename}
                      >
                        <span className="truncate">{document.filename}</span>
                        {isActive && <Check size={14} className="text-indigo-400 shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
        <div
          className={`flex items-end gap-3 bg-gray-700 rounded-2xl px-4 py-3 border transition-colors ${
            disabled ? 'border-gray-700 opacity-70' : 'border-gray-600 focus-within:border-indigo-500'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onInput={handleInput}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your PDF…"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none max-h-48 min-h-[1.5rem] leading-relaxed disabled:cursor-not-allowed"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || disabled}
            className="shrink-0 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send (Enter)"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-700 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
