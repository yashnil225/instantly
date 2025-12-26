"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag, Loader2, Plus, Trash2, Pencil, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"

interface LeadLabel {
    id: string
    name: string
    color: string
    description: string | null
    createdAt: string
}

const colorOptions = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
]

export default function LeadLabelsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [labels, setLabels] = useState<LeadLabel[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        color: "#3b82f6",
        description: ""
    })

    useEffect(() => {
        fetchLabels()
    }, [])

    const fetchLabels = async () => {
        try {
            const res = await fetch('/api/labels')
            if (res.ok) {
                const data = await res.json()
                setLabels(data)
            }
        } catch (error) {
            console.error("Failed to fetch labels", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.name.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/labels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast({ title: "Created", description: "Label created successfully" })
                setDialogOpen(false)
                resetForm()
                fetchLabels()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create label", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async () => {
        if (!formData.name.trim() || !editingId) return
        setSaving(true)
        try {
            const res = await fetch(`/api/labels/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast({ title: "Updated", description: "Label updated successfully" })
                setDialogOpen(false)
                resetForm()
                fetchLabels()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update label", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/labels/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast({ title: "Deleted", description: "Label deleted" })
                fetchLabels()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete label", variant: "destructive" })
        }
    }

    const openEditDialog = (label: LeadLabel) => {
        setEditingId(label.id)
        setFormData({
            name: label.name,
            color: label.color,
            description: label.description || ""
        })
        setDialogOpen(true)
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({ name: "", color: "#3b82f6", description: "" })
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold text-foreground">Lead Statuses</h2>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild>
                        <Button className="bg-secondary hover:bg-[#2a2a2a] text-blue-500 border border-blue-900/30 hover:text-blue-400">
                            <Plus className="h-4 w-4 mr-1" /> Create New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-secondary border-[#333] text-foreground">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Label" : "Create New Label"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Interested, Not Interested"
                                    className="bg-card border-[#333]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setFormData(p => ({ ...p, color }))}
                                            className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-white' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Description (optional)</label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Describe this label"
                                    className="bg-card border-[#333]"
                                />
                            </div>
                            <Button
                                onClick={editingId ? handleUpdate : handleCreate}
                                disabled={saving || !formData.name.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Update" : "Create"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {labels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-secondary p-6 rounded-full mb-4">
                        <Tag className="h-8 w-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No custom labels found</h3>
                    <p className="text-muted-foreground text-sm">Create your first label to organize leads</p>
                </div>
            ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_1fr_100px] bg-card border-b border-border py-3 px-4">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-8"></div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">NAME</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DESCRIPTION</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ACTIONS</div>
                    </div>
                    <div className="divide-y divide-[#2a2a2a] bg-background">
                        {labels.map(label => (
                            <div key={label.id} className="grid grid-cols-[auto_1fr_1fr_100px] py-3 px-4 items-center hover:bg-card">
                                <div className="w-8">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }} />
                                </div>
                                <div className="text-sm text-foreground font-medium">{label.name}</div>
                                <div className="text-sm text-muted-foreground">{label.description || "-"}</div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(label)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(label.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
