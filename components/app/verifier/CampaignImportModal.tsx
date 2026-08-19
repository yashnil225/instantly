"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
    const [isCreatingNew, setIsCreatingNew] = useState(false)
    const [newCampaignName, setNewCampaignName] = useState("")
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
                    } else if (list.length === 0) {
                        setIsCreatingNew(true)
                    }
                }
            } catch (err) {
                console.error("Failed to load campaigns", err)
            } finally {
                setIsLoadingCampaigns(false)
            }
        }

        fetchCampaigns()
        setNewCampaignName(jobFileName ? `${jobFileName.replace(/\.[^/.]+$/, "")} Campaign` : "Verified Leads Campaign")
    }, [open, jobFileName])

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
    const currentLeadCount = isCreatingNew ? 0 : (selectedCampaign?._count?.leads || 0)
    const totalToImport = validCount + (includeRisky ? riskyCount : 0)

    // Automatically adapt action choice if campaign is empty
    useEffect(() => {
        if (currentLeadCount === 0) {
            setAction('add')
        }
    }, [currentLeadCount])

    const handleImport = async () => {
        setIsSubmitting(true)
        try {
            let targetCampaignId = selectedCampaignId

            // If creating a new campaign on the fly
            if (isCreatingNew) {
                if (!newCampaignName.trim()) {
                    toast({ title: "Campaign name required", description: "Please enter a name for the new campaign", variant: "destructive" })
                    setIsSubmitting(false)
                    return
                }

                const createRes = await fetch("/api/campaigns", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newCampaignName.trim() })
                })

                const createdCampaign = await createRes.json()
                if (!createRes.ok) throw new Error(createdCampaign.error || "Failed to create new campaign")
                targetCampaignId = createdCampaign.id
            }

            if (!targetCampaignId) {
                toast({ title: "Campaign required", description: "Please select or create a target campaign", variant: "destructive" })
                setIsSubmitting(false)
                return
            }

            const res = await fetch(`/api/campaigns/${targetCampaignId}/leads/replace-or-add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId,
                    action: isCreatingNew ? 'add' : action,
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

                {/* Campaign Selection / Creation */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Target Campaign</Label>
                        <button
                            type="button"
                            onClick={() => setIsCreatingNew(!isCreatingNew)}
                            className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors"
                        >
                            {isCreatingNew ? "← Select existing campaign" : "+ Create new campaign"}
                        </button>
                    </div>

                    {isCreatingNew ? (
                        <div className="space-y-2">
                            <Input
                                placeholder="e.g. Q3 Outreach Campaign"
                                value={newCampaignName}
                                onChange={(e) => setNewCampaignName(e.target.value)}
                                className="h-11 bg-background"
                                autoFocus
                            />
                            <p className="text-[11px] text-muted-foreground">A fresh new campaign will be created with these leads.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {campaigns.length === 0 && !isLoadingCampaigns ? (
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>No existing campaigns found.</span>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => setIsCreatingNew(true)} className="h-7 text-xs">
                                        Create One Now
                                    </Button>
                                </div>
                            ) : (
                                <Select value={selectedCampaignId} onValueChange={(val) => {
                                    if (val === "__new__") {
                                        setIsCreatingNew(true)
                                    } else {
                                        setSelectedCampaignId(val)
                                    }
                                }}>
                                    <SelectTrigger className="w-full h-11 bg-background">
                                        <SelectValue placeholder="Choose a campaign..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__new__" className="text-blue-500 font-semibold border-b border-border/40 pb-2">
                                            + Create New Campaign
                                        </SelectItem>
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
                    )}
                </div>

                {/* Action Mode: Add vs Replace */}
                {(selectedCampaign || isCreatingNew) && (
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Import Method</Label>
                        
                        {(currentLeadCount === 0 || isCreatingNew) ? (
                            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground flex items-center gap-2.5">
                                <PlusCircle className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <strong className="block text-primary">Fresh Campaign Import</strong>
                                    All verified valid leads will be added directly into the campaign.
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
                        disabled={isSubmitting || (!isCreatingNew && !selectedCampaignId) || (isCreatingNew && !newCampaignName.trim())}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                {isCreatingNew ? 'Creating & Importing...' : 'Importing to Campaign...'}
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                {isCreatingNew ? 'Create & Add to Campaign' : (action === 'replace' && currentLeadCount > 0 ? 'Replace & Add Leads' : 'Add to Campaign')}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
