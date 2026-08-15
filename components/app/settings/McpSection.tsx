"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Copy, Check, Sparkles, Key, ExternalLink, Loader2, ShieldCheck, Zap, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsedAt: string | null
  createdAt: string
}

export function McpSection() {
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [selectedKey, setSelectedKey] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const fetchKeys = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/user/keys")
      if (!res.ok) throw new Error("Failed to fetch keys")
      const data = await res.json()
      const fetchedKeys: ApiKey[] = data.keys || []
      setKeys(fetchedKeys)
      if (fetchedKeys.length > 0) {
        setSelectedKey(fetchedKeys[0].key)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleGenerateDedicatedKey = async () => {
    setIsCreatingKey(true)
    try {
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Gemini Spark MCP Integration",
          scopes: ["all:all"],
        }),
      })

      if (!res.ok) throw new Error("Failed to create key")
      const data = await res.json()
      const newKey: ApiKey = data.apiKey
      setKeys([newKey, ...keys])
      setSelectedKey(newKey.key)
      toast({
        title: "Key Generated",
        description: "New API key created for Gemini Spark MCP integration.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      })
    } finally {
      setIsCreatingKey(false)
    }
  }

  const mcpUrl = selectedKey
    ? `${origin || "https://instantly-ai.vercel.app"}/api/mcp?apiKey=${selectedKey}`
    : `${origin || "https://instantly-ai.vercel.app"}/api/mcp`

  const handleCopyUrl = () => {
    if (!selectedKey) {
      toast({
        title: "Generate Key First",
        description: "Please create or select an API key to copy your personal MCP URL.",
        variant: "destructive",
      })
      return
    }
    navigator.clipboard.writeText(mcpUrl)
    setCopied(true)
    toast({
      title: "Copied to Clipboard",
      description: "Personal MCP link copied! Paste it in Gemini Spark.",
    })
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Main MCP Hero Card */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-[#0c0c0c] via-[#111116] to-[#0a1020] border border-blue-500/20 rounded-xl relative overflow-hidden shadow-2xl">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white font-outfit">Model Context Protocol (MCP)</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                  Gemini Spark & AI
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Connect Google Gemini Spark, Claude, and AI assistants to manage your cold email outreach securely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">MCP Server Live</span>
          </div>
        </div>

        {/* URL Box & Key Selector */}
        <div className="space-y-4 relative z-10 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs uppercase font-semibold tracking-wider text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              Your Personal Authenticated MCP Link
            </label>

            {keys.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">API Key:</span>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="bg-[#18181b] border border-[#333] text-gray-200 text-xs rounded px-2.5 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {keys.map((k) => (
                    <option key={k.id} value={k.key}>
                      {k.name} ({k.key.slice(0, 8)}...{k.key.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 font-mono text-xs text-blue-300 break-all select-all flex items-center justify-between shadow-inner">
              <span>{selectedKey ? mcpUrl : "No API key generated yet. Click 'Generate MCP Link' below."}</span>
            </div>

            {selectedKey ? (
              <Button
                onClick={handleCopyUrl}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-3 h-auto shrink-0 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied Link!" : "Copy Gemini Link"}
              </Button>
            ) : (
              <Button
                onClick={handleGenerateDedicatedKey}
                disabled={isCreatingKey}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-3 h-auto shrink-0 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                {isCreatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Generate MCP Link
              </Button>
            )}
          </div>

          <p className="text-[12px] text-gray-400 flex items-center gap-1.5">
            🔒 This link includes your personal API key. Any changes made through Gemini will be strictly isolated to your user account.
          </p>
        </div>
      </div>

      {/* How to use in Gemini Spark Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg space-y-2.5">
          <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
            1
          </div>
          <h4 className="text-white font-medium text-sm font-outfit">Open Gemini Spark</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Go to Google Gemini Spark and navigate to <strong>Connected Apps</strong> &gt; <strong>Custom apps for Spark</strong>.
          </p>
        </div>

        <div className="p-5 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg space-y-2.5">
          <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
            2
          </div>
          <h4 className="text-white font-medium text-sm font-outfit">Paste Your Link</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Paste your personalized URL into the <em>Add a custom app link</em> input and click <strong>Next</strong>.
          </p>
        </div>

        <div className="p-5 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg space-y-2.5">
          <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
            3
          </div>
          <h4 className="text-white font-medium text-sm font-outfit">Control with AI</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Ask Gemini in plain English to launch campaigns, draft sequences, check warmup health, or review replies!
          </p>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="p-6 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg space-y-3">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          Example Prompts to try in Gemini Spark
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {[
            "Create a new campaign named 'Q3 Founder Outreach' with a 50 emails/day limit.",
            "Draft a high-converting 3-step sequence for B2B SaaS Founders with 2-day gaps.",
            "Show me the deliverability and warmup health scores of my sender accounts.",
            "What are my overall campaign open rates and reply rates this week?",
          ].map((prompt, i) => (
            <div
              key={i}
              className="p-3 bg-[#111] border border-[#222] rounded-md text-xs text-gray-300 flex items-start gap-2 hover:border-[#333] transition-colors"
            >
              <span className="text-blue-400 font-mono">💬</span>
              <span>&ldquo;{prompt}&rdquo;</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
