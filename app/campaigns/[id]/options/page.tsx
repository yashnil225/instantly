"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Rocket, RotateCw, Play, MoreHorizontal, Plus, Info, Pause } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CampaignOptionsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const campaignId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showCCBCC, setShowCCBCC] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])

    // Status
    const [status, setStatus] = useState("draft")
    const [isPauseOpen, setIsPauseOpen] = useState(false)

    // Form state
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
    const [stopOnReply, setStopOnReply] = useState(true)
    const [linkTracking, setLinkTracking] = useState(false)
    const [openTracking, setOpenTracking] = useState(false)
    const [deliveryOpt, setDeliveryOpt] = useState(true) // "Free recommended" implied default
    const [sendAsTextOnly, setSendAsTextOnly] = useState(false)
    const [sendFirstAsText, setSendFirstAsText] = useState(false)
    const [dailyLimit, setDailyLimit] = useState("60")
    const [owner, setOwner] = useState("Yashnii Shukla")
    const [tags, setTags] = useState<string[]>([])
    const [minTimeGap, setMinTimeGap] = useState("9")
    const [randomTimeGap, setRandomTimeGap] = useState("5")
    const [maxNewLeads, setMaxNewLeads] = useState("")
    const [prioritizeNewLeads, setPrioritizeNewLeads] = useState(false)
    const [autoOptimizeAZ, setAutoOptimizeAZ] = useState(false)
    const [winningMetric, setWinningMetric] = useState("opens")
    const [providerMatching, setProviderMatching] = useState(false)
    const [stopOnCompanyReply, setStopOnCompanyReply] = useState(false)
    const [stopOnAutoReply, setStopOnAutoReply] = useState(false)
    const [insertUnsubscribeHeader, setInsertUnsubscribeHeader] = useState(false)
    const [enableRiskyEmails, setEnableRiskyEmails] = useState(false)
    const [disableBounceProtect, setDisableBounceProtect] = useState(false)
    const [overrideDeliverability, setOverrideDeliverability] = useState(false)

    // Load campaign data and available accounts
    const [scheduleWindowMins, setScheduleWindowMins] = useState(480)

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load campaign options
                const campaignRes = await fetch(`/api/campaigns/${campaignId}/options`)
                if (campaignRes.ok) {
                    const data = await campaignRes.json()
                    setStatus(data.status || "draft")
                    setStopOnReply(data.stopOnReply ?? true)
                    setLinkTracking(data.trackLinks ?? false)
                    setOpenTracking(data.trackOpens ?? false)
                    setDailyLimit(data.dailyLimit?.toString() || "60")
                    if (data.campaignAccounts) {
                        setSelectedAccounts(data.campaignAccounts.map((ca: any) => ca.emailAccountId))
                    }
                    if (data.sendAsTextOnly !== undefined) setSendAsTextOnly(data.sendAsTextOnly)
                    if (data.sendFirstAsText !== undefined) setSendFirstAsText(data.sendFirstAsText)
                    if (data.autoOptimizeAZ !== undefined) setAutoOptimizeAZ(data.autoOptimizeAZ)
                    if (data.winningMetric) setWinningMetric(data.winningMetric)
                    if (data.prioritizeNewLeads !== undefined) setPrioritizeNewLeads(data.prioritizeNewLeads)
                    if (data.minTimeGap !== undefined && data.minTimeGap !== null) setMinTimeGap(data.minTimeGap.toString())
                    if (data.randomTimeGap !== undefined && data.randomTimeGap !== null) setRandomTimeGap(data.randomTimeGap.toString())
                    if (data.maxNewLeads !== undefined && data.maxNewLeads !== null) setMaxNewLeads(data.maxNewLeads.toString())
                    if (data.owner) setOwner(data.owner)
                    if (data.tags) {
                        setTags(Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',').map((t: string) => t.trim()) : []))
                    }
                    if (data.providerMatching !== undefined) setProviderMatching(data.providerMatching)
                    if (data.stopOnCompanyReply !== undefined) setStopOnCompanyReply(data.stopOnCompanyReply)
                    if (data.stopOnAutoReply !== undefined) setStopOnAutoReply(data.stopOnAutoReply)
                    if (data.insertUnsubscribeHeader !== undefined) setInsertUnsubscribeHeader(data.insertUnsubscribeHeader)
                    if (data.enableRiskyEmails !== undefined) setEnableRiskyEmails(data.enableRiskyEmails)
                    if (data.disableBounceProtect !== undefined) setDisableBounceProtect(data.disableBounceProtect)
                    if (data.overrideDeliverability !== undefined) setOverrideDeliverability(data.overrideDeliverability)

                    // Calculate schedule window in minutes
                    if (data.startTime && data.endTime) {
                        const [sH, sM] = data.startTime.split(':').map(Number)
                        const [eH, eM] = data.endTime.split(':').map(Number)
                        const diff = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0))
                        if (diff > 0) setScheduleWindowMins(diff)
                    }
                }

                // Load available email accounts
                const accountsRes = await fetch('/api/accounts?limit=1000')
                if (accountsRes.ok) {
                    const accountsData = await accountsRes.json()
                    setAccounts(Array.isArray(accountsData.accounts) ? accountsData.accounts : [])
                }
            } catch (error) {
                console.error("Failed to load data:", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [campaignId])

    // Dynamic smart gap recommendations based on accounts, daily limit, and schedule window
    const numAccounts = Math.max(1, selectedAccounts.length)
    const currentLimit = Math.max(1, parseInt(dailyLimit) || 60)
    const rawGapMins = (scheduleWindowMins * numAccounts) / currentLimit
    const recommendedMinGap = Math.max(1, Math.round(rawGapMins * 0.8))
    const recommendedRandomGap = Math.max(1, Math.round(rawGapMins * 0.2))

    const handleApplyRecommendedGaps = () => {
        setMinTimeGap(recommendedMinGap.toString())
        setRandomTimeGap(recommendedRandomGap.toString())
        toast({
            title: "Recommended Gaps Applied",
            description: `Set minimum gap to ${recommendedMinGap}m and random gap to ${recommendedRandomGap}m.`
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/options`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountIds: selectedAccounts,
                    stopOnReply,
                    trackLinks: linkTracking,
                    trackOpens: openTracking,
                    sendAsTextOnly,
                    sendFirstAsText,
                    dailyLimit: parseInt(dailyLimit) || null,
                    owner,
                    tags,
                    minTimeGap: parseInt(minTimeGap) || recommendedMinGap,
                    randomTimeGap: parseInt(randomTimeGap) || recommendedRandomGap,
                    maxNewLeads: maxNewLeads ? parseInt(maxNewLeads) : null,
                    prioritizeNewLeads,
                    autoOptimizeAZ,
                    winningMetric,
                    providerMatching,
                    stopOnCompanyReply,
                    stopOnAutoReply,
                    insertUnsubscribeHeader,
                    enableRiskyEmails,
                    disableBounceProtect,
                    overrideDeliverability
                }),
            })
            if (res.ok) {
                toast({ title: "Saved successfully" })
                router.refresh()
                return true
            } else {
                toast({ title: "Error", description: "Failed to save options", variant: "destructive" })
                return false
            }
        } catch (error) {
            console.error("Error saving options:", error)
            toast({ title: "Error", description: "Failed to save options", variant: "destructive" })
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleResume = async () => {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
            })
            if (res.ok) {
                setStatus('active')
                toast({ title: "Campaign Resumed", description: "Your campaign is now active." })
            } else {
                toast({ title: "Error", description: "Failed to resume campaign", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to resume campaign", variant: "destructive" })
        }
    }

    const handlePause = async () => {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paused' })
            })
            if (res.ok) {
                setStatus('paused')
                toast({ title: "Campaign paused" })
                setIsPauseOpen(false)
            } else {
                toast({ title: "Error", description: "Failed to pause campaign", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to pause campaign", variant: "destructive" })
        }
    }

    // Auto-fix daily limits for campaign and associated accounts
    const handleAutoFixLimits = async () => {
        setSaving(true)
        try {
            const currentLimitNum = parseInt(dailyLimit) || 60
            const newCampaignLimit = Math.max(10, Math.floor(currentLimitNum * 0.5))

            await fetch(`/api/campaigns/${campaignId}/options`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountIds: selectedAccounts,
                    stopOnReply,
                    trackLinks: linkTracking,
                    trackOpens: openTracking,
                    dailyLimit: newCampaignLimit,
                    minTimeGap: parseInt(minTimeGap) || recommendedMinGap,
                    randomTimeGap: parseInt(randomTimeGap) || recommendedRandomGap,
                }),
            })

            for (const accId of selectedAccounts) {
                const accData = accounts.find(a => a.id === accId)
                if (accData) {
                    const accLimit = accData.dailyLimit || 50
                    const newAccLimit = Math.max(10, Math.floor(accLimit * 0.5))
                    await fetch(`/api/accounts/${accId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: "active",
                            dailyLimit: newAccLimit,
                            slowRamp: true,
                            errorDetail: null
                        })
                    })
                }
            }

            setDailyLimit(newCampaignLimit.toString())
            toast({
                title: "Auto-Fix Applied",
                description: `Campaign limit reduced to ${newCampaignLimit}. Account limits reduced by 50% and Slow Ramp enabled.`
            })
        } catch (error) {
            toast({ title: "Fix Failed", description: "Could not apply auto-fix.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
            <div className="max-w-4xl mx-auto py-10 space-y-8">
                {/* Accounts Selection */}
                <div className="flex items-start justify-between border-b border-[#1a1a1a] pb-8">
                    <div className="w-1/3">
                        <Label className="text-white font-bold text-sm block mb-1">Accounts to use</Label>
                        <p className="text-gray-500 text-xs">Select one or more accounts to send emails from</p>
                    </div>
                    <div className="w-2/3 flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between bg-[#111] border-[#2a2a2a] text-gray-300 hover:bg-[#161616] hover:text-white h-11">
                                    <span className="flex items-center gap-2">
                                        {selectedAccounts.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {selectedAccounts.slice(0, 3).map((acc, i) => (
                                                        <div key={i} className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border border-[#111]" />
                                                    ))}
                                                </div>
                                                <span className="text-white">{selectedAccounts.length} Accounts selected</span>
                                            </div>
                                        ) : "Select accounts"}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[400px] bg-[#111] border-[#2a2a2a] text-gray-300">
                                {accounts.map((acc) => (
                                    <DropdownMenuCheckboxItem
                                        key={acc.id}
                                        checked={selectedAccounts.includes(acc.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedAccounts([...selectedAccounts, acc.id])
                                            else setSelectedAccounts(selectedAccounts.filter(id => id !== acc.id))
                                        }}
                                        className="focus:bg-[#222] focus:text-white"
                                    >
                                        {acc.email}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Stop sending on reply */}
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-8">
                    <div className="w-1/3">
                        <Label className="text-white font-bold text-sm block mb-1">Stop sending emails on reply</Label>
                        <p className="text-gray-500 text-xs">Stop email sequence if a lead has replied</p>
                    </div>
                    <div className="w-2/3 flex justify-end">
                        <div className="bg-[#111] p-1 rounded-lg border border-[#2a2a2a] flex">
                            <button
                                onClick={() => setStopOnReply(false)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                    !stopOnReply ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                Disable
                            </button>
                            <button
                                onClick={() => setStopOnReply(true)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                    stopOnReply ? "bg-[#22c55e] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                Enable
                            </button>
                        </div>
                    </div>
                </div>

                {/* Open Tracking */}
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-8">
                    <div className="w-1/3">
                        <Label className="text-white font-bold text-sm block mb-1">Open & Link Tracking</Label>
                        <p className="text-gray-500 text-xs">Track email opens and link clicks</p>
                    </div>
                    <div className="w-2/3 flex items-center justify-end gap-6">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="link-tracking"
                                checked={linkTracking}
                                onCheckedChange={(c) => setLinkTracking(c as boolean)}
                                className="border-[#333] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px]"
                            />
                            <label htmlFor="link-tracking" className="text-sm text-gray-300 font-medium">Link tracking</label>
                        </div>
                        <div className="bg-[#111] p-1 rounded-lg border border-[#2a2a2a] flex">
                            <button
                                onClick={() => setOpenTracking(false)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                    !openTracking ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                Disable
                            </button>
                            <button
                                onClick={() => setOpenTracking(true)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                    openTracking ? "bg-[#22c55e] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                Enable
                            </button>
                        </div>
                    </div>
                </div>

                {/* Delivery Optimization */}
                <div className="flex items-start justify-between border-b border-[#1a1a1a] pb-8">
                    <div className="w-1/3">
                        <div className="flex items-center gap-2 mb-1">
                            <Label className="text-white font-bold text-sm">Delivery Optimization</Label>
                            <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-900/50 px-1.5 py-0.5 rounded">High Deliverability</span>
                        </div>
                        <p className="text-gray-500 text-xs">A/B Testing & text-only configuration</p>
                    </div>
                    <div className="w-2/3 flex flex-col items-end gap-3">
                        <div className="w-[340px] flex items-center justify-between bg-[#111] p-2.5 rounded-lg border border-[#2a2a2a]">
                            <label className="text-sm text-gray-300 font-medium ml-2">Auto optimize A/B testing</label>
                            <Switch checked={autoOptimizeAZ} onCheckedChange={setAutoOptimizeAZ} />
                        </div>

                        {autoOptimizeAZ && (
                            <div className="w-[340px] flex items-center justify-between">
                                <label className="text-sm text-gray-300 font-medium">Winning Metric</label>
                                <Select value={winningMetric} onValueChange={setWinningMetric}>
                                    <SelectTrigger className="w-[160px] bg-[#0a0a0a] border-[#2a2a2a] h-8 text-xs">
                                        <SelectValue placeholder="Select metric" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                        <SelectItem value="opens">Open Rate</SelectItem>
                                        <SelectItem value="clicks">Click Rate</SelectItem>
                                        <SelectItem value="replies">Reply Rate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <Checkbox
                                id="text-only"
                                checked={sendAsTextOnly}
                                onCheckedChange={(c) => setSendAsTextOnly(c as boolean)}
                                className="border-[#333] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px]"
                            />
                            <label htmlFor="text-only" className="text-sm text-gray-300 font-medium">Send emails as text-only (no HTML)</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="first-text-only"
                                checked={sendFirstAsText}
                                onCheckedChange={(c) => setSendFirstAsText(c as boolean)}
                                className="border-[#333] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px]"
                            />
                            <label htmlFor="first-text-only" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                                Send first email as text-only
                                <span className="bg-[#F59E0B] text-black text-[10px] font-bold px-1 rounded">Pro</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Daily Limit */}
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-8">
                    <div className="w-1/3">
                        <Label className="text-white font-bold text-sm block mb-1">Daily Limit</Label>
                        <p className="text-gray-500 text-xs">Max number of emails to send per day for this campaign</p>
                    </div>
                    <div className="w-2/3 flex justify-end items-center gap-3">
                        <Input
                            className="bg-[#0a0a0a] border-[#2a2a2a] w-24 text-center h-10 text-white font-medium focus:border-blue-600"
                            value={dailyLimit}
                            onChange={e => setDailyLimit(e.target.value)}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAutoFixLimits}
                            disabled={saving}
                            className="border-blue-600/50 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 text-xs h-9"
                        >
                            <RotateCw className="h-3 w-3 mr-1.5" />
                            Auto-Fix Limits
                        </Button>
                    </div>
                </div>

                {/* Advanced Options Button */}
                <div className="flex justify-center pb-4">
                    <Button
                        variant="ghost"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-blue-500 hover:text-blue-400 hover:bg-transparent text-xs font-medium"
                    >
                        {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                        {showAdvanced ? "Hide advanced options" : "Show advanced options"}
                    </Button>
                </div>

                {showAdvanced && (
                    <div className="space-y-12 animate-in slide-in-from-top-4 duration-300">
                        {/* CRM */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-[#A1A1AA]">CRM</h3>
                            <p className="text-gray-500 text-xs -mt-5 mb-4">Manage campaign ownership</p>
                            <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex items-center justify-between">
                                <div className="w-1/2">
                                    <Label className="text-white font-bold text-sm">Owner</Label>
                                    <p className="text-gray-500 text-xs mt-1">Select the owner of this campaign</p>
                                </div>
                                <div className="w-1/2">
                                    <Select value={owner} onValueChange={setOwner}>
                                        <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                            <SelectItem value="Yashnii Shukla">Yashnii Shukla</SelectItem>
                                            <SelectItem value="System Admin">System Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Custom Tags */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-[#A1A1AA]">Custom Tags</h3>
                            <p className="text-gray-500 text-xs -mt-5 mb-4">Tags are used to group your campaigns (comma-separated)</p>
                            <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-3">
                                <Input
                                    placeholder="e.g. tech, outbound, tier1"
                                    className="bg-[#0a0a0a] border-[#2a2a2a] h-10"
                                    value={Array.isArray(tags) ? tags.join(', ') : tags}
                                    onChange={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                />
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {tags.map((t, idx) => (
                                            <Badge key={idx} variant="secondary" className="bg-[#1e1e1e] text-blue-300 border border-[#333]">
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sending Pattern */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#A1A1AA]">Sending Pattern</h3>
                                    <p className="text-gray-500 text-xs mt-0.5">Specify how you want your emails to go</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleApplyRecommendedGaps}
                                    className="border-blue-600/40 text-blue-400 bg-blue-950/20 hover:bg-blue-900/40 text-xs h-8"
                                >
                                    Apply Smart Gap ({recommendedMinGap}m + {recommendedRandomGap}m)
                                </Button>
                            </div>

                            <div className="bg-[#111] border border-[#222] rounded-xl p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white font-bold text-sm text-blue-400">Time gap between emails</Label>
                                        <p className="text-gray-500 text-[11px] mt-1">
                                            Calculated for {selectedAccounts.length} inboxes & {dailyLimit} limit across {Math.round(scheduleWindowMins / 60)}h window
                                        </p>
                                    </div>
                                    <div className="flex gap-8">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Minimum time</label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    className="w-20 bg-[#0a0a0a] border-[#2a2a2a] h-9 text-center"
                                                    placeholder={recommendedMinGap.toString()}
                                                    value={minTimeGap}
                                                    onChange={e => setMinTimeGap(e.target.value)}
                                                />
                                                <span className="text-gray-500 text-xs">minutes</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Random additional time</label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    className="w-20 bg-[#0a0a0a] border-[#2a2a2a] h-9 text-center"
                                                    placeholder={recommendedRandomGap.toString()}
                                                    value={randomTimeGap}
                                                    onChange={e => setRandomTimeGap(e.target.value)}
                                                />
                                                <span className="text-gray-500 text-xs">minutes</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-[#222] w-full" />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white font-bold text-sm">Max new leads</Label>
                                        <p className="text-gray-500 text-xs mt-0.5">Limit daily volume of Step 1 first-touch emails</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            className="w-24 bg-[#0a0a0a] border-[#2a2a2a] h-9 text-center placeholder:text-gray-600"
                                            placeholder="No limit"
                                            value={maxNewLeads}
                                            onChange={e => setMaxNewLeads(e.target.value)}
                                        />
                                        <span className="text-gray-500 text-xs bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1.5 rounded">per day</span>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-[#222] w-full" />

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label className="text-white font-bold text-sm mb-1 text-orange-400">Prioritize New Leads</Label>
                                        <p className="text-gray-500 text-xs">Prioritize reaching out to new leads over scheduled follow-ups</p>
                                    </div>
                                    <Checkbox
                                        checked={prioritizeNewLeads}
                                        onCheckedChange={(c) => setPrioritizeNewLeads(c as boolean)}
                                        className="border-[#444] bg-[#222] data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deliverability & Compliance */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-[#A1A1AA]">Deliverability & Compliance</h3>
                            <p className="text-gray-500 text-xs -mt-5 mb-4">Google 2024+ sender compliance & reply safeguards</p>
                            <div className="bg-[#111] border border-[#222] rounded-xl p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label className="text-white font-bold text-sm mb-1">Insert Unsubscribe Header (RFC 8058)</Label>
                                        <p className="text-gray-500 text-xs">Include One-Click Unsubscribe header in email headers for Gmail/Yahoo compliance</p>
                                    </div>
                                    <Switch
                                        checked={insertUnsubscribeHeader}
                                        onCheckedChange={setInsertUnsubscribeHeader}
                                    />
                                </div>

                                <div className="h-[1px] bg-[#222] w-full" />

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label className="text-white font-bold text-sm mb-1">Provider Matching</Label>
                                        <p className="text-gray-500 text-xs">Match Gmail leads to Google inboxes and Outlook leads to Microsoft inboxes</p>
                                    </div>
                                    <Switch
                                        checked={providerMatching}
                                        onCheckedChange={setProviderMatching}
                                    />
                                </div>

                                <div className="h-[1px] bg-[#222] w-full" />

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label className="text-white font-bold text-sm mb-1">Stop on Company Reply</Label>
                                        <p className="text-gray-500 text-xs">Halt sequences for all contacts if someone with the same domain replies</p>
                                    </div>
                                    <Switch
                                        checked={stopOnCompanyReply}
                                        onCheckedChange={setStopOnCompanyReply}
                                    />
                                </div>

                                <div className="h-[1px] bg-[#222] w-full" />

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label className="text-white font-bold text-sm mb-1">Stop on Auto-Reply / Out of Office</Label>
                                        <p className="text-gray-500 text-xs">Pause sequence if lead returns an auto-responder or OOO notification</p>
                                    </div>
                                    <Switch
                                        checked={stopOnAutoReply}
                                        onCheckedChange={setStopOnAutoReply}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#111] border border-[#333] p-1.5 rounded-lg shadow-2xl z-50">
                <Button
                    onClick={handleSave}
                    disabled={loading || saving}
                    variant="ghost"
                    className="bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#333] px-6 h-9 text-xs font-bold"
                >
                    {saving ? "Saving..." : "Save"}
                </Button>

                {status === 'active' ? (
                    <Button
                        onClick={() => setIsPauseOpen(true)}
                        className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-800 px-6 h-9 text-xs font-bold"
                    >
                        <Pause className="h-3 w-3 mr-2" />
                        Pause
                    </Button>
                ) : (
                    <Button
                        onClick={async (e) => {
                            e.preventDefault()
                            // Auto-save before launching
                            const success = await handleSave()
                            if (success) {
                                router.push(`/campaigns/${campaignId}/launch`)
                            }
                        }}
                        type="button"
                        disabled={saving || selectedAccounts.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-9 text-xs font-bold"
                        title={selectedAccounts.length === 0 ? "Please select at least one email account" : ""}
                    >
                        <Rocket className="h-3 w-3 mr-2" />
                        {selectedAccounts.length === 0 ? "Select Accounts First" : "Save & Launch"}
                    </Button>
                )}
            </div>

            {/* Pause Confirmation Modal */}
            <AlertDialog open={isPauseOpen} onOpenChange={setIsPauseOpen}>
                <AlertDialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-xl">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-gray-400">
                            This will pause your Campaign
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center gap-4 mt-4">
                        <AlertDialogAction
                            onClick={handlePause}
                            className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-800 w-24"
                        >
                            Pause
                        </AlertDialogAction>
                        <AlertDialogCancel className="bg-[#2a2a2a] border-[#333] hover:bg-[#333] text-white w-24 mt-0">
                            Cancel
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
