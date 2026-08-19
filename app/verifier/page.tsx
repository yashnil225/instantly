"use client"

import { useState, useEffect, useRef } from "react"
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    UploadCloud,
    Search,
    Download,
    Trash2,
    XCircle,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    FileText,
    History,
    Zap,
    ExternalLink,
    Clock,
    Sparkles,
    Check,
    X,
    Info,
    ArrowRight,
    Database,
    Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { CampaignImportModal } from "@/components/app/verifier/CampaignImportModal"

interface VerificationResult {
    email: string
    status: 'valid' | 'risky' | 'invalid' | 'disposable'
    reason: string
    score: number
    isSyntaxValid: boolean
    isDisposable: boolean
    isRoleBased: boolean
    isFreeProvider: boolean
    hasMx: boolean
    mxHost?: string
    isCatchAll?: boolean
    suggestedFix?: string
    checkedAt: string
}

interface StoredJob {
    id: string
    fileName: string
    total: number
    processed: number
    validCount: number
    riskyCount: number
    invalidCount: number
    disposableCount: number
    progress: number
    status: 'processing' | 'completed' | 'canceled' | 'error'
    currentLog?: string
    createdAt: string
    completedAt?: string
}

export default function EmailVerifierPage() {
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<string>("bulk")

    // Single Verification States
    const [singleEmail, setSingleEmail] = useState("")
    const [isVerifyingSingle, setIsVerifyingSingle] = useState(false)
    const [singleResult, setSingleResult] = useState<VerificationResult | null>(null)

    // Bulk Verification States
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [activeJobs, setActiveJobs] = useState<StoredJob[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // History (Loaded from Database)
    const [history, setHistory] = useState<StoredJob[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [downloadingKey, setDownloadingKey] = useState<string | null>(null)

    // Campaign Import Modal State
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [importTargetJob, setImportTargetJob] = useState<StoredJob | null>(null)

    // Load history from Database on mount and tab switch
    const fetchHistoryFromDb = async () => {
        setIsLoadingHistory(true)
        try {
            const res = await fetch("/api/verify/history")
            if (res.ok) {
                const data = await res.json()
                setHistory(data.jobs || [])
                
                // Keep active/processing jobs in active list
                const processing = (data.jobs || []).filter((j: StoredJob) => j.status === 'processing')
                setActiveJobs(prev => {
                    const existingIds = new Set(prev.map(p => p.id))
                    const toAdd = processing.filter((p: StoredJob) => !existingIds.has(p.id))
                    return [...prev, ...toAdd]
                })
            }
        } catch (e) {
            console.error("Failed to load history from DB", e)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    useEffect(() => {
        fetchHistoryFromDb()
    }, [])

    // Active job chunk driver
    const drivingJobsRef = useRef<Set<string>>(new Set())

    const driveJobVerification = async (jobId: string) => {
        if (drivingJobsRef.current.has(jobId)) return
        drivingJobsRef.current.add(jobId)

        let consecutiveErrors = 0
        try {
            while (true) {
                try {
                    const res = await fetch("/api/verify/process-chunk", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jobId, batchSize: 25 })
                    })

                    if (!res.ok) {
                        consecutiveErrors++
                        if (consecutiveErrors >= 4) break
                        await new Promise(r => setTimeout(r, 800))
                        continue
                    }

                    consecutiveErrors = 0
                    const data = await res.json()

                    setActiveJobs(prev => prev.map(j => (j.id === jobId ? { ...j, ...data } : j)))
                    setHistory(prev => prev.map(j => (j.id === jobId ? { ...j, ...data } : j)))

                    if (data.completed || data.status === 'completed' || data.status === 'canceled') {
                        break
                    }

                    // Small 30ms yield
                    await new Promise(r => setTimeout(r, 30))
                } catch (e) {
                    consecutiveErrors++
                    if (consecutiveErrors >= 4) break
                    await new Promise(r => setTimeout(r, 800))
                }
            }
        } finally {
            drivingJobsRef.current.delete(jobId)
        }
    }

    // Automatically drive any active/processing jobs
    useEffect(() => {
        const activeIds = activeJobs.filter(j => j.status === 'processing').map(j => j.id)
        for (const id of activeIds) {
            driveJobVerification(id)
        }
    }, [activeJobs])

    // --- Single Email Verification ---
    const handleVerifySingle = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const target = singleEmail.trim()
        if (!target) {
            toast({ title: "Email required", description: "Please enter an email address to verify", variant: "destructive" })
            return
        }

        setIsVerifyingSingle(true)
        setSingleResult(null)

        try {
            const res = await fetch("/api/verify/single", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: target })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Verification failed")

            setSingleResult(data)
        } catch (err: any) {
            toast({
                title: "Verification Error",
                description: err.message || "Failed to verify email",
                variant: "destructive"
            })
        } finally {
            setIsVerifyingSingle(false)
        }
    }

    // --- Bulk CSV Upload ---
    const handleFileUpload = async (file: File) => {
        if (!file.name.endsWith(".csv")) {
            toast({ title: "Invalid file", description: "Please upload a valid .csv file", variant: "destructive" })
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/verify/bulk", {
                method: "POST",
                body: formData
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Upload failed")

            const newJob: StoredJob = {
                id: data.jobId,
                fileName: data.fileName,
                total: data.total,
                processed: 0,
                validCount: 0,
                riskyCount: 0,
                invalidCount: 0,
                disposableCount: 0,
                progress: 0,
                status: "processing",
                currentLog: "Starting verification in database...",
                createdAt: new Date().toISOString()
            }

            setActiveJobs(prev => [newJob, ...prev])
            setHistory(prev => [newJob, ...prev.filter(j => j.id !== newJob.id)])

            driveJobVerification(data.jobId)

            toast({
                title: "Verification Started",
                description: `Saved to DB: Verifying ${data.total} leads from ${data.fileName}`
            })
        } catch (err: any) {
            toast({
                title: "Upload Failed",
                description: err.message || "Could not start verification",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
        }
    }

    // --- Cancel Job ---
    const handleCancelJob = async (jobId: string) => {
        try {
            await fetch(`/api/verify/job/${jobId}?action=cancel`, { method: "POST" })
            setActiveJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'canceled', currentLog: '❌ Canceled by user' } : j)))
            setHistory(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'canceled', currentLog: '❌ Canceled by user' } : j)))
            toast({ title: "Job Canceled" })
        } catch (e) {
            console.error(e)
        }
    }

    // --- Close Job Card (Removes from active view, keeps in DB & History) ---
    const handleDismissFromActive = (jobId: string) => {
        setActiveJobs(prev => prev.filter(j => j.id !== jobId))
    }

    // --- Delete Job (Permanently deletes from Database & History) ---
    const handleDeleteJob = async (jobId: string) => {
        try {
            await fetch(`/api/verify/job/${jobId}`, { method: "DELETE" })
            setActiveJobs(prev => prev.filter(j => j.id !== jobId))
            setHistory(prev => prev.filter(j => j.id !== jobId))
            toast({ title: "Job Deleted", description: "Verification data and leads permanently deleted from Database" })
        } catch (e) {
            console.error(e)
        }
    }

    // --- Clear All History from DB ---
    const handleClearAllHistory = async () => {
        if (confirm("Are you sure you want to permanently delete all 30 verification jobs and lead records from the database?")) {
            try {
                await fetch("/api/verify/history", { method: "DELETE" })
                setActiveJobs([])
                setHistory([])
                toast({ title: "Database Cleared", description: "All verification records deleted" })
            } catch (e) {
                console.error(e)
            }
        }
    }

    // --- Download Filtered CSV (Direct in-page background download, no new tabs) ---
    const handleDownload = async (jobId: string, type: 'all' | 'valid' | 'risky' | 'invalid') => {
        const key = `${jobId}-${type}`
        setDownloadingKey(key)
        try {
            const res = await fetch(`/api/verify/job/${jobId}?action=download&type=${type}`)
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || "Failed to download CSV")
            }

            const blob = await res.blob()
            let fileName = `${type}-verified-leads.csv`
            const contentDisposition = res.headers.get("content-disposition")
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/)
                if (match && match[1]) fileName = match[1]
            }

            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.style.display = "none"
            a.href = blobUrl
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl)
                document.body.removeChild(a)
            }, 300)

            toast({ title: "Download Started", description: `Saved ${fileName}` })
        } catch (e: any) {
            toast({
                title: "Download Error",
                description: e.message || "Could not download CSV",
                variant: "destructive"
            })
        } finally {
            setDownloadingKey(null)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Email Verifier</h1>
                            <p className="text-sm text-muted-foreground">
                                100% Free Built-in NeverBounce Engine • Saved in DB (Max 30 jobs FIFO)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/30 gap-1.5">
                        <Database className="h-3.5 w-3.5" />
                        Database Persistence (30 Jobs Auto-Cap)
                    </Badge>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-3 max-w-md bg-muted/60 p-1">
                    <TabsTrigger value="bulk" className="gap-2">
                        <UploadCloud className="h-4 w-4" />
                        Bulk CSV
                    </TabsTrigger>
                    <TabsTrigger value="single" className="gap-2">
                        <Search className="h-4 w-4" />
                        Single Check
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2" onClick={fetchHistoryFromDb}>
                        <History className="h-4 w-4" />
                        History ({history.length})
                    </TabsTrigger>
                </TabsList>

                {/* ========================================================================= */}
                {/* TAB 1: BULK CSV VERIFIER                                                  */}
                {/* ========================================================================= */}
                <TabsContent value="bulk" className="space-y-6">
                    {/* Drag & Drop Upload Zone */}
                    <Card
                        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={e => {
                            e.preventDefault()
                            setIsDragging(false)
                            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed transition-all duration-200 cursor-pointer p-12 text-center flex flex-col items-center justify-center gap-4 bg-muted/20 hover:bg-muted/40 ${
                            isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/60"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={e => {
                                if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
                            }}
                        />

                        <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                            <UploadCloud className="h-8 w-8 animate-bounce" />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">Drop your CSV here or click to browse</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Saves all results into database • Auto-purges 31st oldest job • Multi-file concurrent support
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                            <span className="flex items-center gap-1">✓ RFC Syntax Check</span>
                            <span className="flex items-center gap-1">✓ 2,500+ Disposable DB</span>
                            <span className="flex items-center gap-1">✓ Live SMTP Handshake</span>
                            <span className="flex items-center gap-1">✓ Catch-All Detection</span>
                        </div>
                    </Card>

                    {/* Active & Completed Jobs List */}
                    {activeJobs.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Active & Completed Verification Jobs
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setActiveJobs([])} className="text-xs text-muted-foreground">
                                    Dismiss All from View (Stays in History)
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {activeJobs.map(job => (
                                    <Card key={job.id} className="p-6 relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm space-y-4">
                                        {/* Top Row: File Name, Dismiss (X) & Delete (Trash) */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-muted text-foreground">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-base">{job.fileName}</h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {job.total} total leads • {new Date(job.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {job.status !== 'completed' && job.status !== 'canceled' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setActiveJobs(prev => {
                                                                const found = prev.find(p => p.id === job.id)
                                                                if (!found) return [...prev, { ...job, status: 'processing' }]
                                                                return prev.map(p => p.id === job.id ? { ...p, status: 'processing' } : p)
                                                            })
                                                            driveJobVerification(job.id)
                                                        }}
                                                        className="text-xs border-primary/40 text-primary hover:bg-primary/10 gap-1 font-semibold mr-1"
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                        {job.status === 'processing' ? 'Accelerate' : 'Resume'}
                                                    </Button>
                                                )}

                                                {job.status === 'processing' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelJob(job.id)}
                                                        className="text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10 mr-1"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDismissFromActive(job.id)}
                                                    title="Close card (keep in History)"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteJob(job.id)}
                                                    title="Permanently delete from Database & History"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>
                                                    {job.status === 'processing' && `Verifying leads (${job.processed} / ${job.total})...`}
                                                    {job.status === 'completed' && `✅ Verification Complete (${job.total} leads)`}
                                                    {job.status === 'canceled' && `❌ Canceled at ${job.processed}/${job.total}`}
                                                </span>
                                                <span className="text-primary font-semibold">{job.progress}%</span>
                                            </div>
                                            <Progress value={job.progress} className="h-2.5 rounded-full" />
                                        </div>

                                        {/* Real-time Ticker */}
                                        <div className="p-2.5 rounded-md bg-muted/40 border border-border/40 font-mono text-xs text-muted-foreground truncate">
                                            {job.currentLog || "Processing in Database..."}
                                        </div>

                                        {/* Stats Badges */}
                                        <div className="flex flex-wrap items-center gap-3 pt-1">
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1.5 py-1 px-3">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                <strong>{job.validCount}</strong> Valid (Safe)
                                            </Badge>
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1.5 py-1 px-3">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                <strong>{job.riskyCount}</strong> Risky / Catch-All
                                            </Badge>
                                            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 gap-1.5 py-1 px-3">
                                                <XCircle className="h-3.5 w-3.5" />
                                                <strong>{job.invalidCount + (job.disposableCount || 0)}</strong> Invalid / Dead
                                            </Badge>
                                        </div>

                                        {/* Download & Campaign Import Buttons when Done */}
                                        {(job.status === 'completed' || job.processed > 0) && (
                                            <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setImportTargetJob(job)
                                                            setImportModalOpen(true)
                                                        }}
                                                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs gap-1.5 shadow-sm font-semibold"
                                                    >
                                                        <Send className="h-3.5 w-3.5" />
                                                        Add / Replace in Campaign
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={downloadingKey === `${job.id}-valid`}
                                                        onClick={() => handleDownload(job.id, 'valid')}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-sm"
                                                    >
                                                        {downloadingKey === `${job.id}-valid` ? (
                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3.5 w-3.5" />
                                                        )}
                                                        Download Valid Only ({job.validCount})
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={downloadingKey === `${job.id}-all`}
                                                        onClick={() => handleDownload(job.id, 'all')}
                                                        className="gap-1.5 text-xs border-border/60"
                                                    >
                                                        {downloadingKey === `${job.id}-all` ? (
                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3.5 w-3.5" />
                                                        )}
                                                        Download All Leads
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={downloadingKey === `${job.id}-risky`}
                                                        onClick={() => handleDownload(job.id, 'risky')}
                                                        className="gap-1.5 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                                                    >
                                                        {downloadingKey === `${job.id}-risky` ? (
                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3.5 w-3.5" />
                                                        )}
                                                        Risky Only ({job.riskyCount})
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={downloadingKey === `${job.id}-invalid`}
                                                        onClick={() => handleDownload(job.id, 'invalid')}
                                                        className="gap-1.5 text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                                                    >
                                                        {downloadingKey === `${job.id}-invalid` ? (
                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3.5 w-3.5" />
                                                        )}
                                                        Invalid Only ({job.invalidCount})
                                                    </Button>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteJob(job.id)}
                                                    className="text-xs text-muted-foreground hover:text-destructive gap-1"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Permanently Delete
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ========================================================================= */}
                {/* TAB 2: SINGLE EMAIL QUICK-CHECK                                           */}
                {/* ========================================================================= */}
                <TabsContent value="single" className="space-y-6">
                    <Card className="p-8 max-w-2xl mx-auto space-y-6 border border-border/60 bg-card/80 backdrop-blur-sm">
                        <div>
                            <h3 className="text-xl font-bold">Single Email Verification</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Check syntax, DNS records, MX host, Catch-All, and live mailbox availability in milliseconds.
                            </p>
                        </div>

                        <form onSubmit={handleVerifySingle} className="flex gap-2">
                            <input
                                type="email"
                                value={singleEmail}
                                onChange={e => setSingleEmail(e.target.value)}
                                placeholder="e.g. sarah.connor@cyberdyne.com"
                                className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <Button type="submit" disabled={isVerifyingSingle} className="gap-2 px-6">
                                {isVerifyingSingle ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4" />
                                        Verify Email
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Result Card */}
                        {singleResult && (
                            <div className="pt-4 border-t border-border/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-base">{singleResult.email}</span>
                                            {singleResult.status === 'valid' && (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                                    100% Safe (Valid)
                                                </Badge>
                                            )}
                                            {singleResult.status === 'risky' && (
                                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                                                    Risky / Catch-All
                                                </Badge>
                                            )}
                                            {singleResult.status === 'invalid' && (
                                                <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/30">
                                                    Invalid (Dead)
                                                </Badge>
                                            )}
                                            {singleResult.status === 'disposable' && (
                                                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                                                    Disposable Burner
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{singleResult.reason}</p>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-2xl font-black text-primary">{singleResult.score}%</div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Deliverability Score</div>
                                    </div>
                                </div>

                                {singleResult.suggestedFix && (
                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center justify-between">
                                        <span>Typo detected! Did you mean: <strong>{singleResult.suggestedFix}</strong>?</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSingleEmail(singleResult.suggestedFix!)
                                            }}
                                            className="h-6 text-[10px] border-amber-500/30 text-amber-500"
                                        >
                                            Apply Fix
                                        </Button>
                                    </div>
                                )}

                                {/* Checklist Grid */}
                                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                                        {singleResult.isSyntaxValid ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-rose-500" />}
                                        <span>RFC 5322 Syntax</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                                        {singleResult.hasMx ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-rose-500" />}
                                        <span className="truncate">MX: {singleResult.mxHost || "No MX Found"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                                        {!singleResult.isDisposable ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-rose-500" />}
                                        <span>Disposable Burner: {singleResult.isDisposable ? "Yes (Blocked)" : "No (Clean)"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                                        {!singleResult.isCatchAll ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                        <span>Catch-All Server: {singleResult.isCatchAll ? "Yes" : "No"}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* ========================================================================= */}
                {/* TAB 3: VERIFICATION HISTORY (STORED IN DB)                                 */}
                {/* ========================================================================= */}
                <TabsContent value="history" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Database className="h-4 w-4 text-primary" />
                                Database Verification History
                            </h3>
                            <p className="text-xs text-muted-foreground">Stored permanently in database (Auto-caps at max 30 jobs)</p>
                        </div>

                        {history.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearAllHistory}
                                className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear All Database History
                            </Button>
                        )}
                    </div>

                    {isLoadingHistory ? (
                        <Card className="p-12 text-center border-dashed border-border/60 bg-muted/10">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Loading history from Database...</p>
                        </Card>
                    ) : history.length === 0 ? (
                        <Card className="p-12 text-center border-dashed border-border/60 bg-muted/10">
                            <History className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">No verification history in Database</p>
                            <p className="text-xs text-muted-foreground mt-1">Upload a CSV in the Bulk tab to see results saved here.</p>
                        </Card>
                    ) : (
                        <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground uppercase">
                                    <tr>
                                        <th className="p-4">File Name</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Total Leads</th>
                                        <th className="p-4">Valid (Safe)</th>
                                        <th className="p-4">Risky</th>
                                        <th className="p-4">Invalid</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {history.map(item => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-4 font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {item.fileName}
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground">
                                                {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="p-4 font-semibold">{item.total}</td>
                                            <td className="p-4 text-emerald-500 font-semibold">{item.validCount}</td>
                                            <td className="p-4 text-amber-500 font-semibold">{item.riskyCount}</td>
                                            <td className="p-4 text-rose-500 font-semibold">{item.invalidCount + (item.disposableCount || 0)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setImportTargetJob(item)
                                                            setImportModalOpen(true)
                                                        }}
                                                        className="h-8 text-xs gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold"
                                                    >
                                                        <Send className="h-3 w-3" />
                                                        To Campaign
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={downloadingKey === `${item.id}-valid`}
                                                        onClick={() => handleDownload(item.id, 'valid')}
                                                        className="h-8 text-xs gap-1 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                                    >
                                                        {downloadingKey === `${item.id}-valid` ? (
                                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3 w-3" />
                                                        )}
                                                        Valid CSV
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={downloadingKey === `${item.id}-all`}
                                                        onClick={() => handleDownload(item.id, 'all')}
                                                        className="h-8 text-xs gap-1"
                                                    >
                                                        {downloadingKey === `${item.id}-all` ? (
                                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3 w-3" />
                                                        )}
                                                        All CSV
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteJob(item.id)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        title="Permanently delete from Database"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Campaign Import Modal */}
            <CampaignImportModal
                open={importModalOpen}
                onOpenChange={setImportModalOpen}
                jobId={importTargetJob?.id}
                jobFileName={importTargetJob?.fileName}
                validCount={importTargetJob?.validCount}
                riskyCount={importTargetJob?.riskyCount}
                onSuccess={() => {
                    fetchHistoryFromDb()
                }}
            />
        </div>
    )
}
