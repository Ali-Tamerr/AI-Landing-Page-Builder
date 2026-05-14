"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import { Button } from "./Button"
import Link from "next/link"

export function PricingToggle() {
  const [isYearly, setIsYearly] = useState(false)

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals and small teams.",
      priceMonthly: "$29",
      priceYearly: "$24",
      features: ["Up to 10,000 words/mo", "50+ templates", "Standard support", "1 user"],
      isPopular: false,
    },
    {
      name: "Pro",
      description: "Ideal for growing marketing agencies.",
      priceMonthly: "$79",
      priceYearly: "$64",
      features: ["Unlimited words", "All templates", "Priority support", "Up to 5 users", "Custom brand voice"],
      isPopular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations with complex needs.",
      priceMonthly: "$199",
      priceYearly: "$159",
      features: ["Unlimited everything", "Dedicated account manager", "API access", "SSO integration", "Custom workflows"],
      isPopular: false,
    }
  ]
  return (
    <section className="py-24 bg-brand-bg relative overflow-hidden" id="pricing">
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
        <div className="text-center mb-16">
          <span className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2 block">Choose Plan</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">Simple, transparent pricing</h2>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center p-1 cursor-pointer transition-colors"
              style={{ backgroundColor: isYearly ? '#189898' : '#e5e7eb' }}
            >
              <motion.div 
                className="w-6 h-6 bg-white rounded-full shadow-sm"
                animate={{ x: isYearly ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
              Yearly <span className="text-brand-primary text-xs ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`p-8 relative flex flex-col rounded-[2rem] overflow-hidden ${
                plan.isPopular 
                  ? 'bg-brand-primary text-white shadow-xl scale-105 z-10' 
                  : 'bg-brand-bg text-gray-900 border border-brand-border shadow-sm'
              }`}
            >
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm h-10 ${plan.isPopular ? 'text-white/80' : 'text-brand-muted'}`}>
                  {plan.description}
                </p>
              </div>
              
              <div className="mb-8 flex items-end gap-2">
                <span className="text-5xl font-extrabold">
                  {isYearly ? plan.priceYearly : plan.priceMonthly}
                </span>
                <span className={`mb-2 font-medium ${plan.isPopular ? 'text-white/80' : 'text-brand-muted'}`}>
                  /mo
                </span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.isPopular ? 'text-white' : 'text-brand-primary'}`} />
                    <span className={plan.isPopular ? 'text-white' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                href="/register"
                className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 font-semibold transition-all ${
                  plan.isPopular 
                    ? 'bg-white text-brand-primary hover:bg-gray-50' 
                    : 'bg-white border border-brand-border text-gray-900 hover:bg-gray-50'
                }`}
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
