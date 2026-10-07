"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Pause, MoreHorizontal, Zap, ChevronDown, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useWorkspaces } from "@/contexts/WorkspaceContext"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ResumeCampaignModal } from "@/components/app/campaigns/ResumeCampaignModal"

const TABS = [
    { name: "Analytics", href: "" },
    { name: "Leads", href: "/leads" },
    { name: "Sequences", href: "/sequences" },
    { name: "Schedule", href: "/schedule" },
    { name: "Options", href: "/options" },
]

interface Campaign {
    id: string
    name: string
    status: string
    dailyLimit?: number | null
}

export default function CampaignLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const params = useParams()
    const { toast } = useToast()
    const campaignId = params.id as string
    const baseUrl = `/campaigns/${campaignId}`

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [updating, setUpdating] = useState(false)
    const [resumeModalOpen, setResumeModalOpen] = useState(false)
    const { workspaces, selectedWorkspaceId, switchWorkspace } = useWorkspaces()
    const [workspaceSearch, setWorkspaceSearch] = useState("")

    const currentWorkspaceName = workspaces.find(w => w.id === selectedWorkspaceId)?.name || "My Organization"

    useEffect(() => {
        if (campaignId) {
            fetch(`/api/campaigns/${campaignId}`)
                .then(res => res.json())
                .then(data => setCampaign(data))
                .catch(() => setCampaign({ id: campaignId, name: 'Campaign', status: 'draft' }))
        }
    }, [campaignId])

    const filteredWorkspaces = workspaces.filter((w: any) =>
        w.name.toLowerCase().includes(workspaceSearch.toLowerCase())
    )

    const toggleStatus = async () => {
        if (!campaign || updating) return

        const isCurrentlyActive = campaign.status?.toLowerCase() === 'active'

        // If active, clicking pause pauses directly
        if (isCurrentlyActive) {
            setUpdating(true)
            try {
                const res = await fetch(`/api/campaigns/${campaignId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'paused' })
                })
                if (res.ok) {
                    setCampaign({ ...campaign, status: 'paused' })
                    toast({
                        title: "Campaign Paused",
                        description: "Campaign has been paused."
                    })
                } else {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.error || "Failed to pause campaign")
                }
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to pause campaign",
                    variant: "destructive"
                })
            } finally {
                setUpdating(false)
            }
            return
        }

        // If resuming or launching, open the Pre-flight Metrics modal!
        setResumeModalOpen(true)
    }

    return (
        <div className="flex h-full flex-col bg-[#0a0a0a] min-h-screen">
            {/* Top Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-4">
                    <Link href="/campaigns">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold text-white">
                        {campaign?.name || (
                            <div className="h-7 w-48 bg-[#1a1a1a] animate-pulse rounded" />
                        )}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-[#2a2a2a] bg-[#1a1a1a] text-white hover:text-white hover:bg-[#2a2a2a] gap-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                {currentWorkspaceName}
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
                            <DropdownMenuItem
                                onClick={() => switchWorkspace(null)}
                                className={cn(
                                    "cursor-pointer focus:bg-[#2a2a2a] focus:text-white",
                                    !selectedWorkspaceId && "bg-blue-500/20 text-blue-400"
                                )}
                            >
                                <Zap className="h-4 w-4 mr-2 text-blue-500" />
                                My Organization
                            </DropdownMenuItem>
                            {filteredWorkspaces.map((workspace) => (
                                <DropdownMenuItem
                                    key={workspace.id}
                                    onClick={() => switchWorkspace(workspace.id)}
                                    className={cn(
                                        "cursor-pointer focus:bg-[#2a2a2a] focus:text-white",
                                        selectedWorkspaceId === workspace.id && "bg-blue-500/20 text-blue-400"
                                    )}
                                >
                                    <Zap className="h-4 w-4 mr-2 text-blue-500" />
                                    {workspace.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs Row */}
            <div className="px-6 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                    <nav className="flex gap-8">
                        {TABS.map((tab) => {
                            const href = `${baseUrl}${tab.href}`
                            const isActive = pathname === href || (tab.href === "" && pathname === baseUrl)

                            return (
                                <Link
                                    key={tab.name}
                                    href={href}
                                    className={cn(
                                        "relative py-4 text-sm font-medium transition-colors hover:text-white",
                                        isActive
                                            ? "text-white"
                                            : "text-gray-500"
                                    )}
                                >
                                    {tab.name}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={toggleStatus}
                            disabled={updating}
                            className="bg-transparent hover:bg-[#1a1a1a] text-white border border-[#333] gap-2 h-9 px-3.5 transition-all"
                        >
                            {updating ? (
                                <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> Updating...</>
                            ) : campaign?.status === 'active' ? (
                                <><Pause className="h-4 w-4 fill-yellow-500 text-yellow-500" /> Pause campaign</>
                            ) : (
                                <><Play className="h-4 w-4 fill-green-500 text-green-500" /> {campaign?.status === 'draft' ? "Launch campaign" : "Resume campaign"}</>
                            )}
                        </Button>
                        <Button variant="outline" size="icon" className="border-[#333] bg-transparent hover:bg-[#1a1a1a] text-gray-400">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                {children}
            </div>

            {/* Unified Resume Campaign Modal with Pre-flight Metrics */}
            {campaign && (
                <ResumeCampaignModal
                    open={resumeModalOpen}
                    onOpenChange={setResumeModalOpen}
                    campaignId={campaign.id}
                    campaignName={campaign.name}
                    campaignStatus={campaign.status}
                    dailyLimit={campaign.dailyLimit ?? undefined}
                    onSuccess={() => {
                        setCampaign({ ...campaign, status: 'active' })
                    }}
                />
            )}
        </div>
    )
}
