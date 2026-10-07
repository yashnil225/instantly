"use client"

import { useState } from "react"
import { useNotifications, Notification } from "@/components/app/notifications"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Bell, 
    MessageSquare, 
    AlertTriangle, 
    CheckCircle2, 
    Mail, 
    CheckCheck,
    ArrowUpRight,
    Inbox
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    const [filter, setFilter] = useState<"all" | "unread">("all")

    const filtered = filter === "all" ? notifications : notifications.filter(n => !n.read)

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "reply":
                return <MessageSquare className="h-5 w-5 text-emerald-400" />
            case "bounce":
                return <AlertTriangle className="h-5 w-5 text-rose-400" />
            case "campaign":
                return <CheckCircle2 className="h-5 w-5 text-blue-400" />
            case "warmup":
                return <Mail className="h-5 w-5 text-amber-400" />
            default:
                return <Bell className="h-5 w-5 text-zinc-400" />
        }
    }

    const formatTime = (date: Date) => {
        const now = new Date()
        const diffMs = now.getTime() - new Date(date).getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-zinc-200" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-white">Notifications</h1>
                            {unreadCount > 0 && (
                                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30">
                                    {unreadCount} unread
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-zinc-400">Stay updated on your campaign replies, bounces, and deliverability</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                        >
                            <CheckCheck className="h-4 w-4 mr-1.5" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mt-6 mb-4">
                <button
                    onClick={() => setFilter("all")}
                    className={cn(
                        "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                        filter === "all"
                            ? "bg-zinc-800 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    )}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter("unread")}
                    className={cn(
                        "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                        filter === "unread"
                            ? "bg-zinc-800 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    )}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-2.5 mt-4">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
                        <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                            <Inbox className="h-6 w-6 text-zinc-500" />
                        </div>
                        <h3 className="text-base font-semibold text-zinc-300">No notifications</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mt-1">
                            {filter === "unread" ? "You're all caught up! No unread notifications." : "You have no notifications yet. Activity will appear here."}
                        </p>
                    </div>
                ) : (
                    filtered.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => !item.read && markAsRead(item.id)}
                            className={cn(
                                "group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                item.read
                                    ? "bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700/60 text-zinc-400"
                                    : "bg-zinc-900/80 border-blue-500/20 hover:border-blue-500/40 shadow-sm text-zinc-200"
                            )}
                        >
                            <div className="mt-0.5 p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/40 shrink-0">
                                {getIcon(item.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn("text-sm font-semibold truncate", !item.read ? "text-zinc-100" : "text-zinc-300")}>
                                            {item.title}
                                        </h4>
                                        {!item.read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                        )}
                                    </div>
                                    <span className="text-xs text-zinc-500 shrink-0">
                                        {formatTime(item.timestamp)}
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                    {item.message}
                                </p>

                                {item.actionUrl && (
                                    <div className="mt-2.5">
                                        <Link
                                            href={item.actionUrl}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!item.read) markAsRead(item.id)
                                            }}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            View details
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
