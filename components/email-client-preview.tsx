"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Mail, Monitor, Smartphone, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailPreviewProps {
    subject: string
    body: string
    fromName?: string
    fromEmail?: string
}

type ViewMode = "desktop" | "mobile"
type Client = "gmail" | "outlook"
type Theme = "light" | "dark"

export function EmailClientPreview({ subject, body, fromName = "Your Name", fromEmail = "you@example.com" }: EmailPreviewProps) {
    const { theme: systemTheme } = useTheme()
    const [viewMode, setViewMode] = useState<ViewMode>("desktop")
    const [client, setClient] = useState<Client>("gmail")
    const [localTheme, setLocalTheme] = useState<Theme>("light")

    // Sync local theme with system theme
    useEffect(() => {
        if (systemTheme === 'dark' || systemTheme === 'light') {
            setLocalTheme(systemTheme)
        }
    }, [systemTheme])

    // Use localTheme for rendering
    const theme = localTheme

    // Override setTheme to update local state (allow manual toggle for preview only)
    const setTheme = (t: Theme | ((old: Theme) => Theme)) => {
        if (typeof t === 'function') {
            setLocalTheme(prev => t(prev))
        } else {
            setLocalTheme(t)
        }
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant={client === "gmail" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setClient("gmail")}
                        className={cn(
                            "gap-2 rounded-lg",
                            client === "gmail" && "bg-blue-600"
                        )}
                    >
                        <Mail className="h-4 w-4" />
                        Gmail
                    </Button>
                    <Button
                        variant={client === "outlook" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setClient("outlook")}
                        className={cn(
                            "gap-2 rounded-lg",
                            client === "outlook" && "bg-blue-600"
                        )}
                    >
                        <Mail className="h-4 w-4" />
                        Outlook
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode("desktop")}
                        className={cn(viewMode === "desktop" && "bg-blue-600/20 border-blue-600")}
                    >
                        <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode("mobile")}
                        className={cn(viewMode === "mobile" && "bg-blue-600/20 border-blue-600")}
                    >
                        <Smartphone className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
                    >
                        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Preview Container */}
            <div className={cn(
                "rounded-xl overflow-hidden border transition-all",
                viewMode === "mobile" ? "max-w-[375px] mx-auto" : "w-full",
                theme === "dark" ? "border-gray-700" : "border-gray-200"
            )}>
                {client === "gmail" ? (
                    <GmailPreview
                        subject={subject}
                        body={body}
                        fromName={fromName}
                        fromEmail={fromEmail}
                        theme={theme}
                        isMobile={viewMode === "mobile"}
                    />
                ) : (
                    <OutlookPreview
                        subject={subject}
                        body={body}
                        fromName={fromName}
                        fromEmail={fromEmail}
                        theme={theme}
                        isMobile={viewMode === "mobile"}
                    />
                )}
            </div>
        </div>
    )
}

function GmailPreview({ subject, body, fromName, fromEmail, theme, isMobile }: {
    subject: string
    body: string
    fromName: string
    fromEmail: string
    theme: Theme
    isMobile: boolean
}) {
    const isDark = theme === "dark"

    return (
        <div className={cn(
            "font-sans",
            isDark ? "bg-[#1f1f1f] text-white" : "bg-white text-gray-900"
        )}>
            {/* Gmail Header */}
            <div className={cn(
                "flex items-center gap-3 px-4 py-3 border-b",
                isDark ? "border-gray-700 bg-[#2a2a2a]" : "border-gray-200 bg-gray-50"
            )}>
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {fromName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{fromName}</span>
                        <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                            &lt;{fromEmail}&gt;
                        </span>
                    </div>
                    <div className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                        to me
                    </div>
                </div>
                <div className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Subject */}
            <div className={cn(
                "px-4 py-3 border-b",
                isDark ? "border-gray-700" : "border-gray-200"
            )}>
                <h2 className={cn(
                    "font-semibold",
                    isMobile ? "text-lg" : "text-xl"
                )}>
                    {subject || "(No subject)"}
                </h2>
            </div>

            {/* Body */}
            <div className={cn(
                "px-4 py-4",
                isMobile ? "text-sm" : "text-base"
            )}>
                <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: body || "<p style='color: #888'>(No content)</p>" }}
                />
            </div>
        </div>
    )
}

function OutlookPreview({ subject, body, fromName, fromEmail, theme, isMobile }: {
    subject: string
    body: string
    fromName: string
    fromEmail: string
    theme: Theme
    isMobile: boolean
}) {
    const isDark = theme === "dark"

    return (
        <div className={cn(
            "font-sans",
            isDark ? "bg-[#1e1e1e] text-white" : "bg-white text-gray-900"
        )}>
            {/* Outlook Header */}
            <div className={cn(
                "px-4 py-3 border-b",
                isDark ? "border-gray-700 bg-[#0078d4]" : "border-gray-200 bg-[#0078d4]"
            )}>
                <h2 className="font-semibold text-white truncate">
                    {subject || "(No subject)"}
                </h2>
            </div>

            {/* Sender Info */}
            <div className={cn(
                "flex items-start gap-3 px-4 py-3 border-b",
                isDark ? "border-gray-700" : "border-gray-200"
            )}>
                <div className="h-10 w-10 rounded-full bg-[#0078d4] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {fromName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold">{fromName}</div>
                    <div className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                        {fromEmail}
                    </div>
                    <div className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
                        To: You
                    </div>
                </div>
                <div className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* Body */}
            <div className={cn(
                "px-4 py-4",
                isMobile ? "text-sm" : "text-base"
            )}>
                <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: body || "<p style='color: #888'>(No content)</p>" }}
                />
            </div>
        </div>
    )
}
