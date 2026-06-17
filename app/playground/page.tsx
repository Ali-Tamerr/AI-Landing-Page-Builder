"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Sparkles, Send, Loader2, MessageSquare, Plus, Trash2, Menu, X,
  Copy, Download, Monitor, Tablet, Smartphone, Code, Eye, Info, ChevronDown, Settings, Globe
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore"

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  createdAt: number;
}

interface WebProject {
  id: string;
  title: string;
  prompt: string;
  tone: string;
  colorTheme: string;
  targetAudience: string;
  landingPageHtml: string;
  messages: ChatMessage[];
  createdAt: number;
}

const TONES = ["Professional", "Witty", "Bold", "Minimalist", "Luxury"];
const COLOR_THEMES = [
  { name: "Indigo", value: "Indigo", bgClass: "bg-indigo-600" },
  { name: "Emerald", value: "Emerald", bgClass: "bg-emerald-600" },
  { name: "Violet", value: "Violet", bgClass: "bg-violet-600" },
  { name: "Rose", value: "Rose", bgClass: "bg-rose-600" },
  { name: "Amber", value: "Amber", bgClass: "bg-amber-500" },
  { name: "Dark Theme", value: "Dark Theme", bgClass: "bg-slate-900" }
];

const BUILD_STEPS = [
  "Analyzing prompt & mapping wireframe...",
  "Drafting core component structures...",
  "Applying premium Tailwind classes & theme...",
  "Refining styles & verifying layout grids...",
  "Rendering finalized website preview..."
];

function BuildProgressIndicator({ step }: { step: number }) {
  return (
    <div className="space-y-2.5 bg-gray-55/60 p-5 rounded-2xl border border-gray-150 text-left max-w-sm mx-auto shadow-xs">
      {BUILD_STEPS.map((text, idx) => {
        const isCurrent = idx === step
        const isCompleted = idx < step
        return (
          <div key={idx} className="flex items-center gap-3 text-xs transition-opacity duration-300">
            {isCompleted ? (
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-extrabold text-[9px] shrink-0">✓</span>
            ) : isCurrent ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-gray-200 shrink-0" />
            )}
            <span className={`font-semibold truncate ${
              isCompleted 
                ? "text-gray-400 line-through decoration-gray-300" 
                : isCurrent 
                  ? "text-brand-primary" 
                  : "text-gray-500"
            }`}>
              {text}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PlaygroundContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt") || ""
  
  // Auth state
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Projects state
  const [projects, setProjects] = useState<WebProject[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  
  // Form Inputs & Chat Input
  const [chatInput, setChatInput] = useState("")
  const [loaderMinimized, setLoaderMinimized] = useState(false)
  const [buildStep, setBuildStep] = useState(0)
  const [tone, setTone] = useState("Professional")
  const [colorTheme, setColorTheme] = useState("Indigo")
  const [targetAudience, setTargetAudience] = useState("General Audience")
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  // Statuses
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  // Workspace controls
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview")
  const [iframeWidth, setIframeWidth] = useState<"100%" | "768px" | "375px">("100%")

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Lifted build step status and minimize state timers
  useEffect(() => {
    if (!isGenerating) {
      setBuildStep(0)
      return
    }
    const timers = [
      setTimeout(() => setBuildStep(1), 3500),
      setTimeout(() => setBuildStep(2), 7000),
      setTimeout(() => setBuildStep(3), 10500),
      setTimeout(() => setBuildStep(4), 14000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [isGenerating])

  // Client-side Authentication Guard
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

  // Load projects from local storage / Firestore
  useEffect(() => {
    if (!user) return

    const loadProjects = async () => {
      try {
        const projectsRef = collection(db, "users", user.uid, "projects")
        const q = query(projectsRef, orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)
        
        const fetchedProjects: WebProject[] = []
        querySnapshot.forEach((docSnap) => {
          fetchedProjects.push(docSnap.data() as WebProject)
        })

        if (fetchedProjects.length > 0) {
          setProjects(fetchedProjects)
          const storedActiveId = localStorage.getItem(`copyai_active_project_${user.uid}`)
          if (storedActiveId && fetchedProjects.some(p => p.id === storedActiveId)) {
            setCurrentProjectId(storedActiveId)
          } else {
            setCurrentProjectId(fetchedProjects[0].id)
          }
          return
        }
      } catch (firestoreErr) {
        console.warn("Firestore access failed, falling back to localStorage:", firestoreErr)
      }

      // Fallback: LocalStorage
      const saved = localStorage.getItem(`copyai_projects_${user.uid}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as WebProject[]
          setProjects(parsed)
          const storedActiveId = localStorage.getItem(`copyai_active_project_${user.uid}`)
          if (storedActiveId && parsed.some(p => p.id === storedActiveId)) {
            setCurrentProjectId(storedActiveId)
          } else if (parsed.length > 0) {
            setCurrentProjectId(parsed[0].id)
          }
        } catch (e) {}
      }
    }

    loadProjects()
  }, [user])

  // Save projects change to LocalStorage & Firestore
  const syncProjects = async (updatedList: WebProject[]) => {
    if (!user) return
    setProjects(updatedList)
    localStorage.setItem(`copyai_projects_${user.uid}`, JSON.stringify(updatedList))
    if (currentProjectId) {
      localStorage.setItem(`copyai_active_project_${user.uid}`, currentProjectId)
    }
  }

  const saveProjectToFirestore = async (project: WebProject) => {
    if (!user) return
    try {
      const projectDocRef = doc(db, "users", user.uid, "projects", project.id)
      await setDoc(projectDocRef, project)
    } catch (e) {
      console.error("Failed to sync project to firestore:", e)
    }
  }

  // Handle Initial Prompt from home page Hero
  const hasRunInitialPrompt = useRef(false)
  useEffect(() => {
    if (initialPrompt && user && !hasRunInitialPrompt.current && projects.length === 0) {
      hasRunInitialPrompt.current = true
      handleSendMessage(undefined, initialPrompt)
      router.replace("/playground")
    }
  }, [initialPrompt, user, projects.length])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [projects, currentProjectId, isGenerating])

  const activeProject = projects.find(p => p.id === currentProjectId)

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

  const startNewProject = () => {
    setCurrentProjectId(null)
    setChatInput("")
    setError("")
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!user) return

    const updated = projects.filter(p => p.id !== id)
    await syncProjects(updated)
    
    if (currentProjectId === id) {
      setCurrentProjectId(updated.length > 0 ? updated[0].id : null)
    }

    try {
      const projectDocRef = doc(db, "users", user.uid, "projects", id)
      await deleteDoc(projectDocRef)
    } catch (err) {}
  }

  // Unified Handler for prompt generation and chat editing
  const handleSendMessage = async (e?: React.FormEvent, overridePrompt?: string) => {
    e?.preventDefault()
    const promptToSend = overridePrompt || chatInput
    if (!promptToSend.trim()) return

    setIsGenerating(true)
    setLoaderMinimized(false)
    setError("")
    if (!overridePrompt) setChatInput("")

    // Generate message IDs
    const userMsgId = `msg-${Date.now()}`
    const aiMsgId = `msg-${Date.now() + 1}`

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: promptToSend,
      createdAt: Date.now()
    }

    let updatedMessages: ChatMessage[] = []
    let previousHtmlString = ""

    if (activeProject) {
      updatedMessages = [...activeProject.messages, userMessage]
      previousHtmlString = activeProject.landingPageHtml
    } else {
      updatedMessages = [userMessage]
    }

    try {
      const response = await fetch("/api/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          tone,
          colorTheme,
          targetAudience,
          previousHtml: previousHtmlString
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to generate website code.")
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: aiMsgId,
        sender: "assistant",
        text: data.thinking || "Landing page updated successfully!",
        createdAt: Date.now()
      }

      const finalMessages = [...updatedMessages, assistantMessage]

      if (activeProject) {
        const refinedProject: WebProject = {
          ...activeProject,
          landingPageHtml: data.landingPageHtml,
          messages: finalMessages
        }
        const updatedList = projects.map(p => p.id === refinedProject.id ? refinedProject : p)
        await syncProjects(updatedList)
        await saveProjectToFirestore(refinedProject)
      } else {
        const newProjectId = `proj-${Date.now()}`
        const newProject: WebProject = {
          id: newProjectId,
          title: promptToSend.slice(0, 30) + (promptToSend.length > 30 ? "..." : ""),
          prompt: promptToSend,
          tone,
          colorTheme,
          targetAudience,
          landingPageHtml: data.landingPageHtml,
          messages: finalMessages,
          createdAt: Date.now()
        }
        const updatedList = [newProject, ...projects]
        setCurrentProjectId(newProjectId)
        await syncProjects(updatedList)
        await saveProjectToFirestore(newProject)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while generating code.")
    } finally {
      setIsGenerating(false)
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
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Projects history */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-brand-border transition-transform duration-300 flex flex-col shrink-0`}>
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
          <Button onClick={startNewProject} variant="outline" className="w-full justify-start gap-2 border-brand-border bg-white hover:bg-brand-primary/5 text-brand-primary h-12 rounded-xl transition-all font-medium">
            <Plus className="w-5 h-5" />
            New Landing Page
          </Button>
        </div>

        {/* Saved projects list */}
        <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1.5 scrollbar-thin">
          {projects.map(p => (
            <div 
              key={p.id} 
              className={`group relative rounded-xl border transition-all duration-200 flex items-center ${
                currentProjectId === p.id 
                  ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary shadow-xs" 
                  : "bg-white border-transparent hover:bg-gray-50 text-gray-600"
              }`}
            >
              <button
                onClick={() => { 
                  setCurrentProjectId(p.id); 
                  if (window.innerWidth < 768) setSidebarOpen(false); 
                }}
                className="flex-1 py-3.5 pl-4 pr-10 flex items-center gap-3 text-left overflow-hidden"
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-80" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-semibold">{p.title}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
              <button 
                onClick={(e) => handleDeleteProject(e, p.id)} 
                className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity absolute right-2 text-gray-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center text-sm text-gray-400 mt-12 px-4 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2.5" />
              Your custom websites catalog will appear here.
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
              <span className="text-[10px] text-gray-400">Builder Workspace</span>
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

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-gray-50/50">
        {/* Mobile Header Bar */}
        <header className="md:hidden h-16 border-b border-brand-border flex items-center justify-between px-4 bg-white shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-extrabold tracking-tight text-gray-900">
              Pomelli<span className="text-brand-primary">AI</span>
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">Builder Workspace</span>
        </header>

        {/* Dual Pane Layout Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* LEFT PANE: Chat & Generation Inputs */}
          <div className="w-full lg:w-[480px] border-r border-brand-border bg-white flex flex-col h-full shrink-0">
            
            {/* Top Toolbar / Configuration */}
            <div className="p-4 border-b border-brand-border flex items-center justify-between shrink-0 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  {activeProject ? "Refining Site Layout" : "Create New Site"}
                </span>
              </div>

              {/* Simple Settings Toggle */}
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  settingsOpen || !activeProject
                    ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" 
                    : "bg-white border-brand-border text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Design System
              </button>
            </div>

            {/* Config accordion panel */}
            <AnimatePresence>
              {(settingsOpen || !activeProject) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-brand-border overflow-hidden bg-gray-50/30 shrink-0"
                >
                  <div className="p-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tone of Voice</label>
                        <select 
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full h-9 border border-brand-border rounded-lg bg-white px-2 focus:ring-2 focus:ring-brand-primary/20"
                        >
                          {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Color Palette</label>
                        <select 
                          value={colorTheme}
                          onChange={(e) => setColorTheme(e.target.value)}
                          className="w-full h-9 border border-brand-border rounded-lg bg-white px-2 focus:ring-2 focus:ring-brand-primary/20"
                        >
                          {COLOR_THEMES.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Audience</label>
                      <input 
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="E.g. Developers, Small business owners..."
                        className="w-full h-9 border border-brand-border rounded-lg bg-white px-3 focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-50/30">
              {activeProject ? (
                <>
                  {activeProject.messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div className={`text-[10px] text-gray-400 mb-1 px-1 font-semibold`}>
                        {msg.sender === "user" ? "You" : "Builder AI"}
                      </div>
                      <div 
                        className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-brand-primary text-white shadow-sm rounded-tr-none"
                            : "bg-white border border-brand-border text-gray-800 shadow-3xs rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="flex flex-col items-start">
                      <div className="text-[10px] text-gray-400 mb-1 px-1 font-semibold flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-brand-primary" />
                        AI Builder is designing...
                      </div>
                      <div className="bg-white border border-brand-border rounded-2xl rounded-tl-none p-4 shadow-3xs space-y-3 w-[85%]">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-150 rounded w-5/6 animate-pulse" />
                          <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
                          <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4 text-brand-primary relative">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">Welcome to Web Playground</h3>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    Type a description below to generate a beautiful website instantly. You can refine or modify sections via chat prompts.
                  </p>
                </div>
              )}
            </div>

            {/* Error Indicator */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border-t border-b border-red-100 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <p className="leading-snug">{error}</p>
              </div>
            )}

            {/* Chat Input form */}
            <div className="p-4 border-t border-brand-border bg-white shrink-0">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    activeProject 
                      ? "Ask to modify design, add features, change copy..." 
                      : "Describe your landing page idea..."
                  }
                  className="w-full min-h-[48px] max-h-[120px] pr-12 pl-4 py-3 border border-brand-border rounded-2xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none text-gray-800 placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isGenerating}
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={isGenerating || !chatInput.trim()}
                  className="absolute right-3 p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-colors disabled:opacity-40 disabled:hover:bg-brand-primary"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT PANE: Code & Website Live Preview Viewport */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100/50">
            
            {/* Top Preview Toolbar */}
            <div className="p-3.5 border-b border-brand-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              
              {/* Responsive Width toggles */}
              <div className="flex items-center gap-4">
                <div className="flex border border-brand-border rounded-xl p-0.5 bg-gray-50">
                  <button
                    onClick={() => setIframeWidth("100%")}
                    className={`p-1.5 rounded-lg transition-all ${
                      iframeWidth === "100%" 
                        ? "bg-white text-brand-primary shadow-3xs" 
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                    title="Desktop width"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIframeWidth("768px")}
                    className={`p-1.5 rounded-lg transition-all ${
                      iframeWidth === "768px" 
                        ? "bg-white text-brand-primary shadow-3xs" 
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                    title="Tablet width"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIframeWidth("375px")}
                    className={`p-1.5 rounded-lg transition-all ${
                      iframeWidth === "375px" 
                        ? "bg-white text-brand-primary shadow-3xs" 
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                    title="Mobile width"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                {activeProject && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                    Viewport: {iframeWidth === "100%" ? "Desktop" : iframeWidth === "768px" ? "Tablet" : "Mobile"}
                  </span>
                )}
              </div>

              {/* Mode switch (Live Preview / Code view) */}
              <div className="flex items-center gap-3">
                <div className="flex border border-brand-border rounded-xl p-0.5 bg-gray-50">
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                      activeTab === "preview" 
                        ? "bg-white text-gray-900 shadow-3xs" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </button>
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                      activeTab === "code" 
                        ? "bg-white text-gray-900 shadow-3xs" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Code View
                  </button>
                </div>

                {activeProject && (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyText(activeProject.landingPageHtml, "html")}
                      className="rounded-lg h-9 border-brand-border text-xs font-semibold text-gray-600 bg-white"
                    >
                      {copiedStates["html"] ? "Copied" : "Copy"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadFile(activeProject.landingPageHtml, "index.html", "text/html")}
                      className="rounded-lg h-9 border-brand-border text-xs font-semibold text-gray-600 bg-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

            </div>

            {/* Sandbox Canvas */}
            <div className="flex-1 p-4 lg:p-6 flex justify-center items-center overflow-hidden relative w-full h-full">
              {/* Active Build Loader Overlay */}
              <AnimatePresence>
                {isGenerating && !loaderMinimized && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn"
                  >
                    <div className="max-w-md w-full space-y-6">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-brand-primary/10 animate-ping" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-brand-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                        <div className="absolute inset-2 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                          <Sparkles className="w-8 h-8 animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold text-gray-950">AI Builder is constructing your site</h3>
                        <p className="text-xs text-gray-500">Writing code structure, content blocks, Tailwind variables, and layout sections...</p>
                      </div>

                      {/* Build Progress list */}
                      <BuildProgressIndicator step={buildStep} />

                      {/* Animated linear progress bar */}
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                        <motion.div 
                          className="h-full bg-linear-to-r from-brand-primary to-indigo-600"
                          animate={{ width: ["0%", "98%"] }}
                          transition={{ duration: 16, ease: "easeOut" }}
                        />
                      </div>

                      {/* Peeking minimize option */}
                      <div className="pt-2">
                        <button 
                          type="button"
                          onClick={() => setLoaderMinimized(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-brand-border bg-white hover:bg-gray-55 text-gray-600 rounded-xl text-xs font-semibold shadow-3xs transition-all hover:scale-102"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Live Preview While Building
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Loader Status Bar (Visible when loader is minimized during generation) */}
              {isGenerating && loaderMinimized && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white backdrop-blur-md shadow-md border border-slate-800 px-4 py-2.5 rounded-full z-20 flex items-center gap-3 text-xs transition-all">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary shrink-0" />
                  <span className="font-semibold text-slate-300">AI: {BUILD_STEPS[buildStep]}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <button 
                    type="button"
                    onClick={() => setLoaderMinimized(false)}
                    className="text-brand-primary hover:text-brand-primary-light font-bold flex items-center gap-1 bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide transition-colors"
                  >
                    Maximize Status
                  </button>
                </div>
              )}

              {activeProject ? (
                activeTab === "preview" ? (
                  <div 
                    className="h-full bg-white rounded-2xl border border-gray-250/80 overflow-hidden shadow-sm transition-all duration-300 relative flex flex-col"
                    style={{ width: iframeWidth }}
                  >
                    {/* Mock Browser Header */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200/80 flex items-center text-[10px] font-mono text-gray-400 gap-2 shrink-0">
                      <div className="flex gap-1.5 mr-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <span className="truncate">https://yourproject.live/preview</span>
                    </div>

                    <iframe 
                      srcDoc={activeProject.landingPageHtml} 
                      title="Landing page preview sandbox"
                      className="flex-1 w-full border-none bg-white"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : (
                  /* Code view code panel */
                  <div className="w-full h-full max-w-5xl bg-slate-900 border border-slate-950 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                    <div className="bg-slate-955 px-4 py-2 text-[10px] text-slate-400 font-mono flex items-center border-b border-slate-900 shrink-0">
                      <span>index.html</span>
                      <span className="ml-auto text-brand-primary font-bold">Pure Tailwind HTML</span>
                    </div>
                    <pre className="flex-1 overflow-auto p-5 text-left text-xs font-mono text-emerald-400 leading-relaxed select-text select-all bg-slate-950/80">
                      <code>{activeProject.landingPageHtml}</code>
                    </pre>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-400 p-8">
                  <div className="w-16 h-16 bg-white border border-brand-border rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-3xs text-gray-300">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-600 mb-1">Web Preview Canvas</h3>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    Once you submit a layout description, a live responsive preview frame will be compiled and displayed here.
                  </p>
                </div>
              )}
            </div>

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
