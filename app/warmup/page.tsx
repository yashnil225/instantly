"use client"

import { useState, useEffect } from "react"
import {
    Flame,
    TrendingUp,
    TrendingDown,
    Mail,
    Reply,
    ShieldCheck,
    Globe,
    RefreshCw,
    Settings,
    AlertCircle,
    CheckCircle,
    Clock,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, Area, AreaChart } from "recharts"

interface WarmupStats {
    totalAccounts: number
    activeAccounts: number
    poolParticipants: number
    emailsSentToday: number
    emailsReceivedToday: number
    repliesSentToday: number
    spamRescuedToday: number
    averageHealthScore: number
}

interface DailyStat {
    date: string
    sent: number
    received: number
    replies: number
    spamRescued: number
    healthScore: number
}

interface AccountStat {
    id: string
    email: string
    healthScore: number
    warmupScore: number
    sentToday: number
    receivedToday: number
    repliedToday: number
    daysInWarmup: number
    status: "warming" | "warmed" | "paused" | "error"
    trend: "up" | "down" | "stable"
}

interface Activity {
    id: string
    timestamp: string
    action: string
    account: string
    details: string
    type: "send" | "receive" | "reply" | "spam_rescue" | "pool"
}

interface HealthFactor {
    name: string
    score: number
    weight: number
    description: string
    status: "good" | "warning" | "critical"
}

interface DashboardData {
    summary: WarmupStats
    dailyStats: DailyStat[]
    accountStats: AccountStat[]
    recentActivity: Activity[]
    healthBreakdown: {
        factors: HealthFactor[]
        overallScore: number
        trend: number
        recommendations: string[]
    }
}

export default function WarmupDashboardPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [data, setData] = useState<DashboardData | null>(null)

    // Fetch real warmup data
    useEffect(() => {
        fetchWarmupData()
        // Refresh every 30 seconds
        const interval = setInterval(fetchWarmupData, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchWarmupData = async () => {
        try {
            const res = await fetch('/api/analytics/warmup')
            if (res.ok) {
                const dashboardData = await res.json()
                setData(dashboardData)
            } else {
                console.error('Failed to fetch warmup data')
            }
        } catch (error) {
            console.error('Error fetching warmup data:', error)
        } finally {
            setLoading(false)
        }
    }

    const runWarmup = async () => {
        setRunning(true)
        toast({ title: "Warmup Started", description: "Running warmup cycle..." })

        try {
            const res = await fetch("/api/cron/warmup")
            const result = await res.json()
            toast({
                title: "Warmup Complete",
                description: `Sent: ${result.peerToPeer?.sent || 0}, Rescued: ${result.spamRescue?.rescued || 0}`
            })
            // Refresh data after running warmup
            await fetchWarmupData()
        } catch {
            toast({ title: "Error", description: "Failed to run warmup", variant: "destructive" })
        } finally {
            setRunning(false)
        }
    }

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { weekday: 'short' })
    }

    // Format time ago
    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
        return `${Math.floor(diffInMinutes / 1440)} days ago`
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    const summary = data?.summary
    const dailyStats = data?.dailyStats.map(stat => ({
        ...stat,
        displayDate: formatDate(stat.date)
    })) || []
    const accounts = data?.accountStats || []
    const activity = data?.recentActivity || []
    const health = data?.healthBreakdown

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="border-b border-[#2a2a2a] px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <Flame className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Email Warmup</h1>
                            <p className="text-gray-400 text-sm">Improve deliverability with automatic warmup</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>
                        <Button
                            onClick={runWarmup}
                            disabled={running}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
                            {running ? "Running..." : "Run Warmup Now"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-6">
                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Active Accounts</p>
                                <p className="text-3xl font-bold text-white mt-1">{summary?.totalAccounts || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm">
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                {(accounts.filter(a => a.status === "warmed").length)} warmed
                            </Badge>
                            <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">
                                {(accounts.filter(a => a.status === "warming").length)} warming
                            </Badge>
                        </div>
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Emails Sent Today</p>
                                <p className="text-3xl font-bold text-white mt-1">{summary?.emailsSentToday || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                        {dailyStats.length > 1 && (
                            <p className="text-sm text-green-500 mt-3 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {dailyStats[dailyStats.length - 1]?.sent > dailyStats[dailyStats.length - 2]?.sent ? '+' : ''}
                                {dailyStats[dailyStats.length - 2]?.sent > 0 
                                    ? Math.round(((dailyStats[dailyStats.length - 1]?.sent - dailyStats[dailyStats.length - 2]?.sent) / dailyStats[dailyStats.length - 2]?.sent) * 100)
                                    : 0}% vs yesterday
                            </p>
                        )}
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Reply Rate</p>
                                <p className="text-3xl font-bold text-white mt-1">
                                    {(summary?.emailsSentToday || 0) > 0 
                                        ? Math.round(((summary?.repliesSentToday || 0) / (summary?.emailsSentToday || 1)) * 100) 
                                        : 0}%
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Reply className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                        <Progress 
                            value={(summary?.emailsSentToday || 0) > 0 
                                ? Math.round(((summary?.repliesSentToday || 0) / (summary?.emailsSentToday || 1)) * 100) 
                                : 0} 
                            className="mt-3 h-2" 
                        />
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Avg Health Score</p>
                                <p className="text-3xl font-bold text-white mt-1">{summary?.averageHealthScore || 100}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                        <Progress 
                            value={summary?.averageHealthScore || 100} 
                            className="mt-3 h-2 [&>div]:bg-orange-500" 
                        />
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-3 gap-6">
                    <Card className="bg-[#111] border-[#2a2a2a] p-6 col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Warmup Activity (7 Days)</h2>
                            <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500"></span> Sent</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500"></span> Received</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-purple-500"></span> Replies</span>
                            </div>
                        </div>
                        <div className="h-64">
                            {dailyStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyStats}>
                                        <defs>
                                            <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="sent" stroke="#3b82f6" fill="url(#sentGradient)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="received" stroke="#22c55e" fill="none" strokeWidth={2} />
                                        <Area type="monotone" dataKey="replies" stroke="#8b5cf6" fill="none" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    No warmup data yet
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
                        <div className="space-y-3">
                            {activity.length > 0 ? (
                                activity.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3 py-2 border-b border-[#2a2a2a] last:border-0">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                                            item.type === "send" ? "bg-blue-500/10 text-blue-500" :
                                            item.type === "reply" ? "bg-purple-500/10 text-purple-500" :
                                            item.type === "spam_rescue" ? "bg-green-500/10 text-green-500" :
                                            "bg-orange-500/10 text-orange-500"
                                        }`}>
                                            {item.type === "send" ? "📤" :
                                             item.type === "reply" ? "↩️" :
                                             item.type === "spam_rescue" ? "🛟" : "🌐"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{item.action}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.account}</p>
                                        </div>
                                        <span className="text-xs text-gray-600">{formatTimeAgo(item.timestamp)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-center py-8">
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Accounts Table */}
                <Card className="bg-[#111] border-[#2a2a2a] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Warmup Accounts</h2>
                        <Button variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white">
                            <Globe className="h-4 w-4 mr-2" />
                            Join Warmup Pool
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-[#2a2a2a]">
                                    <th className="pb-3">Email Account</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Health Score</th>
                                    <th className="pb-3">Sent Today</th>
                                    <th className="pb-3">Days in Warmup</th>
                                    <th className="pb-3">Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.length > 0 ? (
                                    accounts.map((account) => (
                                        <tr key={account.id} className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {account.email[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-white font-medium">{account.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <Badge className={
                                                    account.status === "warmed" ? "bg-green-500/10 text-green-500" :
                                                    account.status === "warming" ? "bg-blue-500/10 text-blue-500" :
                                                    "bg-red-500/10 text-red-500"
                                                }>
                                                    {account.status === "warmed" && <CheckCircle className="h-3 w-3 mr-1" />}
                                                    {account.status === "warming" && <Clock className="h-3 w-3 mr-1" />}
                                                    {account.status === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
                                                    {account.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${account.healthScore >= 80 ? "bg-green-500" :
                                                                account.healthScore >= 60 ? "bg-yellow-500" :
                                                                    "bg-red-500"
                                                            }`}
                                                            style={{ width: `${account.healthScore}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm font-medium ${account.healthScore >= 80 ? "text-green-500" :
                                                        account.healthScore >= 60 ? "text-yellow-500" :
                                                            "text-red-500"
                                                    }`}>{account.healthScore}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-white">{account.sentToday}</td>
                                            <td className="py-4 text-gray-400">{account.daysInWarmup} days</td>
                                            <td className="py-4">
                                                {account.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                                                {account.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                                                {account.trend === "stable" && <span className="text-gray-500">—</span>}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            No warmup accounts yet. Enable warmup on your email accounts to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
