"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
    ShieldCheck,
    Send,
    RefreshCw,
    PlusCircle,
    Replace,
    CheckCircle2,
    Users,
    Sparkles,
    AlertCircle,
    History
} from "lucide-react"

interface CampaignImportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    jobId?: string
    jobFileName?: string
    validCount?: number
    riskyCount?: number
    onSuccess?: () => void
}

interface CampaignOption {
    id: string
    name: string
    status: string
    _count?: {
        leads: number
    }
}

export function CampaignImportModal({
    open,
    onOpenChange,
    jobId,
    jobFileName = "Verified Leads",
    validCount = 0,
    riskyCount = 0,
    onSuccess
}: CampaignImportModalProps) {
    const { toast } = useToast()
    const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
    const [action, setAction] = useState<'add' | 'replace'>('add')
    const [includeRisky, setIncludeRisky] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load available campaigns
    useEffect(() => {
        if (!open) return

        const fetchCampaigns = async () => {
            setIsLoadingCampaigns(true)
            try {
                const res = await fetch("/api/campaigns")
                if (res.ok) {
                    const data = await res.json()
                    const list = data.campaigns || data || []
                    setCampaigns(list)
                    if (list.length > 0 && !selectedCampaignId) {
                        setSelectedCampaignId(list[0].id)
                    }
                }
            } catch (err) {
                console.error("Failed to load campaigns", err)
            } finally {
                setIsLoadingCampaigns(false)
            }
        }

        fetchCampaigns()
    }, [open])

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
    const currentLeadCount = selectedCampaign?._count?.leads || 0
    const totalToImport = validCount + (includeRisky ? riskyCount : 0)

    // Automatically adapt action choice if campaign is empty
    useEffect(() => {
        if (currentLeadCount === 0) {
            setAction('add')
        }
    }, [currentLeadCount])

    const handleImport = async () => {
        if (!selectedCampaignId) {
            toast({ title: "Campaign required", description: "Please select a target campaign", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/campaigns/${selectedCampaignId}/leads/replace-or-add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId,
                    action,
                    includeRisky
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to import leads to campaign")

            toast({
                title: "Campaign Leads Updated 🎉",
                description: data.message || `Added ${data.importedCount} verified leads into ${data.campaignName || 'campaign'}.`
            })

            onOpenChange(false)
            if (onSuccess) onSuccess()
        } catch (err: any) {
            toast({
                title: "Import Error",
                description: err.message || "Failed to import leads",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] p-6 space-y-6">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Send className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Import Verified Leads to Campaign</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Add or replace verified leads directly into your outreach campaigns.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Lead Summary Banner */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source File</div>
                        <div className="font-semibold text-sm truncate max-w-[280px]">{jobFileName}</div>
                    </div>
                    <div className="text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold gap-1 px-2.5 py-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {totalToImport} Verified {includeRisky ? 'Leads' : 'Valid Only'}
                        </Badge>
                    </div>
                </div>

                {/* Campaign Selection */}
                <div className="space-y-2.5">
                    <Label className="text-sm font-semibold flex items-center justify-between">
                        <span>Select Target Campaign</span>
                        {isLoadingCampaigns && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    </Label>

                    {campaigns.length === 0 && !isLoadingCampaigns ? (
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>No campaigns found. Please create a campaign in the Campaigns tab first.</span>
                        </div>
                    ) : (
                        <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                            <SelectTrigger className="w-full h-11 bg-background">
                                <SelectValue placeholder="Choose a campaign..." />
                            </SelectTrigger>
                            <SelectContent>
                                {campaigns.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        <div className="flex items-center justify-between gap-4 w-full">
                                            <span className="font-medium">{c.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({c._count?.leads || 0} existing leads)
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Action Mode: Add vs Replace */}
                {selectedCampaign && (
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Import Method</Label>
                        
                        {currentLeadCount === 0 ? (
                            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground flex items-center gap-2.5">
                                <PlusCircle className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <strong className="block text-primary">Fresh Campaign Import</strong>
                                    This campaign has 0 leads. All verified valid leads will be added directly.
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAction('add')}
                                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                        action === 'add' ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary' : 'bg-muted/30 border-border/60 hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${action === 'add' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                            {action === 'add' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="font-bold text-xs text-foreground">Add New Leads</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                                        Keep current leads and append new verified leads. Duplicates skipped automatically.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAction('replace')}
                                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                        action === 'replace' ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary' : 'bg-muted/30 border-border/60 hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${action === 'replace' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                            {action === 'replace' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="font-bold text-xs text-amber-500">Replace Leads</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                                        Replaces uncontacted leads with verified list. Contacted leads stay safe via Status Memory.
                                    </p>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Status Memory & Quality Assurance Notes */}
                <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-start gap-2 text-muted-foreground">
                        <History className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>
                            <strong>Lead Memory Protection:</strong> Any re-uploaded lead that was already contacted, replied, or bounced will automatically retain its status and won&apos;t be re-emailed from Step 1.
                        </span>
                    </div>

                    {riskyCount > 0 && (
                        <div className="flex items-center space-x-2 pt-2 border-t border-border/40">
                            <Checkbox
                                id="include-risky"
                                checked={includeRisky}
                                onCheckedChange={(checked) => setIncludeRisky(!!checked)}
                            />
                            <Label htmlFor="include-risky" className="text-xs cursor-pointer text-muted-foreground">
                                Also include {riskyCount} Risky / Catch-All leads (Optional)
                            </Label>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleImport}
                        disabled={isSubmitting || !selectedCampaignId || campaigns.length === 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Importing to Campaign...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                {action === 'replace' && currentLeadCount > 0 ? 'Replace & Add Leads' : 'Add to Campaign'}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
