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

interface WorkspaceContextType {
    workspaces: Workspace[]
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
    const [isLoading, setIsLoading] = useState(true)
    const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(null)

    // Initialize selected workspace from storage and run migration
    useEffect(() => {
        if (workspaces.length > 0) {
            const migratedId = migrateWorkspaceStorage(workspaces)
            const storedId = getSelectedWorkspaceId()
            
            // Validate that stored workspace still exists
            if (storedId && workspaces.find(w => w.id === storedId)) {
                setSelectedWorkspaceIdState(storedId)
            } else if (migratedId && workspaces.find(w => w.id === migratedId)) {
                setSelectedWorkspaceIdState(migratedId)
            } else {
                // Default to null (My Organization - show all)
                setSelectedWorkspaceIdState(null)
            }
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
            const res = await fetch('/api/workspaces')
            if (res.ok) {
                const data = await res.json()
                setWorkspaces(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("Failed to fetch workspaces:", error)
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
    }, [refreshWorkspaces])

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
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
