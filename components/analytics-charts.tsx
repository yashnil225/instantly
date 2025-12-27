"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"

interface HeatmapData {
    day: number  // 0-6 (Sunday-Saturday)
    hour: number // 0-23
    value: number
    opens?: number
    clicks?: number
    replies?: number
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

// Generate sample heatmap data
function generateSampleData(): HeatmapData[] {
    const data: HeatmapData[] = []
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            // Simulate business hours having better engagement
            let baseValue = 0
            if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) {
                baseValue = 50 + Math.random() * 50
            } else if (hour >= 8 && hour <= 20) {
                baseValue = 20 + Math.random() * 30
            } else {
                baseValue = Math.random() * 20
            }

            data.push({
                day,
                hour,
                value: Math.round(baseValue),
                opens: Math.round(baseValue * 0.4),
                clicks: Math.round(baseValue * 0.1),
                replies: Math.round(baseValue * 0.05)
            })
        }
    }
    return data
}

interface SendTimeHeatmapProps {
    data?: HeatmapData[]
    metric?: "sends" | "opens" | "clicks" | "replies"
}

export function SendTimeHeatmap({ data = generateSampleData(), metric = "sends" }: SendTimeHeatmapProps) {
    const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null)

    const getColor = (value: number) => {
        const maxValue = Math.max(...data.map(d => d.value))
        const intensity = value / maxValue

        if (intensity < 0.1) return "bg-blue-500/5"
        if (intensity < 0.25) return "bg-blue-500/20"
        if (intensity < 0.5) return "bg-blue-500/40"
        if (intensity < 0.75) return "bg-blue-500/60"
        return "bg-blue-500/80"
    }

    const getCellData = (day: number, hour: number) => {
        return data.find(d => d.day === day && d.hour === hour)
    }

    const formatHour = (hour: number) => {
        if (hour === 0) return "12am"
        if (hour === 12) return "12pm"
        return hour < 12 ? `${hour}am` : `${hour - 12}pm`
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Best Times to Send</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Low</span>
                    <div className="flex gap-0.5">
                        <div className="w-4 h-4 rounded bg-blue-500/10" />
                        <div className="w-4 h-4 rounded bg-blue-500/30" />
                        <div className="w-4 h-4 rounded bg-blue-500/50" />
                        <div className="w-4 h-4 rounded bg-blue-500/70" />
                        <div className="w-4 h-4 rounded bg-blue-500/90" />
                    </div>
                    <span>High</span>
                </div>
            </div>

            <TooltipProvider>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Hour labels */}
                        <div className="flex mb-1 pl-12">
                            {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                                <div
                                    key={hour}
                                    className="flex-1 text-[10px] text-muted-foreground text-center"
                                    style={{ width: '12.5%' }}
                                >
                                    {formatHour(hour)}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="space-y-1">
                            {DAYS.map((day, dayIndex) => (
                                <div key={day} className="flex items-center gap-2">
                                    <span className="w-10 text-xs text-muted-foreground text-right">
                                        {day}
                                    </span>
                                    <div className="flex-1 flex gap-0.5">
                                        {HOURS.map(hour => {
                                            const cellData = getCellData(dayIndex, hour)
                                            return (
                                                <UITooltip key={hour}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                "flex-1 h-6 rounded-sm cursor-pointer transition-all",
                                                                getColor(cellData?.value || 0),
                                                                hoveredCell?.day === dayIndex && hoveredCell?.hour === hour && "ring-2 ring-blue-500"
                                                            )}
                                                            onMouseEnter={() => setHoveredCell({ day: dayIndex, hour })}
                                                            onMouseLeave={() => setHoveredCell(null)}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-card border-border">
                                                        <div className="text-xs space-y-1">
                                                            <div className="font-semibold">{day} {formatHour(hour)}</div>
                                                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                                                <span className="text-muted-foreground">Sent:</span>
                                                                <span>{cellData?.value || 0}</span>
                                                                <span className="text-muted-foreground">Opens:</span>
                                                                <span>{cellData?.opens || 0}</span>
                                                                <span className="text-muted-foreground">Clicks:</span>
                                                                <span>{cellData?.clicks || 0}</span>
                                                                <span className="text-muted-foreground">Replies:</span>
                                                                <span>{cellData?.replies || 0}</span>
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </UITooltip>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </TooltipProvider>

            {/* Insights */}
            <div className="grid grid-cols-3 gap-4 pt-4">
                <InsightCard
                    label="Best Day"
                    value="Tuesday"
                    detail="32% higher open rate"
                />
                <InsightCard
                    label="Best Time"
                    value="10:00 AM"
                    detail="Peak engagement"
                />
                <InsightCard
                    label="Avoid"
                    value="Weekends"
                    detail="60% lower response"
                />
            </div>
        </div>
    )
}

function InsightCard({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="p-4 rounded-xl bg-secondary/50">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="text-lg font-bold">{value}</div>
            <div className="text-xs text-blue-500">{detail}</div>
        </div>
    )
}

// Funnel Visualization Component
interface FunnelData {
    stage: string
    value: number
    percentage: number
}

export function ConversionFunnel({ data }: { data?: FunnelData[] }) {
    const defaultData: FunnelData[] = [
        { stage: "Sent", value: 10000, percentage: 100 },
        { stage: "Delivered", value: 9800, percentage: 98 },
        { stage: "Opened", value: 4200, percentage: 42 },
        { stage: "Clicked", value: 840, percentage: 8.4 },
        { stage: "Replied", value: 520, percentage: 5.2 },
        { stage: "Converted", value: 156, percentage: 1.56 }
    ]

    const funnelData = data || defaultData

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Conversion Funnel</h3>

            <div className="space-y-2">
                {funnelData.map((stage, index) => {
                    const widthPercent = (stage.value / funnelData[0].value) * 100
                    return (
                        <div key={stage.stage} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{stage.stage}</span>
                                <span className="text-muted-foreground">
                                    {stage.value.toLocaleString()} ({stage.percentage}%)
                                </span>
                            </div>
                            <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3",
                                        index === 0 && "bg-blue-500",
                                        index === 1 && "bg-blue-500/90",
                                        index === 2 && "bg-green-500",
                                        index === 3 && "bg-yellow-500",
                                        index === 4 && "bg-orange-500",
                                        index === 5 && "bg-purple-500"
                                    )}
                                    style={{ width: `${widthPercent}%` }}
                                >
                                    {widthPercent > 20 && (
                                        <span className="text-xs font-medium text-white">
                                            {stage.percentage}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            {index < funnelData.length - 1 && (
                                <div className="text-[10px] text-muted-foreground text-center">
                                    ↓ {Math.round((funnelData[index + 1].value / stage.value) * 100)}% conversion
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
