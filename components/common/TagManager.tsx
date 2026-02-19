"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, X, Tag as TagIcon, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export interface Tag {
    id: string
    name: string
    color: string
}

interface TagManagerProps {
    entityId: string
    entityType: "campaign" | "account" | "lead"
    selectedTags: Tag[] // Currently assigned tags
    onTagsChange?: (newTags: Tag[]) => void
}

export function TagManager({ entityId, entityType, selectedTags, onTagsChange }: TagManagerProps) {
    const { toast } = useToast()
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [search, setSearch] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Rename state
    const [editingTag, setEditingTag] = useState<Tag | null>(null)
    const [editValue, setEditValue] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)
    
    // Delete state
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchTags()
        }
    }, [isOpen])

    const fetchTags = async () => {
        const res = await fetch("/api/tags")
        if (res.ok) {
            const data = await res.json()
            setAllTags(data)
        }
    }

    const startRename = (tag: Tag, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingTag(tag)
        setEditValue(tag.name)
    }

    const cancelRename = () => {
        setEditingTag(null)
        setEditValue("")
    }

    const saveRename = async () => {
        if (!editingTag || !editValue.trim() || editValue.trim() === editingTag.name) {
            cancelRename()
            return
        }

        setIsRenaming(true)
        try {
            const res = await fetch(`/api/tags/${editingTag.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editValue.trim() })
            })

            if (res.ok) {
                const updatedTag = await res.json()
                // Update in allTags
                setAllTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t))
                // Update in selectedTags if present
                if (selectedTags.some(t => t.id === updatedTag.id)) {
                    const newSelected = selectedTags.map(t => t.id === updatedTag.id ? updatedTag : t)
                    onTagsChange?.(newSelected)
                }
                toast({
                    title: "Tag renamed",
                    description: `"${editingTag.name}" renamed to "${updatedTag.name}"`
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to rename tag",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Rename failed:', error)
            toast({
                title: "Error",
                description: "Failed to rename tag",
                variant: "destructive"
            })
        } finally {
            setIsRenaming(false)
            setEditingTag(null)
            setEditValue("")
        }
    }

    const startDelete = (tag: Tag, e: React.MouseEvent) => {
        e.stopPropagation()
        setTagToDelete(tag)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!tagToDelete) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/tags/${tagToDelete.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                const result = await res.json()
                // Remove from allTags
                setAllTags(prev => prev.filter(t => t.id !== tagToDelete.id))
                // Remove from selectedTags if present
                if (selectedTags.some(t => t.id === tagToDelete.id)) {
                    const newSelected = selectedTags.filter(t => t.id !== tagToDelete.id)
                    onTagsChange?.(newSelected)
                }
                toast({
                    title: "Tag deleted",
                    description: result.usageCount > 0 
                        ? `"${tagToDelete.name}" deleted and removed from ${result.usageCount} item(s)`
                        : `"${tagToDelete.name}" has been deleted`
                })
                setDeleteDialogOpen(false)
                setTagToDelete(null)
            } else {
                const error = await res.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to delete tag",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Delete failed:', error)
            toast({
                title: "Error",
                description: "Failed to delete tag",
                variant: "destructive"
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const createTag = async () => {
        if (!search.trim()) return
        setLoading(true)
        try {
            const res = await fetch("/api/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: search.trim() })
            })
            if (res.ok) {
                const newTag = await res.json()
                setAllTags([...allTags, newTag])
                toggleTag(newTag)
                setSearch("")
            }
        } finally {
            setLoading(false)
        }
    }

    const toggleTag = async (tag: Tag) => {
        const isSelected = selectedTags.some(t => t.id === tag.id)
        let newTags = []

        if (isSelected) {
            // Remove
            newTags = selectedTags.filter(t => t.id !== tag.id)
            if (entityId) {
                // Call API to remove relation
                await fetch(`/api/tags/assign`, {
                    method: 'DELETE',
                    body: JSON.stringify({ entityId, entityType, tagId: tag.id })
                })
            }
        } else {
            // Add
            newTags = [...selectedTags, tag]
            if (entityId) {
                await fetch(`/api/tags/assign`, {
                    method: 'POST',
                    body: JSON.stringify({ entityId, entityType, tagId: tag.id })
                })
            }
        }

        if (onTagsChange) onTagsChange(newTags)
    }

    const filteredTags = allTags.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {selectedTags.map(tag => (
                <Badge key={tag.id} variant="secondary" className="px-2 py-1 gap-1 text-xs" style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}>
                    {tag.name}
                    <X
                        className="w-3 h-3 cursor-pointer hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleTag(tag)
                        }}
                    />
                </Badge>
            ))}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2 border-dashed">
                        <Plus className="w-3 h-3" />
                        Add Tag
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-2" align="start">
                    <div className="flex flex-col gap-2">
                        <Input
                            placeholder="Search or create..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-8 text-xs"
                            autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                            {filteredTags.map(tag => {
                                const isSelected = selectedTags.some(t => t.id === tag.id)
                                const isEditing = editingTag?.id === tag.id
                                
                                if (isEditing) {
                                    return (
                                        <div key={tag.id} className="flex items-center gap-2 px-2 py-1.5">
                                            <Input
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                className="h-7 text-xs flex-1"
                                                autoFocus
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveRename()
                                                    if (e.key === 'Escape') cancelRename()
                                                }}
                                                disabled={isRenaming}
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={saveRename}
                                                disabled={isRenaming}
                                            >
                                                {isRenaming ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <TagIcon className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={cancelRename}
                                                disabled={isRenaming}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )
                                }
                                
                                return (
                                    <div
                                        key={tag.id}
                                        className={cn(
                                            "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                                            isSelected && "bg-accent/50"
                                        )}
                                    >
                                        <div 
                                            className="flex items-center gap-2 flex-1 cursor-pointer"
                                            onClick={() => toggleTag(tag)}
                                        >
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                            <span className="truncate">{tag.name}</span>
                                            {isSelected && <TagIcon className="w-3 h-3 opacity-50" />}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={(e) => startRename(tag, e)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 hover:text-red-500"
                                                onClick={(e) => startDelete(tag, e)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {search && !filteredTags.find(t => t.name.toLowerCase() === search.toLowerCase()) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs h-8"
                                    onClick={createTag}
                                    disabled={loading}
                                >
                                    <Plus className="w-3 h-3 mr-2" />
                                    Create "{search}"
                                </Button>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#333] text-white">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold">
                            Delete Tag
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-400">
                            Are you sure you want to delete <span className="text-white font-semibold">"{tagToDelete?.name}"</span>?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <p className="font-semibold text-red-400 mb-1">Warning</p>
                            <p className="text-sm text-red-400/80">
                                This will permanently delete the tag and remove it from all campaigns, accounts, and leads.
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-3 sm:gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false)
                                setTagToDelete(null)
                            }}
                            disabled={isDeleting}
                            className="flex-1 bg-transparent border-[#333] text-white hover:bg-white/5 h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 h-10 bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Tag
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
