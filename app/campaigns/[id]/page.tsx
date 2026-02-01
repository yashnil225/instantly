"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    ChevronDown,
    Info,
    Loader2,
    Search,
    Download,
    Share2,
    Settings,
    Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { SendTimeHeatmap, ConversionFunnel } from "@/components/app/analytics-charts"
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

interface CampaignAnalytics {
    name: string
    status: string
    createdAt?: string
    completion: number
    sequenceStarted: number
    openRate: string
    clickRate: string
    replyRate?: string
    positiveReplyRate?: string
    opportunities: {
        count: number
        value: number
    }
    conversions: {
        count: number
        value: number
    }
    chartData: {
        date: string
        sent: number
        totalReplies: number
        uniqueOpens: number
        totalReplies2: number
        totalClicks: number
        uniqueClicks: number
    }[]
    stepAnalytics: {
        step: string
        sent: number
        opened: number
        replied: number
        clicked: number
        opportunities: number
    }[]
    leads?: { id: string; status: string }[]
    sequences?: unknown[]
    heatmapData?: unknown[]
    funnelData?: unknown[]
    dailyLimit?: number | null
    trackOpens?: boolean
    trackLinks?: boolean
    stopOnReply?: boolean
}

export default function CampaignAnalyticsPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const campaignId = params.id as string

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<CampaignAnalytics | null>(null)
    const [dateRange, setDateRange] = useState("last_7_days")
    const [filterOpen, setFilterOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)
    const [customDateOpen, setCustomDateOpen] = useState(false)
    const [customStartDate, setCustomStartDate] = useState("")
    const [customEndDate, setCustomEndDate] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    const [filters, setFilters] = useState({
        includeAutoReplies: false,
        showSequenceStarted: true,
        showOpenRate: true,
        showClickRate: true,
        showReplyRate: false,
        showPositiveReplyRate: false,
        showOpportunities: true,
        showConversions: false,
    })

    const dateRangeOptions = [
        { label: "Last 7 days", value: "last_7_days" },
        { label: "Month to date", value: "month_to_date" },
        { label: "Last 4 weeks", value: "last_4_weeks" },
        { label: "Last 3 months", value: "last_3_months" },
        { label: "Last 6 months", value: "last_6_months" },
        { label: "Last 12 months", value: "last_12_months" },
        { label: "Custom", value: "custom" },
    ]

    const fetchCampaignAnalytics = React.useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ range: dateRange })
            const res = await fetch(`/api/campaigns/${campaignId}/analytics?${params.toString()}`)
            if (res.ok) {
                const analyticsData = await res.json()
                setData(analyticsData)
            }
        } catch (err) {
            console.error("Failed to fetch campaign analytics:", err)
        } finally {
            setLoading(false)
        }
    }, [campaignId, dateRange])

    useEffect(() => {
        fetchCampaignAnalytics()
    }, [fetchCampaignAnalytics])



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

    const handleDiagnose = async () => {
        toast({ title: "Running diagnostics...", description: "Analyzing campaign health" })
        try {
            const issues = []
            const warnings = []
            const suggestions = []

            if (!data?.sequences || data.sequences.length === 0) issues.push("No email sequences configured")
            if (!data?.leads || data.leads.length === 0) issues.push("No leads added to campaign")
            if (data?.openRate === "Disabled") warnings.push("Email open tracking is disabled")

            if (issues.length === 0 && warnings.length === 0 && suggestions.length === 0) {
                toast({ title: "✅ Campaign Health: Excellent", description: "No issues detected." })
            } else {
                toast({ title: "Campaign Diagnostics", description: "Check console for details" })
            }
        } catch (err) {
            console.error("Diagnostics error:", err)
            toast({ title: "Error", description: "Failed to run diagnostics", variant: "destructive" })
        }
    }

    const handleShare = () => {
        setShareOpen(true)
    }



    const copyShareLink = () => {
        if (typeof window !== 'undefined') {
            const shareLink = `${window.location.origin}/campaigns/${campaignId}`
            navigator.clipboard.writeText(shareLink)
            toast({ title: "Success", description: "Link copied" })
        }
    }

    const metricCards = [
        {
            title: "Sequence started",
            value: data?.sequenceStarted || 0,
            tooltip: "Number of leads who started the sequence",
            show: filters.showSequenceStarted,
        },
        {
            title: "Open rate",
            value: data?.openRate || "0%",
            tooltip: "Percentage of emails opened",
            show: filters.showOpenRate,
        },
        {
            title: "Click rate",
            value: data?.clickRate || "0%",
            tooltip: "Percentage of emails clicked",
            show: filters.showClickRate,
        },
        {
            title: "Reply rate",
            value: data?.replyRate || "0%",
            tooltip: "Percentage of emails replied to",
            show: filters.showReplyRate,
        },
        {
            title: "Positive Reply Rate",
            value: data?.positiveReplyRate || "0%",
            tooltip: "Percentage of positive replies",
            show: filters.showPositiveReplyRate,
        },
        {
            title: "Opportunities",
            value: `${data?.opportunities?.count || 0} | $${data?.opportunities?.value || 0}`,
            tooltip: "Number and value of opportunities",
            show: filters.showOpportunities,
        },
        {
            title: "Conversions",
            value: `${data?.conversions?.count || 0} | $${data?.conversions?.value || 0}`,
            tooltip: "Number and value of conversions",
            show: filters.showConversions,
        },
    ].filter(card => card.show)

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-[#0a0a0a] p-8 text-white font-sans">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-[#333] bg-[#111] text-gray-300 hover:text-white hover:bg-[#1a1a1a] gap-2 h-9"
                                onClick={handleDiagnose}
                            >
                                <Stethoscope className="h-4 w-4" />
                                Diagnose
                            </Button>
                            <Button
                                variant="outline"
                                className="border-[#333] bg-[#111] text-gray-300 hover:text-white hover:bg-[#1a1a1a] gap-2 h-9"
                                onClick={handleShare}
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                            <Button
                                variant="outline"
                                className="border-[#333] bg-[#111] text-gray-300 hover:text-white hover:bg-[#1a1a1a] gap-2 h-9"
                                onClick={() => toast({ title: "Exporting...", description: "Your CSV download will start shortly." })}
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-[#333] bg-[#111] text-gray-300 hover:text-white hover:bg-[#1a1a1a] gap-2 h-9">
                                        {getDateRangeLabel()}
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#111] border-[#333] text-white p-1">
                                    {dateRangeOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => handleDateRangeChange(option.value)}
                                            className={cn(
                                                "cursor-pointer rounded-md focus:bg-[#1a1a1a] focus:text-white my-0.5",
                                                dateRange === option.value && "bg-blue-600/10 text-blue-400"
                                            )}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] h-9 w-9"
                                        onClick={() => setSettingsOpen(true)}
                                    >
                                        <Settings className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#111] border-[#333] text-white">Settings</TooltipContent>
                            </Tooltip>

                            <Button
                                variant="outline"
                                className={cn(
                                    "border-[#333] bg-[#111] text-gray-300 hover:text-white hover:bg-[#1a1a1a] gap-2 h-9",
                                    filterOpen && "bg-[#1a1a1a] text-white border-blue-600/50"
                                )}
                                onClick={() => setFilterOpen(!filterOpen)}
                            >
                                Comments
                                {filterOpen && <span className="text-blue-500">✓</span>}
                            </Button>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-[#0a0a0a] border-[#333] text-white w-64 h-9 focus-visible:ring-blue-600/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Row with Hover Card */}
                    <div className="flex items-center gap-4 py-2">
                        <div className="text-gray-500 text-sm font-medium">Status:</div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-3 cursor-pointer group">
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border capitalize",
                                        data?.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                    )}>
                                        <Info className="h-3 w-3" />
                                        {data?.status || 'Draft'}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#2a2a2a]">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${data?.completion || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-white font-medium text-sm">{data?.completion || 0}%</span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#111] border-[#333] p-0 w-[420px] shadow-2xl" side="bottom" align="start">
                                <div className="p-6 space-y-6">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Created</div>
                                        <div className="text-xl font-bold text-white tracking-tight">
                                            {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Leads</div>
                                            <div className="text-lg font-bold text-white">{data?.leads?.length || 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Completed</div>
                                            <div className="text-lg font-bold text-white">
                                                {data?.leads?.filter((l) => l.status === 'sequence_complete').length || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">In Progress</div>
                                            <div className="text-lg font-bold text-white">
                                                {data?.leads?.filter((l) => l.status === 'contacted').length || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Not yet contacted</div>
                                            <div className="text-lg font-bold text-white">
                                                {data?.leads?.filter((l) => l.status === 'new').length || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bounced</div>
                                            <div className="text-lg font-bold text-white">
                                                {data?.leads?.filter((l) => l.status === 'bounced').length || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unsubscribed</div>
                                            <div className="text-lg font-bold text-white">
                                                {data?.leads?.filter((l) => l.status === 'unsubscribed').length || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Progress</div>
                                            <div className="text-lg font-bold text-white">{data?.completion || 0}%</div>
                                        </div>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
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
                                    <div className="grid grid-cols-5 gap-4">
                                        {metricCards.map((metric) => (
                                            <div
                                                key={metric.title}
                                                className="bg-[#111] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#333] transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-gray-400">{metric.title}</span>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-gray-600 cursor-help hover:text-gray-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-[#111] border-[#333] text-white">{metric.tooltip}</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <div className="text-2xl font-bold text-white tracking-tight">{metric.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Chart */}
                                    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-6">
                                        <ResponsiveContainer width="100%" height={300}>
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
                                                        backgroundColor: '#0a0a0a',
                                                        border: '1px solid #333',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                    }}
                                                    cursor={{ stroke: '#333' }}
                                                />
                                                <Legend
                                                    wrapperStyle={{ paddingTop: '20px' }}
                                                    iconType="circle"
                                                />
                                                <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Sent" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="totalReplies" stroke="#eab308" name="Total replies" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="uniqueOpens" stroke="#22c55e" name="Unique opens" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="totalClicks" stroke="#6b7280" name="Total clicks" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="uniqueClicks" stroke="#9ca3af" name="Unique clicks" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Advanced Analytics Charts */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-6">
                                            <SendTimeHeatmap data={data?.heatmapData as any} />
                                        </div>
                                        <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-6">
                                            <ConversionFunnel data={data?.funnelData as any} />
                                        </div>
                                    </div>

                                    {/* Step Analytics Table */}
                                    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-6">
                                        <div className="flex items-center gap-8 border-b border-[#2a2a2a] mb-6">
                                            <button className="pb-3 text-sm font-medium text-blue-500 relative transition-colors">
                                                Step Analytics
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                            </button>
                                            <button className="pb-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                                                Activity
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#2a2a2a]">
                                                        <th className="text-left pb-4 pl-4">Step</th>
                                                        <th className="text-left pb-4">Sent</th>
                                                        <th className="text-left pb-4">Opened</th>
                                                        <th className="text-left pb-4">Replied</th>
                                                        <th className="text-left pb-4">Clicked</th>
                                                        <th className="text-left pb-4 pr-4">Opportunities</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data?.stepAnalytics && data.stepAnalytics.length > 0 ? (
                                                        data.stepAnalytics.map((step, index) => (
                                                            <tr key={index} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors last:border-0">
                                                                <td className="py-4 pl-4 text-sm font-medium text-white">{step.step}</td>
                                                                <td className="py-4 text-sm text-gray-300">{step.sent}</td>
                                                                <td className="py-4 text-sm text-gray-300">{step.opened}</td>
                                                                <td className="py-4 text-sm text-gray-300">{step.replied}</td>
                                                                <td className="py-4 text-sm text-gray-300">{step.clicked}</td>
                                                                <td className="py-4 pr-4 text-sm text-gray-300">{step.opportunities}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="py-12 text-center text-gray-500">
                                                                No step analytics data available
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Filters Panel */}
                        {filterOpen && (
                            <div className="w-80 bg-[#111] border border-[#2a2a2a] rounded-lg p-5 space-y-4 h-fit">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Metrics</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="includeAutoReplies"
                                            checked={filters.includeAutoReplies}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, includeAutoReplies: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="includeAutoReplies" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Include auto replies</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="showSequenceStarted"
                                            checked={filters.showSequenceStarted}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, showSequenceStarted: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="showSequenceStarted" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Sequence started</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="showOpenRate"
                                            checked={filters.showOpenRate}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, showOpenRate: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="showOpenRate" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Open rate</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="showClickRate"
                                            checked={filters.showClickRate}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, showClickRate: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="showClickRate" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Click rate</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="showReplyRate"
                                            checked={filters.showReplyRate}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, showReplyRate: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="showReplyRate" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Reply rate</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="showPositiveReplyRate"
                                            checked={filters.showPositiveReplyRate}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, showPositiveReplyRate: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="showPositiveReplyRate" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Positive Reply Rate</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="showOpportunities"
                                            checked={filters.showOpportunities}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, showOpportunities: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=changed]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="showOpportunities" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Opportunities</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="showConversions"
                                            checked={filters.showConversions}
                                            onCheckedChange={(checked) =>
                                                setFilters({ ...filters, showConversions: checked as boolean })
                                            }
                                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm w-4 h-4"
                                        />
                                        <label htmlFor="showConversions" className="text-sm text-gray-300 cursor-pointer select-none hover:text-white">Conversions</label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Share Campaign Modal */}
                    <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                        <DialogContent className="bg-[#0a0a0a] border-[#2a2a2a] sm:max-w-[500px] p-0 overflow-hidden">
                            <DialogTitle className="sr-only">Share Campaign</DialogTitle>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-semibold text-white">Share Campaign</h2>
                                    <p className="text-gray-400 text-sm">Share &ldquo;{data?.name}&rdquo; with others</p>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Campaign Link</label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={typeof window !== 'undefined' ? `${window.location.origin}/campaigns/${campaignId}` : ''}
                                            className="text-sm bg-[#111] border-[#333] h-10 px-4 rounded-lg text-gray-400"
                                        />
                                        <Button onClick={copyShareLink} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4">
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button variant="ghost" onClick={() => setShareOpen(false)} className="text-gray-400 hover:text-white">Close</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Custom Date Range Modal */}
                    <Dialog open={customDateOpen} onOpenChange={setCustomDateOpen}>
                        <DialogContent className="bg-[#0a0a0a] border-[#2a2a2a] sm:max-w-[500px] p-0 overflow-hidden">
                            <DialogTitle className="sr-only">Custom Date Range</DialogTitle>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-semibold text-white">Select Custom Date Range</h2>
                                    <p className="text-gray-400 text-sm">Choose start and end dates</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Start Date</label>
                                        <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-[#111] border-[#333] h-10 px-3 text-white focus-visible:ring-blue-600/50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">End Date</label>
                                        <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-[#111] border-[#333] h-10 px-3 text-white focus-visible:ring-blue-600/50" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="ghost" onClick={() => setCustomDateOpen(false)} className="text-gray-400">Cancel</Button>
                                    <Button onClick={applyCustomDateRange} className="bg-blue-600 text-white">Apply</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Settings Dialog */}
                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-2xl">
                            <DialogTitle className="text-xl font-semibold text-white">Campaign Settings</DialogTitle>
                            <div className="space-y-6 mt-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-3">Campaign Configuration</h3>
                                    <div className="space-y-2 text-sm text-gray-400">
                                        <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                                            <span>Campaign Name</span>
                                            <span className="text-white">{data?.name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                                            <span>Status</span>
                                            <Badge variant="secondary">{data?.status || 'Unknown'}</Badge>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                                            <span>Daily Limit</span>
                                            <span className="text-white">{data?.dailyLimit || 'No limit'}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span>Track Opens</span>
                                            <span className="text-white">{data?.trackOpens ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
                                    <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-[#333] text-gray-300">Close</Button>
                                    <Button onClick={() => { setSettingsOpen(false); router.push(`/campaigns/${params.id}/options`) }} className="bg-blue-600 text-white">Edit Options</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </TooltipProvider>
    )
}
