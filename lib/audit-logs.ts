/**
 * Activity Audit Logs
 * Track all user actions for security and debugging
 */

import { prisma } from './prisma'

export interface AuditLog {
    id: string
    userId: string
    action: AuditAction
    resource: string
    resourceId?: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    createdAt: Date
}

export type AuditAction =
    // Authentication
    | "login"
    | "logout"
    | "password_change"
    | "2fa_enabled"
    | "2fa_disabled"
    | "api_key_created"
    | "api_key_revoked"
    // Accounts
    | "account_created"
    | "account_updated"
    | "account_deleted"
    | "account_connected"
    | "account_disconnected"
    // Campaigns
    | "campaign_created"
    | "campaign_updated"
    | "campaign_deleted"
    | "campaign_launched"
    | "campaign_paused"
    // Leads
    | "leads_imported"
    | "leads_exported"
    | "leads_deleted"
    // Workspace
    | "workspace_created"
    | "workspace_updated"
    | "member_invited"
    | "member_removed"
    | "role_changed"
    // Settings
    | "settings_updated"
    // Other
    | "export_data"
    | "bulk_action"

interface LogOptions {
    userId: string
    action: AuditAction
    resource: string
    resourceId?: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function logActivity(options: LogOptions): Promise<AuditLog> {
    const log = await prisma.auditLog.create({
        data: {
            userId: options.userId,
            action: options.action,
            resource: options.resource,
            resourceId: options.resourceId,
            details: options.details ? JSON.stringify(options.details) : null,
            ipAddress: options.ipAddress,
            userAgent: options.userAgent
        }
    })

    return {
        id: log.id,
        userId: log.userId,
        action: log.action as AuditAction,
        resource: log.resource,
        resourceId: log.resourceId || undefined,
        details: log.details ? JSON.parse(log.details) : undefined,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        createdAt: log.createdAt
    }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
    userId: string,
    options: {
        limit?: number
        offset?: number
        action?: AuditAction
        resource?: string
        startDate?: Date
        endDate?: Date
    } = {}
): Promise<{ logs: AuditLog[]; total: number }> {
    const { limit = 50, offset = 0, action, resource, startDate, endDate } = options

    const where: any = { userId }
    if (action) where.action = action
    if (resource) where.resource = resource
    if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset
        }),
        prisma.auditLog.count({ where })
    ])

    return {
        logs: logs.map(log => ({
            id: log.id,
            userId: log.userId,
            action: log.action as AuditAction,
            resource: log.resource,
            resourceId: log.resourceId || undefined,
            details: log.details ? JSON.parse(log.details) : undefined,
            ipAddress: log.ipAddress || undefined,
            userAgent: log.userAgent || undefined,
            createdAt: log.createdAt
        })),
        total
    }
}

/**
 * Get audit logs for admin view (all users)
 */
export async function getAdminAuditLogs(
    options: {
        limit?: number
        offset?: number
        userId?: string
        action?: AuditAction
        startDate?: Date
        endDate?: Date
    } = {}
): Promise<{ logs: AuditLog[]; total: number }> {
    const { limit = 100, offset = 0, userId, action, startDate, endDate } = options

    const where: any = {}
    if (userId) where.userId = userId
    if (action) where.action = action
    if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            include: { user: { select: { email: true, name: true } } }
        }),
        prisma.auditLog.count({ where })
    ])

    return {
        logs: logs.map(log => ({
            id: log.id,
            userId: log.userId,
            action: log.action as AuditAction,
            resource: log.resource,
            resourceId: log.resourceId || undefined,
            details: log.details ? JSON.parse(log.details) : undefined,
            ipAddress: log.ipAddress || undefined,
            userAgent: log.userAgent || undefined,
            createdAt: log.createdAt
        })),
        total
    }
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): string {
    const headers = ["Timestamp", "User ID", "Action", "Resource", "Resource ID", "IP Address", "Details"]
    const rows = logs.map(log => [
        log.createdAt.toISOString(),
        log.userId,
        log.action,
        log.resource,
        log.resourceId || "",
        log.ipAddress || "",
        log.details ? JSON.stringify(log.details) : ""
    ])

    return [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n")
}

/**
 * Clean up old audit logs
 */
export async function cleanupOldAuditLogs(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } }
    })

    return result.count
}

/**
 * Get action display info
 */
export function getActionDisplay(action: AuditAction): { label: string; color: string; icon: string } {
    const displays: Record<AuditAction, { label: string; color: string; icon: string }> = {
        login: { label: "Login", color: "green", icon: "🔓" },
        logout: { label: "Logout", color: "gray", icon: "🔒" },
        password_change: { label: "Password Changed", color: "yellow", icon: "🔑" },
        "2fa_enabled": { label: "2FA Enabled", color: "green", icon: "🛡️" },
        "2fa_disabled": { label: "2FA Disabled", color: "red", icon: "⚠️" },
        api_key_created: { label: "API Key Created", color: "blue", icon: "🔑" },
        api_key_revoked: { label: "API Key Revoked", color: "red", icon: "🚫" },
        account_created: { label: "Account Added", color: "green", icon: "📧" },
        account_updated: { label: "Account Updated", color: "blue", icon: "✏️" },
        account_deleted: { label: "Account Removed", color: "red", icon: "🗑️" },
        account_connected: { label: "Account Connected", color: "green", icon: "✅" },
        account_disconnected: { label: "Account Disconnected", color: "yellow", icon: "❌" },
        campaign_created: { label: "Campaign Created", color: "green", icon: "📊" },
        campaign_updated: { label: "Campaign Updated", color: "blue", icon: "✏️" },
        campaign_deleted: { label: "Campaign Deleted", color: "red", icon: "🗑️" },
        campaign_launched: { label: "Campaign Launched", color: "green", icon: "🚀" },
        campaign_paused: { label: "Campaign Paused", color: "yellow", icon: "⏸️" },
        leads_imported: { label: "Leads Imported", color: "green", icon: "📥" },
        leads_exported: { label: "Leads Exported", color: "blue", icon: "📤" },
        leads_deleted: { label: "Leads Deleted", color: "red", icon: "🗑️" },
        workspace_created: { label: "Workspace Created", color: "green", icon: "🏢" },
        workspace_updated: { label: "Workspace Updated", color: "blue", icon: "✏️" },
        member_invited: { label: "Member Invited", color: "blue", icon: "👤" },
        member_removed: { label: "Member Removed", color: "red", icon: "👤" },
        role_changed: { label: "Role Changed", color: "yellow", icon: "🔄" },
        settings_updated: { label: "Settings Updated", color: "blue", icon: "⚙️" },
        export_data: { label: "Data Exported", color: "blue", icon: "📤" },
        bulk_action: { label: "Bulk Action", color: "purple", icon: "📦" }
    }

    return displays[action] || { label: action, color: "gray", icon: "📝" }
}
