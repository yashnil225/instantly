"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { 
    getSelectedWorkspaceId, 
    setSelectedWorkspaceId, 
    migrateWorkspaceStorage 
} from "@/lib/workspace-storage"

interface Workspace {
    id: string
    name: string
    isDefault?: boolean
    opportunityValue?: number
    _count?: {
        campaignWorkspaces: number
    }
    members?: Array<{
        id: string
        userId: string
        role: string
        user: {
            id: string
            name?: string
            email: string
        }
    }>
}

interface WorkspaceInvitation {
    id: string
    workspace: { name: string }
    inviter: { name: string; email: string }
    role: string
}

interface WorkspaceContextType {
    workspaces: Workspace[]
    invitations: WorkspaceInvitation[]
    isLoading: boolean
    refreshWorkspaces: () => Promise<void>
    createWorkspace: (name: string, opportunityValue?: number) => Promise<Workspace | null>
    updateWorkspace: (id: string, name: string) => Promise<boolean>
    deleteWorkspace: (id: string) => Promise<boolean>
    selectedWorkspaceId: string | null
    setSelectedWorkspaceId: (id: string | null) => void
    switchWorkspace: (id: string | null) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(null)
    const isInitializedRef = React.useRef(false)

    // Initialize and validate selected workspace from storage
    useEffect(() => {
        if (workspaces.length > 0) {
            const storedId = getSelectedWorkspaceId()
            
            // Check if stored workspace is still accessible
            if (storedId && workspaces.find(w => w.id === storedId)) {
                if (!isInitializedRef.current || selectedWorkspaceId !== storedId) {
                    setSelectedWorkspaceIdState(storedId)
                }
            } else if (storedId) {
                // If stored workspace was deleted or member was removed, immediately reset UI!
                console.log(`[WorkspaceContext] Workspace ${storedId} is no longer accessible. Evicting from UI state.`)
                setSelectedWorkspaceId(null)
                setSelectedWorkspaceIdState(null)
            }
            
            isInitializedRef.current = true
        }
    }, [workspaces])

    // Listen for storage changes (cross-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'selectedWorkspaceId') {
                const newId = e.newValue
                if (newId !== selectedWorkspaceId) {
                    console.log(`[WorkspaceContext] Cross-tab sync: workspace changed to ${newId}`)
                    setSelectedWorkspaceIdState(newId)
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [selectedWorkspaceId])

    const refreshWorkspaces = useCallback(async (): Promise<void> => {
        try {
            // Fetch workspaces and invitations concurrently
            const [wsRes, invRes] = await Promise.all([
                fetch('/api/workspaces'),
                fetch('/api/invitations')
            ]);

            if (wsRes.ok) {
                const data = await wsRes.json()
                const newWorkspaces = Array.isArray(data) ? data : []
                setWorkspaces(prev => {
                    // Deep/shallow compare to avoid creating a new array reference if data hasn't changed
                    if (
                        prev.length === newWorkspaces.length &&
                        prev.every((w, idx) => 
                            w.id === newWorkspaces[idx]?.id && 
                            w.name === newWorkspaces[idx]?.name && 
                            w.opportunityValue === newWorkspaces[idx]?.opportunityValue &&
                            w.isDefault === newWorkspaces[idx]?.isDefault &&
                            w._count?.campaignWorkspaces === newWorkspaces[idx]?._count?.campaignWorkspaces
                        )
                    ) {
                        return prev
                    }
                    return newWorkspaces
                })
            }

            if (invRes.ok) {
                const data = await invRes.json()
                const newInvitations = Array.isArray(data) ? data : []
                setInvitations(prev => {
                    if (prev.length === newInvitations.length && prev.every((inv, idx) => inv.id === newInvitations[idx]?.id)) {
                        return prev;
                    }
                    return newInvitations;
                });
            }
        } catch (error) {
            console.error("Failed to fetch workspaces/invitations:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const createWorkspace = useCallback(async (name: string, opportunityValue?: number) => {
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    opportunityValue: opportunityValue || 5000
                })
            })

            if (res.ok) {
                const newWorkspace = await res.json()
                setWorkspaces(prev => [...prev, newWorkspace])
                return newWorkspace
            }
        } catch (error) {
            console.error("Failed to create workspace:", error)
        }
        return null
    }, [])

    const updateWorkspace = useCallback(async (id: string, name: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/workspaces/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() })
            })

            if (res.ok) {
                const updatedWorkspace = await res.json()
                setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updatedWorkspace } : w))
                return true
            }
        } catch (error) {
            console.error("Failed to update workspace:", error)
        }
        return false
    }, [])

    // Switch workspace and persist to storage
    const switchWorkspace = useCallback((id: string | null) => {
        console.log(`[WorkspaceContext] Switching workspace to: ${id || 'My Organization'}`)
        setSelectedWorkspaceIdState(id)
        setSelectedWorkspaceId(id)
    }, [])

    const deleteWorkspace = useCallback(async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/workspaces/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setWorkspaces(prev => prev.filter(w => w.id !== id))
                // If the deleted workspace was selected, switch to "My Organization"
                if (selectedWorkspaceId === id) {
                    switchWorkspace(null)
                }
                return true
            }
        } catch (error) {
            console.error("Failed to delete workspace:", error)
        }
        return false
    }, [selectedWorkspaceId, switchWorkspace])

    // Setter for selected workspace ID (used internally)
    const setSelectedWorkspaceIdWrapper = useCallback((id: string | null) => {
        setSelectedWorkspaceIdState(id)
        setSelectedWorkspaceId(id)
    }, [])

    useEffect(() => {
        refreshWorkspaces()

        const handleFocus = () => {
            refreshWorkspaces()
        }
        window.addEventListener('focus', handleFocus)

        // Periodic background sync every 15s to keep UI updated if removed or deleted by another admin
        const interval = setInterval(() => {
            refreshWorkspaces()
        }, 15000)

        return () => {
            window.removeEventListener('focus', handleFocus)
            clearInterval(interval)
        }
    }, [refreshWorkspaces])

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            invitations,
            isLoading,
            refreshWorkspaces,
            createWorkspace,
            updateWorkspace,
            deleteWorkspace,
            selectedWorkspaceId,
            setSelectedWorkspaceId: setSelectedWorkspaceIdWrapper,
            switchWorkspace
        }}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export function useWorkspaces() {
    const context = useContext(WorkspaceContext)
    if (context === undefined) {
        throw new Error('useWorkspaces must be used within a WorkspaceProvider')
    }
    return context
}
