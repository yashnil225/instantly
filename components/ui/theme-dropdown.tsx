"use client"

import { useTheme } from "next-themes"
import { useState, useLayoutEffect } from "react"

const themes = [
    { value: "bumblebee", label: "Bumblebee" },
    { value: "emerald", label: "Emerald" },
    { value: "corporate", label: "Corporate" },
    { value: "synthwave", label: "Synthwave" },
    { value: "retro", label: "Retro" },
    { value: "cyberpunk", label: "Cyberpunk" },
]

export function ThemeDropdown() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useLayoutEffect(() => {
        // Standard Next.js hydration pattern
        // eslint-disable-next-line
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="relative inline-block text-left">
                <div tabIndex={0} role="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    Theme
                    <svg
                        width="12px"
                        height="12px"
                        className="inline-block h-2 w-2 fill-current opacity-60 ml-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 2048 2048"
                    >
                        <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
                    </svg>
                </div>
            </div>
        )
    }

    return (
        <div className="relative inline-block text-left">
            <div tabIndex={0} role="button" className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-8 min-h-8 px-2 gap-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                </svg>
                <span className="text-xs">Theme</span>
                <svg
                    width="10px"
                    height="10px"
                    className="inline-block fill-current opacity-60"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 2048 2048"
                >
                    <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
                </svg>
            </div>
            <ul
                tabIndex={0}
                className="absolute right-0 z-50 mt-1 min-w-[8rem] w-40 p-1.5 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md max-h-64"
            >
                {themes.map((t) => (
                    <li key={t.value}>
                        <button
                            className={`flex w-full select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 h-7 min-h-7 ${theme === t.value ? "bg-accent/50" : "hover:bg-accent/50"
                                }`}
                            onClick={() => setTheme(t.value)}
                        >
                            {t.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
