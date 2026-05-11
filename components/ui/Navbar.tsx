import Link from "next/link"
import { Button } from "./Button"
import { Sparkles } from "lucide-react"

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight text-gray-900">CopyAI<span className="text-brand-primary">.</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-muted">
          <Link href="/#features" className="hover:text-gray-900 transition-colors">Products</Link>
          <Link href="/#playground" className="hover:text-gray-900 transition-colors">Customers</Link>
          <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-gray-900 transition-colors">Learn</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild className="hidden sm:inline-flex rounded-full px-6 border-brand-border text-gray-900">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-full px-6">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
