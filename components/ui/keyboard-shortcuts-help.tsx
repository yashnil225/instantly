"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Command, CornerDownLeft, ArrowUp, ArrowDown, ArrowLeft, Star, Archive, Trash2, Mail, MailOpen } from "lucide-react"

interface KeyboardShortcutsHelpProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
    const shortcuts = [
        {
            category: "Composition",
            items: [
                { key: "c", description: "Compose new message (Coming soon)" },
                { key: "r", description: "Reply" },
                { key: "a", description: "Reply all (Coming soon)" },
                { key: "f", description: "Forward" },
                { key: "Ctrl + Enter", description: "Send message" },
            ]
        },
        {
            category: "Actions",
            items: [
                { key: "e", description: "Archive", icon: Archive },
                { key: "#", description: "Delete", icon: Trash2 },
                { key: "s", description: "Toggle star", icon: Star },
                // { key: "Shift + i", description: "Mark as read", icon: MailOpen },
                // { key: "Shift + u", description: "Mark as unread", icon: Mail },
            ]
        },
        {
            category: "Navigation",
            items: [
                { key: "j", description: "Next email", icon: ArrowDown },
                { key: "k", description: "Previous email", icon: ArrowUp },
                { key: "u", description: "Back to list / Unselect", icon: ArrowLeft },
                { key: "/", description: "Focus search" },
            ]
        }
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-popover border-border text-popover-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Command className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-8 mt-4">
                    {shortcuts.map((section) => (
                        <div key={section.category}>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((item) => (
                                    <div key={item.key} className="flex items-center justify-between text-sm">
                                        <span className="text-popover-foreground flex items-center gap-2">
                                            {item.description}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {item.key.split(' ').map((k, i) => (
                                                <kbd
                                                    key={i}
                                                    className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-secondary px-1.5 font-mono text-[10px] font-medium text-popover-foreground opacity-100"
                                                >
                                                    {k}
                                                </kbd>
                                            ))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
