"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Zap, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Workspace {
    id: string
    name: string
    isDefault?: boolean
    _count?: {
        campaignWorkspaces: number
    }
}

interface WorkspaceSelectorProps {
    selectedWorkspaces: string[]
    onSelectionChange: (workspaceIds: string[]) => void
    mode?: "single" | "multi"
}

export function WorkspaceSelector({
    selectedWorkspaces,
    onSelectionChange,
    mode = "single"
}: WorkspaceSelectorProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWorkspaces()
    }, [])

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces')
            if (res.ok) {
                const data = await res.json()
                setWorkspaces(data)

                // Auto-select "My Organization" if nothing selected
                if (selectedWorkspaces.length === 0) {
                    const defaultWorkspace = data.find((w: Workspace) => w.isDefault)
                    if (defaultWorkspace) {
                        onSelectionChange([defaultWorkspace.id])
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load workspaces:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredWorkspaces = workspaces.filter((w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleWorkspace = (workspaceId: string) => {
        if (mode === "single") {
            onSelectionChange([workspaceId])
        } else {
            // Multi-select mode
            if (selectedWorkspaces.includes(workspaceId)) {
                // Remove if already selected
                const newSelection = selectedWorkspaces.filter(id => id !== workspaceId)
                // Keep at least one selected
                if (newSelection.length > 0) {
                    onSelectionChange(newSelection)
                }
            } else {
                // Add to selection
                onSelectionChange([...selectedWorkspaces, workspaceId])
            }
        }
    }

    const getDisplayText = () => {
        if (selectedWorkspaces.length === 0) return "Select workspace"
        if (selectedWorkspaces.length === 1) {
            const workspace = workspaces.find(w => w.id === selectedWorkspaces[0])
            return workspace?.name || "Select workspace"
        }
        return `${selectedWorkspaces.length} workspaces selected`
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="border-[#2a2a2a] bg-[#1a1a1a] text-white hover:text-white hover:bg-[#2a2a2a] gap-2"
                >
                    <Zap className="h-4 w-4 text-blue-500" />
                    {getDisplayText()}
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                {/* Search */}
                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search workspaces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm h-8 pl-8"
                        />
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-[#2a2a2a]" />

                {/* Workspace List */}
                <div className="max-h-64 overflow-y-auto">
                    {filteredWorkspaces.map((workspace) => (
                        <DropdownMenuItem
                            key={workspace.id}
                            onClick={(e) => {
                                e.preventDefault()
                                toggleWorkspace(workspace.id)
                            }}
                            className={cn(
                                "cursor-pointer focus:bg-[#2a2a2a] focus:text-white flex items-center gap-2 px-3 py-2",
                                selectedWorkspaces.includes(workspace.id) && "bg-blue-500/20"
                            )}
                        >
                            {mode === "multi" && (
                                <Checkbox
                                    checked={selectedWorkspaces.includes(workspace.id)}
                                    onCheckedChange={() => toggleWorkspace(workspace.id)}
                                    className="border-gray-600 data-[state=checked]:bg-blue-600"
                                />
                            )}
                            <div className="flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm">{workspace.name}</span>
                                    {workspace.isDefault && (
                                        <span className="text-xs text-gray-500">(Default)</span>
                                    )}
                                </div>
                                {workspace._count?.campaignWorkspaces !== undefined && (
                                    <span className="text-xs text-gray-500">
                                        {workspace._count.campaignWorkspaces}
                                    </span>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>

                {mode === "multi" && selectedWorkspaces.length > 1 && (
                    <>
                        <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                        <div className="p-2 text-xs text-gray-400 text-center">
                            Campaign will appear in all selected workspaces
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
