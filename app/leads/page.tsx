"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Mail, Building2, Download, Loader2, Zap, ChevronDown } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Lead {
    id: string
    email: string
    firstName?: string
    lastName?: string
    company?: string
    status: string
    createdAt: string
    campaign: {
        name: string
    }
}

export default function GlobalLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)

    // Workspace state
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")

    useEffect(() => {
        loadWorkspaces()
    }, [])

    useEffect(() => {
        fetchLeads()
    }, [currentWorkspace])

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
    }

    return (
        <div className="flex bg-[#0a0a0a] min-h-screen text-white">
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

                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-[300px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                                placeholder="Search all leads..."
                                className="pl-10 bg-[#111111] border-[#222222] text-gray-300 focus:border-[#333333] h-9"
                            />
                        </div>
                        <Button variant="outline" className="border-[#222] bg-[#111] text-gray-400 hover:text-white h-9">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
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
                                    <p>No leads found.</p>
                                </div>
                            ) : (
                                leads.map((lead) => (
                                    <div key={lead.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-4 py-3 border-b border-[#222] items-center hover:bg-[#151515] transition-colors group">
                                        <div>
                                            <div className="flex items-center gap-2 font-medium text-gray-200">
                                                {lead.firstName || lead.lastName ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '-'}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                <Mail className="h-3 w-3" /> {lead.email}
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
