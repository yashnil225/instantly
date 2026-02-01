"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-14 h-8 rounded-full bg-muted animate-pulse" />
  }

  const isDark = theme === "dark" || theme === "synthwave"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${isDark ? "bg-slate-800" : "bg-sky-100"}
      `}
      aria-label="Toggle Theme"
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Track Icons (Static background icons) */}
      <span className="absolute left-2 text-sky-500 opacity-50">
          <Sun className="h-4 w-4" />
      </span>
      <span className="absolute right-2 text-slate-400 opacity-50">
          <Moon className="h-4 w-4" />
      </span>

      {/* Moving Knob */}
      <span
        className={`
          absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300
          ${isDark ? "translate-x-7 bg-indigo-500 text-white" : "translate-x-1 bg-white text-orange-500"}
        `}
      >
        {isDark ? (
           <Moon className="h-3.5 w-3.5 fill-current" />
        ) : (
           <Sun className="h-4 w-4 fill-current" />
        )}
      </span>
    </button>
  )
}
