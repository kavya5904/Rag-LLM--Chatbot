import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { Bot } from 'lucide-react'

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800">
        <div className="text-center text-gray-500 px-6">
          <Bot size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-xl font-medium text-gray-400">How can I help you today?</p>
          <p className="text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Upload a PDF using the sidebar, then ask any question about its content.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3.5">
              <div className="flex gap-1.5 items-center h-4">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '160ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '320ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
