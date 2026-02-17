"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useWorkspaces } from "@/contexts/WorkspaceContext"
import { WorkspaceManagerModal } from "@/components/app/workspace/WorkspaceManagerModal"
import { DeleteConfirmationDialog } from "@/components/app/workspace/DeleteConfirmationDialog"
import {
    Users,
    Mail,
    CreditCard,
    UserCircle,
    ChevronDown,
    ChevronRight,
    Pencil,
    Trash2,
    UserPlus,
    Loader2,
    Building2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkspaceWithDetails {
    id: string
    name: string
    isDefault: boolean
    opportunityValue?: number
    _count: {
        members: number
        campaignWorkspaces: number
        emailAccountWorkspaces?: number
    }
    members: Array<{
        id: string
        userId: string
        role: string
        user: {
            id: string
            name?: string | null
            email: string
        }
    }>
    leadCount?: number
}

interface Invitation {
    id: string
    email: string
    role: string
    status: string
}

export function WorkspacesListSection() {
    const { toast } = useToast()
    const {
        workspaces: contextWorkspaces,
        refreshWorkspaces,
        updateWorkspace,
        deleteWorkspace
    } = useWorkspaces()

    const [loading, setLoading] = useState(true)
    const [workspaces, setWorkspaces] = useState<WorkspaceWithDetails[]>([])
    const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null)

    // Modal states
    const [managerModalOpen, setManagerModalOpen] = useState(false)
    const [managerMode, setManagerMode] = useState<'create' | 'rename'>('create')
    const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceWithDetails | null>(null)

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [workspaceToDelete, setWorkspaceToDelete] = useState<WorkspaceWithDetails | null>(null)

    // Invite dialog state
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("member")
    const [inviting, setInviting] = useState(false)

    useEffect(() => {
        fetchWorkspaceDetails()
    }, [contextWorkspaces])

    const fetchWorkspaceDetails = async () => {
        if (contextWorkspaces.length === 0) {
            setWorkspaces([])
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            // Fetch detailed info for each workspace
            const detailedWorkspaces = await Promise.all(
                contextWorkspaces.map(async (ws) => {
                    try {
                        const [membersRes, leadRes] = await Promise.all([
                            fetch(`/api/workspaces/${ws.id}/members`),
                            fetch(`/api/workspaces/${ws.id}/stats`)
                        ])

                        const membersData = membersRes.ok ? await membersRes.json() : { members: [] }
                        const statsData = leadRes.ok ? await leadRes.json() : { leadCount: 0 }

                        return {
                            ...ws,
                            members: membersData.members || [],
                            leadCount: statsData.leadCount || 0,
                            _count: {
                                ...ws._count,
                                members: (membersData.members || []).length,
                                emailAccountWorkspaces: statsData.emailAccountCount || 0
                            }
                        } as WorkspaceWithDetails
                    } catch (error) {
                        console.error(`Failed to fetch details for workspace ${ws.id}:`, error)
                        return {
                            ...ws,
                            members: [],
                            leadCount: 0,
                            _count: {
                                ...ws._count,
                                members: 0,
                                emailAccountWorkspaces: 0
                            }
                        } as WorkspaceWithDetails
                    }
                })
            )

            setWorkspaces(detailedWorkspaces)
        } catch (error) {
            console.error("Failed to fetch workspace details:", error)
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (workspaceId: string) => {
        setExpandedWorkspaceId(expandedWorkspaceId === workspaceId ? null : workspaceId)
    }

    const handleRename = (workspace: WorkspaceWithDetails) => {
        setSelectedWorkspace(workspace)
        setManagerMode('rename')
        setManagerModalOpen(true)
    }

    const handleDelete = (workspace: WorkspaceWithDetails) => {
        setWorkspaceToDelete(workspace)
        setDeleteDialogOpen(true)
    }

    const handleInvite = (workspaceId: string) => {
        setInviteWorkspaceId(workspaceId)
        setInviteEmail("")
        setInviteRole("member")
        setInviteOpen(true)
    }

    const handleManagerSubmit = async (name: string): Promise<boolean> => {
        if (managerMode === 'rename' && selectedWorkspace) {
            const success = await updateWorkspace(selectedWorkspace.id, name)
            if (success) {
                await refreshWorkspaces()
                await fetchWorkspaceDetails()
            }
            return success
        }
        return false
    }

    const handleConfirmDelete = async (): Promise<boolean> => {
        if (!workspaceToDelete) return false

        const success = await deleteWorkspace(workspaceToDelete.id)
        if (success) {
            await refreshWorkspaces()
            await fetchWorkspaceDetails()
            if (expandedWorkspaceId === workspaceToDelete.id) {
                setExpandedWorkspaceId(null)
            }
        }
        return success
    }

    const handleInviteSubmit = async () => {
        if (!inviteEmail || !inviteWorkspaceId) return

        setInviting(true)
        try {
            const res = await fetch(`/api/workspaces/${inviteWorkspaceId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Failed to invite")

            toast({ title: "Invitation Sent", description: `Invited ${inviteEmail} as ${inviteRole}` })
            setInviteOpen(false)
            setInviteEmail("")
            await fetchWorkspaceDetails() // Refresh to show new member
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setInviting(false)
        }
    }

    const getRoleBadge = (role: string) => {
        if (role === 'owner') {
            return <span className="text-xs text-gray-500 font-medium">Owner</span>
        }
        return <span className="capitalize text-gray-300 bg-[#2a2a2a] px-2 py-0.5 rounded text-xs">{role}</span>
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading workspaces...
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Workspaces Table */}
            <div className="bg-[#111] border border-[#2a2a2a] rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 p-4 bg-[#1a1a1a] border-b border-[#2a2a2a] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Workspace Name</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-2">Members</div>
                    <div className="col-span-2">Campaigns</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Workspaces List */}
                <div className="divide-y divide-[#2a2a2a]">
                    {workspaces.map((workspace) => (
                        <div key={workspace.id}>
                            {/* Main Row */}
                            <div
                                className={cn(
                                    "grid grid-cols-12 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer",
                                    expandedWorkspaceId === workspace.id && "bg-white/5"
                                )}
                                onClick={() => toggleExpand(workspace.id)}
                            >
                                <div className="col-span-4 flex items-center gap-2">
                                    {expandedWorkspaceId === workspace.id ? (
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    <span className="text-white text-sm font-medium truncate">
                                        {workspace.name}
                                        {workspace.isDefault && (
                                            <span className="ml-2 text-xs text-gray-500">(Default)</span>
                                        )}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    {workspace.members.find(m => m.userId)?.role === 'owner' ? 'Owner' : 'Member'}
                                </div>
                                <div className="col-span-2 text-gray-300">
                                    {workspace._count?.members || 0}
                                </div>
                                <div className="col-span-2 text-gray-300">
                                    {workspace._count?.campaignWorkspaces || 0}
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRename(workspace)
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Rename"
                                    >
                                        <Pencil className="h-4 w-4 text-gray-400 hover:text-white" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(workspace)
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Delete"
                                        disabled={workspace.isDefault}
                                    >
                                        <Trash2 className={cn(
                                            "h-4 w-4",
                                            workspace.isDefault ? "text-gray-600" : "text-gray-400 hover:text-red-400"
                                        )} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleInvite(workspace.id)
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Add Member"
                                    >
                                        <UserPlus className="h-4 w-4 text-gray-400 hover:text-blue-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedWorkspaceId === workspace.id && (
                                <div className="bg-[#0d0d0d] border-t border-[#2a2a2a] p-6 space-y-6">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <span className="text-xs text-gray-500 uppercase">Members</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{workspace._count?.members || 0}</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Mail className="h-4 w-4 text-green-500" />
                                                <span className="text-xs text-gray-500 uppercase">Campaigns</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{workspace._count?.campaignWorkspaces || 0}</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard className="h-4 w-4 text-purple-500" />
                                                <span className="text-xs text-gray-500 uppercase">Accounts</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{workspace._count?.emailAccountWorkspaces || 0}</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <UserCircle className="h-4 w-4 text-orange-500" />
                                                <span className="text-xs text-gray-500 uppercase">Leads</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{workspace.leadCount || 0}</p>
                                        </div>
                                    </div>

                                    {/* Members List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-white">Members</h4>
                                            <Button
                                                size="sm"
                                                onClick={() => handleInvite(workspace.id)}
                                                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-8"
                                            >
                                                <UserPlus className="h-3 w-3" />
                                                Add Member
                                            </Button>
                                        </div>
                                        <div className="bg-[#111] border border-[#2a2a2a] rounded-lg overflow-hidden">
                                            <div className="grid grid-cols-3 p-3 bg-[#1a1a1a] border-b border-[#2a2a2a] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                <div>User</div>
                                                <div>Role</div>
                                                <div className="text-right">Action</div>
                                            </div>
                                            <div className="divide-y divide-[#2a2a2a]">
                                                {workspace.members.length > 0 ? (
                                                    workspace.members.map((member) => (
                                                        <div key={member.id} className="grid grid-cols-3 p-3 items-center">
                                                            <div>
                                                                <div className="text-white text-sm">{member.user.name || 'Unknown'}</div>
                                                                <div className="text-xs text-gray-500">{member.user.email}</div>
                                                            </div>
                                                            <div>{getRoleBadge(member.role)}</div>
                                                            <div className="text-right">
                                                                {member.role !== 'owner' && (
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-500">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-gray-500">
                                                        No members yet
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {workspaces.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No workspaces found
                    </div>
                )}
            </div>

            {/* Rename Modal */}
            <WorkspaceManagerModal
                open={managerModalOpen}
                onOpenChange={setManagerModalOpen}
                mode="rename"
                workspace={selectedWorkspace ? {
                    id: selectedWorkspace.id,
                    name: selectedWorkspace.name,
                    opportunityValue: selectedWorkspace.opportunityValue
                } : null}
                onSubmit={handleManagerSubmit}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                workspace={workspaceToDelete}
                onConfirm={handleConfirmDelete}
            />

            {/* Invite Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="bg-[#1a1a1a] border-[#333] text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-500" />
                            Invite Member
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Email Address</label>
                            <Input
                                placeholder="colleague@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="bg-[#111] border-[#333] text-white h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Role</label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="bg-[#111] border-[#333] text-white h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleInviteSubmit}
                            disabled={inviting || !inviteEmail}
                            className="w-full bg-blue-600 hover:bg-blue-500 h-11"
                        >
                            {inviting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Invitation"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
