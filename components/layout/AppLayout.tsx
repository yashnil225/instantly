"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { useEffect, useState } from "react"
import { NotificationManager } from "@/components/notification-manager"

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    // Pages that should NOT have the sidebar
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/unsubscribe") || pathname === "/"

    useEffect(() => {
        if (!isAuthPage) {
            const isClientAuth = localStorage.getItem('instantly_auth')
            if (!isClientAuth) {
                router.push('/login')
            }
        }
    }, [isAuthPage, router])

    const [sidebarWidth, setSidebarWidth] = useState(72)

    // Load saved width
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_width')
        if (saved) setSidebarWidth(parseInt(saved))
    }, [])

    const handleSidebarResize = (w: number) => {
        setSidebarWidth(w)
        localStorage.setItem('sidebar_width', w.toString())
    }

    return (
        <div className="min-h-screen bg-background">
            {!isAuthPage && (
                <>
                    <Sidebar width={sidebarWidth} onResize={handleSidebarResize} />
                    <NotificationManager />
                </>
            )}

            <main
                className={!isAuthPage ? "min-h-screen transition-none" : "min-h-screen"}
                style={!isAuthPage ? { paddingLeft: `${sidebarWidth}px` } : {}}
            >
                {children}
            </main>
        </div>
    )
}
