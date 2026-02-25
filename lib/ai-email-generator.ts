import { GoogleGenerativeAI } from '@google/generative-ai'

function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');
    return new GoogleGenerativeAI(apiKey);
}

export async function generateEmailContent(params: {
    recipientName?: string
    companyName?: string
    industry?: string
    tone?: 'professional' | 'casual' | 'friendly'
    purpose?: string
    context?: string
}) {
    const { recipientName, companyName, industry, tone = 'professional', purpose, context } = params

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are an expert cold email copywriter. Generate a compelling cold email with the following details:

Recipient Name: ${recipientName || 'the recipient'}
Company: ${companyName || 'their company'}
Industry: ${industry || 'their industry'}
Tone: ${tone}
Purpose: ${purpose || 'introduce our services and start a conversation'}
Additional Context: ${context || 'None'}

Requirements:
- Keep it under 150 words
- Make it personalized and relevant
- Include a clear value proposition
- End with a simple, low-friction call-to-action
- Use variables like {{firstName}}, {{companyName}} where appropriate
- Make the subject line compelling (max 50 characters)

Format your response as JSON:
{
  "subject": "subject line here",
  "body": "email body here"
}

Only return the JSON, no additional text.`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return {
                subject: parsed.subject,
                body: parsed.body
            }
        }

        throw new Error('Failed to parse AI response')
    } catch (error) {
        console.error('AI generation error:', error)
        throw error
    }
}

export async function improveEmailContent(currentContent: string, instruction: string) {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are an expert email copywriter. Improve the following email based on this instruction: "${instruction}"

Current email:
${currentContent}

Return ONLY the improved email text, no explanations or additional commentary.`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text().trim()
    } catch (error) {
        console.error('AI improvement error:', error)
        throw error
    }
}

export async function generateVariants(emailContent: string, count: number = 3) {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Generate ${count} different variants of this email. Each should have a different angle or approach while maintaining the core message.

Original email:
${emailContent}

Return as JSON array:
[
  {"subject": "variant 1 subject", "body": "variant 1 body"},
  {"subject": "variant 2 subject", "body": "variant 2 body"},
  {"subject": "variant 3 subject", "body": "variant 3 body"}
]

Only return the JSON array, no additional text.`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }

        throw new Error('Failed to parse AI response')
    } catch (error) {
        console.error('AI variant generation error:', error)
        throw error
    }
}
