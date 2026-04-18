"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
    className?: string
    iconClassName?: string
    size?: "sm" | "md" | "lg" | "xl"
    /** @deprecated No longer changes rendering; kept for API compatibility */
    variant?: "circle" | "icon"
}

const sizeMap = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
}


export function Logo({
    className,
    iconClassName,
    size = "md",
}: LogoProps) {
    const px = sizeMap[size]

    return (
        <Image
            src="/images/logo.png"
            alt="Instantly"
            width={px}
            height={px}
            className={cn("object-contain", iconClassName, className)}
            priority
        />
    )
}
