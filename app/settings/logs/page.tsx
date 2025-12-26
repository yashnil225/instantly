"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Download, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AuditLog {
    id: string
    timestamp: string
    type: string
    ip: string
    campaign: string
    list: string
}

const activityTypes = [
    { value: "all", label: "All activity types" },
    { value: "login", label: "Login" },
    { value: "account_delete", label: "Account delete" },
    { value: "campaign_delete", label: "Campaign delete" },
    { value: "campaign_launch", label: "Campaign launch" },
    { value: "account_created", label: "Account created" }
]

export default function AuditLogsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [activityType, setActivityType] = useState("all")
    const limit = 25

    useEffect(() => {
        fetchLogs()
    }, [page, activityType])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                type: activityType
            })
            const res = await fetch(`/api/logs?${params}`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.logs || [])
                setTotal(data.total || 0)
                setTotalPages(data.totalPages || 1)
            }
        } catch (error) {
            console.error("Failed to fetch logs", error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        // Download logs as CSV
        const csvContent = [
            ["Timestamp", "Activity Type", "IP Address", "Campaign ID", "List ID"],
            ...logs.map(log => [log.timestamp, log.type, log.ip, log.campaign, log.list])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast({ title: "Exported", description: "Audit logs exported to CSV" })
    }

    return (
        <div className="max-w-6xl space-y-4">
            <div className="flex items-center justify-between">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-[#1a1a1a] border-[#333] text-gray-300 hover:text-white hover:bg-[#2a2a2a] gap-2 h-9 text-sm">
                            <span className="p-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></span>
                            {activityTypes.find(t => t.value === activityType)?.label} <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white">
                        {activityTypes.map(type => (
                            <DropdownMenuItem
                                key={type.value}
                                onClick={() => { setActivityType(type.value); setPage(1) }}
                                className={activityType === type.value ? "bg-blue-500/20 text-blue-400" : ""}
                            >
                                {type.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="outline"
                    className="bg-[#1a1a1a] border-[#333] text-gray-300 hover:text-white hover:bg-[#2a2a2a] gap-2 h-9 text-sm"
                    onClick={handleExport}
                >
                    <Download className="h-3 w-3" /> Export
                </Button>
            </div>

            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
                <div className="grid grid-cols-[180px,150px,150px,1fr,100px] bg-[#111] border-b border-[#2a2a2a] py-3 px-4">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TIMESTAMP</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ACTIVITY TYPE</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">IP ADDRESS</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CAMPAIGN ID</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">LIST ID</div>
                </div>

                {loading ? (
                    <div className="bg-[#0a0a0a] py-12 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="bg-[#0a0a0a] py-12 text-center text-gray-500">
                        No audit logs found
                    </div>
                ) : (
                    <div className="divide-y divide-[#2a2a2a] bg-[#0a0a0a]">
                        {logs.map((log) => (
                            <div key={log.id} className="grid grid-cols-[180px,150px,150px,1fr,100px] py-3 px-4 hover:bg-[#111] transition-colors">
                                <div className="text-xs text-gray-300 font-mono">{log.timestamp}</div>
                                <div className="text-xs text-white font-medium">{log.type}</div>
                                <div className="text-xs text-gray-400 font-mono">{log.ip}</div>
                                <div className="text-xs text-gray-500 truncate pr-4">{log.campaign}</div>
                                <div className="text-xs text-gray-500">{log.list}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                <div>Showing {logs.length} of {total} logs</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="disabled:opacity-50 hover:text-white px-2 py-1"
                    >
                        &lt;
                    </button>
                    <span className="text-gray-400">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="disabled:opacity-50 hover:text-white px-2 py-1"
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    )
}
