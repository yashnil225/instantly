"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, RefreshCw, CheckCircle2, AlertCircle, Clock, X, Globe, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"

interface Webhook {
    id: string
    name: string | null
    url: string
    isActive: boolean
    createdAt: string
}

interface WebhookLog {
    id: string
    webhookId: string
    event: string
    payload: string
    status: number | null
    isSuccess: boolean
    duration: number | null
    createdAt: string
    webhook: {
        name: string | null
        url: string
    }
}

export function WebhooksSection() {
    const [activeTab, setActiveTab] = useState("activity")
    const [webhooks, setWebhooks] = useState<Webhook[]>([])
    const [logs, setLogs] = useState<WebhookLog[]>([])
    const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, successRate: "0.0%" })
    const [isLoading, setIsLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newWebhook, setNewWebhook] = useState({ name: "", url: "" })
    const { toast } = useToast()

    const fetchWebhooks = async () => {
        try {
            const res = await fetch("/api/user/webhooks")
            const data = await res.json()
            setWebhooks(data)
        } catch (error) {
            console.error("Failed to fetch webhooks")
        }
    }

    const fetchActivity = async () => {
        try {
            const res = await fetch("/api/user/webhooks/activity")
            const data = await res.json()
            setLogs(data.logs)
            setStats(data.stats)
        } catch (error) {
            console.error("Failed to fetch activity")
        }
    }

    useEffect(() => {
        const init = async () => {
            setIsLoading(true)
            await Promise.all([fetchWebhooks(), fetchActivity()])
            setIsLoading(false)
        }
        init()
    }, [])

    const handleAddWebhook = async () => {
        if (!newWebhook.url) return
        try {
            const res = await fetch("/api/user/webhooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newWebhook)
            })
            if (res.ok) {
                const created = await res.json()
                setWebhooks([created, ...webhooks])
                setIsAddModalOpen(false)
                setNewWebhook({ name: "", url: "" })
                toast({ title: "Success", description: "Webhook added successfully" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to add webhook", variant: "destructive" })
        }
    }

    return (
        <div className="space-y-8">
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-[#1a1a1a]">
                <button
                    onClick={() => setActiveTab("config")}
                    className={cn(
                        "pb-4 text-sm font-medium transition-all relative",
                        activeTab === "config" ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    Webhooks
                    {activeTab === "config" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
                <button
                    onClick={() => setActiveTab("activity")}
                    className={cn(
                        "pb-4 text-sm font-medium transition-all relative",
                        activeTab === "activity" ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    Activity
                    {activeTab === "activity" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
            </div>

            {activeTab === "activity" ? (
                <div className="space-y-8">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Events', value: stats.total.toString(), color: 'bg-blue-500' },
                            { label: 'Success Rate', value: stats.successRate, color: 'bg-gray-500' },
                            { label: 'Successful Events', value: stats.successful.toString(), color: 'bg-green-500' },
                            { label: 'Failed Events', value: stats.failed.toString(), color: 'bg-red-500' }
                        ].map((stat) => (
                            <div key={stat.label} className="p-6 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={cn("h-1.5 w-3 rounded-full", stat.color)} />
                                    <span className="text-[12px] text-gray-400 font-medium uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <div className="text-3xl font-bold text-white font-mono">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" className="bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 border-blue-500/20 px-4">
                                All
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white flex items-center gap-2 border border-[#1a1a1a]">
                                <CheckCircle2 className="h-4 w-4" /> Successful
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white flex items-center gap-2 border border-[#1a1a1a]">
                                <AlertCircle className="h-4 w-4" /> Failed
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white flex items-center gap-2 border border-[#1a1a1a]">
                                <RefreshCw className="h-4 w-4" /> Refresh
                            </Button>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search by webhook URL or lead email"
                                className="pl-10 bg-transparent border-[#1a1a1a] text-sm h-10 w-full focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    {/* Recent Events List */}
                    <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center">
                            <h3 className="text-white font-medium">Recent Webhook Events</h3>
                            <button onClick={fetchActivity} className="text-gray-500 hover:text-white transition-colors">
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>
                        {logs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#080808] text-gray-500 uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Event</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Webhook</th>
                                            <th className="px-4 py-3 font-medium">Duration</th>
                                            <th className="px-4 py-3 font-medium">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1a1a1a]">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-[#111] transition-colors group">
                                                <td className="px-4 py-4">
                                                    <span className="text-blue-400 font-mono text-xs">{log.event}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {log.isSuccess ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                                        )}
                                                        <span className={cn(
                                                            "font-mono",
                                                            log.isSuccess ? "text-green-500" : "text-red-500"
                                                        )}>
                                                            {log.status || "FAIL"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="max-w-[200px] truncate">
                                                        <p className="text-white text-xs truncate">{log.webhook.name || "Untitled"}</p>
                                                        <p className="text-gray-500 text-[10px] truncate">{log.webhook.url}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-gray-400 font-mono text-xs">
                                                    {log.duration ? `${log.duration}ms` : "-"}
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 text-xs">
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-20 text-center space-y-4">
                                <div className="flex justify-center">
                                    <Clock className="h-10 w-10 text-gray-700" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white font-medium">No webhook events found</p>
                                    <p className="text-gray-500 text-sm">Your webhook activities will show here once events are triggered.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-400">Manage your webhook endpoints to receive real-time notifications.</p>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Webhook
                        </Button>
                    </div>

                    {webhooks.length > 0 ? (
                        <div className="space-y-3">
                            {webhooks.map((webhook) => (
                                <div key={webhook.id} className="flex items-center justify-between p-4 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg group transition-all hover:border-[#333]">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{webhook.name || "Untitled Webhook"}</p>
                                            <p className="text-xs text-gray-500 font-mono truncate max-w-[300px]">{webhook.url}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-2 w-2 rounded-full", webhook.isActive ? "bg-green-500" : "bg-gray-500")} />
                                            <span className="text-gray-400 capitalize">{webhook.isActive ? "Active" : "Inactive"}</span>
                                        </div>
                                        <span className="text-gray-500 hidden md:block">
                                            Added {new Date(webhook.createdAt).toLocaleDateString()}
                                        </span>
                                        <button className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg p-20 text-center space-y-4">
                            <div className="flex justify-center">
                                <Globe className="h-10 w-10 text-gray-700" />
                            </div>
                            <p className="text-gray-500 text-sm">No webhooks configured yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Webhook Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-[#0f0f0f] border border-[#222] rounded-xl w-full max-w-lg p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-500" />
                                <h2 className="text-xl font-semibold text-white">Add Webhook</h2>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Webhook Name</label>
                                <Input
                                    placeholder="Enter a descriptive name"
                                    className="bg-[#0c0c0c] border-[#222] text-sm h-11"
                                    value={newWebhook.name}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Webhook URL</label>
                                <Input
                                    placeholder="https://your-server.com/webhook"
                                    className="bg-[#0c0c0c] border-[#222] text-sm h-11 font-mono"
                                    value={newWebhook.url}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                />
                                <p className="text-[11px] text-gray-500">We will send POST requests to this URL with event data.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 text-white hover:bg-[#1a1a1a] h-11"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddWebhook}
                                disabled={!newWebhook.url}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11"
                            >
                                Add Webhook
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
