export const promptsList = [
    {
        name: "instantly_draft_cold_email_sequence",
        description: "Generate a high-converting multi-step cold email outreach sequence tailored to your target audience",
        arguments: [
            {
                name: "targetAudience",
                description: "Target ICP / Audience (e.g. 'B2B SaaS Founders', 'Head of Sales at Series A startups')",
                required: true,
            },
            {
                name: "valueProposition",
                description: "Core offer or value proposition (e.g. 'Generate 20 qualified sales appointments/month')",
                required: true,
            },
            {
                name: "stepsCount",
                description: "Number of follow-up steps (typically 3-5)",
                required: false,
            },
        ],
    },
    {
        name: "instantly_analyze_campaign_performance",
        description: "Diagnose campaign open rates, reply rates, spam/bounce issues and receive actionable optimization steps",
        arguments: [
            {
                name: "campaignName",
                description: "Campaign Name or ID to analyze",
                required: true,
            },
        ],
    },
];
export function getPromptMessages(name, args) {
    if (name === "instantly_draft_cold_email_sequence") {
        const audience = args.targetAudience || "B2B Decision Makers";
        const valueProp = args.valueProposition || "Our unique solution";
        const steps = args.stepsCount || "4";
        return [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `You are an expert cold email copywriter for the Instantly outreach platform.
Draft a high-converting ${steps}-step cold email sequence targeting: "${audience}".
Value Proposition / Offer: "${valueProp}".

Key Instantly Best Practices to follow:
1. Step 1 (Initial Hook): Short subject line (<4 words, lowercase style), concise body (<75 words), clear problem statement, soft call-to-action (e.g., "Open to checking out a quick 2-min loom?").
2. Step 2 (Follow-up after 2 days): Contextual bump referencing Step 1 with a new angle or social proof.
3. Step 3 (Case Study / Value Add after 3 days): Share a relevant metric or customer snippet.
4. Step 4 (Breakup after 4 days): Professional, polite permission-based exit.

Use variables where appropriate: {{firstName}}, {{company}}, {{website}}.
Format output clearly with Step Number, Day Gap, Subject Line, and Body for each step.`,
                },
            },
        ];
    }
    if (name === "instantly_analyze_campaign_performance") {
        const campaign = args.campaignName || "Current Campaign";
        return [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please analyze the performance of campaign "${campaign}".
First, query the campaign details and analytics using \`instantly_get_campaign\` and \`instantly_get_campaign_analytics\`.
Then evaluate:
1. Open Rate Health (Target: 60%+ - if lower, inspect subject lines, SPF/DKIM/DMARC warmup scores).
2. Reply Rate & Positive Sentiment (Target: 5-15% - if lower, review value proposition and CTA friction).
3. Bounce Rate (Target: <2% - if higher, suggest lead list cleaning).
4. Sequence Timing & Day Gaps.

Provide specific, prioritized recommendations to optimize deliverability and lead conversions.`,
                },
            },
        ];
    }
    throw new Error(`Prompt with name ${name} not found`);
}
//# sourceMappingURL=index.js.map