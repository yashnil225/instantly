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
    CreditCard,
    Key
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
    { title: "Developer API", href: "/settings/integrations#keys", icon: Key }, // Enabled
    { title: "Website Visitors", href: "/settings#visitors", icon: Globe, disabled: true },
    { title: "Agency", href: "/settings#agency", icon: Shield }, // Enabled
    { title: "Audit Logs", href: "/settings#logs", icon: ScrollText }, // Enabled
]

const integrationsNavItems: { title: string; href: string; icon: any; disabled?: boolean }[] = [
    { title: "Integrations", href: "/settings/integrations#integrations", icon: Globe },
    { title: "Webhooks", href: "/settings/integrations#webhooks", icon: ScrollText },
    { title: "API Keys", href: "/settings/integrations#keys", icon: Key },
]

export function SettingsSidebar() {
    const pathname = usePathname()
    const [activeHash, setActiveHash] = useState("")

    const isIntegrations = pathname.startsWith("/settings/integrations")
    const navItems = isIntegrations ? integrationsNavItems : settingsNavItems

    useEffect(() => {
        const handleHashChange = () => {
            setActiveHash(window.location.hash)
        }
        window.addEventListener("hashchange", handleHashChange)

        if (window.location.hash) setActiveHash(window.location.hash)
        else {
            if (isIntegrations) setActiveHash("#integrations")
            else if (pathname === "/settings") setActiveHash("#profile")
        }

        return () => window.removeEventListener("hashchange", handleHashChange)
    }, [pathname, isIntegrations])

    // Effect to highlight based on scroll (Simulated/Basic)
    useEffect(() => {
        if (!pathname.startsWith("/settings")) return

        const handleScroll = () => {
            const sections = navItems.map(item => item.href.split('#')[1])
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

        const container = document.querySelector('.overflow-y-auto.p-8')
        if (container) {
            container.addEventListener('scroll', handleScroll)
            return () => container.removeEventListener('scroll', handleScroll)
        }
    }, [pathname, navItems])

    const isOnePageMode = pathname === "/settings" || pathname.startsWith("/settings/profile") || isIntegrations

    return (
        <nav className="w-64 space-y-1">
            {navItems.map((item) => {
                const isHashLink = item.href.includes("#")
                const itemHash = isHashLink ? item.href.split("#")[1] : ""

                let isActive = false
                if (isOnePageMode && isHashLink) {
                    const currentHash = activeHash.replace("#", "") || (isIntegrations ? "integrations" : "profile")
                    isActive = currentHash === itemHash
                } else {
                    isActive = pathname === item.href
                }

                return (
                    <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => {
                            if (isOnePageMode && isHashLink) {
                                setActiveHash(`#${itemHash}`)
                            }
                        }}
                        className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            isActive
                                ? "bg-[#1a1a1a] text-white"
                                : "text-gray-400 hover:text-white hover:bg-[#111]",
                            item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                        )}
                    >
                        <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-blue-500" : "text-gray-500")} />
                        {item.title}
                    </Link>
                )
            })}
        </nav>
    )
}
