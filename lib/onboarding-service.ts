import { GoogleGenerativeAI } from "@google/generative-ai";
import { appendSheet } from "./google-sheets";

export async function automateOnboarding(params: {
    clientName: string,
    clientDescription: string,
    socialProof: string,
    campaignIds: string[]
}) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Analyze this company: ${params.clientName}
Description: ${params.clientDescription}
Social Proof: ${params.socialProof}

Create a Knowledge Base for AI Autoreply. 
Requirements:
1. Knowledge Base (Context/Talking points): Detailed paragraphs about what the company does, their unique value, and common questions.
2. Reply Examples (3 examples): Short, punchy, non-corporate examples of how they would reply to a warm lead.

Output JSON:
{
  "knowledgeBase": "...",
  "replyExamples": "..."
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = JSON.parse(response.text().replace(/```json|```/g, '').trim());

    // Update the Google Sheet for each campaign
    const spreadsheetId = '1QS7MYDm6RUTzzTWoMfX-0G9NzT5EoE2KiCE7iR1DBLM';
    const rows = params.campaignIds.map(id => [
        id,
        params.clientName,
        data.knowledgeBase,
        data.replyExamples
    ]);

    await appendSheet(spreadsheetId, 'Sheet1!A:D', rows);

    return data;
}
