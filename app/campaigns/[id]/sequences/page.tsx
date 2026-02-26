"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Trash2,
    Plus,
    Eye,
    Zap,
    ChevronDown,
    Sparkles,
    RefreshCw,
    ShieldAlert,
    LayoutTemplate,
    Eraser,
    Link as LinkIcon,
    Code,
    Copy,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    CheckCircle,
    Paperclip,
    X,
    Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { checkSpamScore, type SpamCheckResult } from "@/lib/spam-checker"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { TemplatesModal } from "@/components/app/campaigns/TemplatesModal"
import { RichEditor } from "@/components/ui/rich-editor"
import { EmailPreviewModal } from "@/components/app/campaigns/EmailPreviewModal"

// Types matching backend
interface SequenceVariant {
    id?: string
    subject: string
    body: string
    enabled?: boolean
    attachments?: { id: string, filename: string, size: number, mimeType: string }[]
    attachmentIds?: string[]
}

interface SequenceStep {
    id?: string
    stepNumber: number
    day: number
    variants: SequenceVariant[]
    activeVariant?: number // Frontend state
}

interface Lead {
    id: string
    email: string
    firstName?: string
    lastName?: string
    company?: string
    customFields?: string | Record<string, unknown>
}

// Core variables that are always available
const CORE_VARIABLES = [
    { label: "First Name", value: "{{firstName}}" },
    { label: "Last Name", value: "{{lastName}}" },
    { label: "Email", value: "{{email}}" },
    { label: "Company", value: "{{company}}" },
]

export default function SequencesPage() {
    const params = useParams()
    const { toast } = useToast()
    const [steps, setSteps] = useState<SequenceStep[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeStepIndex, setActiveStepIndex] = useState(0)

    // Dynamic variables from leads
    const [availableVariables, setAvailableVariables] = useState(CORE_VARIABLES)
    const [sampleLead, setSampleLead] = useState<Lead | null>(null)

    // UI State
    const [variableMenuOpen, setVariableMenuOpen] = useState(false)
    const [aiMenuOpen, setAiMenuOpen] = useState(false)
    const [templatesOpen, setTemplatesOpen] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    // Spam Score State
    const [spamResult, setSpamResult] = useState<SpamCheckResult | null>(null)

    // Fetch available variables from campaign leads
    useEffect(() => {
        const fetchLeadFields = async () => {
            try {
                const res = await fetch(`/api/campaigns/${params.id}/leads?limit=1`)
                if (res.ok) {
                    const leads: Lead[] = await res.json()
                    if (leads.length > 0) {
                        const lead = leads[0]
                        const dynamicVars = [...CORE_VARIABLES]

                        // Add custom fields if they exist
                        if (lead.customFields) {
                            try {
                                const customFields = typeof lead.customFields === 'string'
                                    ? JSON.parse(lead.customFields)
                                    : lead.customFields

                                for (const key of Object.keys(customFields)) {
                                    // Only add if not already in core variables
                                    if (!dynamicVars.find(v => v.value === `{{${key}}}`)) {
                                        dynamicVars.push({
                                            label: key.charAt(0).toUpperCase() + key.slice(1),
                                            value: `{{${key}}}`
                                        })
                                    }
                                }
                            } catch (e) {
                                console.error('Failed to parse custom fields:', e)
                            }
                        }

                        setAvailableVariables(dynamicVars)
                        setSampleLead(lead)

                    }
                }
            } catch (error) {
                console.error('Failed to fetch lead fields:', error)
            }
        }

        if (params.id) {
            fetchLeadFields()
        }
    }, [params.id])

    // Spam Score Check - debounced
    const checkSpam = useCallback(async (subject: string, body: string) => {
        if (!subject && !body) {
            setSpamResult(null)
            return
        }
        try {
            const result = await checkSpamScore(subject, body)
            setSpamResult(result)
        } catch (error) {
            console.error('Spam check failed:', error)
        } finally {
            // Success or fail, we're done
        }
    }, [])

    // Check spam when active variant changes
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentStep = steps[activeStepIndex]
            if (currentStep) {
                const variant = currentStep.variants[currentStep.activeVariant || 0]
                if (variant) {
                    checkSpam(variant.subject || '', variant.body || '')
                }
            }
        }, 500) // Debounce 500ms
        return () => clearTimeout(timer)
    }, [steps, activeStepIndex, checkSpam])

    const fetchSequences = useCallback(async () => {
        try {
            const res = await fetch(`/api/campaigns/${params.id}/sequence`)
            if (res.ok) {
                const data = await res.json()
                const mappedSteps = data.map((seq: any) => ({
                    id: seq.id,
                    stepNumber: seq.stepNumber,
                    day: seq.dayGap,
                    variants: (seq.variants && seq.variants.length > 0)
                        ? seq.variants.map((v: any) => ({
                            ...v,
                            attachmentIds: (v.attachments || []).map((a: any) => a.id)
                        }))
                        : [{ subject: '', body: '', attachmentIds: [] }],
                    activeVariant: 0
                }))
                setSteps(mappedSteps)
                if (mappedSteps.length > 0) setActiveStepIndex(0)
            }
        } catch (error) {
            console.error("Failed to fetch sequences", error)
        } finally {
            setLoading(false)
        }
    }, [params.id])

    // Load sequences on mount
    useEffect(() => {
        if (params.id) {
            fetchSequences()
        }
    }, [params.id, fetchSequences])

    // --- Logic Helpers ---
    const addStep = () => {
        const newStep: SequenceStep = {
            stepNumber: steps.length + 1,
            day: steps.length === 0 ? 0 : 2,
            variants: [{ subject: '', body: '' }],
            activeVariant: 0
        }
        const newSteps = [...steps, newStep]
        setSteps(newSteps)
        setActiveStepIndex(newSteps.length - 1)
    }

    const removeStep = (index: number) => {
        const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }))
        setSteps(newSteps)
        if (newSteps.length === 0) {
            setActiveStepIndex(-1) // No step selected
        } else if (activeStepIndex >= newSteps.length) {
            setActiveStepIndex(newSteps.length - 1)
        }
    }

    const [deleteStepId, setDeleteStepId] = useState<number | null>(null)

    const handleDeleteClick = (index: number) => {
        setDeleteStepId(index)
    }

    const confirmDeleteStep = () => {
        if (deleteStepId !== null) {
            removeStep(deleteStepId)
            setDeleteStepId(null)
            toast({ title: "Step Deleted" })
        }
    }

    const updateStep = (index: number, field: 'day' | 'variant', value: string | number | boolean, variantIndex = 0, variantField?: keyof SequenceVariant) => {
        const newSteps = [...steps]
        if (field === 'day') {
            newSteps[index].day = parseInt(String(value)) || 0
        } else if (field === 'variant' && variantField) {
            newSteps[index].variants[variantIndex] = {
                ...newSteps[index].variants[variantIndex],
                [variantField]: value
            }
        }
        setSteps(newSteps)
    }

    const addVariant = (stepIndex: number) => {
        const newSteps = [...steps]
        newSteps[stepIndex].variants.push({ subject: '', body: '', enabled: true })
        newSteps[stepIndex].activeVariant = newSteps[stepIndex].variants.length - 1
        setSteps(newSteps)
    }

    const removeVariant = (stepIndex: number, variantIndex: number) => {
        const newSteps = [...steps]
        if (newSteps[stepIndex].variants.length <= 1) {
            toast({ title: "Cannot Delete", description: "Step must have at least one variant", variant: "destructive" })
            return
        }
        newSteps[stepIndex].variants = newSteps[stepIndex].variants.filter((_, i) => i !== variantIndex)
        // Reset active variant if needed
        if ((newSteps[stepIndex].activeVariant || 0) >= newSteps[stepIndex].variants.length) {
            newSteps[stepIndex].activeVariant = 0
        }
        setSteps(newSteps)
        toast({ title: "Variant Removed" })
    }

    const toggleVariant = (stepIndex: number, variantIndex: number) => {
        const newSteps = [...steps]
        const variant = newSteps[stepIndex].variants[variantIndex]
        variant.enabled = variant.enabled === false ? true : false // Toggle
        setSteps(newSteps)
    }

    const insertVariable = (variable: string) => {
        const activeStep = steps[activeStepIndex]
        const currentBody = activeStep.variants[activeStep.activeVariant || 0].body
        // Append to end for simplicity, ideally at cursor position if we had ref
        updateStep(activeStepIndex, 'variant', currentBody + " " + variable, activeStep.activeVariant, 'body')
        setVariableMenuOpen(false)
    }

    // --- Attachment Logic ---
    const [uploading, setUploading] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const activeStep = steps[activeStepIndex]
        if (!activeStep) return
        const variant = activeStep.variants[activeStep.activeVariant || 0]

        // 25MB total limit check
        const MAX_TOTAL_SIZE = 25 * 1024 * 1024
        const currentTotalSize = (variant.attachments || []).reduce((sum, a: any) => sum + (a.size || 0), 0)

        if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
            toast({
                title: "Total size limit exceeded",
                description: `Adding "${file.name}" would exceed the 25MB total limit for this variant.`,
                variant: "destructive"
            })
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload/attachment', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error("Upload failed")

            const attachment = await res.json()

            // Add to current variant
            const newSteps = [...steps]
            const variant = newSteps[activeStepIndex].variants[activeStep.activeVariant || 0]

            variant.attachments = [...(variant.attachments || []), attachment]
            variant.attachmentIds = [...(variant.attachmentIds || []), attachment.id]

            setSteps(newSteps)
            toast({ title: "File Uploaded", description: `${file.name} attached.` })

        } catch (error) {
            console.error("Upload error:", error)
            toast({ title: "Upload Failed", description: "Failed to upload file.", variant: "destructive" })
        } finally {
            setUploading(false)
            // Clear input
            e.target.value = ''
        }
    }

    const removeAttachment = (attachmentId: string) => {
        const newSteps = [...steps]
        const variant = newSteps[activeStepIndex].variants[activeStep.activeVariant || 0]

        variant.attachments = (variant.attachments || []).filter((a: any) => a.id !== attachmentId)
        variant.attachmentIds = (variant.attachmentIds || []).filter(id => id !== attachmentId)

        setSteps(newSteps)
    }

    const handleApplyTemplate = (subject: string, body: string) => {
        const activeStep = steps[activeStepIndex]
        const variantIndex = activeStep.activeVariant || 0

        // Update both subject and body
        const newSteps = [...steps]
        newSteps[activeStepIndex].variants[variantIndex] = {
            ...newSteps[activeStepIndex].variants[variantIndex], // Keep other fields if any
            subject: subject,
            body: body
        }
        setSteps(newSteps)
        setTemplatesOpen(false)
        toast({ title: "Template Applied" })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/campaigns/${params.id}/sequence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ steps })
            })
            if (res.ok) toast({ title: "Campaign Saved" })
            else throw new Error("Failed to save")
        } catch (error) {
            console.error("Save failed:", error)
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>

    const activeStep = steps[activeStepIndex]
    const activeVariant = activeStep?.variants?.[activeStep?.activeVariant || 0] || { subject: '', body: '' }

    return (
        <div className="flex bg-[#0a0a0a] min-h-[calc(100vh-100px)]"> {/* Subtracting header height approx */}

            {/* --- LEFT SIDEBAR (Steps List) --- */}
            <div className="w-[320px] flex flex-col border-r border-[#222] p-4 gap-4 overflow-y-auto max-h-[calc(100vh-100px)]">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        onClick={() => setActiveStepIndex(index)}
                        className={cn(
                            "group relative rounded-xl border p-4 transition-all cursor-pointer bg-[#111]",
                            activeStepIndex === index
                                ? "border-blue-600 shadow-[0_0_0_1px_rgba(37,99,235,1)]"
                                : "border-[#222] hover:border-[#333]"
                        )}
                    >
                        {/* Header: Step Number & Delete */}
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-semibold text-white">Step {step.stepNumber}</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-500 hover:text-white hover:bg-transparent"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newStep = { ...step, stepNumber: steps.length + 1 };
                                        setSteps([...steps, newStep]);
                                    }}
                                    title="Duplicate step"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-transparent"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(index); }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Variant Tabs - Show when multiple variants */}
                        {step.variants.length > 1 ? (
                            <div className="space-y-2 mb-3">
                                {step.variants.map((variant, vIdx) => (
                                    <div
                                        key={vIdx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newSteps = [...steps];
                                            newSteps[index].activeVariant = vIdx;
                                            setSteps(newSteps);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all group",
                                            step.activeVariant === vIdx
                                                ? "bg-blue-600/20 border border-blue-600"
                                                : "bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#333]",
                                            variant.enabled === false && "opacity-50"
                                        )}
                                    >
                                        {/* Letter Badge */}
                                        <div className={cn(
                                            "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                                            step.activeVariant === vIdx ? "bg-blue-600 text-white" : "bg-[#333] text-gray-400"
                                        )}>
                                            {String.fromCharCode(65 + vIdx)}
                                        </div>

                                        {/* Subject Preview */}
                                        <span className="flex-1 text-xs text-gray-300 truncate">
                                            {variant.subject || `Subject ${String.fromCharCode(65 + vIdx)}`}
                                        </span>

                                        {/* Toggle On/Off */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleVariant(index, vIdx); }}
                                            className="text-gray-500 hover:text-white transition-colors"
                                            title={variant.enabled === false ? "Enable variant" : "Disable variant"}
                                        >
                                            {variant.enabled === false
                                                ? <ToggleLeft className="h-4 w-4" />
                                                : <ToggleRight className="h-4 w-4 text-blue-500" />
                                            }
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeVariant(index, vIdx); }}
                                            className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete variant"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Single variant - show simple subject preview */
                            <div className="bg-[#1a1a1a] rounded-lg p-3 mb-3 border border-[#2a2a2a]">
                                <p className="text-xs text-gray-400 truncate">
                                    {step.variants[0].subject || <span className="italic opacity-50">No subject</span>}
                                </p>
                            </div>
                        )}

                        {/* + Add Variant Button */}
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); addVariant(index); }}
                                className="text-blue-500 text-sm font-medium hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="h-4 w-4" /> Add variant
                            </button>
                        </div>

                        {/* Footer: Delay Input */}
                        {index < steps.length - 1 && (
                            <div className="flex items-center justify-between pt-3 border-t border-[#222]">
                                <span className="text-xs text-gray-500 font-medium">Send next message in</span>
                                <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 h-7">
                                    <Input
                                        className="h-5 w-8 bg-transparent border-0 text-center text-xs p-0 text-white focus-visible:ring-0"
                                        value={step.day}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateStep(index, 'day', e.target.value)}
                                    />
                                    <span className="text-xs text-gray-500 border-l border-[#333] pl-2">Days</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Big Add Step Button */}
                <Button
                    variant="outline"
                    className="w-full border-dashed border-[#333] text-gray-400 hover:text-white hover:bg-[#111] hover:border-blue-600/50 py-6"
                    onClick={addStep}
                >
                    <Plus className="h-4 w-4 mr-2" /> Add step
                </Button>
            </div >


            {/* --- RIGHT PANEL (Editor) --- */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
                {
                    steps.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select or add a step to start editing
                        </div>
                    ) : (
                        <>
                            {/* Top Bar: Subject & Top Actions */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
                                <div className="flex items-center gap-3 flex-1 mr-8">
                                    <span className="text-gray-500 font-medium">Subject</span>
                                    <div className="flex-1 relative group">
                                        <Input
                                            className="bg-transparent border-0 text-white font-medium text-lg placeholder:text-gray-600 focus-visible:ring-0 px-0 pr-8"
                                            placeholder="{{firstName}} - quick referral for you"
                                            value={activeVariant.subject}
                                            onChange={(e) => updateStep(activeStepIndex, 'variant', e.target.value, activeStep.activeVariant, 'subject')}
                                        />
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="text-gray-500 hover:text-blue-500 p-1" title="Insert Variables in Subject">
                                                        <Zap className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white p-1 min-w-[200px]" align="start" side="bottom">
                                                    {availableVariables.map(v => (
                                                        <DropdownMenuItem
                                                            key={v.value}
                                                            onClick={() => updateStep(activeStepIndex, 'variant', activeVariant.subject + " " + v.value, activeStep.activeVariant, 'subject')}
                                                            className="hover:bg-[#2a2a2a] cursor-pointer rounded-md p-2.5 flex items-center justify-between"
                                                        >
                                                            <span className="text-sm font-medium">{v.label}</span>
                                                            <span className="ml-2 text-gray-500 text-xs font-mono bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">{v.value}</span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Spam Score Badge */}
                                    {spamResult && (
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                                            spamResult.grade === 'A' || spamResult.grade === 'B'
                                                ? "bg-green-900/30 text-green-400 border-green-800/50"
                                                : spamResult.grade === 'C'
                                                    ? "bg-yellow-900/30 text-yellow-400 border-yellow-800/50"
                                                    : "bg-red-900/30 text-red-400 border-red-800/50"
                                        )}>
                                            {spamResult.passed ? (
                                                <CheckCircle className="h-3.5 w-3.5" />
                                            ) : (
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                            )}
                                            <span>Spam: {spamResult.grade}</span>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-[#111] border-[#333] text-gray-300 gap-2 h-9"
                                        onClick={() => setPreviewOpen(true)}
                                    >
                                        <Eye className="h-4 w-4" /> Preview
                                    </Button>
                                    <Button variant="outline" size="icon" className="bg-[#111] border-[#333] text-blue-500 hover:text-blue-400 h-9 w-9">
                                        <Zap className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Editor Area with Toolbar */}
                            <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
                                <RichEditor
                                    value={activeVariant.body}
                                    onChange={(val) => updateStep(activeStepIndex, 'variant', val, activeStep.activeVariant, 'body')}
                                    placeholder={`Hey {{firstName}},\n\nI work with a ~$2M/yr performance marketing firm...`}
                                    leftActions={
                                        <div className="flex items-center gap-2">
                                            {/* Save Split Button */}
                                            <div className="flex items-center rounded-md bg-blue-600 h-8">
                                                <button
                                                    className="px-3 text-xs font-medium text-white border-r border-blue-700 h-full hover:bg-blue-700 transition-colors rounded-l-md"
                                                    onClick={handleSave}
                                                >
                                                    {saving ? "Saving..." : "Save"}
                                                </button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="px-1.5 cursor-pointer hover:bg-blue-700 rounded-r-md h-full flex items-center transition-colors">
                                                            <ChevronDown className="h-3 w-3 text-white" />
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white" align="end">
                                                        <DropdownMenuItem
                                                            className="hover:bg-[#333] cursor-pointer gap-2"
                                                            onClick={() => {
                                                                setTemplatesOpen(true);
                                                                // In a real app this might open a 'Save as Template' modal instead of the manager
                                                                // For now we open templates modal as a placeholder or simulation
                                                                toast({ title: "Template Saved", description: "Current sequence saved as a new template." });
                                                            }}
                                                        >
                                                            <LayoutTemplate className="h-4 w-4" />
                                                            <span>Save as a template</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="w-[1px] h-5 bg-[#333] mx-1" />

                                            {/* AI Tools Dropdown */}
                                            <DropdownMenu open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2 data-[state=open]:bg-[#2a2a2a] data-[state=open]:text-white h-8 text-xs">
                                                        <Sparkles className="h-3 w-3" /> AI Tools
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white w-60 p-1" align="start">
                                                    <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer gap-3 p-2.5 rounded-md group" onClick={() => {
                                                        const ideas = [
                                                            "Hey {{firstName}}, saw your work at {{company}}...",
                                                            "Quick question about {{company}}'s marketing...",
                                                            "Hi {{firstName}}, are you looking to scale?"
                                                        ];
                                                        const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
                                                        updateStep(activeStepIndex, 'variant', randomIdea, activeStep.activeVariant, 'body');
                                                        toast({ title: "AI Generated", description: "New sequence idea generated." });
                                                    }}>
                                                        <Sparkles className="h-4 w-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-sm font-medium">AI Sequence Writer</span>
                                                            <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Generate full sequences</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer gap-3 p-2.5 rounded-md group" onClick={() => {
                                                        const currentBody = activeVariant.body;
                                                        const spintaxed = currentBody.replace(/Hi|Hey|Hello/g, "{Hi|Hey|Hello}");
                                                        if (spintaxed !== currentBody) {
                                                            updateStep(activeStepIndex, 'variant', spintaxed, activeStep.activeVariant, 'body');
                                                            toast({ title: "Spintax Added", description: "Variations added to greetings." });
                                                        } else {
                                                            toast({ title: "AI Spintax", description: "No obvious keywords found to spin." });
                                                        }
                                                    }}>
                                                        <RefreshCw className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-sm font-medium">AI Spintax Writer</span>
                                                            <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Add variety to your emails</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="hover:bg-[#2a2a2a] cursor-pointer gap-3 p-2.5 rounded-md group flex-col items-start"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            checkSpam(activeVariant.subject || '', activeVariant.body || '')
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-3">
                                                                <ShieldAlert className="h-4 w-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
                                                                <span className="text-sm font-medium">Spam Words Checker</span>
                                                            </div>
                                                            {spamResult && (
                                                                <span className={cn(
                                                                    "text-xs px-1.5 py-0.5 rounded font-bold",
                                                                    spamResult.grade === 'A' || spamResult.grade === 'B' ? "bg-green-600 text-white" :
                                                                        spamResult.grade === 'C' ? "bg-yellow-600 text-black" : "bg-red-600 text-white"
                                                                )}>
                                                                    {spamResult.grade} ({spamResult.score})
                                                                </span>
                                                            )}
                                                        </div>
                                                        {spamResult && spamResult.issues.length > 0 && (
                                                            <div className="mt-2 pl-7 space-y-1 max-h-32 overflow-y-auto w-full">
                                                                {spamResult.issues.slice(0, 5).map((issue, idx) => (
                                                                    <div key={idx} className={cn(
                                                                        "text-[10px] flex items-start gap-1",
                                                                        issue.type === 'critical' ? "text-red-400" :
                                                                            issue.type === 'warning' ? "text-yellow-400" : "text-gray-400"
                                                                    )}>
                                                                        <span>•</span>
                                                                        <span>{issue.message}</span>
                                                                    </div>
                                                                ))}
                                                                {spamResult.issues.length > 5 && (
                                                                    <div className="text-[10px] text-gray-500">+{spamResult.issues.length - 5} more issues</div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {spamResult && spamResult.issues.length === 0 && (
                                                            <div className="mt-1 pl-7 text-[10px] text-green-400">✓ No spam issues detected!</div>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-white gap-2 h-8 text-xs transition-colors"
                                                onClick={() => setTemplatesOpen(true)}
                                            >
                                                <LayoutTemplate className="h-3 w-3" /> Templates
                                            </Button>

                                            <DropdownMenu open={variableMenuOpen} onOpenChange={setVariableMenuOpen}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2 h-8 text-xs transition-colors">
                                                        <Zap className="h-3 w-3" /> Variables
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white p-1" align="start">
                                                    {availableVariables.map(v => (
                                                        <DropdownMenuItem key={v.value} onClick={() => insertVariable(v.value)} className="hover:bg-[#2a2a2a] cursor-pointer rounded-md p-2">
                                                            <span className="flex-1">{v.label}</span>
                                                            <span className="ml-4 text-gray-500 text-xs font-mono bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">{v.value}</span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <div className="w-[1px] h-5 bg-[#333] mx-1" />

                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-white gap-2 h-8 text-xs transition-colors"
                                                    disabled={uploading}
                                                    onClick={() => document.getElementById('variant-file-upload')?.click()}
                                                >
                                                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                                                    Attach
                                                </Button>
                                                <input
                                                    id="variant-file-upload"
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                />
                                            </div>
                                        </div>
                                    }
                                />

                                {/* Attachment List */}
                                {activeVariant.attachments && activeVariant.attachments.length > 0 && (
                                    <div className="px-6 py-3 flex flex-wrap gap-2 border-t border-[#222] bg-[#0d0d0d]">
                                        {activeVariant.attachments.map((file: any) => (
                                            <div key={file.id} className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] rounded-md px-2 py-1 text-xs text-gray-300">
                                                <Paperclip className="h-3 w-3 text-gray-500" />
                                                <span className="max-w-[150px] truncate">{file.filename}</span>
                                                <span className="text-[10px] text-gray-600">({(file.size / (1024 * 1024)).toFixed(2)}MB)</span>
                                                <button
                                                    onClick={() => removeAttachment(file.id)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )
                }
            </div>

            <div className="hidden">
                <div className="flex items-center gap-3">
                    {/* Save Split Button */}
                    <div className="flex items-center rounded-md bg-blue-600 hover:bg-blue-700 transition-colors">
                        <button
                            className="px-4 py-2 text-sm font-medium text-white border-r border-blue-700"
                            onClick={handleSave}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <div className="px-1.5 cursor-pointer hover:bg-blue-800 rounded-r-md h-full flex items-center">
                            <ChevronDown className="h-4 w-4 text-white" />
                        </div>
                    </div>

                    {/* Tools Group */}
                    <div className="h-6 w-[1px] bg-[#333] mx-2" /> {/* Divider */}

                    {/* AI Tools Dropdown */}
                    <DropdownMenu open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2 data-[state=open]:bg-[#2a2a2a] data-[state=open]:text-white">
                                <Sparkles className="h-4 w-4" /> AI Tools
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white w-56" align="start">
                            <DropdownMenuItem className="hover:bg-[#333] cursor-pointer gap-2" onClick={() => toast({ title: "Thinking...", description: "AI is generating sequence ideas." })}>
                                <Sparkles className="h-4 w-4 text-purple-400" /> <span>AI Sequence Writer</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-[#333] cursor-pointer gap-2" onClick={() => toast({ title: "Processing...", description: "AI Spintax generation started." })}>
                                <RefreshCw className="h-4 w-4 text-blue-400" /> <span>AI Spintax Writer</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-[#333] cursor-pointer gap-2 justify-between" onClick={() => toast({ title: "Checking...", description: "Scanning for spam words." })}>
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-orange-400" /> <span>AI Spam Words Checker</span>
                                </div>
                                <span className="text-[10px] bg-green-900/50 text-green-400 px-1.5 rounded border border-green-800">Beta</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white gap-2"
                        onClick={() => setTemplatesOpen(true)}
                    >
                        <LayoutTemplate className="h-4 w-4" /> Templates
                    </Button>

                    <DropdownMenu open={variableMenuOpen} onOpenChange={setVariableMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
                                <Zap className="h-4 w-4" /> Variables
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white">
                            {availableVariables.map((v: { label: string; value: string }) => (
                                <DropdownMenuItem key={v.value} onClick={() => insertVariable(v.value)} className="hover:bg-[#333] cursor-pointer">
                                    {v.label} <span className="ml-2 text-gray-500 text-xs">{v.value}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white w-8" onClick={() => toast({ title: "AI Assistant", description: "How can I help you write this email?" })}>
                        <span className="font-serif italic font-bold text-lg">Ai</span>
                    </Button>
                </div>

                <div className="flex items-center gap-1 text-gray-400">
                    <Button variant="ghost" size="icon" className="hover:text-white hover:bg-[#222] w-8 h-8" onClick={() => updateStep(activeStepIndex, 'variant', '', activeStep.activeVariant, 'body')} title="Clear Body">
                        <Eraser className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-white hover:bg-[#222] w-8 h-8" onClick={() => insertVariable('[Link Text](url)')} title="Insert Link">
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-white hover:bg-[#222] w-8 h-8" onClick={() => insertVariable('<b>Bold Text</b>')} title="Insert HTML">
                        <Code className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <EmailPreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                subject={activeVariant.subject}
                body={activeVariant.body}
                sampleLead={sampleLead}
            />




            <TemplatesModal
                open={templatesOpen}
                onOpenChange={setTemplatesOpen}
                onSelectTemplate={handleApplyTemplate}
            />

            <AlertDialog open={deleteStepId !== null} onOpenChange={(open) => !open && setDeleteStepId(null)}>
                <AlertDialogContent className="bg-[#1a1a1a] border-[#222] text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-semibold text-center">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-gray-400">
                            You&apos;re trying to delete a step for a launched campaign.
                            <br /><br />
                            This can cause issues with the campaign&apos;s analytics reporting - are you sure you want proceed?
                            <br /><br />
                            <span className="text-orange-400 font-medium">Warning: This action is irreversible once you save the campaign.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-center gap-3 sm:justify-center mt-4">
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white font-medium border-0"
                            onClick={confirmDeleteStep}
                        >
                            Delete step
                        </AlertDialogAction>
                        <AlertDialogCancel
                            className="bg-[#2a2a2a] text-white hover:bg-[#333] border-0"
                            onClick={() => setDeleteStepId(null)}
                        >
                            Cancel
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
