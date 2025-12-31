"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
    Search,
    ChevronDown,
    ChevronRight,
    Zap,
    CheckCircle2,
    Calendar,
    Trophy,
    MoreHorizontal,
    UserX,
    UserCheck,
    XCircle,
    ThumbsDown,
    ThumbsUp,
    Plus,
    Inbox,
    Mail,
    Clock,
    Send,
    PanelLeftClose,
    PanelLeft,
    Archive,
    Trash2,
    Reply,
    MoreVertical,
    CornerUpLeft,
    CornerUpRight,
    Forward,
    Smile,
    Paperclip,
    Maximize2,
    UserCircle,
    X,
    QrCode,
    Bell,
    Ban,
    Users,
    GitBranch,
    Layers,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/ui/logo"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Email {
    id: string
    from: string
    fromName: string
    company?: string
    subject: string
    preview: string
    body?: string // Added body
    timestamp: Date
    isRead: boolean
    status: string
    aiLabel?: string
    campaign: { id: string; name: string }
    hasReply: boolean
    sentFrom?: string
    recipient?: string
    recipientEmail?: string
}

// Wrapper component with Suspense for useSearchParams
export default function UniboxPageWithSuspense() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <UniboxPage />
        </Suspense>
    )
}

function UniboxPage() {
    const searchParams = useSearchParams()
    const { data: session } = useSession()
    const { toast } = useToast()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [statusExpanded, setStatusExpanded] = useState(false)
    const [aiExpanded, setAiExpanded] = useState(false)
    const [campaignsExpanded, setCampaignsExpanded] = useState(false)
    const [inboxesExpanded, setInboxesExpanded] = useState(false)
    const [moreExpanded, setMoreExpanded] = useState(false)

    const [campaigns, setCampaigns] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [emails, setEmails] = useState<Email[]>([])
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null) // Added selectedEmail
    const [loading, setLoading] = useState(false)
    const [labelModalOpen, setLabelModalOpen] = useState(false)
    const [newLabelName, setNewLabelName] = useState("")
    const [forwardModalOpen, setForwardModalOpen] = useState(false)
    const [forwardToEmail, setForwardToEmail] = useState("")

    // Move to campaign modal
    const [campaignModalOpen, setCampaignModalOpen] = useState(false)
    const [campaignModalSearch, setCampaignModalSearch] = useState("")

    // Reply & Forward state
    const [replyMode, setReplyMode] = useState<'reply' | 'reply-all' | 'forward' | null>(null)
    const [replyBody, setReplyBody] = useState("")
    const [sendingReply, setSendingReply] = useState(false)
    const [forwardSubject, setForwardSubject] = useState("")
    const [forwardTo, setForwardTo] = useState("")

    // Reminder modal
    const [reminderModalOpen, setReminderModalOpen] = useState(false)
    const [reminderDate, setReminderDate] = useState("")
    const [reminderMessage, setReminderMessage] = useState("")

    // Workspace state
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")
    const [workspaceLoading, setWorkspaceLoading] = useState(true)
    const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false)
    const [newWorkspaceName, setNewWorkspaceName] = useState("")

    // Pagination
    const [activeTab, setActiveTab] = useState<'primary' | 'others'>('primary')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // Displayed emails count for pagination (show 5 at a time)
    const [displayedEmailCount, setDisplayedEmailCount] = useState(5)

    // Active filters
    const [activeStatus, setActiveStatus] = useState<string | null>(null)
    const [listWidth, setListWidth] = useState(0) // Will be calculated on mount

    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        const startX = mouseDownEvent.clientX
        const startWidth = listWidth

        const doDrag = (dragEvent: MouseEvent) => {
            const newWidth = startWidth + dragEvent.clientX - startX
            if (newWidth >= 300 && newWidth <= 800) {
                setListWidth(newWidth)
            }
        }

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag)
            document.removeEventListener('mouseup', stopDrag)
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
        }

        document.addEventListener('mousemove', doDrag)
        document.addEventListener('mouseup', stopDrag)
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'
    }
    const [activeCampaign, setActiveCampaign] = useState<string | null>(null)
    const [activeInbox, setActiveInbox] = useState<string | null>(null)
    const [activeAiLabel, setActiveAiLabel] = useState<string | null>(null)
    const [activeMoreFilter, setActiveMoreFilter] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Search within sections
    const [statusSearch, setStatusSearch] = useState("")
    const [campaignSearch, setCampaignSearch] = useState("")
    const [inboxSearch, setInboxSearch] = useState("")

    const statusFilters = [
        { name: "Lead", value: "new", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-blue-400", bgColor: "bg-blue-400/10" },
        { name: "Interested", value: "interested", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-green-400", bgColor: "bg-green-400/10" },
        { name: "Meeting booked", value: "meeting_booked", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-pink-400", bgColor: "bg-pink-400/10" },
        { name: "Meeting completed", value: "meeting_completed", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
        { name: "Won", value: "won", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-green-500", bgColor: "bg-green-500/10" },
    ]

    const aiFilters = [
        { name: "Out of office", value: "out_of_office", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-muted-foreground", bgColor: "bg-gray-400/10" },
        { name: "Wrong person", value: "wrong_person", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
        { name: "Not interested", value: "not_interested", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-red-400", bgColor: "bg-red-400/10" },
        { name: "Lost", value: "lost", icon: (props: any) => <Logo variant="icon" size="sm" {...props} />, color: "text-red-500", bgColor: "bg-red-500/10" },
    ]

    // Combined all status options for the detail view dropdown
    const allStatusOptions = [...statusFilters, ...aiFilters]

    const moreOptions = [
        { name: "Inbox", value: null, icon: Inbox },
        { name: "Unread only", value: "unread", icon: Mail },
        { name: "Reminders only", value: "reminders", icon: Clock },
        { name: "Scheduled emails", value: "scheduled", icon: Calendar },
        { name: "Sent", value: "sent", icon: Send },
    ]

    useEffect(() => {
        // Fetch user's first sign-in date (fallback to current date if not available)
        const getSignupDate = () => {
            const storedSignupDate = localStorage.getItem('userSignupDate')
            if (storedSignupDate) {
                return new Date(storedSignupDate)
            }
            // First time visiting - store current date as signup date
            const now = new Date()
            localStorage.setItem('userSignupDate', now.toISOString())
            return now
        }

        const signupDate = getSignupDate()

        // Demo email exactly matching the screenshot
        const demoEmail: Email = {
            id: 'demo-1',
            from: 'support@instantly.ai',
            fromName: 'support@instantly.ai',
            subject: 'Instantly Demo Email 🚀',
            preview: 'This is a demo email just to show you how incoming replies will appear in the Unibox!...',
            body: `This is a demo email just to show you how incoming replies will appear in the Unibox. 🚀

Feel free to click around, explore all the options, and get a feel for how easy it is to manage your sales conversations here.

When real replies from your outreach campaigns start rolling in, they'll show up just like this - ready for you to review, reply, or take action.

To start getting replies, you need to first make sure you connect an account and launch a campaign. If you need help with anything, contact our support team by clicking the chat bubble icon in the bottom right corner of your screen.

All the best,
Instantly`,
            timestamp: signupDate,
            isRead: false,
            status: 'interested',
            campaign: { id: 'demo-camp', name: 'Demo' },
            hasReply: false,
            sentFrom: 'Primary',
            recipient: session?.user?.name || 'You',
            recipientEmail: session?.user?.email || 'user@example.com'
        }
        setEmails([demoEmail])

        // Set initial width to exactly 30% of available screen width
        const calculateListWidth = () => {
            const availableWidth = window.innerWidth - 72 // Subtract sidebar width
            return Math.floor(availableWidth * 0.30)
        }
        setListWidth(calculateListWidth())

        // Update on window resize
        const handleResize = () => setListWidth(calculateListWidth())
        window.addEventListener('resize', handleResize)

        loadWorkspaces()
        loadCampaigns()
        loadAccounts()

        // Load saved workspace from localStorage
        const savedWorkspace = localStorage.getItem('activeWorkspace')
        if (savedWorkspace) {
            setCurrentWorkspace(savedWorkspace as string)
        }

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        const leadId = searchParams.get("leadId")
        if (leadId && emails.length > 0) {
            const foundEmail = emails.find(e => e.id === leadId)
            if (foundEmail) {
                loadEmailBody(foundEmail)
            } else {
                // If not loaded yet, wait or fetch specifically (for now we rely on list)
                // Optionally we could fetch single lead if not in list
            }
        }
    }, [searchParams, emails])

    useEffect(() => {
        setPage(1)
        loadEmails()
        loadCampaigns() // Reload campaigns when workspace changes
    }, [activeStatus, activeCampaign, activeInbox, activeAiLabel, activeMoreFilter, searchQuery, currentWorkspace])

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces')
            if (res.ok) {
                const data = await res.json()
                // Ensure data is an array
                setWorkspaces(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("Failed to load workspaces:", error)
            setWorkspaces([])
        } finally {
            setWorkspaceLoading(false)
        }
    }

    const loadCampaigns = async () => {
        try {
            // Get workspace ID from current workspace name
            const activeWorkspace = workspaces.find((w: any) => w.name === currentWorkspace)
            const workspaceId = activeWorkspace?.id || 'all'

            const url = workspaceId === 'all'
                ? '/api/campaigns'
                : `/api/campaigns?workspaceId=${workspaceId}`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                // Ensure data is an array
                setCampaigns(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("Failed to load campaigns:", error)
            setCampaigns([])
        }
    }

    const loadAccounts = async () => {
        try {
            const res = await fetch('/api/accounts')
            if (res.ok) {
                const data = await res.json()
                // Ensure data is an array
                setAccounts(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("Failed to load accounts:", error)
            setAccounts([])
        }
    }

    const loadEmails = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (activeStatus) params.append("status", activeStatus)
            if (activeCampaign) params.append("campaignId", activeCampaign)
            if (activeInbox) params.append("emailAccountId", activeInbox)
            if (activeAiLabel) params.append("aiLabel", activeAiLabel)
            if (activeMoreFilter) params.append("filter", activeMoreFilter)
            if (searchQuery) params.append("search", searchQuery)
            if (activeTab) params.append("tab", activeTab)

            if (true) {
                const res = await fetch(`/api/unibox/emails?${params.toString()}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.length === 0) {
                        // Add demo email if none exist
                        setEmails([{
                            id: "demo-1",
                            from: "team@instantly.ai",
                            fromName: "Instantly Team",
                            subject: "Welcome to Instantly! 👋",
                            preview: "This is a demo email to help you get started with the Unibox. You'll see your real email replies here once your campaigns are active.",
                            timestamp: new Date(),
                            isRead: false,
                            status: "interested",
                            aiLabel: "interested",
                            campaign: { id: "demo-camp", name: "Onboarding" },
                            hasReply: false,
                            body: "Welcome to Instantly!\n\nThe Unibox is where you can manage all your email replies from all your accounts in one place.\n\nHappy sending!"
                        }])
                    } else {
                        setEmails(Array.isArray(data) ? data : [])
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load emails:", error)
        } finally {
            setLoading(false)
        }
    }

    const createLabel = async () => {
        if (!newLabelName.trim()) return

        try {
            const res = await fetch('/api/unibox/labels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newLabelName })
            })

            if (res.ok) {
                setLabelModalOpen(false)
                setNewLabelName("")
                toast({ title: "Success", description: "Label created successfully!" })
            }
        } catch (error) {
            console.error("Failed to create label:", error)
        }
    }

    const clearFilters = () => {
        setActiveStatus(null)
        setActiveCampaign(null)
        setActiveInbox(null)
        setActiveAiLabel(null)
        setActiveMoreFilter(null)
        setSearchQuery("")
    }

    const createWorkspace = async () => {
        if (!newWorkspaceName.trim()) return

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkspaceName })
            })

            if (res.ok) {
                const newWorkspace = await res.json()
                setWorkspaces([...workspaces, newWorkspace])
                setCurrentWorkspace(newWorkspace.name)
                localStorage.setItem('activeWorkspace', newWorkspace.name)
                setCreateWorkspaceModalOpen(false)
                setNewWorkspaceName("")
                toast({ title: "Success", description: "Workspace created successfully!" })
            }
        } catch (error) {
            console.error("Failed to create workspace:", error)
        }
    }

    const switchWorkspace = (workspaceName: string) => {
        setCurrentWorkspace(workspaceName)
        localStorage.setItem('activeWorkspace', workspaceName)
    }

    const loadEmailBody = async (email: Email) => {
        setSelectedEmail(email)
        setReplyMode(null)
        setReplyBody("")

        try {
            const res = await fetch(`/api/leads/${email.id}`)
            if (res.ok) {
                const data = await res.json()
                // Use the HTML or Text content from events or lead body
                const lastEvent = data.events?.[0]
                const emailContent = lastEvent?.details || data.body || data.text || email.preview

                const updatedEmail = { ...email, body: emailContent, events: data.events, aiLabel: data.aiLabel }
                setEmails(emails.map(e => e.id === email.id ? updatedEmail : e))
                setSelectedEmail(updatedEmail)

                // Mark as read
                if (!email.isRead) {
                    handleMarkAsRead(email.id, true)
                }

                // AI: Auto-analyze if label is missing or default
                if (!data.aiLabel || data.aiLabel === 'interested') {
                    analyzeLead(email.id)
                }
            }
        } catch (error) {
            console.error('Failed to load email body:', error)
        }

        if (window.innerWidth < 1024) {
            setSidebarOpen(false)
        }
    }

    // Trigger AI Analysis
    const analyzeLead = async (leadId: string) => {
        try {
            const res = await fetch(`/api/leads/${leadId}/analyze`, { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                // Update local status with the fresh AI label
                setEmails(prev => prev.map(e => e.id === leadId ? { ...e, aiLabel: data.label } : e))
                if (selectedEmail?.id === leadId) {
                    setSelectedEmail(prev => prev ? { ...prev, aiLabel: data.label } : null)
                }
            }
        } catch (err) {
            console.error("AI Analysis failed", err)
        }
    }

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        // Optimistic update
        setEmails(emails.map(e => e.id === id ? { ...e, isRead } : e))
        if (selectedEmail?.id === id) setSelectedEmail(prev => prev ? { ...prev, isRead } : null)

        try {
            const res = await fetch(`/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead })
            })

            if (!res.ok) {
                // Revert if failed
                setEmails(emails.map(e => e.id === id ? { ...e, isRead: !isRead } : e))
                if (selectedEmail?.id === id) setSelectedEmail(prev => prev ? { ...prev, isRead: !isRead } : null)
                toast({ title: "Error", description: "Failed to update read status", variant: "destructive" })
            } else if (!isRead) {
                toast({ title: "Marked as unread" })
            }
        } catch (error) {
            // Revert if failed
            setEmails(emails.map(e => e.id === id ? { ...e, isRead: !isRead } : e))
            if (selectedEmail?.id === id) setSelectedEmail(prev => prev ? { ...prev, isRead: !isRead } : null)
            console.error('Failed to update read status:', error)
            toast({ title: "Error", description: "Failed to update read status", variant: "destructive" })
        }
    }



    const handleCRMStatusChange = async (status: string) => {
        if (!selectedEmail) return

        // Optimistic update
        const previousLabel = selectedEmail.aiLabel
        const previousStatus = selectedEmail.status

        setEmails(emails.map(e =>
            e.id === selectedEmail.id ? { ...e, aiLabel: status } : e
        ))
        setSelectedEmail(prev => prev ? { ...prev, aiLabel: status } : null)

        const statusName = [...statusFilters, ...aiFilters].find(s => s.value === status)?.name || status
        toast({ title: "Status updated", description: `Lead marked as ${statusName}` })

        try {
            const res = await fetch(`/api/leads/${selectedEmail.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aiLabel: status })
            })

            if (!res.ok) {
                // Revert
                setEmails(emails.map(e =>
                    e.id === selectedEmail.id ? { ...e, aiLabel: previousLabel } : e
                ))
                setSelectedEmail(prev => prev ? { ...prev, aiLabel: previousLabel } : null)
                toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
            }
        } catch (error) {
            // Revert
            setEmails(emails.map(e =>
                e.id === selectedEmail.id ? { ...e, aiLabel: previousLabel } : e
            ))
            setSelectedEmail(prev => prev ? { ...prev, aiLabel: previousLabel } : null)
            console.error('Failed to update status:', error)
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const handleCampaignChange = async (campaignId: string) => {
        if (!selectedEmail) return

        // Don't allow moving to the same campaign
        if (selectedEmail.campaign?.id === campaignId) {
            toast({ title: "Already in campaign", description: "This lead is already in the selected campaign" })
            return
        }

        // Optimistic update
        const emailToMove = selectedEmail
        const previousCampaignId = selectedEmail.campaign?.id

        setEmails(emails.filter(e => e.id !== selectedEmail.id))
        setSelectedEmail(null)

        const campaignName = campaigns.find(c => c.id === campaignId)?.name
        toast({
            title: "Lead moved",
            description: `Lead moved to campaign "${campaignName}"`,
            action: (
                <div
                    className="cursor-pointer font-medium hover:underline"
                    onClick={async () => {
                        // Real Backend Undo
                        setEmails(prev => [emailToMove, ...prev])
                        setSelectedEmail(emailToMove)

                        try {
                            await fetch(`/api/leads/${emailToMove.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ campaignId: previousCampaignId })
                            })
                            toast({ title: "Undo successful", description: "Lead moved back to original campaign" })
                        } catch (err) {
                            toast({ title: "Undo failed", description: "Could not revert changes", variant: "destructive" })
                        }
                    }}
                >
                    Undo
                </div>
            )
        })

        try {
            const res = await fetch(`/api/leads/${emailToMove.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId })
            })

            if (!res.ok) {
                // If the API call fails, the optimistic update is already done,
                // and the undo action in the toast is the primary way to revert.
                // We still show an error toast here.
                toast({ title: "Error", description: "Failed to move lead", variant: "destructive" })
            }
        } catch (error) {
            // If the API call fails, the optimistic update is already done,
            // and the undo action in the toast is the primary way to revert.
            // We still show an error toast here.
            console.error('Failed to move lead:', error)
            toast({ title: "Error", description: "Failed to move lead", variant: "destructive" })
        }
    }

    const filteredCampaigns = campaigns.filter((c: any) =>
        c.name.toLowerCase().includes(campaignSearch.toLowerCase())
    )

    const filteredAccounts = accounts.filter((a: any) =>
        a.email.toLowerCase().includes(inboxSearch.toLowerCase())
    )

    const filteredWorkspaces = workspaces.filter((w: any) =>
        w.name.toLowerCase().includes(workspaceSearch.toLowerCase())
    )

    // Filtered campaigns for modal (excludes current campaign)
    const campaignsForModal = campaigns.filter((c: any) =>
        c.name.toLowerCase().includes(campaignModalSearch.toLowerCase()) &&
        c.id !== selectedEmail?.campaign?.id
    )

    const hasActiveFilters = activeStatus || activeCampaign || activeInbox || activeAiLabel || activeMoreFilter

    // Send Reply or Forward
    const handleSendReply = async () => {
        if (!selectedEmail || !replyBody.trim()) return

        setSendingReply(true)
        try {
            let res
            if (replyMode === 'forward') {
                if (!forwardTo) {
                    toast({ title: "Error", description: "Please specify a recipient", variant: "destructive" })
                    setSendingReply(false)
                    return
                }
                res = await fetch('/api/emails/forward', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        emailId: selectedEmail.id,
                        to: forwardTo,
                        subject: forwardSubject,
                        body: replyBody
                    })
                })
            } else {
                res = await fetch('/api/emails/reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        emailId: selectedEmail.id,
                        body: replyBody,
                        replyAll: replyMode === 'reply-all'
                    })
                })
            }

            if (res.ok) {
                toast({
                    title: replyMode === 'forward' ? "Email forwarded" : "Reply sent",
                    description: replyMode === 'forward' ? "Your email has been forwarded successfully" : "Your reply has been sent successfully"
                })
                setReplyBody("")
                setReplyMode(null)
                setForwardTo("")
                setForwardSubject("")
            } else {
                toast({ title: "Error", description: "Failed to send email", variant: "destructive" })
            }
        } catch (error) {
            console.error('Failed to send email:', error)
            toast({ title: "Error", description: "Failed to send email", variant: "destructive" })
        } finally {
            setSendingReply(false)
        }
    }

    // Delete Lead (add to blocklist)
    const handleDeleteLead = async () => {
        if (!selectedEmail) return

        // Optimistic update
        const leadToDelete = selectedEmail
        setEmails(emails.filter(e => e.id !== selectedEmail.id))
        setSelectedEmail(null)

        toast({ title: "Lead deleted", description: "Lead has been blocked and removed" })

        try {
            const res = await fetch(`/api/leads/${leadToDelete.id}`, {
                method: 'DELETE'
            })

            if (!res.ok) {
                // Revert
                setEmails(prev => [leadToDelete, ...prev])
                if (!selectedEmail) setSelectedEmail(leadToDelete)
                toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" })
            }
        } catch (error) {
            // Revert
            setEmails(prev => [leadToDelete, ...prev])
            if (!selectedEmail) setSelectedEmail(leadToDelete)
            console.error('Failed to delete lead:', error)
            toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" })
        }
    }

    // Delete Email
    const handleDeleteEmail = async (emailId: string) => {
        if (!selectedEmail) return

        // Optimistic update
        const emailToDelete = selectedEmail
        setEmails(emails.filter(e => e.id !== selectedEmail.id))
        setSelectedEmail(null)
        toast({ title: "Email deleted", description: "Conversation moved to trash" })

        try {
            // Assuming endpoint exists or will exist
            const res = await fetch(`/api/emails/${emailId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                // If we also want to delete the lead/blocklist them, we can do that backend side or here.
                // For now, in Unibox, we treat it as removing the thread from view.
                // We don't necessarily need to call handleDeleteLead() if the backend handles cleanup,
                // or if we just want to remove the specific email. 
                // Given the optimistic update removed the whole thread from view, we are good.
            } else {
                // Revert
                setEmails(prev => [emailToDelete, ...prev])
                if (!selectedEmail) setSelectedEmail(emailToDelete)
                toast({ title: "Error", description: "Failed to delete email", variant: "destructive" })
            }
        } catch (error) {
            // Revert
            setEmails(prev => [emailToDelete, ...prev])
            if (!selectedEmail) setSelectedEmail(emailToDelete)
            toast({ title: "Error", description: "Failed to delete email", variant: "destructive" })
        }
    }

    // Mark as Lost (same as setting label to lost)
    const handleMarkAsLost = () => {
        handleCRMStatusChange('lost')
    }

    // Find Similar Leads
    const handleFindSimilar = async () => {
        if (!selectedEmail) return

        toast({ title: "Analyzing leads...", description: "AI is finding similar responses..." })
        setLoading(true)

        try {
            const res = await fetch(`/api/leads/similar?leadId=${selectedEmail.id}`)
            if (res.ok) {
                const similar = await res.json()
                if (Array.isArray(similar) && similar.length > 0) {
                    // Filter out the selected one if returned (shouldn't be, but safe check)
                    const filteredSimilar = similar.filter(e => e.id !== selectedEmail.id)
                    setEmails([selectedEmail, ...filteredSimilar])
                    toast({ title: "Analysis complete", description: `Found ${filteredSimilar.length} similar leads` })
                } else {
                    toast({ title: "Analysis complete", description: "No similar leads found" })
                }
            } else {
                toast({ title: "Error", description: "Failed to find similar leads", variant: "destructive" })
            }
        } catch (error) {
            console.error("Failed to find similar leads:", error)
            toast({ title: "Error", description: "Failed to find similar leads", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    // Set Reminder
    const handleSetReminder = () => {
        setReminderModalOpen(true)
    }

    const saveReminder = async () => {
        if (!reminderDate || !selectedEmail) return

        try {
            const res = await fetch('/api/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: selectedEmail.id,
                    scheduledAt: reminderDate,
                    message: reminderMessage
                })
            })

            if (res.ok) {
                toast({
                    title: "Reminder Set",
                    description: `We'll remind you on ${new Date(reminderDate).toLocaleString()}`
                })
                setReminderModalOpen(false)
                setReminderDate("")
                setReminderMessage("")
            } else {
                toast({ title: "Error", description: "Failed to set reminder", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to set reminder", variant: "destructive" })
        }
    }

    return (
        <div className="flex h-screen bg-background text-[#a1a1aa] font-sans">
            {/* Collapsible Sidebar */}
            <div
                className={cn(
                    "border-r border-[#2a2a35] bg-background transition-all duration-300 overflow-y-auto",
                    sidebarOpen ? "w-64" : "w-0"
                )}
            >
                {sidebarOpen && (
                    <div className="p-4 space-y-6">
                        {/* Status Section */}
                        <div>
                            <button
                                onClick={() => setStatusExpanded(!statusExpanded)}
                                className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground mb-2"
                            >
                                <span className="text-sm font-medium">Status</span>
                                {statusExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            {statusExpanded && (
                                <div className="space-y-1">
                                    <Input
                                        placeholder="Search"
                                        value={statusSearch}
                                        onChange={(e) => setStatusSearch(e.target.value)}
                                        className="bg-[#1e1e24] border-[#2a2a35] text-foreground text-sm h-8 placeholder:text-[#a1a1aa]"
                                    />
                                    {statusFilters.map((filter) => (
                                        <button
                                            key={filter.value}
                                            onClick={() => setActiveStatus(activeStatus === filter.value ? null : filter.value)}
                                            className={cn(
                                                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors",
                                                activeStatus === filter.value
                                                    ? "bg-blue-600/20 text-blue-400"
                                                    : "text-[#a1a1aa] hover:bg-[#1e1e24] hover:text-foreground"
                                            )}
                                        >
                                            <filter.icon className={cn("h-4 w-4", filter.color)} />
                                            {filter.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* All Campaigns Section */}
                        <div>
                            <button
                                onClick={() => setCampaignsExpanded(!campaignsExpanded)}
                                className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground mb-2"
                            >
                                <span className="text-sm font-medium">All Campaigns</span>
                                {campaignsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            {campaignsExpanded && (
                                <div className="space-y-1">
                                    <Input
                                        placeholder="Search"
                                        value={campaignSearch}
                                        onChange={(e) => setCampaignSearch(e.target.value)}
                                        className="bg-[#1e1e24] border-[#2a2a35] text-foreground text-sm h-8 placeholder:text-[#a1a1aa]"
                                    />
                                    {filteredCampaigns.slice(0, 10).map((campaign) => (
                                        <button
                                            key={campaign.id}
                                            onClick={() => setActiveCampaign(activeCampaign === campaign.id ? null : campaign.id)}
                                            className={cn(
                                                "w-full px-2 py-1.5 text-sm rounded text-left truncate transition-colors",
                                                activeCampaign === campaign.id
                                                    ? "bg-blue-600/20 text-blue-400"
                                                    : "text-[#a1a1aa] hover:bg-[#1e1e24] hover:text-foreground"
                                            )}
                                        >
                                            {campaign.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* All Inboxes Section */}
                        <div>
                            <button
                                onClick={() => setInboxesExpanded(!inboxesExpanded)}
                                className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground mb-2"
                            >
                                <span className="text-sm font-medium">All Inboxes</span>
                                {inboxesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            {inboxesExpanded && (
                                <div className="space-y-1">
                                    <Input
                                        placeholder="Search"
                                        value={inboxSearch}
                                        onChange={(e) => setInboxSearch(e.target.value)}
                                        className="bg-[#1e1e24] border-[#2a2a35] text-foreground text-sm h-8 placeholder:text-[#a1a1aa]"
                                    />
                                    {filteredAccounts.map((account) => (
                                        <button
                                            key={account.id}
                                            onClick={() => setActiveInbox(activeInbox === account.id ? null : account.id)}
                                            className={cn(
                                                "w-full px-2 py-1.5 text-sm rounded text-left truncate transition-colors",
                                                activeInbox === account.id
                                                    ? "bg-blue-600/20 text-foreground"
                                                    : "text-[#a1a1aa] hover:bg-[#1e1e24] hover:text-foreground"
                                            )}
                                        >
                                            {account.email}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AI Section */}
                        <div>
                            <button
                                onClick={() => setAiExpanded(!aiExpanded)}
                                className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground mb-2"
                            >
                                <span className="text-sm font-medium">AI</span>
                                {aiExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            {aiExpanded && (
                                <div className="space-y-1">
                                    {aiFilters.map((filter) => (
                                        <button
                                            key={filter.value}
                                            onClick={() => setActiveAiLabel(activeAiLabel === filter.value ? null : filter.value)}
                                            className={cn(
                                                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors",
                                                activeAiLabel === filter.value
                                                    ? "bg-blue-600/20 text-foreground"
                                                    : "text-[#a1a1aa] hover:bg-[#1e1e24] hover:text-foreground"
                                            )}
                                        >
                                            <filter.icon className={cn("h-4 w-4", filter.color)} />
                                            {filter.name}
                                        </button>
                                    ))}
                                    <Dialog open={labelModalOpen} onOpenChange={setLabelModalOpen}>
                                        <DialogTrigger asChild>
                                            <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-blue-400 hover:bg-[#1e1e24] rounded transition-colors shadow-sm">
                                                <Plus className="h-4 w-4" />
                                                Create new label
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground shadow-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Create New AI Label</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-[#a1a1aa]">Label Name</Label>
                                                    <Input
                                                        value={newLabelName}
                                                        onChange={(e) => setNewLabelName(e.target.value)}
                                                        placeholder="e.g., Needs Follow-up"
                                                        className="bg-background border-[#2a2a35] text-foreground focus-visible:ring-blue-500 mt-1.5"
                                                    />
                                                </div>
                                                <Button onClick={createLabel} className="w-full bg-blue-600 hover:bg-blue-700 text-foreground font-medium">
                                                    Create Label
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}
                        </div>

                        {/* More Section */}
                        <div>
                            <button
                                onClick={() => setMoreExpanded(!moreExpanded)}
                                className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground mb-2"
                            >
                                <span className="text-sm font-medium">More</span>
                                {moreExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            {moreExpanded && (
                                <div className="space-y-1">
                                    {moreOptions.map((option) => (
                                        <button
                                            key={option.name}
                                            onClick={() => setActiveMoreFilter(activeMoreFilter === option.value ? null : option.value)}
                                            className={cn(
                                                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors",
                                                activeMoreFilter === option.value
                                                    ? "bg-blue-600/20 text-foreground"
                                                    : "text-[#a1a1aa] hover:bg-[#1e1e24] hover:text-foreground"
                                            )}
                                        >
                                            <option.icon className="h-4 w-4" />
                                            {option.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="border-b border-[#2a2a35] px-6 py-4 flex items-center justify-between bg-background">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-[#a1a1aa] hover:text-foreground hover:bg-[#1e1e24]"
                        >
                            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                        </Button>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Unibox</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Organization/Workspace Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-[#2a2a35] bg-[#1e1e24] text-foreground hover:text-foreground hover:bg-[#2a2a35] gap-2 h-9 px-4 rounded-md shadow-sm">
                                    <Logo variant="icon" size="sm" />
                                    {currentWorkspace}
                                    <ChevronDown className="h-4 w-4 text-[#a1a1aa]" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 bg-[#1e1e24] border-[#2a2a35] text-foreground shadow-xl">
                                <div className="p-2">
                                    <Input
                                        placeholder="Search"
                                        value={workspaceSearch}
                                        onChange={(e) => setWorkspaceSearch(e.target.value)}
                                        className="bg-background border-[#2a2a35] text-foreground text-sm h-8 mb-2 focus-visible:ring-blue-500"
                                    />
                                </div>
                                <DropdownMenuSeparator className="bg-[#2a2a35]" />
                                {filteredWorkspaces.map((workspace) => (
                                    <DropdownMenuItem
                                        key={workspace.id || workspace.name}
                                        onClick={() => switchWorkspace(workspace.name)}
                                        className={cn(
                                            "cursor-pointer focus:bg-[#2a2a35] focus:text-foreground m-1 rounded",
                                            currentWorkspace === workspace.name && "bg-blue-600/10 text-blue-400"
                                        )}
                                    >
                                        <Logo variant="icon" size="sm" className="mr-2" />
                                        {workspace.name}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-[#2a2a35]" />
                                <DropdownMenuItem
                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground text-blue-400 m-1 rounded"
                                    onClick={() => setCreateWorkspaceModalOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Workspace
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tabs moved to sidebar */}

                {/* Split View Container */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Email List Column */}

                    <div
                        className="flex flex-col border-r border-[#2a2a35] relative bg-background hidden md:flex"
                        style={{ width: `${listWidth}px` }}
                    >
                        {/* Resize Handle */}
                        {selectedEmail && (
                            <div
                                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-50 active:bg-blue-600 translate-x-[50%]"
                                onMouseDown={startResizing}
                            />
                        )}
                        {/* Tabs & Search Bar */}
                        <div className="flex flex-col border-b border-[#2a2a35]">
                            <div className="px-6 pt-2 flex gap-6 border-b border-[#2a2a35]">
                                <button
                                    onClick={() => setActiveTab("primary")}
                                    className={cn(
                                        "relative py-3 text-sm font-medium transition-colors",
                                        activeTab === "primary" ? "text-blue-500" : "text-[#a1a1aa] hover:text-foreground"
                                    )}
                                >
                                    Primary
                                    {activeTab === "primary" && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab("others")}
                                    className={cn(
                                        "relative py-3 text-sm font-medium transition-colors",
                                        activeTab === "others" ? "text-blue-500" : "text-[#a1a1aa] hover:text-foreground"
                                    )}
                                >
                                    Others
                                    {activeTab === "others" && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                    )}
                                </button>
                            </div>
                            <div className="px-6 py-4 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
                                    <Input
                                        placeholder="Search mail"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-[#1e1e24] border-[#2a2a35] text-foreground placeholder:text-[#a1a1aa] focus-visible:ring-blue-500"
                                    />
                                </div>

                                {/* Active Filters */}
                                {hasActiveFilters && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm text-muted-foreground">Active filters:</span>
                                        {activeStatus && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                                Status: {statusFilters.find(f => f.value === activeStatus)?.name}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => setActiveStatus(null)} />
                                            </span>
                                        )}
                                        <button onClick={clearFilters} className="text-xs text-blue-400 hover:underline">
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-auto bg-background">
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-[#a1a1aa]">Loading...</div>
                                </div>
                            ) : emails.length > 0 ? (
                                <div className="divide-y divide-[#2a2a35]">
                                    {emails.slice(0, displayedEmailCount).map((email) => (
                                        <div
                                            key={email.id}
                                            onClick={() => loadEmailBody(email)}
                                            className={cn(
                                                "relative p-4 cursor-pointer transition-colors hover:bg-[#1e1e24] flex gap-3 group",
                                                selectedEmail?.id === email.id ? "bg-[#1e1e24]" : "bg-transparent",
                                                !email.isRead && "bg-[#16161a]"
                                            )}
                                        >
                                            {/* Blue Stripe for active/unread/demo look */}
                                            {(!email.isRead || selectedEmail?.id === email.id) && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                            )}

                                            <div className="mt-0.5 pl-0.5" onClick={(e) => e.stopPropagation()}>
                                                <Zap className="h-3.5 w-3.5 text-green-500 fill-green-500" />
                                            </div>

                                            <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox className="border-[#52525b] data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-4 w-4 rounded-[4px]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <span className={cn("text-sm font-bold truncate pr-2", email.isRead ? "text-[#a1a1aa]" : "text-foreground")}>
                                                        {email.fromName}
                                                    </span>
                                                    <span className="text-xs text-[#71717a] whitespace-nowrap font-medium">
                                                        {new Date(email.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-[#e4e4e7] truncate mb-1 font-semibold flex items-center gap-2">
                                                    {email.subject}
                                                </div>
                                                <p className="text-xs text-[#a1a1aa] truncate line-clamp-1 leading-relaxed">{email.preview}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {emails.length > 0 && (
                                        <div className="p-4 bg-background">
                                            <Button
                                                variant="outline"
                                                className="w-full bg-[#1e1e24] text-[#a1a1aa] border-[#2a2a35] hover:bg-[#272730] hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setDisplayedEmailCount(prev => prev + 5)}
                                                disabled={displayedEmailCount >= emails.length}
                                            >
                                                {displayedEmailCount >= emails.length ? 'All emails loaded' : 'Load more'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8 text-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                                        <Mail className="h-6 w-6 opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">No emails found</p>
                                        <p className="text-xs text-muted-foreground">Try adjusting your filters or search</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Email Detail Column */}
                    {selectedEmail ? (
                        <div className="flex-1 bg-[#1e1e24] flex flex-col h-full overflow-hidden">
                            {/* Detail Header */}
                            <div className="border-b border-[#2a2a35] p-6 bg-background">
                                {/* Top Row: Sender Info & Controls */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[#1e1e24] border border-[#2a2a35] flex items-center justify-center text-foreground font-medium text-lg shadow-sm">
                                            {selectedEmail.fromName[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-foreground font-bold text-sm tracking-wide">{selectedEmail.fromName}</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <div className="h-3.5 w-3.5 rounded-full border border-[#52525b] text-[9px] flex items-center justify-center text-[#a1a1aa] hover:text-foreground transition-colors">i</div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">More info</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {/* Status Dropdown - Enhanced */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="px-2 py-0.5 bg-[#1e1e24] border border-[#2a2a35] text-[10px] text-[#a1a1aa] rounded hover:bg-[#272730] flex items-center gap-1.5 transition-colors group">
                                                            <Zap className={cn("h-3 w-3 fill-current", allStatusOptions.find(s => s.value === (selectedEmail?.aiLabel || 'interested'))?.color || "text-green-400")} />
                                                            <span className="capitalize">{(selectedEmail?.aiLabel || 'interested').replace('_', ' ')}</span>
                                                            {selectedEmail?.aiLabel && (
                                                                <span className="ml-0.5 px-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-[2px] text-[8px] font-bold">AI</span>
                                                            )}
                                                            <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-48 bg-[#1e1e24] border-[#2a2a35] text-foreground shadow-xl p-0">
                                                        <div className="p-2 border-b border-[#2a2a35]">
                                                            <Input
                                                                placeholder="Search..."
                                                                className="bg-background border-[#2a2a35] text-foreground text-xs h-7 placeholder:text-[#52525b]"
                                                            />
                                                        </div>
                                                        <div className="py-1 max-h-64 overflow-y-auto">
                                                            {allStatusOptions.map(s => (
                                                                <DropdownMenuItem
                                                                    key={s.value}
                                                                    onClick={() => handleCRMStatusChange(s.value)}
                                                                    className="cursor-pointer hover:bg-[#2a2a35] focus:bg-[#2a2a35] mx-1 rounded"
                                                                >
                                                                    <Zap className={cn("h-4 w-4 mr-2 fill-current", s.color)} />
                                                                    {s.name}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </div>
                                                        <DropdownMenuSeparator className="bg-[#2a2a35]" />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer hover:bg-[#2a2a35] focus:bg-[#2a2a35] text-blue-400 mx-1 mb-1 rounded"
                                                            onClick={() => setLabelModalOpen(true)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Create Label
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <button className="p-1 px-2 border border-[#2a2a35] rounded bg-[#1e1e24] hover:bg-[#272730] transition-colors">
                                                    <Calendar className="h-3 w-3 text-[#a1a1aa]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Move Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="bg-[#1e1e24] border-[#2a2a35] text-[#a1a1aa] hover:text-foreground hover:bg-[#272730] h-8 text-xs px-3 shadow-sm gap-1">
                                                    Move
                                                    <ChevronDown className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-[#1e1e24] border-[#2a2a35] text-foreground shadow-xl">

                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground"
                                                    onClick={() => setCampaignModalOpen(true)}
                                                >
                                                    <GitBranch className="h-4 w-4 mr-2 text-[#a1a1aa]" />
                                                    To another campaign
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* More Menu Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" className="bg-[#1e1e24] border-[#2a2a35] text-[#a1a1aa] hover:text-foreground hover:bg-[#272730] h-8 w-8 shadow-sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 bg-[#1e1e24] border-[#2a2a35] text-foreground shadow-xl">
                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground"
                                                    onClick={handleFindSimilar}
                                                >
                                                    <Users className="h-4 w-4 mr-2 text-[#a1a1aa]" />
                                                    Find similar leads
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground"
                                                    onClick={() => {
                                                        if (selectedEmail) {
                                                            handleMarkAsRead(selectedEmail.id, false)
                                                        }
                                                    }}
                                                >
                                                    <EyeOff className="h-4 w-4 mr-2 text-[#a1a1aa]" />
                                                    Mark as unread
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground"
                                                    onClick={handleMarkAsLost}
                                                >
                                                    <ThumbsDown className="h-4 w-4 mr-2 text-[#a1a1aa]" />
                                                    Lost lead
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground text-red-500 hover:text-red-400"
                                                    onClick={handleDeleteLead}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete lead
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground"
                                                    onClick={handleSetReminder}
                                                >
                                                    <Bell className="h-4 w-4 mr-2 text-[#a1a1aa]" />
                                                    Set Reminder
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-[#2a2a35]" />
                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground text-red-500 hover:text-red-400"
                                                    onClick={() => {
                                                        if (selectedEmail) {
                                                            handleDeleteEmail(selectedEmail.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete email
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Subject Line */}
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-foreground tracking-tight">{selectedEmail.subject}</h2>
                                    </div>
                                    <div className="flex items-center gap-4 text-[#71717a] text-xs font-medium">
                                        <span>
                                            {new Date(selectedEmail.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(selectedEmail.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        <Reply className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors" />
                                    </div>
                                </div>

                                {/* From/To Details */}
                                <div className="text-xs text-[#71717a]">
                                    From: <span className="text-[#a1a1aa]">{selectedEmail.fromName}</span> &lt;{selectedEmail.from}&gt;
                                    <br />
                                    to: <span className="text-[#a1a1aa]">{selectedEmail.recipient || "User"}</span> &lt;{selectedEmail.recipientEmail || "user@example.com"}&gt;
                                </div>
                            </div>

                            {/* Detail Body */}
                            <div className="flex-1 overflow-y-auto p-8 bg-background">
                                <div className="prose prose-invert max-w-none text-[#a1a1aa] whitespace-pre-wrap leading-relaxed text-sm">
                                    {selectedEmail.body || selectedEmail.preview}
                                </div>
                            </div>

                            {/* Detail Footer (Reply/Forward) */}
                            <div className="p-4 bg-background border-t border-[#2a2a35]">
                                {replyMode ? (
                                    <div className="border border-[#2a2a35] rounded-xl bg-[#1e1e24] shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                                        <div className="flex flex-col gap-0 border-b border-[#2a2a35] bg-[#272730]/50">
                                            {/* Forward Fields */}
                                            {replyMode === 'forward' && (
                                                <div className="flex flex-col border-b border-[#2a2a35]/50">
                                                    <div className="flex items-center px-3 py-2 border-b border-[#2a2a35]/50">
                                                        <span className="text-sm text-[#a1a1aa] w-16">To:</span>
                                                        <input
                                                            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                                                            value={forwardTo}
                                                            onChange={(e) => setForwardTo(e.target.value)}
                                                            placeholder="recipient@example.com"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="flex items-center px-3 py-2">
                                                        <span className="text-sm text-[#a1a1aa] w-16">Subject:</span>
                                                        <input
                                                            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                                                            value={forwardSubject}
                                                            onChange={(e) => setForwardSubject(e.target.value)}
                                                            placeholder="Subject"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reply Header */}
                                            {replyMode !== 'forward' && (
                                                <div className="flex items-center gap-2 p-3">
                                                    <Reply className="h-4 w-4 text-[#a1a1aa]" />
                                                    <span className="text-sm text-[#a1a1aa] font-medium">
                                                        {replyMode === 'reply' ? 'Reply to' : 'Reply all to'}
                                                    </span>
                                                    <div className="flex-1 flex flex-wrap gap-1">
                                                        <div className="px-2 py-0.5 bg-[#2a2a35] rounded-full text-xs text-foreground flex items-center gap-1">
                                                            {selectedEmail.fromName}
                                                        </div>
                                                        {replyMode === 'reply-all' && selectedEmail.recipient && (
                                                            <div className="px-2 py-0.5 bg-[#2a2a35] rounded-full text-xs text-foreground flex items-center gap-1">
                                                                {selectedEmail.recipient}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 hover:bg-[#2a2a35]"
                                                        onClick={() => setReplyMode(null)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-0">
                                            <textarea
                                                className="w-full min-h-[120px] bg-transparent p-4 text-sm text-foreground placeholder:text-[#52525b] resize-none focus:outline-none font-sans"
                                                placeholder="Write your email..."
                                                value={replyBody}
                                                onChange={(e) => setReplyBody(e.target.value)}
                                                autoFocus={replyMode !== 'forward'}
                                            />
                                        </div>
                                        <div className="p-3 flex items-center justify-between border-t border-[#2a2a35] bg-[#272730]/30 mr-2">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#a1a1aa] hover:text-foreground">
                                                    <Paperclip className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#a1a1aa] hover:text-foreground">
                                                    <Smile className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setReplyMode(null)}
                                                    className="text-[#a1a1aa] hover:text-foreground"
                                                >
                                                    Discard
                                                </Button>
                                                <Button
                                                    onClick={handleSendReply}
                                                    disabled={!replyBody.trim() || sendingReply}
                                                    className="bg-blue-600 hover:bg-blue-700 text-foreground px-6 min-w-[100px]"
                                                >
                                                    {sendingReply ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            Send <Send className="h-3 w-3 ml-2" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        {/* Reply Button with Dropdown */}
                                        <DropdownMenu>
                                            <div className="flex">
                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700 text-foreground px-6 rounded-r-none shadow-lg shadow-blue-900/20"
                                                    onClick={() => setReplyMode('reply')}
                                                >
                                                    <Reply className="h-4 w-4 mr-2" /> Reply
                                                </Button>
                                                <DropdownMenuTrigger asChild>
                                                    <Button className="bg-blue-600 hover:bg-blue-700 text-foreground px-2 rounded-l-none border-l border-blue-500/50">
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </div>
                                            <DropdownMenuContent align="start" className="bg-[#1e1e24] border-[#2a2a35] text-foreground shadow-xl">
                                                <DropdownMenuItem
                                                    className="cursor-pointer focus:bg-[#2a2a35] focus:text-foreground"
                                                    onClick={() => setReplyMode('reply-all')}
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Reply All
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Forward Button */}
                                        <Button
                                            variant="outline"
                                            className="bg-transparent border-[#2a2a35] text-[#a1a1aa] hover:bg-[#1e1e24] hover:text-foreground px-6"
                                            onClick={() => {
                                                setReplyMode('forward')
                                                setForwardSubject(`Fwd: ${selectedEmail.subject}`)
                                                setReplyBody(`
                                                
---------- Forwarded message ----------
From: ${selectedEmail.fromName} <${selectedEmail.from}>
Date: ${new Date(selectedEmail.timestamp).toLocaleString()}
Subject: ${selectedEmail.subject}
To: ${selectedEmail.recipient || "User"} <${selectedEmail.recipientEmail || "user@example.com"}>

${selectedEmail.body || selectedEmail.preview}
                                                `.trim())
                                            }}
                                        >
                                            <Forward className="h-4 w-4 mr-2" /> Forward
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 hidden md:flex items-center justify-center bg-[#141418] text-[#a1a1aa] flex-col gap-6">
                            <div className="relative">
                                {/* QR Code styled to match screenshot */}
                                <div className="h-36 w-36 bg-gradient-to-br from-[#2a2a35] to-[#1e1e24] p-3 rounded-xl shadow-2xl border border-[#3a3a45]">
                                    <div className="h-full w-full bg-white rounded-md p-2">
                                        <QrCode className="h-full w-full text-[#0f0f12]" strokeWidth={1.5} />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center space-y-2 max-w-xs">
                                <h3 className="text-foreground font-semibold text-base">Stay connected. Take Unibox with you anywhere.</h3>
                                <p className="text-xs text-[#71717a] leading-relaxed">
                                    Scan the QR code with your phone to download the Unibox mobile app.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Create Workspace Modal */}
            <Dialog open={createWorkspaceModalOpen} onOpenChange={setCreateWorkspaceModalOpen}>
                <DialogContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground max-w-2xl p-0 overflow-hidden shadow-2xl">
                    <div className="flex flex-col items-center justify-center min-h-[400px] px-12 py-16">
                        <div className="w-full max-w-md space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                                    Let's create a new workspace
                                </h2>
                                <p className="text-sm text-blue-400 font-medium">
                                    What would you like to name it?
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm text-[#a1a1aa]">Workspace Name</Label>
                                <Input
                                    value={newWorkspaceName}
                                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                                    placeholder="My Workspace"
                                    className="bg-background border-[#2a2a35] text-foreground text-lg h-12 focus-visible:ring-blue-500 placeholder:text-[#52525b]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') createWorkspace()
                                    }}
                                />
                            </div>

                            <div className="flex gap-3 justify-center pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setCreateWorkspaceModalOpen(false)
                                        setNewWorkspaceName("")
                                    }}
                                    className="text-[#a1a1aa] hover:text-foreground hover:bg-[#272730]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={createWorkspace}
                                    className="bg-blue-600 hover:bg-blue-700 text-foreground min-w-[100px] font-medium"
                                    disabled={!newWorkspaceName.trim()}
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Move to Campaign Modal */}
            <Dialog open={campaignModalOpen} onOpenChange={setCampaignModalOpen}>
                <DialogContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground shadow-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Move to Campaign</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Search campaigns..."
                            value={campaignModalSearch}
                            onChange={(e) => setCampaignModalSearch(e.target.value)}
                            className="bg-background border-[#2a2a35] text-foreground"
                        />
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {campaignsForModal.length > 0 ? (
                                campaignsForModal.map((campaign: any) => (
                                    <button
                                        key={campaign.id}
                                        onClick={() => {
                                            handleCampaignChange(campaign.id)
                                            setCampaignModalOpen(false)
                                            setCampaignModalSearch("")
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#272730] transition-colors text-left"
                                    >
                                        <Zap className="h-4 w-4 text-blue-500 fill-blue-500" />
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{campaign.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {campaign.status || 'Draft'} • {campaign._count?.leads || 0} leads
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    No other campaigns available
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reminder Modal */}
            <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
                <DialogContent className="sm:max-w-md bg-[#1e1e24] border-[#2a2a35] text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <Bell className="h-5 w-5 text-yellow-400" />
                            Set Reminder
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-[#a1a1aa]">Remind me at</Label>
                            <Input
                                type="datetime-local"
                                value={reminderDate}
                                onChange={(e) => setReminderDate(e.target.value)}
                                className="bg-background border-[#2a2a35] text-foreground h-10 focus-visible:ring-blue-500 [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-[#a1a1aa]">Note (Optional)</Label>
                            <Input
                                value={reminderMessage}
                                onChange={(e) => setReminderMessage(e.target.value)}
                                placeholder="Follow up about..."
                                className="bg-background border-[#2a2a35] text-foreground h-10 focus-visible:ring-blue-500 placeholder:text-[#52525b]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setReminderModalOpen(false)
                                setReminderDate("")
                            }}
                            className="text-[#a1a1aa] hover:text-foreground hover:bg-[#272730]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveReminder}
                            className="bg-blue-600 hover:bg-blue-700 text-foreground"
                            disabled={!reminderDate}
                        >
                            Set Reminder
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
