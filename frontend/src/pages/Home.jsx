import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import InputArea from '../components/InputArea'
import UploadModal from '../components/UploadModal'
import * as api from '../lib/api'

export default function Home({ user, onLogout }) {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])
  const [selectedDocumentName, setSelectedDocumentName] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  // ── Load sessions on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchSessions()
    fetchDocuments()
  }, [])

  // ── Load messages whenever the active session changes ──────────────────────
  useEffect(() => {
    if (activeSessionId == null) {
      setMessages([])
      return
    }
    fetchMessages(activeSessionId)
  }, [activeSessionId])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fetchSessions = async () => {
    try {
      const data = await api.getSessions()
      setSessions(data)
    } catch {
      // silently ignore — backend may not be running yet
    }
  }

  const fetchMessages = async (sessionId) => {
    try {
      const detail = await api.getSession(sessionId)
      setMessages(detail.messages)
      setSelectedDocumentName(detail.document_name || null)
    } catch {
      setMessages([])
      setSelectedDocumentName(null)
    }
  }

  const fetchDocuments = async () => {
    try {
      const data = await api.getDocuments()
      setDocuments(data)
    } catch {
      setDocuments([])
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleNewChat = async () => {
    try {
      const session = await api.createSession(null, selectedDocumentName)
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.id)
      setMessages([])
    } catch (e) {
      console.error('Failed to create session', e)
    }
  }

  const handleSelectSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId)
  }, [])

  const handleDeleteSession = async (sessionId) => {
    try {
      await api.deleteSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch (e) {
      console.error('Failed to delete session', e)
    }
  }

  const handleRenameSession = async (sessionId, title) => {
    try {
      const updated = await api.renameSession(sessionId, title)
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s))
      )
    } catch (e) {
      console.error('Failed to rename session', e)
    }
  }

  const handleSend = async (question) => {
    if (!question || isLoading) return

    // ── 1. Ensure we have a session ──────────────────────────────────────────
    let sessionId = activeSessionId
    if (sessionId == null) {
      try {
        const session = await api.createSession(null, selectedDocumentName)
        setSessions((prev) => [session, ...prev])
        setActiveSessionId(session.id)
        sessionId = session.id
      } catch {
        appendError('Could not create a new chat session. Is the backend running?')
        return
      }
    }

    // ── 2. Optimistic user message ───────────────────────────────────────────
    const tempId = Date.now()
    const userMsg = {
      id: tempId,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    // ── 3. Send to backend ───────────────────────────────────────────────────
    try {
      const response = await api.sendMessage(sessionId, question, selectedDocumentName)

      const assistantMsg = {
        id: tempId + 1,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        sources: response.sources,
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Update session title in sidebar (backend may have auto-generated it)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                title: response.title ?? s.title,
                document_name: selectedDocumentName,
              }
            : s
        )
      )

      // Refresh the full session list so ordering & titles stay up to date
      fetchSessions()
    } catch (e) {
      const detail = e.response?.data?.detail || 'Failed to get a response. Please try again.'
      appendError(detail)
    } finally {
      setIsLoading(false)
    }
  }

  const appendError = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'assistant',
        content: `⚠️ ${text}`,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const handleUploaded = async (filename) => {
    setSelectedDocumentName(filename)
    setShowUpload(false)
    await fetchDocuments()
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onUpload={() => setShowUpload(true)}
        user={user}
        onLogout={onLogout}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-gray-300 truncate">
              {activeSessionId
                ? (sessions.find((s) => s.id === activeSessionId)?.title ?? 'Chat')
                : 'New Conversation'}
            </h2>
            <p className="text-xs text-gray-500 truncate mt-1">
              Context: {selectedDocumentName || 'All uploaded PDFs'}
            </p>
          </div>
          <span className="text-xs text-gray-600 shrink-0 ml-4">
            MindVault
          </span>
        </header>

        <ChatWindow messages={messages} isLoading={isLoading} />
        <InputArea
          onSend={handleSend}
          onUpload={() => setShowUpload(true)}
          documents={documents}
          selectedDocumentName={selectedDocumentName}
          onSelectDocument={setSelectedDocumentName}
          disabled={isLoading}
        />
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
    </div>
  )
}
