import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

interface RouteContext {
    params: Promise<{ id: string }>
}

/**
 * PATCH /api/v2/leads/[id]/variables
 * Update custom variables for a lead
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { id } = await context.params

    try {
        // Verify lead ownership
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                campaign: { userId: auth.user.id }
            }
        })

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        const newVariables = await req.json()

        // Merge with existing custom fields
        const existingFields = lead.customFields ? JSON.parse(lead.customFields) : {}
        const mergedFields = { ...existingFields, ...newVariables }

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: { customFields: JSON.stringify(mergedFields) }
        })

        return NextResponse.json({
            message: "Custom variables updated",
            customFields: mergedFields
        })
    } catch (error) {
        console.error("API PATCH /v2/leads/[id]/variables error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * GET /api/v2/leads/[id]/variables
 * Get custom variables for a lead
 */
export async function GET(req: NextRequest, context: RouteContext) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { id } = await context.params

    try {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                campaign: { userId: auth.user.id }
            },
            select: {
                id: true,
                email: true,
                customFields: true
            }
        })

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        return NextResponse.json({
            leadId: id,
            email: lead.email,
            customFields: lead.customFields ? JSON.parse(lead.customFields) : {}
        })
    } catch (error) {
        console.error("API GET /v2/leads/[id]/variables error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
