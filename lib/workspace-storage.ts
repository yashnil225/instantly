// Unified workspace storage utility
// Provides consistent workspace selection across all pages

const STORAGE_KEYS = {
  SELECTED_WORKSPACE_ID: 'selectedWorkspaceId',
  MIGRATION_FLAG: '__workspace_storage_migrated__',
  // Legacy keys for migration
  LEGACY_WORKSPACE_ID: 'activeWorkspaceId',
  LEGACY_WORKSPACE_NAME: 'activeWorkspace'
} as const

/**
 * Get the currently selected workspace ID from storage
 * @returns workspace ID or null for "My Organization" (show all)
 */
export const getSelectedWorkspaceId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.SELECTED_WORKSPACE_ID)
}

/**
 * Set the selected workspace ID in storage
 * @param id - workspace ID or null for "My Organization"
 */
export const setSelectedWorkspaceId = (id: string | null): void => {
  if (typeof window === 'undefined') return
  
  if (id) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_WORKSPACE_ID, id)
  } else {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_WORKSPACE_ID)
  }
  
  // Dispatch custom event for cross-tab sync
  window.dispatchEvent(new CustomEvent('workspaceChanged', { detail: { workspaceId: id } }))
}

/**
 * Migrate from old storage format to new unified format
 * Call this once on app initialization
 * @param workspaces - array of available workspaces for lookup
 * @returns the migrated workspace ID or null
 */
export const migrateWorkspaceStorage = (workspaces: any[]): string | null => {
  if (typeof window === 'undefined') return null
  
  // Check if already migrated
  if (localStorage.getItem(STORAGE_KEYS.MIGRATION_FLAG)) {
    return getSelectedWorkspaceId()
  }
  
  console.log('[WorkspaceStorage] Starting migration from legacy format...')
  
  let migratedId: string | null = null
  
  // Try to get from old ID-based storage (Campaigns page)
  const oldId = localStorage.getItem(STORAGE_KEYS.LEGACY_WORKSPACE_ID)
  if (oldId && workspaces.find(w => w.id === oldId)) {
    migratedId = oldId
    console.log(`[WorkspaceStorage] Migrated from legacy ID: ${oldId}`)
  }
  
  // If not found, try to get from old name-based storage (Leads/Analytics pages)
  if (!migratedId) {
    const oldName = localStorage.getItem(STORAGE_KEYS.LEGACY_WORKSPACE_NAME)
    if (oldName && oldName !== 'My Organization') {
      const workspace = workspaces.find(w => w.name === oldName)
      if (workspace) {
        migratedId = workspace.id
        console.log(`[WorkspaceStorage] Migrated from legacy name "${oldName}" to ID: ${migratedId}`)
      }
    }
  }
  
  // Save migrated value
  if (migratedId) {
    setSelectedWorkspaceId(migratedId)
  }
  
  // Mark as migrated
  localStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, 'true')
  console.log('[WorkspaceStorage] Migration complete')
  
  return migratedId
}

/**
 * Clear all workspace storage (useful for logout)
 */
export const clearWorkspaceStorage = (): void => {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(STORAGE_KEYS.SELECTED_WORKSPACE_ID)
  localStorage.removeItem(STORAGE_KEYS.MIGRATION_FLAG)
  localStorage.removeItem(STORAGE_KEYS.LEGACY_WORKSPACE_ID)
  localStorage.removeItem(STORAGE_KEYS.LEGACY_WORKSPACE_NAME)
}

/**
 * Check if storage has been migrated
 */
export const isStorageMigrated = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEYS.MIGRATION_FLAG) === 'true'
}

/**
 * Get legacy workspace ID if exists (for debugging)
 */
export const getLegacyWorkspaceId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.LEGACY_WORKSPACE_ID)
}

/**
 * Get legacy workspace name if exists (for debugging)
 */
export const getLegacyWorkspaceName = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.LEGACY_WORKSPACE_NAME)
}

// Legacy in-memory storage functions (keeping for backward compatibility)
// These will be removed in future versions

interface CampaignWorkspace {
    campaignId: string
    workspaceIds: string[]
}

// In-memory storage (deprecated - use database instead)
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
