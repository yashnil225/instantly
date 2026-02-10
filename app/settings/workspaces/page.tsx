"use client"

import { useState, useEffect } from "react"
import { Plus, Settings, Trash2, DollarSign, Building2, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useWorkspaces } from "@/contexts/WorkspaceContext"
import { CreateWorkspaceModal } from "@/components/app/CreateWorkspaceModal"

export default function WorkspacesPage() {
    const { workspaces, isLoading: loading, refreshWorkspaces } = useWorkspaces()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<string>("")
    const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)
    const { toast } = useToast()

    // Rename dialog state
    const [renameDialogOpen, setRenameDialogOpen] = useState(false)
    const [renameWorkspace, setRenameWorkspace] = useState<any>(null)
    const [renameInput, setRenameInput] = useState("")
    const [renaming, setRenaming] = useState(false)

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteWorkspace, setDeleteWorkspace] = useState<any>(null)
    const [deleteConfirmInput, setDeleteConfirmInput] = useState("")
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        refreshWorkspaces()
    }, [refreshWorkspaces])


    const handleUpdateValue = async (id: string, value: string) => {
        try {
            const res = await fetch(`/api/workspaces/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opportunityValue: parseFloat(value) }),
            })
            if (res.ok) {
                await refreshWorkspaces()
                setEditingId(null)
                toast({ title: "Success", description: "Value updated" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Update failed", variant: "destructive" })
        }
    }

    const openRenameDialog = (ws: any) => {
        setRenameWorkspace(ws)
        setRenameInput(ws.name)
        setRenameDialogOpen(true)
    }

    const handleRename = async () => {
        if (!renameInput.trim() || !renameWorkspace) return

        setRenaming(true)
        try {
            const res = await fetch(`/api/workspaces/${renameWorkspace.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: renameInput }),
            })
            if (res.ok) {
                await refreshWorkspaces()
                setRenameDialogOpen(false)
                toast({ title: "Success", description: "Workspace renamed" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Rename failed", variant: "destructive" })
        } finally {
            setRenaming(false)
        }
    }

    const openDeleteDialog = (ws: any) => {
        setDeleteWorkspace(ws)
        setDeleteConfirmInput("")
        setDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteWorkspace || deleteConfirmInput !== deleteWorkspace.name) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/workspaces/${deleteWorkspace.id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                await refreshWorkspaces()
                setDeleteDialogOpen(false)
                toast({ title: "Success", description: "Workspace deleted along with its campaigns and leads" })
            } else {
                const data = await res.json()
                toast({ title: "Error", description: data.error || "Delete failed", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Delete failed", variant: "destructive" })
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Workspaces</h2>
                <p className="text-muted-foreground text-sm">Manage your organizations and set their pipeline values.</p>
            </div>


            {/* Workspace List */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 ml-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    Your Workspaces
                </h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border" />)}
                    </div>
                ) : workspaces.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <p className="text-muted-foreground italic text-sm">No workspaces found. Create one from any page using the workspace dropdown.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {workspaces.map((ws) => (
                            <div key={ws.id} className="bg-card border border-border rounded-xl p-5 shadow-sm group hover:border-primary/20 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-foreground">{ws.name}</h4>
                                            {ws.isDefault && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-primary/20">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-4">
                                            <span>{ws._count?.campaignWorkspaces || 0} Campaigns</span>
                                            <span className="opacity-20">•</span>
                                            <span>{ws.members?.length || 0} Members</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                            onClick={() => openRenameDialog(ws)}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                            onClick={() => openDeleteDialog(ws)}
                                            disabled={ws.isDefault}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Opportunity Value</label>
                                            {editingId === ws.id ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            autoFocus
                                                            className="w-32 pl-8 h-9 text-sm font-bold"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdateValue(ws.id, editValue)
                                                                if (e.key === 'Escape') setEditingId(null)
                                                            }}
                                                        />
                                                    </div>
                                                    <Button size="sm" className="h-9" onClick={() => handleUpdateValue(ws.id, editValue)}>Save</Button>
                                                    <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingId(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 group/value">
                                                    <span className="text-xl font-black tracking-tighter font-mono">
                                                        ${(ws.opportunityValue || 5000).toLocaleString()}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(ws.id)
                                                            setEditValue((ws.opportunityValue || 5000).toString())
                                                        }}
                                                        className="h-6 w-6 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground opacity-0 group-hover/value:opacity-100 transition-all shadow-sm border border-transparent hover:border-border"
                                                    >
                                                        <Settings className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Workspace Button */}
                <div className="pt-4">
                    <Button
                        onClick={() => setCreateWorkspaceOpen(true)}
                        variant="outline"
                        className="w-full h-12 border-dashed border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Workspace
                    </Button>
                </div>

                <CreateWorkspaceModal
                    open={createWorkspaceOpen}
                    onOpenChange={setCreateWorkspaceOpen}
                    onWorkspaceCreated={refreshWorkspaces}
                />
            </div>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Rename Workspace</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Enter a new name for "{renameWorkspace?.name}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            placeholder="New workspace name"
                            className="bg-background border-border"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename()
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRename} disabled={!renameInput.trim() || renaming}>
                            {renaming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Workspace
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground space-y-3 pt-2">
                            <p>
                                Are you sure you want to delete <strong className="text-foreground">"{deleteWorkspace?.name}"</strong>?
                            </p>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                                <strong>Warning:</strong> This will permanently delete:
                                <ul className="list-disc ml-5 mt-1">
                                    <li>All campaigns in this workspace</li>
                                    <li>All leads associated with those campaigns</li>
                                    <li>All email history and analytics</li>
                                </ul>
                            </div>
                            <p className="text-sm pt-2">
                                Type <strong className="text-foreground font-mono">{deleteWorkspace?.name}</strong> to confirm:
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input
                            value={deleteConfirmInput}
                            onChange={(e) => setDeleteConfirmInput(e.target.value)}
                            placeholder="Type workspace name to confirm"
                            className="bg-background border-border"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteConfirmInput !== deleteWorkspace?.name || deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

