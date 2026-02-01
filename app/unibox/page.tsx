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
    MailOpen,
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
    Loader2,
    Sun,
    ArrowRight,
    Sun,
    ArrowRight,
    Star,
    Tag,
    Hash
} from "lucide-react"
import { TagManager } from "@/components/common/TagManager"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/ui/logo"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help"
import { useRef } from "react"

interface Email {
    id: string
    leadId?: string // Added leadId mapping
    from: string
    fromName: string
    company?: string
    subject: string
    preview: string
    body?: string // Added body
    timestamp: Date
    isRead: boolean
    isStarred?: boolean // Star/Important marking
    isArchived?: boolean // Archive status
    snoozedUntil?: Date | null // Snooze until time
    status: string
    aiLabel?: string
    campaign: { id: string; name: string }
    hasReply: boolean
    hasAttachment?: boolean // Track if email has attachments
    sentFrom?: string
    recipient?: string
    recipientEmail?: string
    messages?: {
        id: string
        type: 'sent' | 'reply'
        subject: string
        body: string
        timestamp: Date
        from?: string | null
        to?: string | null
        isMe: boolean
        to?: string | null
        isMe: boolean
    }[]
    tags?: { id: string; name: string; color: string }[]
}

// Wrapper component with Suspense for useSearchParams
export default function UniboxPageWithSuspense() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
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

    // Tags state
    const [tags, setTags] = useState<any[]>([])
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [tagsExpanded, setTagsExpanded] = useState(false)
    const [tagSearch, setTagSearch] = useState("")

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
    const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)

    // Workspace state
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState("My Organization")
    const [workspaceSearch, setWorkspaceSearch] = useState("")
    const [workspaceLoading, setWorkspaceLoading] = useState(true)
    const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false)
    const [newWorkspaceName, setNewWorkspaceName] = useState("")

    const handleLabelChange = async (emailId: string, newLabel: string) => {
        // Optimistic update
        setEmails(prev => prev.map(email =>
            email.id === emailId ? { ...email, aiLabel: newLabel } : email
        ))
        if (selectedEmail?.id === emailId) {
            setSelectedEmail(prev => prev ? { ...prev, aiLabel: newLabel } : null)
        }

        const labelName = [...(aiFilters || []), ...(statusFilters || [])].find(s => s.value === newLabel)?.name || newLabel
        toast({ title: "Label updated", description: `Lead marked as ${labelName}` })

        try {
            const response = await fetch(`/api/unibox/emails/${emailId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ aiLabel: newLabel }),
            })

            if (!response.ok) {
                throw new Error('Failed to update label')
            }
        } catch (error) {
            // Revert
            setEmails(prev => prev.map(email =>
                email.id === emailId ? { ...email, aiLabel: selectedEmail?.aiLabel || '' } : email // approximate revert
            ))
            // A proper revert needs the old value passed in or stored.
            // Given simplicity, we might just log error or refetch.
            console.error("Failed to update label", error)
            toast({ title: "Error", description: "Failed to update label", variant: "destructive" })
        }
    }



    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(-1)

    // Undo Send State
    const [isUndoVisible, setIsUndoVisible] = useState(false)
    const undoTimerRef = useRef<NodeJS.Timeout | null>(null)
    const pendingReplyRef = useRef<any>(null)

    // Displayed emails count for pagination (show 5 at a time)
    const [displayedEmailCount, setDisplayedEmailCount] = useState(5)

    // Active filters
    const [activeStatus, setActiveStatus] = useState<string | null>(null)
    const [activeCampaign, setActiveCampaign] = useState<string | null>(null)
    const [activeInbox, setActiveInbox] = useState<string | null>(null)
    const [activeAiLabel, setActiveAiLabel] = useState<string | null>(null)
    const [activeMoreFilter, setActiveMoreFilter] = useState<string | null>(null)
    const [listWidth, setListWidth] = useState(0) // Will be calculated on mount

    // Bulk selection state
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())


    // File attachment state
    const [attachments, setAttachments] = useState<File[]>([])

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
    // Search within sections
    const [statusSearch, setStatusSearch] = useState("")
    const [campaignSearch, setCampaignSearch] = useState("")
    const [inboxSearch, setInboxSearch] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

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
        { name: "Starred", value: "starred", icon: Star },
        { name: "Snoozed", value: "snoozed", icon: Clock },
        { name: "Archived", value: "archived", icon: Archive },
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
        loadWorkspaces()
        loadCampaigns()
        loadAccounts()
        loadTags()

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
        useEffect(() => {
            setPage(1)
            loadEmails()
            loadCampaigns() // Reload campaigns when workspace changes
        }, [activeStatus, activeCampaign, activeInbox, activeAiLabel, activeMoreFilter, activeTag, searchQuery, currentWorkspace])

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

        const loadTags = async () => {
            try {
                const res = await fetch('/api/tags')
                if (res.ok) {
                    const data = await res.json()
                    setTags(Array.isArray(data) ? data : [])
                }
            } catch (error) {
                console.error("Failed to load tags:", error)
                setTags([])
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
                if (activeTag) params.append("tags", activeTag)
                if (searchQuery) params.append("search", searchQuery)


                const res = await fetch(`/api/unibox/emails?${params.toString()}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.length === 0 && !activeStatus && !activeCampaign && !activeInbox && !activeAiLabel && !activeMoreFilter && !activeTag && !searchQuery) {
                        // Only show demo email if NO filters are active (clean state)
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
                        // Backend handles search filtering now
                        setEmails(data)
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
                    toast({ title: "Success", description: `Label "${newLabelName}" created` })
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
            setActiveAiLabel(null)
            setActiveMoreFilter(null)
            setActiveTag(null)
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

        const handleMarkAsRead = async (emailId: string, isRead: boolean) => {
            // Optimistic update
            const originalEmails = [...emails]
            const originalSelected = selectedEmail

            setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead } : e))
            if (selectedEmail?.id === emailId) {
                setSelectedEmail(prev => prev ? { ...prev, isRead } : null)
            }
            try {
                await fetch(`/api/leads/${emailId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isRead })
                })

                if (!isRead) {
                    toast({
                        title: "Conversation marked as unread",
                        action: (
                            <div onClick={async () => {
                                // UNDO Mark as Unread
                                setEmails(originalEmails)
                                if (originalSelected?.id === emailId) setSelectedEmail(originalSelected)
                                // Revert API
                                await fetch(`/api/leads/${emailId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isRead: true })
                                })
                                toast({ title: "Action undone" })
                            }} className="bg-white text-black hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-colors shadow-sm border">
                                Undo
                            </div>
                        ),
                        duration: 5000,
                    })
                }
            } catch (error) {
                console.error("Failed to mark as read", error)
                setEmails(originalEmails)
                if (originalSelected) setSelectedEmail(originalSelected)
            }
        }

        const loadEmailBody = async (email: Email) => {
            setSelectedEmail(email)
            setReplyMode(null)
            setReplyBody("")

            try {
                const res = await fetch(`/api/leads/${email.id}`)
                if (res.ok) {
                    const data = await res.json()
                    // Map events to messages for threading
                    const messages = (data.events || [])
                        .filter((e: any) => e.name === 'email_sent' || e.name === 'email_received')
                        .map((e: any) => ({
                            id: e.id,
                            isMe: e.name === 'email_sent',
                            from: e.name === 'email_sent' ? 'Me' : (data.firstName ? `${data.firstName} ${data.lastName || ''}` : email.fromName),
                            to: e.name === 'email_sent' ? (data.firstName || 'Lead') : 'Me',
                            body: e.details, // Assuming 'details' contains the email body
                            timestamp: e.createdAt
                        }))
                        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                    // Use the HTML or Text content from events or lead body
                    const lastEvent = data.events?.[0]
                    const emailContent = lastEvent?.details || data.body || data.text || email.preview

                    const updatedEmail = { ...email, body: emailContent, events: data.events, aiLabel: data.aiLabel, messages }
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

        const handleToggleStar = async (emailId: string, currentStatus: boolean, e?: React.MouseEvent) => {
            if (e) e.stopPropagation()

            // Optimistic update
            const newStatus = !currentStatus
            setEmails(emails.map(email =>
                email.id === emailId ? { ...email, isStarred: newStatus } : email
            ))
            // also update if selected
            if (selectedEmail?.id === emailId) {
                setSelectedEmail(prev => prev ? { ...prev, isStarred: newStatus } : null)
            }

            try {
                // Immediate API call for Star (usually low risk)
                // Or should we allow Undo? Star is easily togglable back. 
                // Gmail allows Undo for "Conversation starred" but it's less critical.
                // Let's just do immediate for Star but show simple feedback?
                // User asked for "any action... done there should be an notification like gmail gives with an undo button".
                // So we'll add Undo for Star too.

                const res = await fetch('/api/unibox/star', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: emailId, isStarred: newStatus })
                })

                toast({
                    title: newStatus ? "Conversation marked as important" : "Conversation unmarked as important",
                    action: (
                        <div onClick={async () => {
                            // Custom Undo for Star
                            setEmails(prev => prev.map(email => email.id === emailId ? { ...email, isStarred: currentStatus } : email))
                            if (selectedEmail?.id === emailId) setSelectedEmail(prev => prev ? { ...prev, isStarred: currentStatus } : null)
                            // Revert API
                            const undoRes = await fetch('/api/unibox/star', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ leadId: emailId, isStarred: currentStatus })
                            })
                            toast({ title: "Action undone" })
                        }} className="bg-white text-black hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-colors">
                            Undo
                        </div>
                    )
                })

            } catch (error) {
                console.error("Star failed", error)
                // Revert
                setEmails(emails.map(email => email.id === emailId ? { ...email, isStarred: currentStatus } : email))
            }
        }

        const handleArchive = async (emailId: string, currentStatus?: boolean, e?: React.MouseEvent) => {
            if (e) e.stopPropagation()

            const email = emails.find(em => em.id === emailId)
            if (!email) return

            const actualCurrentStatus = currentStatus !== undefined ? currentStatus : (email.isArchived || false)
            const newStatus = !actualCurrentStatus

            // Optimistic update
            const originalEmails = [...emails]
            const originalSelected = selectedEmail

            // Hide from current list (standard Archive behavior)
            setEmails(prev => prev.filter(em => em.id !== emailId))
            if (selectedEmail?.id === emailId) setSelectedEmail(null)

            try {
                await fetch('/api/unibox/archive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: emailId, isArchived: newStatus })
                })

                toast({
                    title: newStatus ? "Conversation archived" : "Conversation moved to Inbox",
                    description: "3.. 2.. 1..",
                    action: (
                        <div onClick={async () => {
                            // UNDO Archive
                            setEmails(prev => [email, ...prev]) // Simply put back to top or resort?
                            // Better: Restore original state including list position
                            setEmails(originalEmails) // This is safer for consistency
                            if (originalSelected?.id === emailId) setSelectedEmail(originalSelected)
                            // Revert API
                            await fetch('/api/unibox/archive', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ leadId: emailId, isArchived: actualCurrentStatus })
                            })
                            toast({ title: "Action undone" })
                        }} className="bg-white text-black hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-colors shadow-sm border">
                            Undo
                        </div>
                    ),
                    duration: 5000,
                })
            } catch (error) {
                console.error("Archive failed", error)
                setEmails(originalEmails)
                if (originalSelected) setSelectedEmail(originalSelected)
            }
        }

        const handleDeleteEmail = async (emailId: string, e?: React.MouseEvent) => {
            if (e) e.stopPropagation()

            const emailToDelete = emails.find(em => em.id === emailId)
            if (!emailToDelete) return

            // Optimistically remove
            const originalEmails = [...emails]
            const originalSelected = selectedEmail
            setEmails(prev => prev.filter(em => em.id !== emailId))

            if (selectedEmail?.id === emailId) setSelectedEmail(null)

            // Set pending timeout for actual deletion (Undo support)
            const timerId = setTimeout(async () => {
                try {
                    // Try deleting via /api/emails first, fallback to /api/leads
                    const res = await fetch(`/api/emails/${emailId}`, { method: 'DELETE' })
                    if (!res.ok) {
                        await fetch(`/api/leads/${emailId}`, { method: 'DELETE' })
                    }
                } catch (err) {
                    console.error("Delete failed", err)
                }
            }, 5000)

            toast({
                title: "Conversation deleted",
                description: "This action can be undone",
                action: (
                    <div onClick={() => {
                        // UNDO Delete
                        clearTimeout(timerId)
                        setEmails(originalEmails)
                        if (originalSelected?.id === emailId) setSelectedEmail(originalSelected)
                        toast({ title: "Deletion undone" })
                    }} className="bg-white text-black hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-colors shadow-sm border">
                        Undo
                    </div>
                ),
                duration: 5000,
            })
        }

        const handleSnooze = async (id: string, snoozeUntil: Date) => {
            const emailToSnooze = emails.find(e => e.id === id)
            if (!emailToSnooze) return

            // Optimistic update - remove from list
            const originalEmails = [...emails]
            setEmails(emails.filter(e => e.id !== id))
            if (selectedEmail?.id === id) setSelectedEmail(null)

            toast({
                title: "Email snoozed",
                description: `Email will reappear on ${snoozeUntil.toLocaleString()}`,
                action: (
                    <div onClick={async () => {
                        // UNDO Snooze
                        setEmails(originalEmails)
                        if (selectedEmail?.id === id) setSelectedEmail(emailToSnooze)

                        try {
                            // Revert by setting snoozedUntil to null or past?
                            // Schema says String or DateTime. Usually null to unsnooze.
                            await fetch(`/api/leads/${id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ snoozedUntil: null })
                            })
                            toast({ title: "Snooze undone" })
                        } catch (err) {
                            console.error("Undo snooze failed", err)
                        }
                    }} className="bg-white text-black hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-colors">
                        Undo
                    </div>
                )
            })

            try {
                await fetch(`/api/leads/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ snoozedUntil: snoozeUntil.toISOString() })
                })
            } catch (error) {
                console.error('Failed to snooze:', error)
                setEmails(originalEmails)
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



        // Keyboard Shortcuts

        // Update currentIndex when an email is selected manually
        useEffect(() => {
            if (selectedEmail) {
                const index = emails.findIndex(e => e.id === selectedEmail.id)
                if (index !== -1) setCurrentIndex(index)
            }
        }, [selectedEmail, emails])



        // Undo Send Logic
        const handleSendReply = async () => {
            if (!selectedEmail || !replyBody.trim()) return

            // 1. Set as pending
            pendingReplyRef.current = { emailId: selectedEmail.id, body: replyBody, mode: replyMode, forwardTo, forwardSubject }
            setIsUndoVisible(true)
            setReplyMode(null) // Close reply box immediately

            // 2. Start timer
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
            undoTimerRef.current = setTimeout(() => {
                executeSend()
            }, 5000)

            toast({
                title: "Sending...",
                description: "Email will be sent in 5 seconds",
                action: (
                    <Button variant="outline" size="sm" onClick={handleUndo}>
                        Undo
                    </Button>
                ),
            })
        }

        const handleUndo = () => {
            if (undoTimerRef.current) {
                clearTimeout(undoTimerRef.current)
                undoTimerRef.current = null
                setIsUndoVisible(false)
                if (pendingReplyRef.current) {
                    setReplyMode(pendingReplyRef.current.mode)
                    setReplyBody(pendingReplyRef.current.body)
                    setForwardTo(pendingReplyRef.current.forwardTo || "")
                    setForwardSubject(pendingReplyRef.current.forwardSubject || "")
                }
                toast({ title: "Send cancelled", description: "Your message has been restored" })
            }
        }

        const executeSend = async () => {
            const params = pendingReplyRef.current
            if (!params) return

            setSendingReply(true)
            setIsUndoVisible(false)
            try {
                let res
                if (params.mode === 'forward') {
                    res = await fetch('/api/emails/forward', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            emailId: params.emailId,
                            to: params.forwardTo,
                            subject: params.forwardSubject,
                            body: params.body
                        })
                    })
                } else {
                    res = await fetch('/api/emails/reply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            emailId: params.emailId,
                            body: params.body,
                            replyAll: params.mode === 'reply-all'
                        })
                    })
                }

                if (res.ok) {
                    toast({
                        title: "Email sent",
                        description: params.mode === 'forward'
                            ? `Forwarded to ${params.forwardTo}`
                            : `Reply sent successfully`
                    })
                    setReplyBody("")
                    setForwardTo("")
                    setForwardSubject("")
                } else {
                    toast({ title: "Error", description: "Failed to send email. Please try again.", variant: "destructive" })
                }
            } catch (error) {
                console.error('Failed to send email:', error)
                toast({ title: "Error", description: "Failed to send email", variant: "destructive" })
            } finally {
                setSendingReply(false)
                pendingReplyRef.current = null
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

        // Keyboard Shortcuts
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                // Don't trigger if user is typing in an input or editor
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
                    // Ctrl+Enter to send
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        if (replyMode) handleSendReply()
                    }
                    return
                }

                switch (e.key.toLowerCase()) {
                    case '?':
                        if (e.shiftKey) setShortcutsModalOpen(true)
                        break
                    case 's': // Star
                        if (selectedEmail) handleToggleStar(selectedEmail.id, selectedEmail.isStarred || false)
                        break
                    case 'u': // Unselect / Back
                        setSelectedEmail(null)
                        break
                    case 'j': // Next email
                        if (currentIndex < emails.length - 1) {
                            const next = currentIndex + 1
                            setCurrentIndex(next)
                            loadEmailBody(emails[next])
                        }
                        break
                    case 'k': // Previous email
                        if (currentIndex > 0) {
                            const prev = currentIndex - 1
                            setCurrentIndex(prev)
                            loadEmailBody(emails[prev])
                        }
                        break
                    case 'r': // Reply
                        if (selectedEmail) setReplyMode('reply')
                        break
                    case 'f': // Forward
                        if (selectedEmail) {
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
                        }
                        break
                    case 'e': // Archive
                        if (selectedEmail) handleArchive(selectedEmail.id)
                        break
                    case '#': // Delete
                        if (selectedEmail) handleDeleteEmail(selectedEmail.id)
                        break
                    case '/': // Search
                        e.preventDefault()
                        const searchInput = document.querySelector('input[placeholder="Search mail"]') as HTMLInputElement
                        searchInput?.focus()
                        break
                }
            }

            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }, [currentIndex, emails, selectedEmail, replyMode, handleSendReply, handleArchive, handleToggleStar])

        // Mark as Lost (same as setting label to lost)
        const handleMarkAsLost = () => {
            if (selectedEmail) handleLabelChange(selectedEmail.id, 'lost')
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

        // Bulk Actions
        const toggleEmailSelection = (emailId: string) => {
            const newSelected = new Set(selectedEmails)
            if (newSelected.has(emailId)) {
                newSelected.delete(emailId)
            } else {
                newSelected.add(emailId)
            }
            setSelectedEmails(newSelected)
        }

        const selectAll = () => {
            setSelectedEmails(new Set(emails.map(e => e.id)))
        }

        const selectFirstTen = () => {
            setSelectedEmails(new Set(emails.slice(0, 10).map(e => e.id)))
        }

        const selectUnread = () => {
            setSelectedEmails(new Set(emails.filter(e => !e.isRead).map(e => e.id)))
        }

        const clearSelection = () => {
            setSelectedEmails(new Set())
        }

        const massMarkAsRead = async () => {
            const ids = Array.from(selectedEmails)
            for (const id of ids) {
                await handleMarkAsRead(id, true)
            }
            clearSelection()
            toast({ title: "Success", description: `Marked ${ids.length} emails as read` })
        }

        const massDelete = async () => {
            const ids = Array.from(selectedEmails)
            for (const id of ids) {
                await handleDeleteEmail(id)
            }
            clearSelection()
            toast({ title: "Success", description: `Deleted ${ids.length} emails` })
        }

        const massLabel = async (label: string) => {
            const ids = Array.from(selectedEmails)
            for (const id of ids) {
                await fetch(`/api/leads/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ aiLabel: label })
                })
            }
            setEmails(emails.map(e => selectedEmails.has(e.id) ? { ...e, aiLabel: label } : e))
            clearSelection()
            toast({ title: "Success", description: `Labeled ${ids.length} emails as ${label}` })
        }

        // File Attachment Handlers
        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || [])
            const MAX_SIZE = 25 * 1024 * 1024 // 25MB

            const validFiles: File[] = []
            const oversizedFiles: string[] = []

            files.forEach(file => {
                if (file.size > MAX_SIZE) {
                    oversizedFiles.push(file.name)
                } else {
                    validFiles.push(file)
                }
            })

            if (oversizedFiles.length > 0) {
                toast({
                    title: "File size limit exceeded",
                    description: `The following files exceed 25MB and were not added: ${oversizedFiles.join(', ')}. Please use a file sharing service for large files.`,
                    variant: "destructive"
                })
            }

            if (validFiles.length > 0) {
                setAttachments([...attachments, ...validFiles])
                toast({
                    title: "Files attached",
                    description: `Added ${validFiles.length} file(s)`
                })
            }
        }

        const removeAttachment = (index: number) => {
            setAttachments(attachments.filter((_, i) => i !== index))
        }



        return (
            <>
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

                                    {/* Tags Section */}
                                    <div>
                                        <button
                                            onClick={() => setTagsExpanded(!tagsExpanded)}
                                            className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground mb-2"
                                        >
                                            <span className="text-sm font-medium">Tags</span>
                                            {tagsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        {tagsExpanded && (
                                            <div className="space-y-1">
                                                <Input
                                                    placeholder="Search tags..."
                                                    value={tagSearch}
                                                    onChange={(e) => setTagSearch(e.target.value)}
                                                    className="bg-[#1e1e24] border-[#2a2a35] text-foreground text-sm h-8 placeholder:text-[#a1a1aa]"
                                                />
                                                {tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).map((tag) => (
                                                    <button
                                                        key={tag.id}
                                                        onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors",
                                                            activeTag === tag.id
                                                                ? "bg-blue-600/20 text-blue-400"
                                                                : "text-[#a1a1aa] hover:bg-[#1e1e24] hover:text-foreground"
                                                        )}
                                                    >
                                                        <Hash className="h-4 w-4" />
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

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
                                <div className="flex flex-col border-b border-[#2a2a35] relative">
                                    {selectedEmails.size > 0 ? (
                                        <div className="absolute inset-0 z-10 bg-[#1e1e24] flex items-center justify-between px-6 animate-in fade-in duration-200">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={selectedEmails.size > 0}
                                                        onCheckedChange={() => {
                                                            if (selectedEmails.size === emails.length) clearSelection()
                                                            else selectAll()
                                                        }}
                                                        className="border-[#52525b] data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-4 w-4 rounded-[4px]"
                                                    />
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-6 w-4 p-0 text-[#a1a1aa] hover:text-foreground">
                                                                <ChevronDown className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">
                                                            <DropdownMenuItem onClick={selectAll} className="hover:bg-[#2a2a35] cursor-pointer">All</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={selectFirstTen} className="hover:bg-[#2a2a35] cursor-pointer">First 10</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={selectUnread} className="hover:bg-[#2a2a35] cursor-pointer">Unread</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={clearSelection} className="hover:bg-[#2a2a35] cursor-pointer">None</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{selectedEmails.size} selected</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => massMarkAsRead()} className="text-[#a1a1aa] hover:text-foreground hover:bg-[#2a2a35]">
                                                                <MailOpen className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">Mark as read</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => massDelete()} className="text-[#a1a1aa] hover:text-red-400 hover:bg-[#2a2a35]">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">Delete</TooltipContent>
                                                    </Tooltip>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-[#a1a1aa] hover:text-foreground hover:bg-[#2a2a35]">
                                                                <Zap className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">
                                                            {aiFilters.map(f => (
                                                                <DropdownMenuItem key={f.value} onClick={() => massLabel(f.value)} className="hover:bg-[#2a2a35] cursor-pointer">
                                                                    <f.icon className={cn("mr-2 h-4 w-4", f.color)} />
                                                                    {f.name}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                    ) : null}


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
                                            {emails.slice(0, displayedEmailCount).map((email, index) => (
                                                <div
                                                    key={email.id}
                                                    onClick={() => {
                                                        setCurrentIndex(index)
                                                        loadEmailBody(email)
                                                    }}
                                                    className={cn(
                                                        "relative p-4 cursor-pointer transition-colors hover:bg-[#1e1e24] flex gap-3 group",
                                                        selectedEmail?.id === email.id ? "bg-[#1e1e24]" : "bg-transparent",
                                                        !email.isRead && "bg-[#16161a]"
                                                    )}
                                                >
                                                    {/* Hover Actions */}
                                                    <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-[#2a2a35] border border-[#3f3f46] rounded-md shadow-lg p-0.5 z-20">
                                                        <TooltipProvider delayDuration={0}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#a1a1aa] hover:text-foreground hover:bg-[#3f3f46]" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(email.id, !email.isRead); }}>
                                                                        {email.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Mark as {email.isRead ? 'unread' : 'read'}</TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#a1a1aa] hover:text-foreground hover:bg-[#3f3f46]" onClick={(e) => { handleArchive(email.id, false, e); }}>
                                                                        <Archive className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Archive</TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#a1a1aa] hover:text-foreground hover:bg-[#3f3f46] hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDeleteEmail(email.id); }}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Delete</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>

                                                    {/* Blue Stripe for active/unread/demo look */}
                                                    {(!email.isRead || selectedEmail?.id === email.id) && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                                    )}

                                                    <div className="mt-0.5 pl-0.5" onClick={(e) => e.stopPropagation()}>
                                                        <Zap className="h-3.5 w-3.5 text-green-500 fill-green-500" />
                                                    </div>

                                                    <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={selectedEmails.has(email.id)}
                                                            onCheckedChange={() => toggleEmailSelection(email.id)}
                                                            className="border-[#52525b] data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-4 w-4 rounded-[4px]"
                                                        />
                                                    </div>
                                                    <div className="mt-0.5 ml-1" onClick={(e) => { e.stopPropagation(); handleToggleStar(email.id, email.isStarred || false); }}>
                                                        <Star className={cn("h-4 w-4 transition-colors cursor-pointer", email.isStarred ? "fill-yellow-400 text-yellow-400" : "text-[#52525b] hover:text-[#a1a1aa]")} />
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
                                                        <div className="text-sm text-[#e4e4e7] truncate mb-0.5 font-bold flex items-center gap-2">
                                                            {email.subject}
                                                            {email.hasAttachment && (
                                                                <Paperclip className="h-3 w-3 text-[#71717a] flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        {email.tags && email.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-1">
                                                                {email.tags.map(tag => (
                                                                    <span key={tag.id} className="text-[10px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                        {tag.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-[#a1a1aa] line-clamp-2 leading-relaxed opacity-80">
                                                            {email.preview ? email.preview.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') : (
                                                                email.body ? email.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').substring(0, 100) : "No content"
                                                            )}
                                                        </p>
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
                                                                            onClick={() => selectedEmail && handleLabelChange(selectedEmail.id, s.value)}
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

                                                        <button className="p-1 px-2 border border-[#2a2a35] rounded bg-[#1e1e24] hover:bg-[#272730] transition-colors" onClick={() => setReminderModalOpen(true)}>
                                                            <Calendar className="h-3 w-3 text-[#a1a1aa]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#a1a1aa] hover:text-foreground hover:bg-[#272730]" onClick={() => handleToggleStar(selectedEmail.id, selectedEmail.isStarred || false)}>
                                                                <Star className={cn("h-4 w-4", selectedEmail.isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">
                                                            {selectedEmail.isStarred ? "Starred" : "Not starred"}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#a1a1aa] hover:text-foreground hover:bg-[#272730]" onClick={() => handleArchive(selectedEmail.id)}>
                                                                <Archive className={cn("h-4 w-4", selectedEmail.isArchived ? "text-green-500" : "")} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">Archive</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
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
                                                            onClick={() => handleDeleteEmail(selectedEmail.id)}
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
                                            </div>
                                        </div>

                                        <div className="text-xs text-[#71717a]">
                                            From: <span className="text-[#a1a1aa]">{selectedEmail.fromName}</span> &lt;{selectedEmail.from}&gt;
                                            <br />
                                            to: <span className="text-[#a1a1aa]">{selectedEmail.recipient || "User"}</span> &lt;{selectedEmail.recipientEmail || "user@example.com"}&gt;
                                        </div>

                                        <div className="mt-4" onClick={e => e.stopPropagation()}>
                                            <TagManager
                                                entityId={selectedEmail.id}
                                                entityType="lead"
                                                assignedTags={selectedEmail.tags || []}
                                                onTagsChange={loadEmails}
                                                readOnly={false}
                                            />
                                        </div>
                                    </div>

                                    {/* Detail Body */}
                                    <div className="flex-1 overflow-y-auto p-8 bg-background space-y-8">
                                        {selectedEmail.messages && selectedEmail.messages.length > 0 ? (
                                            <div className="space-y-6">
                                                {selectedEmail.messages.map((msg, idx) => (
                                                    <div key={msg.id} className={cn(
                                                        "animate-in fade-in slide-in-from-bottom-2 duration-500",
                                                        "border rounded-lg overflow-hidden",
                                                        msg.isMe ? "border-[#2a2a35] bg-[#1e1e24]" : "border-[#2a2a35] bg-[#16161a]"
                                                    )}>
                                                        <div className="px-4 py-3 border-b border-[#2a2a35] flex items-center justify-between gap-4 bg-[#272730]/30">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={cn(
                                                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                                                                    msg.isMe ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                                                                )}>
                                                                    {msg.isMe ? "ME" : (msg.from?.[0]?.toUpperCase() || selectedEmail.fromName?.[0]?.toUpperCase() || "?")}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-semibold text-foreground truncate">
                                                                        {msg.isMe ? "You" : (msg.from || selectedEmail.fromName)}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground truncate">
                                                                        to {msg.to || "Me"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-[#71717a] whitespace-nowrap shrink-0">
                                                                {new Date(msg.timestamp).toLocaleString(undefined, {
                                                                    month: 'short', day: 'numeric',
                                                                    hour: 'numeric', minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="p-5 text-sm leading-relaxed text-[#d4d4d8] font-sans">
                                                            {/* Render HTML content safely */}
                                                            <div dangerouslySetInnerHTML={{ __html: msg.body }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div
                                                className="prose prose-invert max-w-none text-foreground leading-relaxed"
                                                style={{ fontSize: '14px', lineHeight: '1.6', color: '#e4e4e7' }}
                                            >
                                                {selectedEmail.body ? (
                                                    selectedEmail.body.includes('<') && selectedEmail.body.includes('>') ? (
                                                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                                                    ) : (
                                                        <div style={{ whiteSpace: 'pre-wrap' }}>{selectedEmail.body}</div>
                                                    )
                                                ) : (
                                                    <div style={{ whiteSpace: 'pre-wrap', color: '#a1a1aa' }}>{selectedEmail.preview}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Detail Footer */}
                                    <div className="p-4 bg-background border-t border-[#2a2a35]">
                                        {replyMode ? (
                                            <div className="border border-[#2a2a35] rounded-xl bg-[#1e1e24] shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                                                <div className="flex flex-col gap-0 border-b border-[#2a2a35] bg-[#272730]/50">
                                                    {/* Forward Fields */}
                                                    {replyMode === 'forward' && (
                                                        <div className="p-3 space-y-2 border-b border-[#2a2a35] bg-[#1e1e24]">
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs text-[#71717a] w-12 font-medium">To:</Label>
                                                                <Input
                                                                    value={forwardTo}
                                                                    onChange={(e) => setForwardTo(e.target.value)}
                                                                    className="flex-1 bg-transparent border-none text-sm text-foreground focus-visible:ring-0 h-6 p-0 placeholder:text-[#52525b]"
                                                                    placeholder="recipient@example.com"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs text-[#71717a] w-12 font-medium">Subject:</Label>
                                                                <Input
                                                                    value={forwardSubject}
                                                                    onChange={(e) => setForwardSubject(e.target.value)}
                                                                    className="flex-1 bg-transparent border-none text-sm text-foreground focus-visible:ring-0 h-6 p-0 placeholder:text-[#52525b]"
                                                                    placeholder="Subject"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Smart Replies */}
                                                    <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2a2a35] bg-[#272730]/30 overflow-x-auto scroller-hidden">
                                                        <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider whitespace-nowrap">Smart Reply:</span>
                                                        {[
                                                            { label: "Interested", text: "I'm interested, tell me more!" },
                                                            { label: "Meeting?", text: "Would you be open to a quick call tomorrow?" },
                                                            { label: "Not now", text: "Thanks, but not at the moment." },
                                                            { label: "Wrong person", text: "I'm not the right person for this, but you can try [Name]." }
                                                        ].map(suggest => (
                                                            <button
                                                                key={suggest.label}
                                                                onClick={() => setReplyBody(suggest.text + (replyBody.includes('--') ? replyBody.substring(replyBody.indexOf('<br><br>--')) : ''))}
                                                                className="px-2 py-1 rounded-full bg-[#333] hover:bg-[#444] text-[11px] text-[#a1a1aa] transition-colors whitespace-nowrap"
                                                            >
                                                                {suggest.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="bg-[#1e1e24] min-h-[200px] flex flex-col relative">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-2 top-2 h-6 w-6 text-[#a1a1aa] hover:text-foreground z-10"
                                                            onClick={() => setReplyMode(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                        <Textarea
                                                            value={replyBody}
                                                            onChange={(e) => setReplyBody(e.target.value)}
                                                            placeholder={replyMode === 'forward' ? "Forward message..." : "Type your reply..."}
                                                            className="flex-1 bg-transparent border-none focus-visible:ring-0 resize-none p-4 text-base leading-relaxed text-gray-200 min-h-[150px]"
                                                        />

                                                        {/* Attachments List */}
                                                        {attachments.length > 0 && (
                                                            <div className="px-4 pb-2 flex flex-wrap gap-2">
                                                                {attachments.map((file, idx) => (
                                                                    <div key={idx} className="flex items-center bg-[#272730] border border-[#2a2a35] rounded-md px-3 py-1 text-xs text-[#a1a1aa]">
                                                                        <span className="max-w-[150px] truncate mr-2">{file.name}</span>
                                                                        <button onClick={() => removeAttachment(idx)} className="hover:text-foreground">
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="px-4 py-3 border-t border-[#2a2a35] flex items-center justify-between">
                                                            <div className="flex gap-2 items-center">
                                                                <input
                                                                    type="file"
                                                                    id="file-upload"
                                                                    multiple
                                                                    className="hidden"
                                                                    onChange={handleFileSelect}
                                                                />
                                                                <TooltipProvider delayDuration={0}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="text-[#a1a1aa] hover:text-foreground h-8 w-8" onClick={() => document.getElementById('file-upload')?.click()}>
                                                                                <Paperclip className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">Attach files</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                <TooltipProvider delayDuration={0}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="text-[#a1a1aa] hover:text-red-400 h-8 w-8" onClick={() => {
                                                                                setReplyBody("")
                                                                                setAttachments([])
                                                                                setReplyMode(null)
                                                                            }}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-[#1e1e24] border-[#2a2a35] text-foreground">Discard draft</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                            <Button
                                                                onClick={handleSendReply}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 font-bold shadow-lg shadow-blue-500/20 rounded-md transition-all"
                                                                disabled={sendingReply}
                                                            >
                                                                {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
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
                    <DialogContent className="sm:max-w-md bg-[#1e1e24] border-[#2a2a35] text-foreground p-0 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-[#2a2a35]">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-yellow-500" />
                                    Snooze / Set Reminder
                                </DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Presets */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    {
                                        label: "Tomorrow", icon: Sun, value: () => {
                                            const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16);
                                        }
                                    },
                                    {
                                        label: "This Weekend", icon: Calendar, value: () => {
                                            const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(10, 0, 0, 0); return d.toISOString().slice(0, 16);
                                        }
                                    },
                                    {
                                        label: "Next Week", icon: ArrowRight, value: () => {
                                            const d = new Date(); d.setDate(d.getDate() + (8 - d.getDay())); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16);
                                        }
                                    },
                                    {
                                        label: "Morning", icon: Clock, value: () => {
                                            const d = new Date(); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16);
                                        }
                                    }
                                ].map(preset => (
                                    <Button
                                        key={preset.label}
                                        variant="outline"
                                        className="bg-[#272730] border-[#3a3a45] hover:bg-[#32323d] text-xs justify-start h-10 px-3 transition-all"
                                        onClick={() => setReminderDate(preset.value())}
                                    >
                                        <preset.icon className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-[#71717a]">Custom Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={reminderDate}
                                        onChange={(e) => setReminderDate(e.target.value)}
                                        className="bg-background border-[#2a2a35] text-foreground h-11 focus-visible:ring-blue-500 [color-scheme:dark] text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-[#71717a]">Follow-up Note</Label>
                                    <Input
                                        value={reminderMessage}
                                        onChange={(e) => setReminderMessage(e.target.value)}
                                        placeholder="Remind me to..."
                                        className="bg-background border-[#2a2a35] text-foreground h-11 focus-visible:ring-blue-500 placeholder:text-[#52525b] text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[#272730]/50 border-t border-[#2a2a35] flex gap-3 justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setReminderModalOpen(false)
                                    setReminderDate("")
                                    setReminderMessage("")
                                }}
                                className="text-[#a1a1aa] hover:text-foreground hover:bg-[#2a2a35]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={saveReminder}
                                className="bg-blue-600 hover:bg-blue-700 text-foreground px-6 font-bold"
                                disabled={!reminderDate}
                            >
                                Save Reminder
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <KeyboardShortcutsHelp open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
            </>
        )
    }

}
