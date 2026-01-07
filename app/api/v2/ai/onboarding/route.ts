import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { automateOnboarding } from "@/lib/onboarding-service";

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
            socialProof,
            campaignIds
        } = body;

        if (!clientName || !clientDescription || !campaignIds || !Array.isArray(campaignIds)) {
            return NextResponse.json(
                { error: "clientName, clientDescription, and campaignIds (array) are required" },
                { status: 400 }
            );
        }

        const onboardingData = await automateOnboarding({
            clientName,
            clientDescription,
            socialProof: socialProof || "",
            campaignIds
        });

        return NextResponse.json({
            status: "success",
            message: "Onboarding completed and Knowledge Base updated",
            data: onboardingData
        });

    } catch (error: any) {
        console.error("Onboarding Automation Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
