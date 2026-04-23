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
import { TouchRipple } from "@/components/ui/touch-ripple"
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
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
)

const WhatsNewIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
)

const HelpIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
)

const LanguageIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
)

const HelpGuideIcon = () => (
    <svg viewBox="0 0 24 24" height="18" width="18" fill="currentColor">
        <path d="M6 22h15v-2H6.012C5.55 19.988 5 19.805 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3zM5 8V5c0-.805.55-.988 1-1h13v12H5V8z" />
        <path d="M8 6h9v2H8z" />
    </svg>
)

const ContactExpertIcon = () => (
    <svg viewBox="0 0 24 24" height="18" width="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8,11 C10.7614237,11 13,8.76142375 13,6 C13,3.23857625 10.7614237,1 8,1 C5.23857625,1 3,3.23857625 3,6 C3,8.76142375 5.23857625,11 8,11 Z M14.6431888,15.6961461 C14.3091703,14.6675626 13.7524493,13.7598949 13.0233822,13.0234994 C11.7718684,11.7594056 10.0125018,11 8,11 C4,11 1,14 1,18 L1,23 L11,23 M12,18.8235294 L16.1904762,22 L23,13" />
    </svg>
)

const MessageIcon = () => (
    <svg viewBox="0 0 24 24" height="18" width="18" fill="currentColor">
        <path d="M20 2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h3v3.767L13.277 18H20c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14h-7.277L9 18.233V16H4V4h16v12z" />
        <path d="M7 7h10v2H7zm0 4h7v2H7z" />
    </svg>
)

const SlackIcon = () => (
    <svg viewBox="0 0 24 24" height="18" width="18" fill="currentColor">
        <path d="M6.52739 14.5136C6.52739 15.5966 5.64264 16.4814 4.55959 16.4814C3.47654 16.4814 2.5918 15.5966 2.5918 14.5136C2.5918 13.4305 3.47654 12.5458 4.55959 12.5458H6.52739V14.5136ZM7.51892 14.5136C7.51892 13.4305 8.40366 12.5458 9.48671 12.5458C10.5698 12.5458 11.4545 13.4305 11.4545 14.5136V19.4407C11.4545 20.5238 10.5698 21.4085 9.48671 21.4085C8.40366 21.4085 7.51892 20.5238 7.51892 19.4407V14.5136ZM9.48671 6.52715C8.40366 6.52715 7.51892 5.6424 7.51892 4.55935C7.51892 3.4763 8.40366 2.59155 9.48671 2.59155C10.5698 2.59155 11.4545 3.4763 11.4545 4.55935V6.52715H9.48671ZM9.48671 7.51867C10.5698 7.51867 11.4545 8.40342 11.4545 9.48647C11.4545 10.5695 10.5698 11.4543 9.48671 11.4543H4.55959C3.47654 11.4543 2.5918 10.5695 2.5918 9.48647C2.5918 8.40342 3.47654 7.51867 4.55959 7.51867H9.48671ZM17.4732 9.48647C17.4732 8.40342 18.3579 7.51867 19.4409 7.51867C20.524 7.51867 21.4087 8.40342 21.4087 9.48647C21.4087 10.5695 20.524 11.4543 19.4409 11.4543H17.4732V9.48647ZM16.4816 9.48647C16.4816 10.5695 15.5969 11.4543 14.5138 11.4543C13.4308 11.4543 12.546 10.5695 12.546 9.48647V4.55935C12.546 3.4763 13.4308 2.59155 14.5138 2.59155C15.5969 2.59155 16.4816 3.4763 16.4816 4.55935V9.48647ZM14.5138 17.4729C15.5969 17.4729 16.4816 18.3577 16.4816 19.4407C16.4816 20.5238 15.5969 21.4085 14.5138 21.4085C13.4308 21.4085 12.546 20.5238 12.546 19.4407V17.4729H14.5138ZM14.5138 16.4814C13.4308 16.4814 12.546 15.5966 12.546 14.5136C12.546 13.4305 13.4308 12.5458 14.5138 12.5458H19.4409C20.524 12.5458 21.4087 13.4305 21.4087 14.5136C21.4087 15.5966 20.524 16.4814 19.4409 16.4814H14.5138Z" />
    </svg>
)

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" height="18" width="18" fill="currentColor">
        <path d="M13.001 19.9381C16.9473 19.446 20.001 16.0796 20.001 12C20.001 7.58172 16.4193 4 12.001 4C7.5827 4 4.00098 7.58172 4.00098 12C4.00098 16.0796 7.05467 19.446 11.001 19.9381V14H9.00098V12H11.001V10.3458C11.001 9.00855 11.1402 8.52362 11.4017 8.03473C11.6631 7.54584 12.0468 7.16216 12.5357 6.9007C12.9184 6.69604 13.3931 6.57252 14.2227 6.51954C14.5519 6.49851 14.9781 6.52533 15.501 6.6V8.5H15.001C14.0837 8.5 13.7052 8.54332 13.4789 8.66433C13.3386 8.73939 13.2404 8.83758 13.1653 8.97793C13.0443 9.20418 13.001 9.42853 13.001 10.3458V12H15.501L15.001 14H13.001V19.9381ZM12.001 22C6.47813 22 2.00098 17.5228 2.00098 12C2.00098 6.47715 6.47813 2 12.001 2C17.5238 2 22.001 6.47715 22.001 12C22.001 17.5228 17.5238 22 12.001 22Z" />
    </svg>
)

const SettingsNavIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)

const LogoutNavIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
)

const BellNavIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
)

const FeedbackOriginalIcon = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 9h8" />
        <path d="M8 13h6" />
        <path d="M13 20l-1 1l-3 -3h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5" />
        <path d="M19 16l-2 3h4l-2 3" />
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
        <div className="theme-pill-container">
            {options.map((opt) => (
                <button
                    key={opt.key}
                    onClick={() => setTheme(opt.key)}
                    className={cn("theme-pill-btn", theme === opt.key && "active")}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

const NAV_ITEMS = [
    { name: "Instantly copilot", href: "/copilot", icon: CopilotIcon },
    { name: "Ai Agents", href: "/ai-agents", icon: AIAgentsIcon },
    { name: "Supersearch", href: "/lead-finder", icon: LeadFinderIcon },
    { name: "Email Accounts", href: "/accounts", icon: AccountsIcon },
    { name: "Campaigns", href: "/campaigns", icon: CampaignsIcon },
    { name: "Unibox", href: "/unibox", icon: UniboxIcon },
    { name: "Analytics", href: "/analytics", icon: AnalyticsIcon },
    { name: "CRM", href: "/crm", icon: CRMIcon },
    { name: "Website Visitors", href: "/visitors", icon: WebsiteVisitorsIcon },
    { name: "Inbox Placement", href: "/inbox-placement", icon: InboxPlacementIcon },
    { name: "Automations", href: "/automation", icon: AutomationIcon },
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
                className="flex flex-col h-screen fixed left-0 top-0 z-[1009] transition-all duration-300 bg-background border-r border-[rgb(242,242,242)] dark:border-[rgb(28,30,31)]"
                style={{ width: sidebarWidth }}
            >
                {/* Logo Area */}
                <div className="flex w-full items-center justify-center pt-3 pb-1 h-[68px] flex-shrink-0 pl-[1px]">
                    <Link href="/accounts" className="flex items-center justify-center">
                        <Logo size="sidebar" />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="w-full flex-1 pt-5 pb-4 px-0 space-y-1 overflow-hidden flex flex-col items-center">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        const iconColor = getIconColor(isActive)

                        return (
                            <Tooltip key={item.name}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-center w-[32px] h-[32px] min-w-[32px] aspect-square flex-shrink-0 rounded-[10px] transition-all duration-200 group relative overflow-hidden",
                                            isActive ? "bg-[#1f2937]/5 dark:bg-white/5 text-[#3289ff]" : "hover:bg-[#1f2937]/5 dark:hover:bg-white/5 text-inherit"
                                        )}
                                        style={{ marginBottom: '4px' }}
                                    >
                                        <TouchRipple />
                                        <div
                                            className="transition-colors duration-200 flex items-center justify-center pointer-events-none [&>svg]:w-[20px] [&>svg]:h-[20px]"
                                            style={{ color: iconColor }}
                                        >
                                            <item.icon />
                                        </div>

                                        <span className="absolute top-0 right-0 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-0 group-hover:opacity-0"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 opacity-0 group-hover:opacity-0"></span>
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    sideOffset={14}
                                    className="border-none"
                                >
                                    {item.name}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </nav>

                {/* Bottom Actions Cluster (Feedback + Profile) */}
                <div className="w-full flex flex-col items-center mt-2 mb-3 gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex items-center justify-center w-[35px] h-[35px] min-w-[35px] aspect-square flex-shrink-0 rounded-[10px] hover:bg-[#1f2937]/5 dark:hover:bg-white/5 transition-all text-[#a2acb4] dark:text-[#b6aea0] relative overflow-hidden [&>svg]:w-[20px] [&>svg]:h-[20px]">
                                <TouchRipple />
                                <FeedbackOriginalIcon />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={14} className="border-none max-w-none">Submit bugs, feedback, and feature requests</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                id="sidebar_icon_userMenu"
                                className={cn(
                                    "flex items-center justify-center w-[32px] h-[32px] min-w-[32px] aspect-square flex-shrink-0 rounded-[10px] text-[12px] font-medium transition-all relative overflow-hidden",
                                    "hover:bg-[#1f2937]/5 dark:hover:bg-white/5"
                                )}
                            >
                                <TouchRipple />
                                <div className="w-[22px] h-[22px] rounded-full bg-[#111827] flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white/10">
                                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "N"}
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="premium-popover w-[260px] bg-white dark:bg-[#0c0c0c] border-[#e5e7eb] dark:border-[#1f1f1f] p-0 overflow-hidden ml-4 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200 origin-bottom-left z-[2000]"
                            align="end"
                            side="right"
                            sideOffset={-28}
                            alignOffset={20}
                        >
                            {/* Header Container (Dark Rounded Box) */}
                            <div className="m-1.5 mb-0">
                                <div className="bg-gradient-to-b from-[#f8fafc]/95 to-[#f8fafc]/10 dark:from-[#1f2122]/95 dark:to-[#1f2122]/10 px-5 py-3 rounded-t-xl border-b border-black/5 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[22px] h-[22px] rounded-full bg-[#111827] flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white/10">
                                            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "N"}
                                        </div>
                                        <p className="text-[13px] font-bold text-foreground dark:text-white leading-none truncate tracking-tight">{userEmail}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/5 mx-1.5 mb-1"></div>

                            {/* Menu Items Area */}
                            <div className="p-1.5 space-y-0.5">
                                <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[52px] px-[12px] py-[14px] cursor-pointer rounded-[8px] outline-none">
                                    <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><InviteIcon /></div>
                                    <span className="text-[14px] font-medium text-foreground dark:text-white flex-1 truncate">Invite a Friend & Earn</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[52px] px-[12px] py-[14px] cursor-pointer rounded-[8px] outline-none">
                                    <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><WhatsNewIcon /></div>
                                    <span className="text-[14px] font-medium text-foreground dark:text-white flex-1 truncate">See what's new</span>
                                </DropdownMenuItem>

                                 <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="profile-item-hover flex items-center justify-between min-h-[52px] px-[12px] py-[14px] cursor-pointer rounded-[8px] outline-none w-full">
                                        <div className="flex items-center gap-[12px]">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><BellNavIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Notifications</span>
                                        </div>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="premium-popover bg-white dark:bg-[#0c0c0c] border-[#e5e7eb] dark:border-[#1f1f1f] p-1.5 min-w-[260px] ml-2 mt-1">
                                        <div className="p-5 text-center text-[12px] text-foreground/50 dark:text-white/50 leading-relaxed">You don't have any new notifications at this time.</div>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="profile-item-hover flex items-center justify-between min-h-[52px] px-[12px] py-[14px] cursor-pointer rounded-[8px] outline-none w-full">
                                        <div className="flex items-center gap-[12px]">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><HelpIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Help Center</span>
                                        </div>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="premium-popover bg-white dark:bg-[#0c0c0c] border-[#e5e7eb] dark:border-[#1f1f1f] p-1.5 min-w-[260px] ml-2 mt-1">
                                        <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[50px] px-[12px] py-[12px] cursor-pointer rounded-lg outline-none">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><HelpGuideIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Help & support guide</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[50px] px-[12px] py-[12px] cursor-pointer rounded-lg outline-none">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><ContactExpertIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Contact an Expert</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[50px] px-[12px] py-[12px] cursor-pointer rounded-lg outline-none">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><MessageIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Send us a message</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[50px] px-[12px] py-[12px] cursor-pointer rounded-lg outline-none">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><SlackIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Join the Slack Community</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover flex items-center gap-[12px] min-h-[50px] px-[12px] py-[12px] cursor-pointer rounded-lg outline-none">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><FacebookIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Join Facebook Group</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                 <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="profile-item-hover flex items-center justify-between min-h-[52px] px-[12px] py-[14px] cursor-pointer rounded-[8px] outline-none w-full">
                                        <div className="flex items-center gap-[12px]">
                                            <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><LanguageIcon /></div>
                                            <span className="text-[14px] font-medium text-foreground dark:text-white">Language</span>
                                        </div>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="premium-popover bg-white dark:bg-[#0c0c0c] border-[#e5e7eb] dark:border-[#1f1f1f] p-1.5 min-w-[260px] ml-2 mt-1">
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[12px] text-[14px] rounded-lg font-bold text-foreground dark:text-white">English</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[12px] text-[14px] rounded-lg text-foreground dark:text-white">Portuguese</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[12px] text-[14px] rounded-lg text-foreground dark:text-white">Spanish</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[12px] text-[14px] rounded-lg text-foreground dark:text-white">German</DropdownMenuItem>
                                        <DropdownMenuItem className="profile-item-hover px-[12px] py-[12px] text-[14px] rounded-lg text-foreground dark:text-white">French</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <div className="h-[1px] bg-black/5 dark:bg-white/5 my-1 mx-2"></div>

                                {/* Theme Section */}
                                <div className="px-3 py-2">
                                    <p className="text-[11px] font-bold text-foreground/40 dark:text-white/40 uppercase tracking-wider mb-2">Theme</p>
                                    <ThemeToggle />
                                </div>

                                <div className="h-[1px] bg-black/5 dark:bg-white/5 my-1 mx-2"></div>

                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="profile-item-hover flex items-center gap-[12px] min-h-[52px] px-[12px] py-[14px] cursor-pointer rounded-[8px] outline-none">
                                        <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><SettingsNavIcon /></div>
                                        <span className="text-[14px] font-medium text-foreground dark:text-white">Settings</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem onSelect={handleLogout} className="profile-item-hover flex items-center gap-[12px] min-h-[52px] px-[12px] py-[14px] cursor-pointer text-foreground dark:text-white rounded-[8px] outline-none border-none">
                                    <div className="text-foreground dark:text-white flex-shrink-0 opacity-90"><LogoutNavIcon /></div>
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
