"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { useEffect, useState } from "react"
import { NotificationManager } from "@/components/notification-manager"
import { MobileNav } from "@/components/mobile-nav"

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    // Pages that should NOT have the sidebar
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/unsubscribe") || pathname === "/"

    // We no longer need client-side redirect logic here as middleware handles it.
    // This prevents conflicts between client-side and server-side navigation.

    const [sidebarWidth, setSidebarWidth] = useState(72)
    const [isMobile, setIsMobile] = useState(false)

    // Load saved width and detect mobile
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_width')
        if (saved) setSidebarWidth(parseInt(saved))

        // Check if mobile
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleSidebarResize = (w: number) => {
        setSidebarWidth(w)
        localStorage.setItem('sidebar_width', w.toString())
    }

    return (
        <div className="min-h-screen bg-background">
            {!isAuthPage && (
                <>
                    {/* Desktop Sidebar - Hidden on mobile */}
                    <div className="hidden md:block">
                        <Sidebar width={sidebarWidth} onResize={handleSidebarResize} />
                    </div>

                    {/* Mobile Header - Shown only on mobile */}
                    <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4">
                        <MobileNav />
                        <div className="flex-1 flex justify-center">
                            <span className="text-lg font-bold text-primary">Instantly</span>
                        </div>
                    </div>

                    <NotificationManager />
                </>
            )}

            <main
                className={!isAuthPage ? `min-h-screen transition-none pt-14 md:pt-0` : "min-h-screen"}
                style={!isAuthPage && !isMobile ? { paddingLeft: `${sidebarWidth}px` } : {}}
            >
                {children}
            </main>
        </div>
    )
}
