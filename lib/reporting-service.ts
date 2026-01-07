import { prisma } from './prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIPerformanceReport(userId: string) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const campaigns = await prisma.campaign.findMany({
        where: { userId },
        select: {
            name: true,
            status: true,
            sentCount: true,
            openCount: true,
            clickCount: true,
            replyCount: true,
            bounceCount: true,
            _count: {
                select: { leads: true }
            }
        }
    });

    if (campaigns.length === 0) {
        return "You don't have any campaigns yet. Start by creating one!";
    }

    const statsContext = campaigns.map(c => `
Campaign: ${c.name}
Status: ${c.status}
Total Leads: ${c._count.leads}
Emails Sent: ${c.sentCount}
Opens: ${c.openCount}
Clicks: ${c.clickCount}
Replies: ${c.replyCount}
Bounces: ${c.bounceCount}
  `).join('\n---\n');

    const prompt = `
You are an expert sales analyst. Analyze the following cold email campaign stats for a user and provide a concise, helpful report.
Highlight what's working well, what needs improvement (e.g., high bounce rates, low open rates), and give 3 actionable tips.

STATS:
${statsContext}

Report Format:
- Summary of Overall Performance
- Campaign Highlights (Winning vs Struggling)
- 3 Recommendations for Improvement
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
