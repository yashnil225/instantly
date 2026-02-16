'use client'

import { useEffect, useCallback } from 'react'
import { getSelectedWorkspaceId, setSelectedWorkspaceId } from '@/lib/workspace-storage'

/**
 * Hook to synchronize workspace selection across browser tabs
 * Usage: Call this in your component to listen for workspace changes from other tabs
 */
export function useWorkspaceSync(
  currentWorkspaceId: string | null,
  onWorkspaceChange: (workspaceId: string | null) => void
) {
  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedWorkspaceId') {
        const newWorkspaceId = e.newValue
        console.log(`[WorkspaceSync] Cross-tab sync: workspace changed to ${newWorkspaceId}`)
        onWorkspaceChange(newWorkspaceId)
      }
    }

    // Listen for custom events (same-tab sync)
    const handleCustomEvent = (e: CustomEvent<{ workspaceId: string | null }>) => {
      const newWorkspaceId = e.detail.workspaceId
      if (newWorkspaceId !== currentWorkspaceId) {
        console.log(`[WorkspaceSync] Same-tab sync: workspace changed to ${newWorkspaceId}`)
        onWorkspaceChange(newWorkspaceId)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('workspaceChanged', handleCustomEvent as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('workspaceChanged', handleCustomEvent as EventListener)
    }
  }, [currentWorkspaceId, onWorkspaceChange])

  // Function to broadcast workspace change
  const broadcastWorkspaceChange = useCallback((workspaceId: string | null) => {
    setSelectedWorkspaceId(workspaceId)
  }, [])

  return { broadcastWorkspaceChange }
}

/**
 * Hook to initialize workspace from storage on component mount
 * @param workspaces - available workspaces for validation
 * @returns current workspace ID and setter
 */
export function useWorkspaceInit(workspaces: any[]) {
  // This is a placeholder - actual implementation depends on your state management
  // The migration should be called in the root layout or app component
  return {
    initComplete: true,
    currentWorkspaceId: getSelectedWorkspaceId()
  }
}
