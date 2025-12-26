"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Info, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function DeliverabilityPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [prefs, setPrefs] = useState({
        unlikelyReplyAction: "usual",
        hostileAction: "usual",
        disableOpenTracking: false,
        espMatching: false,
        firstEmailText: false,
        sisrMode: "basic",
        limitPerCompany: false
    })

    useEffect(() => {
        fetchPreferences()
    }, [])

    const fetchPreferences = async () => {
        try {
            const res = await fetch('/api/user/preferences')
            if (res.ok) {
                const data = await res.json()
                setPrefs(prev => ({
                    unlikelyReplyAction: data.unlikelyReplyAction || "usual",
                    hostileAction: data.hostileAction || "usual",
                    disableOpenTracking: data.disableOpenTracking || false,
                    espMatching: data.espMatching || false,
                    firstEmailText: data.firstEmailText || false,
                    sisrMode: data.sisrMode || "basic",
                    limitPerCompany: data.limitPerCompany || false
                }))
            }
        } catch (error) {
            console.error("Failed to fetch preferences", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs)
            })
            if (res.ok) {
                toast({ title: "Saved", description: "Deliverability settings updated" })
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const updatePref = (key: string, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }))
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
    }

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            {/* AI Lead Filtering */}
            <section className="space-y-4">
                <h3 className="text-white text-sm font-semibold pl-1">AI Lead Filtering</h3>

                <div className="border border-[#2a2a2a] rounded-lg p-6 bg-[#111] space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300 font-medium">Unlikely to reply</span>
                            <Info className="h-4 w-4 text-gray-500" />
                            <span className="bg-[#fbbf24] text-black text-[10px] px-1.5 py-0.5 rounded font-bold">Pro</span>
                        </div>
                        <div className="w-[180px]">
                            <Select value={prefs.unlikelyReplyAction} onValueChange={(v) => updatePref('unlikelyReplyAction', v)}>
                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectItem value="usual">Send as usual</SelectItem>
                                    <SelectItem value="skip">Skip lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300 font-medium">Hostile prospects</span>
                            <Info className="h-4 w-4 text-gray-500" />
                            <span className="bg-[#fbbf24] text-black text-[10px] px-1.5 py-0.5 rounded font-bold">Pro</span>
                        </div>
                        <div className="w-[180px]">
                            <Select value={prefs.hostileAction} onValueChange={(v) => updatePref('hostileAction', v)}>
                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectItem value="usual">Send as usual</SelectItem>
                                    <SelectItem value="skip">Skip lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Deliverability Optimization */}
            <section className="space-y-4">
                <h3 className="text-white text-sm font-semibold pl-1">Deliverability Optimization</h3>
                <div className="border border-[#2a2a2a] rounded-lg p-6 bg-[#111] space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">Disable Open Tracking</span>
                            <Info className="h-4 w-4 text-gray-500" />
                        </div>
                        <Switch checked={prefs.disableOpenTracking} onCheckedChange={(v) => updatePref('disableOpenTracking', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">Enable ESP Matching</span>
                            <Info className="h-4 w-4 text-gray-500" />
                        </div>
                        <Switch checked={prefs.espMatching} onCheckedChange={(v) => updatePref('espMatching', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">Always send first email as text-only</span>
                            <Info className="h-4 w-4 text-gray-500" />
                        </div>
                        <Switch checked={prefs.firstEmailText} onCheckedChange={(v) => updatePref('firstEmailText', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">Server & IP Sharding and Rotation (SISR)</span>
                            <Info className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm ${prefs.sisrMode === 'basic' ? 'text-white' : 'text-gray-500'}`}>Basic</span>
                            <Switch
                                checked={prefs.sisrMode === 'pro'}
                                onCheckedChange={(v) => updatePref('sisrMode', v ? 'pro' : 'basic')}
                            />
                            <span className={`text-sm ${prefs.sisrMode === 'pro' ? 'text-white' : 'text-gray-500'}`}>Pro</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">Limit emails per company</span>
                            <Info className="h-4 w-4 text-gray-500" />
                            <span className="bg-[#fbbf24] text-black text-[10px] px-1.5 py-0.5 rounded font-bold">Pro</span>
                        </div>
                        <Switch checked={prefs.limitPerCompany} onCheckedChange={(v) => updatePref('limitPerCompany', v)} />
                    </div>
                </div>
            </section>

            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white w-24">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
        </div>
    )
}
