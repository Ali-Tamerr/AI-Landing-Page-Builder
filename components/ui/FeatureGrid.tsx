"use client"

import { motion } from "framer-motion"
import { Search, Globe, Share2, Zap, Layout } from "lucide-react"

const features = [
  {
    title: "SEO Optimized Output",
    description: "Generate copy that ranks higher on Google automatically.",
    icon: <Search className="w-6 h-6 text-brand-accent" />,
    className: "md:col-span-2",
  },
  {
    title: "Multi-Language Support",
    description: "Translate and localize content in 30+ languages.",
    icon: <Globe className="w-6 h-6 text-brand-primary" />,
    className: "md:col-span-1",
  },
  {
    title: "Social Media Ready",
    description: "Pre-formatted posts for Twitter, LinkedIn, and more.",
    icon: <Share2 className="w-6 h-6 text-brand-primary" />,
    className: "md:col-span-1",
  },
  {
    title: "Lightning Fast",
    description: "Get results in milliseconds with our custom infrastructure.",
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Beautiful Templates",
    description: "Start with proven, high-converting templates.",
    icon: <Layout className="w-6 h-6 text-pink-400" />,
    className: "md:col-span-1",
  },
]

export function FeatureGrid() {
  return (
    <section className="py-24 bg-brand-surface relative overflow-hidden" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Everything you need</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
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
              className={`glass rounded-2xl p-8 border border-white/5 hover:border-brand-primary/40 transition-colors duration-300 group ${feature.className}`}
            >
              <div className="bg-brand-dark/50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
