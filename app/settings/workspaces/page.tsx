"use client"

import { useState, useEffect } from "react"
import { Plus, Settings, Trash2, DollarSign, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newWorkspaceName, setNewWorkspaceName] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<string>("")
    const { toast } = useToast()

    useEffect(() => {
        fetchWorkspaces()
    }, [])

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch("/api/workspaces")
            const data = await res.json()
            setWorkspaces(data)
        } catch (error) {
            console.error("Failed to fetch workspaces:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) return

        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newWorkspaceName })
            })

            if (res.ok) {
                toast({ title: "Workspace created", description: "Your new workspace is ready." })
                setNewWorkspaceName("")
                fetchWorkspaces()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create workspace", variant: "destructive" })
        }
    }

    const handleUpdateValue = async (id: string, value: string) => {
        try {
            const res = await fetch(`/api/workspaces/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opportunityValue: parseFloat(value) }),
            })
            if (res.ok) {
                setWorkspaces(workspaces.map(w => w.id === id ? { ...w, opportunityValue: parseFloat(value) } : w))
                setEditingId(null)
                toast({ title: "Success", description: "Value updated" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Update failed", variant: "destructive" })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this workspace?")) return

        try {
            const res = await fetch(`/api/workspaces/${id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                setWorkspaces(workspaces.filter(w => w.id !== id))
                toast({ title: "Success", description: "Workspace deleted" })
            } else {
                const data = await res.json()
                toast({ title: "Error", description: data.error || "Delete failed", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Delete failed", variant: "destructive" })
        }
    }

    const handleRename = async (id: string, newName: string) => {
        if (!newName.trim()) return

        try {
            const res = await fetch(`/api/workspaces/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            })
            if (res.ok) {
                setWorkspaces(workspaces.map(w => w.id === id ? { ...w, name: newName } : w))
                setEditingId(null)
                toast({ title: "Success", description: "Workspace renamed" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Rename failed", variant: "destructive" })
        }
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Workspaces</h2>
                <p className="text-muted-foreground text-sm">Manage your organizations and set their pipeline values.</p>
            </div>

            {/* Create New Workspace */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Add New Workspace
                </h3>
                <div className="flex gap-3">
                    <Input
                        placeholder="Organization Name (e.g. Acme Corp)"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        className="bg-background border-border"
                    />
                    <Button onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim()}>
                        Create
                    </Button>
                </div>
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
                        <p className="text-muted-foreground italic text-sm">No workspaces found. Create one above!</p>
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => {
                                            const newName = prompt("Enter new workspace name", ws.name)
                                            if (newName) handleRename(ws.id, newName)
                                        }}>
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                            onClick={() => handleDelete(ws.id)}
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
            </div>
        </div>
    )
}
