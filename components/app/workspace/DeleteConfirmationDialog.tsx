"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeleteConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspace: {
        id: string
        name: string
        isDefault?: boolean
        _count?: {
            campaignWorkspaces?: number
            members?: number
        }
    } | null
    onConfirm: () => Promise<boolean>
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    workspace,
    onConfirm
}: DeleteConfirmationDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    if (!workspace) return null

    const handleConfirm = async () => {
        if (workspace.isDefault) return

        setIsDeleting(true)
        try {
            const success = await onConfirm()
            if (success) {
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Delete failed:", error)
        } finally {
            setIsDeleting(false)
        }
    }

    const campaignCount = workspace._count?.campaignWorkspaces || 0
    const memberCount = workspace._count?.members || 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-[#333] text-white">
                <DialogHeader className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold">
                        Delete Workspace
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-400">
                        Are you sure you want to delete <span className="text-white font-semibold">&ldquo;{workspace.name}&rdquo;</span>?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {workspace.isDefault ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <X className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-500">Cannot Delete Default Workspace</p>
                                    <p className="text-sm text-yellow-500/80 mt-1">
                                        Default workspaces cannot be deleted. Please create a new workspace first.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <p className="font-semibold text-red-400 mb-2">Warning</p>
                                <p className="text-sm text-red-400/80">
                                    This will permanently delete the workspace and all associated data.
                                    This action cannot be undone.
                                </p>
                            </div>

                            {(campaignCount > 0 || memberCount > 0) && (
                                <div className="bg-[#111] border border-[#333] rounded-lg p-4 space-y-2">
                                    <p className="text-sm font-semibold text-gray-400">This workspace contains:</p>
                                    <div className="space-y-1">
                                        {campaignCount > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Campaigns</span>
                                                <span className="text-white font-medium">{campaignCount}</span>
                                            </div>
                                        )}
                                        {memberCount > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Members</span>
                                                <span className="text-white font-medium">{memberCount}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                        All campaigns exclusive to this workspace will be deleted.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="flex gap-3 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="flex-1 bg-transparent border-[#333] text-white hover:bg-white/5 h-11"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isDeleting || workspace.isDefault}
                        className={cn(
                            "flex-1 h-11",
                            workspace.isDefault
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                        )}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Workspace
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
