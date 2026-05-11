import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
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
          <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-slate-400 text-sm">Start your 14-day free trial. No credit card required.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input 
              type="text" 
              placeholder="Jane Doe"
              className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
          
          <Button type="button" size="lg" className="w-full mt-6">
            Sign up
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <Link href="/login" className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
}
