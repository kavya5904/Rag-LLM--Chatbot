import { useState } from 'react'
import { User, Bot, ChevronDown, ChevronUp, FileText } from 'lucide-react'

export default function MessageBubble({ message }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-indigo-500' : 'bg-gray-600'
        }`}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble + sources */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-gray-700 text-gray-100 rounded-2xl rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Sources toggle */}
        {message.sources && message.sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-400 px-1 py-0.5 rounded transition-colors"
            >
              <FileText size={11} />
              {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
              {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showSources && (
              <div className="mt-1 space-y-1.5 w-full">
                {message.sources.map((src, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-500 font-medium truncate max-w-[150px]" title={src.source}>
                        {src.source}
                      </span>
                      {src.page != null && (
                        <span className="text-gray-600 shrink-0 ml-2">p.{src.page}</span>
                      )}
                    </div>
                    <p className="text-gray-400 line-clamp-3 leading-relaxed">{src.excerpt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
