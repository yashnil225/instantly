
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, ChevronRight, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TemplatesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectTemplate: (subject: string, body: string) => void
}

const TEMPLATE_CATEGORIES = [
    { id: 'custom', name: 'Custom Templates', count: 0 },
    {
        id: 'leadgen', name: 'Lead Generation', count: 5, templates: [
            { id: 't1', name: 'Solution for {{company}}', subject: "Solution for {{company}}", body: "Hi {{firstName}},\n\nI noticed that {{company}} is currently looking for..." },
            { id: 't2', name: 'Scaling {{company}}', subject: "Question about scaling {{company}}", body: "Hey {{firstName}},\n\nAre you the right person to speak to about..." },
            { id: 't3', name: 'Quick Question', subject: "{{firstName}} - quick question", body: "Hey {{firstName}},\n\nYour LinkedIn was impressive and I wanted to reach out directly:)\n\nSo we're helping (target group) from (location) to fill their cal with 5-12 calls with (their ideal customer) daily.\nIf you let me have a call with you about how we can do the same for you,\nI will send you a burger with UberEats:D\n\nAre you free any time this week for a quick chat?\n\nCheers,\nNAME" }
        ]
    },
    { id: 'agency', name: 'LeadGen Agency', count: 3 },
    { id: 'video', name: 'Video Production', count: 2 },
    { id: 'marketing', name: 'Marketing & Advertising', count: 4 },
    { id: 'coaching', name: 'Coaching', count: 6 },
]

export function TemplatesModal({ open, onOpenChange, onSelectTemplate }: TemplatesModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('leadgen')
    const [selectedTemplate, setSelectedTemplate] = useState<any>(TEMPLATE_CATEGORIES[1].templates![2]) // Default to the one in screenshot

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[700px] bg-[#0a0a0a] border-[#333] p-0 flex flex-col gap-0 text-gray-300 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[#222] flex items-center gap-2">
                    <span className="font-semibold text-white">Templates</span>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-[300px] border-r border-[#222] flex flex-col">
                        <div className="p-4 border-b border-[#222]">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search"
                                    className="bg-[#111] border-[#333] pl-9 h-9 text-sm focus-visible:ring-1 focus-visible:ring-blue-600"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {TEMPLATE_CATEGORIES.map(cat => (
                                <div key={cat.id}>
                                    <button
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg hover:bg-[#1a1a1a] transition-colors mb-1",
                                            selectedCategory === cat.id ? "text-white font-medium" : "text-gray-400"
                                        )}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        <span>{cat.name}</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </button>
                                    {selectedCategory === cat.id && cat.templates && (
                                        <div className="pl-4 space-y-1 mb-2">
                                            {cat.templates.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setSelectedTemplate(t)}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-xs rounded-md truncate transition-colors",
                                                        selectedTemplate?.id === t.id ? "bg-[#1a1a1a] text-blue-500" : "text-gray-500 hover:text-gray-300"
                                                    )}
                                                >
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 flex flex-col bg-[#111]">
                        {selectedTemplate ? (
                            <div className="flex-1 flex flex-col">
                                <div className="p-6 flex-1 overflow-y-auto">
                                    <div className="mb-6">
                                        <span className="text-gray-500 text-sm font-medium mr-2">Subject:</span>
                                        <span className="text-white text-sm">{selectedTemplate.subject}</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a] min-h-[400px]">
                                        <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                            {selectedTemplate.body}
                                        </pre>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-[#2a2a2a] flex justify-end gap-3 bg-[#0a0a0a]">
                                    <Button variant="outline" className="border-[#333] text-gray-300 hover:text-white" onClick={() => navigator.clipboard.writeText(selectedTemplate.body)}>
                                        <Copy className="h-4 w-4 mr-2" /> Copy
                                    </Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                                        onSelectTemplate(selectedTemplate.subject, selectedTemplate.body)
                                        onOpenChange(false)
                                    }}>
                                        Use template
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                Select a template to preview
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
