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
import { Logo } from "@/components/ui/logo"
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
    DialogHeader,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FilterBar } from "@/components/common/FilterBar"
import { TagManager } from "@/components/common/TagManager"
import { CreateWorkspaceModal } from "@/components/app/CreateWorkspaceModal"
import { WorkspaceDropdown } from "@/components/app/workspace/WorkspaceDropdown"
import { WorkspaceManagerModal } from "@/components/app/workspace/WorkspaceManagerModal"
import { DeleteConfirmationDialog } from "@/components/app/workspace/DeleteConfirmationDialog"
import { useWorkspaces } from "@/contexts/WorkspaceContext"

import { useToast } from "@/components/ui/use-toast"

// Wrapper component with Suspense for useSearchParams
export default function CampaignsPageWithSuspense() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
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
    const [selectedTags, setSelectedTags] = useState<string[]>([])

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
                if (selectedIds.length === 1) {
                    setCampaignToDelete(selectedIds[0])
                } else {
                    setCampaignToDelete(selectedIds.join(','))
                }
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

    // Workspace assignment modal state
    const [workspaceAssignOpen, setWorkspaceAssignOpen] = useState(false)
    const [campaignForWorkspace, setCampaignForWorkspace] = useState<any>(null)
    const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([])
    const [isAssigningWorkspaces, setIsAssigningWorkspaces] = useState(false)

    // Delete Modal State
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)

    // Duplicate Modal State
    const [duplicateOpen, setDuplicateOpen] = useState(false)
    const [campaignToDuplicate, setCampaignToDuplicate] = useState<string | null>(null)
    const [duplicateName, setDuplicateName] = useState("")



    // Workspace state - using unified storage from context
    const { workspaces, refreshWorkspaces, selectedWorkspaceId, switchWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces()
    const [workspaceSearch, setWorkspaceSearch] = useState("")
    const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)

    // Workspace management modal states
    const [managerModalOpen, setManagerModalOpen] = useState(false)
    const [managerMode, setManagerMode] = useState<'create' | 'rename'>('create')
    const [workspaceToRename, setWorkspaceToRename] = useState<{ id: string; name: string } | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string; isDefault?: boolean } | null>(null)

    useEffect(() => {
        if (searchParams.get("welcome")) {
            toast({
                title: "Welcome to Instantly!",
                description: "You have successfully logged in. Let's start reaching out!",
            })
            // Clear the param from URL without reloading
            const params = new URLSearchParams(searchParams.toString())
            params.delete("welcome")
            const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
            window.history.replaceState({}, "", newUrl)
        }
    }, [searchParams])

    useEffect(() => {
        fetchCampaigns()
        const interval = setInterval(fetchCampaigns, 10000)
        return () => clearInterval(interval)
    }, [selectedWorkspaceId, workspaces, selectedTags])

    const filteredWorkspaces = workspaces.filter((w: any) =>
        w.name.toLowerCase().includes(workspaceSearch.toLowerCase())
    )

    const fetchCampaigns = async () => {
        try {
            // Use workspace ID from unified storage - null means show all (My Organization)
            let url = `/api/campaigns?t=${Date.now()}`
            if (selectedWorkspaceId) {
                url += `&workspaceId=${selectedWorkspaceId}`
            }
            if (selectedTags.length > 0) {
                url += `&tags=${selectedTags.join(',')}`
            }

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
                body: JSON.stringify({
                    name: newCampaignName,
                    workspaceIds: selectedWorkspaceId ? [selectedWorkspaceId] : []
                })
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

        // Always redirect to launch page for activation to perform checks
        if (newStatus === 'active') {
            router.push(`/campaigns/${id}/launch`)
            return
        }

        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                // Refresh list
                const updatedCampaigns = campaigns.map(c =>
                    c.id === id ? { ...c, status: newStatus } : c
                )
                setCampaigns(updatedCampaigns)
                toast({ title: "Status updated", description: `Campaign is now ${newStatus}` })
            } else {
                throw new Error("Failed to update status")
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

        const idsToDelete = campaignToDelete.split(',')
        let successCount = 0

        try {
            for (const id of idsToDelete) {
                const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
                if (res.ok) successCount++
            }

            if (successCount > 0) {
                setCampaigns(prev => prev.filter(c => !idsToDelete.includes(c.id)))
                setSelectedIds([])
                toast({
                    title: successCount === 1 ? "Campaign deleted" : "Campaigns deleted",
                    description: successCount === 1 ? "The campaign has been permanently deleted." : `${successCount} campaigns have been permanently deleted.`
                })
            } else {
                toast({ title: "Error", description: "Failed to delete campaign(s)", variant: "destructive" })
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "An error occurred during deletion", variant: "destructive" })
        } finally {
            setDeleteOpen(false)
            setCampaignToDelete(null)
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

    const openWorkspaceAssign = (campaign: any) => {
        setCampaignForWorkspace(campaign)
        // Pre-select current workspaces
        const currentWorkspaceIds = campaign.campaignWorkspaces?.map((cw: any) => cw.workspaceId) || []
        setSelectedWorkspaceIds(currentWorkspaceIds)
        setWorkspaceAssignOpen(true)
    }

    const handleAssignWorkspaces = async () => {
        if (!campaignForWorkspace) return

        setIsAssigningWorkspaces(true)
        try {
            const res = await fetch(`/api/campaigns/${campaignForWorkspace.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceIds: selectedWorkspaceIds })
            })

            if (res.ok) {
                fetchCampaigns()
                setWorkspaceAssignOpen(false)
                toast({ title: "Success", description: "Workspace assignment updated" })
            } else {
                toast({ title: "Error", description: "Failed to update workspaces", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update workspaces", variant: "destructive" })
        } finally {
            setIsAssigningWorkspaces(false)
        }
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

            const csv = csvRows.map(row =>
                row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
            ).join("\n")
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
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
            // Dynamic import xlsx library
            const XLSX = await import('xlsx')

            const total = filteredAndSortedCampaigns.length
            let processed = 0

            const headers = ["Name", "Status", "Sent", "Opened", "Clicked", "Replied", "Bounced", "Created At", "Updated At"]
            const rows = [headers]

            for (const campaign of filteredAndSortedCampaigns) {
                rows.push([
                    campaign.name,
                    campaign.status,
                    campaign.sentCount || 0,
                    campaign.openCount || 0,
                    campaign.clickCount || 0,
                    campaign.replyCount || 0,
                    campaign.bounceCount || 0,
                    campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : "",
                    campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleDateString() : ""
                ])
                processed++
                setExportProgress(Math.round((processed / total) * 100))
            }

            // Create workbook and worksheet
            const ws = XLSX.utils.aoa_to_sheet(rows)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Campaigns")

            // Generate and download
            XLSX.writeFile(wb, "campaigns.xlsx")
            toast({ title: "Success", description: `Exported ${total} campaigns to Excel` })
        } catch (error) {
            console.error("Export error:", error)
            toast({ title: "Error", description: "Failed to export Excel file", variant: "destructive" })
        } finally {
            setIsExporting(false)
            setExportProgress(0)
        }
    }

    // Legacy export function
    const handleExport = handleExportCSV

    // Workspace management handlers
    const handleWorkspaceRename = (workspace: { id: string; name: string }) => {
        setWorkspaceToRename(workspace)
        setManagerMode('rename')
        setManagerModalOpen(true)
    }

    const handleWorkspaceDelete = (workspace: { id: string; name: string; isDefault?: boolean }) => {
        setWorkspaceToDelete(workspace)
        setDeleteDialogOpen(true)
    }

    const handleManagerSubmit = async (name: string): Promise<boolean> => {
        if (managerMode === 'rename' && workspaceToRename) {
            const success = await updateWorkspace(workspaceToRename.id, name)
            if (success) {
                await refreshWorkspaces()
            }
            return success
        }
        return false
    }

    const handleConfirmDelete = async (): Promise<boolean> => {
        if (!workspaceToDelete) return false
        const success = await deleteWorkspace(workspaceToDelete.id)
        if (success) {
            await refreshWorkspaces()
        }
        return success
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between bg-background">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Campaigns</h1>
                    <div className="flex items-center gap-4">

                        <WorkspaceDropdown
                            onRename={handleWorkspaceRename}
                            onDelete={handleWorkspaceDelete}
                            onCreate={() => setCreateWorkspaceOpen(true)}
                            showQuickActions={true}
                        />

                        <CreateWorkspaceModal
                            open={createWorkspaceOpen}
                            onOpenChange={setCreateWorkspaceOpen}
                            onWorkspaceCreated={refreshWorkspaces}
                        />

                        <WorkspaceManagerModal
                            open={managerModalOpen}
                            onOpenChange={setManagerModalOpen}
                            mode={managerMode}
                            workspace={workspaceToRename}
                            onSubmit={handleManagerSubmit}
                        />

                        <DeleteConfirmationDialog
                            open={deleteDialogOpen}
                            onOpenChange={setDeleteDialogOpen}
                            workspace={workspaceToDelete}
                            onConfirm={handleConfirmDelete}
                        />
                    </div>
                </div>

                {/* Filter Toolbar */}
                <FilterBar
                    onSearchChange={setSearchQuery}
                    onTagsChange={setSelectedTags}
                    selectedTags={selectedTags}
                    className="px-8 pb-4 w-full"
                    placeholder="Search campaigns..."
                />

                {/* Toolbar */}
                <div className="px-8 pb-6 space-y-4">
                    <div className="flex w-full items-center justify-end gap-4 p-4">
                    <div className="flex items-center gap-3">
                        {/* Status Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 border-border bg-card text-foreground hover:bg-secondary hover:text-foreground gap-2">
                                    <Logo variant="icon" size="sm" />
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
                                    <Logo variant="icon" size="sm" />
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
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (selectedIds.length === 1) {
                                        setCampaignToDelete(selectedIds[0])
                                    } else {
                                        setCampaignToDelete(selectedIds.join(','))
                                    }
                                    setDeleteOpen(true)
                                }}
                                className="h-10 px-4 font-medium rounded-lg gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete ({selectedIds.length})
                            </Button>
                        )}
                        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-foreground h-10 px-6 font-medium rounded-lg gap-2">
                            <Plus className="h-4 w-4" />
                            Add New
                        </Button>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-[50px_3fr_1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 text-[11px] font-bold text-[#666666] uppercase tracking-wider">
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
                        <div>Open</div>
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
                                    "group grid grid-cols-[50px_3fr_1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-5 bg-card border border-border rounded-xl items-center hover:border-[#333333] transition-all cursor-pointer",
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

                                <div className="flex flex-col gap-2 min-w-0">
                                    <div className="font-semibold text-foreground/90 text-sm truncate" title={campaign.name}>
                                        {campaign.name}
                                    </div>
                                    {/* Workspace Badges */}
                                    <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                                        {campaign.campaignWorkspaces?.length === 0 ? (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-dashed border-muted-foreground/50 text-muted-foreground">
                                                Unassigned
                                            </Badge>
                                        ) : (
                                            campaign.campaignWorkspaces?.map((cw: any) => (
                                                <Badge 
                                                    key={cw.workspaceId} 
                                                    variant="secondary" 
                                                    className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-400 border-0"
                                                >
                                                    {cw.workspace?.name || 'Workspace'}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <TagManager
                                            entityId={campaign.id}
                                            entityType="campaign"
                                            selectedTags={campaign.tags?.map((t: any) => t.tag) || []}
                                            onTagsChange={() => fetchCampaigns()}
                                        />
                                    </div>
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
                                <div className="text-muted-foreground text-sm font-medium">{campaign.openRate ? `${campaign.openRate}%` : "-"}</div>
                                <div className="text-muted-foreground text-sm font-medium">{campaign.clickRate ? `${campaign.clickRate}%` : "-"}</div>
                                <div className="text-muted-foreground text-sm font-medium">{campaign.replyRate ? `${campaign.replyRate}%` : "-"}</div>
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
                                            <DropdownMenuSeparator className="bg-border" />
                                            <DropdownMenuItem onClick={() => openWorkspaceAssign(campaign)} className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2">
                                                <Zap className="mr-2 h-4 w-4 text-blue-500" /> Assign to Workspaces
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
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

            {/* Assign to Workspaces Modal */}
            <Dialog open={workspaceAssignOpen} onOpenChange={setWorkspaceAssignOpen}>
                <DialogContent className="bg-background border-border sm:max-w-[500px] p-0 overflow-hidden">
                    <div className="sr-only">
                        <DialogTitle>Assign to Workspaces</DialogTitle>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">Assign to Workspaces</h2>
                            <p className="text-muted-foreground text-sm">Select workspaces for "{campaignForWorkspace?.name}"</p>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {workspaces.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4 text-center">No workspaces available. Create a workspace first.</p>
                            ) : (
                                workspaces.map((ws: any) => (
                                    <div
                                        key={ws.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                            selectedWorkspaceIds.includes(ws.id)
                                                ? "border-blue-600 bg-blue-500/10"
                                                : "border-border hover:border-muted-foreground/50"
                                        )}
                                        onClick={() => {
                                            if (selectedWorkspaceIds.includes(ws.id)) {
                                                setSelectedWorkspaceIds(prev => prev.filter(id => id !== ws.id))
                                            } else {
                                                setSelectedWorkspaceIds(prev => [...prev, ws.id])
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedWorkspaceIds.includes(ws.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedWorkspaceIds(prev => [...prev, ws.id])
                                                } else {
                                                    setSelectedWorkspaceIds(prev => prev.filter(id => id !== ws.id))
                                                }
                                            }}
                                            className="border-muted-foreground data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-foreground">{ws.name}</div>
                                            {ws.isDefault && (
                                                <span className="text-xs text-muted-foreground">Default</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button
                                variant="ghost"
                                onClick={() => setWorkspaceAssignOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAssignWorkspaces}
                                disabled={isAssigningWorkspaces}
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                {isAssigningWorkspaces ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
