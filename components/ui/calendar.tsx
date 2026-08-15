"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 select-none", className)}
            classNames={{
                root: "w-fit",
                months: "relative flex flex-col space-y-4",
                month: "space-y-4",
                month_caption: "flex justify-center items-center h-8 relative px-8",
                caption_label: "text-sm font-semibold text-white tracking-wide",
                nav: "flex items-center justify-between absolute inset-x-0 top-0 h-8 px-1 z-10",
                button_previous: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-7 w-7 bg-transparent p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-7 w-7 bg-transparent p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex w-full justify-between mb-2 border-b border-white/5 pb-1",
                weekday: "text-gray-400 w-8 h-8 flex items-center justify-center font-medium text-xs text-center",
                weeks: "w-full flex flex-col gap-1",
                week: "flex w-full justify-between",
                day: "h-8 w-8 text-center text-sm p-0 relative flex items-center justify-center",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 p-0 font-normal text-sm rounded-lg hover:bg-white/10 hover:text-white transition-all text-gray-200 focus:outline-none"
                ),
                range_end: "day-range-end",
                selected:
                    "[&>button]:bg-blue-600 [&>button]:text-white [&>button]:font-medium [&>button]:hover:bg-blue-500 [&>button]:hover:text-white [&>button]:shadow-sm",
                today: "[&>button]:border [&>button]:border-blue-500/60 [&>button]:text-blue-400 [&>button]:font-semibold",
                outside:
                    "[&>button]:text-gray-600 [&>button]:opacity-35 [&>button]:hover:bg-transparent [&>button]:hover:text-gray-600",
                disabled: "[&>button]:text-gray-600 [&>button]:opacity-20 [&>button]:cursor-not-allowed",
                range_middle:
                    "[&>button]:bg-blue-600/20 [&>button]:text-blue-200",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: chevronClassName }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className={cn("h-4 w-4", chevronClassName)} />
                    }
                    return <ChevronRight className={cn("h-4 w-4", chevronClassName)} />
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }

