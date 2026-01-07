import { GoogleGenerativeAI } from "@google/generative-ai";
import { instantlyCreateCampaign } from "./instantly-api";

export async function createInstantlyCampaigns(params: {
    clientName: string,
    clientDescription: string,
    targetAudience: string,
    socialProof: string,
    offers?: string[],
    apiKey: string,
    dryRun?: boolean
}) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Generate 3 cold email campaigns for Instantly.ai.
Client: ${params.clientName}
Description: ${params.clientDescription}
Audience: ${params.targetAudience}
Social Proof: ${params.socialProof}
Offers: ${params.offers?.join(', ') || 'Auto-generate 3 compelling offers'}

Requirements for EACH campaign:
- 3 Email Steps.
- Step 1: 2 A/B variants (meaningfully different).
- Step 2-3: 1 variant each (follow-up and breakup).
- Use variables: {{firstName}}, {{lastName}}, {{companyName}}, {{icebreaker}}, {{sendingAccountFirstName}}.
- Format: HTML with <p> and <br>. No <html>, <body>, <head>.

Output JSON format:
[
  {
    "name": "Campaign Name",
    "sequences": [{
      "steps": [
        {
          "type": "email",
          "delay": 0,
          "variants": [{"subject": "...", "body": "..."}, {"subject": "...", "body": "..."}]
        },
        ...
      ]
    }]
  },
  ...
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const campaignsText = response.text().replace(/```json|```/g, '').trim();
    const campaigns = JSON.parse(campaignsText);

    const results = [];

    for (const campaignData of campaigns) {
        const payload = {
            ...campaignData,
            campaign_schedule: {
                start_date: new Date().toISOString().split('T')[0],
                end_date: "2030-12-31",
                schedules: [{
                    name: "Weekday Schedule",
                    days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
                    timing: { from: "09:00", to: "17:00" },
                    timezone: "America/Chicago"
                }]
            },
            email_gap: 10,
            daily_limit: 50,
            stop_on_reply: true,
            stop_on_auto_reply: true,
            link_tracking: true,
            open_tracking: true
        };

        if (params.dryRun) {
            console.log('Dry Run - Campaign Payload:', JSON.stringify(payload, null, 2));
            results.push({ name: payload.name, status: 'dry_run' });
        } else {
            const result = await instantlyCreateCampaign(params.apiKey, payload);
            results.push({ name: payload.name, status: 'created', id: result.id });
        }
    }

    return results;
}
