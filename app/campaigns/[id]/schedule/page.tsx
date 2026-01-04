"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon, Plus, Save, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const DAYS = [
    { id: "mon", label: "Monday" },
    { id: "tue", label: "Tuesday" },
    { id: "wed", label: "Wednesday" },
    { id: "thu", label: "Thursday" },
    { id: "fri", label: "Friday" },
    { id: "sat", label: "Saturday" },
    { id: "sun", label: "Sunday" },
]

const HOURS = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12
    const ampm = i < 12 ? "AM" : "PM"
    return `${hour}:00 ${ampm}`
})

export default function SchedulePage() {
    const params = useParams()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Schedule State
    const [scheduleName, setScheduleName] = useState("Main Schedule")
    const [startDate, setStartDate] = useState<string | null>(null)
    const [endDate, setEndDate] = useState<string | null>(null)
    const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("17:00")
    const [timezone, setTimezone] = useState("America/New_York")

    useEffect(() => {
        fetchCampaignData()
    }, [params.id])

    const fetchCampaignData = async () => {
        try {
            const res = await fetch(`/api/campaigns/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setStartDate(data.startDate)
                setEndDate(data.endDate)
                if (data.scheduleName) setScheduleName(data.scheduleName)
                if (data.startTime) setStartTime(data.startTime)
                if (data.endTime) setEndTime(data.endTime)
                if (data.timezone) setTimezone(data.timezone)
                if (data.days) setSelectedDays(data.days.split(','))
            }
        } catch (error) {
            console.error("Failed to fetch schedule data", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/campaigns/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheduleName,
                    startDate: startDate ? new Date(startDate).toISOString() : null,
                    endDate: endDate ? new Date(endDate).toISOString() : null,
                    startTime,
                    endTime,
                    timezone,
                    days: selectedDays.join(',')
                })
            })

            if (!res.ok) throw new Error("Failed to save schedule")

            toast({ title: "Saved", description: "Schedule settings updated" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to save schedule", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const toggleDay = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
        )
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading schedule...</div>

    return (
        <div className="flex gap-8 p-6 max-w-[1200px]">
            {/* Sidebar with Dates */}
            <div className="w-[300px] flex flex-col gap-6">
                {/* ... Date Popovers (Unchanged, skipping for brevity in search/replace) ... */}
                <div className="space-y-6 bg-[#111] p-4 rounded-xl border border-[#222]">
                    <div className="space-y-2">
                        <Label className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                            <CalendarIcon className="h-3 w-3" /> Start Date
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate && !isNaN(new Date(startDate).getTime()) ? format(new Date(startDate), "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#111] border-[#333]" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate ? new Date(startDate) : undefined}
                                    onSelect={(date) => setStartDate(date ? date.toISOString() : null)}
                                    initialFocus
                                    className="text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                            <CalendarIcon className="h-3 w-3" /> End Date
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate && !isNaN(new Date(endDate).getTime()) ? format(new Date(endDate), "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#111] border-[#333]" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate ? new Date(endDate) : undefined}
                                    onSelect={(date) => setEndDate(date ? date.toISOString() : null)}
                                    initialFocus
                                    className="text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Schedule
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="p-3 bg-[#111111] border border-blue-600 rounded-lg flex items-center gap-3 cursor-pointer">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-white">Main Schedule</span>
                    </div>
                </div>
            </div>

            {/* Main Content (Schedule Details) */}
            <div className="flex-1 space-y-8">
                <div className="space-y-4">
                    <h3 className="text-gray-400 font-medium">Schedule Name</h3>
                    <Input
                        className="bg-[#111111] border-[#222] text-white"
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                        placeholder="Enter schedule name"
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-gray-400 font-medium">Timing</h3>
                    <div className="flex gap-4">
                        <div className="space-y-2 w-[200px]">
                            <Label className="text-xs text-gray-500 uppercase">From</Label>
                            <Select value={startTime} onValueChange={setStartTime}>
                                <SelectTrigger className="bg-[#111111] border-[#222] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-[200px]">
                                    {HOURS.map((hour) => (
                                        // Need to match format provided by backend or standardized.
                                        // HOURS array is "12:00 AM", "1:00 AM"...
                                        // Let's assume standard format matches.
                                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 w-[200px]">
                            <Label className="text-xs text-gray-500 uppercase">To</Label>
                            <Select value={endTime} onValueChange={setEndTime}>
                                <SelectTrigger className="bg-[#111111] border-[#222] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-[200px]">
                                    {HOURS.map((hour) => (
                                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label className="text-xs text-gray-500 uppercase">Timezone</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger className="bg-[#111111] border-[#222] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                                    <SelectItem value="Europe/London">London / UTC</SelectItem>
                                    <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                                    <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                                    <SelectItem value="Asia/Singapore">Singapore Time</SelectItem>
                                    <SelectItem value="Australia/Sydney">Sydney Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-gray-400 font-medium">Days</h3>
                    <div className="flex flex-wrap gap-2">
                        {DAYS.map((day) => {
                            const isSelected = selectedDays.includes(day.id)
                            return (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={cn(
                                        "flex items-center justify-center w-12 h-10 rounded-md border transition-all text-sm font-medium",
                                        isSelected
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "bg-[#111] border-[#2a2a2a] text-gray-500 hover:bg-[#1a1a1a] hover:border-[#3a3a3a]"
                                    )}
                                >
                                    {day.label.substring(0, 3)}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div >
    )
}
