"use client"

import { motion } from "framer-motion"
import { Search, Globe, Share2, Zap, Layout } from "lucide-react"

const features = [
  {
    title: "SEO Optimized Output",
    description: "Generate copy that ranks higher on Google automatically.",
    icon: <Search className="w-5 h-5 text-gray-700 group-hover:text-brand-primary transition-colors" />,
    className: "md:col-span-2",
  },
  {
    title: "Multi-Language Support",
    description: "Translate and localize content in 30+ languages.",
    icon: <Globe className="w-5 h-5 text-gray-700 group-hover:text-brand-primary transition-colors" />,
    className: "md:col-span-1",
  },
  {
    title: "Social Media Ready",
    description: "Pre-formatted posts for Twitter, LinkedIn, and more.",
    icon: <Share2 className="w-5 h-5 text-gray-700 group-hover:text-brand-primary transition-colors" />,
    className: "md:col-span-1",
  },
  {
    title: "Lightning Fast",
    description: "Get results in milliseconds with our custom infrastructure.",
    icon: <Zap className="w-5 h-5 text-gray-700 group-hover:text-brand-primary transition-colors" />,
    className: "md:col-span-1",
  },
  {
    title: "Beautiful Templates",
    description: "Start with proven, high-converting templates.",
    icon: <Layout className="w-5 h-5 text-gray-700 group-hover:text-brand-primary transition-colors" />,
    className: "md:col-span-1",
  },
]

export function FeatureGrid() {
  return (
    <section className="py-24 bg-brand-bg relative overflow-hidden" id="features">
      {/* Infinite Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)`,
          backgroundSize: `40px 40px`,
          maskImage: `linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)`,
          WebkitMaskImage: `radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)`
        }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2 block">Why they prefer CopyAI</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 tracking-tight">Everything you need</h2>
          <p className="text-brand-muted max-w-2xl mx-auto">
            Powerful features designed to help you create better content, faster and more efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`clean-card p-8 group ${feature.className}`}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-brand-border shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-brand-primary/30 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-brand-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
