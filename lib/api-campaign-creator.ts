import { prisma } from './prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function internalCreateCampaigns(params: {
    userId: string,
    clientName: string,
    clientDescription: string,
    targetAudience: string,
    socialProof: string,
    offers?: string[]
}) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Generate 3 cold email campaigns for an Instantly Clone software.
Client: ${params.clientName}
Description: ${params.clientDescription}
Audience: ${params.targetAudience}
Social Proof: ${params.socialProof}
Offers: ${params.offers?.join(', ') || 'Auto-generate 3 compelling offers'}

Requirements for EACH campaign:
- 3 Email Steps.
- Step 1: 2 A/B variants.
- Step 2-3: 1 variant each.
- Use variables: {{firstName}}, {{companyName}}, {{icebreaker}}.
- Format: HTML with <p> and <br>. No <html>, <body>, <head>.

Output JSON format:
[
  {
    "name": "Campaign Name",
    "steps": [
      {
        "stepNumber": 1,
        "dayGap": 0,
        "variants": [{"subject": "...", "body": "..."}, {"subject": "...", "body": "..."}]
      },
      ...
    ]
  },
  ...
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const campaignsText = response.text().replace(/```json|```/g, '').trim();
    const campaigns = JSON.parse(campaignsText);

    const createdCampaigns = [];

    for (const campaignData of campaigns) {
        const campaign = await prisma.campaign.create({
            data: {
                name: campaignData.name,
                userId: params.userId,
                status: 'draft',
                trackOpens: true,
                trackLinks: true,
                stopOnReply: true,
                startTime: "09:00",
                endTime: "17:00",
                timezone: "America/Chicago",
                days: "Mon,Tue,Wed,Thu,Fri",
                sequences: {
                    create: campaignData.steps.map((step: any) => ({
                        stepNumber: step.stepNumber,
                        dayGap: step.dayGap,
                        variants: {
                            create: step.variants.map((variant: any) => ({
                                subject: variant.subject,
                                body: variant.body,
                                weight: 50
                            }))
                        }
                    }))
                }
            },
            include: {
                sequences: {
                    include: { variants: true }
                }
            }
        });
        createdCampaigns.push(campaign);
    }

    return createdCampaigns;
}
