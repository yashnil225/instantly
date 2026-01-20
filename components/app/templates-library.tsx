"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    Search,
    Star,
    Copy,
    Eye,
    Briefcase,
    Users,
    RefreshCw,
    Sparkles,
    ChevronRight,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface EmailTemplate {
    id: string
    name: string
    subject: string
    body: string
    category: string
    isFavorite: boolean
    usageCount: number
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
    {
        id: "1",
        name: "Cold Outreach - Initial",
        subject: "Quick question about {{company}}",
        body: `Hi {{firstName}},

I noticed that {{company}} has been expanding rapidly. I wanted to reach out because we've helped similar companies in your space achieve 3x growth in their outbound pipeline.

Would you be open to a quick 15-minute call this week to explore if we might be a fit?

Best,
{{senderFirstName}}`,
        category: "cold_outreach",
        isFavorite: true,
        usageCount: 156
    },
    {
        id: "2",
        name: "Follow-up #1",
        subject: "Re: Quick question about {{company}}",
        body: `Hi {{firstName}},

Just wanted to follow up on my previous email. I understand you're busy, so I'll keep this brief.

I'd love to share a case study showing how we helped a company similar to {{company}} increase their response rates by 45%.

Worth a quick chat?

Best,
{{senderFirstName}}`,
        category: "follow_up",
        isFavorite: false,
        usageCount: 128
    },
    {
        id: "3",
        name: "Meeting Request",
        subject: "{{firstName}}, let's connect this week?",
        body: `Hi {{firstName}},

I've been researching {{company}} and I'm impressed by what you're building.

I'd love to schedule a brief 15-minute call to discuss how we might be able to help accelerate your growth.

Would Tuesday or Wednesday work for you?

Best,
{{senderFirstName}}`,
        category: "meeting_request",
        isFavorite: false,
        usageCount: 89
    },
    {
        id: "4",
        name: "Breakup Email",
        subject: "Closing the loop",
        body: `Hi {{firstName}},

I've reached out a few times but haven't heard back, so I'll assume the timing isn't right.

If things change in the future, feel free to reach out. I'm always here to help.

Wishing you and {{company}} continued success!

Best,
{{senderFirstName}}`,
        category: "follow_up",
        isFavorite: true,
        usageCount: 67
    },
    {
        id: "5",
        name: "Referral Request",
        subject: "Quick favor, {{firstName}}?",
        body: `Hi {{firstName}},

I hope this finds you well! I wanted to reach out because I'm looking to connect with companies in your network that might benefit from our solution.

Would you be open to making a quick introduction if you know anyone who might be interested?

Happy to return the favor anytime!

Best,
{{senderFirstName}}`,
        category: "referral",
        isFavorite: false,
        usageCount: 45
    },
    {
        id: "6",
        name: "Post-Demo Follow-up",
        subject: "Great connecting today, {{firstName}}!",
        body: `Hi {{firstName}},

Thanks for taking the time to chat today! I really enjoyed learning more about {{company}} and your goals.

As promised, I'm attaching the case study we discussed. Let me know if you have any questions.

Looking forward to our next steps!

Best,
{{senderFirstName}}`,
        category: "post_meeting",
        isFavorite: false,
        usageCount: 34
    }
]

const CATEGORIES = [
    { id: "all", name: "All Templates", icon: Sparkles },
    { id: "cold_outreach", name: "Cold Outreach", icon: Briefcase },
    { id: "follow_up", name: "Follow-ups", icon: RefreshCw },
    { id: "meeting_request", name: "Meeting Requests", icon: Users },
    { id: "referral", name: "Referrals", icon: Star },
    { id: "post_meeting", name: "Post-Meeting", icon: ChevronRight },
]

interface TemplatesLibraryProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (subject: string, body: string) => void
}

export function TemplatesLibrary({ open, onOpenChange, onSelect }: TemplatesLibraryProps) {
    const { toast } = useToast()
    const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES)
    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState("all")
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.subject.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = activeCategory === "all" || t.category === activeCategory
        return matchesSearch && matchesCategory
    })

    const handleSelect = (template: EmailTemplate) => {
        onSelect(template.subject, template.body)
        onOpenChange(false)
        toast({ title: "Template applied", description: template.name })
    }

    const toggleFavorite = (id: string) => {
        setTemplates(prev => prev.map(t =>
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[600px] bg-background border-border p-0 flex flex-col overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">Email Templates</DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-56 border-r border-border p-4 space-y-1">
                        {CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                                    activeCategory === category.id
                                        ? "bg-blue-600/10 text-blue-500"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                            >
                                <category.icon className="h-4 w-4" />
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {/* Search */}
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search templates..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-secondary border-border h-9"
                                />
                            </div>
                        </div>

                        {/* Templates Grid */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 auto-rows-max">
                            {filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="group p-4 rounded-xl border border-border bg-card hover:border-blue-600/50 transition-all cursor-pointer"
                                    onClick={() => handleSelect(template)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {template.subject}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleFavorite(template.id)
                                                }}
                                                className="p-1 rounded hover:bg-secondary"
                                            >
                                                <Star className={cn(
                                                    "h-4 w-4",
                                                    template.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                                                )} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setPreviewTemplate(template)
                                                }}
                                                className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {template.body.substring(0, 100)}...
                                    </p>
                                    <div className="flex items-center justify-between mt-3">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                            {CATEGORIES.find(c => c.id === template.category)?.name}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            Used {template.usageCount}x
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Modal */}
                {previewTemplate && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-8">
                        <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-full overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h3 className="font-semibold">{previewTemplate.name}</h3>
                                <button
                                    onClick={() => setPreviewTemplate(null)}
                                    className="p-1 rounded hover:bg-secondary"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium uppercase">Subject</label>
                                    <p className="mt-1 font-medium">{previewTemplate.subject}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium uppercase">Body</label>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">{previewTemplate.body}</p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-border flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setPreviewTemplate(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                                    onClick={() => {
                                        handleSelect(previewTemplate)
                                        setPreviewTemplate(null)
                                    }}
                                >
                                    Use Template
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
