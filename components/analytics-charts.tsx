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

// Generate zero-filled empty heatmap data
function generateEmptyData(): HeatmapData[] {
    const data: HeatmapData[] = []
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            data.push({
                day,
                hour,
                value: 0,
                opens: 0,
                clicks: 0,
                replies: 0
            })
        }
    }
    return data
}

interface SendTimeHeatmapProps {
    data?: HeatmapData[]
    metric?: "sends" | "opens" | "clicks" | "replies"
}

export function SendTimeHeatmap({ data, metric = "sends" }: SendTimeHeatmapProps) {
    // Use provided data, or fall back to empty zero-data (NO MOCKS)
    const displayData = (data && data.length > 0) ? data : generateEmptyData()
    const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null)

    const getColor = (value: number) => {
        const maxValue = Math.max(...displayData.map(d => d.value))
        if (maxValue === 0) return "bg-secondary" // No data color

        const intensity = value / maxValue

        if (intensity === 0) return "bg-secondary"
        if (intensity < 0.1) return "bg-blue-500/5"
        if (intensity < 0.25) return "bg-blue-500/20"
        if (intensity < 0.5) return "bg-blue-500/40"
        if (intensity < 0.75) return "bg-blue-500/60"
        return "bg-blue-500/80"
    }

    const getCellData = (day: number, hour: number) => {
        return displayData.find(d => d.day === day && d.hour === hour)
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
            {(data && data.length > 0) ? (
                <div className="grid grid-cols-3 gap-4 pt-4">
                    {/* Real insights logic would go here, for now empty or simple stats */}
                </div>
            ) : (
                <div className="text-center text-xs text-muted-foreground py-4">
                    No data available for heatmap yet.
                </div>
            )}
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
    // Zero state funnel
    const emptyData: FunnelData[] = [
        { stage: "Sent", value: 0, percentage: 0 },
        { stage: "Delivered", value: 0, percentage: 0 },
        { stage: "Opened", value: 0, percentage: 0 },
        { stage: "Clicked", value: 0, percentage: 0 },
        { stage: "Replied", value: 0, percentage: 0 },
        { stage: "Converted", value: 0, percentage: 0 }
    ]

    const funnelData = (data && data.length > 0) ? data : emptyData

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b border-[#2a2a2a] pb-2">Conversion Funnel</h3>

            <div className="space-y-4">
                {funnelData.map((stage, index) => {
                    const widthPercent = (stage.value / funnelData[0].value) * 100
                    const colorClass =
                        index === 0 ? "progress-primary" :
                            index === 1 ? "progress-secondary" :
                                index === 2 ? "progress-success" :
                                    index === 3 ? "progress-warning" :
                                        index === 4 ? "progress-accent" :
                                            "progress-info"

                    return (
                        <div key={stage.stage} className="space-y-2">
                            <div className="flex items-center justify-between text-xs px-1">
                                <span className="font-bold uppercase tracking-wider text-gray-400">{stage.stage}</span>
                                <span className="font-mono text-white bg-[#1a1a1a] px-2 py-0.5 rounded">
                                    {stage.value.toLocaleString()} ({stage.percentage}%)
                                </span>
                            </div>
                            <div className="relative h-4 group">
                                <progress
                                    className={cn("progress w-full h-4", colorClass)}
                                    value={stage.value}
                                    max={funnelData[0].value}
                                ></progress>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                                        {stage.percentage}%
                                    </span>
                                </div>
                            </div>
                            {index < funnelData.length - 1 && stage.value > 0 && (
                                <div className="flex justify-center -my-1">
                                    <div className="badge badge-ghost badge-xs text-[9px] font-bold py-2 px-3 border-[#2a2a2a]">
                                        ↓ {Math.round((funnelData[index + 1].value / stage.value) * 100)}% conversion
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
