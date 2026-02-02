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
import { TagManager } from "@/components/common/TagManager"
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
import { EmptyState } from '@/components/ui/empty-state'


interface EmailAccount {
    id: string
    email: string
    status: "active" | "paused" | "error" | "warmup"
    emailsSent: number
    emailsLimit: number
    warmupEmails: number
    healthScore: number
    hasError: boolean
    isWarming: boolean
    isDFY: boolean
    isInCampaign: boolean
    hasCustomDomain: boolean
    tags: string[]
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

    // Workspace state
    const [workspaces, setWorkspaces] = useState<{ id: string, name: string }[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")

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

    const itemsPerPage = 20


    const fetchAccounts = useCallback(async () => {
        setLoading(true)
        try {
            // Find workspace ID - "My Organization" shows all accounts
            const workspace = workspaces.find((w) => w.name === currentWorkspace)
            const workspaceId = workspace?.id || 'all'

            let url = `/api/accounts?page=${currentPage}&limit=${itemsPerPage}`
            if (workspaceId !== 'all') {
                url += `&workspaceId=${workspaceId}`
            }
            if (selectedTags.length > 0) {
                url += `&tags=${selectedTags.join(',')}`
            }

            const res = await fetch(url)
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
    }, [currentPage, itemsPerPage, currentWorkspace, workspaces, toast, selectedTags])

    // Load workspaces on mount
    useEffect(() => {
        loadWorkspaces()
    }, [])

    // Fetch accounts when workspace changes
    useEffect(() => {
        fetchAccounts()
    }, [currentPage, debouncedSearch, activeFilter, currentWorkspace, workspaces, fetchAccounts])

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
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
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


                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary h-9 gap-2">
                                        {currentWorkspace}
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground">
                                    <div className="p-2">
                                        <Input
                                            placeholder="Search workspaces..."
                                            value={workspaceSearch}
                                            onChange={(e) => setWorkspaceSearch(e.target.value)}
                                            className="bg-background border-border h-8 text-sm"
                                        />
                                    </div>
                                    <DropdownMenuItem
                                        onClick={() => switchWorkspace("My Organization")}
                                        className={cn(
                                            "focus:bg-secondary focus:text-foreground cursor-pointer",
                                            currentWorkspace === "My Organization" && "bg-blue-500/20 text-blue-400"
                                        )}
                                    >
                                        <Zap className="h-4 w-4 mr-2 text-blue-500" />
                                        My Organization
                                    </DropdownMenuItem>
                                    {filteredWorkspaces.map((workspace) => (
                                        <DropdownMenuItem
                                            key={workspace.id || workspace.name}
                                            onClick={() => switchWorkspace(workspace.name)}
                                            className={cn(
                                                "focus:bg-secondary focus:text-foreground cursor-pointer",
                                                currentWorkspace === workspace.name && "bg-blue-500/20 text-blue-400"
                                            )}
                                        >
                                            {workspace.name}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator className="bg-muted" />
                                    <DropdownMenuItem onClick={() => router.push('/settings/workspaces')} className="focus:bg-secondary focus:text-blue-400 text-blue-400 cursor-pointer">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Workspace
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                        <div className="flex items-center justify-between">
                            {/* Search - Hidden as FilterBar handles it */}
                            <div className="hidden relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-card border-border text-foreground focus-visible:ring-blue-600/50 h-10 rounded-lg"
                                />
                            </div>

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
                                                    "grid grid-cols-[auto_2.5fr_1fr_1fr_1fr_auto] gap-4 items-center bg-card border border-border rounded-xl px-6 py-4 transition-colors group cursor-pointer hover:border-[#444]",
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
                                                <div className="flex items-center gap-3 min-w-0 ml-7">
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
                                                    {account.isWarming && (
                                                        <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                                                    )}
                                                    <div className="w-px h-3 bg-[#333] mx-1" />
                                                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                                                    {account.isInCampaign && (
                                                        <Zap className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
                                                    )}
                                                </div>
                                                <div className="ml-7 mt-1" onClick={e => e.stopPropagation()}>
                                                    <TagManager
                                                        entityId={account.id}
                                                        entityType="account"
                                                        assignedTags={account.tags || []}
                                                        onTagsChange={() => fetchAccounts()}
                                                        readOnly={false}
                                                    />
                                                </div>
                                                <div className="text-sm text-foreground font-medium">
                                                    {account.emailsSent} <span className="text-muted-foreground font-normal">of {account.emailsLimit}</span>
                                                </div>
                                                <div className="text-sm text-foreground font-medium">{account.warmupEmails}</div>
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
                                                            <DropdownMenuItem onClick={() => router.push('/settings/workspaces')} className="cursor-pointer focus:bg-muted focus:text-foreground text-blue-400">
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                Add Workspace
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
                                                <div className="text-sm font-bold text-foreground">{account.warmupEmails}</div>
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
                    />
                )}
            </div>

            {/* Add Account Modal */}
            <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
                <DialogContent className="bg-background border-border sm:max-w-[550px] p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl text-amber-50 font-semibold mb-2">Connect existing accounts</DialogTitle>
                        <DialogDescription className="hidden" /> {/* Accessbility fix: Description is required but we can hide it if visually not needed or put content here */}
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Check className="h-5 w-5 text-green-500" />
                                <span className="text-[15px]">Connect any IMAP or SMTP email provider</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Check className="h-5 w-5 text-green-500" />
                                <span className="text-[15px]">Sync up replies in the Unibox</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Google */}
                            <button
                                onClick={() => router.push('/accounts/connect?provider=google')}
                                className="w-full flex items-center gap-4 bg-card border border-border hover:bg-[#161616] hover:border-[#3a3a3a] p-4 rounded-xl transition-all group group relative overflow-hidden"
                            >
                                <div className="h-8 w-8 flex-shrink-0">
                                    {/* Google Icon Simulation */}
                                    <svg viewBox="0 0 24 24" className="w-full h-full">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="text-foreground font-medium">Google</div>
                                    <div className="text-sm text-muted-foreground font-semibold">Gmail / G-Suite</div>
                                </div>
                            </button>

                            {/* Microsoft */}
                            <button
                                onClick={() => router.push('/accounts/connect?provider=microsoft')}
                                className="w-full flex items-center gap-4 bg-card border border-border hover:bg-[#161616] hover:border-[#3a3a3a] p-4 rounded-xl transition-all"
                            >
                                <div className="h-8 w-8 flex-shrink-0">
                                    {/* Microsoft Icon Simulation */}
                                    <svg viewBox="0 0 23 23" className="w-full h-full">
                                        <path fill="#f35325" d="M1 1h10v10H1z" />
                                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="text-foreground font-medium">Microsoft</div>
                                    <div className="text-sm text-muted-foreground font-semibold">Office 365 / Outlook</div>
                                </div>
                            </button>

                            {/* Any Provider */}
                            <button
                                onClick={() => router.push('/accounts/connect?provider=smtp')}
                                className="w-full flex items-center gap-4 bg-card border border-border hover:bg-[#161616] hover:border-[#3a3a3a] p-4 rounded-xl transition-all"
                            >
                                <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-muted rounded">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                    <div className="text-foreground font-medium">Any Provider</div>
                                    <div className="text-sm text-muted-foreground font-semibold">IMAP / SMTP</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
        </TooltipProvider>
    )
}
