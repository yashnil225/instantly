"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, DollarSign } from "lucide-react"

interface CreateWorkspaceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onWorkspaceCreated?: () => void
}

export function CreateWorkspaceModal({ 
    open, 
    onOpenChange, 
    onWorkspaceCreated 
}: CreateWorkspaceModalProps) {
    const { toast } = useToast()
    const [workspaceName, setWorkspaceName] = useState("")
    const [opportunityValue, setOpportunityValue] = useState("5000")
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async () => {
        if (!workspaceName.trim()) {
            toast({
                title: "Error",
                description: "Workspace name is required",
                variant: "destructive"
            })
            return
        }

        setIsCreating(true)
        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: workspaceName.trim(),
                    opportunityValue: parseFloat(opportunityValue) || 5000
                })
            })

            if (res.ok) {
                toast({
                    title: "Success",
                    description: `Workspace "${workspaceName}" created successfully`
                })
                setWorkspaceName("")
                setOpportunityValue("5000")
                onOpenChange(false)
                onWorkspaceCreated?.()
            } else {
                const error = await res.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to create workspace",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create workspace",
                variant: "destructive"
            })
        } finally {
            setIsCreating(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleCreate()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0c0c10] border-white/10 sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] shadow-2xl backdrop-blur-xl">
                <div className="sr-only">
                    <DialogTitle>Create New Workspace</DialogTitle>
                </div>
                <div className="p-10 space-y-10">
                    <div className="space-y-4 text-center">
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            Let&apos;s create a new workspace
                        </h2>
                        <p className="text-gray-500 font-medium">
                            What would you like to name it?
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                Workspace Name
                            </Label>
                            <Input
                                autoFocus
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="text-xl bg-white/5 border-white/10 h-16 px-6 rounded-2xl text-white font-bold placeholder:text-gray-600 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 transition-all"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                Default Opportunity Value
                            </Label>
                            <div className="relative">
                                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    type="number"
                                    value={opportunityValue}
                                    onChange={(e) => setOpportunityValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="text-xl bg-white/5 border-white/10 h-16 pl-14 pr-6 rounded-2xl text-white font-bold placeholder:text-gray-600 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 transition-all"
                                    placeholder="5000"
                                />
                            </div>
                            <p className="text-xs text-gray-600 pl-1">
                                This value will be used for opportunity calculations
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400 hover:text-white hover:bg-white/5 h-12 px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !workspaceName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Workspace"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
