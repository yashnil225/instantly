/**
 * Email Templates Library
 * Pre-built templates for common cold email scenarios
 */

export interface EmailTemplate {
    id: string
    name: string
    category: TemplateCategory
    subject: string
    body: string
    description: string
    tags: string[]
    variables: string[] // Available placeholders
    stats?: {
        openRate?: number
        replyRate?: number
        uses?: number
    }
}

export type TemplateCategory =
    | "sales"
    | "follow-up"
    | "introduction"
    | "partnership"
    | "networking"
    | "recruitment"
    | "event"
    | "product-launch"
    | "feedback"
    | "re-engagement"

export const EMAIL_TEMPLATES: EmailTemplate[] = [
    // SALES TEMPLATES
    {
        id: "sales-1",
        name: "Value Proposition Opener",
        category: "sales",
        subject: "{{firstName}}, quick idea for {{company}}",
        body: `Hi {{firstName}},

I noticed {{company}} has been {{observation}}. That's impressive!

We've helped similar companies in {{industry}} achieve {{result}} by {{solution}}.

Would you be open to a quick 15-minute call to see if we could help {{company}} do the same?

Best,
{{senderName}}`,
        description: "Lead with a specific observation and value prop",
        tags: ["b2b", "saas", "value-focused"],
        variables: ["firstName", "company", "observation", "industry", "result", "solution", "senderName"],
        stats: { openRate: 42, replyRate: 8 }
    },
    {
        id: "sales-2",
        name: "Pain Point Focus",
        category: "sales",
        subject: "Struggling with {{painPoint}}?",
        body: `Hi {{firstName}},

Many {{role}}s I speak with are frustrated by {{painPoint}}.

{{company}} has been solving this for companies like {{referenceCompany}} by {{solution}}.

The result? {{benefit}}.

Worth a quick chat to see if this could work for {{company}}?

Cheers,
{{senderName}}`,
        description: "Address a common pain point directly",
        tags: ["problem-solution", "empathy"],
        variables: ["firstName", "role", "painPoint", "company", "referenceCompany", "solution", "benefit", "senderName"],
        stats: { openRate: 38, replyRate: 6 }
    },
    {
        id: "sales-3",
        name: "Social Proof Lead",
        category: "sales",
        subject: "How {{referenceCompany}} increased {{metric}} by {{percentage}}%",
        body: `Hi {{firstName}},

Just helped {{referenceCompany}} increase their {{metric}} by {{percentage}}% in just {{timeframe}}.

Given {{company}}'s focus on {{focus}}, I thought the approach might resonate.

Happy to share the strategy if you're curious.

Best,
{{senderName}}`,
        description: "Lead with a strong case study",
        tags: ["social-proof", "results-focused"],
        variables: ["firstName", "referenceCompany", "metric", "percentage", "timeframe", "company", "focus", "senderName"],
        stats: { openRate: 45, replyRate: 9 }
    },

    // FOLLOW-UP TEMPLATES
    {
        id: "followup-1",
        name: "Gentle Nudge",
        category: "follow-up",
        subject: "Re: {{originalSubject}}",
        body: `Hi {{firstName}},

Just bumping this up in case it got buried. I know how busy things can get!

Would love to connect if you have 15 minutes this week.

Best,
{{senderName}}`,
        description: "Light follow-up without being pushy",
        tags: ["second-touch", "friendly"],
        variables: ["firstName", "originalSubject", "senderName"],
        stats: { openRate: 35, replyRate: 5 }
    },
    {
        id: "followup-2",
        name: "Value Add Follow-up",
        category: "follow-up",
        subject: "Thought you'd find this useful, {{firstName}}",
        body: `Hi {{firstName}},

Following up on my previous email. In the meantime, I put together {{resource}} that I thought might be helpful for {{company}}.

{{resourceLink}}

Let me know if you'd like to discuss how this applies to your situation.

Best,
{{senderName}}`,
        description: "Add value with each follow-up",
        tags: ["value-add", "content-sharing"],
        variables: ["firstName", "resource", "company", "resourceLink", "senderName"],
        stats: { openRate: 40, replyRate: 7 }
    },
    {
        id: "followup-3",
        name: "Breakup Email",
        category: "follow-up",
        subject: "Should I close your file?",
        body: `Hi {{firstName}},

I've reached out a few times but haven't heard back. I completely understand if the timing isn't right.

If now's not a good time, just let me know and I'll stop reaching out. No hard feelings!

But if {{painPoint}} is still a priority, I'd love to help.

Either way, wishing you and {{company}} all the best.

{{senderName}}`,
        description: "Final follow-up that often gets replies",
        tags: ["breakup", "last-chance"],
        variables: ["firstName", "painPoint", "company", "senderName"],
        stats: { openRate: 50, replyRate: 12 }
    },

    // INTRODUCTION TEMPLATES
    {
        id: "intro-1",
        name: "Mutual Connection",
        category: "introduction",
        subject: "{{mutualContact}} suggested I reach out",
        body: `Hi {{firstName}},

{{mutualContact}} mentioned you'd be a great person to connect with regarding {{topic}}.

I'm {{senderRole}} at {{senderCompany}}, and we've been {{achievement}}.

Would love to learn more about what {{company}} is working on and see if there's potential synergy.

Open to a quick call this week?

Best,
{{senderName}}`,
        description: "Leverage a mutual connection",
        tags: ["warm-intro", "referral"],
        variables: ["mutualContact", "firstName", "topic", "senderRole", "senderCompany", "achievement", "company", "senderName"],
        stats: { openRate: 55, replyRate: 15 }
    },
    {
        id: "intro-2",
        name: "Content Mention",
        category: "introduction",
        subject: "Loved your {{contentType}} on {{topic}}",
        body: `Hi {{firstName}},

Just read your {{contentType}} on {{topic}} - really insightful, especially the part about {{specificPoint}}.

It got me thinking about {{connection}} which is something we've been exploring at {{senderCompany}}.

Would love to pick your brain if you have a few minutes.

Best,
{{senderName}}`,
        description: "Open by referencing their content",
        tags: ["personalized", "content-based"],
        variables: ["firstName", "contentType", "topic", "specificPoint", "connection", "senderCompany", "senderName"],
        stats: { openRate: 48, replyRate: 11 }
    },

    // PARTNERSHIP TEMPLATES
    {
        id: "partner-1",
        name: "Strategic Partnership",
        category: "partnership",
        subject: "Partnership idea: {{company}} x {{senderCompany}}",
        body: `Hi {{firstName}},

I've been following {{company}}'s work in {{space}} - really impressive growth!

At {{senderCompany}}, we {{description}}, and I see a potential synergy that could benefit both our audiences.

Specifically, I'm thinking {{partnershipIdea}}.

Worth a conversation to explore?

Best,
{{senderName}}`,
        description: "Propose a strategic partnership",
        tags: ["partnership", "b2b", "growth"],
        variables: ["firstName", "company", "senderCompany", "space", "description", "partnershipIdea", "senderName"],
        stats: { openRate: 42, replyRate: 8 }
    },

    // NETWORKING TEMPLATES
    {
        id: "network-1",
        name: "Industry Expert Connect",
        category: "networking",
        subject: "Fellow {{industry}} person reaching out",
        body: `Hi {{firstName}},

I've been in {{industry}} for {{years}} years and have been impressed by your work at {{company}}.

I'm currently focused on {{focus}} and would love to get your perspective on {{question}}.

No ask here - just genuinely curious to learn from your experience.

Would you be open to a 15-minute chat?

Best,
{{senderName}}`,
        description: "Connect with industry peers",
        tags: ["networking", "learning", "no-pitch"],
        variables: ["firstName", "industry", "years", "company", "focus", "question", "senderName"],
        stats: { openRate: 38, replyRate: 10 }
    },

    // RECRUITMENT TEMPLATES
    {
        id: "recruit-1",
        name: "Talent Outreach",
        category: "recruitment",
        subject: "{{firstName}}, exciting opportunity at {{senderCompany}}",
        body: `Hi {{firstName}},

Your background in {{skill}} caught my attention. We're building something exciting at {{senderCompany}} and looking for people with your expertise.

The role: {{roleTitle}}
Why it's unique: {{uniqueValue}}

If you're open to exploring, I'd love to share more details.

Best,
{{senderName}}
{{senderTitle}} at {{senderCompany}}`,
        description: "Reach out to potential candidates",
        tags: ["recruiting", "talent", "hiring"],
        variables: ["firstName", "skill", "senderCompany", "roleTitle", "uniqueValue", "senderName", "senderTitle"],
        stats: { openRate: 52, replyRate: 14 }
    },

    // RE-ENGAGEMENT TEMPLATES
    {
        id: "reengage-1",
        name: "We Miss You",
        category: "re-engagement",
        subject: "{{firstName}}, it's been a while",
        body: `Hi {{firstName}},

It's been a few months since we last connected, and I wanted to check in.

A lot has changed at {{senderCompany}} - we've added {{newFeature}} which I think could help with {{benefit}}.

Would love to reconnect and see how things are going at {{company}}.

Best,
{{senderName}}`,
        description: "Re-engage cold leads",
        tags: ["re-engagement", "nurture", "win-back"],
        variables: ["firstName", "senderCompany", "newFeature", "benefit", "company", "senderName"],
        stats: { openRate: 35, replyRate: 6 }
    }
]

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): EmailTemplate[] {
    return EMAIL_TEMPLATES.filter(t => t.category === category)
}

/**
 * Get all categories with counts
 */
export function getTemplateCategories(): { category: TemplateCategory; count: number }[] {
    const counts: Record<string, number> = {}
    EMAIL_TEMPLATES.forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + 1
    })
    return Object.entries(counts).map(([category, count]) => ({
        category: category as TemplateCategory,
        count
    }))
}

/**
 * Search templates
 */
export function searchTemplates(query: string): EmailTemplate[] {
    const lower = query.toLowerCase()
    return EMAIL_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.tags.some(tag => tag.includes(lower))
    )
}

/**
 * Fill template variables
 */
export function fillTemplate(template: EmailTemplate, values: Record<string, string>): {
    subject: string
    body: string
} {
    let subject = template.subject
    let body = template.body

    for (const [key, value] of Object.entries(values)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        subject = subject.replace(regex, value)
        body = body.replace(regex, value)
    }

    return { subject, body }
}
