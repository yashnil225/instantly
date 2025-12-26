"use client"

import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <ToastProvider>
            {toasts.map(function ({ id, title, description, action, variant, ...props }) {
                // Determine icon based on variant or title content
                const isSuccess = title?.toString().toLowerCase().includes("success") ||
                    description?.toString().toLowerCase().includes("success") ||
                    title?.toString().toLowerCase().includes("duplicated") ||
                    title?.toString().toLowerCase().includes("copied") ||
                    title?.toString().toLowerCase() === "campaign created"

                const isError = variant === "destructive" ||
                    title?.toString().toLowerCase().includes("error") ||
                    title?.toString().toLowerCase().includes("failed")

                return (
                    <Toast key={id} variant={variant} {...props} className="w-auto min-w-[300px] justify-center gap-3 py-3 px-6">
                        {isSuccess && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                        {isError && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}

                        <div className="grid gap-0.5 text-center sm:text-left">
                            {title && <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>}
                            {description && (
                                <ToastDescription className={cn("text-xs text-gray-400 font-normal", !title && "text-sm text-white")}>
                                    {description}
                                </ToastDescription>
                            )}
                        </div>
                        {action}
                        <ToastClose className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2" />
                    </Toast>
                )
            })}
            <ToastViewport />
        </ToastProvider>
    )
}
