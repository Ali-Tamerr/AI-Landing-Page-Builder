"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Send, Loader2 } from "lucide-react"
import { Button } from "./Button"

export function AiPlayground() {
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState("")

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input) return

    setIsGenerating(true)
    setOutput("")
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      simulateTyping("Here is a high-converting headline for your product: \n\n\"Unlock Your Team's Potential with Next-Gen Collaboration.\" \n\nThis headline focuses on the value proposition and creates a sense of urgency.")
    }, 1500)
  }

  const simulateTyping = (text: string) => {
    let i = 0
    const interval = setInterval(() => {
      setOutput(prev => prev + text.charAt(i))
      i++
      if (i >= text.length) clearInterval(interval)
    }, 30)
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
              <Button type="submit" size="lg" disabled={isGenerating || !input} className="gap-2 shrink-0 rounded-xl px-8 h-[50px]">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Generate
              </Button>
            </form>

            <div className="bg-white rounded-xl border border-brand-border min-h-[200px] p-6 text-gray-700 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
              <AnimatePresence mode="wait">
                {!output && !isGenerating ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex items-center justify-center text-gray-400"
                  >
                    AI output will appear here...
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex items-center justify-center text-brand-primary gap-2"
                  >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    Thinking...
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {output}
                    <motion.span 
                      animate={{ opacity: [1, 0] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-2 h-4 bg-brand-primary ml-1 align-middle"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
