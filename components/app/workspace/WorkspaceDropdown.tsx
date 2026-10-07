"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/logo"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Pencil, Trash2, Plus, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspaces } from "@/contexts/WorkspaceContext"

interface WorkspaceDropdownProps {
    onRename?: (workspace: { id: string; name: string }) => void
    onDelete?: (workspace: { id: string; name: string }) => void
    onCreate?: () => void
    onSwitch?: (workspaceId: string | null) => void
    selectedWorkspaceId?: string | null
    showQuickActions?: boolean
}

export function WorkspaceDropdown({
    onRename,
    onDelete,
    onCreate,
    onSwitch,
    selectedWorkspaceId: externalSelectedId,
    showQuickActions = true
}: WorkspaceDropdownProps) {
    const { workspaces, invitations, selectedWorkspaceId: contextSelectedId, switchWorkspace, isLoading, refreshWorkspaces } = useWorkspaces()
    const [workspaceSearch, setWorkspaceSearch] = useState("")
    const [open, setOpen] = useState(false)
    const [processingInviteId, setProcessingInviteId] = useState<string | null>(null)

    // Use external selected ID if provided, otherwise use context
    const selectedWorkspaceId = externalSelectedId !== undefined ? externalSelectedId : contextSelectedId

    const filteredWorkspaces = workspaceSearch
        ? workspaces.filter(w =>
            w.name.toLowerCase().includes(workspaceSearch.toLowerCase())
        )
        : workspaces

    const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId)

    const handleRename = (e: React.MouseEvent, workspace: { id: string; name: string }) => {
        e.stopPropagation()
        setOpen(false)
        onRename?.(workspace)
    }

    const handleDelete = (e: React.MouseEvent, workspace: { id: string; name: string }) => {
        e.stopPropagation()
        setOpen(false)
        onDelete?.(workspace)
    }

    const handleCreate = () => {
        setOpen(false)
        onCreate?.()
    }

    const handleWorkspaceSelect = (workspaceId: string | null) => {
        if (onSwitch) {
            onSwitch(workspaceId)
        } else {
            switchWorkspace(workspaceId)
        }
        setOpen(false)
    }

    const handleInviteAction = async (e: React.MouseEvent, inviteId: string, action: 'accept' | 'reject') => {
        e.stopPropagation()
        e.preventDefault()
        setProcessingInviteId(inviteId)
        try {
            const res = await fetch(`/api/invitations/${inviteId}/${action}`, { method: 'POST' })
            if (res.ok) {
                await refreshWorkspaces()
            }
        } catch (error) {
            console.error(`Failed to ${action} invitation:`, error)
        } finally {
            setProcessingInviteId(null)
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="border-border bg-card text-foreground hover:text-foreground hover:bg-secondary h-9 gap-2"
                    disabled={isLoading}
                >
                    {selectedWorkspaceId
                        ? (selectedWorkspace?.name || 'Workspace')
                        : 'My Organization'}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-card border-border text-foreground">
                {/* Search */}
                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search workspaces..."
                            value={workspaceSearch}
                            onChange={(e) => setWorkspaceSearch(e.target.value)}
                            className="bg-background border-border h-9 text-sm pl-9"
                        />
                    </div>
                </div>
                <DropdownMenuSeparator className="bg-muted" />

                {/* My Organization Option */}
                <DropdownMenuItem
                    onClick={() => handleWorkspaceSelect(null)}
                    className={cn(
                        "cursor-pointer focus:bg-secondary focus:text-foreground",
                        selectedWorkspaceId === null && "bg-blue-500/20 text-blue-400"
                    )}
                >
                    <span className="flex-1">My Organization</span>
                </DropdownMenuItem>

                {/* Workspaces List */}
                {filteredWorkspaces.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="bg-muted" />
                        {filteredWorkspaces.map((workspace) => (
                            <DropdownMenuItem
                                key={workspace.id}
                                onClick={() => handleWorkspaceSelect(workspace.id)}
                                className={cn(
                                    "cursor-pointer focus:bg-secondary focus:text-foreground group/item",
                                    selectedWorkspaceId === workspace.id && "bg-blue-500/20 text-blue-400"
                                )}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center flex-1 min-w-0">
                                        <span className="truncate">{workspace.name}</span>
                                    </div>
                                    {showQuickActions && (
                                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleRename(e, workspace)}
                                                className="p-1 hover:bg-white/10 rounded"
                                                title="Rename"
                                            >
                                                <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                            {!workspace.isDefault && (
                                                <button
                                                    onClick={(e) => handleDelete(e, workspace)}
                                                    className="p-1 hover:bg-white/10 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {/* Empty State */}
                {filteredWorkspaces.length === 0 && workspaceSearch && (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        No workspaces found
                    </div>
                )}

                <DropdownMenuSeparator className="bg-muted" />

                {/* Invitations Section */}
                {invitations && invitations.length > 0 && (
                    <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Pending Invitations
                        </div>
                        {invitations.map((invitation) => (
                            <div key={invitation.id} className="flex flex-col gap-2 p-2 hover:bg-secondary rounded-sm group/invite transition-colors cursor-default">
                                <div className="text-sm truncate">
                                    <span className="font-semibold">{invitation.workspace.name}</span>
                                    <span className="text-muted-foreground ml-2 text-xs">by {invitation.inviter.name || invitation.inviter.email}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-6 text-xs flex-1 bg-blue-600 hover:bg-blue-700"
                                        disabled={processingInviteId === invitation.id}
                                        onClick={(e) => handleInviteAction(e, invitation.id, 'accept')}
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                        disabled={processingInviteId === invitation.id}
                                        onClick={(e) => handleInviteAction(e, invitation.id, 'reject')}
                                    >
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <DropdownMenuSeparator className="bg-muted" />
                    </>
                )}

                {/* Add Workspace */}
                <DropdownMenuItem
                    onClick={handleCreate}
                    className="cursor-pointer focus:bg-secondary focus:text-blue-400 text-blue-400"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Workspace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
