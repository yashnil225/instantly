"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon, Plus, Save, Loader2, Check } from "lucide-react"
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

interface Schedule {
    id: string
    name: string
    startDate: string | null
    endDate: string | null
    startTime: string
    endTime: string
    timezone: string
    days: string[]
    isActive: boolean
}

export default function SchedulePage() {
    const params = useParams()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Schedule List State
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null)
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)

    // Form State (reflects the currently "editing" schedule)
    const [name, setName] = useState("Main Schedule")
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

                let loadedSchedules: Schedule[] = []
                if (data.schedules) {
                    try {
                        loadedSchedules = JSON.parse(data.schedules)
                    } catch (e) {
                        console.error("Failed to parse schedules", e)
                    }
                }

                if (loadedSchedules.length === 0) {
                    // Create default schedule from top-level data
                    const defaultSchedule: Schedule = {
                        id: crypto.randomUUID(),
                        name: data.scheduleName || "Main Schedule",
                        startDate: data.startDate,
                        endDate: data.endDate,
                        startTime: data.startTime || "09:00",
                        endTime: data.endTime || "17:00",
                        timezone: data.timezone || "America/New_York",
                        days: data.days ? data.days.split(',') : ['mon', 'tue', 'wed', 'thu', 'fri'],
                        isActive: true
                    }
                    loadedSchedules = [defaultSchedule]
                }

                setSchedules(loadedSchedules)

                // Determine which one to show/edit
                // Prefer the one marked active, else the first one
                const active = loadedSchedules.find(s => s.isActive) || loadedSchedules[0]

                setActiveScheduleId(active.id) // The one that IS active for the campaign
                setEditingScheduleId(active.id) // The one we are currently viewing/editing

                loadScheduleToForm(active)
            }
        } catch (error) {
            console.error("Failed to fetch schedule data", error)
        } finally {
            setLoading(false)
        }
    }

    const loadScheduleToForm = (schedule: Schedule) => {
        setName(schedule.name)
        setStartDate(schedule.startDate)
        setEndDate(schedule.endDate)
        setStartTime(schedule.startTime)
        setEndTime(schedule.endTime)
        setTimezone(schedule.timezone)
        setSelectedDays(schedule.days)
    }

    // When switching editing view
    const handleSelectSchedule = (id: string) => {
        // First, save current form state to the schedule we were just editing (in memory only)
        // actually, simpler to just switch. If user didn't save, changes are lost? 
        // Or we can auto-update the array as they type.
        // Let's simple: Switch editing ID, load its data.

        // BETTER: Update the `schedules` array with current form values before switching?
        // No, let's keep it explicit "Save" model as per request "i hit save".

        // HOWEVER, if they switch without saving, they lose changes. 
        // Let's prompt or just load the target. For now, just load.

        const target = schedules.find(s => s.id === id)
        if (target) {
            setEditingScheduleId(id)
            loadScheduleToForm(target)
        }
    }

    // Toggle which one is ACTIVE (the radio button behavior)
    // NOTE: This does NOT necessarily change the form view, but let's say it does for clarity.
    // Actually request says: "click on the schedule it gets chossen for the campaign".
    // Does this mean "Selected for editing" or "Selected as the active schedule"?
    // "rest stay not chosen" implies active state.
    const handleSetAsActive = (id: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering the row click if we bind row click to edit
        setActiveScheduleId(id)

        // Update the schedules array to reflect active status
        const updated = schedules.map(s => ({
            ...s,
            isActive: s.id === id
        }))
        setSchedules(updated)

        // If we want to also edit it:
        handleSelectSchedule(id)
    }

    const handleAddSchedule = () => {
        const newSchedule: Schedule = {
            id: crypto.randomUUID(),
            name: `New Schedule ${schedules.length + 1}`,
            startDate: null,
            endDate: null,
            startTime: "09:00",
            endTime: "17:00",
            timezone: "America/New_York",
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            isActive: false
        }

        const updated = [...schedules, newSchedule]
        setSchedules(updated)
        setEditingScheduleId(newSchedule.id)
        loadScheduleToForm(newSchedule)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // 1. Update the currently editing schedule with form data
            if (!editingScheduleId) return

            const updatedSchedules = schedules.map(s => {
                if (s.id === editingScheduleId) {
                    return {
                        ...s,
                        name,
                        startDate,
                        endDate,
                        startTime,
                        endTime,
                        timezone,
                        days: selectedDays,
                        // If this was the active ID, it stays active.
                        isActive: activeScheduleId === s.id
                    }
                }
                // Also ensure only the activeScheduleId is set to active
                return {
                    ...s,
                    isActive: activeScheduleId === s.id
                }
            })

            setSchedules(updatedSchedules)

            // 2. Prepare payload for API
            // We need to send the 'active' schedule's data as the top-level campaign data
            const activeSchedule = updatedSchedules.find(s => s.id === activeScheduleId) || updatedSchedules[0]

            const payload = {
                // Top-level fields (effective campaign settings)
                scheduleName: activeSchedule.name, // "Update Main Schedule text" requirement
                startDate: activeSchedule.startDate ? new Date(activeSchedule.startDate).toISOString() : null,
                endDate: activeSchedule.endDate ? new Date(activeSchedule.endDate).toISOString() : null,
                startTime: activeSchedule.startTime,
                endTime: activeSchedule.endTime,
                timezone: activeSchedule.timezone,
                days: activeSchedule.days.join(','),

                // The list of all schedules (JSON stringified)
                schedules: JSON.stringify(updatedSchedules)
            }

            const res = await fetch(`/api/campaigns/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Failed to save schedule")

            toast({ title: "Saved", description: "Schedule settings updated" })
        } catch (error) {
            console.error(error)
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
            {/* Sidebar with Schedules List and Global Date Pickers? 
               Wait, "Start Date/End Date" usually apply to the campaign or the schedule?
               In original code, they were just dates.
               User request: "hit save the the text which is showing main schedule changes and to what the user has wriiteten"
               The screenshot shows "Main Schedule" in sidebar.
               I will move the Date pickers into the main form area if they are schedule-specific, 
               OR keep them global if they are campaign-specific. 
               However, `startDate` and `endDate` are in the schedule object in my design.
               Let's keep them in the sidebar but bind them to the form state.
            */}

            <div className="w-[300px] flex flex-col gap-6">
                {/* Date Pickers (Bound to form state of CURRENTLY EDITING schedule) */}
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

                {/* Schedules List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <Label className="text-gray-500 text-xs uppercase tracking-wider">Schedules</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300"
                            onClick={handleAddSchedule}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {schedules.map(schedule => {
                        // Use 'name' from state if this is the one being edited, else use stored name 
                        const displayName = schedule.id === editingScheduleId ? name : schedule.name
                        const isEditing = schedule.id === editingScheduleId
                        const isActive = activeScheduleId === schedule.id

                        return (
                            <div
                                key={schedule.id}
                                onClick={() => handleSelectSchedule(schedule.id)}
                                className={cn(
                                    "p-3 rounded-lg flex items-center gap-3 cursor-pointer border transition-all",
                                    isEditing
                                        ? "bg-[#161616] border-blue-600/50"
                                        : "bg-[#111] border-[#222] hover:bg-[#161616]"
                                )}
                            >
                                {/* Radio/Checkbox for selection */}
                                <div
                                    onClick={(e) => handleSetAsActive(schedule.id, e)}
                                    className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                        isActive
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-600 hover:border-blue-400"
                                    )}
                                >
                                    {isActive && <Check className="h-3 w-3 text-white" />}
                                </div>

                                <span className={cn(
                                    "text-sm font-medium",
                                    isEditing ? "text-white" : "text-gray-400"
                                )}>
                                    {displayName}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Main Content (Schedule Details) */}
            <div className="flex-1 space-y-8">
                <div className="space-y-4">
                    <h3 className="text-gray-400 font-medium">Schedule Name</h3>
                    <Input
                        className="bg-[#111111] border-[#222] text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
        </div>
    )
}
