"use client"

import { motion } from "framer-motion"
import { Button } from "./Button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-brand-bg overflow-hidden" id="hero">
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
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
          >
            <input 
              type="email" 
              placeholder="Your business email" 
              className="w-full h-12 px-5 rounded-full border border-brand-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <Button size="lg" className="w-full sm:w-auto rounded-full gap-2 px-8 h-12">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 flex items-center justify-center gap-8 text-gray-400 grayscale opacity-70"
          >
            {/* Logos placeholder */}
            <span className="font-bold text-xl">Klarna.</span>
            <span className="font-bold text-xl">coinbase</span>
            <span className="font-bold text-xl">instacart</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
