"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Sparkles, Send, Loader2, MessageSquare, Plus, Trash2, Menu, X,
  Copy, Download, Monitor, Tablet, Smartphone, Code, Eye, RefreshCw, Check, CheckCircle2,
  ChevronDown, Info
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore"

interface AdCopy {
  googleSearch: { headline: string; description: string };
  facebookFeed: { headline: string; description: string; cta: string };
}

interface Campaign {
  id: string;
  title: string;
  prompt: string;
  tone: string;
  colorTheme: string;
  targetAudience: string;
  socialCopy: string;
  adCopy: AdCopy;
  imagePrompt: string;
  imageUrl: string;
  landingPageHtml: string;
  createdAt: number;
}

const TONES = ["Professional", "Witty", "Bold", "Minimalist", "Luxury"];
const COLOR_THEMES = [
  { name: "Indigo", value: "Indigo", bgClass: "bg-indigo-600" },
  { name: "Emerald", value: "Emerald", bgClass: "bg-emerald-600" },
  { name: "Violet", value: "Violet", bgClass: "bg-violet-600" },
  { name: "Rose", value: "Rose", bgClass: "bg-rose-600" },
  { name: "Amber", value: "Amber", bgClass: "bg-amber-600" },
  { name: "Dark Theme", value: "Dark Theme", bgClass: "bg-slate-900" }
];

function PlaygroundContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt") || ""
  
  // Auth state
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null)
  
  // Form Inputs
  const [prompt, setPrompt] = useState("")
  const [tone, setTone] = useState("Professional")
  const [colorTheme, setColorTheme] = useState("Indigo")
  const [targetAudience, setTargetAudience] = useState("General Audience")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  
  // Generation & Status
  const [isGenerating, setIsGenerating] = useState(false)
  const [tweakLoadingAsset, setTweakLoadingAsset] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  // Workspace controls
  const [activeLandingTab, setActiveLandingTab] = useState<"preview" | "code">("preview")
  const [iframeWidth, setIframeWidth] = useState<"100%" | "768px" | "375px">("100%")
  const [adPreviewPlatform, setAdPreviewPlatform] = useState<"google" | "facebook">("google")

  // Tweak inputs
  const [tweaks, setTweaks] = useState({
    social: "",
    ads: "",
    image: "",
    landing: ""
  })

  // Client-side Authentication Guard using Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (!usr) {
        router.push("/login")
      } else {
        setUser(usr)
        setAuthLoading(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  // Load campaigns from local storage / Firestore on user load
  useEffect(() => {
    if (!user) return

    const loadCampaigns = async () => {
      // Try loading from Firestore if available
      try {
        const campaignsRef = collection(db, "users", user.uid, "campaigns")
        const q = query(campaignsRef, orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)
        
        const fetchedCampaigns: Campaign[] = []
        querySnapshot.forEach((docSnap) => {
          fetchedCampaigns.push(docSnap.data() as Campaign)
        })

        if (fetchedCampaigns.length > 0) {
          setCampaigns(fetchedCampaigns)
          // Default to first active campaign if none is set
          const storedActiveId = localStorage.getItem(`copyai_active_campaign_${user.uid}`)
          if (storedActiveId && fetchedCampaigns.some(c => c.id === storedActiveId)) {
            setCurrentCampaignId(storedActiveId)
          } else {
            setCurrentCampaignId(fetchedCampaigns[0].id)
          }
          return
        }
      } catch (firestoreErr) {
        console.warn("Firestore access failed, falling back to localStorage history:", firestoreErr)
      }

      // Fallback: LocalStorage campaign history
      const saved = localStorage.getItem(`copyai_campaigns_${user.uid}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Campaign[]
          setCampaigns(parsed)
          const storedActiveId = localStorage.getItem(`copyai_active_campaign_${user.uid}`)
          if (storedActiveId && parsed.some(c => c.id === storedActiveId)) {
            setCurrentCampaignId(storedActiveId)
          } else if (parsed.length > 0) {
            setCurrentCampaignId(parsed[0].id)
          }
        } catch (e) {}
      }
    }

    loadCampaigns()
  }, [user])

  // Save campaigns changes to LocalStorage and Firestore
  const syncCampaigns = async (updatedList: Campaign[]) => {
    if (!user) return
    setCampaigns(updatedList)
    localStorage.setItem(`copyai_campaigns_${user.uid}`, JSON.stringify(updatedList))
    
    // Sync current active ID
    if (currentCampaignId) {
      localStorage.setItem(`copyai_active_campaign_${user.uid}`, currentCampaignId)
    }
  }

  // Handle saving individual campaign to Firestore
  const saveCampaignToFirestore = async (campaign: Campaign) => {
    if (!user) return
    try {
      const campaignDocRef = doc(db, "users", user.uid, "campaigns", campaign.id)
      await setDoc(campaignDocRef, campaign)
    } catch (e) {
      console.error("Failed to sync campaign to firestore:", e)
    }
  }

  // Handle Initial Prompt if passed through landing page Hero search bar
  const hasRunInitialPrompt = useRef(false)
  useEffect(() => {
    if (initialPrompt && user && !hasRunInitialPrompt.current && campaigns.length === 0) {
      hasRunInitialPrompt.current = true
      setPrompt(initialPrompt)
      handleGenerateCampaign(undefined, initialPrompt)
      router.replace("/playground")
    }
  }, [initialPrompt, user, campaigns.length])

  // Get active campaign details
  const activeCampaign = campaigns.find(c => c.id === currentCampaignId)

  // Copy handler
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStates(prev => ({ ...prev, [label]: true }))
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [label]: false }))
    }, 2000)
  }

  // File download utility
  const handleDownloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Create absolute fresh Workspace
  const startNewCampaign = () => {
    setCurrentCampaignId(null)
    setPrompt("")
    setError("")
    setTweaks({ social: "", ads: "", image: "", landing: "" })
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  // Delete specific campaign
  const handleDeleteCampaign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!user) return

    const updated = campaigns.filter(c => c.id !== id)
    await syncCampaigns(updated)
    
    if (currentCampaignId === id) {
      setCurrentCampaignId(updated.length > 0 ? updated[0].id : null)
    }

    try {
      const campaignDocRef = doc(db, "users", user.uid, "campaigns", id)
      await deleteDoc(campaignDocRef)
    } catch (err) {}
  }

  // Core Orchestration Engine: Generate Full Campaign
  const handleGenerateCampaign = async (e?: React.FormEvent, overridePrompt?: string) => {
    e?.preventDefault()
    const targetPrompt = overridePrompt || prompt
    if (!targetPrompt.trim()) return

    setIsGenerating(true)
    setError("")
    
    try {
      // 1. Fetch Structured Text & Page Layout from Gemini
      const textRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: targetPrompt,
          tone,
          colorTheme,
          targetAudience
        })
      })

      if (!textRes.ok) {
        const errorData = await textRes.json()
        throw new Error(errorData.error || "Failed to generate campaign copy & landing page structure.")
      }

      const campaignData = await textRes.json()

      // 2. Fetch AI Visual Asset from Hybrid Image Engine
      const imageRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompt: campaignData.imagePrompt })
      })

      if (!imageRes.ok) {
        throw new Error("Failed to generate contextual visual asset.")
      }

      const imageData = await imageRes.json()

      // 3. Construct unified Campaign record
      const campaignId = `campaign-${Date.now()}`
      const newCampaign: Campaign = {
        id: campaignId,
        title: targetPrompt.slice(0, 30) + (targetPrompt.length > 30 ? "..." : ""),
        prompt: targetPrompt,
        tone,
        colorTheme,
        targetAudience,
        socialCopy: campaignData.socialCopy,
        adCopy: campaignData.adCopy,
        imagePrompt: campaignData.imagePrompt,
        imageUrl: imageData.url,
        landingPageHtml: campaignData.landingPageHtml,
        createdAt: Date.now()
      }

      // Add to state and save
      const updatedCampaigns = [newCampaign, ...campaigns]
      setCurrentCampaignId(campaignId)
      await syncCampaigns(updatedCampaigns)
      await saveCampaignToFirestore(newCampaign)
      
      // Clean controls
      setPrompt("")
      setTweaks({ social: "", ads: "", image: "", landing: "" })
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Refine and tweak an individual component (Local Tweak Handler)
  const handleRefineAsset = async (assetType: "landingPageHtml" | "socialCopy" | "adCopy" | "imagePrompt", instruction: string) => {
    if (!activeCampaign || !instruction.trim()) return

    setTweakLoadingAsset(assetType)
    setError("")

    try {
      // 1. Send modification instructions to the refine pipeline
      const tweakRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activeCampaign.prompt,
          tweakAsset: assetType,
          tweakInstruction: instruction,
          previousCampaignState: {
            socialCopy: activeCampaign.socialCopy,
            adCopy: activeCampaign.adCopy,
            imagePrompt: activeCampaign.imagePrompt,
            landingPageHtml: activeCampaign.landingPageHtml
          }
        })
      })

      if (!tweakRes.ok) {
        const errorData = await tweakRes.json()
        throw new Error(errorData.error || "Failed to refine the selected asset.")
      }

      const updatedCampaignData = await tweakRes.json()
      let finalImageUrl = activeCampaign.imageUrl

      // 2. If the prompt description changes, update the image visual too!
      if (assetType === "imagePrompt") {
        const imageRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePrompt: updatedCampaignData.imagePrompt })
        })
        if (imageRes.ok) {
          const img = await imageRes.json()
          finalImageUrl = img.url
        }
      }

      // 3. Save refined changes back into active campaign record
      const refinedCampaign: Campaign = {
        ...activeCampaign,
        socialCopy: updatedCampaignData.socialCopy,
        adCopy: updatedCampaignData.adCopy,
        imagePrompt: updatedCampaignData.imagePrompt,
        landingPageHtml: updatedCampaignData.landingPageHtml,
        imageUrl: finalImageUrl
      }

      const updatedCampaigns = campaigns.map(c => c.id === refinedCampaign.id ? refinedCampaign : c)
      await syncCampaigns(updatedCampaigns)
      await saveCampaignToFirestore(refinedCampaign)

      // Clear localized tweak text box
      setTweaks(prev => {
        if (assetType === "socialCopy") return { ...prev, social: "" }
        if (assetType === "adCopy") return { ...prev, ads: "" }
        if (assetType === "imagePrompt") return { ...prev, image: "" }
        if (assetType === "landingPageHtml") return { ...prev, landing: "" }
        return prev
      })
    } catch (err: any) {
      setError(`Failed to refine asset: ${err.message}`)
    } finally {
      setTweakLoadingAsset(null)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex h-dvh overflow-hidden font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/35 z-30 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Campaign History Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-brand-border transition-transform duration-300 flex flex-col`}>
        <div className="p-4 border-b border-brand-border flex items-center justify-between bg-white shrink-0 h-16">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">Return Home</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-900 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 shrink-0">
          <Button onClick={startNewCampaign} variant="outline" className="w-full justify-start gap-2 border-brand-border bg-white hover:bg-brand-primary/5 text-brand-primary h-12 rounded-xl transition-all font-medium">
            <Plus className="w-5 h-5" />
            New Campaign
          </Button>
        </div>

        {/* Saved campaigns list */}
        <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1.5 scrollbar-thin">
          {campaigns.map(c => (
            <div 
              key={c.id} 
              className={`group relative rounded-xl border transition-all duration-200 flex items-center ${
                currentCampaignId === c.id 
                  ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary shadow-xs" 
                  : "bg-white border-transparent hover:bg-gray-50 text-gray-600"
              }`}
            >
              <button
                onClick={() => { 
                  setCurrentCampaignId(c.id); 
                  if (window.innerWidth < 768) setSidebarOpen(false); 
                }}
                className="flex-1 py-3.5 pl-4 pr-10 flex items-center gap-3 text-left overflow-hidden"
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-80" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-semibold">{c.title}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
              <button 
                onClick={(e) => handleDeleteCampaign(e, c.id)} 
                className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity absolute right-2 text-gray-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="text-center text-sm text-gray-400 mt-12 px-4 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2.5" />
              Your campaign catalog will appear here.
            </div>
          )}
        </div>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-brand-border bg-white shrink-0">
          <div className="flex items-center gap-3 mb-3 px-1">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User Profile"} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-brand-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm shrink-0">
                {(user?.displayName || user?.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {user?.displayName || user?.email}
              </span>
              <span className="text-[10px] text-gray-400">Creator Workspace</span>
            </div>
          </div>
          <Button 
            onClick={async () => {
              try {
                await signOut(auth);
                router.push("/");
              } catch (err) {}
            }} 
            variant="outline" 
            className="w-full justify-center gap-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 h-10 rounded-xl text-xs font-semibold transition-colors"
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Workspace Area */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-gray-50/50">
        {/* Mobile Header Bar */}
        <header className="md:hidden h-16 border-b border-brand-border flex items-center justify-between px-4 bg-white shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-extrabold tracking-tight text-gray-900">
              Pomelli<span className="text-brand-primary">AI</span>
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">v2.0 Workspace</span>
        </header>

        {/* Main Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 scroll-smooth scrollbar-thin">
          <div className="max-w-[1300px] mx-auto space-y-8">
            
            {/* Input Form Card */}
            {!activeCampaign && !isGenerating ? (
              <div className="max-w-3xl mx-auto py-12 md:py-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center mb-6 shadow-xs relative">
                  <Sparkles className="w-8 h-8 text-brand-primary animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                  Generate complete campaigns <br />
                  <span className="text-brand-primary bg-linear-to-r from-brand-primary to-violet-600 bg-clip-text text-transparent">in a single click.</span>
                </h1>
                <p className="text-lg text-gray-500 max-w-lg mb-10 leading-relaxed">
                  Enter your business info to instantly spawn high-converting landing pages, custom graphics, Google ads, and engaging social posts.
                </p>

                {/* Main Generation Portal */}
                <div className="w-full bg-white rounded-3xl border border-brand-border p-6 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-brand-primary via-purple-500 to-indigo-600" />
                  <form onSubmit={handleGenerateCampaign} className="space-y-5">
                    <div>
                      <label className="block text-left text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">What product or service are we launching?</label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., A premium, modern desk lamp that aligns with your circadian rhythms using intelligent dynamic light spectra..."
                        className="w-full min-h-[100px] bg-gray-50/50 border border-brand-border rounded-2xl p-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-base transition-all resize-none"
                        required
                      />
                    </div>

                    {/* Advanced Controls Toggle */}
                    <div className="border-t border-gray-100 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setAdvancedOpen(!advancedOpen)}
                        className="flex items-center gap-2 text-xs font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`} />
                        {advancedOpen ? "Hide Advanced Settings" : "Configure Custom Color Themes & Tones"}
                      </button>

                      {/* Advanced Accordion Panel */}
                      <AnimatePresence>
                        {advancedOpen && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden text-left space-y-5 mt-4 pt-1"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Tone of Voice */}
                              <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tone of Voice</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {TONES.map(t => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => setTone(t)}
                                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                                        tone === t 
                                          ? "bg-brand-primary text-white border-brand-primary shadow-sm" 
                                          : "bg-white border-brand-border text-gray-600 hover:bg-gray-50"
                                      }`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Target Audience */}
                              <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Audience</label>
                                <input 
                                  type="text" 
                                  value={targetAudience}
                                  onChange={(e) => setTargetAudience(e.target.value)}
                                  placeholder="E.g., Tech Professionals, Gen Z..."
                                  className="w-full h-[40px] px-4 bg-gray-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
                              </div>
                            </div>

                            {/* Color Palette */}
                            <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Landing Page Accent Theme</label>
                              <div className="flex flex-wrap gap-2.5">
                                {COLOR_THEMES.map(theme => (
                                  <button
                                    key={theme.name}
                                    type="button"
                                    onClick={() => setColorTheme(theme.value)}
                                    className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                                      colorTheme === theme.value 
                                        ? "bg-gray-900 text-white border-gray-900 shadow-sm" 
                                        : "bg-white border-brand-border text-gray-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span className={`w-3 h-3 rounded-full ${theme.bgClass} shrink-0`} />
                                    {theme.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={isGenerating || !prompt.trim()} 
                      className="w-full rounded-2xl h-14 text-base font-bold shadow-md hover:shadow-lg transition-all gap-2.5"
                    >
                      <Sparkles className="w-5 h-5 shrink-0" />
                      Create Marketing Assets
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}

            {/* ERROR CARD */}
            {error && (
              <div className="p-4.5 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm max-w-4xl mx-auto flex items-start gap-3 shadow-xs">
                <Info className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <span className="font-bold block mb-0.5">Campaign Process Error</span>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* SKELETON LOADER PANEL */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-[1200px] mx-auto space-y-8"
                >
                  <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-sm text-center max-w-2xl mx-auto space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-primary mx-auto mb-2" />
                    <h2 className="text-xl font-extrabold text-gray-900">Assembling Marketing Universe...</h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Gemini is generating beautiful copywriting, target ad systems, and coding the Tailwind HTML page layout. Please hold on a moment!
                    </p>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-brand-primary"
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      />
                    </div>
                  </div>

                  {/* Skeletons of dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs space-y-4 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-md w-1/3" />
                        <div className="h-24 bg-gray-100 rounded-2xl w-full" />
                        <div className="h-10 bg-gray-200 rounded-xl w-1/4" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GENERATED CAMPAIGN WORKSPACE DASHBOARD */}
            {!isGenerating && activeCampaign && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Active Campaign Header Bar */}
                <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full">
                        {activeCampaign.tone} Tone
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          COLOR_THEMES.find(ct => ct.value === activeCampaign.colorTheme)?.bgClass || "bg-indigo-600"
                        }`} />
                        {activeCampaign.colorTheme} Palette
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 truncate">
                      {activeCampaign.title}
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Prompt: <span className="italic font-medium">"{activeCampaign.prompt}"</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <Button 
                      onClick={() => {
                        setPrompt(activeCampaign.prompt);
                        setTone(activeCampaign.tone);
                        setColorTheme(activeCampaign.colorTheme);
                        setTargetAudience(activeCampaign.targetAudience);
                        setAdvancedOpen(true);
                        setCurrentCampaignId(null);
                      }} 
                      variant="outline" 
                      className="flex-1 md:flex-initial h-11 border-brand-border rounded-xl font-semibold gap-2 hover:bg-gray-50 text-gray-700 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </Button>
                    <Button 
                      onClick={startNewCampaign} 
                      className="flex-1 md:flex-initial h-11 rounded-xl font-bold gap-2 text-sm shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      New Launch
                    </Button>
                  </div>
                </div>

                {/* Dashboard Grid Modules */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Module 1: Social Media Card */}
                  <div className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden flex flex-col h-[520px] relative">
                    <div className="p-5 border-b border-brand-border flex items-center justify-between bg-white sticky top-0 z-10">
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                          Social Post Copy
                        </h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Optimized for engagement and reach</p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyText(activeCampaign.socialCopy, "social")}
                        className="rounded-lg h-9 border-brand-border hover:bg-gray-50 gap-1.5 font-semibold text-xs text-gray-600"
                      >
                        {copiedStates["social"] ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Copy
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Social Post Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                      {/* Social Media Post Mockup Container */}
                      <div className="border border-gray-150 rounded-2xl bg-white p-5 shadow-2xs space-y-3.5">
                        {/* Profile line */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center font-extrabold text-brand-primary text-sm shrink-0">
                            {activeCampaign.title.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              {activeCampaign.title.split(" ")[0]} Official
                              <span className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">✓</span>
                            </div>
                            <div className="text-[10px] text-gray-400">@launch_campaigns · Sponsor</div>
                          </div>
                        </div>

                        {/* Content text */}
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap select-text">
                          {activeCampaign.socialCopy}
                        </p>
                      </div>
                    </div>

                    {/* Inline Tweak Input Footer */}
                    <div className="p-4 border-t border-brand-border bg-gray-50/50 flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={tweaks.social}
                        onChange={(e) => setTweaks(prev => ({ ...prev, social: e.target.value }))}
                        placeholder="Make it more witty, or shorter..."
                        className="flex-1 h-10 px-4 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-gray-800 placeholder:text-gray-400"
                        disabled={tweakLoadingAsset !== null}
                      />
                      <Button 
                        size="sm"
                        disabled={tweakLoadingAsset !== null || !tweaks.social.trim()}
                        onClick={() => handleRefineAsset("socialCopy", tweaks.social)}
                        className="h-10 rounded-xl px-4 text-xs font-bold gap-1.5 shrink-0 shadow-xs"
                      >
                        {tweakLoadingAsset === "socialCopy" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Tweak
                      </Button>
                    </div>
                  </div>

                  {/* Module 2: High-Converting Ad Previews */}
                  <div className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden flex flex-col h-[520px] relative">
                    <div className="p-5 border-b border-brand-border flex items-center justify-between bg-white sticky top-0 z-10">
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                          Marketing Ad Copy
                        </h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Google search & social media feed placement</p>
                      </div>
                      
                      {/* Platform Switches */}
                      <div className="flex border border-brand-border rounded-xl p-0.5 bg-gray-50">
                        <button
                          onClick={() => setAdPreviewPlatform("google")}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                            adPreviewPlatform === "google" 
                              ? "bg-white text-gray-900 shadow-3xs" 
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Google Search
                        </button>
                        <button
                          onClick={() => setAdPreviewPlatform("facebook")}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                            adPreviewPlatform === "facebook" 
                              ? "bg-white text-gray-900 shadow-3xs" 
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Facebook Feed
                        </button>
                      </div>
                    </div>

                    {/* Ads Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                      
                      {/* Render Google Search Preview */}
                      {adPreviewPlatform === "google" && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Search Engine Placement Mockup</span>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              onClick={() => handleCopyText(`Headline: ${activeCampaign.adCopy.googleSearch.headline}\nDescription: ${activeCampaign.adCopy.googleSearch.description}`, "googleAd")}
                              className="rounded-lg h-7 px-2.5 border-brand-border text-[10px] font-medium text-gray-600"
                            >
                              {copiedStates["googleAd"] ? "Copied" : "Copy Google Ad"}
                            </Button>
                          </div>
                          
                          <div className="border border-gray-150 rounded-2xl bg-white p-5 shadow-2xs space-y-2 select-text">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span>https://www.google.com</span>
                              <span className="text-gray-300">/</span>
                              <span className="font-semibold text-gray-600">{activeCampaign.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}</span>
                              <span className="px-1 py-0.5 bg-gray-100 border border-gray-200 text-[8px] font-bold text-gray-500 rounded ml-auto">Ad</span>
                            </div>
                            <h3 className="text-lg font-semibold text-blue-800 hover:underline leading-snug">
                              {activeCampaign.adCopy.googleSearch.headline}
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {activeCampaign.adCopy.googleSearch.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Render Facebook Feed Preview */}
                      {adPreviewPlatform === "facebook" && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Feed Visual Placement Mockup</span>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              onClick={() => handleCopyText(`Header: ${activeCampaign.adCopy.facebookFeed.headline}\nCopy: ${activeCampaign.adCopy.facebookFeed.description}\nCTA: ${activeCampaign.adCopy.facebookFeed.cta}`, "fbAd")}
                              className="rounded-lg h-7 px-2.5 border-brand-border text-[10px] font-medium text-gray-600"
                            >
                              {copiedStates["fbAd"] ? "Copied" : "Copy Facebook Ad"}
                            </Button>
                          </div>

                          <div className="border border-gray-150 rounded-2xl bg-white overflow-hidden shadow-2xs select-text">
                            {/* Profile details */}
                            <div className="p-4 flex items-center gap-2.5 border-b border-gray-50">
                              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-extrabold text-brand-primary text-xs">
                                {activeCampaign.title.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                  {activeCampaign.title.split(" ")[0]}
                                  <span className="w-2.5 h-2.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[5px] font-bold">✓</span>
                                </div>
                                <div className="text-[9px] text-gray-400">Sponsored</div>
                              </div>
                            </div>

                            {/* Feed Narrative */}
                            <p className="p-4 pt-3.5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {activeCampaign.adCopy.facebookFeed.description}
                            </p>

                            {/* visual placeholder (uses dynamic active visual generated image) */}
                            <div className="bg-gray-100 h-44 relative overflow-hidden flex items-center justify-center border-y border-gray-100">
                              <img 
                                src={activeCampaign.imageUrl} 
                                alt="Campaign Display visual"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Landing CTA row */}
                            <div className="bg-gray-50 p-4.5 flex justify-between items-center border-t border-gray-100 gap-3">
                              <div className="min-w-0">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">SPONSORED CAMPAIGN</span>
                                <h4 className="text-sm font-bold text-gray-900 truncate mt-0.5">{activeCampaign.adCopy.facebookFeed.headline}</h4>
                              </div>
                              <button className="px-4 py-2 bg-gray-250 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors text-gray-800 shrink-0">
                                {activeCampaign.adCopy.facebookFeed.cta}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inline Tweak Input Footer */}
                    <div className="p-4 border-t border-brand-border bg-gray-50/50 flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={tweaks.ads}
                        onChange={(e) => setTweaks(prev => ({ ...prev, ads: e.target.value }))}
                        placeholder="Change call to action, make it more bold..."
                        className="flex-1 h-10 px-4 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-gray-800 placeholder:text-gray-400"
                        disabled={tweakLoadingAsset !== null}
                      />
                      <Button 
                        size="sm"
                        disabled={tweakLoadingAsset !== null || !tweaks.ads.trim()}
                        onClick={() => handleRefineAsset("adCopy", tweaks.ads)}
                        className="h-10 rounded-xl px-4 text-xs font-bold gap-1.5 shrink-0 shadow-xs"
                      >
                        {tweakLoadingAsset === "adCopy" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Tweak
                      </Button>
                    </div>
                  </div>

                  {/* Module 3: AI Generated Visual (Text-to-Image) */}
                  <div className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden flex flex-col h-[520px] relative">
                    <div className="p-5 border-b border-brand-border flex items-center justify-between bg-white sticky top-0 z-10">
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-pulse" />
                          AI Visual Graphic
                        </h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">High-quality context matching marketing image</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Download Photo Button */}
                        <a 
                          href={activeCampaign.imageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          download="campaign_graphic.jpg"
                          className="rounded-lg h-9 px-3 border border-brand-border hover:bg-gray-50 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 bg-white transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </div>
                    </div>

                    {/* Image visual canvas area */}
                    <div className="flex-1 p-6 flex flex-col bg-gray-50 items-center justify-center overflow-hidden">
                      <div className="w-full max-w-[420px] bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full max-h-[360px] relative group">
                        
                        {/* The generated visual rendering */}
                        <div className="flex-1 w-full h-full relative overflow-hidden bg-gray-100 flex items-center justify-center">
                          <img 
                            src={activeCampaign.imageUrl} 
                            alt="Campaign generated layout visual"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                            loading="eager"
                          />
                        </div>

                        {/* Visual overlay description descriptor info */}
                        <div className="bg-white border-t border-gray-100 p-3 select-text">
                          <div className="text-[9px] font-bold text-violet-600 uppercase tracking-wide">Image Design Descriptor Prompt</div>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5 italic">"{activeCampaign.imagePrompt}"</p>
                        </div>
                      </div>
                    </div>

                    {/* Inline Tweak Input Footer */}
                    <div className="p-4 border-t border-brand-border bg-white flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={tweaks.image}
                        onChange={(e) => setTweaks(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="E.g., Make it look flatlay, change to sunrise warm tones..."
                        className="flex-1 h-10 px-4 bg-gray-50 border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-gray-800 placeholder:text-gray-400"
                        disabled={tweakLoadingAsset !== null}
                      />
                      <Button 
                        size="sm"
                        disabled={tweakLoadingAsset !== null || !tweaks.image.trim()}
                        onClick={() => handleRefineAsset("imagePrompt", tweaks.image)}
                        className="h-10 rounded-xl px-4 text-xs font-bold gap-1.5 shrink-0 shadow-xs"
                      >
                        {tweakLoadingAsset === "imagePrompt" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  {/* Empty placeholder card to align layout if needed (can contain metadata details) */}
                  <div className="bg-linear-to-br from-brand-primary/5 via-violet-500/5 to-transparent rounded-3xl border border-dashed border-brand-primary/20 shadow-none p-8 flex flex-col justify-center items-center h-[520px] text-center space-y-4">
                    <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary flex items-center justify-center rounded-2xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="max-w-xs">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">Launch Campaign Ready</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Your copy, visual design, and mini landing page codes are completely synchronized and live in local/cloud persistence.
                      </p>
                    </div>
                    
                    {/* Diagnostic specifications */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4 w-full max-w-sm text-left text-[11px] space-y-2 text-gray-600 shadow-3xs">
                      <div className="flex justify-between"><span className="font-semibold text-gray-400">Campaign ID</span> <span className="font-mono">{activeCampaign.id}</span></div>
                      <div className="flex justify-between"><span className="font-semibold text-gray-400">Primary Color Theme</span> <span>{activeCampaign.colorTheme}</span></div>
                      <div className="flex justify-between"><span className="font-semibold text-gray-400">Tone Profile</span> <span>{activeCampaign.tone}</span></div>
                      <div className="flex justify-between"><span className="font-semibold text-gray-400">Target Segment</span> <span className="truncate max-w-[180px]">{activeCampaign.targetAudience}</span></div>
                      <div className="flex justify-between"><span className="font-semibold text-gray-400">Images Generated</span> <span className="text-emerald-600 font-bold">1 (Active FLUX Engine)</span></div>
                    </div>
                  </div>
                </div>

                {/* Module 4: The Massive Landing Page Workspace */}
                <div className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden flex flex-col h-[750px] relative">
                  
                  {/* Workspace Toolbar Header */}
                  <div className="p-5 border-b border-brand-border bg-white sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                        Responsive Landing Page Workspace
                      </h2>
                      <p className="text-[11px] text-gray-400 mt-0.5">Self-contained, high-converting Tailwind CSS webpage</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      
                      {/* Responsive device resizing buttons */}
                      {activeLandingTab === "preview" && (
                        <div className="flex border border-brand-border rounded-xl p-0.5 bg-gray-50">
                          <button
                            onClick={() => setIframeWidth("100%")}
                            className={`p-2 rounded-lg transition-all ${
                              iframeWidth === "100%" 
                                ? "bg-white text-brand-primary shadow-3xs" 
                                : "text-gray-400 hover:text-gray-700"
                            }`}
                            title="Desktop Viewport"
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setIframeWidth("768px")}
                            className={`p-2 rounded-lg transition-all ${
                              iframeWidth === "768px" 
                                ? "bg-white text-brand-primary shadow-3xs" 
                                : "text-gray-400 hover:text-gray-700"
                            }`}
                            title="Tablet Viewport"
                          >
                            <Tablet className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setIframeWidth("375px")}
                            className={`p-2 rounded-lg transition-all ${
                              iframeWidth === "375px" 
                                ? "bg-white text-brand-primary shadow-3xs" 
                                : "text-gray-400 hover:text-gray-700"
                            }`}
                            title="Mobile Viewport"
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Display toggle tabs (Preview vs Raw Code) */}
                      <div className="flex border border-brand-border rounded-xl p-0.5 bg-gray-50">
                        <button
                          onClick={() => setActiveLandingTab("preview")}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                            activeLandingTab === "preview" 
                              ? "bg-white text-gray-900 shadow-3xs" 
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Live Preview
                        </button>
                        <button
                          onClick={() => setActiveLandingTab("code")}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                            activeLandingTab === "code" 
                              ? "bg-white text-gray-900 shadow-3xs" 
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          <Code className="w-3.5 h-3.5" />
                          Raw HTML
                        </button>
                      </div>

                      {/* Code Export Controls */}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCopyText(activeCampaign.landingPageHtml, "html")}
                          className="rounded-lg h-9 border-brand-border text-xs font-semibold text-gray-600 bg-white"
                        >
                          {copiedStates["html"] ? "Copied HTML" : "Copy Code"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadFile(activeCampaign.landingPageHtml, "landing_page.html", "text/html")}
                          className="rounded-lg h-9 border-brand-border text-xs font-semibold text-gray-600 bg-white"
                        >
                          Download HTML
                        </Button>
                      </div>

                    </div>
                  </div>

                  {/* Sandboxed Interactive Preview (Iframe Container) */}
                  <div className="flex-1 bg-gray-100/50 flex justify-center items-center overflow-hidden p-6 relative">
                    
                    {activeLandingTab === "preview" ? (
                      <div 
                        className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md transition-all duration-300 relative flex flex-col"
                        style={{ width: iframeWidth }}
                      >
                        {/* Device screen indicator header */}
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-250 flex items-center text-[10px] font-bold tracking-wide text-gray-400 gap-2 shrink-0">
                          <div className="flex gap-1.5 mr-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                          </div>
                          <span>https://yourbrand.live/landing-preview</span>
                          <span className="ml-auto px-2 py-0.5 bg-gray-250 rounded text-gray-500">
                            {iframeWidth === "100%" ? "Desktop Grid" : iframeWidth === "768px" ? "Tablet Mode" : "Mobile Frame"}
                          </span>
                        </div>

                        {/* Dynamic Render Sandbox iframe via direct srcDoc attribute */}
                        <iframe 
                          srcDoc={activeCampaign.landingPageHtml} 
                          title="Landing page preview sandbox"
                          className="flex-1 w-full border-none bg-white select-none"
                          sandbox="allow-scripts"
                        />
                      </div>
                    ) : (
                      // Raw HTML Display Box
                      <div className="w-full h-full max-w-5xl bg-slate-900 border border-slate-950 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                        <div className="bg-slate-950 px-4 py-2 text-[10px] text-slate-400 font-mono flex items-center border-b border-slate-900 shrink-0">
                          <span>landing_page.html</span>
                          <span className="ml-auto text-brand-primary font-bold">Pure HTML5</span>
                        </div>
                        <pre className="flex-1 overflow-auto p-5 text-left text-xs font-mono text-emerald-400 leading-relaxed select-text select-all bg-slate-950/80">
                          <code>{activeCampaign.landingPageHtml}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Inline Tweak Input Footer */}
                  <div className="p-4 border-t border-brand-border bg-white flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={tweaks.landing}
                      onChange={(e) => setTweaks(prev => ({ ...prev, landing: e.target.value }))}
                      placeholder="Make it a dark mode page, add more features grid, modify pricing tiers..."
                      className="flex-1 h-10 px-4 bg-gray-50 border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-gray-800 placeholder:text-gray-400"
                      disabled={tweakLoadingAsset !== null}
                    />
                    <Button 
                      size="sm"
                      disabled={tweakLoadingAsset !== null || !tweaks.landing.trim()}
                      onClick={() => handleRefineAsset("landingPageHtml", tweaks.landing)}
                      className="h-10 rounded-xl px-4 text-xs font-bold gap-1.5 shrink-0 shadow-xs"
                    >
                      {tweakLoadingAsset === "landingPageHtml" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Tweak Landing
                    </Button>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  )
}
