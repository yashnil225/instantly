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
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, Area, AreaChart } from "recharts"

// Demo data for warmup stats
const DEMO_DAILY_STATS = [
    { date: "Mon", sent: 45, received: 42, replies: 38 },
    { date: "Tue", sent: 52, received: 48, replies: 44 },
    { date: "Wed", sent: 48, received: 45, replies: 41 },
    { date: "Thu", sent: 61, received: 58, replies: 52 },
    { date: "Fri", sent: 55, received: 52, replies: 47 },
    { date: "Sat", sent: 32, received: 30, replies: 27 },
    { date: "Sun", sent: 28, received: 26, replies: 23 },
]

const DEMO_ACCOUNTS = [
    { id: "1", email: "sales@company.com", healthScore: 95, status: "warmed", sentToday: 25, daysInWarmup: 21, trend: "up" },
    { id: "2", email: "marketing@company.com", healthScore: 88, status: "warming", sentToday: 18, daysInWarmup: 14, trend: "up" },
    { id: "3", email: "support@company.com", healthScore: 72, status: "warming", sentToday: 12, daysInWarmup: 7, trend: "stable" },
    { id: "4", email: "info@company.com", healthScore: 45, status: "error", sentToday: 0, daysInWarmup: 3, trend: "down" },
]

const DEMO_ACTIVITY = [
    { id: "1", action: "Sent warmup email", account: "sales@company.com", time: "2 min ago", type: "send" },
    { id: "2", action: "Auto-replied to warmup", account: "marketing@company.com", time: "5 min ago", type: "reply" },
    { id: "3", action: "Rescued from spam", account: "support@company.com", time: "12 min ago", type: "rescue" },
    { id: "4", action: "Pool warmup sent", account: "sales@company.com", time: "15 min ago", type: "pool" },
    { id: "5", action: "Received warmup email", account: "marketing@company.com", time: "18 min ago", type: "receive" },
]

export default function WarmupDashboardPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setLoading(false), 1000)
    }, [])

    const runWarmup = async () => {
        setRunning(true)
        toast({ title: "Warmup Started", description: "Running warmup cycle..." })

        try {
            const res = await fetch("/api/cron/warmup")
            const data = await res.json()
            toast({
                title: "Warmup Complete",
                description: `Sent: ${data.peerToPeer?.sent || 0}, Rescued: ${data.spamRescue?.rescued || 0}`
            })
        } catch {
            toast({ title: "Error", description: "Failed to run warmup", variant: "destructive" })
        } finally {
            setRunning(false)
        }
    }

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
                                <p className="text-3xl font-bold text-white mt-1">4</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm">
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">3 warmed</Badge>
                            <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">1 warming</Badge>
                        </div>
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Emails Sent Today</p>
                                <p className="text-3xl font-bold text-white mt-1">156</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                        <p className="text-sm text-green-500 mt-3 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12% vs yesterday
                        </p>
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Reply Rate</p>
                                <p className="text-3xl font-bold text-white mt-1">87%</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Reply className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                        <Progress value={87} className="mt-3 h-2" />
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Avg Health Score</p>
                                <p className="text-3xl font-bold text-white mt-1">82</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                        <Progress value={82} className="mt-3 h-2 [&>div]:bg-orange-500" />
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
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={DEMO_DAILY_STATS}>
                                    <defs>
                                        <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
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
                        </div>
                    </Card>

                    <Card className="bg-[#111] border-[#2a2a2a] p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
                        <div className="space-y-3">
                            {DEMO_ACTIVITY.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-[#2a2a2a] last:border-0">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${activity.type === "send" ? "bg-blue-500/10 text-blue-500" :
                                        activity.type === "reply" ? "bg-purple-500/10 text-purple-500" :
                                            activity.type === "rescue" ? "bg-green-500/10 text-green-500" :
                                                "bg-orange-500/10 text-orange-500"
                                        }`}>
                                        {activity.type === "send" ? "📤" :
                                            activity.type === "reply" ? "↩️" :
                                                activity.type === "rescue" ? "🛟" : "🌐"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{activity.action}</p>
                                        <p className="text-xs text-gray-500 truncate">{activity.account}</p>
                                    </div>
                                    <span className="text-xs text-gray-600">{activity.time}</span>
                                </div>
                            ))}
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
                                {DEMO_ACCOUNTS.map((account) => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
