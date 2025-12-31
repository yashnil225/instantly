"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
    className?: string
    iconClassName?: string
    size?: "sm" | "md" | "lg" | "xl"
    variant?: "circle" | "icon"
}

export function Logo({
    className,
    iconClassName,
    size = "md",
    variant = "circle"
}: LogoProps) {
    const { theme, resolvedTheme } = useTheme()
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
    }

    const iconSizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
    }

    if (!mounted) return <div className={cn(sizeClasses[size], className)} />

    const isDarkMode = resolvedTheme === "dark"

    // Logic based on user request:
    // "if the background is black then black and if whit then blue as shown in the image"
    // Interpretation: 
    // - On white background: Logo is Blue (Blue circle, white bolt).
    // - On black background: Logo is "Black"? (Maybe they meant white or a specific dark themed version).
    // Given the image, the 'blue' version is the circle one.

    if (variant === "icon") {
        return (
            <Zap
                className={cn(
                    iconSizeClasses[size],
                    isDarkMode ? "text-foreground fill-none" : "text-blue-500 fill-blue-500",
                    iconClassName
                )}
            />
        )
    }

    return (
        <div className={cn(
            "relative flex items-center justify-center transition-opacity",
            sizeClasses[size],
            className
        )}>
            <img
                src="/logo.svg"
                alt="Instantly Logo"
                className={cn("w-full h-full object-contain", iconClassName)}
            />
        </div>
    )
}
