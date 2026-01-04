"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Play, Pause, MoreHorizontal, Zap, ChevronDown, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { validateCampaignLimits, getWarningMessage, formatCapacityInfo } from "@/lib/limit-calculator"

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
}

export default function CampaignLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const params = useParams()
    const campaignId = params.id as string
    const baseUrl = `/campaigns/${campaignId}`

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [updating, setUpdating] = useState(false)
    const [limitWarningOpen, setLimitWarningOpen] = useState(false)
    const [limitWarningData, setLimitWarningData] = useState<any>(null)
    const [leadsCount, setLeadsCount] = useState(0)

    // Workspace state
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")

    console.log('[CampaignLayout] Render', { campaignId, pathname, params })

    useEffect(() => {
        loadWorkspaces()
        if (campaignId) {
            fetch(`/api/campaigns/${campaignId}`)
                .then(res => res.json())
                .then(data => setCampaign(data))
                .catch(() => setCampaign({ id: campaignId, name: 'Campaign', status: 'draft' }))
        }
    }, [campaignId])

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

    const toggleStatus = async () => {
        if (!campaign) return

        // If activating (launching), check limits first
        if (campaign.status !== 'active') {
            await checkLimitsBeforeLaunch()
            return
        }

        // If pausing, just pause
        setUpdating(true)
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paused' })
            })
            if (res.ok) {
                setCampaign({ ...campaign, status: 'paused' })
            }
        } finally {
            setUpdating(false)
        }
    }

    const checkLimitsBeforeLaunch = async () => {
        setUpdating(true)
        try {
            // Load campaign with its assigned accounts
            const campaignRes = await fetch(`/api/campaigns/${campaignId}`)
            const campaignData = await campaignRes.json()

            // Extract the email accounts assigned to this campaign
            let accounts: any[] = []
            if (campaignData.campaignAccounts && Array.isArray(campaignData.campaignAccounts)) {
                accounts = campaignData.campaignAccounts
                    .filter((ca: any) => ca.emailAccount)
                    .map((ca: any) => ca.emailAccount)
            }

            // Load leads count
            const leadsRes = await fetch(`/api/campaigns/${campaignId}/leads`)
            const leadsData = await leadsRes.json()
            const totalLeads = Array.isArray(leadsData) ? leadsData.length : (leadsData.total || 0)
            setLeadsCount(totalLeads)

            // Validate limits
            const validation = validateCampaignLimits(
                totalLeads,
                accounts,
                (campaignData.dailyLimit ?? campaign?.dailyLimit) || undefined
            )

            // If no accounts or exceeds limits, show warning
            if (!validation.withinLimits || validation.accountsAvailable === 0) {
                setLimitWarningData(validation)
                setLimitWarningOpen(true)
            } else {
                // Within limits, launch directly
                await launchCampaign()
            }
        } catch (error) {
            console.error('Failed to check limits:', error)
            // Launch anyway if check fails
            await launchCampaign()
        } finally {
            setUpdating(false)
        }
    }

    const launchCampaign = async () => {
        if (!campaign) return
        setUpdating(true)
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
            })
            if (res.ok) {
                setCampaign({ ...campaign, status: 'active' })
            }
        } finally {
            setUpdating(false)
        }
    }

    const confirmLaunch = async () => {
        setLimitWarningOpen(false)
        await launchCampaign()
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
                            className="bg-transparent hover:bg-[#1a1a1a] text-white border border-[#333] gap-2"
                        >
                            {campaign?.status === 'active' ? (
                                <><Pause className="h-4 w-4" /> Pause campaign</>
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

            {/* Limit Warning Dialog */}
            <Dialog open={limitWarningOpen} onOpenChange={setLimitWarningOpen}>
                <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-500 text-xl">
                            <AlertTriangle className="h-5 w-5" />
                            Sending Capacity Warning
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {limitWarningData && (
                            <>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {getWarningMessage(limitWarningData)}
                                </p>

                                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a]">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Leads</div>
                                            <div className="text-white font-semibold text-lg">{formatCapacityInfo(limitWarningData).totalLeads}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Daily Capacity</div>
                                            <div className="text-white font-semibold text-lg">{formatCapacityInfo(limitWarningData).dailyCapacity}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Days Needed</div>
                                            <div className="text-yellow-500 font-semibold text-lg">
                                                {limitWarningData.daysNeeded === Infinity ? '∞' : `${limitWarningData.daysNeeded} days`}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Active Accounts</div>
                                            <div className="text-white font-semibold text-lg">{limitWarningData.accountsAvailable}</div>
                                        </div>
                                    </div>
                                </div>

                                {limitWarningData.accountsAvailable > 0 && (
                                    <p className="text-sm text-gray-400 bg-blue-500/10 p-3 rounded border border-blue-500/20">
                                        💡 The campaign will automatically spread sends across multiple days to respect your limits.
                                    </p>
                                )}

                                {limitWarningData.accountsAvailable === 0 && (
                                    <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded border border-red-500/20">
                                        ⚠️ Please connect at least one email account before launching this campaign.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setLimitWarningOpen(false)}
                            className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            Cancel
                        </Button>
                        {limitWarningData?.accountsAvailable > 0 && (
                            <Button
                                onClick={confirmLaunch}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Launch Campaign
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
