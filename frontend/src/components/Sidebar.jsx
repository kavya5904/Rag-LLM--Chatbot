import { useState, useRef, useEffect } from 'react'
import {
  Plus,
  MessageSquare,
  Trash2,
  Upload,
  Edit2,
  Check,
  X,
  Search,
  LogOut,
  Brain,
  User,
} from 'lucide-react'

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onUpload,
  user,
  onLogout,
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const startRename = (session, e) => {
    e.stopPropagation()
    setRenamingId(session.id)
    setRenameValue(session.title)
  }

  const commitRename = (sessionId, e) => {
    e?.stopPropagation()
    if (renameValue.trim()) {
      onRenameSession(sessionId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const cancelRename = (e) => {
    e?.stopPropagation()
    setRenamingId(null)
  }

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-gray-900 border-r border-gray-700 h-full">
      {/* Logo + New Chat */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">MindVault</span>
        </div>
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Upload PDF */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={onUpload}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 hover:border-gray-600 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          <Upload size={14} />
          Upload Document
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search chats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <p className="text-gray-600 text-xs text-center mt-6 px-2">
            No conversations yet.
            <br />
            Start a new chat above.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-600 text-xs text-center mt-6 px-2">No results found.</p>
        ) : (
          filtered.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              isRenaming={renamingId === session.id}
              renameValue={renameValue}
              onSelect={() => onSelectSession(session.id)}
              onDelete={(e) => {
                e.stopPropagation()
                onDeleteSession(session.id)
              }}
              onStartRename={startRename}
              onRenameChange={setRenameValue}
              onCommitRename={commitRename}
              onCancelRename={cancelRename}
            />
          ))
        )}
      </div>

      {/* User section at bottom */}
      {user && (
        <div className="relative border-t border-gray-700 p-3" ref={menuRef}>
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-gray-750 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          )}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="min-w-0 text-left flex-1">
              <p className="text-sm text-white truncate">{user.username}</p>
            </div>
          </button>
        </div>
      )}
    </aside>
  )
}

function SessionItem({
  session,
  isActive,
  isRenaming,
  renameValue,
  onSelect,
  onDelete,
  onStartRename,
  onRenameChange,
  onCommitRename,
  onCancelRename,
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-colors select-none ${
        isActive
          ? 'bg-gray-700 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      <MessageSquare size={13} className="shrink-0 opacity-50" />

      {isRenaming ? (
        <div
          className="flex items-center gap-1 flex-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename(session.id)
              if (e.key === 'Escape') onCancelRename()
            }}
            className="flex-1 min-w-0 bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={(e) => onCommitRename(session.id, e)}
            className="text-green-400 hover:text-green-300 shrink-0"
          >
            <Check size={12} />
          </button>
          <button
            onClick={onCancelRename}
            className="text-red-400 hover:text-red-300 shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 truncate text-xs leading-relaxed">{session.title}</span>
          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => onStartRename(session, e)}
              className="p-0.5 rounded hover:bg-gray-600 opacity-60 hover:opacity-100 transition-opacity"
              title="Rename"
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={onDelete}
              className="p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
