"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Rocket, AlertTriangle, CheckCircle2, Calendar, Target, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { validateCampaignLimits, getWarningMessage, formatCapacityInfo, type LimitValidation } from "@/lib/limit-calculator"

interface CampaignData {
    id: string
    name: string
    status: string
    dailyLimit?: number | null
    campaignAccounts?: {
        emailAccount: {
            id: string
            status: string
            dailyLimit: number
            sentToday: number
            warmupEnabled: boolean
            warmupCurrentDay: number
            warmupDailyIncrease: number
            warmupMaxPerDay: number
        }
    }[]
}

export default function CampaignLaunchPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const campaignId = params.id as string

    const [loading, setLoading] = useState(true)
    const [launching, setLaunching] = useState(false)
    const [campaign, setCampaign] = useState<CampaignData | null>(null)
    const [limits, setLimits] = useState<LimitValidation | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch campaign details
                const campaignRes = await fetch(`/api/campaigns/${campaignId}`)
                if (!campaignRes.ok) throw new Error("Failed to load campaign")
                const campaignData = await campaignRes.json()
                setCampaign(campaignData)

                // Fetch leads count
                const leadsRes = await fetch(`/api/campaigns/${campaignId}/leads`)
                const leadsData = await leadsRes.json()
                const totalLeads = Array.isArray(leadsData) ? leadsData.length : (leadsData.total || 0)

                // Extract accounts
                const accounts = campaignData.campaignAccounts
                    ?.filter((ca: any) => ca.emailAccount)
                    .map((ca: any) => ca.emailAccount) || []

                // Validate limits
                const validation = validateCampaignLimits(
                    totalLeads,
                    accounts,
                    (campaignData.dailyLimit) || undefined
                )
                setLimits(validation)

            } catch (error) {
                console.error("Failed to load launch data:", error)
                toast({
                    title: "Error",
                    description: "Failed to load campaign data",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }

        if (campaignId) {
            loadData()
        }
    }, [campaignId, toast])

    const handleLaunch = async () => {
        setLaunching(true)
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
            })

            if (!res.ok) throw new Error("Failed to launch")

            toast({
                title: "Campaign Launched! 🚀",
                description: "Your campaign is now active and sending emails.",
            })

            // Redirect to analytics
            router.push(`/campaigns/${campaignId}`)
            router.refresh()

        } catch (error) {
            console.error("Launch error:", error)
            toast({
                title: "Launch Failed",
                description: "Something went wrong while launching the campaign.",
                variant: "destructive"
            })
        } finally {
            setLaunching(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Checking campaign readiness...</p>
            </div>
        )
    }

    if (!limits) return null

    const capacityInfo = formatCapacityInfo(limits)
    const isReady = limits.accountsAvailable > 0

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Review & Launch</h1>
                    <p className="text-gray-400">Final check before your campaign goes live.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <h3 className="text-gray-300 font-medium">Total Leads</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">{capacityInfo.totalLeads}</p>
                    </div>

                    <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="h-5 w-5 text-green-500" />
                            <h3 className="text-gray-300 font-medium">Daily Capacity</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">{capacityInfo.dailyCapacity}</p>
                    </div>

                    <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-orange-500" />
                            <h3 className="text-gray-300 font-medium">Estimated Time</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {limits.daysNeeded === Infinity ? '∞' : `${limits.daysNeeded} days`}
                        </p>
                    </div>
                </div>

                {/* Status Message */}
                <div className={`p-6 rounded-lg border ${!isReady
                        ? 'bg-red-500/10 border-red-500/20'
                        : limits.withinLimits
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-blue-500/10 border-blue-500/20'
                    }`}>
                    <div className="flex gap-4">
                        {(!isReady || !limits.withinLimits) ? (
                            <AlertTriangle className={`h-6 w-6 flex-shrink-0 ${!isReady ? 'text-red-500' : 'text-blue-400'}`} />
                        ) : (
                            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-500" />
                        )}
                        <div>
                            <h3 className={`font-semibold mb-1 ${!isReady ? 'text-red-400' : limits.withinLimits ? 'text-green-400' : 'text-blue-400'
                                }`}>
                                {!isReady ? "Action Required" : limits.withinLimits ? "All Systems Go" : "Ready with Note"}
                            </h3>
                            <p className="text-gray-300 leading-relaxed">
                                {getWarningMessage(limits)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#2a2a2a]">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-white"
                    >
                        Go Back
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleLaunch}
                        disabled={!isReady || launching}
                        className={`min-w-[150px] gap-2 ${!isReady ? 'bg-gray-700' : 'bg-green-600 hover:bg-green-500'
                            } text-white`}
                    >
                        {launching ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Launching...
                            </>
                        ) : (
                            <>
                                <Rocket className="h-5 w-5" />
                                Launch Campaign
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
