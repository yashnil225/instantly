import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { generateAIPerformanceReport } from "@/lib/reporting-service";

export async function GET(req: NextRequest) {
    const auth = await validateApiKey();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 });
    }

    try {
        const report = await generateAIPerformanceReport(auth.user.id);

        return NextResponse.json({
            status: "success",
            report: report
        });

    } catch (error: any) {
        console.error("AI Report Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
