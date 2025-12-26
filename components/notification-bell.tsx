"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link?: string
    read: boolean
    createdAt: string
}

const NOTIFICATION_ICONS: Record<string, string> = {
    reply_received: "💬",
    campaign_completed: "🎉",
    account_error: "⚠️",
    warmup_milestone: "🔥",
    bounce_alert: "📭",
    limit_warning: "⏰",
    new_lead: "👤",
    team_invite: "👥",
    system: "ℹ️"
}

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?limit=10")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    // Mark as read
    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "POST" })
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Failed to mark as read:", error)
        }
    }

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications/mark-all-read", { method: "POST" })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to mark all as read:", error)
        }
    }

    // Handle notification click
    const handleClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id)
        }
        if (notification.link) {
            router.push(notification.link)
            setOpen(false)
        }
    }

    // Format time ago
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0 bg-[#1a1a1a] border-[#2a2a2a] text-white shadow-xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-400 hover:text-blue-300 h-auto p-1"
                            onClick={markAllAsRead}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                            <p className="text-gray-500 text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleClick(notification)}
                                className={cn(
                                    "flex gap-3 px-4 py-3 border-b border-[#2a2a2a] cursor-pointer transition-colors hover:bg-[#252525]",
                                    !notification.read && "bg-blue-500/5"
                                )}
                            >
                                <span className="text-lg mt-0.5">
                                    {NOTIFICATION_ICONS[notification.type] || "📌"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn(
                                            "text-sm font-medium truncate",
                                            !notification.read ? "text-white" : "text-gray-300"
                                        )}>
                                            {notification.title}
                                        </p>
                                        {!notification.read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-gray-600">
                                            {timeAgo(notification.createdAt)}
                                        </span>
                                        {notification.link && (
                                            <ExternalLink className="h-3 w-3 text-gray-600" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-2 border-t border-[#2a2a2a]">
                        <Button
                            variant="ghost"
                            className="w-full text-xs text-gray-400 hover:text-white"
                            onClick={() => {
                                router.push("/notifications")
                                setOpen(false)
                            }}
                        >
                            View all notifications
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
