"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Menu,
    X,
    LayoutDashboard,
    Mail,
    Send,
    Users,
    BarChart3,
    Inbox,
    Flame,
    Settings,
    LogOut,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/accounts", label: "Accounts", icon: Mail },
    { href: "/campaigns", label: "Campaigns", icon: Send },
    { href: "/leads", label: "Leads", icon: Users },
    { href: "/unibox", label: "Unibox", icon: Inbox },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/warmup", label: "Warmup", icon: Flame },
    { href: "/crm", label: "CRM", icon: Users },
]

const SETTINGS_ITEMS = [
    { href: "/settings/profile", label: "Profile", icon: Settings },
    { href: "/settings/workspaces", label: "Workspaces", icon: Zap },
]

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background border-r border-border p-0">
                <SheetHeader className="p-4 border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Instantly</span>
                    </SheetTitle>
                </SheetHeader>

                <nav className="p-4 space-y-1">
                    {NAV_ITEMS.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                pathname === item.href || pathname.startsWith(item.href + "/")
                                    ? "bg-blue-600/10 text-blue-500"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-border mx-4" />

                <nav className="p-4 space-y-1">
                    <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Settings
                    </p>
                    {SETTINGS_ITEMS.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-blue-600/10 text-blue-500"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                            import("next-auth/react").then(({ signOut }) => {
                                signOut({ callbackUrl: "/login" })
                            })
                        }}
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// Responsive table wrapper for mobile
export function ResponsiveTable({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0", className)}>
            <div className="min-w-[800px] md:min-w-0">
                {children}
            </div>
        </div>
    )
}

// Mobile card view for data that's usually in tables
interface MobileCardProps {
    title: string
    subtitle?: string
    status?: React.ReactNode
    stats?: { label: string; value: string | number }[]
    actions?: React.ReactNode
    onClick?: () => void
}

export function MobileDataCard({ title, subtitle, status, stats, actions, onClick }: MobileCardProps) {
    return (
        <div
            className={cn(
                "p-4 rounded-xl border border-border bg-card",
                onClick && "cursor-pointer hover:border-blue-600/50 transition-colors"
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{title}</h3>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
                    )}
                </div>
                {status}
            </div>

            {stats && stats.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {stats.map(stat => (
                        <div key={stat.label}>
                            <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                            <p className="text-sm font-medium">{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {actions && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {actions}
                </div>
            )}
        </div>
    )
}
