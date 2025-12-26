"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Info, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function PreferencesPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // All preference states
    const [prefs, setPrefs] = useState({
        opportunityValue: 1000,
        disableLeadSync: false,
        autoTagReplies: true,
        aiInboxManager: false,
        autoSuggestReplies: true,
        autoTagOoo: true,
        showAutoReplies: true,
        saveExternalEmails: true,
        saveUndelivered: false,
        crmNotifyOnly: false,
        autoPauseBounce: true,
        singleAccountGap: false,
        sequentialSend: false,
        resetAzDaily: false,
        resetTimezone: "UTC",
        disconnectNotify: false,
        positiveReplyNotify: true,
        audioNotify: true,
        language: "en"
    })

    useEffect(() => {
        fetchPreferences()
    }, [])

    const fetchPreferences = async () => {
        try {
            const res = await fetch('/api/user/preferences')
            if (res.ok) {
                const data = await res.json()
                setPrefs(prev => ({ ...prev, ...data }))
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
                toast({ title: "Saved", description: "Preferences updated successfully" })
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const updatePref = (key: string, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }))
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            {/* Default Opportunity Value */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold">Default Opportunity Value</h3>
                <div className="border border-border rounded-lg p-6 bg-card">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Default Opportunity Value</Label>
                        <div className="relative max-w-sm">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                value={prefs.opportunityValue.toLocaleString()}
                                onChange={(e) => updatePref('opportunityValue', parseInt(e.target.value.replace(/,/g, '')) || 0)}
                                className="pl-6 bg-secondary border-border text-foreground"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Lead Preferences */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold">Lead Preferences</h3>
                <div className="border border-border rounded-lg p-6 bg-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Disable global lead status synchronization</span>
                            <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <Switch checked={prefs.disableLeadSync} onCheckedChange={(v) => updatePref('disableLeadSync', v)} />
                    </div>
                </div>
            </section>

            {/* AI Automations */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold">AI Automations</h3>
                <div className="border border-border rounded-lg p-6 bg-card space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Automatically tag lead status in replies</span>
                            <Switch checked={prefs.autoTagReplies} onCheckedChange={(v) => updatePref('autoTagReplies', v)} />
                            <Button variant="link" className="text-blue-500 h-auto p-0 ml-2">Select Labels</Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">AI Inbox Manager</span>
                            <span className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded font-bold">Pro</span>
                        </div>
                        <Switch checked={prefs.aiInboxManager} onCheckedChange={(v) => updatePref('aiInboxManager', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Automatically suggest replies using OpenAI</span>
                            <span className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded font-bold">Pro</span>
                        </div>
                        <Switch checked={prefs.autoSuggestReplies} onCheckedChange={(v) => updatePref('autoSuggestReplies', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Automatically tag out-of-office status</span>
                        </div>
                        <Switch checked={prefs.autoTagOoo} onCheckedChange={(v) => updatePref('autoTagOoo', v)} />
                    </div>
                </div>
            </section>

            {/* Unibox */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold">Unibox</h3>
                <div className="border border-border rounded-lg p-6 bg-card space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Show auto-replies in Unibox</span>
                        <Switch checked={prefs.showAutoReplies} onCheckedChange={(v) => updatePref('showAutoReplies', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Save non-Instantly emails in Unibox</span>
                            <span className="bg-blue-500 text-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">New</span>
                        </div>
                        <Switch checked={prefs.saveExternalEmails} onCheckedChange={(v) => updatePref('saveExternalEmails', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Save undelivered emails in Unibox</span>
                        <Switch checked={prefs.saveUndelivered} onCheckedChange={(v) => updatePref('saveUndelivered', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Only show notification in CRM</span>
                        <Switch checked={prefs.crmNotifyOnly} onCheckedChange={(v) => updatePref('crmNotifyOnly', v)} />
                    </div>
                </div>
            </section>

            {/* Outreach Preferences */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold">Outreach Preferences</h3>
                <div className="border border-border rounded-lg p-6 bg-card space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Automatically pause campaigns with high bounce rates</span>
                        <Switch checked={prefs.autoPauseBounce} onCheckedChange={(v) => updatePref('autoPauseBounce', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Use a single sending account per time gap</span>
                            <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <Switch checked={prefs.singleAccountGap} onCheckedChange={(v) => updatePref('singleAccountGap', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Send emails one at a time</span>
                            <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <Switch checked={prefs.sequentialSend} onCheckedChange={(v) => updatePref('sequentialSend', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">Reset A/Z variant usage tracking daily</span>
                            <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <Switch checked={prefs.resetAzDaily} onCheckedChange={(v) => updatePref('resetAzDaily', v)} />
                    </div>

                    <div className="grid grid-cols-[1fr_300px] gap-4 items-center">
                        <span className="text-sm text-foreground">Timezone for campaign limit reset</span>
                        <Select value={prefs.resetTimezone} onValueChange={(v) => updatePref('resetTimezone', v)}>
                            <SelectTrigger className="bg-secondary border-border text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-secondary border-border text-foreground">
                                <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* Notification Preferences */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold">Notification Preferences</h3>
                <div className="border border-border rounded-lg p-6 bg-card space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Account disconnect notification</span>
                        <Switch checked={prefs.disconnectNotify} onCheckedChange={(v) => updatePref('disconnectNotify', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Positive reply notification</span>
                        <Switch checked={prefs.positiveReplyNotify} onCheckedChange={(v) => updatePref('positiveReplyNotify', v)} />
                    </div>
                </div>

                <h3 className="text-foreground text-sm font-semibold pt-2">Audio notifications</h3>
                <div className="border border-border rounded-lg p-6 bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Play audio notification for new messages</span>
                        <Switch checked={prefs.audioNotify} onCheckedChange={(v) => updatePref('audioNotify', v)} />
                    </div>
                </div>
            </section>

            {/* Language */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold">Language</h3>
                <div className="border border-border rounded-lg p-6 bg-card">
                    <Select value={prefs.language} onValueChange={(v) => updatePref('language', v)}>
                        <SelectTrigger className="bg-secondary border-border text-foreground max-w-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary border-border text-foreground">
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </section>

            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-foreground w-24">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
        </div>
    )
}
