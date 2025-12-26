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
import { Loader2, UserPlus, Copy, Check, Trash2, Briefcase } from "lucide-react"

interface WorkspaceMember {
    id: string
    role: string
    user: {
        id: string
        name: string | null
        email: string
    }
}

interface Invitation {
    id: string
    email: string
    role: string
    status: string
}

export function WorkspaceMembersSection({ workspaceId }: { workspaceId: string }) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [workspaceName, setWorkspaceName] = useState("")
    const [members, setMembers] = useState<WorkspaceMember[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [copied, setCopied] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("member")
    const [inviting, setInviting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [workspaceId])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch workspace members/invites
            const membersRes = await fetch(`/api/workspaces/${workspaceId}/members`)
            if (membersRes.ok) {
                const data = await membersRes.json()
                setMembers(data.members || [])
                setInvitations(data.invitations || [])
            }

            // Fetch workspace details (name) - reusing the list endpoint for now or passing prop would be better,
            // but for simplicity we can just assume the parent might pass it or we fetch list.
            // Let's create a quick valid fetch if needed.
            // For now, let's assume we get the name from the context or a separate fetch.
            // Mocking name fetch from list for now since we don't have a single GET detail yet.
            const wsRes = await fetch('/api/workspaces')
            if (wsRes.ok) {
                const list = await wsRes.json()
                const current = list.find((w: any) => w.id === workspaceId)
                if (current) setWorkspaceName(current.name)
            }

        } catch (error) {
            console.error("Failed to fetch workspace data", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyId = () => {
        navigator.clipboard.writeText(workspaceId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({ title: "Copied", description: "Workspace ID copied to clipboard" })
    }

    const handleSaveName = async () => {
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workspaceName })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Workspace name updated" })
                // Force a refresh of global state if we had one, for now just local toast
                window.location.reload() // Brute force to update sidebar name
            } else {
                throw new Error("Failed to update")
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not update name", variant: "destructive" })
        }
    }

    const handleInvite = async () => {
        if (!inviteEmail) return
        setInviting(true)
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Failed to invite")

            toast({ title: "Invitation Sent", description: `Invited ${inviteEmail} as ${inviteRole}` })
            setInviteOpen(false)
            setInviteEmail("")
            fetchData() // Refresh list
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setInviting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading workspace details...</div>

    return (
        <div className="space-y-12">
            {/* Workspace Settings */}
            <div className="space-y-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> Workspace
                </h3>

                <div className="space-y-4 max-w-xl">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-semibold">Workspace Name</label>
                        <div className="flex gap-4">
                            <Input
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className="bg-[#111] border-[#333] text-white"
                            />
                            <Button onClick={handleSaveName} variant="secondary">Save</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-semibold">Workspace ID</label>
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#111] border border-[#333] p-2 rounded-md justify-between">
                            <span className="font-mono">{workspaceId}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopyId} className="h-6 w-6 hover:text-white">
                                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
                    <h3 className="text-lg font-medium text-white">Members</h3>
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                                <UserPlus className="h-4 w-4" /> Add New Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                            <DialogHeader>
                                <DialogTitle>Invite Member</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label>Email Address</label>
                                    <Input
                                        placeholder="colleague@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-[#111] border-[#333]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label>Role</label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger className="bg-[#111] border-[#333]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1a1a] border-[#333]">
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleInvite} disabled={inviting} className="w-full bg-blue-600">
                                    {inviting ? "Sending..." : "Invite"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-[#111] border border-[#2a2a2a] rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 p-4 bg-[#1a1a1a] border-b border-[#2a2a2a] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <div>USER</div>
                        <div>ROLE</div>
                        <div className="text-right">ACTION</div>
                    </div>
                    {/* Active Members */}
                    <div className="divide-y divide-[#2a2a2a]">
                        {members.map((member) => (
                            <div key={member.id} className="grid grid-cols-3 p-4 items-center">
                                <div>
                                    <div className="text-white text-sm font-medium">{member.user.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{member.user.email}</div>
                                </div>
                                <div>
                                    {member.role === 'owner' ? (
                                        <span className="text-xs text-gray-500 font-medium">
                                            Owner
                                        </span>
                                    ) : (
                                        <span className="capitalize text-gray-300 bg-[#2a2a2a] px-2 py-0.5 rounded text-xs">
                                            {member.role}
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    {member.role !== 'owner' && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-[#2a1a1a]">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pending Invitations */}
                    {invitations.length > 0 && (
                        <>
                            <div className="p-4 bg-[#1a1a1a] border-y border-[#2a2a2a] text-xs font-semibold text-indigo-400">
                                Pending Invitations
                            </div>
                            <div className="divide-y divide-[#2a2a2a]">
                                {invitations.map((invite) => (
                                    <div key={invite.id} className="grid grid-cols-3 p-4 items-center opacity-70">
                                        <div>
                                            <div className="text-white italic">{invite.email}</div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded">
                                                Invited ({invite.role})
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <Button variant="ghost" size="sm" className="text-gray-400">Revoke</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
