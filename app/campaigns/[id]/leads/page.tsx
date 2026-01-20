"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Search,
    Filter,
    MoreHorizontal,
    Trash2,
    UserPlus,
    Loader2,
    CheckCircle,
    XCircle,
    Info,
    Users,
    Mail,
    Shield,
    Brain,
    Play,
    Heart,
    AtSign,
    X,
    RefreshCw,
} from "lucide-react"
import { ImportLeadsModal } from "@/components/app/leads/ImportLeadsModal"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { InfoDialog } from "@/components/ui/info-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Lead {
    id: string
    email: string
    firstName?: string
    lastName?: string
    company?: string
    location?: string
    status: string
    emailProvider?: string
    emailSecurityGateway?: string
    createdAt: string
}
// ... (rest of imports/types omitted for brevity if not needed, but replace_chunk needs context)
// Actually I will just replace the import block and the start of the tooltip section.

// Let's do imports first


interface Lead {
    id: string
    email: string
    firstName?: string
    lastName?: string
    company?: string
    location?: string
    status: string
    emailProvider?: string
    emailSecurityGateway?: string
    createdAt: string
}

// Helper to detect email provider from domain
const getEmailProvider = (email: string): { name: string; color: string } => {
    const domain = email.split('@')[1]?.toLowerCase() || ''
    if (domain.includes('gmail') || domain.includes('google')) {
        return { name: 'Google', color: 'text-red-400' }
    }
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('microsoft') || domain.includes('live')) {
        return { name: 'Microsoft', color: 'text-blue-400' }
    }
    return { name: 'Other', color: 'text-gray-400' }
}

// Provider icon component with colored background
const ProviderIcon = ({ provider }: { provider: string }) => {
    if (provider === 'Google') {
        return (
            <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-red-500/20 text-red-400 font-bold text-xs">G</span>
                <span className="text-white">Google</span>
            </div>
        )
    }
    if (provider === 'Microsoft') {
        return (
            <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold text-xs">M</span>
                <span className="text-white">Microsoft</span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Other</span>
            <Info className="h-3.5 w-3.5 text-gray-600" />
        </div>
    )
}

export default function LeadsPage() {
    const { toast } = useToast()
    const params = useParams()
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null)
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
    const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [filterOpen, setFilterOpen] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/campaigns/${params.id}/leads`)
            if (res.ok) {
                const data = await res.json()
                setLeads(data)
            }
        } catch (error) {
            console.error("Failed to fetch leads", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (params.id) {
            fetchLeads()
        }
    }, [params.id])

    const toggleLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(l => l !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
    }

    const toggleAll = () => {
        if (selectedLeads.length > 0) {
            setSelectedLeads([]) // Deselect all if any are selected (Gmail style for mixed/all)
        } else {
            setSelectedLeads(filteredLeads.map(l => l.id)) // Select all
        }
    }

    const handleBulkDelete = () => {
        if (selectedLeads.length === 0) return
        setBulkDeleteConfirmOpen(true)
    }

    const confirmBulkDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/campaigns/${params.id}/leads/bulk`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadIds: selectedLeads })
            })

            if (res.ok) {
                setSelectedLeads([])
                fetchLeads()
                toast({ title: "Leads Deleted", description: `Successfully deleted ${selectedLeads.length} leads.` })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete leads", variant: "destructive" })
        } finally {
            setDeleting(false)
            setBulkDeleteConfirmOpen(false)
        }
    }

    const handleDeleteLead = (leadId: string) => {
        setLeadToDelete(leadId)
        setDeleteConfirmOpen(true)
    }

    const confirmDeleteLead = async () => {
        if (!leadToDelete) return

        try {
            const res = await fetch(`/api/campaigns/${params.id}/leads/${leadToDelete}`, { method: 'DELETE' })
            if (res.ok) {
                fetchLeads()
                toast({ title: "Lead Deleted" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" })
        } finally {
            setDeleteConfirmOpen(false)
            setLeadToDelete(null)
        }
    }

    const handleViewDetails = (lead: Lead) => {
        setSelectedLead(lead)
        setViewDetailsOpen(true)
    }

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            if (!lead.email.toLowerCase().includes(query) &&
                !`${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase().includes(query)) {
                return false
            }
        }
        if (filterStatus !== 'all' && lead.status !== filterStatus) {
            return false
        }
        return true
    })

    // Stats
    const totalLeads = leads.length
    const completedCount = leads.filter(l => l.status === 'completed' || l.status === 'sequence_complete').length
    const bouncedCount = leads.filter(l => l.status === 'bounced').length
    const repliedCount = leads.filter(l => l.status === 'replied').length
    const contactedCount = leads.filter(l => l.status === 'contacted' || l.status === 'replied' || l.status === 'completed' || l.status === 'sequence_complete').length

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
            case 'sequence_complete':
                return (
                    <div className="flex items-center gap-1.5 text-green-400 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Done</span>
                    </div>
                )
            case 'bounced':
                return (
                    <div className="flex items-center gap-1.5 text-red-400 text-sm">
                        <XCircle className="h-4 w-4" />
                        <span>Bounced</span>
                    </div>
                )
            case 'contacted':
                return (
                    <div className="flex items-center gap-1.5 text-blue-400 text-sm">
                        <Mail className="h-4 w-4" />
                        <span>Contacted</span>
                    </div>
                )
            case 'replied':
                return (
                    <div className="flex items-center gap-1.5 text-purple-400 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Replied</span>
                    </div>
                )
            default:
                return (
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                        <Info className="h-4 w-4" />
                        <span>New</span>
                    </div>
                )
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <div className="relative w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#111111] border-[#222222] text-gray-300 h-9"
                        />
                    </div>

                    {/* Stats pills with tooltips */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 cursor-help"><Users className="h-3.5 w-3.5" /> {totalLeads}</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white p-3">
                                    <div className="font-medium">Total number of leads</div>
                                    <div className="text-gray-400 text-xs">(this value is updated every 5 minutes): {totalLeads}</div>
                                </TooltipContent>
                            </Tooltip>
                            <span className="text-[#333]">|</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 cursor-help"><Mail className="h-3.5 w-3.5" /> {contactedCount}</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white p-3">
                                    <div className="font-medium">Sequence started: {contactedCount}</div>
                                    <div className="text-gray-400 text-xs">({totalLeads > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0}% of total leads)</div>
                                </TooltipContent>
                            </Tooltip>
                            <span className="text-[#333]">|</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 text-red-400 cursor-help"><Heart className="h-3.5 w-3.5" /> {bouncedCount}</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white p-3">
                                    <div className="font-medium">Number of bounced leads: {bouncedCount}</div>
                                    <div className="text-gray-400 text-xs">({contactedCount > 0 ? Math.round((bouncedCount / contactedCount) * 100) : 0}% of contacted so far)</div>
                                </TooltipContent>
                            </Tooltip>
                            <span className="text-[#333]">|</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 text-green-400 cursor-help"><CheckCircle className="h-3.5 w-3.5" /> {completedCount}</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white p-3">
                                    <div className="font-medium">Completed leads: {completedCount}</div>
                                    <div className="text-gray-400 text-xs">({totalLeads > 0 ? Math.round((completedCount / totalLeads) * 100) : 0}% of total leads)</div>
                                </TooltipContent>
                            </Tooltip>
                            <span className="text-[#333]">|</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 text-purple-400 cursor-help"><AtSign className="h-3.5 w-3.5" /> {repliedCount}</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white p-3">
                                    <div className="font-medium">Unsubscribed: {repliedCount}</div>
                                    <div className="text-gray-400 text-xs">({totalLeads > 0 ? Math.round((repliedCount / totalLeads) * 100) : 0}% of total leads)</div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedLeads.length > 0 && (
                        <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md mr-2 animate-in fade-in zoom-in-95 duration-200">
                            <span className="text-sm font-medium text-blue-400 pl-1">{selectedLeads.length} selected</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                onClick={() => setSelectedLeads([])}
                                title="Clear selection"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                            <div className="h-4 w-[1px] bg-blue-500/20 mx-1" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                title="Delete selected"
                            >
                                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                        </div>
                    )}
                    <Button variant="outline" className="border-[#222] bg-[#111] text-gray-400 hover:text-white h-9" onClick={() => {
                        const dataToExport = selectedLeads.length > 0
                            ? leads.filter(l => selectedLeads.includes(l.id))
                            : leads;
                        const csvContent = "data:text/csv;charset=utf-8,"
                            + ["Email,First Name,Last Name,Company,Status"].join(",") + "\n"
                            + dataToExport.map(l => `${l.email},${l.firstName || ''},${l.lastName || ''},${l.company || ''},${l.status}`).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `campaign_leads_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}>
                        <Filter className="h-4 w-4 mr-2 rotate-180" /> {/* Using rotate for export-like icon or just generic */}
                        Export
                    </Button>
                    <div className="relative">
                        <Button
                            variant="outline"
                            className={cn(
                                "border-[#222] bg-[#111] text-gray-400 hover:text-white h-9",
                                filterOpen && "bg-[#1a1a1a] text-white border-blue-600/50"
                            )}
                            onClick={() => setFilterOpen(!filterOpen)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {filterStatus !== 'all' && <span className="ml-2 w-2 h-2 rounded-full bg-blue-500" />}
                        </Button>
                        {filterOpen && (
                            <div className="absolute top-10 right-0 w-48 bg-[#1a1a1a] border border-[#333] rounded-lg p-2 z-50">
                                <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 mb-1">Status</div>
                                {['all', 'completed', 'bounced', 'contacted', 'replied'].map(status => (
                                    <div
                                        key={status}
                                        className={cn(
                                            "px-2 py-1.5 rounded-md text-sm cursor-pointer capitalize hover:bg-[#222] text-gray-300",
                                            filterStatus === status && "bg-blue-600/10 text-blue-400"
                                        )}
                                        onClick={() => { setFilterStatus(status); setFilterOpen(false); }}
                                    >
                                        {status}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-white border border-[#222] bg-[#111]"
                        onClick={fetchLeads}
                        disabled={loading}
                        title="Refresh Leads"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-white border border-[#222] bg-[#111]"
                        onClick={() => toast({ title: "Coming Soon", description: "Lead AI Enrichment will be available shortly." })}
                    >
                        <Brain className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setImportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Leads
                    </Button>
                </div>

            </div>

            {/* Table */}
            <div className="flex-1 border border-[#222] rounded-lg bg-[#111111] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="grid grid-cols-[40px_40px_2fr_1fr_1.5fr_1fr_1fr_1fr_50px] gap-2 px-4 py-3 bg-[#0a0a0a] border-b border-[#222] text-[11px] font-medium text-[#666666] uppercase tracking-wider sticky top-0 z-10">
                    <div className="flex items-center">
                        <Checkbox
                            checked={
                                filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length
                                    ? true
                                    : selectedLeads.length > 0
                                        ? "indeterminate"
                                        : false
                            }
                            onCheckedChange={toggleAll}
                            className="border-gray-600 data-[state=checked]:bg-blue-600"
                        />
                    </div>
                    <div>#</div>
                    <div>EMAIL</div>
                    <div>EMAIL PROVIDER</div>
                    <div>EMAIL SECURITY GATEWAY</div>
                    <div>STATUS</div>
                    <div>CONTACT</div>
                    <div>LOCATION</div>
                    <div></div>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading leads...
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-full">
                                <UserPlus className="h-8 w-8 text-gray-600" />
                            </div>
                            <p>{searchQuery ? "No leads match your search" : "No leads found in this campaign."}</p>
                            {!searchQuery && (
                                <Button onClick={() => setImportModalOpen(true)} variant="outline" className="border-[#333] text-gray-300">
                                    Import Leads
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredLeads.map((lead, index) => {
                            const provider = getEmailProvider(lead.email)
                            const gateway = lead.emailSecurityGateway || 'None'
                            const contactName = lead.firstName || lead.email.split('@')[0]

                            return (
                                <div
                                    key={lead.id}
                                    className={cn(
                                        "grid grid-cols-[40px_40px_2fr_1fr_1.5fr_1fr_1fr_1fr_50px] gap-2 px-4 py-3 border-b border-[#1a1a1a] items-center hover:bg-[#151515] transition-colors group",
                                        lead.status === 'bounced' && "bg-red-500/5"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <Checkbox
                                            checked={selectedLeads.includes(lead.id)}
                                            onCheckedChange={() => toggleLead(lead.id)}
                                            className="border-gray-600 data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                    <div className="text-gray-500 text-sm">{index + 1}</div>
                                    <div className="text-blue-400 text-sm font-medium truncate">{lead.email}</div>
                                    <div className="text-sm">
                                        <ProviderIcon provider={provider.name} />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        {gateway !== 'None' ? (
                                            <>
                                                <Shield className="h-4 w-4 text-blue-400" />
                                                <span className="text-gray-300">{gateway}</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-gray-500">None</span>
                                            </>
                                        )}
                                    </div>
                                    <div>{getStatusBadge(lead.status)}</div>
                                    <div className="text-sm text-gray-300 capitalize">{contactName}</div>
                                    <div className="text-sm text-gray-400">{lead.location || 'Unknown'}</div>
                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-white">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-[#1a1a1a] border-[#333]">
                                                <DropdownMenuItem
                                                    className="text-gray-300 focus:bg-[#222] focus:text-white cursor-pointer"
                                                    onClick={() => handleViewDetails(lead)}
                                                >
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-500 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                                                    onClick={() => handleDeleteLead(lead.id)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                {filteredLeads.length > 0 && (
                    <div className="border-t border-[#222] px-4 py-3 flex items-center justify-center gap-4 text-sm text-gray-500">
                        <span>Searching</span>
                        <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
                            Load more
                        </Button>
                    </div>
                )}
            </div>

            <ImportLeadsModal
                open={importModalOpen}
                onOpenChange={setImportModalOpen}
                onImportSuccess={fetchLeads}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Delete Lead"
                description="Are you sure you want to delete this lead? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDeleteLead}
                variant="destructive"
            />

            <ConfirmDialog
                open={bulkDeleteConfirmOpen}
                onOpenChange={setBulkDeleteConfirmOpen}
                title="Delete Multiple Leads"
                description={`Are you sure you want to delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                onConfirm={confirmBulkDelete}
                variant="destructive"
            />

            <InfoDialog
                open={viewDetailsOpen}
                onOpenChange={setViewDetailsOpen}
                title="Lead Details"
            >
                {selectedLead && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Email</div>
                            <div className="text-white mt-1">{selectedLead.email}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Contact</div>
                            <div className="text-white mt-1">{selectedLead.firstName || '-'} {selectedLead.lastName || ''}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Company</div>
                            <div className="text-white mt-1">{selectedLead.company || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Location</div>
                            <div className="text-white mt-1">{selectedLead.location || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Status</div>
                            <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                        </div>
                    </div>
                )}
            </InfoDialog>
        </div>
    )
}
