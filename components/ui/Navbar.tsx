import Link from "next/link"
import { Button } from "./Button"
import { Sparkles } from "lucide-react"

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-brand-primary/20 p-1.5 rounded-lg border border-brand-primary/30 group-hover:border-brand-primary/50 transition-colors">
            <Sparkles className="w-5 h-5 text-brand-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CopyAI<span className="text-brand-primary">.</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/#playground" className="hover:text-white transition-colors">Playground</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log in
          </Link>
          <Button asChild>
            <Link href="/register">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
