"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Import cally web component (client-side only)
if (typeof window !== "undefined") {
    import("cally")
}

interface CallyCalendarProps {
    value?: Date | null
    onChange?: (date: Date | null) => void
    className?: string
    placeholder?: string
}

export function CallyCalendar({ value, onChange, className, placeholder = "Pick a date" }: CallyCalendarProps) {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const calendarRef = useRef<HTMLElement>(null)
    const popoverId = useRef(`cally-popover-${Math.random().toString(36).substring(7)}`)
    const [displayValue, setDisplayValue] = useState<string>(placeholder)

    // Update display when value changes
    useEffect(() => {
        if (value && !isNaN(value.getTime())) {
            setDisplayValue(value.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
            }))
        } else {
            setDisplayValue(placeholder)
        }
    }, [value, placeholder])

    // Handle calendar change events
    useEffect(() => {
        const calendarEl = calendarRef.current
        if (!calendarEl) return

        const handleChange = (e: Event) => {
            const target = e.target as HTMLElement & { value?: string }
            if (target.value) {
                const date = new Date(target.value)
                if (!isNaN(date.getTime())) {
                    onChange?.(date)
                    setDisplayValue(date.toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    }))
                    // Close the popover
                    const popover = document.getElementById(popoverId.current) as HTMLElement & { hidePopover?: () => void }
                    if (popover?.hidePopover) {
                        popover.hidePopover()
                    }
                }
            }
        }

        calendarEl.addEventListener("change", handleChange)
        return () => calendarEl.removeEventListener("change", handleChange)
    }, [onChange])

    // Set initial value on calendar
    useEffect(() => {
        const calendarEl = calendarRef.current
        if (calendarEl && value && !isNaN(value.getTime())) {
            (calendarEl as HTMLElement & { value: string }).value = value.toISOString().split("T")[0]
        }
    }, [value])

    return (
        <>
            <button
                ref={buttonRef}
                {...{ popovertarget: popoverId.current } as React.HTMLAttributes<HTMLButtonElement>}
                className={cn(
                    "btn btn-outline justify-start text-left font-normal w-full",
                    "bg-base-100 border-base-300 hover:bg-base-200",
                    !value && "text-base-content/50",
                    className
                )}
                style={{ anchorName: `--${popoverId.current}` } as React.CSSProperties}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {displayValue}
            </button>
            <div
                {...{ popover: "auto" } as React.HTMLAttributes<HTMLDivElement>}
                id={popoverId.current}
                className="dropdown bg-base-100 rounded-box shadow-lg border border-base-300 p-2"
                style={{ positionAnchor: `--${popoverId.current}` } as React.CSSProperties}
                dangerouslySetInnerHTML={{
                    __html: `
                        <calendar-date class="cally bg-base-100" id="${popoverId.current}-cal">
                            <svg aria-label="Previous" class="fill-current size-4" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.75 19.5 8.25 12l7.5-7.5"></path></svg>
                            <svg aria-label="Next" class="fill-current size-4" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m8.25 4.5 7.5 7.5-7.5 7.5"></path></svg>
                            <calendar-month></calendar-month>
                        </calendar-date>
                    `
                }}
                ref={(el) => {
                    if (el) {
                        const cal = el.querySelector("calendar-date")
                        if (cal) {
                            (calendarRef as React.MutableRefObject<HTMLElement | null>).current = cal as HTMLElement
                        }
                    }
                }}
            />
        </>
    )
}

// Standalone calendar (not in a popover)
interface CallyCalendarStandaloneProps {
    value?: Date | null
    onChange?: (date: Date | null) => void
    className?: string
}

export function CallyCalendarStandalone({ value, onChange, className }: CallyCalendarStandaloneProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const calendarRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const calendarEl = container.querySelector("calendar-date") as HTMLElement | null
        if (calendarEl) {
            calendarRef.current = calendarEl
        }

        const handleChange = (e: Event) => {
            const target = e.target as HTMLElement & { value?: string }
            if (target.value) {
                const date = new Date(target.value)
                if (!isNaN(date.getTime())) {
                    onChange?.(date)
                }
            }
        }

        if (calendarEl) {
            calendarEl.addEventListener("change", handleChange)
            return () => calendarEl.removeEventListener("change", handleChange)
        }
    }, [onChange])

    useEffect(() => {
        const calendarEl = calendarRef.current
        if (calendarEl && value && !isNaN(value.getTime())) {
            (calendarEl as HTMLElement & { value: string }).value = value.toISOString().split("T")[0]
        }
    }, [value])

    return (
        <div
            ref={containerRef}
            className={cn("inline-block", className)}
            dangerouslySetInnerHTML={{
                __html: `
                    <calendar-date class="cally bg-base-100 border border-base-300 shadow-lg rounded-box">
                        <svg aria-label="Previous" class="fill-current size-4" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5"></path></svg>
                        <svg aria-label="Next" class="fill-current size-4" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5"></path></svg>
                        <calendar-month></calendar-month>
                    </calendar-date>
                `
            }}
        />
    )
}
