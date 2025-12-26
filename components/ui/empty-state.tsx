
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#333] bg-[#0f0f0f]">
            <div className="h-16 w-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                <Icon className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-400 max-w-sm mb-8">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
