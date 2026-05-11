"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "./Button"
import { useRouter } from "next/navigation"

export function AiPlayground() {
  const router = useRouter()
  const [input, setInput] = useState("")

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    router.push(`/playground?prompt=${encodeURIComponent(input)}`)
  }

  return (
    <section className="py-24 bg-white" id="playground">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <span className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2 block">Interactive Demo</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 tracking-tight">Experience that grows<br />with your scale.</h2>
        </div>

        <div className="clean-card p-6 md:p-8 bg-brand-bg transition-colors duration-500 relative">
          <div className="relative z-10 flex flex-col gap-6">
            <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want to write about?"
                className="flex-1 bg-white border border-brand-border rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-sm"
              />
              <Button type="submit" size="lg" disabled={!input.trim()} className="gap-2 shrink-0 rounded-xl px-8 h-[50px]">
                <Send className="w-4 h-4" />
                Generate
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
