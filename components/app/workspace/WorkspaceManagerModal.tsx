"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, DollarSign } from "lucide-react"

interface WorkspaceManagerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'rename'
    workspace?: {
        id: string
        name: string
        opportunityValue?: number
    } | null
    onSubmit: (name: string, opportunityValue?: number) => Promise<boolean>
}

export function WorkspaceManagerModal({
    open,
    onOpenChange,
    mode,
    workspace,
    onSubmit
}: WorkspaceManagerModalProps) {
    const { toast } = useToast()
    const [name, setName] = useState("")
    const [opportunityValue, setOpportunityValue] = useState("5000")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reset form when modal opens or workspace changes
    useEffect(() => {
        if (open) {
            if (mode === 'rename' && workspace) {
                setName(workspace.name)
                setOpportunityValue(workspace.opportunityValue?.toString() || "5000")
            } else {
                setName("")
                setOpportunityValue("5000")
            }
        }
    }, [open, mode, workspace])

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast({
                title: "Error",
                description: "Workspace name is required",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)
        try {
            const success = await onSubmit(
                name.trim(),
                mode === 'create' ? parseFloat(opportunityValue) || 5000 : undefined
            )

            if (success) {
                toast({
                    title: "Success",
                    description: mode === 'create'
                        ? `Workspace "${name}" created successfully`
                        : `Workspace renamed to "${name}"`
                })
                onOpenChange(false)
            } else {
                toast({
                    title: "Error",
                    description: mode === 'create'
                        ? "Failed to create workspace"
                        : "Failed to rename workspace",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const title = mode === 'create'
        ? "Let's create a new workspace"
        : "Rename workspace"

    const description = mode === 'create'
        ? "What would you like to name it?"
        : "What would you like to rename it to?"

    const buttonText = mode === 'create'
        ? "Create Workspace"
        : "Rename Workspace"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0c0c10] border-white/10 sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] shadow-2xl backdrop-blur-xl">
                <div className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                </div>
                <div className="p-10 space-y-10">
                    <div className="space-y-4 text-center">
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            {title}
                        </h2>
                        <p className="text-gray-500 font-medium">
                            {description}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                Workspace Name
                            </Label>
                            <Input
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="text-xl bg-white/5 border-white/10 h-16 px-6 rounded-2xl text-white font-bold placeholder:text-gray-600 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 transition-all"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        {mode === 'create' && (
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
                        )}
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
                            onClick={handleSubmit}
                            disabled={isSubmitting || !name.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {mode === 'create' ? 'Creating...' : 'Renaming...'}
                                </>
                            ) : (
                                buttonText
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
