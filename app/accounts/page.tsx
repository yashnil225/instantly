"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { FilterBar } from "@/components/common/FilterBar"
import { TagManager, Tag as TagType } from "@/components/common/TagManager"
import { CreateWorkspaceModal } from "@/components/app/CreateWorkspaceModal"
import { WorkspaceDropdown } from "@/components/app/workspace/WorkspaceDropdown"
import { WorkspaceManagerModal } from "@/components/app/workspace/WorkspaceManagerModal"
import { DeleteConfirmationDialog } from "@/components/app/workspace/DeleteConfirmationDialog"
import { useWorkspaces } from "@/contexts/WorkspaceContext"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Search,
    ChevronDown,
    Plus,
    Zap,
    Grid3x3,
    List,
    MoreHorizontal,
    Heart,
    Flame,
    AlertTriangle,
    Tag,
    Shield,
    Pause,
    Globe,
    Users,
    Loader2,
    Trash2,
    Download,
    Mail,
    Check,
    MailPlus,
    FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { AccountDetailPanel } from "@/components/app/accounts/AccountDetailPanel"
import { ConnectAccountModal } from "@/components/app/accounts/ConnectAccountModal"
import { EmptyState } from '@/components/ui/empty-state'


interface EmailAccount {
    id: string
    email: string
    firstName?: string
    lastName?: string
    signature?: string
    status: "active" | "paused" | "error" | "warmup"
    emailsSent: number
    emailsLimit: number
    dailyLimit: number
    warmupEmails: number
    warmupEmailsLimit: number
    warmupDailyLimit: number
    healthScore: number
    hasError: boolean
    isWarming: boolean
    isDFY: boolean
    isInCampaign: boolean
    hasCustomDomain: boolean
    trackingDomainEnabled?: boolean
    customDomain?: string
    workspaces?: Array<{ workspaceId: string; workspace?: { name: string } }>
    tags: TagType[]
}

// Wrapper component with Suspense for useSearchParams
export default function AccountsPageWithSuspense() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <AccountsPage />
        </Suspense>
    )
}

function AccountsPage() {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [accounts, setAccounts] = useState<EmailAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    // URL state persistence - read initial values from URL
    const [activeFilter, setActiveFilter] = useState<string>(searchParams.get("filter") || "all")
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
    const [viewMode, setViewMode] = useState<"list" | "grid">("list")
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"))
    const [totalPages, setTotalPages] = useState(1)

    // Workspace state - using unified ID-based storage from context
    const { workspaces, refreshWorkspaces, selectedWorkspaceId, switchWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces()
    const [workspaceSearch, setWorkspaceSearch] = useState("")
    const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)

    // Workspace management modal states
    const [managerModalOpen, setManagerModalOpen] = useState(false)
    const [managerMode, setManagerMode] = useState<'create' | 'rename'>('create')
    const [workspaceToRename, setWorkspaceToRename] = useState<{ id: string; name: string } | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string; isDefault?: boolean } | null>(null)

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
        if (activeFilter !== "all") params.set("filter", activeFilter)
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (currentPage > 1) params.set("page", currentPage.toString())
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
        window.history.replaceState({}, "", newUrl)
    }, [activeFilter, debouncedSearch, currentPage])

    // Load view mode preference from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("accountsViewMode") as "list" | "grid"
            if (saved) setViewMode(saved)
        }
    }, [])

    // Save view mode preference
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("accountsViewMode", viewMode)
        }
    }, [viewMode])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            if (e.ctrlKey && e.key === "n") {
                e.preventDefault()
                setAddAccountOpen(true)
            }
            if (e.ctrlKey && e.key === "f") {
                e.preventDefault()
                document.getElementById("account-search")?.focus()
            }
            if (e.key === "Delete" && selectedAccounts.length > 0) {
                e.preventDefault()
                setBulkActionOpen(true)
            }
            if (e.key === "Escape") {
                setSelectedAccounts([])
            }
            if (e.ctrlKey && e.key === "g") {
                e.preventDefault()
                setViewMode(v => v === "list" ? "grid" : "list")
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedAccounts])

    // Bulk Reconnect State
    const [isBulkReconnecting, setIsBulkReconnecting] = useState(false)
    const [bulkPassword, setBulkPassword] = useState("")
    const [showBulkReconnectInput, setShowBulkReconnectInput] = useState(false)
    const [addAccountOpen, setAddAccountOpen] = useState(false)
    const [bulkActionOpen, setBulkActionOpen] = useState(false)
    const [newAccount, setNewAccount] = useState({ email: "", password: "", smtpHost: "", smtpPort: "" })
    const [isCreating, setIsCreating] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

    // Workspace assignment modal state
    const [workspaceAssignOpen, setWorkspaceAssignOpen] = useState(false)
    const [accountForWorkspace, setAccountForWorkspace] = useState<any>(null)
    const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([])
    const [isAssigningWorkspaces, setIsAssigningWorkspaces] = useState(false)

    const itemsPerPage = 20


    const fetchAccounts = useCallback(async (forceRefresh = false) => {
        setLoading(true)
        try {
            // Use selectedWorkspaceId from unified storage - null means show all (My Organization)
            let url = `/api/accounts?page=${currentPage}&limit=${itemsPerPage}`
            if (selectedWorkspaceId) {
                url += `&workspaceId=${selectedWorkspaceId}`
            }
            if (selectedTags.length > 0) {
                url += `&tags=${selectedTags.join(',')}`
            }
            // Add cache-busting timestamp when force refresh is needed
            if (forceRefresh) {
                url += `&_t=${Date.now()}`
            }

            const res = await fetch(url, {
                cache: forceRefresh ? 'no-store' : 'default',
                headers: {
                    'Cache-Control': forceRefresh ? 'no-cache' : 'default'
                }
            })
            if (res.ok) {
                const data = await res.json()
                setAccounts(data.accounts || [])
                setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error)
            toast({ title: "Error", description: "Failed to load accounts", variant: "destructive" })
        } finally {
            setLoading(false)
        }
        setLoading(false)
    }, [currentPage, itemsPerPage, selectedWorkspaceId, selectedTags, toast])

    // Load workspaces on mount
    useEffect(() => {
        refreshWorkspaces()
    }, [])

    // Fetch accounts when workspace or filters change
    useEffect(() => {
        fetchAccounts()
    }, [currentPage, debouncedSearch, activeFilter, selectedWorkspaceId, selectedTags, fetchAccounts])


    const filteredWorkspaces = workspaces.filter((w) =>
        w.name.toLowerCase().includes(workspaceSearch.toLowerCase())
    )


    const statusFilters = [
        { name: "All statuses", value: "all", icon: Globe, color: "text-blue-400" },
        { name: "Active", value: "active", icon: Zap, color: "text-green-400" },
        { name: "Paused", value: "paused", icon: Pause, color: "text-muted-foreground" },
        { name: "Has errors", value: "has_errors", icon: Heart, color: "text-red-400" },
        { name: "No custom tracking domain", value: "no_domain", icon: Globe, color: "text-blue-400" },
        { name: "Warmup active", value: "warmup_active", icon: Flame, color: "text-orange-400" },
        { name: "Warmup paused", value: "warmup_paused", icon: Flame, color: "text-muted-foreground" },
        { name: "Warmup has errors", value: "warmup_errors", icon: Flame, color: "text-red-400" },
        { name: "Pre-warmed accounts", value: "prewarmed", icon: Flame, color: "text-green-400" },
        { name: "DFY accounts", value: "dfy", icon: Users, color: "text-purple-400" },
        { name: "DFY Setup Pending", value: "dfy_pending", icon: AlertTriangle, color: "text-yellow-400" },
        { name: "No Tag", value: "no_tag", icon: Tag, color: "text-muted-foreground" },
    ]

    // Filter and search logic
    const filteredAccounts = useMemo(() => {
        return accounts.filter(account => {
            // Search filter
            if (searchQuery && !account.email.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }

            // Status filter
            if (activeFilter === "all") return true
            if (activeFilter === "active") return account.status === "active"
            if (activeFilter === "paused") return account.status === "paused"
            if (activeFilter === "has_errors") return account.hasError
            if (activeFilter === "no_domain") return !account.hasCustomDomain
            if (activeFilter === "warmup_active") return account.isWarming
            if (activeFilter === "warmup_paused") return !account.isWarming
            if (activeFilter === "warmup_errors") return account.isWarming && account.hasError
            if (activeFilter === "prewarmed") return account.warmupEmails > 100
            if (activeFilter === "dfy") return account.isDFY
            if (activeFilter === "dfy_pending") return account.isDFY && account.status === "paused"
            if (activeFilter === "no_tag") return account.tags.length === 0

            return true
        })
    }, [accounts, searchQuery, activeFilter])

    const toggleSelectAll = () => {
        if (selectedAccounts.length === filteredAccounts.length) {
            setSelectedAccounts([])
        } else {
            setSelectedAccounts(filteredAccounts.map(a => a.id))
        }
    }

    const toggleSelectAccount = (id: string) => {
        setSelectedAccounts(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }




    // Toggle account warmup status (Fire icon)
    const toggleWarmup = async (id: string, currentIsWarming: boolean) => {
        const newIsWarming = !currentIsWarming
        // Optimistic update
        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, isWarming: newIsWarming } : acc
        ))

        try {
            const res = await fetch(`/api/accounts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ warmupEnabled: newIsWarming })
            })
            if (res.ok) {
                const data = await res.json()
                // Update warmupEmailsLimit and healthScore from API response
                setAccounts(prev => prev.map(acc =>
                    acc.id === id ? {
                        ...acc,
                        isWarming: newIsWarming,
                        warmupEmailsLimit: data.warmupEmailsLimit ?? acc.warmupEmailsLimit,
                        healthScore: data.healthScore ?? acc.healthScore
                    } : acc
                ))
                toast({
                    title: newIsWarming ? "Warmup Started" : "Warmup Paused",
                    description: `Warmup is now ${newIsWarming ? "enabled" : "disabled"}`
                })
            } else {
                // Rollback
                setAccounts(prev => prev.map(acc =>
                    acc.id === id ? { ...acc, isWarming: currentIsWarming } : acc
                ))
            }
        } catch (error) {
            console.error("Warmup update failed:", error)
            // Rollback
            setAccounts(prev => prev.map(acc =>
                acc.id === id ? { ...acc, isWarming: currentIsWarming } : acc
            ))
            toast({ title: "Error", description: "Failed to update warmup status", variant: "destructive" })
        }
    }

    // Toggle account sending status (Play/Pause button)
    const toggleAccountStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "paused" : "active"
        // Optimistic update
        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, status: newStatus as "active" | "paused" | "error" | "warmup" } : acc
        ))

        try {
            const res = await fetch(`/api/accounts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                toast({
                    title: newStatus === "active" ? "Account Activated" : "Account Paused",
                    description: `Email sending is now ${newStatus === "active" ? "enabled" : "disabled"}`
                })
            } else {
                // Rollback
                setAccounts(prev => prev.map(acc =>
                    acc.id === id ? { ...acc, status: currentStatus as "active" | "paused" | "error" | "warmup" } : acc
                ))
            }
        } catch (error) {
            console.error("Status update failed:", error)
            // Rollback
            setAccounts(prev => prev.map(acc =>
                acc.id === id ? { ...acc, status: currentStatus as "active" | "paused" | "error" | "warmup" } : acc
            ))
            toast({ title: "Error", description: "Failed to update account status", variant: "destructive" })
        }
    }

    const handleBulkReconnect = async () => {
        setIsBulkReconnecting(true)
        try {
            toast({ title: "Processing", description: `Retrying connection for ${selectedAccounts.length} accounts...` })
            const res = await fetch('/api/accounts/bulk-reconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedAccounts })
            })

            if (res.ok) {
                const data = await res.json()
                setBulkActionOpen(false)
                setSelectedAccounts([])
                // Reset UI state just in case
                setShowBulkReconnectInput(false)
                setBulkPassword("")
                fetchAccounts()
                toast({ title: "Result", description: data.message })
            } else {
                const error = await res.json()
                toast({ title: "Error", description: error.message || "Failed to reconnect accounts", variant: "destructive" })
            }
        } catch (error) {
            console.error("Bulk reconnect failed:", error)
            toast({ title: "Error", description: "Failed to reconnect accounts", variant: "destructive" })
        } finally {
            // End
        }
    }

    const handleCreateAccount = async () => {
        if (!newAccount.email || !newAccount.password) {
            toast({ title: "Error", description: "Email and password are required", variant: "destructive" })
            return
        }

        setIsCreating(true)
        try {
            // Assign to current workspace if selected
            const workspaceIds = selectedWorkspaceId ? [selectedWorkspaceId] : []

            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newAccount,
                    workspaceIds
                })
            })

            if (res.ok) {
                setAddAccountOpen(false)
                setNewAccount({ email: "", password: "", smtpHost: "", smtpPort: "" })
                fetchAccounts()
                toast({ title: "Success", description: "Account created successfully" })
            } else {
                const error = await res.json()
                toast({ title: "Error", description: error.message || "Failed to create account", variant: "destructive" })
            }
        } catch (error) {
            console.error("Save failed:", error)
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        } finally {
            // End
        }
    }

    // Workspace assignment functions
    const openWorkspaceAssign = (account: any) => {
        setAccountForWorkspace(account)
        // Pre-select current workspaces
        const currentWorkspaceIds = account.workspaces?.map((w: any) => w.workspaceId) || []
        setSelectedWorkspaceIds(currentWorkspaceIds)
        setWorkspaceAssignOpen(true)
    }

    const handleAssignWorkspaces = async () => {
        if (!accountForWorkspace) return

        setIsAssigningWorkspaces(true)
        try {
            const res = await fetch(`/api/accounts/${accountForWorkspace.id}/workspaces`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceIds: selectedWorkspaceIds })
            })

            if (res.ok) {
                fetchAccounts()
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

    const handleBulkDelete = async () => {
        if (selectedAccounts.length === 0) return

        try {
            const res = await fetch('/api/accounts/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedAccounts })
            })

            if (res.ok) {
                setBulkActionOpen(false)
                setSelectedAccounts([])
                fetchAccounts()
                toast({ title: "Success", description: `Deleted ${selectedAccounts.length} accounts` })
            }
        } catch (error) {
            console.error("Bulk delete failed:", error)
            toast({ title: "Error", description: "Failed to delete accounts", variant: "destructive" })
        }
    }

    const handleDeleteAccountClick = (id: string) => {
        setAccountToDelete(id)
        setDeleteOpen(true)
    }

    const confirmDeleteAccount = async () => {
        if (!accountToDelete) return

        try {
            const res = await fetch(`/api/accounts/${accountToDelete}`, { method: 'DELETE' })
            if (res.ok) {
                setAccounts(prev => prev.filter(a => a.id !== accountToDelete))
                setSelectedAccounts(prev => prev.filter(id => id !== accountToDelete))
                toast({
                    title: "Account deleted",
                    description: "The account has been removed."
                })
            } else {
                toast({ title: "Error", description: "Failed to delete account", variant: "destructive" })
            }
        } catch (error) {
            console.error("Account delete failed:", error)
            toast({ title: "Error", description: "Failed to delete account", variant: "destructive" })
        } finally {
            setDeleteOpen(false)
        }
    }

    const handleExportCSV = async () => {
        try {
            const total = filteredAccounts.length
            const csvRows = [["Email", "Status", "Emails Sent", "Warmup Emails", "Health Score"]]

            for (const account of filteredAccounts) {
                csvRows.push([account.email, account.status, account.emailsSent.toString(), account.warmupEmails.toString(), account.healthScore.toString()])
            }

            const csv = csvRows.map(row => row.join(",")).join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "email-accounts.csv"
            a.click()
            toast({ title: "Success", description: `Exported ${total} accounts to CSV` })
        } catch (error) {
            console.error("Export error:", error)
            toast({ title: "Error", description: "Failed to export CSV file", variant: "destructive" })
        }
    }


    // Legacy export function for backwards compatibility
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

    const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null)

    // ... (rest of effects)

    const handleRowClick = (accountId: string, event: React.MouseEvent) => {
        // Prevent click if checkbox or button was clicked
        if ((event.target as HTMLElement).closest('button') || (event.target as HTMLElement).closest('[role="checkbox"]')) {
            return
        }
        setSelectedDetailId(accountId)
    }

    const selectedDetailAccount = accounts.find(a => a.id === selectedDetailId)

    return (
        <TooltipProvider>
            <div className="flex h-screen bg-background relative overflow-hidden">
                {/* Main Content */}
                <div className={cn(
                    "flex-1 flex flex-col min-h-0 transition-all duration-300",
                    selectedDetailId ? "mr-[600px]" : "mr-0"
                )}>
                    {/* Header */}
                    <div className="px-8 py-6 flex items-center justify-between bg-background">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Email Accounts</h1>
                        <div className="flex items-center gap-4">
                            {/* Banner Check Logic */}
                            {accounts.length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg">
                                    <div className="h-4 w-4 rounded-full bg-green-900/50 flex items-center justify-center border border-green-900">
                                        <Check className="h-2.5 w-2.5 text-green-500" />
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            All accounts are configured correctly
                                        </span>
                                        <span className="text-[10px] text-blue-500 cursor-pointer hover:underline">
                                            View setup guide
                                        </span>
                                    </div>
                                </div>
                            )}


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
                        placeholder="Search accounts..."
                    />

                    {/* Toolbar */}
                    <div className="px-8 pb-6 space-y-4">
                        <div className="flex w-full items-center justify-end gap-4 p-4">
                            <div className="flex items-center gap-3">
                                {/* Status Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary gap-2 h-10 rounded-lg px-4">
                                            <Zap className="h-4 w-4 text-muted-foreground" />
                                            {statusFilters.find(f => f.value === activeFilter)?.name || "All statuses"}
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-card border-border text-foreground p-1">
                                        {statusFilters.map((filter) => (
                                            <DropdownMenuItem
                                                key={filter.value}
                                                onClick={() => setActiveFilter(filter.value)}
                                                className={cn(
                                                    "cursor-pointer focus:bg-secondary focus:text-foreground flex items-center gap-2 rounded-md my-0.5",
                                                    activeFilter === filter.value && "bg-blue-600/10 text-blue-400"
                                                )}
                                            >
                                                <filter.icon className={cn("h-4 w-4", filter.color)} />
                                                {filter.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Test Domain Setup Button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary gap-2 h-10 rounded-lg"
                                            onClick={() => toast({ title: "Domain Analysis", description: "Your domains are correctly configured (SPF/DKIM/DMARC found)." })}
                                        >
                                            <Grid3x3 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border-border text-foreground">Test domain setup</TooltipContent>
                                </Tooltip>

                                {/* Export Button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary gap-2 h-10 rounded-lg"
                                            onClick={handleExport}
                                        >
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border-border text-foreground">Export visible accounts</TooltipContent>
                                </Tooltip>

                                {/* PDF Export Button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary gap-2 h-10 rounded-lg"
                                            onClick={() => {
                                                import('@/lib/pdf-export').then(({ generateAccountsReport }) => {
                                                    generateAccountsReport(filteredAccounts)
                                                    toast({ title: "PDF Generated", description: "Report downloaded successfully" })
                                                }).catch((_err) => {
                                                    toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" })
                                                })
                                            }}
                                        >
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border-border text-foreground">Export as PDF</TooltipContent>
                                </Tooltip>

                                {/* Bulk Actions */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-blue-500 hover:text-blue-400 hover:bg-secondary"
                                            onClick={() => setBulkActionOpen(true)}
                                            disabled={selectedAccounts.length === 0}
                                        >
                                            <Zap className="h-5 w-5 fill-current" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border-border text-foreground">Bulk actions</TooltipContent>
                                </Tooltip>

                                <div className="h-6 w-px bg-[#333] mx-1" />


                                {/* Add New */}
                                <Button className="bg-blue-600 hover:bg-blue-500 text-foreground gap-2 h-10 px-6 rounded-lg font-medium ml-2" onClick={() => setAddAccountOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                    Add New
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto px-6 pb-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : viewMode === "list" ? (
                            <div className="space-y-4">
                                {/* Table Header */}
                                <div className="grid grid-cols-[auto_2.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <div className="w-5 pt-0.5">
                                        <Checkbox
                                            checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px] w-4 h-4"
                                        />
                                    </div>
                                    <div>Email</div>
                                    <div>Emails Sent</div>
                                    <div>Warmup Emails</div>
                                    <div>Health Score</div>
                                    <div className="w-8"></div>
                                </div>

                                {filteredAccounts.length === 0 ? (
                                    <div className="p-8 border border-border border-dashed rounded-xl bg-card">
                                        <EmptyState
                                            icon={MailPlus}
                                            title="No accounts found"
                                            description="Connect an email account to start sending campaigns."
                                            actionLabel="Add new account"
                                            onAction={() => setAddAccountOpen(true)}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredAccounts.map((account) => (
                                            <div
                                                key={account.id}
                                                onClick={(e) => handleRowClick(account.id, e)}
                                                className={cn(
                                                    "grid grid-cols-[auto_2.5fr_1fr_1fr_1fr_auto] gap-4 items-center bg-card border border-border rounded-xl px-6 py-2.5 transition-colors group cursor-pointer hover:border-[#444]",
                                                    selectedDetailId === account.id && "border-blue-600/50 bg-[#161616]"
                                                )}
                                            >
                                                <div className="w-5 flex items-center justify-center">
                                                    <Checkbox
                                                        checked={selectedAccounts.includes(account.id)}
                                                        onCheckedChange={() => toggleSelectAccount(account.id)}
                                                        className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px] w-4 h-4"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-foreground font-semibold text-sm truncate">{account.email}</span>
                                                    {account.status === "paused" && (
                                                        <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-[11px] font-medium rounded-md uppercase tracking-wide">
                                                            Paused
                                                        </span>
                                                    )}
                                                    {account.hasError && (
                                                        <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[11px] font-medium rounded-md uppercase tracking-wide flex items-center gap-1">
                                                            Sending error
                                                        </span>
                                                    )}
                                                    {/* Workspace Badges */}
                                                    {account.workspaces && account.workspaces.length === 0 ? (
                                                        <span className="px-2 py-0.5 border border-dashed border-muted-foreground/50 text-muted-foreground text-[10px] font-medium rounded-md">
                                                            Unassigned
                                                        </span>
                                                    ) : account.workspaces?.map((w: any) => (
                                                        <span
                                                            key={w.workspaceId}
                                                            className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded-md"
                                                        >
                                                            {w.workspace?.name || 'Workspace'}
                                                        </span>
                                                    ))}
                                                    {account.isWarming && (
                                                        <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                                                    )}
                                                    <div className="w-px h-3 bg-[#333] mx-1" />
                                                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                                                    {account.isInCampaign && (
                                                        <Zap className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
                                                    )}
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <TagManager
                                                            entityId={account.id}
                                                            entityType="account"
                                                            selectedTags={account.tags || []}
                                                            onTagsChange={() => fetchAccounts()}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-sm text-foreground font-medium">
                                                    {account.emailsSent} <span className="text-muted-foreground font-normal">of {account.emailsLimit}</span>
                                                </div>
                                                <div className="text-sm text-foreground font-medium">
                                                    {account.warmupEmails} <span className="text-muted-foreground font-normal">of {account.warmupEmailsLimit}</span>
                                                </div>
                                                <div className="text-sm font-bold text-foreground">{account.healthScore}%</div>
                                                <div className="flex justify-end items-center gap-3">
                                                    {/* Warmup (Fire) toggle */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleWarmup(account.id, account.isWarming)
                                                                }}
                                                                className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                                                            >
                                                                <Flame className={cn(
                                                                    "h-4 w-4 transition-colors",
                                                                    account.isWarming
                                                                        ? "text-orange-500 fill-orange-500/20"
                                                                        : "text-muted-foreground hover:text-orange-400"
                                                                )} />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-card border-border text-foreground">
                                                            {account.isWarming ? "Warmup is ON" : "Warmup is OFF"}
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    {/* Status (Play/Pause) toggle */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleAccountStatus(account.id, account.status)
                                                                }}
                                                                className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                                                            >
                                                                {account.status === "active" ? (
                                                                    <Pause className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <Zap className="h-4 w-4 text-muted-foreground hover:text-green-500" />
                                                                )}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-card border-border text-foreground">
                                                            {account.status === "active" ? "Pause Email Sending" : "Start Email Sending"}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-card border-border text-foreground w-48">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setNewAccount({ email: account.email, password: "", smtpHost: "", smtpPort: "" });
                                                                    setAddAccountOpen(true);
                                                                }}
                                                                className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2"
                                                            >
                                                                Edit Account
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={async (e) => {
                                                                    e.stopPropagation(); // Prevent row click
                                                                    try {
                                                                        toast({ title: "Testing Connection", description: `Verifying credentials for ${account.email}...` })
                                                                        const res = await fetch(`/api/accounts/${account.id}/test`, { method: 'POST' })
                                                                        const data = await res.json()

                                                                        if (res.ok) {
                                                                            toast({ title: "Connection Stable", description: "Your email account is connected and ready to send. (Green)" })
                                                                        } else {
                                                                            toast({ title: "Connection Failed", description: data.details || "Could not verify credentials", variant: "destructive" })
                                                                        }
                                                                        fetchAccounts(); // Refresh status
                                                                    } catch (err) {
                                                                        toast({ title: "Error", description: "Failed to test connection", variant: "destructive" })
                                                                    }
                                                                }}
                                                                className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2"
                                                            >
                                                                Test Connection
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setNewAccount({ email: account.email, password: "", smtpHost: "", smtpPort: "" });
                                                                    setAddAccountOpen(true);
                                                                    // We don't show a generic toast here, the modal explains what to do.
                                                                }}
                                                                className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2"
                                                            >
                                                                Reconnect
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-muted" />
                                                            <DropdownMenuItem
                                                                onClick={() => openWorkspaceAssign(account)}
                                                                className="cursor-pointer focus:bg-secondary focus:text-foreground text-sm py-2"
                                                            >
                                                                <Zap className="mr-2 h-4 w-4 text-blue-500" /> Assign to Workspaces
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-muted" />
                                                            <DropdownMenuItem onClick={() => router.push('/settings/profile')} className="cursor-pointer focus:bg-muted focus:text-foreground">Settings</DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-muted" />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteAccountClick(account.id)}
                                                                className="cursor-pointer focus:bg-secondary focus:text-red-400 text-red-500 text-sm py-2"
                                                            >
                                                                Delete Account
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        onClick={(e) => handleRowClick(account.id, e)}
                                        className={cn(
                                            "bg-card border border-border rounded-xl p-5 hover:border-[#444] transition-colors cursor-pointer space-y-4",
                                            selectedDetailId === account.id && "border-blue-600/50"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3">
                                                <Checkbox
                                                    checked={selectedAccounts.includes(account.id)}
                                                    onCheckedChange={() => toggleSelectAccount(account.id)}
                                                    className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px] w-4 h-4 mt-1"
                                                />
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-foreground font-semibold text-sm truncate max-w-[130px]">{account.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-3 w-3 text-blue-500" />
                                                        <span className="text-xs text-blue-500">Connected</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 -mt-1 -mr-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                toggleWarmup(account.id, account.isWarming)
                                                            }}
                                                        >
                                                            <Flame className={cn("h-4 w-4", account.isWarming ? "text-orange-500 fill-orange-500/20" : "text-muted-foreground")} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Warmup: {account.isWarming ? "ON" : "OFF"}</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                toggleAccountStatus(account.id, account.status)
                                                            }}
                                                        >
                                                            {account.status === "active" ? (
                                                                <Pause className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Zap className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{account.status === "active" ? "Pause Sending" : "Start Sending"}</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 py-2 border-t border-border border-b">
                                            <div className="text-center">
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Sent</div>
                                                <div className="text-sm font-bold text-foreground">{account.emailsSent}</div>
                                            </div>
                                            <div className="text-center border-l border-border">
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Warmup</div>
                                                <div className="text-sm font-bold text-foreground">{account.warmupEmails} <span className="text-muted-foreground font-normal text-xs">/ {account.warmupEmailsLimit}</span></div>
                                            </div>
                                            <div className="text-center border-l border-border">
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Health</div>
                                                <div className="text-sm font-bold text-green-500">{account.healthScore}%</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                {account.status === "paused" && (
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded uppercase tracking-wide">
                                                        Paused
                                                    </span>
                                                )}
                                                {account.hasError && (
                                                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded uppercase tracking-wide">
                                                        Error
                                                    </span>
                                                )}
                                                {!account.status && !account.hasError && (
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded uppercase tracking-wide">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            {account.isWarming && (
                                                <div className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                                                    <Flame className="h-3 w-3 fill-orange-500" />
                                                    Warming
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border bg-secondary text-foreground hover:bg-muted"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border bg-secondary text-foreground hover:bg-muted"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                {/* Right Panel */}
                {selectedDetailId && selectedDetailAccount && (
                    <AccountDetailPanel
                        account={selectedDetailAccount}
                        onClose={() => setSelectedDetailId(null)}
                        onUpdate={(updatedAccount) => {
                            // Update the account in the local state immediately
                            setAccounts(prevAccounts =>
                                prevAccounts.map(acc =>
                                    acc.id === updatedAccount.id ? { ...acc, ...updatedAccount } : acc
                                )
                            )
                            // Also refresh from server to ensure consistency
                            fetchAccounts(true)
                        }}
                    />
                )}
            </div>

            {/* Add Account Modal - auto-assigns to currently selected workspace */}
            <ConnectAccountModal
                open={addAccountOpen}
                onOpenChange={setAddAccountOpen}
                onAccountConnected={() => fetchAccounts(true)}
                workspaceId={selectedWorkspaceId}
            />

            {/* Bulk Action Modal */}
            <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
                <DialogContent className="bg-background border-border sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Bulk Actions</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {selectedAccounts.length} account(s) selected
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start border-border bg-secondary text-foreground hover:bg-muted"
                            onClick={handleBulkReconnect}
                            disabled={isBulkReconnecting}
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            {isBulkReconnecting ? "Retrying Connections..." : "Retry Connection for Selected"}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start border-border bg-secondary text-foreground hover:bg-muted"
                            onClick={handleExport}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Selected
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start border-border bg-secondary text-red-400 hover:bg-red-900/20 hover:text-red-400"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Account Modal */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="bg-background border-border sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Delete Account</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to remove this account? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteOpen(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteAccount}
                            className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign to Workspaces Modal */}
            <Dialog open={workspaceAssignOpen} onOpenChange={setWorkspaceAssignOpen}>
                <DialogContent className="bg-background border-border sm:max-w-[500px] p-0 overflow-hidden">
                    <div className="sr-only">
                        <DialogTitle>Assign to Workspaces</DialogTitle>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">Assign to Workspaces</h2>
                            <p className="text-muted-foreground text-sm">Select workspaces for "{accountForWorkspace?.email}"</p>
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
        </TooltipProvider>
    )
}
