"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Play,
    Rocket,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Users,
    Zap,
    Clock,
    Mail,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
    validateCampaignLimits,
    getWarningMessage,
    formatCapacityInfo,
    type LimitValidation,
} from "@/lib/limit-calculator"

export interface ResumeCampaignModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    campaignId: string
    campaignName: string
    campaignStatus?: string
    initialLeadsCount?: number
    dailyLimit?: number
    onSuccess?: () => void
}

export function ResumeCampaignModal({
    open,
    onOpenChange,
    campaignId,
    campaignName,
    campaignStatus = "paused",
    initialLeadsCount,
    dailyLimit,
    onSuccess,
}: ResumeCampaignModalProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [resuming, setResuming] = useState(false)
    const [validation, setValidation] = useState<LimitValidation | null>(null)
    const [accountsCount, setAccountsCount] = useState<number>(0)
    const [totalLeads, setTotalLeads] = useState<number>(initialLeadsCount || 0)
    const [leftoverLeads, setLeftoverLeads] = useState<number>(initialLeadsCount || 0)
    const [completedLeads, setCompletedLeads] = useState<number>(0)

    const isDraft = campaignStatus?.toLowerCase() === "draft"
    const actionLabel = isDraft ? "Launch Campaign" : "Resume Campaign"

    useEffect(() => {
        if (!open || !campaignId) return

        let isMounted = true
        setLoading(true)

        const loadCampaignDetails = async () => {
            try {
                // Fetch campaign details with accounts
                const campaignRes = await fetch(`/api/campaigns/${campaignId}`)
                if (!campaignRes.ok) throw new Error("Failed to load campaign")
                const campaignData = await campaignRes.json()

                // Extract email accounts
                let accounts: any[] = []
                if (campaignData.campaignAccounts && Array.isArray(campaignData.campaignAccounts)) {
                    accounts = campaignData.campaignAccounts
                        .filter((ca: any) => ca.emailAccount)
                        .map((ca: any) => ca.emailAccount)
                }

                // Fetch real leads list to compute dynamic leftover leads
                let allLeads: any[] = []
                try {
                    const leadsRes = await fetch(`/api/campaigns/${campaignId}/leads`)
                    if (leadsRes.ok) {
                        const leadsData = await leadsRes.json()
                        allLeads = Array.isArray(leadsData) ? leadsData : []
                    }
                } catch (err) {
                    console.error("Failed to fetch campaign leads for flight check:", err)
                }

                const total = allLeads.length || (initialLeadsCount ?? campaignData._count?.leads ?? 0)

                // Define excluded statuses (leads that no longer need sending)
                const excludedStatuses = ['sequence_complete', 'completed', 'bounced', 'unsubscribed']
                if (campaignData.stopOnReply !== false) {
                    excludedStatuses.push('replied')
                }

                // Calculate leftover leads (still need to receive emails)
                const remainingLeadsList = allLeads.filter(
                    (l: any) => !excludedStatuses.includes(l.status?.toLowerCase())
                )
                const remainingCount = allLeads.length > 0 ? remainingLeadsList.length : total
                const finishedCount = Math.max(0, total - remainingCount)

                if (!isMounted) return

                setTotalLeads(total)
                setLeftoverLeads(remainingCount)
                setCompletedLeads(finishedCount)
                setAccountsCount(accounts.filter((a: any) => a.status?.toLowerCase() === 'active').length)

                // IMPORTANT: Calculate pre-flight metrics on the LEFTOVER leads for resume,
                // or total leads for initial launch!
                const activeLeadCountForMetrics = isDraft ? total : remainingCount

                const calculatedValidation = validateCampaignLimits(
                    activeLeadCountForMetrics,
                    accounts,
                    (campaignData.dailyLimit ?? dailyLimit) || undefined
                )
                setValidation(calculatedValidation)
            } catch (error) {
                console.error("Failed to check campaign capacity:", error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadCampaignDetails()

        return () => {
            isMounted = false
        }
    }, [open, campaignId, initialLeadsCount, dailyLimit, isDraft])

    const handleConfirmResume = async () => {
        if (!campaignId) return
        setResuming(true)
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "active" }),
            })

            if (res.ok) {
                toast({
                    title: isDraft ? "Campaign Launched" : "Campaign Resumed",
                    description: `"${campaignName}" is now active and sending.`,
                })
                onOpenChange(false)
                if (onSuccess) {
                    onSuccess()
                }
            } else {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to update campaign status")
            }
        } catch (error: any) {
            console.error("Failed to resume campaign:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to resume campaign. Please try again.",
                variant: "destructive",
            })
        } finally {
            setResuming(false)
        }
    }

    const hasNoAccounts = validation ? validation.accountsAvailable === 0 : accountsCount === 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#121214] border-[#27272a] text-white max-w-lg p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-[#222226] bg-[#16161a]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                                {isDraft ? (
                                    <Rocket className="h-5 w-5 fill-green-500/20" />
                                ) : (
                                    <Play className="h-5 w-5 fill-green-400 text-green-400" />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                                    {actionLabel}
                                    <Badge
                                        variant="outline"
                                        className="text-xs font-normal border-[#333] text-gray-400 capitalize"
                                    >
                                        {campaignStatus}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-gray-400 text-xs truncate max-w-[340px] mt-0.5" title={campaignName}>
                                    {campaignName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-5">
                    {loading ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-3 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                            <span className="text-sm">Checking sending capacity & accounts...</span>
                        </div>
                    ) : (
                        <>
                            {/* Capacity Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <Users className="h-3.5 w-3.5 text-blue-400" />
                                        <span>{isDraft ? "Total Leads" : "Leftover Leads"}</span>
                                    </div>
                                    <div className="text-lg font-semibold text-white">
                                        {isDraft ? totalLeads : leftoverLeads}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                        {isDraft ? "ready to send" : `${completedLeads} finished / replied`}
                                    </div>
                                </div>

                                <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <Zap className="h-3.5 w-3.5 text-yellow-400" />
                                        <span>Daily Limit</span>
                                    </div>
                                    <div className="text-lg font-semibold text-white">
                                        {validation ? validation.dailyCapacity : dailyLimit || "—"}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                        max / day
                                    </div>
                                </div>

                                <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <Clock className="h-3.5 w-3.5 text-purple-400" />
                                        <span>{isDraft ? "Est. Duration" : "Leftover Duration"}</span>
                                    </div>
                                    <div className="text-lg font-semibold text-white">
                                        {!isDraft && leftoverLeads === 0
                                            ? "0d"
                                            : validation
                                                ? validation.daysNeeded === Infinity
                                                    ? "—"
                                                    : `${validation.daysNeeded}d`
                                                : "—"}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                        {isDraft ? "for entire campaign" : "for remaining leads"}
                                    </div>
                                </div>

                                <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <Mail className="h-3.5 w-3.5 text-green-400" />
                                        <span>Active Inboxes</span>
                                    </div>
                                    <div className={`text-lg font-semibold ${hasNoAccounts ? "text-red-400" : "text-emerald-400"}`}>
                                        {validation?.accountsAvailable ?? accountsCount}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                        assigned accounts
                                    </div>
                                </div>
                            </div>

                            {/* Status Warning / Guidance Box */}
                            {hasNoAccounts ? (
                                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
                                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-red-200 mb-0.5">No Active Inboxes Connected</div>
                                        <p className="leading-relaxed text-red-300/90">
                                            Please assign at least one active email account to this campaign before resuming.
                                        </p>
                                    </div>
                                </div>
                            ) : !isDraft && leftoverLeads === 0 ? (
                                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-blue-200 mb-0.5">All Leads Completed</div>
                                        <p className="leading-relaxed text-blue-300/90">
                                            All {totalLeads} leads in this campaign have already finished their sequences or replied. Resuming will activate the campaign for any new leads added.
                                        </p>
                                    </div>
                                </div>
                            ) : !isDraft && leftoverLeads > 0 ? (
                                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-emerald-200 mb-0.5">Fresh Flight Check for Remaining Queue</div>
                                        <p className="leading-relaxed text-emerald-300/90">
                                            Resuming with <strong>{leftoverLeads} leftover leads</strong> remaining ({completedLeads} already finished). At your daily limit of {validation?.dailyCapacity || dailyLimit || "—"}/day, the remaining queue will finish in approximately <strong>{validation?.daysNeeded || 1} day(s)</strong>.
                                        </p>
                                    </div>
                                </div>
                            ) : validation && !validation.withinLimits ? (
                                <div className="p-3.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs flex items-start gap-2.5">
                                    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-yellow-200 mb-0.5">Multi-day Capacity Schedule</div>
                                        <p className="leading-relaxed text-yellow-300/90">
                                            {getWarningMessage(validation)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-emerald-200 mb-0.5">Ready to Launch</div>
                                        <p className="leading-relaxed text-emerald-300/90">
                                            All pre-flight checks passed for all {totalLeads} leads. Email sends will begin processing on the next active schedule cycle.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#16161a] border-t border-[#222226]">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={resuming}
                        className="text-gray-400 hover:text-white hover:bg-[#27272a] text-xs h-9 px-4"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirmResume}
                        disabled={resuming || loading || hasNoAccounts}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 px-5 gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        {resuming ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Resuming...
                            </>
                        ) : (
                            <>
                                <Play className="h-3.5 w-3.5 fill-current" />
                                {actionLabel}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
