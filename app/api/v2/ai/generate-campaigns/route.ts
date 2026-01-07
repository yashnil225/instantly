import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { internalCreateCampaigns } from "@/lib/api-campaign-creator";

export async function POST(req: NextRequest) {
    const auth = await validateApiKey();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 });
    }

    try {
        const body = await req.json();
        const {
            clientName,
            clientDescription,
            targetAudience,
            socialProof,
            offers
        } = body;

        if (!clientName || !clientDescription) {
            return NextResponse.json(
                { error: "clientName and clientDescription are required" },
                { status: 400 }
            );
        }

        const campaigns = await internalCreateCampaigns({
            userId: auth.user.id,
            clientName,
            clientDescription,
            targetAudience,
            socialProof,
            offers
        });

        return NextResponse.json({
            status: "success",
            message: "3 Campaigns created successfully",
            data: campaigns.map(c => ({
                id: c.id,
                name: c.name,
                stepCount: c.sequences.length
            }))
        });

    } catch (error: any) {
        console.error("Bulk AI Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
