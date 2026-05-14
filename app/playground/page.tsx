"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Sparkles, Send, Loader2, MessageSquare, Plus, Trash2, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

type Message = { id: string; role: 'user' | 'model'; content: string }
type Chat = { id: string; title: string; messages: Message[]; updatedAt: number }

function PlaygroundContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt") || ""
  
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load from local storage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("copyai_chats")
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats)
        
        // Auto-fix any older duplicate IDs from previous bugs and remove empty model artifacts
        const fixedChats = parsed.map((chat: Chat) => {
          const seenIds = new Set<string>()
          chat.messages = chat.messages
            .filter((msg: Message) => !(msg.role === 'model' && !msg.content.trim()))
            .map((msg: Message) => {
              if (seenIds.has(msg.id)) {
                msg.id = `msg-fixed-${Math.random().toString(36).substr(2, 9)}`
              }
              seenIds.add(msg.id)
              return msg
            })
          return chat
        })
        
        setChats(fixedChats)
      } catch (e) {}
    }
  }, [])

  const hasRunInitialPrompt = useRef(false)

  // Auto-run initial prompt
  useEffect(() => {
    if (initialPrompt && !hasRunInitialPrompt.current) {
      const existingChat = chats.find(c => c.messages[0]?.content === initialPrompt && c.messages.length <= 2)
      if (existingChat) {
        setCurrentChatId(existingChat.id)
        router.replace("/playground")
      } else if (!isGenerating && chats.length !== 0 || !isGenerating && !localStorage.getItem("copyai_chats")) {
        hasRunInitialPrompt.current = true
        handleSend(undefined, initialPrompt)
      }
    }
  }, [initialPrompt, chats.length])

  // Save to local storage on change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("copyai_chats", JSON.stringify(chats))
    }
  }, [chats])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chats, currentChatId, isGenerating])

  const createNewChat = () => {
    setCurrentChatId(null)
    setInput("")
    setError("")
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const newChats = chats.filter(c => c.id !== id)
    setChats(newChats)
    if (currentChatId === id) {
      setCurrentChatId(null)
    }
    if (newChats.length === 0) {
      localStorage.removeItem("copyai_chats")
    } else {
      localStorage.setItem("copyai_chats", JSON.stringify(newChats))
    }
  }

  const currentChat = chats.find(c => c.id === currentChatId)
  const messages = currentChat ? currentChat.messages : []

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault()
    const promptText = customPrompt || input
    if (!promptText.trim()) return

    setInput("")
    setError("")
    setIsGenerating(true)

    if (initialPrompt) {
      router.replace("/playground")
    }
    
    let activeChatId = currentChatId
    let newChats = [...chats]
    
    const userMessage: Message = { id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, role: 'user', content: promptText }
    
    if (!activeChatId) {
      activeChatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newChat: Chat = {
        id: activeChatId,
        title: promptText.slice(0, 40) + (promptText.length > 40 ? "..." : ""),
        messages: [userMessage],
        updatedAt: Date.now()
      }
      newChats = [newChat, ...chats]
      setCurrentChatId(activeChatId)
    } else {
      const chatIndex = newChats.findIndex(c => c.id === activeChatId)
      if (chatIndex >= 0) {
        const updatedChat = {
          ...newChats[chatIndex],
          messages: [...newChats[chatIndex].messages, userMessage],
          updatedAt: Date.now()
        }
        newChats.splice(chatIndex, 1)
        newChats.unshift(updatedChat)
      }
    }
    
    setChats(newChats)

    const modelMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      const activeChat = newChats.find(c => c.id === activeChatId)!
      const apiMessages = activeChat.messages.map(m => ({ role: m.role, content: m.content }))
      
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to generate content")
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullOutput = ""
      
      // Add empty model message
      setChats(current => {
        const updated = [...current]
        const idx = updated.findIndex(c => c.id === activeChatId)
        if (idx >= 0) {
          const chat = updated[idx]
          if (!chat.messages.some(m => m.id === modelMessageId)) {
            updated[idx] = {
              ...chat,
              messages: [...chat.messages, { id: modelMessageId, role: 'model', content: '' }]
            }
          }
        }
        return updated
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        fullOutput += chunk
        
        // Update the last message
        setChats(current => {
          const updated = [...current]
          const idx = updated.findIndex(c => c.id === activeChatId)
          if (idx >= 0) {
            const chat = updated[idx]
            const msgs = [...chat.messages]
            if (msgs.length > 0 && msgs[msgs.length - 1].role === 'model') {
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: fullOutput }
              updated[idx] = { ...chat, messages: msgs }
            }
          }
          return updated
        })
      }
    } catch (err: any) {
      setError(err.message)
      // Remove the last user message if API failed and it's the only message
      setChats(current => {
        const updated = [...current]
        const idx = updated.findIndex(c => c.id === activeChatId)
        if (idx >= 0 && updated[idx].messages.length === 1) {
          return updated.filter(c => c.id !== activeChatId)
        }
        return updated
      })
      if (!currentChatId) setCurrentChatId(null)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex h-[100dvh] overflow-hidden font-sans">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-72 bg-gray-50 border-r border-brand-border transition-transform duration-300 flex flex-col`}>
        <div className="p-4 border-b border-brand-border flex items-center justify-between bg-white shrink-0 h-16">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-900 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 shrink-0">
          <Button onClick={createNewChat} variant="outline" className="w-full justify-start gap-2 border-brand-border bg-white hover:bg-brand-primary/5 text-brand-primary h-12 rounded-xl">
            <Plus className="w-5 h-5" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1">
          {chats.map(chat => (
            <div key={chat.id} className={`group relative rounded-xl transition-colors flex items-center ${currentChatId === chat.id ? "bg-white border border-brand-border shadow-sm text-brand-primary" : "hover:bg-gray-100 text-gray-600 border border-transparent"}`}>
              <button
                onClick={() => { setCurrentChatId(chat.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className="flex-1 p-3 flex items-center gap-3 text-left overflow-hidden"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </button>
              <button onClick={(e) => deleteChat(e, chat.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity absolute right-1 bg-gradient-to-l from-white via-white to-transparent md:from-transparent md:via-transparent">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="text-center text-sm text-gray-400 mt-8 px-4">
              Your recent chats will appear here.
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative w-full min-w-0 bg-white">
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-brand-border flex items-center px-4 bg-white shrink-0 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold tracking-tight text-gray-900">CopyAI<span className="text-brand-primary">.</span></span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {!messages.length && !isGenerating ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400 gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-brand-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">How can I help you today?</h2>
                <p className="text-base text-center max-w-md">Start a new conversation and ask me to write copy, brainstorm ideas, or summarize information.</p>
              </div>
            ) : null}

            {messages.map((msg, idx) => (
              <div key={msg.id} className={`flex gap-4 sm:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                  </div>
                )}
                <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl px-5 sm:px-6 py-4 sm:py-5 ${msg.role === 'user' ? 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tr-sm' : 'text-gray-800'}`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-base sm:text-lg">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-brand-primary">
                      {msg.content ? (
                        <>
                          <ReactMarkdown
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl sm:text-3xl font-bold mt-6 mb-4" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl sm:text-2xl font-bold mt-6 mb-4" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg sm:text-xl font-bold mt-4 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                              li: ({node, ...props}) => <li className="" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-brand-primary pl-4 py-1 italic text-gray-600 bg-gray-50 my-4 rounded-r-lg" {...props} />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          {isGenerating && idx === messages.length - 1 && (
                            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2.5 h-4 bg-brand-primary ml-1 align-middle" />
                          )}
                        </>
                      ) : (
                        isGenerating && idx === messages.length - 1 && (
                          <div className="flex items-center gap-1.5 h-6 px-1">
                            <motion.div className="w-2 h-2 bg-brand-primary/50 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                            <motion.div className="w-2 h-2 bg-brand-primary/50 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                            <motion.div className="w-2 h-2 bg-brand-primary/50 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}
            {/* Spacer to ensure the last message scrolls completely above the floating input bar */}
            <div ref={messagesEndRef} className="h-24 shrink-0 w-full" />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-6 px-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <form onSubmit={handleSend} className="flex gap-2 sm:gap-4 relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-2 sm:p-3">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message CopyAI..."
                className="flex-1 bg-transparent border-none px-3 sm:px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 text-base sm:text-lg"
              />
              <Button type="submit" size="lg" disabled={isGenerating || !input.trim()} className="gap-2 shrink-0 rounded-xl px-6 sm:px-8 h-[50px] sm:h-[56px]">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">AI can make mistakes. Consider verifying important information.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  )
}
