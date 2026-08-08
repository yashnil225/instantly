"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Filter, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Tag {
    id: string
    name: string
    color: string
}

interface FilterBarProps {
    onSearchChange: (value: string) => void
    onTagsChange: (tags: string[]) => void // Array of tag IDs
    selectedTags: string[]
    placeholder?: string
    className?: string
}

export function FilterBar({ onSearchChange, onTagsChange, selectedTags, placeholder = "Search...", className }: FilterBarProps) {
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [search, setSearch] = useState("")

    const fetchTags = async () => {
        const res = await fetch("/api/tags")
        if (res.ok) {
            const data = await res.json()
            setAllTags(data)
        }
    }

    useEffect(() => {
        fetchTags()
    }, [])

    const toggleTag = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            onTagsChange(selectedTags.filter(id => id !== tagId))
        } else {
            onTagsChange([...selectedTags, tagId])
        }
    }

    return (
        <div className={cn("flex items-center justify-between gap-2 mb-4", className)}>
            <div className="flex items-center gap-2">
                <div className="relative w-[320px]">
                    <Input
                        placeholder={placeholder}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            onSearchChange(e.target.value)
                        }}
                        className="h-9"
                    />
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground hover:text-foreground">
                            <Filter className="w-4 h-4 mr-2" />
                            Tags
                            {selectedTags.length > 0 && (
                                <>
                                    <Separator orientation="vertical" className="mx-2 h-4" />
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                        {selectedTags.length}
                                    </Badge>
                                    <div className="hidden space-x-1 lg:flex">
                                        {selectedTags.length > 2 ? (
                                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                                {selectedTags.length} selected
                                            </Badge>
                                        ) : (
                                            allTags
                                                .filter(tag => selectedTags.includes(tag.id))
                                                .map(tag => (
                                                    <Badge
                                                        variant="secondary"
                                                        key={tag.id}
                                                        className="rounded-sm px-1 font-normal"
                                                        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))
                                        )}
                                    </div>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <div className="p-2 border-b">
                            <span className="text-xs font-medium text-muted-foreground">Filter by tag</span>
                        </div>
                        <div className="p-1 max-h-[300px] overflow-auto">
                            {allTags.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No tags found
                                </div>
                            ) : (
                                allTags.map((tag) => {
                                    const isSelected = selectedTags.includes(tag.id)
                                    return (
                                        <div
                                            key={tag.id}
                                            className={cn(
                                                "flex items-center px-2 py-2 cursor-pointer gap-2 rounded-sm hover:bg-accent",
                                                isSelected && "bg-accent"
                                            )}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            <div
                                                className={cn("flex items-center justify-center w-4 h-4 rounded border border-primary/30", isSelected ? "bg-primary border-primary" : "bg-transparent")}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <span className="text-sm flex-1">{tag.name}</span>
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        {selectedTags.length > 0 && (
                            <div className="p-1 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center h-8 text-xs"
                                    onClick={() => onTagsChange([])}
                                >
                                    Clear filters
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            {selectedTags.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 lg:hidden"
                    onClick={() => onTagsChange([])}
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    )
}
