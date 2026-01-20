"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function SettingsTopNav() {
    const pathname = usePathname()

    // Helper to check active state
    // "Account & Settings" is active for /settings/profile, /settings/workspace, etc.
    // "Billing & Usage" is active for /settings/billing
    // Default to handling specific prefixes

    const isBilling = pathname.startsWith("/settings/billing")
    const isAccount = !isBilling && !pathname.startsWith("/settings/preferences") && !pathname.startsWith("/settings/integrations") && !pathname.startsWith("/settings/blocklist") && !pathname.startsWith("/settings/deliverability")
    // Basically "Account" is the default catch-all for the sub-pages like profile/workspace unless it's one of the other top tabs.
    // Or simpler: Account is active if pathname is /settings or /settings/profile or /settings/workspace or /settings/groups...

    return (
        <div className="flex gap-8 text-sm font-medium">
            <Link
                href="/settings/billing"
                className={cn(
                    "pb-3 transition-colors",
                    pathname.startsWith("/settings/billing")
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Billing & Usage
            </Link>
            <Link
                href="/settings/profile"
                className={cn(
                    "pb-3 transition-colors",
                    // Active for profile, workspace, groups, labels, tags, agency, logs, visitors
                    // or just checking if it is NOT the others
                    (pathname === "/settings" || pathname.startsWith("/settings/profile") || pathname.startsWith("/settings/workspace") || pathname.startsWith("/settings/groups") || pathname.startsWith("/settings/labels") || pathname.startsWith("/settings/tags") || pathname.startsWith("/settings/agency") || pathname.startsWith("/settings/logs"))
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Account & Settings
            </Link>
            <Link
                href="/settings/preferences"
                className={cn(
                    "pb-3 transition-colors",
                    pathname.startsWith("/settings/preferences")
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Preferences
            </Link>
            <Link
                href="/settings/integrations"
                className={cn(
                    "pb-3 transition-colors",
                    pathname.startsWith("/settings/integrations")
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Integrations
            </Link>
            <Link
                href="/settings/blocklist"
                className={cn(
                    "pb-3 transition-colors",
                    pathname.startsWith("/settings/blocklist")
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Blocklist
            </Link>
            <Link
                href="/settings/deliverability"
                className={cn(
                    "pb-3 transition-colors flex items-center gap-2",
                    pathname.startsWith("/settings/deliverability")
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Advanced Deliverability
                <span className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded font-bold">New</span>
            </Link>
        </div>
    )
}
