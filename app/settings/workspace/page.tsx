"use client"

import { useEffect, useState } from "react"
import { WorkspaceMembersSection } from "@/components/app/settings/WorkspaceMembersSection"
import { Loader2 } from "lucide-react"

export default function WorkspaceSettingsPage() {
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

    useEffect(() => {
        // In a real app, this might come from a context or URL local storage defaults
        // For now, fetch list and pick first
        fetch('/api/workspaces')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    setActiveWorkspaceId(data[0].id)
                }
            })
    }, [])

    if (!activeWorkspaceId) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Workspace & Members</h2>
                <p className="text-gray-400 text-sm">Manage workspace details and team members.</p>
            </div>

            <WorkspaceMembersSection workspaceId={activeWorkspaceId} />
        </div>
    )
}
