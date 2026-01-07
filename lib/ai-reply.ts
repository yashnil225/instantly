import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateReply(params: {
    knowledgeBase: string,
    replyExamples: string,
    incomingReply: string,
    senderName: string,
    senderCompany: string,
    eaccountFirstName: string
}) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Step 1: Generate Prompt
    const prompt = `
Role: You are ${params.eaccountFirstName}. You are replying to an email from ${params.senderName} at ${params.senderCompany}.

Campaign Knowledge Base:
${params.knowledgeBase}

Example Replies (Tone Match):
${params.replyExamples}

Incoming Reply:
${params.incomingReply}

Rules:
1. Write in the first person ('I', 'we').
2. Concise, confident, friendly, non-corporate, outcome-focused.
3. 3-8 sentences unless thread requires more.
4. No em dashes (—), no over-explaining, no hype, no filler.
5. If followup: be light but persistent, illustrate value props.
6. If the email is explicitly negative (UNSUBSCRIBE, STOP, etc.), or for logistics already done, return "EMPTY".
7. Use HTML with <br> for line breaks, <br><br> between paragraphs.
8. No <html>, <body>, <p> tags.
9. Sign off with your first name (${params.eaccountFirstName}).

Output only the email body or "EMPTY".
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return text === "EMPTY" ? "" : text;
}
