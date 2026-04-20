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
const InstantlyBoltPath = () => (
    <path d="M276.12 438.81h-101.8c-3.58 0-5.83-3.87-4.05-6.98l163.07-284.97h238.63c3.87 0 6.06 4.44 3.69 7.51L459.07 305.59c-2.36 3.07-.18 7.51 3.69 7.51h124.51c4.2 0 6.26 5.11 3.23 8.02L235.8 662.51c-3.37 3.24-8.88.06-7.76-4.48l52.61-213.45c.72-2.93-1.5-5.77-4.53-5.77z" fill="currentColor" />
)

export function Logo({
    className,
    iconClassName,
    size = "md",
    variant = "circle",
    showText = false,
    style
}: LogoProps) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
        xl: "h-12 w-12",
        sidebar: "h-[35px] w-[35px]"
    }

    const iconSizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
        sidebar: "h-[20px] w-[20px]"
    }

    if (!mounted) return <div className={cn(sizeClasses[size === "sidebar" ? "sidebar" : size], className)} style={style} />

    const isDarkMode = resolvedTheme === "dark"

    if (variant === "icon") {
        return (
            <svg 
                viewBox="0 0 766.8 766.8" 
                className={cn(
                    iconSizeClasses[size === "sidebar" ? "sidebar" : size],
                    isDarkMode ? "text-foreground" : "text-blue-500",
                    iconClassName
                )}
                style={style}
            >
                <InstantlyBoltPath />
            </svg>
        )
    }

    return (
        <div 
            className={cn(
                "flex items-center justify-center rounded-full transition-colors",
                sizeClasses[size === "sidebar" ? "sidebar" : size],
                !isDarkMode ? "bg-[#0081ff]" : "bg-foreground",
                className
            )}
            style={style}
        >
            <svg 
                viewBox="0 0 766.8 766.8" 
                className={cn(
                    "w-[60%] h-[60%]", // Scaling the bolt inside the circle
                    !isDarkMode ? "text-white" : "text-background",
                    iconClassName
                )}
            >
                <InstantlyBoltPath />
            </svg>
        </div>
    )
}
