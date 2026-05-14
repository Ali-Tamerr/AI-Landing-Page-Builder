import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "./Button"

export function Footer() {
  return (
    <>
      {/* Dark CTA Banner */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="bg-brand-dark rounded-3xl p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto">
            <div className="max-w-xl text-center md:text-left">
              <span className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2 block">Get Started</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to level up your copywriting?</h2>
              <p className="text-gray-400">Join thousands of modern marketing teams creating better content, faster than ever.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Button size="lg" className="rounded-full px-8 gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 text-white border-white/20 hover:bg-white/10">
                View Live Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="border-t border-brand-border bg-brand-bg pt-16 pb-8 relative overflow-hidden">
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="font-bold text-xl tracking-tight text-gray-900">CopyAI<span className="text-brand-primary">.</span></span>
              </Link>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-brand-muted">
                <li><Link href="#" className="hover:text-brand-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-brand-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-brand-primary transition-colors">Use Cases</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-brand-muted">
                <li><Link href="#" className="hover:text-brand-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-brand-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-brand-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-brand-muted">
                <li><Link href="#" className="hover:text-brand-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-brand-primary transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-brand-primary transition-colors">API Docs</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-brand-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-muted text-center md:text-left">
            <p>© {new Date().getFullYear()} CopyAI Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-gray-900 transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">Facebook</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
