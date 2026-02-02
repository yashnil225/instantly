"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Mail, Building2, Download, Loader2, Zap, ChevronDown, CheckSquare, MessageCircle, XCircle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { FilterBar } from "@/components/common/FilterBar"
import { TagManager } from "@/components/common/TagManager"
import { toast } from "@/components/ui/use-toast"

interface Lead {
    id: string
    email: string
    firstName?: string
    lastName?: string
    company?: string
    status: string
    createdAt: string
    campaign?: {
        name: string
    }
    tags: any[]
}

export default function GlobalLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)

    // Workspace state
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")

    // Filter state
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        loadWorkspaces()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        fetchLeads()
    }, [currentWorkspace, debouncedSearch, selectedTags, statusFilter])

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

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const workspace = workspaces.find((w: any) => w.name === currentWorkspace)
            const workspaceId = workspace?.id || 'all'

            const params = new URLSearchParams({ limit: '100' })
            if (workspaceId !== 'all') {
                params.append('workspaceId', workspaceId)
            }
            if (debouncedSearch) {
                params.append('search', debouncedSearch)
            }
            if (selectedTags.length > 0) {
                params.append('tags', selectedTags.join(','))
            }
            if (statusFilter !== 'all') {
                params.append('status', statusFilter)
            }

            const res = await fetch(`/api/leads?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setLeads(data.leads)
                setTotal(data.total)
            }
        } catch (error) {
            console.error("Failed to fetch leads", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'contacted':
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0">Contacted</Badge>
            case 'completed':
                return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0">Completed</Badge>
            case 'bounced':
                return <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0">Bounced</Badge>
            case 'replied':
                return <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-0">Replied</Badge>
            default:
                return <Badge variant="secondary" className="bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border-0">New</Badge>
        }
    }

    const handleExport = () => {
        const headers = ['Email', 'First Name', 'Last Name', 'Company', 'Status', 'Campaign']
        const rows = leads.map(lead => [
            lead.email,
            lead.firstName || '',
            lead.lastName || '',
            lead.company || '',
            lead.status,
            lead.campaign?.name || ''
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `all-leads-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast({ title: "Export Started", description: `Exporting ${leads.length} leads...` })
    }

    return (
        <div className="flex bg-[#0a0a0a] min-h-screen text-white font-sans">
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 border-b border-[#222222] flex items-center px-6 justify-between shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">All Prospects</h1>
                        <Badge variant="outline" className="border-gray-700 text-gray-400">{total} Total</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Workspace Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-[#222] bg-[#111] text-white hover:text-white hover:bg-[#1a1a1a] gap-2">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    {currentWorkspace}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                <div className="p-2">
                                    <Input
                                        placeholder="Search"
                                        value={workspaceSearch}
                                        onChange={(e) => setWorkspaceSearch(e.target.value)}
                                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm h-8 mb-2"
                                    />
                                </div>
                                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                                {filteredWorkspaces.map((workspace) => (
                                    <DropdownMenuItem
                                        key={workspace.id || workspace.name}
                                        onClick={() => switchWorkspace(workspace.name)}
                                        className={cn(
                                            "cursor-pointer focus:bg-[#2a2a2a] focus:text-white",
                                            currentWorkspace === workspace.name && "bg-blue-500/20 text-blue-400"
                                        )}
                                    >
                                        <Zap className="h-4 w-4 mr-2 text-blue-500" />
                                        {workspace.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" className="border-[#222] bg-[#111] text-gray-400 hover:text-white" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export All
                        </Button>
                    </div>
                </header>

                <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">

                    {/* Filter Toolbar */}
                    <div className="flex items-center gap-4">
                        <FilterBar
                            onSearchChange={setSearchQuery}
                            onTagsChange={setSelectedTags}
                            className="flex-1"
                            placeholder="Search leads..."
                        />

                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 border-[#222] bg-[#111] text-gray-300 hover:text-white hover:bg-[#1a1a1a] gap-2 min-w-[140px] justify-between">
                                    <span className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-gray-500" />
                                        {statusFilter === 'all' ? 'All Statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                <DropdownMenuItem onClick={() => setStatusFilter('all')} className={cn("cursor-pointer focus:bg-[#2a2a2a] focus:text-white", statusFilter === 'all' && "bg-blue-500/20 text-blue-400")}>
                                    All Statuses
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                                <DropdownMenuItem onClick={() => setStatusFilter('new')} className={cn("cursor-pointer focus:bg-[#2a2a2a] focus:text-white", statusFilter === 'new' && "bg-blue-500/20 text-blue-400")}>
                                    New
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('contacted')} className={cn("cursor-pointer focus:bg-[#2a2a2a] focus:text-white", statusFilter === 'contacted' && "bg-blue-500/20 text-blue-400")}>
                                    <CheckSquare className="h-4 w-4 mr-2 text-blue-500" /> Contacted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('replied')} className={cn("cursor-pointer focus:bg-[#2a2a2a] focus:text-white", statusFilter === 'replied' && "bg-blue-500/20 text-blue-400")}>
                                    <MessageCircle className="h-4 w-4 mr-2 text-purple-500" /> Replied
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('completed')} className={cn("cursor-pointer focus:bg-[#2a2a2a] focus:text-white", statusFilter === 'completed' && "bg-blue-500/20 text-blue-400")}>
                                    <CheckSquare className="h-4 w-4 mr-2 text-green-500" /> Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('bounced')} className={cn("cursor-pointer focus:bg-[#2a2a2a] focus:text-white", statusFilter === 'bounced' && "bg-blue-500/20 text-blue-400")}>
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" /> Bounced
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex-1 border border-[#222] rounded-lg bg-[#111111] overflow-hidden flex flex-col">
                        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-4 py-3 bg-[#1a1a1a] border-b border-[#222] text-[11px] font-bold text-[#666666] uppercase tracking-wider sticky top-0 z-10">
                            <div>Name / Email</div>
                            <div>Company</div>
                            <div>Campaign</div>
                            <div>Status</div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading leads...
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                                    <p>No leads found matching your criteria.</p>
                                </div>
                            ) : (
                                leads.map((lead) => (
                                    <div key={lead.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-4 py-3 border-b border-[#222] items-center hover:bg-[#151515] transition-colors group">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 font-medium text-gray-200">
                                                {lead.firstName || lead.lastName ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '-'}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                <Mail className="h-3 w-3" /> {lead.email}
                                            </div>
                                            {/* Tag Manager */}
                                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                                <TagManager
                                                    entityId={lead.id}
                                                    entityType="lead"
                                                    onTagsChange={fetchLeads}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-400 flex items-center gap-2">
                                            {lead.company ? <><Building2 className="h-3 w-3 text-gray-600" /> {lead.company}</> : <span className="text-gray-600">-</span>}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {lead.campaign?.name || <span className="text-gray-600">Unknown</span>}
                                        </div>
                                        <div>
                                            {getStatusBadge(lead.status)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
