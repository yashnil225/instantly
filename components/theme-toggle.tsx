"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9">
                <Sun className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                >
                    {resolvedTheme === "dark" ? (
                        <Moon className="h-4 w-4" />
                    ) : (
                        <Sun className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="cursor-pointer focus:bg-[#2a2a2a] focus:text-white gap-2"
                >
                    <Sun className="h-4 w-4" />
                    Light
                    {theme === "light" && <span className="ml-auto text-blue-500">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="cursor-pointer focus:bg-[#2a2a2a] focus:text-white gap-2"
                >
                    <Moon className="h-4 w-4" />
                    Dark
                    {theme === "dark" && <span className="ml-auto text-blue-500">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="cursor-pointer focus:bg-[#2a2a2a] focus:text-white gap-2"
                >
                    <Monitor className="h-4 w-4" />
                    System
                    {theme === "system" && <span className="ml-auto text-blue-500">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// Simple toggle button (no dropdown)
export function ThemeToggleSimple() {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
            {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
