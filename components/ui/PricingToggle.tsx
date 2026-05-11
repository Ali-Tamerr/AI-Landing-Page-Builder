"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "./Button"

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
    <section className="py-24 bg-brand-dark relative" id="pricing">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Simple, transparent pricing</h2>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-8 rounded-full bg-brand-surface border border-white/10 flex items-center p-1 cursor-pointer"
            >
              <motion.div 
                className="w-6 h-6 bg-brand-primary rounded-full shadow-lg"
                animate={{ x: isYearly ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-slate-400'}`}>
              Yearly <span className="text-brand-cyan text-xs ml-1">(Save 20%)</span>
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
              className={`glass rounded-2xl p-8 relative flex flex-col ${plan.isPopular ? 'border-brand-primary/50 ring-1 ring-brand-primary/20' : 'border-white/5'}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-primary to-brand-cyan text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm h-10">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-white">
                  {isYearly ? plan.priceYearly : plan.priceMonthly}
                </span>
                <span className="text-slate-400 mb-2">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-brand-cyan shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.isPopular ? "default" : "outline"} 
                size="lg" 
                className="w-full"
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
