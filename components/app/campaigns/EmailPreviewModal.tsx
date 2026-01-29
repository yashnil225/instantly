
import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, ShieldCheck, Mail, X, Loader2, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Lead {
    id: string
    email: string
    firstName?: string
    lastName?: string
    company?: string
    customFields?: string | Record<string, unknown>
}

interface EmailPreviewModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subject: string
    body: string
    variables?: { label: string, value: string }[]
    campaignId?: string
    sampleLead?: Lead | null
}

// Removed unused variables variables and campaignId from destructuring if they are not used
export function EmailPreviewModal({ open, onOpenChange, subject, body, sampleLead }: EmailPreviewModalProps) {
    const { toast } = useToast()
    const [testEmail, setTestEmail] = useState("")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccountId, setSelectedAccountId] = useState("")
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    // Load email accounts when modal opens
    useEffect(() => {
        if (open) {
            loadAccounts()
            setSent(false)
        }
    }, [open])

    const loadAccounts = async () => {
        try {
            const res = await fetch('/api/accounts?limit=100')
            if (res.ok) {
                const data = await res.json()
                const accs = Array.isArray(data.accounts) ? data.accounts : []
                setAccounts(accs)
                // Auto-select first active account
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const activeAcc = accs.find((a: any) => a.status === 'active')
                if (activeAcc) {
                    setSelectedAccountId(activeAcc.id)
                }
            }
        } catch (error) {
            console.error('Failed to load accounts:', error)
        }
    }

    const handleSendTestEmail = async () => {
        if (!selectedAccountId) {
            toast({ title: "Error", description: "Please select an email account", variant: "destructive" })
            return
        }
        if (!testEmail || !testEmail.includes('@')) {
            toast({ title: "Error", description: "Please enter a valid recipient email", variant: "destructive" })
            return
        }

        setSending(true)
        try {
            const res = await fetch(`/api/accounts/${selectedAccountId}/test-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: testEmail,
                    subject: subject || 'Test Email',
                    body: body || 'This is a test email.'
                })
            })

            const data = await res.json()

            if (res.ok) {
                setSent(true)
                toast({ title: "Success", description: "Test email sent successfully!" })
            } else {
                toast({
                    title: "Failed to send",
                    description: data.details || data.error || "Check your email account settings",
                    variant: "destructive"
                })
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to send test email"
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            })
        } finally {
            setSending(false)
        }
    }

    const selectedAccount = accounts.find(a => a.id === selectedAccountId)

    const replaceVariables = (text: string) => {
        if (!text) return ""
        let processed = text

        // Default mock data if no sample lead
        const data = sampleLead || {
            firstName: "",
            lastName: "",
            email: "",
            company: "",
            customFields: {}
        }

        processed = processed.replace(/{{firstName}}/gi, (data.firstName || "").replace(/<[^>]*>/g, '').trim())
        processed = processed.replace(/{{lastName}}/gi, (data.lastName || "").replace(/<[^>]*>/g, '').trim())
        processed = processed.replace(/{{email}}/gi, (data.email || "").replace(/<[^>]*>/g, '').trim())
        processed = processed.replace(/{{company}}/gi, (data.company || "").replace(/<[^>]*>/g, '').trim())

        // Handle custom fields
        if (data.customFields) {
            const customFields = typeof data.customFields === 'string'
                ? JSON.parse(data.customFields)
                : data.customFields

            Object.entries(customFields).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'gi')
                const cleanValue = String(value).replace(/<[^>]*>/g, '').trim()
                processed = processed.replace(regex, cleanValue)
            })
        }

        return processed
    }

    const previewBody = replaceVariables(body)
    const previewSubject = replaceVariables(subject)

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
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-gray-300 h-10">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#333] text-gray-300">
                                    {accounts.length === 0 ? (
                                        <SelectItem value="none" disabled>No accounts available</SelectItem>
                                    ) : (
                                        accounts.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.email} {acc.status !== 'active' && `(${acc.status})`}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Send to:</label>
                            <Input
                                type="email"
                                placeholder="recipient@example.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="bg-[#1a1a1a] border-[#333] text-gray-300 h-10"
                            />
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
                                    <Input
                                        value={selectedAccount ? `${selectedAccount.firstName || ''} ${selectedAccount.lastName || ''}`.trim() || selectedAccount.email : ''}
                                        className="bg-transparent border-[#333] text-gray-300 h-8 text-sm"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">sendingAccountFirstName</label>
                                    <Input
                                        value={selectedAccount?.firstName || ''}
                                        className="bg-transparent border-[#333] text-gray-300 h-8 text-sm"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">sendingAccountEmail</label>
                                    <Input
                                        value={selectedAccount?.email || ''}
                                        className="bg-transparent border-[#333] text-gray-300 h-8 text-sm"
                                        readOnly
                                    />
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
                                    <span className="text-gray-400">From:</span>
                                    <span className="text-gray-600">{selectedAccount?.email || 'Select an account'}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] items-center">
                                    <span className="text-gray-400">To:</span>
                                    <span className="text-gray-600">{testEmail || 'Enter recipient email'}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] items-center border-b border-gray-100 pb-2">
                                    <span className="text-gray-400">Subject:</span>
                                    <span className="font-medium text-gray-800">{previewSubject || <span className="text-gray-400 font-normal">No subject</span>}</span>
                                </div>
                            </div>
                        </div>

                        {/* Email Body */}
                        <div className="flex-1 p-8 overflow-y-auto bg-[#1a1a1a]">
                            <div
                                className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans max-w-3xl"
                                dangerouslySetInnerHTML={{ __html: previewBody || "Your email content will appear here..." }}
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
                                <Button
                                    onClick={handleSendTestEmail}
                                    disabled={sending || !selectedAccountId || !testEmail}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {sending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                                    ) : sent ? (
                                        <><Check className="h-4 w-4 mr-2" /> Sent!</>
                                    ) : (
                                        <><Send className="h-4 w-4 mr-2" /> Send test email</>
                                    )}
                                </Button>
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

