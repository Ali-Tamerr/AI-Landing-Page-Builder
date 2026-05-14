import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.07) 1px, transparent 1px)`,
          backgroundSize: `40px 40px`,
          maskImage: `linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)`,
          WebkitMaskImage: `radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)`
        }}
      />
      
      <div className="w-full max-w-md bg-brand-dark rounded-3xl p-10 border border-white/5 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-2 group mb-6">
            <div className="bg-brand-primary/20 p-2 rounded-lg border border-brand-primary/30">
              <Sparkles className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">CopyAI<span className="text-brand-primary">.</span></span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-slate-400 text-center">Start your 14-day free trial. No credit card required.</p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Name</label>
            <input 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white/10 transition-all"
            />
          </div>
          
          <Button type="button" size="lg" className="w-full mt-6 h-14 rounded-xl text-lg font-bold shadow-lg shadow-brand-primary/20">
            Sign up
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8">
          Already have an account? <Link href="/login" className="text-brand-primary hover:text-brand-primary/80 font-bold transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
}
