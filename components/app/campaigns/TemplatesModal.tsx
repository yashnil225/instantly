
import { useState, useEffect } from "react"
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
            { id: 't1', name: 'Solution for {{company}}', subject: "Solution for {{company}}", body: "Hi {{firstName}},\n\nI noticed that {{company}} is currently looking to scale their outbound.\n\nWe help companies like yours generate 15-20 qualified meetings a month completely on a pay-per-show basis.\n\nWould you be open to a quick 10-minute chat to see how we do it?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 't2', name: 'Scaling {{company}}', subject: "Question about scaling {{company}}", body: "Hey {{firstName}},\n\nAre you the right person to speak to about your outbound systems?\n\nWe recently helped [Competitor/Similar Company] add $50k in pipeline in 30 days using automated personalized sequencing.\n\nIs this something you're currently prioritizing?\n\nCheers,\n{{sendingAccountFirstName}}" },
            { id: 't3', name: 'Quick Question', subject: "{{firstName}} - quick question", body: "Hey {{firstName}},\n\nYour LinkedIn was impressive and I wanted to reach out directly.\n\nSo we're helping B2B companies from your area to fill their calendar with 5-12 calls with ideal customers daily.\n\nIf you let me have a call with you about how we can do the same for you, I will send you a burger with UberEats :D\n\nAre you free any time this week for a quick chat?\n\nCheers,\n{{sendingAccountFirstName}}" },
            { id: 't4', name: 'Resource Drop', subject: "Guide for outbound at {{company}}", body: "Hi {{firstName}},\n\nI put together a quick 3-page guide on how similar companies in your space are dropping their CPL by 40% with intent data.\n\nWould it be helpful if I sent that over for you and your team to review?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 't5', name: 'Permission to pitch', subject: "Quick question for {{firstName}}", body: "Hey {{firstName}},\n\nI know you're busy, so I'll keep this brief.\n\nWe build completely done-for-you lead generation engines for B2B companies that guarantee a positive ROI in 60 days.\n\nAre you open to learning more? If not, no worries at all.\n\nThanks,\n{{sendingAccountFirstName}}" }
        ]
    },
    { 
        id: 'agency', name: 'LeadGen Agency', count: 5, templates: [
            { id: 'a1', name: 'Outbound infrastructure', subject: "Your outbound infrastructure", body: "Hi {{firstName}},\n\nI was looking at {{company}}'s site and love the recent case studies.\n\nMost agencies I talk to are struggling to keep their calendars full consistently. We build completely done-for-you outbound systems that guarantee 10+ qualified sales calls per month, or you don't pay.\n\nWould you be opposed to seeing a quick 2-minute video on how it works?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'a2', name: 'Permission to pitch', subject: "Quick question for {{firstName}}", body: "Hey {{firstName}},\n\nI know you're busy running {{company}}, so I'll keep this brief.\n\nWe help agencies like yours automate their entire lead generation process so you can focus on closing deals and client delivery.\n\nAre you open to learning more? If not, no worries at all.\n\nThanks,\n{{sendingAccountFirstName}}" },
            { id: 'a3', name: 'Recent launch', subject: "Saw your recent post", body: "Hi {{firstName}},\n\nSaw your recent post on LinkedIn about scaling {{company}}—really resonated with your approach to client success.\n\nI’m reaching out because we help agencies add an extra $20k-$30k MRR in 90 days by revamping their cold email infrastructure.\n\nWorth a quick chat later this week?\n\nCheers,\n{{sendingAccountFirstName}}" },
            { id: 'a4', name: 'Deliverability check', subject: "Are your emails landing in spam?", body: "Hey {{firstName}},\n\nI noticed you guys do a lot of outbound to get clients.\n\nOne of the biggest silent killers for agencies right now is domain reputation. We recently helped an agency increase their open rates from 20% to 65% just by fixing their technical setup.\n\nWould you be open to a free audit of your sending infrastructure?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'a5', name: 'The Breakup', subject: "Closing the loop", body: "Hi {{firstName}},\n\nI’ve reached out a few times and haven’t heard back, so I assume scaling your lead flow isn’t a priority for {{company}} right now.\n\nI’ll stop reaching out, but if things change, you know where to find me!\n\nBest of luck,\n{{sendingAccountFirstName}}" }
        ]
    },
    { 
        id: 'video', name: 'Video Production', count: 5, templates: [
            { id: 'v1', name: 'Competitor observation', subject: "Question about {{company}}'s video strategy", body: "Hi {{firstName}},\n\nI was checking out your recent launch—great work on the execution.\n\nI noticed some of your competitors have been heavily leaning into short-form video to reach your target audience. I’ve been researching how that shift is impacting their engagement, and I put together a few thoughts on how {{company}} could see similar results without massive overhead.\n\nWould you be open to a 10-minute chat to hear the breakdown?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'v2', name: 'Short & Concise Value', subject: "Video content for {{company}}", body: "Hi {{firstName}},\n\nWe specialize in helping companies like {{company}} produce high-conversion product demos that drive 20%+ higher conversions on landing pages.\n\nI’d love to send over a few examples of how we’ve helped clients in your industry achieve this.\n\nWould you like to see those, or is this not a priority for you right now?\n\nCheers,\n{{sendingAccountFirstName}}" },
            { id: 'v3', name: 'Loom Audit', subject: "Made a quick video for {{company}}", body: "Hey {{firstName}},\n\nI was browsing your site and noticed a few missed opportunities where video could dramatically increase time-on-page and conversions.\n\nI recorded a quick 2-minute Loom breaking down exactly what I'd change. Mind if I send the link?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'v4', name: 'Case Study', subject: "How we helped [Competitor]", body: "Hi {{firstName}},\n\nWe recently partnered with [Similar Company] to overhaul their YouTube strategy and helped them generate over 1M organic views in 6 months.\n\nI have a brief PDF detailing the exact framework we used. Would you be opposed to me sending it your way?\n\nThanks,\n{{sendingAccountFirstName}}" },
            { id: 'v5', name: 'Event Follow-up', subject: "Following up from [Event Name]", body: "Hey {{firstName}},\n\nI noticed {{company}} recently attended [Event/Conference]. \n\nWe help brands repurpose their event footage into 30+ pieces of high-quality social content to maximize the ROI of the trip.\n\nIs this something your marketing team is already handling in-house?\n\nCheers,\n{{sendingAccountFirstName}}" }
        ]
    },
    { 
        id: 'marketing', name: 'Marketing & Advertising', count: 5, templates: [
            { id: 'm1', name: 'Ad spend efficiency', subject: "Ideas for {{company}}'s ad spend", body: "Hey {{firstName}},\n\nI noticed you're currently running Facebook ads for {{company}}.\n\nWe recently audited an ad account for a similar brand and helped them drop their CPA by 34% in just two weeks by restructuring their creative testing.\n\nI put together a quick loom video with 3 things you could implement today to see similar results. Mind if I send it over?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'm2', name: 'SEO quick wins', subject: "SEO quick wins for {{company}}", body: "Hi {{firstName}},\n\nI was doing some research on your space and noticed {{company}} is currently missing out on some high-intent organic traffic that your competitors are capturing.\n\nWe help brands like yours dominate search without relying on paid ads. I ran a quick audit on your site and found 2 quick fixes that could boost your traffic this month.\n\nWould you like me to send over the report?\n\nCheers,\n{{sendingAccountFirstName}}" },
            { id: 'm3', name: 'Content Gap', subject: "Content gap on your blog", body: "Hi {{firstName}},\n\nYour recent article on [Topic] was excellent. \n\nI did notice, however, that you aren't ranking for [Keyword], which has 10k+ searches per month in your niche. \n\nWe specialize in building topical authority for SaaS companies. Are you open to a brief chat about capturing this traffic?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'm4', name: 'ROAS improvement', subject: "Improving ROAS at {{company}}", body: "Hey {{firstName}},\n\nMost eCommerce brands are struggling with rising ad costs right now. \n\nWe deploy a retention-first email marketing strategy that consistently adds 15-20% to our clients' top-line revenue without spending a dime more on ads.\n\nWould you be open to seeing a case study on how we did this for [Brand]?\n\nCheers,\n{{sendingAccountFirstName}}" },
            { id: 'm5', name: 'Direct Competitor', subject: "How [Competitor] is scaling", body: "Hi {{firstName}},\n\nI've been analyzing [Competitor]'s recent ad strategy and they've made a massive shift toward [Strategy].\n\nI put together a 5-minute breakdown of their funnel and how {{company}} could easily replicate it for a fraction of the cost.\n\nCan I send the link over to you?\n\nBest,\n{{sendingAccountFirstName}}" }
        ]
    },
    { 
        id: 'coaching', name: 'Coaching', count: 5, templates: [
            { id: 'c1', name: 'Client acquisition', subject: "Scaling your coaching practice", body: "Hi {{firstName}},\n\nLove the content you're putting out on LinkedIn recently, especially your thoughts on leadership.\n\nMost coaches I speak with struggle to find a predictable way to get high-ticket clients outside of referrals. We install a client acquisition system that brings in 3-5 new high-ticket coaching clients every month on autopilot.\n\nAre you currently taking on new clients? If so, would you be open to a quick chat?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'c2', name: 'Free community value', subject: "Resource for {{company}}", body: "Hey {{firstName}},\n\nI've been following your journey with {{company}} and really respect the community you're building.\n\nI put together a free guide specifically for coaches that breaks down how to transition from 1-on-1 coaching to a scalable group program without losing quality.\n\nWould it be helpful if I sent that over to you?\n\nThanks,\n{{sendingAccountFirstName}}" },
            { id: 'c3', name: 'Backend systems', subject: "Your backend systems", body: "Hi {{firstName}},\n\nI noticed your coaching business is growing fast. Usually, when coaches hit this inflection point, their fulfillment and onboarding start to break down.\n\nWe help 6-figure coaches build automated backend systems so they can reclaim 15 hours a week while scaling.\n\nIs freeing up your time a priority right now?\n\nBest,\n{{sendingAccountFirstName}}" },
            { id: 'c4', name: 'Podcast guesting', subject: "Guesting on podcasts", body: "Hey {{firstName}},\n\nYour message on [Topic] needs to be heard by more people. \n\nWe run a PR agency that specifically places coaches on top 1% podcasts in their niche to drive authority and inbound leads.\n\nAre you looking for more speaking opportunities this quarter?\n\nCheers,\n{{sendingAccountFirstName}}" },
            { id: 'c5', name: 'Offer restructuring', subject: "Your current offer", body: "Hi {{firstName}},\n\nI was looking at the services on your site. Most coaches undercharge because they sell their time rather than the transformation.\n\nWe recently helped [Coach Name] restructure their offer from $1k/mo to a $5k paid-in-full package, resulting in their biggest month ever.\n\nWould you be open to a 10-minute audit of your current offer structure?\n\nBest,\n{{sendingAccountFirstName}}" }
        ]
    },
]

export function TemplatesModal({ open, onOpenChange, onSelectTemplate }: TemplatesModalProps) {
    const [categories, setCategories] = useState(TEMPLATE_CATEGORIES)
    const [selectedCategory, setSelectedCategory] = useState<string>('custom')
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    const fetchTemplates = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/templates')
            if (res.ok) {
                const data = await res.json()
                // Map API data to UI structure
                const customTemplates = data.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    subject: t.subject,
                    body: t.body
                }))

                setCategories(prev => prev.map(cat => {
                    if (cat.id === 'custom') {
                        return { ...cat, count: customTemplates.length, templates: customTemplates }
                    }
                    return cat
                }))
                
                if (selectedCategory === 'custom' && customTemplates.length > 0) {
                    setSelectedTemplate(customTemplates[0])
                }
            }
        } catch (error) {
            console.error("Failed to load templates:", error)
        } finally {
            setLoading(false)
        }
    }

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
                            {categories.map(cat => (
                                <div key={cat.id}>
                                    <button
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg hover:bg-[#1a1a1a] transition-colors mb-1",
                                            selectedCategory === cat.id ? "text-white font-medium" : "text-gray-400"
                                        )}
                                        onClick={() => {
                                            setSelectedCategory(cat.id)
                                            if (cat.templates && cat.templates.length > 0) {
                                                setSelectedTemplate(cat.templates[0])
                                            } else {
                                                setSelectedTemplate(null)
                                            }
                                        }}
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
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                {loading ? "Loading templates..." : "Select a template to preview."}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
