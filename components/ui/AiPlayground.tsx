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
    <section className="py-24 bg-brand-dark" id="playground">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Experience the Magic</h2>
          <p className="text-slate-400">Try our live playground and see the AI in action.</p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden group border border-white/10 hover:border-brand-primary/50 transition-colors duration-500">
          {/* Glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want to write about? (e.g. 'A landing page for a CRM')"
                className="flex-1 bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
              />
              <Button type="submit" size="lg" disabled={isGenerating || !input} className="gap-2 shrink-0">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Generate
              </Button>
            </form>

            <div className="bg-brand-surface/50 rounded-xl border border-white/5 min-h-[200px] p-6 text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              <AnimatePresence mode="wait">
                {!output && !isGenerating ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex items-center justify-center text-slate-500"
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
