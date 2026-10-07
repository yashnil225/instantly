import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const campaignId = 'cmstulkic0000w2upph3jd7dd';
    const campaignRes = await client.execute(`SELECT * FROM Campaign WHERE id = '${campaignId}'`);
    const campaign = campaignRes.rows[0];

    const seqsRes = await client.execute(`SELECT * FROM Sequence WHERE campaignId = '${campaignId}' ORDER BY stepNumber ASC`);
    const sequences = seqsRes.rows;

    const variantsRes = await client.execute(`SELECT * FROM SequenceVariant WHERE sequenceId IN (${sequences.map(s => `'${s.id}'`).join(',')})`);
    const variants = variantsRes.rows;

    for (const s of sequences) {
        s.variants = variants.filter(v => v.sequenceId === s.id);
    }

    const eventsRes = await client.execute(`SELECT * FROM SendingEvent WHERE campaignId = '${campaignId}' ORDER BY createdAt ASC`);
    const allEvents = eventsRes.rows;

    console.log(`Loaded ${allEvents.length} events, ${sequences.length} sequences`);

    // Let's test the enriched events logic
    const enrichedEvents = allEvents.map((e) => {
        let step = null;
        let variantId = null;
        let originalEventId = null;

        try {
            const meta = JSON.parse(e.metadata || '{}');
            if (e.type === 'sent') {
                step = meta.step;
                variantId = meta.variantId;
            } else {
                originalEventId = meta.originalEventId;
            }
        } catch {}

        if (e.type !== 'sent') {
            let parentSent = null;
            if (originalEventId) {
                parentSent = allEvents.find((se) => se.id === originalEventId);
            }
            if (!parentSent) {
                const previousSents = allEvents.filter((se) =>
                    se.type === 'sent' &&
                    se.leadId === e.leadId &&
                    new Date(se.createdAt).getTime() <= new Date(e.createdAt).getTime()
                );
                if (previousSents.length > 0) {
                    previousSents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    parentSent = previousSents[0];
                }
            }

            if (parentSent) {
                try {
                    const meta = JSON.parse(parentSent.metadata || '{}');
                    step = meta.step;
                    variantId = meta.variantId;
                } catch {}
            }
        }

        return { ...e, enrichedStep: step, enrichedVariantId: variantId };
    });

    const stepAnalytics = sequences.map((seq) => {
        const stepEvents = enrichedEvents.filter((e) => e.enrichedStep === seq.stepNumber);

        const variantsStats = (seq.variants || []).map((v, vIdx) => {
            const variantEvents = stepEvents.filter((e) => e.enrichedVariantId === v.id);
            const sent = variantEvents.filter((e) => e.type === 'sent').length;
            const opened = new Set(variantEvents.filter((e) => e.type === 'open').map((e) => e.leadId)).size;
            const replied = new Set(variantEvents.filter((e) => e.type === 'reply').map((e) => e.leadId)).size;
            const clicked = new Set(variantEvents.filter((e) => e.type === 'click').map((e) => e.leadId)).size;

            return {
                id: v.id,
                label: v.label || String.fromCharCode(65 + vIdx),
                subject: v.subject,
                sent,
                opened,
                replied,
                clicked
            };
        });

        const sent = stepEvents.filter((e) => e.type === 'sent').length;
        const opened = new Set(stepEvents.filter((e) => e.type === 'open').map((e) => e.leadId)).size;
        const replied = new Set(stepEvents.filter((e) => e.type === 'reply').map((e) => e.leadId)).size;
        const clicked = new Set(stepEvents.filter((e) => e.type === 'click').map((e) => e.leadId)).size;

        return {
            stepId: seq.id,
            stepNumber: seq.stepNumber,
            step: `Step ${seq.stepNumber}: ${seq.subject || 'Email'}`,
            sent,
            opened,
            replied,
            clicked,
            variants: variantsStats
        };
    });

    console.log("Calculated Step Analytics:", JSON.stringify(stepAnalytics, null, 2));
}

run().catch(console.error);
