"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

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
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refreshWorkspaces = useCallback(async () => {
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

    useEffect(() => {
        refreshWorkspaces()
    }, [refreshWorkspaces])

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            isLoading,
            refreshWorkspaces,
            createWorkspace
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
