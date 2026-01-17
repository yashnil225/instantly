"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link?: string
    read: boolean
    createdAt: string
}

export function NotificationManager() {
    const { toast } = useToast()
    const router = useRouter()
    // Track IDs we've already shown to avoid duplicates
    // We use a ref so it persists across renders without triggering effects
    const viewedIds = useRef<Set<string>>(new Set())
    const [isFirstLoad, setIsFirstLoad] = useState(true)

    const fetchNotifications = async () => {
        try {
            // Fetch unread notifications
            const res = await fetch("/api/notifications?unreadOnly=true&limit=10")
            if (res.ok) {
                const data = await res.json()
                const notifications: Notification[] = data.notifications || []

                // Filter out notifications we've already seen this session
                const newNotifications = notifications.filter(n => !viewedIds.current.has(n.id))

                if (newNotifications.length > 0) {
                    // Update viewed IDs
                    newNotifications.forEach(n => viewedIds.current.add(n.id))

                    if (isFirstLoad) {
                        // On first load, show max 3 most recent to avoid spam
                        const mostRecent = newNotifications.slice(0, 3)
                        mostRecent.forEach(n => showNotificationToast(n))
                        setIsFirstLoad(false)
                    } else {
                        // In real-time, show all new ones
                        newNotifications.forEach(n => showNotificationToast(n))
                    }
                } else if (isFirstLoad) {
                    // Even if no notifications, mark first load as done
                    setIsFirstLoad(false)
                }
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        }
    }

    const showNotificationToast = (notification: Notification) => {
        toast({
            title: notification.title,
            description: notification.message,
            action: (
                <div
                    className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center cursor-pointer hover:bg-blue-500/30 transition-colors"
                    onClick={() => {
                        if (notification.link) {
                            router.push(notification.link)
                        }
                        // Optionally mark as read when clicked
                        markAsRead(notification.id)
                    }}
                >
                    <Bell className="h-4 w-4 text-blue-500" />
                </div>
            ),
        })
    }

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "POST" })
        } catch (error) {
            console.error("Failed to mark notification as read", error)
        }
    }

    useEffect(() => {
        // Initial fetch
        fetchNotifications()

        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    // Render nothing, this is a logic-only component
    return null
}
