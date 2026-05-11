import Link from "next/link"
import { Sparkles } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-brand-surface pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-brand-primary/20 p-1 rounded-lg border border-brand-primary/30">
                <Sparkles className="w-4 h-4 text-brand-primary" />
              </div>
              <span className="font-bold tracking-tight text-white">CopyAI<span className="text-brand-primary">.</span></span>
            </Link>
            <p className="text-slate-400 text-sm">
              The ultimate AI copywriting tool for modern marketing teams.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-brand-primary transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-brand-primary transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-brand-primary transition-colors">Use Cases</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-brand-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-brand-primary transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-brand-primary transition-colors">API Docs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-brand-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-brand-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} CopyAI Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
