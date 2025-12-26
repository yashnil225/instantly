import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface InfoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    children: React.ReactNode
}

export function InfoDialog({
    open,
    onOpenChange,
    title,
    children
}: InfoDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">{title}</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 text-gray-400 hover:text-white"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                <div className="text-gray-300 space-y-2">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}
