"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
    className?: string
    iconClassName?: string
    size?: "sm" | "md" | "lg" | "xl" | "sidebar"
    variant?: "circle" | "icon"
    showText?: boolean
    style?: React.CSSProperties
}

// --- High-Fidelity Instantly.ai Logo Path ---
export function Logo({
    className,
    size = "md",
    style
}: LogoProps) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
        xl: "h-12 w-12",
        sidebar: "h-[35px] w-auto" // Typically logos need auto width so they aren't squished
    }

    if (!mounted) return <div className={cn(sizeClasses[size === "sidebar" ? "sidebar" : size], className)} style={style} />

    return (
        <img 
            src="/favicon.ico" 
            alt="Instantly Logo" 
            className={cn(sizeClasses[size === "sidebar" ? "sidebar" : size], className)}
            style={style}
        />
    )
}
