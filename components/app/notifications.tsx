"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Bell,
    Mail,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    X,
    Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

// Notification types
export interface Notification {
    id: string
    type: "reply" | "bounce" | "campaign" | "warmup" | "system"
    title: string
    message: string
    read: boolean
    timestamp: Date
    actionUrl?: string
}

// Create context for notifications
interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error("useNotifications must be used within NotificationProvider")
    }
    return context
}

// Sample notifications for demo
const SAMPLE_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        type: "reply",
        title: "New Reply",
        message: "John from Acme Corp replied to your email",
        read: false,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        actionUrl: "/unibox"
    },
    {
        id: "2",
        type: "campaign",
        title: "Campaign Completed",
        message: "Q4 Outreach campaign finished sending",
        read: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        actionUrl: "/campaigns"
    },
    {
        id: "3",
        type: "warmup",
        title: "Warmup Update",
        message: "3 accounts reached 80% health score",
        read: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
        id: "4",
        type: "bounce",
        title: "Bounce Detected",
        message: "5 emails bounced in Campaign A",
        read: true,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actionUrl: "/analytics"
    }
]

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS)

    const unreadCount = notifications.filter(n => !n.read).length

    const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
        }
        setNotifications(prev => [newNotification, ...prev])
    }

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const clearAll = () => {
        setNotifications([])
    }

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "reply": return <MessageSquare className="h-4 w-4 text-green-500" />
            case "bounce": return <AlertTriangle className="h-4 w-4 text-red-500" />
            case "campaign": return <CheckCircle2 className="h-4 w-4 text-blue-500" />
            case "warmup": return <Mail className="h-4 w-4 text-orange-500" />
            default: return <Bell className="h-4 w-4 text-muted-foreground" />
        }
    }

    const formatTime = (date: Date) => {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold border-2 border-background"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 bg-card border-border p-0 max-h-[400px] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border">
                    <span className="font-semibold text-sm">Notifications</span>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-blue-500 hover:text-blue-400"
                                onClick={markAllAsRead}
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto max-h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "flex items-start gap-3 p-3 hover:bg-secondary/50 cursor-pointer transition-colors border-b border-border/50",
                                    !notification.read && "bg-blue-500/5"
                                )}
                                onClick={() => {
                                    markAsRead(notification.id)
                                    if (notification.actionUrl) {
                                        window.location.href = notification.actionUrl
                                    }
                                }}
                            >
                                <div className="mt-0.5">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{notification.title}</span>
                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {notification.message}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {formatTime(notification.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="bg-border" />
                        <div className="p-2 flex justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={clearAll}
                            >
                                Clear all
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-foreground gap-1"
                            >
                                <Settings className="h-3 w-3" />
                                Settings
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
