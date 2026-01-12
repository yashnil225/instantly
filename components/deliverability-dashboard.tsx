"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Mail,
    Globe,
    Server
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DeliverabilityData {
    overallScore: number
    bounceRate: number
    spamRate: number
    openRate: number
    replyRate: number
    domainHealth: {
        domain: string
        spf: boolean
        dkim: boolean
        dmarc: boolean
        blacklisted: boolean
    }[]
    recentIssues: {
        type: "warning" | "error" | "info"
        message: string
        timestamp: string
    }[]
}

export function DeliverabilityDashboard() {
    const [data, setData] = useState<DeliverabilityData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            setData({
                overallScore: 87,
                bounceRate: 2.3,
                spamRate: 0.5,
                openRate: 42,
                replyRate: 8.5,
                domainHealth: [
                    { domain: "yourcompany.com", spf: true, dkim: true, dmarc: true, blacklisted: false },
                    { domain: "sales.yourcompany.com", spf: true, dkim: true, dmarc: false, blacklisted: false },
                ],
                recentIssues: [
                    { type: "warning", message: "High bounce rate on campaign 'Q4 Outreach'", timestamp: "2 hours ago" },
                    { type: "info", message: "Warmup completed for 3 accounts", timestamp: "1 day ago" },
                ]
            })
            setLoading(false)
        }, 1000)
    }, [])

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500"
        if (score >= 60) return "text-yellow-500"
        return "text-red-500"
    }

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-green-500"
        if (score >= 60) return "bg-yellow-500"
        return "bg-red-500"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Deliverability Dashboard</h2>
                    <p className="text-muted-foreground text-sm">Monitor your email health and domain reputation</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Main Score Card - DaisyUI Stats & Radial Progress */}
            <div className="card bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-600/20 shadow-xl">
                <div className="card-body p-8">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className={cn("radial-progress", getScoreColor(data.overallScore))}
                                style={{
                                    "--value": data.overallScore,
                                    "--size": "10rem",
                                    "--thickness": "12px"
                                } as any}
                                role="progressbar"
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-4xl font-black">{data.overallScore}</span>
                                    <span className="text-[10px] opacity-60 font-bold tracking-widest">SCORE</span>
                                </div>
                            </div>
                            <div className="badge badge-outline gap-2 border-blue-600/20 text-blue-500 font-bold uppercase tracking-tighter text-[10px] px-3">
                                <Shield className="h-3 w-3" /> Secure domain
                            </div>
                        </div>

                        <div className="flex-1 w-full mt-4">
                            <div className="stats shadow bg-[#111] border border-[#2a2a2a] w-full">
                                <div className="stat">
                                    <div className="stat-title text-gray-400 uppercase text-[10px] font-bold tracking-widest">Bounce Rate</div>
                                    <div className={cn("stat-value text-2xl", data.bounceRate < 5 ? "text-green-500" : "text-red-500")}>{data.bounceRate}%</div>
                                    <div className="stat-desc text-green-500">Good</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title text-gray-400 uppercase text-[10px] font-bold tracking-widest">Spam Rate</div>
                                    <div className={cn("stat-value text-2xl", data.spamRate < 1 ? "text-green-500" : "text-red-500")}>{data.spamRate}%</div>
                                    <div className="stat-desc text-green-500">Good</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title text-gray-400 uppercase text-[10px] font-bold tracking-widest">Open Rate</div>
                                    <div className={cn("stat-value text-2xl", data.openRate > 30 ? "text-green-500" : "text-yellow-500")}>{data.openRate}%</div>
                                    <div className="stat-desc text-green-500">High</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title text-gray-400 uppercase text-[10px] font-bold tracking-widest">Reply Rate</div>
                                    <div className={cn("stat-value text-2xl", data.replyRate > 5 ? "text-green-500" : "text-yellow-500")}>{data.replyRate}%</div>
                                    <div className="stat-desc text-green-500">Good</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Domain Health */}
            <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="h-5 w-5 text-blue-500" />
                        Domain Health
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {data.domainHealth.map((domain, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                            <div className="flex items-center gap-3">
                                <Server className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{domain.domain}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <DnsCheck label="SPF" passed={domain.spf} />
                                <DnsCheck label="DKIM" passed={domain.dkim} />
                                <DnsCheck label="DMARC" passed={domain.dmarc} />
                                <div className="w-px h-6 bg-border mx-2" />
                                {domain.blacklisted ? (
                                    <Badge variant="destructive" className="gap-1">
                                        <XCircle className="h-3 w-3" /> Blacklisted
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-500 border-green-500/20">
                                        <CheckCircle2 className="h-3 w-3" /> Clean
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Recent Issues */}
            <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Recent Issues
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.recentIssues.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p>No issues detected</p>
                        </div>
                    ) : (
                        data.recentIssues.map((issue, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "alert shadow-sm border border-[#2a2a2a] py-3",
                                    issue.type === "error" && "alert-error bg-red-500/10 text-red-500",
                                    issue.type === "warning" && "alert-warning bg-yellow-500/10 text-yellow-500",
                                    issue.type === "info" && "alert-info bg-blue-500/10 text-blue-500"
                                )}
                            >
                                {issue.type === "error" && <XCircle className="h-5 w-5" />}
                                {issue.type === "warning" && <AlertTriangle className="h-5 w-5" />}
                                {issue.type === "info" && <CheckCircle2 className="h-5 w-5" />}
                                <div className="flex-1">
                                    <p className="text-sm font-bold">{issue.message}</p>
                                    <p className="text-[10px] opacity-70 mt-0.5">{issue.timestamp}</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function MetricCard({ label, value, trend, good }: { label: string; value: string; trend: "up" | "down"; good: boolean }) {
    return (
        <div className="p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                {trend === "up" ? (
                    <TrendingUp className={cn("h-4 w-4", good ? "text-green-500" : "text-red-500")} />
                ) : (
                    <TrendingDown className={cn("h-4 w-4", good ? "text-green-500" : "text-red-500")} />
                )}
            </div>
            <div className={cn("text-2xl font-bold", good ? "text-green-500" : "text-yellow-500")}>
                {value}
            </div>
        </div>
    )
}

function DnsCheck({ label, passed }: { label: string; passed: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
            passed ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
            {passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {label}
        </div>
    )
}
