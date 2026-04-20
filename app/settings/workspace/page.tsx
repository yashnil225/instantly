"use client"

import { useWorkspaces } from "@/contexts/WorkspaceContext"
import { WorkspaceMembersSection } from "@/components/app/settings/WorkspaceMembersSection"
import { Loader2 } from "lucide-react"

export default function WorkspaceSettingsPage() {
    const { workspaces, selectedWorkspaceId, isLoading } = useWorkspaces()
    
    // Use the explicitly selected workspace, or fall back to the first one for settings
    const activeWorkspaceId = selectedWorkspaceId || (workspaces.length > 0 ? workspaces[0].id : null)

    if (isLoading || (workspaces.length > 0 && !activeWorkspaceId)) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
    }

    if (workspaces.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <h2 className="text-xl font-semibold text-white mb-2">No Workspaces Found</h2>
                <p className="text-gray-400">Create a workspace to manage members and settings.</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Workspace & Members</h2>
                <p className="text-gray-400 text-sm">Manage workspace details and team members.</p>
            </div>

            <WorkspaceMembersSection workspaceId={activeWorkspaceId as string} />
        </div>
    )
}
