"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
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
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Share2,
    Filter,
    ChevronDown,
    Info,
    Loader2,
    Download,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/ui/logo"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"
import { DeliverabilityDashboard } from "@/components/app/deliverability-dashboard"
import { SendTimeHeatmap, ConversionFunnel } from "@/components/app/analytics-charts"

interface AnalyticsData {
    totalSent: number
    opensRate: number
    clickRate: number
    replyRate: number
    opportunities: {
        count: number
        value: number
    }
    chartData: {
        date: string
        sent: number
        totalOpens: number
        uniqueOpens: number
        totalReplies: number
        sentClicks: number
        uniqueClicks: number
    }[]
    heatmapData?: unknown[]
    funnelData?: unknown[]
    accountStats?: {
        id: string
        email: string
        status: string
        health: number
        sent: number
        opens: number
        replies: number
        openRate: number
        replyRate: number
    }[]
    deliverability?: unknown
}

export default function AnalyticsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [dateRange, setDateRange] = useState("last_7_days")
    // const [filterOpen, setFilterOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("campaign")
    const [shareOpen, setShareOpen] = useState(false)
    const [customDateOpen, setCustomDateOpen] = useState(false)
    const [customStartDate, setCustomStartDate] = useState("")
    const [customEndDate, setCustomEndDate] = useState("")
    const [filters, setFilters] = useState({
        includeAutoReplies: true,
        showTotalSent: true,
        showOpensRate: true,
        showClickRate: true,
        showReplyRate: true,
        showOpportunities: true,
    })

    // Workspace state
    const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")

    useEffect(() => {
        loadWorkspaces()
    }, [])

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

    const fetchAnalytics = React.useCallback(async () => {
        setLoading(true)
        try {
            const workspace = workspaces.find((w) => w.name === currentWorkspace)
            const workspaceId = workspace?.id || 'all'

            const params = new URLSearchParams({ range: dateRange })
            if (workspaceId !== 'all') {
                params.append('workspaceId', workspaceId)
            }

            const res = await fetch(`/api/analytics?${params.toString()}`)
            if (res.ok) {
                const analyticsData = await res.json()
                setData(analyticsData)
            }
        } catch (error) {
            console.error("Failed to fetch analytics:", error)
        } finally {
            setLoading(false)
        }
    }, [dateRange, currentWorkspace, workspaces])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    const handleDateRangeChange = (value: string) => {
        if (value === "custom") {
            setCustomDateOpen(true)
        } else {
            setDateRange(value)
        }
    }

    const applyCustomDateRange = () => {
        if (!customStartDate || !customEndDate) {
            toast({ title: "Error", description: "Please select both start and end dates", variant: "destructive" })
            return
        }
        if (new Date(customStartDate) > new Date(customEndDate)) {
            toast({ title: "Error", description: "Start date must be before end date", variant: "destructive" })
            return
        }
        setDateRange(`custom_${customStartDate}_${customEndDate}`)
        setCustomDateOpen(false)
        toast({ title: "Success", description: "Custom date range applied" })
    }

    const getDateRangeLabel = () => {
        if (dateRange.startsWith("custom_")) {
            const parts = dateRange.split("_")
            return `${parts[1]} to ${parts[2]}`
        }
        return dateRangeOptions.find(opt => opt.value === dateRange)?.label || "Last 7 days"
    }

    const dateRangeOptions = [
        { label: "Last 7 days", value: "last_7_days" },
        { label: "Month to date", value: "month_to_date" },
        { label: "Last 4 weeks", value: "last_4_weeks" },
        { label: "Last 3 months", value: "last_3_months" },
        { label: "Last 6 months", value: "last_6_months" },
        { label: "Last 12 months", value: "last_12_months" },
        { label: "Custom", value: "custom" },
    ]

    const metricCards = [
        {
            title: "Total sent",
            value: data?.totalSent || 0,
            tooltip: "Total number of emails sent",
            show: filters.showTotalSent,
        },
        {
            title: "Opens rate",
            value: data?.opensRate || 0,
            tooltip: "Percentage of emails opened",
            show: filters.showOpensRate,
        },
        {
            title: "Click rate",
            value: data?.clickRate || 0,
            tooltip: "Percentage of emails clicked",
            show: filters.showClickRate,
        },
        {
            title: "Reply rate",
            value: data?.replyRate || 0,
            tooltip: "Percentage of emails replied to",
            show: filters.showReplyRate,
        },
    ].filter(card => card.show)

    const handleShare = () => {
        setShareOpen(true)
    }

    const handleExportPDF = () => {
        toast({ title: "Success", description: "Exporting to PDF..." })
        // TODO: Implement PDF export
    }

    const handleExportCSV = () => {
        const csv = [
            ["Metric", "Value"],
            ["Total Sent", data?.totalSent || 0],
            ["Opens Rate", `${data?.opensRate || 0}%`],
            ["Click Rate", `${data?.clickRate || 0}%`],
            ["Reply Rate", `${data?.replyRate || 0}%`],
            ["Opportunities", `${data?.opportunities.count || 0} | $${data?.opportunities.value || 0}`]
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "analytics.csv"
        a.click()
        toast({ title: "Success", description: "Analytics exported to CSV" })
    }

    const copyShareLink = () => {
        const shareLink = `${window.location.origin}/analytics`
        navigator.clipboard.writeText(shareLink)
        toast({ title: "Success", description: "Link copied to clipboard" })
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background p-8 text-foreground font-sans">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
                        <div className="flex items-center gap-4">

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary gap-2">
                                        <Logo variant="icon" size="sm" />
                                        {currentWorkspace}
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 bg-card border-border text-foreground p-1">
                                    <div className="p-2">
                                        <Input
                                            placeholder="Search"
                                            value={workspaceSearch}
                                            onChange={(e) => setWorkspaceSearch(e.target.value)}
                                            className="bg-secondary border-border text-foreground text-sm h-8 mb-2 focus-visible:ring-blue-600/50"
                                        />
                                    </div>
                                    <DropdownMenuSeparator className="bg-muted" />
                                    {filteredWorkspaces.map((workspace) => (
                                        <DropdownMenuItem
                                            key={workspace.id || workspace.name}
                                            onClick={() => switchWorkspace(workspace.name)}
                                            className={cn(
                                                "cursor-pointer rounded-md focus:bg-secondary focus:text-foreground my-0.5",
                                                currentWorkspace === workspace.name && "bg-blue-600/10 text-blue-400"
                                            )}
                                        >
                                            <Logo variant="icon" size="sm" className="mr-2" />
                                            {workspace.name}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator className="bg-muted" />
                                    <DropdownMenuItem className="focus:bg-secondary">Settings</DropdownMenuItem>
                                    <DropdownMenuItem className="focus:bg-secondary">Billing</DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-muted" />
                                    <DropdownMenuItem
                                        className="text-red-400 focus:text-red-400 focus:bg-red-900/10"
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
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-border bg-card text-foreground hover:bg-secondary hover:text-foreground gap-2 h-9"
                                onClick={handleShare}
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary gap-2 h-9"
                                onClick={() => toast({ title: "Exporting...", description: "Your CSV download will start shortly." })}
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                            <Button
                                variant="outline"
                                className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary gap-2 h-9"
                                onClick={() => setShareOpen(true)}
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-border bg-card text-foreground hover:bg-secondary hover:text-foreground gap-2 h-9"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filter
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground">
                                    <DropdownMenuLabel>Metrics</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-muted" />
                                    <DropdownMenuCheckboxItem
                                        checked={filters.includeAutoReplies}
                                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeAutoReplies: !!checked }))}
                                        className="focus:bg-secondary"
                                    >
                                        Include auto replies
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={filters.showTotalSent}
                                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showTotalSent: !!checked }))}
                                        className="focus:bg-secondary"
                                    >
                                        Total sent
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={filters.showOpensRate}
                                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showOpensRate: !!checked }))}
                                        className="focus:bg-secondary"
                                    >
                                        Opens rate
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={filters.showClickRate}
                                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showClickRate: !!checked }))}
                                        className="focus:bg-secondary"
                                    >
                                        Click rate
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={filters.showReplyRate}
                                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showReplyRate: !!checked }))}
                                        className="focus:bg-secondary"
                                    >
                                        Reply rate
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={filters.showOpportunities}
                                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showOpportunities: !!checked }))}
                                        className="focus:bg-secondary"
                                    >
                                        Opportunities
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-border bg-card text-foreground hover:bg-secondary hover:text-foreground gap-2 h-9">
                                        {getDateRangeLabel()}
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-card border-border text-foreground p-1">
                                    {dateRangeOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => handleDateRangeChange(option.value)}
                                            className={cn(
                                                "cursor-pointer rounded-md focus:bg-secondary focus:text-foreground my-0.5",
                                                dateRange === option.value && "bg-blue-600/10 text-blue-400"
                                            )}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>


                        </div>
                    </div>

                    <div className="flex gap-6">
                        {/* Main Content */}
                        <div className="flex-1 space-y-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-24">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <>
                                    {/* Metric Cards */}
                                    <div className="grid grid-cols-4 gap-4">
                                        {metricCards.map((metric) => (
                                            <div
                                                key={metric.title}
                                                className="bg-card border border-border rounded-lg p-6 hover:border-border transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-muted-foreground">{metric.title}</span>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-gray-600 cursor-help hover:text-muted-foreground transition-colors" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-card border-border text-foreground">{metric.tooltip}</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <div className="text-3xl font-bold text-foreground tracking-tight">{metric.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Opportunities Card */}
                                    {filters.showOpportunities && (
                                        <div className="bg-card border border-border rounded-lg p-6 hover:border-border transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-muted-foreground">Opportunities</span>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 text-gray-600 cursor-help hover:text-muted-foreground transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-card border-border text-foreground">Number and value of opportunities</TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <div className="text-3xl font-bold text-foreground tracking-tight flex items-baseline gap-2">
                                                {data?.opportunities.count || 0}
                                                <span className="text-xl text-muted-foreground font-normal">|</span>
                                                <div className="text-green-500 text-3xl font-bold">
                                                    ${data?.opportunities.value || 0}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Chart */}
                                    <div className="bg-card border border-border rounded-lg p-6">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <LineChart data={data?.chartData || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#666"
                                                    style={{ fontSize: '12px' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    stroke="#666"
                                                    style={{ fontSize: '12px' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dx={-10}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px',
                                                        color: 'hsl(var(--foreground))',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                    }}
                                                    cursor={{ stroke: 'hsl(var(--border))' }}
                                                />
                                                <Legend
                                                    wrapperStyle={{ paddingTop: '20px' }}
                                                    iconType="circle"
                                                />
                                                <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Sent" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="totalOpens" stroke="#eab308" name="Total opens" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="uniqueOpens" stroke="#22c55e" name="Unique opens" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="totalReplies" stroke="#10b981" name="Total replies" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="sentClicks" stroke="#6b7280" name="Sent clicks" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="uniqueClicks" stroke="#9ca3af" name="Unique clicks" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Advanced Analytics Charts - Show for campaign tab */}
                                    {activeTab === "campaign" && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-card border border-border rounded-lg p-6">
                                                <SendTimeHeatmap data={data?.heatmapData as any} />
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-6">
                                                <ConversionFunnel data={data?.funnelData as any} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Tabs */}
                                    <div className="flex items-center gap-8 border-b border-border">
                                        <button
                                            onClick={() => setActiveTab("campaign")}
                                            className={cn(
                                                "pb-3 text-sm font-medium transition-colors relative",
                                                activeTab === "campaign"
                                                    ? "text-blue-500"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Campaign Analytics
                                            {activeTab === "campaign" && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("account")}
                                            className={cn(
                                                "pb-3 text-sm font-medium transition-colors relative",
                                                activeTab === "account"
                                                    ? "text-blue-500"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Account Analytics
                                            {activeTab === "account" && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("deliverability")}
                                            className={cn(
                                                "pb-3 text-sm font-medium transition-colors relative",
                                                activeTab === "deliverability"
                                                    ? "text-blue-500"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Deliverability
                                            {activeTab === "deliverability" && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Account Analytics Tab */}
                                    {activeTab === "account" && (
                                        <div className="pt-6">
                                            <div className="bg-card border border-border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                                                        <tr>
                                                            <th className="px-6 py-4 font-semibold">Account</th>
                                                            <th className="px-6 py-4 font-semibold">Status</th>
                                                            <th className="px-6 py-4 font-semibold">Health</th>
                                                            <th className="px-6 py-4 font-semibold text-center">Sent</th>
                                                            <th className="px-6 py-4 font-semibold text-center">Open Rate</th>
                                                            <th className="px-6 py-4 font-semibold text-center">Reply Rate</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {data?.accountStats?.map((account) => (
                                                            <tr key={account.id} className="hover:bg-secondary/30 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-foreground">{account.email}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                                        account.status === "active" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                                                                    )}>
                                                                        {account.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                                            <div
                                                                                className={cn("h-full", account.health > 80 ? "bg-green-500" : "bg-yellow-500")}
                                                                                style={{ width: `${account.health}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs">{account.health}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">{account.sent}</td>
                                                                <td className="px-6 py-4 text-center">{account.openRate}%</td>
                                                                <td className="px-6 py-4 text-center">{account.replyRate}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Deliverability Dashboard - Show when tab is active */}
                                    {activeTab === "deliverability" && (
                                        <div className="pt-6">
                                            <DeliverabilityDashboard initialData={data?.deliverability as any} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Filter Panel */}

                    </div>
                </div>
            </div>

            {/* Share Analytics Modal */}
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogContent className="bg-card border-border sm:max-w-[440px] p-0 overflow-hidden shadow-2xl">
                    <div className="sr-only">
                        <DialogTitle>Share Analytics</DialogTitle>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-foreground">Share Analytics</h2>
                            <p className="text-muted-foreground text-sm">Export or share your analytics data</p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleExportCSV}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-foreground rounded-lg h-10 gap-2 font-medium"
                            >
                                <Download className="h-4 w-4" />
                                Export to CSV
                            </Button>
                            <Button
                                onClick={handleExportPDF}
                                variant="outline"
                                className="w-full border-border bg-background text-foreground hover:bg-secondary rounded-lg h-10 gap-2 font-medium"
                            >
                                <Download className="h-4 w-4" />
                                Export to PDF
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Share Link</label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/analytics`}
                                    className="text-sm bg-background border-border h-10 px-3 rounded-lg text-foreground focus-visible:ring-blue-600/50"
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
                            <Button variant="ghost" onClick={() => setShareOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Date Range Modal */}
            <Dialog open={customDateOpen} onOpenChange={setCustomDateOpen}>
                <DialogContent className="bg-card border-border sm:max-w-[440px] p-0 overflow-hidden shadow-2xl">
                    <div className="sr-only">
                        <DialogTitle>Custom Date Range</DialogTitle>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-foreground">Select Custom Date Range</h2>
                            <p className="text-muted-foreground text-sm">Choose start and end dates</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="bg-background border-border h-10 px-3 rounded-lg text-foreground focus-visible:ring-blue-600/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">End Date</label>
                                <Input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="bg-background border-border h-10 px-3 rounded-lg text-foreground focus-visible:ring-blue-600/50"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setCustomDateOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                                Cancel
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-500 text-foreground rounded-lg px-4"
                                onClick={applyCustomDateRange}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}
