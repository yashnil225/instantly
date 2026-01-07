import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await validateApiKey();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
    }

    try {
        // Verify ownership via campaign
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                campaign: {
                    userId: auth.user.id
                }
            }
        });

        if (!lead) {
            return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 });
        }

        await prisma.lead.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Lead deleted successfully" });
    } catch (error) {
        console.error("API DELETE /v2/leads/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
