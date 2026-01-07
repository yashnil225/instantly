import { createInstantlyCampaigns } from "../lib/campaign-creator";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run") || args.includes("--dry_run");

    const params = {
        clientName: "My Cool Client",
        clientDescription: "A leading provider of high-tech solutions for dentists.",
        targetAudience: "Dental Clinics in North America",
        socialProof: "Helped 500+ clinics automate their booking process.",
        offers: [
            "Free 30-minute booking audit",
            "50% off first 3 months",
            "Buy 1 get 1 free license"
        ],
        apiKey: process.env.INSTANTLY_API_KEY!,
        dryRun
    };

    console.log(`Starting campaign creation... ${dryRun ? '(DRY RUN)' : ''}`);

    try {
        const results = await createInstantlyCampaigns(params);
        console.log('Results:', results);
    } catch (error) {
        console.error('Failed to create campaigns:', error);
    }
}

main();
