"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "./Button"
import { Send } from "lucide-react"
import { useRouter } from "next/navigation"

export function Hero() {
  const router = useRouter()
  const [input, setInput] = useState("")

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    router.push(`/playground?prompt=${encodeURIComponent(input)}`)
  }

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-brand-bg overflow-hidden" id="hero">
      {/* Infinite Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.07) 1px, transparent 1px)`,
          backgroundSize: `40px 40px`,
          maskImage: `linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)`,
          WebkitMaskImage: `radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)`
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight"
          >
            Write better copy, <br className="hidden md:block" />
            <span className="text-brand-primary">
              faster than ever.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10"
          >
            Generate high-converting ads, emails, and landing pages in seconds with our advanced AI copywriting model.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl sm:rounded-full border border-brand-border shadow-lg">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want to write about?"
                className="flex-1 bg-transparent px-5 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none text-base sm:text-lg"
              />
              <Button type="submit" size="lg" disabled={!input.trim()} className="gap-2 shrink-0 rounded-xl sm:rounded-full px-8 h-12 sm:h-[52px]">
                <Send className="w-5 h-5" />
                Generate
              </Button>
            </form>
          </motion.div>
          
        </div>
      </div>
    </section>
  )
}
