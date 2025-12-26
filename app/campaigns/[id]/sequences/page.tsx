"use client"

import { useState, useEffect } from "react"
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
    Copy
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
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
import { TemplatesModal } from "@/components/campaigns/TemplatesModal"
import { RichEditor } from "@/components/ui/rich-editor"
import { EmailPreviewModal } from "@/components/campaigns/EmailPreviewModal"

// Types matching backend
interface SequenceVariant {
    subject: string
    body: string
}

interface SequenceStep {
    id?: string
    stepNumber: number
    day: number
    variants: SequenceVariant[]
    activeVariant?: number // Frontend state
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

    // UI State
    const [variableMenuOpen, setVariableMenuOpen] = useState(false)
    const [aiMenuOpen, setAiMenuOpen] = useState(false)
    const [templatesOpen, setTemplatesOpen] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    // Fetch available variables from campaign leads
    useEffect(() => {
        const fetchLeadFields = async () => {
            try {
                const res = await fetch(`/api/campaigns/${params.id}/leads?limit=1`)
                if (res.ok) {
                    const leads = await res.json()
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

    // Initial Load
    useEffect(() => {
        fetchSequences()
    }, [params.id])

    const fetchSequences = async () => {
        try {
            const res = await fetch(`/api/campaigns/${params.id}/sequence`)
            if (res.ok) {
                const data = await res.json()
                const mappedSteps = data.map((seq: any) => ({
                    id: seq.id,
                    stepNumber: seq.stepNumber,
                    day: seq.dayGap,
                    variants: seq.variants.length > 0 ? seq.variants : [{ subject: '', body: '' }],
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
    }

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
        if (steps.length === 1) return // Don't delete last step maybe? Or allow empty.
        const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }))
        setSteps(newSteps)
        if (activeStepIndex >= newSteps.length) setActiveStepIndex(newSteps.length - 1)
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

    const updateStep = (index: number, field: 'day' | 'variant', value: any, variantIndex = 0, variantField?: keyof SequenceVariant) => {
        const newSteps = [...steps]
        if (field === 'day') {
            newSteps[index].day = parseInt(value) || 0
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
        newSteps[stepIndex].variants.push({ subject: '', body: '' })
        newSteps[stepIndex].activeVariant = newSteps[stepIndex].variants.length - 1
        setSteps(newSteps)
    }

    const insertVariable = (variable: string) => {
        const activeStep = steps[activeStepIndex]
        const currentBody = activeStep.variants[activeStep.activeVariant || 0].body
        // Append to end for simplicity, ideally at cursor position if we had ref
        updateStep(activeStepIndex, 'variant', currentBody + " " + variable, activeStep.activeVariant, 'body')
        setVariableMenuOpen(false)
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
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>

    const activeStep = steps[activeStepIndex]
    const activeVariant = activeStep?.variants[activeStep?.activeVariant || 0] || { subject: '', body: '' }

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

                        {/* Subject Preview Box */}
                        <div className="bg-[#1a1a1a] rounded-lg p-3 mb-3 border border-[#2a2a2a]">
                            <p className="text-xs text-gray-400 truncate">
                                {step.variants[0].subject || <span className="italic opacity-50">No subject</span>}
                            </p>
                        </div>

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
                ))
                }

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
                                                    <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer gap-3 justify-between p-2.5 rounded-md group" onClick={() => toast({ title: "Spam Check Passed", description: "No high-risk spam words detected." })}>
                                                        <div className="flex items-center gap-3">
                                                            <ShieldAlert className="h-4 w-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
                                                            <span className="text-sm font-medium">AI Spam Words Checker</span>
                                                        </div>
                                                        <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-800/50">Beta</span>
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
                                        </div>
                                    }
                                />
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
                                            {VARIABLES.map(v => (
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
                                            You're trying to delete a step for a launched campaign.
                                            <br /><br />
                                            This can cause issues with the campaign's analytics reporting - are you sure you want proceed?
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

                        </>
                    )
                }
            </div>
        </div>
    )
}
