"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { X, Play, Pause, RotateCw, Flame, Info, Users, ChevronDown, RefreshCw, Pencil, Bold, Italic, Underline, Type, Link2, Image as ImageIcon, Smile, Code, Tag, Rocket, Globe, Zap, Loader2, AlertTriangle, Send } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

interface AccountDetailPanelProps {
    account: any
    onClose: () => void
    onUpdate?: (account: any) => void
}

export function AccountDetailPanel({ account, onClose, onUpdate }: AccountDetailPanelProps) {
    const { toast } = useToast()
    const router = useRouter()

    // Form state
    const [firstName, setFirstName] = useState(account?.firstName || "")
    const [lastName, setLastName] = useState(account?.lastName || "")
    const [signature, setSignature] = useState(account?.signature || "")
    const [dailyLimit, setDailyLimit] = useState(account?.dailyLimit?.toString() || "300")
    const [minWaitTime, setMinWaitTime] = useState(account?.minWaitTime?.toString() || "1")
    const [slowRamp, setSlowRamp] = useState(account?.slowRamp || false)

    // Warmup state
    const [warmupEnabled, setWarmupEnabled] = useState(account?.warmupEnabled || false)
    const [warmupTag, setWarmupTag] = useState(account?.warmupTag || "")
    const [warmupDailyLimit, setWarmupDailyLimit] = useState(account?.warmupDailyLimit?.toString() || "50")
    const [warmupDailyIncrease, setWarmupDailyIncrease] = useState(account?.warmupDailyIncrease?.toString() || "4")
    const [warmupReplyRate, setWarmupReplyRate] = useState(account?.warmupReplyRate?.toString() || "30")

    // Account status
    const [status, setStatus] = useState(account?.status || "active")

    // Loading states
    const [saving, setSaving] = useState(false)
    const [toggling, setToggling] = useState(false)

    // Large limit warning modal state
    const [showLargeLimitWarning, setShowLargeLimitWarning] = useState(false)
    const [largeLimitAcknowledged, setLargeLimitAcknowledged] = useState(false)

    // Warmup data from API
    const [warmupStats, setWarmupStats] = useState({ received: 0, sent: 0, savedFromSpam: 0 })
    const [chartData, setChartData] = useState([
        { day: 'Wednesday', sent: 0 },
        { day: 'Thursday', sent: 0 },
        { day: 'Friday', sent: 0 },
        { day: 'Saturday', sent: 0 },
        { day: 'Sunday', sent: 0 },
        { day: 'Monday', sent: 0 },
        { day: 'Tuesday', sent: 0 },
    ])
    const [warmupStarted, setWarmupStarted] = useState<Date | null>(null)

    // Campaigns state
    const [campaigns, setCampaigns] = useState<{ id: string, name: string, status: string }[]>([])

    // Error state
    const [errorDetail, setErrorDetail] = useState(account?.errorDetail || "")

    // Reconnect state
    const [reconnecting, setReconnecting] = useState(false)
    const [reconnectAll, setReconnectAll] = useState(false)
    const [sendingTest, setSendingTest] = useState(false)
    const [testRecipient, setTestRecipient] = useState("")
    const [runningWarmup, setRunningWarmup] = useState(false)

    // Fetch account details with warmup stats
    useEffect(() => {
        if (account?.id) {
            fetchAccountDetails()
        }
    }, [account?.id])

    const fetchAccountDetails = async () => {
        try {
            const res = await fetch(`/api/accounts/${account.id}`)
            if (res.ok) {
                const data = await res.json()
                setWarmupStats(data.warmupStats || { received: 0, sent: 0, savedFromSpam: 0 })
                setChartData(data.chartData || [])
                setWarmupStarted(data.warmupStarted ? new Date(data.warmupStarted) : null)
                setWarmupEnabled(data.warmupEnabled || false)
                setStatus(data.status || "active")
                setCampaigns(data.campaigns || [])
                // Parsing error detail if it's JSON
                try {
                    const parsed = JSON.parse(data.errorDetail)
                    setErrorDetail(JSON.stringify(parsed, null, 2))
                } catch (e) {
                    setErrorDetail(data.errorDetail || "")
                }
            }
        } catch (error) {
            console.error("Failed to fetch account details:", error)
        }
    }

    // Toggle account status (Resume/Pause)
    const toggleStatus = async () => {
        setToggling(true)
        const newStatus = status === "active" ? "paused" : "active"

        try {
            const res = await fetch(`/api/accounts/${account.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                setStatus(newStatus)
                toast({
                    title: newStatus === "active" ? "Account Resumed" : "Account Paused",
                    description: `${account.email} is now ${newStatus}`
                })
                onUpdate?.({ ...account, status: newStatus })
            } else {
                throw new Error("Failed to update status")
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update account status", variant: "destructive" })
        } finally {
            setToggling(false)
        }
    }

    // Intelligent error pattern detection
    const getErrorInfo = (error: string) => {
        const lowerError = error.toLowerCase()

        // Authentication errors
        if (lowerError.includes('authentication') || lowerError.includes('auth') ||
            lowerError.includes('invalid credentials') || lowerError.includes('535') ||
            lowerError.includes('username and password not accepted')) {
            return {
                type: 'auth',
                title: 'Authentication Failed',
                description: 'Your email credentials were rejected by the mail server.',
                suggestion: 'Check that your App Password is correct. For Gmail, generate a new App Password from your Google Account security settings.',
                canAutoFix: false
            }
        }

        // Rate limit / sending limit errors
        if (lowerError.includes('limit exceeded') || lowerError.includes('daily limit') ||
            lowerError.includes('too many') || lowerError.includes('rate limit') ||
            lowerError.includes('452') || lowerError.includes('421')) {
            return {
                type: 'rate_limit',
                title: 'Sending Limit Exceeded',
                description: 'You\'ve hit your email provider\'s daily sending limit.',
                suggestion: 'We can automatically reduce your daily limit and enable slow ramp-up to prevent this.',
                canAutoFix: true
            }
        }

        // Connection / hostname errors
        if (lowerError.includes('enotfound') || lowerError.includes('getaddrinfo') ||
            lowerError.includes('hostname') || lowerError.includes('dns') ||
            lowerError.includes('could not resolve')) {
            return {
                type: 'connection',
                title: 'Connection Failed',
                description: 'Cannot connect to the mail server. The hostname could not be resolved.',
                suggestion: 'Check that your SMTP server address is correct (e.g., smtp.gmail.com for Gmail).',
                canAutoFix: false
            }
        }

        // Timeout errors
        if (lowerError.includes('timeout') || lowerError.includes('timed out') ||
            lowerError.includes('etimedout') || lowerError.includes('econnreset')) {
            return {
                type: 'timeout',
                title: 'Connection Timeout',
                description: 'The mail server took too long to respond.',
                suggestion: 'This is usually a temporary issue. Try reconnecting. If it persists, check your firewall settings.',
                canAutoFix: false
            }
        }

        // SSL/TLS errors
        if (lowerError.includes('ssl') || lowerError.includes('tls') ||
            lowerError.includes('certificate') || lowerError.includes('handshake')) {
            return {
                type: 'ssl',
                title: 'SSL/TLS Error',
                description: 'Secure connection could not be established.',
                suggestion: 'Check that the SMTP port is correct (587 for TLS, 465 for SSL). Try switching ports.',
                canAutoFix: false
            }
        }

        // Port blocked
        if (lowerError.includes('econnrefused') || lowerError.includes('connection refused')) {
            return {
                type: 'blocked',
                title: 'Connection Refused',
                description: 'The mail server refused the connection.',
                suggestion: 'The SMTP port might be blocked. Try using port 587 or 465.',
                canAutoFix: false
            }
        }

        // Mailbox errors
        if (lowerError.includes('mailbox') || lowerError.includes('quota') ||
            lowerError.includes('storage') || lowerError.includes('full')) {
            return {
                type: 'mailbox',
                title: 'Mailbox Issue',
                description: 'There\'s an issue with the mailbox (possibly full or unavailable).',
                suggestion: 'Check your email account storage. You may need to clear some space.',
                canAutoFix: false
            }
        }

        // Missing credentials
        if (lowerError.includes('missing credentials') || lowerError.includes('no password') ||
            error === 'null' || error === 'undefined' || !error) {
            return {
                type: 'missing',
                title: 'Missing Credentials',
                description: 'SMTP credentials are not configured for this account.',
                suggestion: 'Please reconnect your email account with valid SMTP credentials.',
                canAutoFix: false
            }
        }

        // Default/unknown error
        return {
            type: 'unknown',
            title: 'Connection Issue',
            description: 'An error occurred while connecting to your email provider.',
            suggestion: 'Try reconnecting. If the issue persists, contact your email service provider.',
            canAutoFix: false
        }
    }

    // Auto-fix error logic
    const fixError = async () => {
        if (errorDetail.includes("Daily user sending limit exceeded") || errorDetail.includes("daily limit")) {
            setSaving(true)
            try {
                // Apply fix: Reduce limit to 50% and switch to smooth ramp
                const newLimit = Math.max(10, Math.floor(parseInt(dailyLimit) * 0.5))
                const res = await fetch(`/api/accounts/${account.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: "active", // Reactivate
                        dailyLimit: newLimit,
                        slowRamp: true
                    })
                })

                if (res.ok) {
                    setDailyLimit(newLimit.toString())
                    setSlowRamp(true)
                    setStatus("active")
                    setErrorDetail("") // Clear error visually
                    toast({
                        title: "Auto-Fix Applied",
                        description: `Daily limit lowered to ${newLimit} and Slow Ramp enabled. Account reactivated.`
                    })
                    onUpdate?.({ ...account, status: "active" })
                }
            } catch (err) {
                toast({ title: "Fix Failed", description: "Could not auto-fix the issue.", variant: "destructive" })
            } finally {
                setSaving(false)
            }
        } else {
            // Generic fix: just try to resume
            toggleStatus()
        }
    }

    // Toggle warmup
    const toggleWarmup = async (enabled: boolean) => {
        try {
            const res = await fetch(`/api/accounts/${account.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ warmupEnabled: enabled })
            })

            if (res.ok) {
                setWarmupEnabled(enabled)
                toast({
                    title: enabled ? "Warmup Enabled" : "Warmup Disabled",
                    description: `Warmup is now ${enabled ? "active" : "paused"} for ${account.email}`
                })
            } else {
                throw new Error("Failed to toggle warmup")
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to toggle warmup", variant: "destructive" })
        }
    }

    // Actually perform the save API call
    const performSave = async () => {
        setSaving(true)

        try {
            const res = await fetch(`/api/accounts/${account.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    signature,
                    dailyLimit: parseInt(dailyLimit),
                    minWaitTime: parseInt(minWaitTime),
                    slowRamp,
                    warmupTag,
                    warmupDailyLimit: parseInt(warmupDailyLimit),
                    warmupDailyIncrease: parseInt(warmupDailyIncrease),
                    warmupReplyRate: parseInt(warmupReplyRate)
                })
            })

            if (res.ok) {
                toast({ title: "Settings Saved", description: "Account settings updated successfully" })
                onUpdate?.({ ...account, firstName, lastName })
                setShowLargeLimitWarning(false)
                setLargeLimitAcknowledged(false)
            } else {
                throw new Error("Failed to save settings")
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    // Save all settings - checks for large limit first
    const saveSettings = async () => {
        const limit = parseInt(dailyLimit) || 0
        if (limit > 500) {
            setShowLargeLimitWarning(true)
            return
        }
        await performSave()
    }

    // Handle continue from large limit warning modal
    const handleLargeLimitContinue = async () => {
        if (largeLimitAcknowledged) {
            await performSave()
        }
    }

    const handleSendTestEmail = async () => {
        if (!testRecipient) {
            toast({ title: "Recipient Required", description: "Please enter an email address.", variant: "destructive" })
            return
        }

        setSendingTest(true)
        try {
            const res = await fetch(`/api/accounts/${account.id}/test-send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: testRecipient })
            })

            const data = await res.json()
            if (res.ok) {
                toast({ title: "Success", description: `Test email sent to ${testRecipient}` })
                setTestRecipient("")
            } else {
                throw new Error(data.error || data.details || "Failed to send test email")
            }
        } catch (error: any) {
            toast({ title: "Send Failed", description: error.message, variant: "destructive" })
        } finally {
            setSendingTest(false)
        }
    }

    const runWarmupManual = async () => {
        setRunningWarmup(true)
        try {
            const res = await fetch('/api/cron/warmup')
            if (res.ok) {
                toast({ title: "Warmup Started", description: "The warmup cycle has been triggered manually." })
                fetchAccountDetails() // Refresh logs
            } else {
                const data = await res.json()
                throw new Error(data.error || "Failed to trigger warmup")
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setRunningWarmup(false)
        }
    }

    // Generate random warmup tag
    const generateWarmupTag = () => {
        const adjectives = ["golden", "silver", "crystal", "cosmic", "mystic", "royal", "swift", "bright"]
        const nouns = ["pineapples", "dolphins", "eagles", "tigers", "stars", "waves", "peaks", "rivers"]
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
        const noun = nouns[Math.floor(Math.random() * nouns.length)]
        setWarmupTag(`${adj}-${noun}`)
    }

    // Format date for display
    const formatDate = (date: Date | null) => {
        if (!date) return "Not started"
        const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
        const formatted = date.toLocaleDateString("en-US", options)
        const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
        return `Started on ${formatted} | ${daysAgo} days ago`
    }

    // Handle reconnect (uses stored credentials from database)
    const handleReconnect = async () => {
        setReconnecting(true)
        try {
            const res = await fetch('/api/accounts/bulk-reconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: reconnectAll ? undefined : [account.id] })
            })

            if (res.ok) {
                const data = await res.json()
                toast({
                    title: "Reconnection Complete",
                    description: data.message
                })
                // Refresh account details
                fetchAccountDetails()
                onUpdate?.({ ...account, status: 'active' })
            } else {
                const error = await res.json()
                throw new Error(error.error || 'Reconnection failed')
            }
        } catch (error: any) {
            toast({
                title: "Reconnection Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setReconnecting(false)
        }
    }

    // Get status badge color and label
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return { className: 'bg-green-900/50 text-green-400 border-green-900', label: 'Active' }
            case 'paused':
                return { className: 'bg-yellow-900/50 text-yellow-400 border-yellow-900', label: 'Paused' }
            case 'completed':
                return { className: 'bg-[#1a4d3a] text-green-400 border-none', label: 'Completed' }
            case 'draft':
                return { className: 'bg-gray-800 text-gray-400 border-gray-700', label: 'Draft' }
            default:
                return { className: 'bg-gray-800 text-gray-400 border-gray-700', label: status }
        }
    }

    if (!account) return null

    const hasError = status === "error" || (errorDetail && errorDetail.length > 0);

    return (
        <div className="w-[800px] border-l border-[#2a2a2a] bg-[#0a0a0a] flex flex-col h-full absolute right-0 top-0 bottom-0 shadow-2xl z-20">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">{account.email}</span>
                    {hasError && <Badge variant="destructive" className="bg-red-900/50 text-red-200 border-red-900">Connection Error</Badge>}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-gray-400 hover:text-white gap-2 border border-[#2a2a2a]"
                        onClick={toggleStatus}
                        disabled={toggling}
                    >
                        {toggling ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : status === "active" ? (
                            <Pause className="h-3 w-3" />
                        ) : (
                            <Flame className="h-3 w-3" />
                        )}
                        {status === "active" ? "Pause" : "Resume"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={hasError ? "error" : "warmup"} className="flex-1 flex flex-col">
                <div className="px-6 border-b border-[#2a2a2a]">
                    <TabsList className="bg-transparent h-12 p-0 space-x-6">
                        {hasError && (
                            <TabsTrigger value="error" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:text-red-400 px-0 text-gray-400 hover:text-gray-300">Error</TabsTrigger>
                        )}
                        <TabsTrigger value="warmup" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white px-0 text-gray-400 hover:text-gray-300">Warmup</TabsTrigger>
                        <TabsTrigger value="settings" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white px-0 text-gray-400 hover:text-gray-300">Settings</TabsTrigger>
                        <TabsTrigger value="campaigns" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white px-0 text-gray-400 hover:text-gray-300">Campaigns</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>

                    {/* Error Tab */}
                    {hasError && (
                        <TabsContent value="error" className="space-y-6 mt-0">
                            {/* OAuth Warning - only show for Gmail accounts using App Password */}
                            {(account?.email?.includes('@gmail.com') || account?.email?.includes('@googlemail.com')) && account?.smtpHost?.includes('smtp.gmail.com') && (
                                <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4 flex gap-4">
                                    <div className="mt-1">
                                        <Zap className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium text-sm">This Google account is not using OAuth.</h4>
                                        <p className="text-gray-400 text-xs mt-1">We recommend switching to OAuth to avoid issues.</p>
                                    </div>
                                </div>
                            )}

                            {/* What went wrong - Dynamic based on error */}
                            {(() => {
                                const errorInfo = getErrorInfo(errorDetail || '')
                                return (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-orange-500"><AlertTriangle className="h-5 w-5" /></span>
                                                <h3 className="text-white font-medium">{errorInfo.title}</h3>
                                            </div>
                                            <p className="text-gray-400 text-sm">{errorInfo.description}</p>

                                            {errorDetail && errorDetail !== 'null' && (
                                                <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4 font-mono text-xs text-gray-300 break-words whitespace-pre-wrap">
                                                    {errorDetail}
                                                </div>
                                            )}
                                        </div>

                                        {/* How to fix - Dynamic suggestion */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-500"><Rocket className="h-5 w-5" /></span>
                                                <h3 className="text-white font-medium">How do I fix this?</h3>
                                            </div>

                                            <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
                                                <h4 className="text-blue-400 font-medium text-sm flex items-center gap-2">
                                                    <Zap className="h-4 w-4" /> Suggested Fix
                                                </h4>
                                                <p className="text-gray-400 text-sm mt-2">
                                                    {errorInfo.suggestion}
                                                </p>

                                                {errorInfo.canAutoFix && (
                                                    <Button onClick={fixError} className="mt-3 bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs">
                                                        Fix it for me
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )
                            })()}

                            {/* Actions */}
                            <div className="pt-6 border-t border-[#2a2a2a] flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="reconnect-all"
                                        checked={reconnectAll}
                                        onCheckedChange={(checked) => setReconnectAll(checked as boolean)}
                                        className="border-[#333] data-[state=checked]:bg-blue-600 rounded-[4px]"
                                    />
                                    <label htmlFor="reconnect-all" className="text-gray-300 text-sm cursor-pointer">Reconnect all accounts</label>
                                </div>
                                <Button
                                    onClick={handleReconnect}
                                    disabled={reconnecting}
                                    className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                                >
                                    {reconnecting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    {reconnectAll ? 'Reconnect all accounts' : 'Reconnect account'}
                                </Button>
                            </div>

                        </TabsContent>
                    )}

                    {/* Warmup Tab */}
                    <TabsContent value="warmup" className="space-y-6 mt-0">
                        {/* Status Bar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <span className="bg-purple-500/10 p-1 rounded-full"><RotateCw className="h-4 w-4 text-purple-400" /></span>
                                {formatDate(warmupStarted)}
                            </div>
                            <div className="flex bg-[#111] rounded-lg p-1 border border-[#2a2a2a]">
                                <button
                                    className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", !warmupEnabled ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-400 hover:text-white")}
                                    onClick={() => toggleWarmup(false)}
                                >
                                    Disable
                                </button>
                                <button
                                    className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", warmupEnabled ? "bg-green-600 text-white shadow-sm" : "text-gray-400 hover:text-white")}
                                    onClick={() => toggleWarmup(true)}
                                >
                                    Enable
                                </button>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
                            <h3 className="text-sm text-gray-400 font-medium">Summary for past week</h3>
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <div className="text-2xl font-bold text-white">{warmupStats.received}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium">warmup emails received</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{warmupStats.sent}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium">warmup emails sent</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{warmupStats.savedFromSpam}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium">saved from spam</div>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
                            <h3 className="text-sm text-gray-400 font-medium">Warmup Emails Sent</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barSize={24}>
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} dy={15} />
                                        <YAxis hide />
                                        <Bar dataKey="sent" radius={[6, 6, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#22c55e" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-8 mt-0 text-sm">
                        {/* Sender Name */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <span className="text-gray-500"><Users className="h-4 w-4" /></span>
                                Sender name
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-xs">First Name</Label>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="bg-[#111] border-[#2a2a2a] text-white h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-xs">Last Name</Label>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="bg-[#111] border-[#2a2a2a] text-white h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <span className="text-gray-500"><Pencil className="h-4 w-4" /></span>
                                Signature
                            </div>
                            <div className="bg-[#111] border border-[#2a2a2a] rounded-lg overflow-hidden min-h-[160px] flex flex-col">
                                <textarea
                                    className="flex-1 bg-transparent border-none text-gray-300 p-4 resize-none focus:ring-0 focus:outline-none placeholder-gray-600 text-sm"
                                    placeholder="Start typing here..."
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                />
                                <div className="border-t border-[#2a2a2a] bg-[#161616] p-2 flex items-center gap-3 text-gray-400">
                                    <button className="hover:text-white p-1"><Bold className="h-4 w-4" /></button>
                                    <button className="hover:text-white p-1"><Italic className="h-4 w-4" /></button>
                                    <button className="hover:text-white p-1"><Underline className="h-4 w-4" /></button>
                                    <div className="w-px h-4 bg-[#333]" />
                                    <button className="hover:text-white p-1"><Type className="h-4 w-4" /></button>
                                    <button className="hover:text-white p-1"><Link2 className="h-4 w-4" /></button>
                                    <button className="hover:text-white p-1"><ImageIcon className="h-4 w-4" /></button>
                                    <button className="hover:text-white p-1"><Smile className="h-4 w-4" /></button>
                                    <div className="flex-1" />
                                    <button className="hover:text-white p-1"><Code className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-4 pt-4 border-t border-[#2a2a2a]">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <span className="text-gray-500"><Tag className="h-4 w-4" /></span>
                                Tags <Info className="h-3 w-3 text-gray-500 cursor-help" />
                            </div>
                            <Select>
                                <SelectTrigger className="bg-[#111] border-[#2a2a2a] text-gray-500 h-11">
                                    <SelectValue placeholder="Tags" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectItem value="warmup">Warmup</SelectItem>
                                    <SelectItem value="outreach">Outreach</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Campaign Settings */}
                        <div className="pt-6 border-t border-[#2a2a2a]">
                            <div className="flex items-center gap-2 text-white font-medium mb-6">
                                <span className="text-gray-500"><Rocket className="h-4 w-4" /></span>
                                Campaign Settings
                            </div>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-2">
                                    <Label className="text-white font-medium">Daily campaign limit</Label>
                                    <div className="text-xs text-gray-500 mb-2">Daily sending limit</div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={dailyLimit}
                                            onChange={(e) => setDailyLimit(e.target.value)}
                                            className="bg-[#111] border-[#2a2a2a] text-white w-24 h-10"
                                        />
                                        <span className="text-gray-500 text-sm font-medium">emails</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white font-medium">Minimum wait time</Label>
                                    <div className="text-xs text-gray-500 mb-2">When used with multiple campaigns</div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={minWaitTime}
                                            onChange={(e) => setMinWaitTime(e.target.value)}
                                            className="bg-[#111] border-[#2a2a2a] text-white w-24 h-10"
                                        />
                                        <span className="text-gray-500 text-sm font-medium">minute(s)</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-white font-medium">Campaign slow ramp</Label>
                                        <Info className="h-3 w-3 text-gray-500" />
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">Gradually increase emails per day</div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 text-sm">Enable</span>
                                        <Switch
                                            checked={slowRamp}
                                            onCheckedChange={setSlowRamp}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                        <Badge className="bg-blue-600 hover:bg-blue-600 border-none text-white text-[10px] px-1.5 py-0.5 h-5">Recommended</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#2a2a2a]">
                            <div className="flex items-center gap-2 text-white font-medium mb-6">
                                <span className="text-gray-500"><Send className="h-4 w-4" /></span>
                                Troubleshooting
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-xs">Send a test email to verify SMTP connection</Label>
                                    <div className="flex gap-2 max-w-md">
                                        <Input
                                            placeholder="Recipient email address"
                                            value={testRecipient}
                                            onChange={(e) => setTestRecipient(e.target.value)}
                                            className="bg-[#111] border-[#2a2a2a] text-white h-10"
                                        />
                                        <Button
                                            variant="outline"
                                            className="border-blue-900/40 bg-blue-900/10 text-blue-400 hover:bg-blue-900/20 px-3"
                                            onClick={handleSendTestEmail}
                                            disabled={sendingTest}
                                        >
                                            {sendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                            Send Test
                                        </Button>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="border-[#2a2a2a] bg-[#111] text-gray-400 hover:bg-[#1a1a1a] hover:text-white px-4 h-10"
                                        onClick={runWarmupManual}
                                        disabled={runningWarmup}
                                    >
                                        {runningWarmup ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flame className="h-4 w-4 mr-2" />}
                                        Trigger Warmup Cycle Manually
                                    </Button>
                                    <p className="text-[10px] text-gray-500 mt-2">Useful for checking if your Warmup Pool and IMAP connection are working correctly.</p>
                                </div>
                            </div>
                        </div>

                        {/* Custom Tracking Domain */}
                        <div className="pt-6 border-t border-[#2a2a2a]">
                            <div className="flex items-center gap-2 text-white font-medium mb-6">
                                <span className="text-gray-500"><Globe className="h-4 w-4" /></span>
                                Custom Tracking Domain
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="custom-domain" className="border-[#333] data-[state=checked]:bg-blue-600 rounded-[4px]" />
                                <label htmlFor="custom-domain" className="text-gray-300 text-sm cursor-pointer">Enable custom tracking domain</label>
                            </div>
                        </div>

                        {/* Warmup Settings */}
                        <div className="pt-6 border-t border-[#2a2a2a] pb-20">
                            <div className="flex items-center gap-2 text-white font-medium mb-6">
                                <span className="text-gray-500"><Flame className="h-4 w-4" /></span>
                                Warmup Settings
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-white font-medium">Warmup filter tag</Label>
                                        <Info className="h-3 w-3 text-gray-500" />
                                    </div>
                                    <div className="flex gap-2 max-w-md">
                                        <Input
                                            placeholder="Custom tag"
                                            value={warmupTag}
                                            onChange={(e) => setWarmupTag(e.target.value)}
                                            className="bg-[#111] border-[#2a2a2a] text-white h-10"
                                        />
                                        <Button
                                            variant="outline"
                                            className="border-[#2a2a2a] bg-[#111] text-gray-400 hover:bg-[#1a1a1a] hover:text-white px-3"
                                            onClick={generateWarmupTag}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Generate
                                        </Button>
                                    </div>
                                    <div className="text-xs text-gray-500 pl-1">Example: 'golden-pineapples'</div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="space-y-2">
                                        <Label className="text-white font-medium">Increase per day</Label>
                                        <div className="text-xs text-gray-500 mb-2">Suggested 1</div>
                                        <Input
                                            value={warmupDailyIncrease}
                                            onChange={(e) => setWarmupDailyIncrease(e.target.value)}
                                            className="bg-[#111] border-[#2a2a2a] text-white w-full h-10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white font-medium">Daily warmup limit</Label>
                                        <div className="text-xs text-gray-500 mb-2">Suggested 10</div>
                                        <Input
                                            value={warmupDailyLimit}
                                            onChange={(e) => setWarmupDailyLimit(e.target.value)}
                                            className="bg-[#111] border-[#2a2a2a] text-white w-full h-10"
                                        />
                                        {parseInt(warmupDailyLimit) > 50 && (
                                            <p className="text-orange-500 text-xs mt-1">
                                                <span className="font-semibold">Warning</span> : Warmup limit is too high. It's recommended to keep it below 50.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white font-medium">Reply rate %</Label>
                                    <div className="text-xs text-gray-500 mb-2">Suggested 30</div>
                                    <Input
                                        value={warmupReplyRate}
                                        onChange={(e) => setWarmupReplyRate(e.target.value)}
                                        className="bg-[#111] border-[#2a2a2a] text-white w-32 h-10"
                                    />
                                </div>

                                <Button variant="outline" className="text-gray-300 border-[#2a2a2a] bg-transparent hover:bg-[#1a1a1a] hover:text-white text-xs h-9">
                                    Show advanced settings <ChevronDown className="ml-2 h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 fixed bottom-6 right-6 z-30">
                            <Button
                                className="bg-blue-600 hover:bg-blue-500 text-white w-20 h-10 shadow-lg shadow-blue-900/20"
                                onClick={saveSettings}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Campaigns Tab */}
                    <TabsContent value="campaigns" className="mt-0 pt-2">
                        <div className="space-y-2">
                            {campaigns.length > 0 ? (
                                campaigns.map((campaign) => {
                                    const badge = getStatusBadge(campaign.status)
                                    return (
                                        <div
                                            key={campaign.id}
                                            className="flex items-center justify-between p-4 bg-[#111] border border-[#2a2a2a] rounded-xl hover:border-[#333] transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-medium text-sm">{campaign.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={`${badge.className} hover:${badge.className} font-medium px-2.5 py-0.5 rounded text-xs`}>
                                                    {badge.label}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    className="text-blue-500 hover:text-blue-400 hover:bg-transparent font-medium text-sm p-0 h-auto group-hover:underline"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/campaigns/${campaign.id}`)
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 bg-[#111] border border-[#2a2a2a] rounded-xl">
                                    <Rocket className="h-10 w-10 text-gray-600 mb-4" />
                                    <p className="text-gray-400 text-sm">No campaigns are using this account yet.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                                        onClick={() => router.push('/campaigns')}
                                    >
                                        Go to Campaigns
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Large Daily Limit Warning Modal */}
            <Dialog open={showLargeLimitWarning} onOpenChange={setShowLargeLimitWarning}>
                <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <span className="text-2xl">😟</span>
                            Large daily limit
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 pt-4 space-y-4">
                            <p>
                                You currently have your daily email limit for this account set to more than 500 emails per day.
                            </p>
                            <p className="text-orange-500">
                                Sending too many emails from the same email account can not only damage your sender reputation, but could also get your account banned by your email service provider.
                            </p>
                            <p className="text-orange-500">
                                Check with your email service provider before setting a large daily limit, or it could lead to them suspending your account.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 mt-4">
                        <Checkbox
                            id="acknowledge-limit"
                            checked={largeLimitAcknowledged}
                            onCheckedChange={(c) => setLargeLimitAcknowledged(c as boolean)}
                            className="border-[#444] data-[state=checked]:bg-blue-600 rounded-[4px]"
                        />
                        <label htmlFor="acknowledge-limit" className="text-gray-300 text-sm cursor-pointer">
                            I understand what I'm doing
                        </label>
                    </div>
                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            onClick={handleLargeLimitContinue}
                            disabled={!largeLimitAcknowledged || saving}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Continue
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowLargeLimitWarning(false)
                                setLargeLimitAcknowledged(false)
                            }}
                            className="bg-red-800 hover:bg-red-700"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
