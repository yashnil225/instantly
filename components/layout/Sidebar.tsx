"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import {
    Mail,
    Inbox,
    BarChart2,
    Zap,
    CreditCard,
    Gift,
    Bell,
    HelpCircle,
    Globe,
    Settings,
    LogOut,
    ChevronRight,
    Sun,
    Moon,
    Monitor,
    MoreHorizontal,
    Flame
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,

} from "@/components/ui/dropdown-menu"


const NAV_ITEMS = [
    { name: "Campaigns", href: "/campaigns", icon: Mail },
    { name: "Unibox", href: "/unibox", icon: Inbox },
    { name: "CRM", href: "/crm", icon: Zap },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Accounts", href: "/accounts", icon: CreditCard },
]


interface SidebarProps {
    width?: number
    onResize?: (width: number) => void
}

export function Sidebar({ width = 240, onResize }: SidebarProps) {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const { data: session } = useSession()
    const [isResizing, setIsResizing] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {

            try {
                const res = await fetch('/api/notifications?limit=5')
                const data = await res.json()
                if (data.notifications) {
                    setNotifications(data.notifications)
                }
            } catch (e) {
                console.error("Failed to fetch notifications sidebar", e)
            }
        }
        fetchNotifications()
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    // Get user info from session
    const userName = session?.user?.name || "User"
    const userEmail = session?.user?.email || "user@example.com"
    const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" })
    }

    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        if (!onResize) return
        setIsResizing(true)
        const startX = mouseDownEvent.clientX
        const startWidth = width

        const doDrag = (dragEvent: MouseEvent) => {
            const newWidth = startWidth + dragEvent.clientX - startX
            if (newWidth >= 60 && newWidth <= 400) { // Min 60px, Max 400px
                onResize(newWidth)
            }
        }

        const stopDrag = () => {
            setIsResizing(false)
            document.removeEventListener('mousemove', doDrag)
            document.removeEventListener('mouseup', stopDrag)
            // Re-enable text selection and blocking if needed
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
        }

        document.addEventListener('mousemove', doDrag)
        document.addEventListener('mouseup', stopDrag)
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'
    }

    return (
        <div
            className="flex flex-col h-screen border-r border-border bg-card fixed left-0 top-0 z-50 transition-none"
            style={{ width: width }}
        >

            {/* Logo Area */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center">
                    <Logo size="md" />
                    <span className="ml-2 text-xl font-semibold text-foreground">Instantly</span>
                </div>
            </div>


            {/* Navigation */}
            <nav className="flex-1 py-6 px-2 md:px-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                                "hover:bg-secondary hover:text-foreground group",
                                isActive
                                    ? "bg-secondary text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 flex-shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="hidden md:block truncate">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile with Dropdown Menu */}
            <div className="relative p-2 border-t border-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "flex items-center rounded-lg p-2 transition-colors outline-none data-[state=open]:bg-secondary hover:bg-secondary",
                            width < 120 ? "justify-center w-full" : "gap-3 w-full"
                        )}>
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {userInitials}
                            </div>
                            {width >= 120 && (
                                <div className="overflow-hidden flex-1 text-left">
                                    <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[260px] bg-popover border-border text-popover-foreground p-0 overflow-hidden mb-2 ml-4 rounded-xl shadow-2xl"
                        align="start"
                        side="right"
                        sideOffset={10}
                        alignOffset={-10}
                    >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-border">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{userName}</p>
                                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                                </div>
                                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold border border-primary/20 whitespace-nowrap">
                                    Light Speed
                                </span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-1.5 space-y-0.5">
                            <DropdownMenuItem asChild>
                                <Link href="/invite" className="flex items-center gap-3 px-3 py-2 cursor-pointer focus:bg-secondary focus:text-foreground rounded-lg">
                                    <Gift className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Invite a Friend & Earn</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-secondary focus:text-foreground rounded-lg w-full outline-none hover:bg-secondary data-[state=open]:bg-secondary data-[state=open]:text-foreground">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Notifications</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                    className="w-[320px] bg-popover border-border text-popover-foreground p-0 overflow-hidden shadow-2xl ml-2 rounded-xl"
                                    sideOffset={10}
                                    alignOffset={-5}
                                >
                                    <div className="px-4 py-3 border-b border-[#2a2a2a] flex justify-between items-center bg-[#0f0f0f]">
                                        <span className="text-sm font-medium text-white">Notifications</span>
                                        <Link href="/notifications" className="text-xs text-blue-500 hover:text-blue-400 font-medium">View all</Link>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="text-gray-500 text-sm">You don't have any new notifications at this time.</span>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div key={n.id} className="p-3 border-b border-[#222] hover:bg-[#1f1f1f] transition-colors cursor-pointer group">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="font-medium text-white text-sm">{n.title}</div>
                                                        {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1" />}
                                                    </div>
                                                    <div className="text-xs text-gray-400 line-clamp-2 group-hover:text-gray-300 transition-colors">{n.message}</div>
                                                    <div className="text-[10px] text-gray-600 mt-2 flex justify-between items-center">
                                                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem asChild>
                                <Link href="/help" className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-[#2a2a2a] focus:text-white rounded-lg w-full">
                                    <div className="flex items-center gap-3">
                                        <HelpCircle className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm">Help Center</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-gray-600" />
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2 cursor-pointer focus:bg-[#2a2a2a] focus:text-white rounded-lg w-full outline-none hover:bg-[#2a2a2a] data-[state=open]:bg-[#2a2a2a] data-[state=open]:text-white">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm">Language</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-gray-600" />
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                    className="w-[180px] bg-[#161616] border-[#2a2a2a] text-gray-300 p-1 overflow-hidden shadow-2xl ml-2 rounded-xl"
                                    sideOffset={10}
                                    alignOffset={-5}
                                >
                                    {[
                                        { name: "English", id: "en" },
                                        { name: "Portuguese", id: "pt" },
                                        { name: "Spanish", id: "es" },
                                        { name: "German", id: "de" },
                                        { name: "French", id: "fr" }
                                    ].map((lang) => (
                                        <DropdownMenuItem
                                            key={lang.id}
                                            className="cursor-pointer hover:bg-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-300 focus:bg-[#2a2a2a] focus:text-white flex justify-between items-center group"
                                            onClick={() => { /* Placeholder for language switch */ }}
                                        >
                                            {lang.name}
                                            {/* Simulate 'English' being selected by default for UI correctness */}
                                            {lang.id === 'en' && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </div>

                        <div className="h-[1px] bg-border mx-3 my-1" />

                        {/* Theme Section */}
                        <div className="px-4 py-3 pb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-3">Theme</p>
                            <div className="bg-secondary p-1 rounded-lg border border-border grid grid-cols-3 gap-1">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all",
                                        theme === "light"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Light
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all",
                                        theme === "dark"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Dark
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={cn(
                                        "flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all",
                                        theme === "system"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    System
                                </button>
                            </div>
                        </div>

                        <div className="h-[1px] bg-border mx-3 my-1" />

                        {/* Settings & Logout */}
                        <div className="p-1.5 space-y-0.5">
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="flex items-center gap-3 px-3 py-2 cursor-pointer focus:bg-secondary focus:text-foreground rounded-lg">
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-3 py-2 cursor-pointer focus:bg-secondary focus:text-foreground rounded-lg text-muted-foreground hover:text-foreground w-full"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm">Logout</span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
