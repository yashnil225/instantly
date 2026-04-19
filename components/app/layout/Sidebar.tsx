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
    Moon
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
             <div className="relative p-3 border-t border-border/40 mt-auto">
                 <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                         <button className={cn(
                             "flex items-center rounded-2xl p-2.5 transition-all outline-none duration-300",
                             "data-[state=open]:bg-primary/10 data-[state=open]:shadow-inner data-[state=open]:ring-1 data-[state=open]:ring-primary/20",
                             "hover:bg-secondary/80 hover:shadow-sm group",
                             width < 120 ? "justify-center w-full" : "gap-3.5 w-full"
                         )}>
                             <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 shadow-lg shadow-primary/20 ring-2 ring-background group-hover:scale-105 transition-transform">
                                 {userInitials}
                             </div>
                             {width >= 120 && (
                                 <div className="overflow-hidden flex-1 text-left">
                                     <p className="text-[13px] font-black text-foreground truncate tracking-tight">{userName}</p>
                                     <p className="text-[11px] text-muted-foreground truncate font-bold opacity-60 tracking-tighter">{userEmail}</p>
                                 </div>
                             )}
                         </button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent
                         className="w-[280px] bg-card border-border/60 text-foreground p-0 overflow-hidden mb-3 ml-4 rounded-2xl shadow-2xl animate-in slide-in-from-left-2 duration-300"
                         align="start"
                         side="right"
                         sideOffset={14}
                         alignOffset={-14}
                     >
                         {/* User Info Header */}
                         <div className="px-5 py-4 bg-accent/5 border-b border-border/40 relative overflow-hidden group/header">
                             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                             <div className="flex items-center justify-between gap-3 relative z-10">
                                 <div className="flex flex-col gap-0.5">
                                     <p className="text-[15px] font-black text-foreground tracking-tight">{userName}</p>
                                     <p className="text-[11px] text-muted-foreground font-bold tracking-tighter opacity-70">{userEmail}</p>
                                 </div>
                                 <div className="flex flex-col items-end gap-1.5">
                                    <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full font-black border border-primary/20 whitespace-nowrap uppercase tracking-[0.05em] shadow-sm">
                                        Light Speed
                                    </span>
                                 </div>
                             </div>
                         </div>
 
                         {/* Menu Items */}
                         <div className="p-2 space-y-1">
                             <DropdownMenuItem asChild>
                                 <Link href="/invite" className="flex items-center gap-3 px-3 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-xl transition-all group/item">
                                     <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                                        <Gift className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                     </div>
                                     <span className="text-[13px] font-black tracking-tight">Invite & Earn</span>
                                 </Link>
                             </DropdownMenuItem>
                             <DropdownMenuSub>
                                 <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-xl w-full outline-none hover:bg-primary/5 data-[state=open]:bg-primary/5 data-[state=open]:text-primary group/item">
                                     <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                                            <Bell className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                         </div>
                                         <span className="text-[13px] font-black tracking-tight">Notifications</span>
                                     </div>
                                     <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                                 </DropdownMenuSubTrigger>
                                 <DropdownMenuSubContent
                                     className="w-[340px] bg-card border-border/60 text-foreground p-0 overflow-hidden shadow-2xl ml-3 rounded-2xl animate-in slide-in-from-left-2 duration-200"
                                     sideOffset={14}
                                     alignOffset={-5}
                                 >
                                     <div className="px-5 py-4 border-b border-border/40 flex justify-between items-center bg-accent/5">
                                         <span className="text-[14px] font-black tracking-tight uppercase">Activity</span>
                                         <Link href="/notifications" className="text-[11px] text-primary hover:underline font-black uppercase tracking-widest">View all</Link>
                                     </div>
                                     <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                                         {notifications.length === 0 ? (
                                             <div className="p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[200px]">
                                                 <div className="h-12 w-12 rounded-full bg-accent/30 flex items-center justify-center">
                                                    <Bell className="h-6 w-6 text-muted-foreground opacity-20" />
                                                 </div>
                                                 <span className="text-muted-foreground text-xs font-bold opacity-60">No recent activity.</span>
                                             </div>
                                         ) : (
                                             notifications.map((n) => (
                                                 <div key={n.id} className="p-4 border-b border-border/20 hover:bg-accent/30 transition-colors cursor-pointer group/notif relative">
                                                     <div className="flex justify-between items-start mb-1.5">
                                                         <div className="font-black text-[13px] tracking-tight">{n.title}</div>
                                                         {!n.read && <div className="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/40 mt-1" />}
                                                     </div>
                                                     <div className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed font-medium group-hover/notif:text-foreground transition-colors">{n.message}</div>
                                                     <div className="text-[10px] text-muted-foreground/40 mt-2.5 flex justify-between items-center font-bold uppercase tracking-tighter">
                                                         <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                                     </div>
                                                 </div>
                                             ))
                                         )}
                                     </div>
                                 </DropdownMenuSubContent>
                             </DropdownMenuSub>
                             <DropdownMenuItem asChild>
                                 <Link href="/help" className="flex items-center justify-between px-3 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-xl w-full group/item">
                                     <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                                            <HelpCircle className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                         </div>
                                         <span className="text-[13px] font-black tracking-tight">Help Center</span>
                                     </div>
                                     <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                                 </Link>
                             </DropdownMenuItem>
                             <DropdownMenuSub>
                                 <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-xl w-full outline-none hover:bg-primary/5 data-[state=open]:bg-primary/5 data-[state=open]:text-primary group/item">
                                     <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                                            <Globe className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                         </div>
                                         <span className="text-[13px] font-black tracking-tight">Language</span>
                                     </div>
                                     <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                                 </DropdownMenuSubTrigger>
                                 <DropdownMenuSubContent
                                     className="w-[200px] bg-card border-border/60 text-foreground p-1.5 overflow-hidden shadow-2xl ml-3 rounded-2xl animate-in slide-in-from-left-2 duration-200"
                                     sideOffset={14}
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
                                             className="cursor-pointer hover:bg-accent focus:bg-primary/5 focus:text-primary rounded-xl px-4 py-2.5 text-[13px] font-black tracking-tight flex justify-between items-center group/lang"
                                             onClick={() => { /* Placeholder for language switch */ }}
                                         >
                                             {lang.name}
                                             {lang.id === 'en' && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-sm shadow-primary/30" />}
                                         </DropdownMenuItem>
                                     ))}
                                 </DropdownMenuSubContent>
                             </DropdownMenuSub>
                         </div>
 
                         <div className="h-px bg-border/40 mx-4 my-1.5" />
 
                         {/* Theme Section */}
                         <div className="px-5 py-4 pb-3">
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-4 opacity-70 px-1">Appearance</p>
                             <div className="flex gap-2.5 p-1.5 bg-accent/20 rounded-2xl border border-border/30">
                                 <button
                                     onClick={() => setTheme("light")}
                                     className={cn(
                                         "flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                                         theme === "light"
                                             ? "bg-background text-primary shadow-xl shadow-primary/10 ring-1 ring-border/20 scale-100"
                                             : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                                     )}
                                 >
                                     <Sun className={cn("h-4 w-4", theme === "light" ? "fill-primary/10" : "")} />
                                     Light
                                 </button>
                                 <button
                                     onClick={() => setTheme("dark")}
                                     className={cn(
                                         "flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                                         theme === "dark"
                                             ? "bg-background text-primary shadow-xl shadow-primary/10 ring-1 ring-border/20 scale-100"
                                             : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                                     )}
                                 >
                                     <Moon className={cn("h-4 w-4", theme === "dark" ? "fill-primary/10" : "")} />
                                     Dark
                                 </button>
                             </div>
                         </div>
 
                         <div className="h-px bg-border/40 mx-4 my-1.5" />
 
                         {/* Settings & Logout */}
                         <div className="p-2 space-y-1">
                             <DropdownMenuItem asChild>
                                 <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-xl group/item">
                                     <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                                        <Settings className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                     </div>
                                     <span className="text-[13px] font-black tracking-tight">Settings</span>
                                 </Link>
                             </DropdownMenuItem>
                             <DropdownMenuItem
                                 onClick={handleLogout}
                                 className="flex items-center gap-3 px-3 py-2.5 cursor-pointer focus:bg-destructive/5 focus:text-destructive rounded-xl w-full group/item"
                             >
                                 <div className="h-8 w-8 rounded-lg bg-destructive/5 flex items-center justify-center group-hover/item:bg-destructive/10 transition-colors">
                                    <LogOut className="h-4 w-4 text-destructive opacity-70 group-hover/item:opacity-100 transition-opacity" />
                                 </div>
                                 <span className="text-[13px] font-black tracking-tight">Logout</span>
                             </DropdownMenuItem>
                         </div>
                     </DropdownMenuContent>
                 </DropdownMenu>
             </div>

        </div>
    )
}
