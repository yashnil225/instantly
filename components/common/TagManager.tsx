"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, X, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tag {
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
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [search, setSearch] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

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
                                return (
                                    <div
                                        key={tag.id}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-accent",
                                            isSelected && "bg-accent/50"
                                        )}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                        <span className="truncate flex-1">{tag.name}</span>
                                        {isSelected && <TagIcon className="w-3 h-3 opacity-50" />}
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
        </div>
    )
}
