/**
 * Real-time Notification System
 * In-app notifications with WebSocket support (optional)
 */

import { prisma } from './prisma'

export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
    read: boolean
    createdAt: Date
    metadata?: Record<string, any>
}

export type NotificationType =
    | "reply_received"
    | "campaign_completed"
    | "account_error"
    | "warmup_milestone"
    | "bounce_alert"
    | "limit_warning"
    | "new_lead"
    | "team_invite"
    | "system"

interface CreateNotificationOptions {
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
    metadata?: Record<string, any>
}

// Notification templates
const NOTIFICATION_TEMPLATES: Record<NotificationType, { icon: string; color: string }> = {
    reply_received: { icon: "💬", color: "blue" },
    campaign_completed: { icon: "🎉", color: "green" },
    account_error: { icon: "⚠️", color: "red" },
    warmup_milestone: { icon: "🔥", color: "orange" },
    bounce_alert: { icon: "📭", color: "yellow" },
    limit_warning: { icon: "⏰", color: "yellow" },
    new_lead: { icon: "👤", color: "purple" },
    team_invite: { icon: "👥", color: "blue" },
    system: { icon: "ℹ️", color: "gray" }
}

/**
 * Create a new notification
 */
export async function createNotification(options: CreateNotificationOptions): Promise<Notification> {
    const notification = await prisma.notification.create({
        data: {
            userId: options.userId,
            type: options.type,
            title: options.title,
            message: options.message,
            link: options.link,
            metadata: options.metadata ? JSON.stringify(options.metadata) : null,
            read: false
        }
    })

    // In a real app, emit via WebSocket here
    // socketServer.to(options.userId).emit('notification', notification)

    return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        link: notification.link || undefined,
        read: notification.read,
        createdAt: notification.createdAt,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : undefined
    }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const { unreadOnly = false, limit = 20, offset = 0 } = options

    const where: any = { userId }
    if (unreadOnly) {
        where.read = false
    }

    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset
        }),
        prisma.notification.count({
            where: { userId, read: false }
        })
    ])

    return {
        notifications: notifications.map(n => ({
            id: n.id,
            userId: n.userId,
            type: n.type as NotificationType,
            title: n.title,
            message: n.message,
            link: n.link || undefined,
            read: n.read,
            createdAt: n.createdAt,
            metadata: n.metadata ? JSON.parse(n.metadata) : undefined
        })),
        unreadCount
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    })
    return result.count
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    await prisma.notification.delete({
        where: { id: notificationId }
    })
}

/**
 * Delete old notifications (cleanup job)
 */
export async function cleanupOldNotifications(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await prisma.notification.deleteMany({
        where: {
            createdAt: { lt: cutoffDate },
            read: true
        }
    })
    return result.count
}

/**
 * Get notification icon and color
 */
export function getNotificationStyle(type: NotificationType): { icon: string; color: string } {
    return NOTIFICATION_TEMPLATES[type] || NOTIFICATION_TEMPLATES.system
}

// ========================================
// Helper functions for common notifications
// ========================================

/**
 * Notify user of new reply
 */
export async function notifyNewReply(userId: string, leadEmail: string, campaignName: string): Promise<void> {
    await createNotification({
        userId,
        type: "reply_received",
        title: "New Reply Received",
        message: `${leadEmail} replied to your email in "${campaignName}"`,
        link: "/unibox",
        metadata: { leadEmail, campaignName }
    })
}

/**
 * Notify user of campaign completion
 */
export async function notifyCampaignComplete(userId: string, campaignName: string, stats: { sent: number; opened: number; replied: number }): Promise<void> {
    await createNotification({
        userId,
        type: "campaign_completed",
        title: "Campaign Completed",
        message: `"${campaignName}" has finished: ${stats.sent} sent, ${stats.opened} opened, ${stats.replied} replied`,
        link: "/campaigns",
        metadata: { campaignName, ...stats }
    })
}

/**
 * Notify user of account error
 */
export async function notifyAccountError(userId: string, email: string, error: string): Promise<void> {
    await createNotification({
        userId,
        type: "account_error",
        title: "Email Account Issue",
        message: `${email} encountered an error: ${error}`,
        link: "/accounts",
        metadata: { email, error }
    })
}

/**
 * Notify user of warmup milestone
 */
export async function notifyWarmupMilestone(userId: string, email: string, milestone: string): Promise<void> {
    await createNotification({
        userId,
        type: "warmup_milestone",
        title: "Warmup Milestone",
        message: `${email} reached: ${milestone}`,
        link: "/accounts",
        metadata: { email, milestone }
    })
}

/**
 * Notify user of daily limit approaching
 */
export async function notifyLimitWarning(userId: string, email: string, used: number, limit: number): Promise<void> {
    const percentage = Math.round((used / limit) * 100)
    await createNotification({
        userId,
        type: "limit_warning",
        title: "Daily Limit Warning",
        message: `${email} has used ${percentage}% of daily sending limit (${used}/${limit})`,
        link: "/accounts",
        metadata: { email, used, limit, percentage }
    })
}
