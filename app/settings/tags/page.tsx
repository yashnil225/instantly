"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag, Loader2, Plus, Trash2, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"

interface CustomTag {
    id: string
    label: string
    description: string | null
    createdAt: string
}

export default function CustomTagsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [tags, setTags] = useState<CustomTag[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        label: "",
        description: ""
    })

    useEffect(() => {
        fetchTags()
    }, [])

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/tags')
            if (res.ok) {
                const data = await res.json()
                setTags(data)
            }
        } catch (error) {
            console.error("Failed to fetch tags", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.label.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast({ title: "Created", description: "Tag created successfully" })
                setDialogOpen(false)
                resetForm()
                fetchTags()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create tag", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async () => {
        if (!formData.label.trim() || !editingId) return
        setSaving(true)
        try {
            const res = await fetch(`/api/tags/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast({ title: "Updated", description: "Tag updated successfully" })
                setDialogOpen(false)
                resetForm()
                fetchTags()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update tag", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast({ title: "Deleted", description: "Tag deleted" })
                fetchTags()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete tag", variant: "destructive" })
        }
    }

    const openEditDialog = (tag: CustomTag) => {
        setEditingId(tag.id)
        setFormData({
            label: tag.label,
            description: tag.description || ""
        })
        setDialogOpen(true)
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({ label: "", description: "" })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
    }

    return (
        <div className="max-w-4xl space-y-6">
            <h2 className="text-xl font-semibold text-white">Custom Tags</h2>

            <div className="flex justify-between items-end mb-4">
                <div className="text-xs text-gray-500 uppercase">{tags.length} results</div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-blue-500 border border-blue-900/30 hover:text-blue-400 text-xs font-medium px-3 h-8">
                            <Plus className="h-3 w-3 mr-1" /> Create New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Tag" : "Create New Tag"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Label</label>
                                <Input
                                    value={formData.label}
                                    onChange={(e) => setFormData(p => ({ ...p, label: e.target.value }))}
                                    placeholder="e.g. VIP, Priority, Follow-up"
                                    className="bg-[#111] border-[#333]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Description (optional)</label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Describe this tag"
                                    className="bg-[#111] border-[#333]"
                                />
                            </div>
                            <Button
                                onClick={editingId ? handleUpdate : handleCreate}
                                disabled={saving || !formData.label.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Update" : "Create"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr,2fr,1fr,100px] bg-[#111] border-b border-[#2a2a2a] py-3 px-4">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">LABEL</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">DESCRIPTION</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CREATED AT</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ACTIONS</div>
                </div>

                {tags.length === 0 ? (
                    <div className="bg-[#0a0a0a] py-12 text-center">
                        <Tag className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No custom tags yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#2a2a2a] bg-[#0a0a0a]">
                        {tags.map(tag => (
                            <div key={tag.id} className="grid grid-cols-[1fr,2fr,1fr,100px] py-3 px-4 items-center hover:bg-[#111]">
                                <div className="text-sm text-white font-medium flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-blue-500" />
                                    {tag.label}
                                </div>
                                <div className="text-sm text-gray-500">{tag.description || "-"}</div>
                                <div className="text-sm text-gray-500">{formatDate(tag.createdAt)}</div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" onClick={() => openEditDialog(tag)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={() => handleDelete(tag.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
