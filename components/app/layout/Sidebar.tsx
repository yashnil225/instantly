"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import {
    ChevronRight,
    MessageSquare,
    LifeBuoy
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"


// --- High-Fidelity Sidebar Navigation Icons (Phosphor Style) ---

const CopilotIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M229.5,113,166.06,89.94,143,26.5a16,16,0,0,0-30,0L89.94,89.94,26.5,113a16,16,0,0,0,0,30l63.44,23.07L113,229.5a16,16,0,0,0,30,0l23.07-63.44L229.5,143a16,16,0,0,0,0-30ZM157.08,152.3a8,8,0,0,0-4.78,4.78L128,223.9l-24.3-66.82a8,8,0,0,0-4.78-4.78L32.1,128l66.82-24.3a8,8,0,0,0,4.78-4.78L128,32.1l24.3,66.82a8,8,0,0,0,4.78,4.78L223.9,128Z" />
    </svg>
)

const AIAgentsIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path fill="none" stroke="currentColor" strokeWidth="2" d="M14,4 C14,5.1048 13.1048,6 12,6 C10.8952,6 10,5.1048 10,4 C10,2.8952 10.8952,2 12,2 C13.1048,2 14,2.8952 14,4 Z M14,20 C14,21.1048 13.1048,22 12,22 C10.8952,22 10,21.1048 10,20 C10,18.8952 10.8952,18 12,18 C13.1048,18 14,18.8952 14,20 Z M7,8 C7,9.1048 6.1048,10 5,10 C3.8952,10 3,9.1048 3,8 C3,6.8952 3.8952,6 5,6 C6.1048,6 7,6.8952 7,8 Z M7,16 C7,17.1048 6.1048,18 5,18 C3.8952,18 3,17.1048 3,16 C3,14.8952 3.8952,14 5,14 C6.1048,14 7,14.8952 7,16 Z M21,8 C21,9.1048 20.1048,10 19,10 C17.8952,10 17,9.1048 17,8 C17,6.8952 17.8952,6 19,6 C20.1048,6 21,6.8952 21,8 Z M21,16 C21,17.1048 20.1048,18 19,18 C17.8952,18 17,17.1048 17,16 C17,14.8952 17.8952,14 19,14 C20.1048,14 21,14.8952 21,16 Z" />
    </svg>
)

const LeadFinderIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 2C15.968 2 20 6.032 20 11C20 15.968 15.968 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2ZM11 18C14.8675 18 18 14.8675 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18ZM19.4853 18.0711L22.3137 20.8995L20.8995 22.3137L18.0711 19.4853L19.4853 18.0711Z" />
    </svg>
)

const AccountsIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

const CampaignsIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.7267 2.95694L16.2734 22.0432C16.1225 22.5716 15.7979 22.5956 15.5563 22.1126L11 13L1.9229 9.36919C1.41322 9.16532 1.41953 8.86022 1.95695 8.68108L21.0432 2.31901C21.5716 2.14285 21.8747 2.43866 21.7267 2.95694ZM19.0353 5.09647L6.81221 9.17085L12.4488 11.4255L15.4895 17.5068L19.0353 5.09647Z" />
    </svg>
)

const UniboxIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 8.268a2 2 0 0 1 1 1.732v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2h3" />
        <path d="M5 15.734a2 2 0 0 1 -1 -1.734v-8a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-3" />
    </svg>
)

const AnalyticsIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M450 128a46 46 0 0 0-44.11 59l-71.37 71.36a45.88 45.88 0 0 0-29 0l-52.91-52.91a46 46 0 1 0-89.12 0L75 293.88A46.08 46.08 0 1 0 106.11 325l87.37-87.36a45.85 45.85 0 0 0 29 0l52.92 52.92a46 46 0 1 0 89.12 0L437 218.12A46 46 0 1 0 450 128z" />
    </svg>
)

const CRMIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M848 359.3H627.7L825.8 109c4.1-5.3.4-13-6.3-13H436c-2.8 0-5.5 1.5-6.9 4L170 547.5c-3.1 5.3.7 12 6.9 12h174.4l-89.4 357.6c-1.9 7.8 7.5 13.3 13.3 7.7L853.5 373c5.2-4.9 1.7-13.7-5.5-13.7zM378.2 732.5l60.3-241H281.1l189.6-327.4h224.6L487 427.4h211L378.2 732.5z" />
    </svg>
)

const WebsiteVisitorsIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.95 9.01c3.02 .739 5.05 2.123 5.05 3.714c0 2.367 -4.48 4.276 -10 4.276s-10 -1.909 -10 -4.276c0 -1.59 2.04 -2.985 5.07 -3.724" />
        <path d="M7 9c0 1.105 2.239 2 5 2s5 -.895 5 -2v-.035c0 -2.742 -2.239 -4.965 -5 -4.965s-5 2.223 -5 4.965v.035" />
        <path d="M15 17l2 3" />
        <path d="M8.5 17l-1.5 3" />
        <path d="M12 14h.01" />
        <path d="M7 13h.01" />
        <path d="M17 13h.01" />
    </svg>
)

const InboxPlacementIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
    </svg>
)

const AutomationIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="8" height="8" x="3" y="3" rx="2" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="8" x="13" y="13" rx="2" />
    </svg>
)

// --- Profile Dropdown SVGs (Phosphor Style) ---

const InviteIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M216,72H180V64a40,40,0,0,0-80,0v8H40A16,16,0,0,0,24,88v96a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM116,64a24,24,0,0,1,48,0v8H116ZM216,184H40V88H80v8a8,8,0,0,0,16,0V88h64v8a8,8,0,0,0,16,0V88h40v96Z" />
    </svg>
)

const WhatsNewIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M224,128a96,96,0,1,1-96-96A96.11,96.11,0,0,1,224,128ZM208,128a80,80,0,1,0-80,80A80.09,80.09,0,0,0,208,128Zm-40,0a40,40,0,1,1-40-40A40,40,0,0,1,168,128Z" opacity="0.2" /><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-88a40,40,0,1,1-40-40A40,40,0,0,1,168,128Zm-16,0a24,24,0,1,0-24,24A24,24,0,0,0,152,128Z" />
    </svg>
)

const HelpIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-100a12,12,0,1,1-12-12A12,12,0,0,1,140,116Zm-28,48a12,12,0,1,1,24,0,12,12,0,0,1-24,0Z" />
    </svg>
)

const LanguageIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM136,56v32h32V56Zm-48,0v32h32V56Zm112,72H168v32h32Zm0-48H168v32h32Zm-48,96H120v32h32Zm-48,0H72v32h32ZM56,128H88V96H56ZM56,176H88V144H56Zm112,0v32H136V176Zm-48,0v32H88V176Z" />
    </svg>
)

const SettingsNavIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88,0a16,16,0,1,1,16-16A16,16,0,0,1,216,160ZM40,160a16,16,0,1,1,16-16A16,16,0,0,1,40,160Zm176-64a16,16,0,1,1,16-16A16,16,0,0,1,216,96ZM40,96a16,16,0,1,1,16-16A16,16,0,0,1,40,96ZM128,48a16,16,0,1,1,16-16A16,16,0,0,1,128,48Zm0,176a16,16,0,1,1,16-16A16,16,0,0,1,128,224Z" />
    </svg>
)

const LogoutNavIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M112,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h56a8,8,0,0,1,0,16H48V208h56A8,8,0,0,1,112,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L196.69,120H104a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,221.66,122.34Z" />
    </svg>
)

const BellNavIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z" />
    </svg>
)

// --- Theme Toggle Component (Premium Segmented Pill) ---

function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    const options = [
        { key: "light", label: "Light" },
        { key: "dark", label: "Dark" },
        { key: "system", label: "System" }
    ]

    return (
        <div className="px-4 py-2 border-t border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-wider">Appearance</p>
            <div className="theme-pill-container" style={{ backgroundColor: '#F3F4F6', borderRadius: '10px', padding: '6px', display: 'flex', gap: '4px' }}>
                {options.map((opt) => (
                    <button
                        key={opt.key}
                        onClick={() => setTheme(opt.key)}
                        style={{ 
                            flex: 1, 
                            height: '36px', 
                            borderRadius: '8px', 
                            fontSize: '14px', 
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            backgroundColor: theme === opt.key ? '#FFFFFF' : 'transparent',
                            color: theme === opt.key ? '#0F172A' : '#4B5563',
                            boxShadow: theme === opt.key ? '0px 2px 6px rgba(15, 23, 42, 0.12)' : 'none',
                            border: theme === opt.key ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid transparent'
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

const NAV_ITEMS = [
    { name: "Copilot", href: "/copilot", icon: CopilotIcon },
    { name: "AI Agents", href: "/ai-agents", icon: AIAgentsIcon },
    { name: "Lead Finder", href: "/lead-finder", icon: LeadFinderIcon },
    { name: "Accounts", href: "/accounts", icon: AccountsIcon },
    { name: "Campaigns", href: "/campaigns", icon: CampaignsIcon },
    { name: "Unibox", href: "/unibox", icon: UniboxIcon },
    { name: "Analytics", href: "/analytics", icon: AnalyticsIcon },
    { name: "CRM", href: "/crm", icon: CRMIcon },
    { name: "Website Visitors", href: "/visitors", icon: WebsiteVisitorsIcon },
    { name: "Inbox Placement", href: "/inbox-placement", icon: InboxPlacementIcon },
    { name: "Automation Workflows", href: "/automation", icon: AutomationIcon },
]

interface SidebarProps {
    width?: number;
    onResize?: (width: number) => void;
}

export function Sidebar({ width = 90, onResize }: SidebarProps) {
    const pathname = usePathname()
    const { theme } = useTheme()
    const { data: session } = useSession()
    
    const sidebarWidth = width
    const headerHeight = 76

    const userName = session?.user?.name || "User"
    const userEmail = session?.user?.email || "user@example.com"
    const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" })
    }

    const getIconColor = (isActive: boolean) => {
        if (isActive) return "#3289ff"
        return theme === "dark" ? "#b6aea0" : "#a2acb4"
    }

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className="flex flex-col h-screen border-r border-border fixed left-0 top-0 z-[1009] transition-all duration-300"
                style={{ 
                    width: sidebarWidth,
                    backgroundColor: theme === 'dark' ? '#1d1d1d' : '#ffffff' 
                }}
            >
                {/* Logo Area */}
                <div 
                    className="flex items-center justify-center border-b"
                    style={{ 
                        height: headerHeight,
                        borderBottomColor: 'hsla(0,0%,68%,.2)'
                    }}
                >
                    <Link href="/accounts" className="flex items-center justify-center">
                        <Logo size="sidebar" />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-0 space-y-1 mt-1 overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        const iconColor = getIconColor(isActive)

                        return (
                            <Tooltip key={item.name}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-center w-[45px] h-[45px] rounded-full transition-all duration-200 group relative",
                                            isActive ? "bg-[#3289ff]/10" : "hover:bg-secondary/50",
                                            "animate-swing-hover active:scale-96"
                                        )}
                                    >
                                        <div 
                                            className="transition-colors duration-200 flex items-center justify-center"
                                            style={{ color: iconColor }}
                                        >
                                            <item.icon />
                                        </div>
                                        
                                        <span className="absolute top-[10px] right-[10px] flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-0 group-hover:opacity-0"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 opacity-0 group-hover:opacity-0"></span>
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent 
                                    side="right" 
                                    sideOffset={20} 
                                    className="font-bold px-3 py-1.5 bg-[#14171f] text-white border-none shadow-2xl rounded-md text-xs"
                                >
                                    {item.name}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="flex flex-col items-center gap-2 mb-4">
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex items-center justify-center w-[45px] h-[45px] rounded-full hover:bg-secondary/50 transition-all animate-swing-hover active:scale-96 text-[#a2acb4] dark:text-[#b6aea0]">
                                <MessageSquare size={20} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={20} className="font-bold bg-[#14171f] text-xs">Feedback</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex items-center justify-center w-[45px] h-[45px] rounded-full hover:bg-secondary/50 transition-all animate-swing-hover active:scale-96 text-[#a2acb4] dark:text-[#b6aea0]">
                                <LifeBuoy size={20} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={20} className="font-bold bg-[#14171f] text-xs">Support</TooltipContent>
                    </Tooltip>
                </div>

                {/* User Profile Dropdown (The Masterpiece) */}
                <div className="p-4 flex flex-col items-center gap-4 mt-auto mb-4 border-t border-border/10">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button 
                                id="sidebar_icon_userMenu"
                                className={cn(
                                    "flex items-center justify-center w-[52px] h-[52px] rounded-[12px] bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-sm border-2 border-background transition-all active:scale-96",
                                    "hover:shadow-md hover:scale-105"
                                )}
                            >
                                {userInitials}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="premium-popover w-[260px] bg-white dark:bg-[#1d1d1d] p-0 overflow-hidden mb-2 ml-4"
                            align="start"
                            side="right"
                            sideOffset={15}
                        >
                            {/* Header Partition */}
                            <div className="profile-dropdown-header px-[1.75rem] py-[1.4rem] border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-[25px] h-[25px] rounded-full bg-[#111827] flex items-center justify-center text-[10px] text-white font-bold">
                                        {userInitials}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[14px] font-bold text-[#0F172A] dark:text-white leading-[1.2] truncate">{userName}</p>
                                        <p className="text-[12px] text-[#6B7280] leading-[1.4] truncate font-medium">{userEmail}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items Area */}
                            <div className="p-1.5 space-y-0.5">
                                <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[44px] px-[12px] py-[11px] cursor-pointer rounded-[8px] outline-none">
                                    <div className="text-[#4B5563] dark:text-[#b6aea0] flex-shrink-0"><InviteIcon /></div>
                                    <span className="text-[14px] font-medium text-[#111827] dark:text-white flex-1 truncate">Invite Friends & Earn</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[44px] px-[12px] py-[11px] cursor-pointer rounded-[8px] outline-none">
                                    <div className="text-[#4B5563] dark:text-[#b6aea0] flex-shrink-0"><WhatsNewIcon /></div>
                                    <span className="text-[14px] font-medium text-[#111827] dark:text-white flex-1 truncate">What's New</span>
                                </DropdownMenuItem>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="profile-item-hover flex items-center justify-between min-h-[44px] px-[12px] py-[11px] cursor-pointer rounded-[8px] outline-none w-full">
                                        <div className="flex items-center gap-[12px]">
                                            <div className="text-[#4B5563] dark:text-[#b6aea0] flex-shrink-0"><BellNavIcon /></div>
                                            <span className="text-[14px] font-medium text-[#111827] dark:text-white">Notifications</span>
                                        </div>
                                        <ChevronRight size={14} className="text-[#4B5563]" />
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="premium-popover bg-white dark:bg-[#1d1d1d] p-1.5 min-w-[220px] ml-2 mt-1">
                                        <div className="p-3 text-center text-[12px] text-[#6B7280]">No new notifications</div>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="profile-item-hover flex items-center justify-between min-h-[44px] px-[12px] py-[11px] cursor-pointer rounded-[8px] outline-none w-full">
                                        <div className="flex items-center gap-[12px]">
                                            <div className="text-[#4B5563] dark:text-[#b6aea0] flex-shrink-0"><HelpIcon /></div>
                                            <span className="text-[14px] font-medium text-[#111827] dark:text-white">Help & Support</span>
                                        </div>
                                        <ChevronRight size={14} className="text-[#4B5563]" />
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="premium-popover bg-white dark:bg-[#1d1d1d] p-1.5 min-w-[220px] ml-2 mt-1">
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[11px] text-[14px] rounded-lg">Help Center</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[11px] text-[14px] rounded-lg">Knowledge Base</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[11px] text-[14px] rounded-lg">Chat with us</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="profile-item-hover flex items-center justify-between min-h-[44px] px-[12px] py-[11px] cursor-pointer rounded-[8px] outline-none w-full">
                                        <div className="flex items-center gap-[12px]">
                                            <div className="text-[#4B5563] dark:text-[#b6aea0] flex-shrink-0"><LanguageIcon /></div>
                                            <span className="text-[14px] font-medium text-[#111827] dark:text-white">Language</span>
                                        </div>
                                        <ChevronRight size={14} className="text-[#4B5563]" />
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="premium-popover bg-white dark:bg-[#1d1d1d] p-1.5 min-w-[220px] ml-2 mt-1">
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[11px] text-[14px] rounded-lg font-bold">English</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[11px] text-[14px] rounded-lg">Spanish</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[11px] text-[14px] rounded-lg">French</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                {/* Theme Toggle Switch (eh.wc Parity) */}
                                <ThemeToggle />

                                <div className="h-[1px] bg-border/50 my-1 mx-2"></div>

                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="profile-item-hover flex items-center gap-[12px] min-h-[44px] px-[12px] py-[11px] cursor-pointer rounded-[8px] outline-none">
                                        <div className="text-[#4B5563] dark:text-[#b6aea0] flex-shrink-0"><SettingsNavIcon /></div>
                                        <span className="text-[14px] font-medium text-[#111827] dark:text-white">User Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={handleLogout} className="profile-item-hover flex items-center gap-[12px] min-h-[44px] px-[12px] py-[11px] cursor-pointer text-[#dc2626] rounded-[8px] outline-none border-none">
                                    <div className="flex-shrink-0"><LogoutNavIcon /></div>
                                    <span className="text-[14px] font-medium truncate">Logout</span>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </TooltipProvider>
    )
}
