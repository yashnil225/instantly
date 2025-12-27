
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Send, ShieldCheck, Mail, X } from "lucide-react"

interface EmailPreviewModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subject: string
    body: string
    variables?: { label: string, value: string }[]
}

export function EmailPreviewModal({ open, onOpenChange, subject, body, variables = [] }: EmailPreviewModalProps) {
    const [testEmail, setTestEmail] = useState("")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[700px] bg-[#0a0a0a] border-[#333] p-0 flex flex-col overflow-hidden text-gray-300">
                {/* Header: Test Email */}
                <div className="p-4 border-b border-[#222] flex items-center gap-3">
                    <div className="flex items-center gap-2 text-white font-medium">
                        <Send className="h-4 w-4" /> Test Email
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Configuration */}
                    <div className="w-[320px] border-r border-[#222] p-5 flex flex-col gap-6 bg-[#0f0f0f]">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Send from:</label>
                            <Select defaultValue="default">
                                <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-gray-300 h-10">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#333] text-gray-300">
                                    <SelectItem value="default">salesnextup@google.com</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Load data for lead:</label>
                            <Select>
                                <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-gray-300 h-10">
                                    <SelectValue placeholder="Select a lead..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#333] text-gray-300">
                                    <SelectItem value="lead1">Yashnil Shukla</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <div className="h-4 w-4 bg-gray-600 rounded-full flex items-center justify-center text-[10px] text-black font-bold">V</div>
                                <span className="font-semibold text-sm text-gray-300">Variables</span>
                            </div>
                            <div className="h-px bg-[#222] w-full" />

                            <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">sendingAccountName</label>
                                    <Input value="Yashnil Shukla" className="bg-transparent border-[#333] text-gray-300 h-8 text-sm" readOnly />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">sendingAccountFirstName</label>
                                    <Input value="Yashnil" className="bg-transparent border-[#333] text-gray-300 h-8 text-sm" readOnly />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">trackingDomain</label>
                                    <Input placeholder="Enter variable" className="bg-transparent border-[#333] text-gray-500 h-8 text-sm placeholder:text-gray-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="flex-1 flex flex-col bg-[#050505]">
                        {/* Email Header Preview */}
                        <div className="bg-white p-6 border-b border-gray-100 text-gray-800">
                            <div className="flex items-center gap-2 mb-4 text-gray-400/50">
                                <div className="h-4 w-4 rounded-full border border-gray-300" />
                                <span className="font-semibold text-lg text-gray-300 select-none">Email Preview</span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-[80px_1fr] items-center">
                                    <span className="text-gray-400">Send to:</span>
                                    <span className="text-gray-300 italic">Enter email address</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] items-center border-b border-gray-100 pb-2">
                                    <span className="text-gray-400">Subject:</span>
                                    <span className="font-medium text-gray-800">{subject || <span className="text-gray-400 font-normal">— quick referral for you</span>}</span>
                                </div>
                            </div>
                        </div>

                        {/* Email Body */}
                        <div className="flex-1 p-8 overflow-y-auto bg-[#1a1a1a]">
                            <div
                                className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans max-w-3xl"
                                dangerouslySetInnerHTML={{ __html: body || "Your email content will appear here..." }}
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-[#0a0a0a] border-t border-[#222] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Preview as:</span>
                                <Button variant="outline" size="sm" className="h-7 text-xs border-blue-900/50 text-blue-400 hover:bg-blue-900/20">
                                    <Mail className="h-3 w-3 mr-1" /> Gmail
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs border-[#333] text-gray-400 hover:bg-[#222]">
                                    <Mail className="h-3 w-3 mr-1" /> Outlook
                                </Button>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="bg-transparent border-blue-900/50 text-blue-500 hover:bg-blue-900/20 hover:text-blue-400">
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Check Deliverability Score
                                </Button>
                                <div className="flex items-center rounded-md bg-blue-600 hover:bg-blue-700 transition-colors">
                                    <Button className="bg-transparent hover:bg-transparent text-white border-0 shadow-none">
                                        <Send className="h-4 w-4 mr-2" /> Send test email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Close Button Absolute */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </DialogContent>
        </Dialog>
    )
}
