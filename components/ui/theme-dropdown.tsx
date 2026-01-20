"use client"

import { useTheme } from "next-themes"
import { useState, useLayoutEffect } from "react"

const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "cupcake", label: "Cupcake" },
    { value: "bumblebee", label: "Bumblebee" },
    { value: "emerald", label: "Emerald" },
    { value: "corporate", label: "Corporate" },
    { value: "synthwave", label: "Synthwave" },
    { value: "retro", label: "Retro" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "valentine", label: "Valentine" },
    { value: "halloween", label: "Halloween" },
    { value: "garden", label: "Garden" },
    { value: "forest", label: "Forest" },
    { value: "aqua", label: "Aqua" },
    { value: "lofi", label: "Lo-Fi" },
    { value: "pastel", label: "Pastel" },
    { value: "fantasy", label: "Fantasy" },
    { value: "wireframe", label: "Wireframe" },
    { value: "black", label: "Black" },
    { value: "luxury", label: "Luxury" },
    { value: "dracula", label: "Dracula" },
    { value: "business", label: "Business" },
    { value: "night", label: "Night" },
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
            <div className="dropdown">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                    Theme
                    <svg
                        width="12px"
                        height="12px"
                        className="inline-block h-2 w-2 fill-current opacity-60"
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
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs gap-1 h-8 min-h-8 px-2">
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
                className="dropdown-content bg-base-200 rounded-box z-50 w-40 p-1.5 shadow-2xl max-h-64 overflow-y-auto"
            >
                {themes.map((t) => (
                    <li key={t.value}>
                        <button
                            className={`btn btn-xs btn-block btn-ghost justify-start text-xs h-7 min-h-7 ${theme === t.value ? "btn-active" : ""
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
