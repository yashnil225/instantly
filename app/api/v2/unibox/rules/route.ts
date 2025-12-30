import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/v2/unibox/rules
 * List auto-reply rules
 */
export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const rules = await prisma.autoReplyRule.findMany({
            where: { userId: auth.user.id },
            orderBy: { priority: "asc" }
        })

        return NextResponse.json({ data: rules })
    } catch (error) {
        console.error("API GET /v2/unibox/rules error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * POST /api/v2/unibox/rules
 * Create an auto-reply rule
 * Example: If email contains "meeting" → Auto-respond with Calendly link
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { name, trigger, triggerValue, action, actionValue, priority } = await req.json()

        if (!trigger || !action) {
            return NextResponse.json({
                error: "trigger and action are required",
                validTriggers: ["contains", "subject_contains", "from_domain"],
                validActions: ["auto_reply", "tag", "forward", "webhook"]
            }, { status: 400 })
        }

        const rule = await prisma.autoReplyRule.create({
            data: {
                name: name || `Rule ${Date.now()}`,
                trigger,       // "contains", "subject_contains", "from_domain"
                triggerValue,  // The keyword/domain to match
                action,        // "auto_reply", "tag", "forward", "webhook"
                actionValue,   // The reply text, tag name, email, or webhook URL
                priority: priority || 10,
                isActive: true,
                userId: auth.user.id
            }
        })

        return NextResponse.json({
            message: "Auto-reply rule created",
            rule
        }, { status: 201 })
    } catch (error) {
        console.error("API POST /v2/unibox/rules error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
