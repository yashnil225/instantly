"use client"

import { usePathname } from "next/navigation"
import { SettingsSidebar } from "./SettingsSidebar"

export function SettingsSidebarController() {
    const pathname = usePathname()

    // Only show sidebar on the main settings page (Account & Settings)
    // or if the path is explicitly /settings or /settings/integrations
    const showSidebar = pathname === "/settings" || pathname === "/settings/" || pathname.startsWith("/settings/integrations")

    if (!showSidebar) return null

    return (
        <div className="w-64 border-r border-border py-6 overflow-y-auto hidden md:block">
            <SettingsSidebar />
        </div>
    )
}
