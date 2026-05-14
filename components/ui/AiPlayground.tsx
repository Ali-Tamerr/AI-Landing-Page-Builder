"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "./Button"

export function AiPlayground() {
  return (
    <section className="py-24 bg-white" id="playground">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <span className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2 block">Get Started</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 tracking-tight">Experience that grows<br />with your scale.</h2>
        </div>

        <div className="clean-card p-6 bg-brand-bg w-full transition-colors duration-500 relative flex flex-col items-center justify-center">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-2xl mx-auto">
            <input 
              type="email" 
              placeholder="Your business email" 
              className="w-full sm:flex-1 h-12 px-5 py-4 rounded-full border border-brand-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary text-base sm:text-lg shadow-sm"
            />
            <Button size="lg" className="w-full sm:w-auto rounded-full gap-2 px-8 h-14 shrink-0 text-base sm:text-lg">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
