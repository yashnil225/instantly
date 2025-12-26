// Simple in-memory storage for campaign-workspace associations
// In production, this would be in a database

interface CampaignWorkspace {
    campaignId: string
    workspaceIds: string[]
}

// Storage
const campaignWorkspaces: CampaignWorkspace[] = []

export function addCampaignToWorkspaces(campaignId: string, workspaceIds: string[]) {
    const existing = campaignWorkspaces.find(cw => cw.campaignId === campaignId)
    if (existing) {
        existing.workspaceIds = [...new Set([...existing.workspaceIds, ...workspaceIds])]
    } else {
        campaignWorkspaces.push({ campaignId, workspaceIds })
    }
}

export function getCampaignWorkspaces(campaignId: string): string[] {
    const found = campaignWorkspaces.find(cw => cw.campaignId === campaignId)
    return found ? found.workspaceIds : []
}

export function getWorkspaceCampaigns(workspaceId: string): string[] {
    // "all" workspace shows all campaigns
    if (workspaceId === "all") {
        return campaignWorkspaces.map(cw => cw.campaignId)
    }

    return campaignWorkspaces
        .filter(cw => cw.workspaceIds.includes(workspaceId))
        .map(cw => cw.campaignId)
}

export function removeCampaignFromWorkspace(campaignId: string, workspaceId: string) {
    const found = campaignWorkspaces.find(cw => cw.campaignId === campaignId)
    if (found) {
        found.workspaceIds = found.workspaceIds.filter(id => id !== workspaceId)
    }
}
