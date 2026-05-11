import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-background-image-radial-glow opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-md glass rounded-2xl p-8 border border-white/10 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group mb-6">
            <div className="bg-brand-primary/20 p-2 rounded-lg border border-brand-primary/30 group-hover:border-brand-primary/50 transition-colors">
              <Sparkles className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">CopyAI<span className="text-brand-primary">.</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Enter your details to log in to your account</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <Link href="#" className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors">Forgot password?</Link>
            </div>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
          
          <Button type="button" size="lg" className="w-full mt-6">
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account? <Link href="/register" className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
