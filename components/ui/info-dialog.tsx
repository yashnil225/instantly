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
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-popover-foreground">{title}</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                <div className="text-popover-foreground/80 space-y-2">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}
