"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      router.push("/playground");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/playground");
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

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

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleRegister}>
          <div>
            <input 
              type="text" 
              required
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <input 
              type="email" 
              required
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <input 
              type="password" 
              required
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white/10 transition-all"
            />
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            disabled={loading}
            className="w-full mt-6 h-14 rounded-xl text-lg font-bold shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-brand-dark px-3 text-slate-400">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outline"
          className="w-full h-14 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white font-medium flex items-center justify-center gap-3 transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </Button>

        <p className="text-center text-sm text-slate-400 mt-8">
          Already have an account? <Link href="/login" className="text-brand-primary hover:text-brand-primary/80 font-bold transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
}
