import { prisma } from "./prisma"

export type WebhookEvent = "lead.replied" | "campaign.finished" | "lead.added" | "campaign.launched" | "campaign.paused"

export async function dispatchWebhook(userId: string, event: WebhookEvent, payload: any) {
    try {
        const webhooks = await prisma.webhook.findMany({
            where: {
                userId,
                isActive: true
            }
        })

        for (const webhook of webhooks) {
            let subscribedEvents: string[] = []
            try {
                subscribedEvents = JSON.parse(webhook.events)
            } catch (e) {
                subscribedEvents = [webhook.events]
            }

            const isSubscribed = subscribedEvents.includes("*") || subscribedEvents.includes(event)

            if (isSubscribed) {
                console.log(`[Webhook] Dispatching ${event} to ${webhook.url}`)

                const startTime = Date.now()

                // Fire and forget (don't block the main worker)
                fetch(webhook.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Instantly-Event": event,
                        "X-Instantly-Webhook-Id": webhook.id
                    },
                    body: JSON.stringify({
                        event,
                        webhookId: webhook.id,
                        timestamp: new Date().toISOString(),
                        data: payload
                    })
                }).then(async (res) => {
                    const duration = Date.now() - startTime
                    await prisma.webhookLog.create({
                        data: {
                            webhookId: webhook.id,
                            event,
                            payload: JSON.stringify(payload),
                            status: res.status,
                            isSuccess: res.ok,
                            duration
                        }
                    })
                }).catch(async (err) => {
                    const duration = Date.now() - startTime
                    await prisma.webhookLog.create({
                        data: {
                            webhookId: webhook.id,
                            event,
                            payload: JSON.stringify(payload),
                            status: 0,
                            response: err.message,
                            isSuccess: false,
                            duration
                        }
                    })
                    console.error(`[Webhook] Failed to send to ${webhook.url}:`, err.message)
                })
            }
        }
    } catch (error) {
        console.error("[Webhook] Dispatch error:", error)
    }
}
