"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Search, Filter, MoreHorizontal, Pencil, Copy, Share2, Rocket, Zap, Play, Pause, AlertCircle, ChevronLeft, ChevronDown, Download, Loader2, Infinity as InfinityIcon, FileSpreadsheet, FileText, Keyboard, RefreshCw, MousePointer2, Terminal } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogHeader, // Added
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label" // Added

import { useToast } from "@/components/ui/use-toast"

// Wrapper component with Suspense for useSearchParams
export default function CampaignsPageWithSuspense() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <CampaignsPage />
        </Suspense>
    )
}

function CampaignsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const searchParams = useSearchParams()

    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [newCampaignName, setNewCampaignName] = useState("My Campaign")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isCreating, setIsCreating] = useState(false)

    // URL state persistence
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest")

    // Export state
    const [exportProgress, setExportProgress] = useState(0)
    const [isExporting, setIsExporting] = useState(false)

    // Debounce search input (300ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Sync state to URL
    useEffect(() => {
        const params = new URLSearchParams()
        if (statusFilter !== "all") params.set("status", statusFilter)
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (sortBy !== "newest") params.set("sort", sortBy)
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
        window.history.replaceState({}, "", newUrl)
    }, [statusFilter, debouncedSearch, sortBy])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            if (e.ctrlKey && e.key === "n") {
                e.preventDefault()
                setCreateOpen(true)
            }
            if (e.ctrlKey && e.key === "f") {
                e.preventDefault()
                document.getElementById("campaign-search")?.focus()
            }
            if (e.key === "Delete" && selectedIds.length > 0) {
                e.preventDefault()
                setDeleteOpen(true)
            }
            if (e.key === "Escape") {
                setSelectedIds([])
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedIds])

    // Rename modal state
    const [renameOpen, setRenameOpen] = useState(false)
    const [renameCampaignId, setRenameCampaignId] = useState<string | null>(null)
    const [renameCampaignName, setRenameCampaignName] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)

    // Share modal state
    const [shareOpen, setShareOpen] = useState(false)
    const [shareCampaignId, setShareCampaignId] = useState<string | null>(null)
    const [shareCampaignName, setShareCampaignName] = useState("")

    // Delete Modal State
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)

    // Duplicate Modal State
    const [duplicateOpen, setDuplicateOpen] = useState(false)
    const [campaignToDuplicate, setCampaignToDuplicate] = useState<string | null>(null)
    const [duplicateName, setDuplicateName] = useState("")



    // Workspace state
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")

    useEffect(() => {
        loadWorkspaces()
    }, [])

    useEffect(() => {
        fetchCampaigns()
        const interval = setInterval(fetchCampaigns, 10000)
        return () => clearInterval(interval)
    }, [currentWorkspace, workspaces])

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces')
            if (res.ok) {
                const data = await res.json()
                setWorkspaces(data)
                const savedWorkspace = localStorage.getItem('activeWorkspace')
                if (savedWorkspace) {
                    setCurrentWorkspace(savedWorkspace)
                }
            }
        } catch (error) {
            console.error("Failed to load workspaces:", error)
        }
    }

    const switchWorkspace = (workspaceName: string) => {
        setCurrentWorkspace(workspaceName)
        localStorage.setItem('activeWorkspace', workspaceName)
    }

    const filteredWorkspaces = workspaces.filter((w: any) =>
        w.name.toLowerCase().includes(workspaceSearch.toLowerCase())
    )

    const fetchCampaigns = async () => {
        try {
            const workspace = workspaces.find((w: any) => w.name === currentWorkspace)
            const workspaceId = workspace?.id || 'all'

            const url = workspaceId === 'all'
                ? '/api/campaigns'
                : `/api/campaigns?workspaceId=${workspaceId}`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setCampaigns(data)
            }
        } catch (error) {
            console.error("Failed to fetch campaigns", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCampaign = async () => {
        if (!newCampaignName.trim()) return
        setIsCreating(true)

        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCampaignName })
            })

            if (res.ok) {
                const campaign = await res.json()
                setCreateOpen(false)
                // Redirect immediately to the campaign setup (Leads)
                router.push(`/campaigns/${campaign.id}/leads`)
                toast({ title: "Campaign created", description: "Redirecting to setup..." })
            } else {
                const errorData = await res.json().catch(() => ({}))
                toast({ title: "Error", description: errorData.error || `Failed: ${res.status}`, variant: "destructive" })
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to create campaign. Check network.", variant: "destructive" })
        } finally {
            setIsCreating(false)
        }
    }

    const updateCampaignStatus = async (id: string, currentStatus: string) => {
        // Normalize status check
        const isCurrentlyActive = currentStatus.toLowerCase() === 'active'
        const newStatus = isCurrentlyActive ? 'paused' : 'active'

        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                fetchCampaigns()
                toast({ title: "Status updated", description: `Campaign is now ${newStatus}` })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    // ...

    const toggleSelectAll = (checked: boolean) => {
        if (checked && campaigns.length > 0) {
            setSelectedIds(campaigns.map(c => c.id))
        } else {
            setSelectedIds([])
        }
    }

    const toggleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id])
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id))
        }
    }

    const deleteCampaign = (id: string) => {
        setCampaignToDelete(id)
        setDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!campaignToDelete) return

        try {
            const res = await fetch(`/api/campaigns/${campaignToDelete}`, { method: 'DELETE' })
            if (res.ok) {
                setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete))
                toast({ title: "Campaign deleted", description: "The campaign has been moved to trash." })
            } else {
                toast({ title: "Error", description: "Failed to delete campaign", variant: "destructive" })
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to delete campaign", variant: "destructive" })
        } finally {
            setDeleteOpen(false)
        }
    }

    const openRenameModal = (id: string, currentName: string) => {
        setRenameCampaignId(id)
        setRenameCampaignName(currentName)
        setRenameOpen(true)
    }

    const handleRenameCampaign = async () => {
        if (!renameCampaignId || !renameCampaignName.trim()) return

        setIsRenaming(true)
        try {
            const res = await fetch(`/api/campaigns/${renameCampaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: renameCampaignName })
            })

            if (res.ok) {
                fetchCampaigns()
                setRenameOpen(false)
                toast({ title: "Success", description: "Campaign renamed successfully" })
            } else {
                toast({ title: "Error", description: "Failed to rename campaign", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to rename campaign", variant: "destructive" })
        } finally {
            setIsRenaming(false)
        }
    }

    const openDuplicateModal = (id: string, name: string) => {
        setCampaignToDuplicate(id)
        setDuplicateName(`${name} (copy)`)
        setDuplicateOpen(true)
    }

    const handleDuplicateCampaign = async () => {
        if (!campaignToDuplicate || !duplicateName.trim()) return

        // Show loading state
        toast({ title: "Duplicating campaign...", description: "Please wait while we copy your sequences and settings." })

        try {
            const res = await fetch(`/api/campaigns/${campaignToDuplicate}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: duplicateName })
            })

            if (res.ok) {
                const newCampaign = await res.json()
                setDuplicateOpen(false)
                toast({ title: "Campaign duplicated", description: "Redirecting you to the new campaign..." })
                router.push(`/campaigns/${newCampaign.id}`)
            } else {
                const errorData = await res.json()
                toast({
                    title: "Error",
                    description: errorData.error || "Failed to duplicate campaign",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({ title: "Error", description: "Network error occurred", variant: "destructive" })
        }
    }

    const openShareModal = (id: string, name: string) => {
        setShareCampaignId(id)
        setShareCampaignName(name)
        setShareOpen(true)
    }

    const copyShareLink = () => {
        const shareLink = `${window.location.origin}/campaigns/${shareCampaignId}`
        navigator.clipboard.writeText(shareLink)
        toast({ title: "Success", description: "Link copied to clipboard" })
    }

    // ...

    const handleRowClick = (e: React.MouseEvent, id: string) => {
        const target = e.target as HTMLElement
        if (
            target.closest('button') ||
            target.closest('[role="checkbox"]') ||
            target.closest('[data-radix-collection-item]') ||
            target.closest('.no-row-click')
        ) {
            return
        }
        router.push(`/campaigns/${id}`)
    }

    // Filtering and sorting logic
    const filteredAndSortedCampaigns = campaigns
        .filter(campaign => {
            // Search filter
            if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }
            // Status filter
            if (statusFilter === "all") return true
            if (statusFilter === "active") return campaign.status.toLowerCase() === "active"
            if (statusFilter === "draft") return campaign.status.toLowerCase() === "draft"
            if (statusFilter === "paused") return campaign.status.toLowerCase() === "paused"
            if (statusFilter === "error") return campaign.status.toLowerCase() === "error"
            if (statusFilter === "completed") return campaign.status.toLowerCase() === "completed"
            if (statusFilter === "evergreen") return campaign.evergreen === true
            return true
        })
        .sort((a, b) => {
            if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            if (sortBy === "name_asc") return a.name.localeCompare(b.name)
            if (sortBy === "name_desc") return b.name.localeCompare(a.name)
            return 0
        })

    const handleExportCSV = async () => {
        setIsExporting(true)
        setExportProgress(0)

        try {
            const total = filteredAndSortedCampaigns.length
            let processed = 0

            const csvRows = [["Name", "Status", "Sent", "Opened", "Clicked", "Replied", "Bounced"]]

            for (const campaign of filteredAndSortedCampaigns) {
                csvRows.push([
                    campaign.name,
                    campaign.status,
                    (campaign.sentCount || 0).toString(),
                    (campaign.openCount || 0).toString(),
                    (campaign.clickCount || 0).toString(),
                    (campaign.replyCount || 0).toString(),
                    (campaign.bounceCount || 0).toString()
                ])
                processed++
                setExportProgress(Math.round((processed / total) * 100))
                if (processed % 50 === 0) await new Promise(r => setTimeout(r, 10))
            }

            const csv = csvRows.map(row => row.join(",")).join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "campaigns.csv"
            a.click()
            toast({ title: "Success", description: `Exported ${total} campaigns to CSV` })
        } finally {
            setIsExporting(false)
            setExportProgress(0)
        }
    }

    const handleExportExcel = async () => {
        setIsExporting(true)
        setExportProgress(0)

        try {
            const total = filteredAndSortedCampaigns.length
            let processed = 0

            const headers = ["Name", "Status", "Sent", "Opened", "Clicked", "Replied", "Bounced", "Created At", "Updated At"]
            const rows = [headers]

            for (const campaign of filteredAndSortedCampaigns) {
                rows.push([
                    campaign.name,
                    campaign.status,
                    (campaign.sentCount || 0).toString(),
                    (campaign.openCount || 0).toString(),
                    (campaign.clickCount || 0).toString(),
                    (campaign.replyCount || 0).toString(),
                    (campaign.bounceCount || 0).toString(),
                    campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : "",
                    campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleDateString() : ""
                ])
                processed++
                setExportProgress(Math.round((processed / total) * 100))
            }

            const content = rows.map(row => row.join("\t")).join("\n")
            const blob = new Blob([content], { type: "application/vnd.ms-excel" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "campaigns.xls"
            a.click()
            toast({ title: "Success", description: `Exported ${total} campaigns to Excel` })
        } finally {
            setIsExporting(false)
            setExportProgress(0)
        }
    }

    // Legacy export function
    const handleExport = handleExportCSV

    return (
        <div className="min-h-screen bg-background p-8 text-foreground font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                    <div className="flex items-center gap-4">

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-border bg-secondary text-foreground hover:text-foreground hover:bg-muted gap-2">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    {currentWorkspace}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-secondary border-border text-foreground">
                                <div className="p-2">
                                    <Input
                                        placeholder="Search"
                                        value={workspaceSearch}
                                        onChange={(e) => setWorkspaceSearch(e.target.value)}
                                        className="bg-background border-border text-foreground text-sm h-8 mb-2"
                                    />
                                </div>
                                <DropdownMenuSeparator className="bg-muted" />
                                {filteredWorkspaces.map((workspace) => (
                                    <DropdownMenuItem
                                        key={workspace.id || workspace.name}
                                        onClick={() => switchWorkspace(workspace.name)}
                                        className={cn(
                                            "cursor-pointer focus:bg-muted focus:text-foreground",
                                            currentWorkspace === workspace.name && "bg-blue-500/20 text-blue-400"
                                        )}
                                    >
                                        <Zap className="h-4 w-4 mr-2 text-blue-500" />
                                        {workspace.name}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-muted" />
                                <DropdownMenuItem onClick={() => router.push('/settings/workspaces')} className="cursor-pointer focus:bg-muted focus:text-foreground text-blue-400">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Workspace
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-muted" />
                                <DropdownMenuItem onClick={() => router.push('/settings/profile')} className="cursor-pointer focus:bg-muted focus:text-foreground">Settings</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/settings/billing')} className="cursor-pointer focus:bg-muted focus:text-foreground">Billing</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-muted" />
                                <DropdownMenuItem
                                    className="text-red-400 focus:text-red-400 focus:bg-red-900/10 cursor-pointer"
                                    onClick={() => {
                                        import("next-auth/react").then(({ signOut }) => {
                                            signOut({ callbackUrl: "/login" })
                                        })
                                    }}
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="relative w-[320px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card border-border text-foreground focus:border-border h-10 rounded-lg focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Status Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 border-border bg-card text-foreground hover:bg-secondary hover:text-foreground gap-2">
                                    <Zap className="h-4 w-4 text-blue-400" />
                                    {statusFilter === "all" && "All statuses"}
                                    {statusFilter === "active" && "Active"}
                                    {statusFilter === "draft" && "Draft"}
                                    {statusFilter === "paused" && "Paused"}
                                    {statusFilter === "error" && "Error"}
                                    {statusFilter === "completed" && "Completed"}
                                    {statusFilter === "evergreen" && "Evergreen"}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-secondary border-border text-foreground">
                                <div className="p-2">
                                    <Input
                                        placeholder="Search"
                                        className="bg-background border-border text-foreground text-sm h-8"
                                    />
                                </div>
                                <DropdownMenuSeparator className="bg-muted" />
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("all")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground flex items-center gap-2", statusFilter === "all" && "bg-blue-500/20 text-blue-400")}
                                >
                                    <Zap className="h-4 w-4 text-blue-400" />
                                    All statuses
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("active")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground flex items-center gap-2", statusFilter === "active" && "bg-blue-500/20 text-blue-400")}
                                >
                                    <Play className="h-4 w-4 text-green-400" />
                                    Active
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("draft")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground flex items-center gap-2", statusFilter === "draft" && "bg-blue-500/20 text-blue-400")}
                                >
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("paused")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground flex items-center gap-2", statusFilter === "paused" && "bg-blue-500/20 text-blue-400")}
                                >
                                    <Pause className="h-4 w-4 text-yellow-400" />
                                    Paused
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("error")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground flex items-center gap-2", statusFilter === "error" && "bg-blue-500/20 text-blue-400")}
                                >
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    Error
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("completed")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground flex items-center gap-2", statusFilter === "completed" && "bg-blue-500/20 text-blue-400")}
                                >
                                    <ChevronLeft className="h-4 w-4 text-green-400 rotate-90" />
                                    Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("evergreen")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground flex items-center gap-2", statusFilter === "evergreen" && "bg-blue-500/20 text-blue-400")}
                                >
                                    <InfinityIcon className="h-4 w-4 text-blue-400" />
                                    Evergreen
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sorting Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 border-border bg-card text-foreground hover:bg-secondary hover:text-foreground gap-2">
                                    {sortBy === "newest" && "Newest first"}
                                    {sortBy === "oldest" && "Oldest first"}
                                    {sortBy === "name_asc" && "Name (A-Z)"}
                                    {sortBy === "name_desc" && "Name (Z-A)"}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 bg-secondary border-border text-foreground">
                                <DropdownMenuItem
                                    onClick={() => setSortBy("newest")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground", sortBy === "newest" && "bg-blue-500/20 text-blue-400")}
                                >
                                    Newest first
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("oldest")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground", sortBy === "oldest" && "bg-blue-500/20 text-blue-400")}
                                >
                                    Oldest first
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("name_asc")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground", sortBy === "name_asc" && "bg-blue-500/20 text-blue-400")}
                                >
                                    Name (A-Z)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("name_desc")}
                                    className={cn("cursor-pointer focus:bg-muted focus:text-foreground", sortBy === "name_desc" && "bg-blue-500/20 text-blue-400")}
                                >
                                    Name (Z-A)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-10 w-10 p-0 border-border bg-card text-foreground hover:bg-secondary hover:text-foreground"
                                        onClick={handleExport}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Export to CSV</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-foreground h-10 px-6 font-medium rounded-lg gap-2">
                            <Plus className="h-4 w-4" />
                            Add New
                        </Button>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-[50px_3fr_1.5fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 text-[11px] font-bold text-[#666666] uppercase tracking-wider">
                        <div className="flex items-center">
                            <Checkbox
                                checked={campaigns.length > 0 && selectedIds.length === campaigns.length}
                                onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                                className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </div>
                        <div>Name</div>
                        <div>Status</div>
                        <div>Progress</div>
                        <div>Sent</div>
                        <div>Click</div>
                        <div>Replied</div>
                        <div>Opportunities</div>
                        <div className="text-right"></div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : filteredAndSortedCampaigns.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={Rocket}
                                title={searchQuery || statusFilter !== "all" ? "No campaigns found" : "No campaigns yet"}
                                description={searchQuery || statusFilter !== "all" ? "Try adjusting your filters or search query" : "Create your first campaign to start reaching out to prospects."}
                                actionLabel={!searchQuery && statusFilter === "all" ? "Create Campaign" : undefined}
                                onAction={!searchQuery && statusFilter === "all" ? () => setCreateOpen(true) : undefined}
                            />
                        </div>
                    ) : (
                        filteredAndSortedCampaigns.map((campaign) => (
                            <div
                                key={campaign.id}
                                onClick={(e) => handleRowClick(e, campaign.id)}
                                className={cn(
                                    "group grid grid-cols-[50px_3fr_1.5fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-5 bg-card border border-border rounded-xl items-center hover:border-[#333333] transition-all cursor-pointer",
                                    selectedIds.includes(campaign.id) && "border-blue-900 bg-blue-900/10"
                                )}
                            >
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.includes(campaign.id)}
                                        onCheckedChange={(checked) => toggleSelectOne(campaign.id, checked as boolean)}
                                        className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px]"
                                    />
                                </div>

                                <div className="font-semibold text-foreground/90 text-sm truncate">
                                    {campaign.name}
                                </div>

                                <div>
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "font-medium capitalize px-2.5 py-0.5 min-w-[80px] justify-center rounded-lg border-0",
                                            campaign.status === "active" && "bg-green-500/10 text-green-400 hover:bg-green-500/20",
                                            campaign.status === "completed" && "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
                                            campaign.status === "error" && "bg-red-500/10 text-red-400 hover:bg-red-500/20",
                                            (campaign.status === "draft" || campaign.status === "paused") && "bg-muted text-muted-foreground hover:bg-[#333]"
                                        )}
                                    >
                                        {campaign.status}
                                    </Badge>
                                </div>

                                <div>
                                    {(() => {
                                        const leadsCount = campaign._count?.leads || 0
                                        const stepsCount = campaign._count?.sequences || 0
                                        const totalExpected = leadsCount * stepsCount
                                        let progress = totalExpected > 0
                                            ? Math.min(100, Math.round(((campaign.sentCount || 0) / totalExpected) * 100))
                                            : 0

                                        if (campaign.status === 'completed') progress = 100

                                        return (
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium">{progress}%</span>
                                            </div>
                                        )
                                    })()}
                                </div>

                                <div className="text-muted-foreground text-sm font-medium">{campaign.sentCount || "-"}</div>
                                <div className="text-muted-foreground text-sm font-medium">{campaign.clickCount ? `${campaign.clickCount}%` : "-"}</div>
                                <div className="text-muted-foreground text-sm font-medium">{campaign.replyCount ? `${campaign.replyCount}%` : "-"}</div>
                                <div className="text-muted-foreground text-sm font-medium">{campaign.opportunities || "-"}</div>

                                <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                                        onClick={() => updateCampaignStatus(campaign.id, campaign.status)}
                                    >
                                        {campaign.status === "active" ? (
                                            <Pause className="h-4 w-4 fill-current" />
                                        ) : (
                                            <Play className="h-4 w-4 fill-current" />
                                        )}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground p-1">
                                            <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign.id}`)} className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2">
                                                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openRenameModal(campaign.id, campaign.name)} className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2">
                                                <Terminal className="mr-2 h-4 w-4 text-muted-foreground" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteCampaign(campaign.id)} className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2">
                                                <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" /> Delete
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                console.log("Duplicate clicked for:", campaign.id);
                                                openDuplicateModal(campaign.id, campaign.name);
                                            }} className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2">
                                                <Copy className="mr-2 h-4 w-4 text-muted-foreground" /> Duplicate campaign
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast({ title: "Downloading CSV...", description: "Analytics export started." })} className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2">
                                                <Download className="mr-2 h-4 w-4 text-muted-foreground" /> Download analytics CSV
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    import('@/lib/pdf-export').then(({ generateCampaignReport }) => {
                                                        generateCampaignReport(campaign)
                                                        toast({ title: "PDF Generated", description: "Report downloaded successfully" })
                                                    })
                                                }}
                                                className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2"
                                            >
                                                <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Download PDF Report
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openShareModal(campaign.id, campaign.name)} className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2">
                                                <Share2 className="mr-2 h-4 w-4 text-muted-foreground" /> Share Campaign
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Campaign Modal - Premium Aesthetic */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen} >
                <DialogContent className="bg-[#0c0c10] border-white/10 sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] shadow-2xl backdrop-blur-xl">
                    <div className="sr-only">
                        <DialogTitle>Create New Campaign</DialogTitle>
                    </div>
                    <div className="p-10 space-y-10">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black text-white tracking-tight">Let's create a new campaign</h2>
                            <p className="text-gray-500 font-medium">What would you like to name it?</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Campaign Name</label>
                            <Input
                                autoFocus
                                value={newCampaignName}
                                onChange={e => setNewCampaignName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateCampaign()}
                                className="text-xl bg-white/5 border-white/10 h-16 px-6 rounded-2xl text-white font-bold focus-visible:ring-1 focus-visible:ring-blue-600 transition-all placeholder:text-gray-800"
                                placeholder="e.g. Q4 Outreach"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-gray-500 hover:text-white font-bold h-14 px-8 rounded-2xl transition-colors">
                                Cancel
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-10 h-16 text-lg font-black shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleCreateCampaign}
                                disabled={isCreating || !newCampaignName.trim()}
                            >
                                {isCreating ? "Creating..." : "Continue >"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Rename Campaign Modal - Premium Aesthetic */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen} >
                <DialogContent className="bg-[#0c0c10] border-white/10 sm:max-w-[500px] p-0 overflow-hidden rounded-[28px] shadow-2xl backdrop-blur-xl">
                    <div className="sr-only">
                        <DialogTitle>Rename Campaign</DialogTitle>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">Rename Campaign</h2>
                            <p className="text-gray-500 font-medium italic">Change the identifier for your campaign</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Campaign Name</label>
                            <Input
                                autoFocus
                                value={renameCampaignName}
                                onChange={e => setRenameCampaignName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRenameCampaign()}
                                className="text-lg bg-white/5 border-white/10 h-14 px-5 rounded-2xl text-white font-bold focus-visible:ring-1 focus-visible:ring-blue-600"
                            />
                        </div>

                        <div className="flex justify-end items-center gap-4 pt-2">
                            <Button variant="ghost" onClick={() => setRenameOpen(false)} className="text-gray-500 hover:text-white font-bold h-12 px-6 rounded-xl transition-colors">
                                Cancel
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-8 h-12 shadow-lg transition-all active:scale-95"
                                onClick={handleRenameCampaign}
                                disabled={isRenaming || !renameCampaignName.trim()}
                            >
                                {isRenaming ? "Renaming..." : "Rename"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >


            {/* Duplicate Campaign Modal */}
            < Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen} >
                <DialogContent className="bg-card border-border sm:max-w-[400px] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <Copy className="h-4 w-4" />
                            Duplicate campaign
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-blue-500 font-medium ml-1">New name</Label>
                            <Input
                                autoFocus
                                value={duplicateName}
                                onChange={e => setDuplicateName(e.target.value)}
                                className="bg-background border-blue-600/50 text-foreground focus:border-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setDuplicateOpen(false)}
                                className="text-red-500 hover:text-red-400 hover:bg-transparent p-0 h-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDuplicateCampaign}
                                className="bg-secondary hover:bg-muted text-foreground border border-border"
                            >
                                Duplicate campaign
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Delete Campaign Modal - Premium Aesthetic */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen} >
                <DialogContent className="bg-[#0c0c10] border-red-900/20 sm:max-w-[450px] p-10 rounded-[32px] shadow-2xl backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Delete Campaign</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-2">
                            <Trash2 className="h-10 w-10 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">Are you sure?</h2>
                            <p className="text-gray-500 font-medium leading-relaxed">You will lose all contacts and data for this<br />campaign permanently!</p>
                        </div>

                        <div className="flex gap-4 pt-4 w-full">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-black text-gray-500 hover:text-white transition-colors"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black h-14 rounded-2xl shadow-[0_10px_30px_rgba(220,38,38,0.2)] transition-all active:scale-95"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >


            {/* Share Campaign Modal */}
            < Dialog open={shareOpen} onOpenChange={setShareOpen} >
                <DialogContent className="bg-background border-border sm:max-w-[500px] p-0 overflow-hidden">
                    <div className="sr-only">
                        <DialogTitle>Share Campaign</DialogTitle>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">Share Campaign</h2>
                            <p className="text-muted-foreground text-sm">Share "{shareCampaignName}" with others</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Campaign Link</label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/campaigns/${shareCampaignId}`}
                                    className="text-sm bg-card border-border h-10 px-4 rounded-lg text-muted-foreground"
                                />
                                <Button
                                    onClick={copyShareLink}
                                    className="bg-blue-600 hover:bg-blue-500 text-foreground rounded-lg px-4"
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="ghost" onClick={() => setShareOpen(false)} className="text-muted-foreground hover:text-foreground">
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    )
}
