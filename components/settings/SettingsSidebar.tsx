"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
    User,
    Building2,
    Users,
    Tag,
    Globe,
    Shield,
    ScrollText,
    CreditCard
} from "lucide-react"

const sidebarItems = [
    {
        title: "Billing & Usage",
        href: "/settings/billing",
        icon: CreditCard,
        disabled: true
    },
    {
        title: "Account & Settings",
        href: "/settings/profile", // Default to profile if "Account & Settings" is clicked usually means a group, but per design it's a tab link or section.
        // Actually, looking at screenshot 1, "Account & Settings" is the active Tab in a top bar, and the sidebar is "Profile", "Workspace", etc.
        // Wait, screenshot 3 shows "Settings" > Top Tabs (Billing, Account & Settings, Preferences...) > Sidebar (Profile, Workspace & members, etc.)
        // So this sidebar sits INSIDE "Account & Settings" top tab.
        activeMatch: "/settings"
    }
]

// Based on Screenshot 3:
// Left Sidebar items:
// - Profile
// - Workspace & members
// - Workspace Group
// - Lead Labels
// - Custom Tags
// - Website Visitors
// - Agency
// - Audit Logs

const settingsNavItems = [
    { title: "Profile", href: "/settings#profile", icon: User },
    { title: "Workspace & members", href: "/settings#workspace", icon: Users },
    { title: "Workspace Group", href: "/settings#groups", icon: Building2 }, // Enabled
    { title: "Lead Labels", href: "/settings#labels", icon: Tag }, // Enabled
    { title: "Custom Tags", href: "/settings#tags", icon: Tag }, // Enabled
    { title: "Website Visitors", href: "/settings#visitors", icon: Globe, disabled: true },
    { title: "Agency", href: "/settings#agency", icon: Shield }, // Enabled
    { title: "Audit Logs", href: "/settings#logs", icon: ScrollText }, // Enabled
]

export function SettingsSidebar() {
    const pathname = usePathname()
    // Simple state to track active hash if we are on the single page
    // In a real implementation this would listen to scroll events or receive context
    // For now we rely on the URL hash or simple matching
    const [activeHash, setActiveHash] = useState("")

    useEffect(() => {
        const handleHashChange = () => {
            setActiveHash(window.location.hash)
        }
        window.addEventListener("hashchange", handleHashChange)

        // Initial check
        if (window.location.hash) setActiveHash(window.location.hash)
        else if (pathname === "/settings") setActiveHash("#profile") // Default

        return () => window.removeEventListener("hashchange", handleHashChange)
    }, [pathname])

    // Effect to highlight based on scroll (Simulated/Basic)
    useEffect(() => {
        if (pathname !== "/settings" && !pathname.startsWith("/settings/profile")) return // Only runs on main settings page

        const handleScroll = () => {
            const sections = settingsNavItems.map(item => item.href.split('#')[1])
            for (const section of sections) {
                const element = document.getElementById(section)
                if (element) {
                    const rect = element.getBoundingClientRect()
                    if (rect.top >= 0 && rect.top <= 300) {
                        setActiveHash(`#${section}`)
                        break
                    }
                }
            }
        }

        // We need to attach this to the scrollable container, which is in layout.tsx
        // But we don't have direct ref access. We can attach to window for global or find the container.
        // The container has class "overflow-y-auto" in layout.
        const container = document.querySelector('.overflow-y-auto.p-8') // brittle selector but practical
        if (container) {
            container.addEventListener('scroll', handleScroll)
            return () => container.removeEventListener('scroll', handleScroll)
        }
    }, [pathname])

    const isOnePageMode = pathname === "/settings" || pathname.startsWith("/settings/profile")

    return (
        <nav className="w-64 space-y-1">
            {settingsNavItems.map((item) => {
                const isHashLink = item.href.includes("#")

                // Active logic:
                // If one page mode, check hash
                // Else check pathname match
                let isActive = false
                if (isOnePageMode && isHashLink) {
                    const itemHash = item.href.split("#")[1]
                    const currentHash = activeHash.replace("#", "") || "profile"
                    isActive = currentHash === itemHash
                } else {
                    isActive = pathname === item.href
                }

                return (
                    <Link
                        key={item.title}
                        href={isOnePageMode && isHashLink ? item.href : item.href} // Always use the href defined
                        onClick={() => {
                            if (isOnePageMode && isHashLink) {
                                setActiveHash(item.href.split("#")[1]) // Instant update
                            }
                        }}
                        className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            isActive
                                ? "bg-secondary text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                            item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                        )}
                    >
                        <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-blue-500" : "text-muted-foreground group-hover:text-foreground")} />
                        {item.title}
                    </Link>
                )
            })}
        </nav>
    )
}
