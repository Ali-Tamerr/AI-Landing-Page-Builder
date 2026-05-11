"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Sparkles, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

function PlaygroundContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt") || ""
  
  const [input, setInput] = useState(initialPrompt)
  const [output, setOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")

  // Auto-run if there's an initial prompt
  useEffect(() => {
    if (initialPrompt && !output && !isGenerating && !error) {
      const savedOutput = localStorage.getItem(`copyai_prompt_${initialPrompt}`)
      if (savedOutput) {
        setOutput(savedOutput)
      } else {
        handleGenerate(undefined, initialPrompt)
      }
    }
  }, [initialPrompt])

  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault()
    const promptText = customPrompt || input
    if (!promptText.trim()) return

    setIsGenerating(true)
    setOutput("")
    setError("")
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to generate content")
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullOutput = ""
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // Save to local storage when completely finished
          localStorage.setItem(`copyai_prompt_${promptText}`, fullOutput)
          break
        }
        
        const chunk = decoder.decode(value, { stream: true })
        fullOutput += chunk
        setOutput((prev) => prev + chunk)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
      
      // Update URL silently to keep the state shareable without reloading
      const url = new URL(window.location.href)
      url.searchParams.set("prompt", promptText)
      window.history.replaceState({}, "", url)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <header className="border-b border-brand-border bg-white h-16 flex items-center px-6 sticky top-0 z-10 shrink-0 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mr-6 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </Link>
        <div className="w-px h-6 bg-brand-border mr-6" />
        <span className="text-xl font-bold tracking-tight text-gray-900">CopyAI<span className="text-brand-primary">.</span> Playground</span>
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full gap-6">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 shrink-0">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you want to write about?"
            className="flex-1 bg-white border border-brand-border rounded-xl px-5 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-sm text-lg"
          />
          <Button type="submit" size="lg" disabled={isGenerating || !input.trim()} className="gap-2 shrink-0 rounded-xl px-8 h-[60px]">
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Generate
          </Button>
        </form>

        <div className="flex-1 bg-white rounded-2xl border border-brand-border shadow-sm p-6 sm:p-8 overflow-y-auto relative min-h-[400px]">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 mb-6 text-sm">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!output && !isGenerating && !error ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-4"
              >
                <Sparkles className="w-10 h-10 text-gray-300" />
                <p className="text-lg">Describe what you want to write, and AI will do the rest.</p>
              </motion.div>
            ) : isGenerating && !output ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-brand-primary gap-4"
              >
                <Sparkles className="w-10 h-10 animate-pulse" />
                <p className="font-medium text-lg">Thinking...</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-800 text-base sm:text-lg leading-relaxed font-sans max-w-3xl"
              >
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-700" {...props} />,
                    li: ({node, ...props}) => <li className="" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                    a: ({node, ...props}) => <a className="text-brand-primary hover:underline" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-brand-primary pl-4 py-1 italic text-gray-600 bg-gray-50 my-4 rounded-r-lg" {...props} />
                  }}
                >
                  {output}
                </ReactMarkdown>
                {isGenerating && (
                  <motion.span 
                    animate={{ opacity: [1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-2.5 h-5 bg-brand-primary ml-1 align-middle"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
