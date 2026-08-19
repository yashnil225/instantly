import { prisma } from "@/lib/prisma"

export type UserWorkspaceRole = "owner" | "admin" | "member" | null

/**
 * Get the highest role the user currently has in a given workspace.
 * Always queries real-time database state.
 * Returns: 'owner' | 'admin' | 'member' | null
 */
export async function getUserWorkspaceRole(
    userId: string,
    workspaceId: string
): Promise<UserWorkspaceRole> {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            members: {
                where: { userId }
            }
        }
    })

    if (!workspace) return null
    if (workspace.userId === userId) return "owner"

    const membership = workspace.members[0]
    if (!membership) return null

    return (membership.role as UserWorkspaceRole) || "member"
}

/**
 * Check if user can view a campaign in real-time.
 * If user was deleted from the workspace, access is immediately revoked.
 */
export async function canUserViewCampaign(
    userId: string,
    campaignId: string
): Promise<{ allowed: boolean; reason?: string }> {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            campaignWorkspaces: {
                include: {
                    workspace: {
                        include: {
                            members: {
                                where: { userId }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!campaign) {
        return { allowed: false, reason: "Campaign not found" }
    }

    // If campaign is in shared workspace(s)
    if (campaign.campaignWorkspaces.length > 0) {
        for (const cw of campaign.campaignWorkspaces) {
            const ws = cw.workspace
            // Workspace owner or active member in workspace
            if (ws.userId === userId || ws.members.length > 0) {
                return { allowed: true }
            }
        }
        return { 
            allowed: false, 
            reason: "Access revoked: you are no longer a member of this workspace." 
        }
    }

    // Unassigned campaign: creator only
    if (campaign.userId === userId) {
        return { allowed: true }
    }

    return { allowed: false, reason: "Unauthorized" }
}

/**
 * Check if user can edit/manage a campaign in real-time.
 * - If promoted to Admin/Owner -> immediately gains edit access.
 * - If demoted to Member -> immediately loses edit access (read-only).
 * - If removed from workspace -> immediately loses all access.
 */
export async function canUserEditCampaign(
    userId: string,
    campaignId: string
): Promise<{ allowed: boolean; reason?: string }> {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            campaignWorkspaces: {
                include: {
                    workspace: {
                        include: {
                            members: {
                                where: { userId }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!campaign) {
        return { allowed: false, reason: "Campaign not found" }
    }

    // If campaign belongs to workspace(s), current workspace role governs permissions
    if (campaign.campaignWorkspaces.length > 0) {
        let isMemberOfAny = false
        for (const cw of campaign.campaignWorkspaces) {
            const ws = cw.workspace
            // Workspace root owner
            if (ws.userId === userId) return { allowed: true }

            const mem = ws.members[0]
            if (mem) {
                isMemberOfAny = true
                if (mem.role === "owner" || mem.role === "admin") {
                    return { allowed: true }
                }
            }
        }

        if (isMemberOfAny) {
            return { 
                allowed: false, 
                reason: "Read-only access: members can view campaigns but only Admins and Owners can edit." 
            }
        }

        return { 
            allowed: false, 
            reason: "Access revoked: you are no longer a member of this workspace." 
        }
    }

    // Standalone campaign (not assigned to a workspace)
    if (campaign.userId === userId) {
        return { allowed: true }
    }

    return { allowed: false, reason: "Unauthorized" }
}

/**
 * Check if user can view an email account in real-time.
 */
export async function canUserViewAccount(
    userId: string,
    accountId: string
): Promise<{ allowed: boolean; reason?: string }> {
    const account = await prisma.emailAccount.findUnique({
        where: { id: accountId },
        include: {
            workspaces: {
                include: {
                    workspace: {
                        include: {
                            members: {
                                where: { userId }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!account) {
        return { allowed: false, reason: "Account not found" }
    }

    if (account.workspaces.length > 0) {
        for (const ew of account.workspaces) {
            const ws = ew.workspace
            if (ws.userId === userId || ws.members.length > 0) {
                return { allowed: true }
            }
        }
        return { 
            allowed: false, 
            reason: "Access revoked: you are no longer a member of this workspace." 
        }
    }

    if (account.userId === userId) {
        return { allowed: true }
    }

    return { allowed: false, reason: "Unauthorized" }
}

/**
 * Check if user can edit/manage an email account in real-time.
 * - If promoted to Admin/Owner -> immediately gains edit access.
 * - If demoted to Member -> immediately loses edit access.
 * - If removed from workspace -> immediately loses all access.
 */
export async function canUserEditAccount(
    userId: string,
    accountId: string
): Promise<{ allowed: boolean; reason?: string }> {
    const account = await prisma.emailAccount.findUnique({
        where: { id: accountId },
        include: {
            workspaces: {
                include: {
                    workspace: {
                        include: {
                            members: {
                                where: { userId }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!account) {
        return { allowed: false, reason: "Account not found" }
    }

    if (account.workspaces.length > 0) {
        let isMemberOfAny = false
        for (const ew of account.workspaces) {
            const ws = ew.workspace
            if (ws.userId === userId) return { allowed: true }
            const mem = ws.members[0]
            if (mem) {
                isMemberOfAny = true
                if (mem.role === "owner" || mem.role === "admin") {
                    return { allowed: true }
                }
            }
        }

        if (isMemberOfAny) {
            return { 
                allowed: false, 
                reason: "Read-only access: members can view email accounts but only Admins and Owners can edit." 
            }
        }

        return { 
            allowed: false, 
            reason: "Access revoked: you are no longer a member of this workspace." 
        }
    }

    if (account.userId === userId) {
        return { allowed: true }
    }

    return { allowed: false, reason: "Unauthorized" }
}
